#!/usr/bin/env python3
"""Drive one image-generation CLI and return only verified facts.

Emits a single JSON object on stdout:
  {engine, out, reported, actual, matched, format, seconds}

`actual` is read from the file's own header, never from what the agent said.
`matched` is false whenever the two disagree — that is information, not an
error, because no engine on this path honours a requested size.
"""
from __future__ import annotations

import argparse
import json
import shutil
import struct
import subprocess
import sys
import tempfile
import time
from pathlib import Path

SCHEMA = {
    "type": "object",
    "properties": {"path": {"type": "string"},
                   "width": {"type": "integer"},
                   "height": {"type": "integer"}},
    "required": ["path", "width", "height"],
    "additionalProperties": False,
}


class GenerationError(RuntimeError):
    pass


def read_dimensions(path: Path) -> tuple[str, int, int]:
    head = path.open("rb").read(2)
    if head == b"\x89P":
        raw = path.open("rb").read(24)
        width, height = struct.unpack(">II", raw[16:24])
        return "png", width, height
    if head == b"\xff\xd8":
        with path.open("rb") as handle:
            handle.read(2)
            while True:
                marker = handle.read(2)
                if len(marker) < 2 or marker[0] != 0xFF:
                    raise GenerationError(f"not a readable JPEG: {path}")
                size = struct.unpack(">H", handle.read(2))[0]
                if 0xC0 <= marker[1] <= 0xCF and marker[1] not in (0xC4, 0xC8, 0xCC):
                    body = handle.read(5)
                    height, width = struct.unpack(">HH", body[1:5])
                    return "jpeg", width, height
                handle.seek(size - 2, 1)
    raise GenerationError(f"unrecognised image format: {path}")


def run_codex(prompt: str, schema_file: Path, tmp: Path, timeout: int,
              refs: list[Path] | None = None) -> dict:
    prompt_file = tmp / "prompt.txt"
    prompt_file.write_text(prompt, encoding="utf-8")
    out_file = tmp / "out.json"
    cmd = ["codex", "exec", "--sandbox", "read-only", "--skip-git-repo-check"]
    # `-i` attaches images to the initial prompt. This is the reference path on
    # codex; the "can it edit a file on disk" question is a different one and
    # still unmeasured.
    for ref in refs or []:
        cmd += ["-i", str(ref)]
    cmd += ["--output-schema", str(schema_file), "-o", str(out_file), "-"]
    with prompt_file.open() as stdin:
        proc = subprocess.run(cmd, stdin=stdin, capture_output=True,
                              text=True, timeout=timeout)
    if proc.returncode != 0 or not out_file.exists():
        raise GenerationError(f"codex exited {proc.returncode}: {proc.stderr[-400:]}")
    return json.loads(out_file.read_text(encoding="utf-8"))


def run_agy(prompt: str, schema_file: Path, ref_dir: Path | None,
            timeout: int, refs: list[Path] | None = None) -> dict:
    cmd = ["agy", "--dangerously-skip-permissions"]
    # agy takes a directory, not files: it needs the reference in its workspace
    # and then reads it by path from the prompt.
    for d in {r.parent.resolve() for r in refs or []}:
        cmd += ["--add-dir", str(d)]
    if ref_dir:
        cmd += ["--add-dir", str(ref_dir)]
    cmd += ["--output-format", "json", "--json-schema", str(schema_file),
            "--print", prompt]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if proc.returncode != 0:
        raise GenerationError(f"agy exited {proc.returncode}: {proc.stderr[-400:]}")
    payload = json.loads(proc.stdout)
    result = payload.get("structured_output")
    if not result:
        raise GenerationError("agy returned no structured_output")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine", choices=("codex", "agy"), default="agy",
                        help="default agy: it is the verified route for holding "
                             "a subject across calls")
    parser.add_argument("--prompt")
    parser.add_argument("--prompt-file", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--ref-dir", type=Path,
                        help="agy only: a whole directory of reference images")
    parser.add_argument("--ref", type=Path, action="append", default=[],
                        help="reference image to carry the subject forward; "
                             "repeatable. Works on both engines — codex "
                             "attaches it with -i, agy adds its directory to "
                             "the workspace and is told the path in the prompt")
    parser.add_argument("--timeout", type=int, default=300)
    args = parser.parse_args()

    if not (args.prompt or args.prompt_file):
        parser.error("one of --prompt or --prompt-file is required")
    prompt = args.prompt or args.prompt_file.read_text(encoding="utf-8")

    if shutil.which(args.engine) is None:
        print(json.dumps({"error": f"{args.engine} is not on PATH"}))
        return 3

    started = time.monotonic()
    with tempfile.TemporaryDirectory() as raw_tmp:
        tmp = Path(raw_tmp)
        schema_file = tmp / "schema.json"
        schema_file.write_text(json.dumps(SCHEMA), encoding="utf-8")
        try:
            if args.engine == "codex":
                reported = run_codex(prompt, schema_file, tmp, args.timeout,
                                     args.ref)
            else:
                reported = run_agy(prompt, schema_file, args.ref_dir,
                                   args.timeout, args.ref)
        except (GenerationError, subprocess.SubprocessError,
                json.JSONDecodeError, OSError) as exc:
            print(json.dumps({"error": f"{type(exc).__name__}: {exc}"}))
            return 1

    # is_file(), not exists(): an engine that returns "." or a directory passes
    # exists() and then dies inside copy2 with an unhandled IsADirectoryError
    # and a raw traceback, which is exactly the silent-failure shape this
    # script exists to prevent. Observed on agy, twice in one batch.
    origin = Path(reported.get("path") or "")
    if not origin.is_file():
        print(json.dumps({"error":
            f"engine reported a path that is not a file: {origin}"}))
        return 1

    try:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(origin, args.out)
        fmt, width, height = read_dimensions(args.out)
    except (OSError, GenerationError) as exc:
        print(json.dumps({"error": f"{type(exc).__name__}: {exc}"}))
        return 1

    print(json.dumps({
        "engine": args.engine,
        "out": str(args.out),
        "reported": {"width": reported.get("width"), "height": reported.get("height")},
        "actual": {"width": width, "height": height},
        "matched": (width, height) == (reported.get("width"), reported.get("height")),
        "format": fmt,
        "seconds": round(time.monotonic() - started, 1),
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
