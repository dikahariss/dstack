#!/usr/bin/env python3
"""Check PlantUML use case and sequence models, and their renders.

PlantUML exits 0 on a syntax error and still writes a plausible SVG: a broken
file measured at 1,963 bytes containing the text "A A". Exit code proves
nothing, so the render is verified by round-tripping every declared name
through the SVG's text content.

    python3 check_uml.py <file.puml|dir> [...]

Each .puml is checked, and any .svg with the same stem beside it is
round-tripped. Files are classified by content: sequence if they carry
messages, use case otherwise. Exit 0 clean, 1 findings, 2 unreadable.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

DECL = re.compile(
    r'^\s*(actor|participant|usecase|database|boundary|control|entity|collections|queue)\b'
    r'\s*(?:"([^"]+)"|(\(?[^\s"]+\)?))?\s*(?:as\s+(\S+))?',
    re.IGNORECASE,
)
MESSAGE = re.compile(r'^\s*("?[^"\->\s][^"\->]*"?)\s*(?:-+>+|<-+|-+\\|-+/)\s*("?[^"\s:]+"?)\s*(?::|$)')
USECASE_INLINE = re.compile(r'\(([^)]+)\)|usecase\s+"([^"]+)"', re.IGNORECASE)
ASSOC = re.compile(r'^\s*(\S+|"[^"]+")\s*(?:-+\.?-*>+|<-*\.?-+|-+)\s*(\S+|"[^"]+")')
BOUNDARY_OPEN = re.compile(r'^\s*(rectangle|package|folder|node)\b.*\{\s*$', re.IGNORECASE)
FRAGMENT_OPEN = re.compile(r'^\s*(alt|opt|loop|par|break|critical|group|ref over)\b', re.IGNORECASE)
FRAGMENT_ELSE = re.compile(r'^\s*else\b', re.IGNORECASE)
FRAGMENT_END = re.compile(r'^\s*end\s*$', re.IGNORECASE)
DANGLING_ARROW = re.compile(r'(?:-+>+|<-+|-+\\|-+/)\s*$')
MSG_LABEL = re.compile(r'^\s*[^:]*?(?:-+>+|<-+|-+\\|-+/)[^:]*:\s*(\S.*?)\s*$')
PLAIN_LABEL = re.compile(r"^[\w][\w \-().,'/=]*$")
ACTIVATE = re.compile(r'^\s*activate\b', re.IGNORECASE)
DEACTIVATE = re.compile(r'^\s*(deactivate|destroy)\b', re.IGNORECASE)
SKIP = re.compile(
    r'^\s*(@start|@end|!|\'|title\b|header\b|footer\b|legend\b|skinparam\b|autonumber\b|'
    r'hide\b|show\b|left to right\b|top to bottom\b|scale\b|note\b|end note\b|caption\b)',
    re.IGNORECASE,
)


class Finding:
    def __init__(self, path: Path, line: int, code: str, message: str) -> None:
        self.path, self.line, self.code, self.message = path, line, code, message

    def __str__(self) -> str:
        where = f"{self.path.name}:{self.line}" if self.line else self.path.name
        return f"  {where:<34} {self.code:<10} {self.message}"


def unquote(text: str | None) -> str:
    if not text:
        return ""
    return text.strip().strip('"').strip("()").strip()


def declared_names(lines: list[str]) -> dict[str, int]:
    """Declared lifelines and actors -> the line they were declared on.

    The alias is what messages reference; the label is what the render shows,
    so both are kept.
    """
    names: dict[str, int] = {}
    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw):
            continue
        match = DECL.match(raw)
        if not match:
            continue
        label = unquote(match.group(2) or match.group(3))
        alias = unquote(match.group(4))
        for name in (label, alias):
            if name:
                names.setdefault(name, i)
    return names


def declared_labels(lines: list[str]) -> dict[str, int]:
    """Only the names the render actually draws.

    An `as` alias is a source-level handle and never appears in the SVG, so
    round-tripping aliases would fail on every correct diagram.
    """
    labels: dict[str, int] = {}
    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw):
            continue
        match = DECL.match(raw)
        if not match:
            continue
        visible = unquote(match.group(2) or match.group(3)) or unquote(match.group(4))
        if visible:
            labels.setdefault(visible, i)
    return labels


def declared_actors(lines: list[str]) -> list[tuple[set[str], str, int]]:
    """`actor` declarations as (all names, display name, line).

    An actor has up to two names — the label and the `as` alias — and the rest
    of the file references either. They are one identity; splitting them makes
    a labelled actor read as two.
    """
    actors: list[tuple[set[str], str, int]] = []
    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw) or not raw.strip().lower().startswith("actor"):
            continue
        match = DECL.match(raw)
        if not match:
            continue
        label = unquote(match.group(2) or match.group(3))
        alias = unquote(match.group(4))
        identity = {n for n in (label, alias) if n}
        if identity:
            actors.append((identity, label or alias, i))
    return actors


def is_use_case(lines: list[str]) -> bool:
    """A use case model declares `usecase` or a boundary; a sequence does not.

    Association lines (`app --> UC1`) parse as messages, so message shape alone
    cannot tell the two apart — the declaration keywords can.
    """
    return any(
        re.match(r"\s*usecase\b", raw, re.IGNORECASE) or BOUNDARY_OPEN.match(raw) for raw in lines
    )


def check_sequence(path: Path, lines: list[str], names: dict[str, int]) -> list[Finding]:
    out: list[Finding] = []
    depth: list[tuple[str, int]] = []
    alt_had_else: dict[int, bool] = {}
    activations = 0

    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw):
            continue
        if FRAGMENT_OPEN.match(raw):
            keyword = raw.strip().split()[0].lower()
            depth.append((keyword, i))
            if keyword == "alt":
                alt_had_else[i] = False
        elif FRAGMENT_ELSE.match(raw) and depth:
            alt_had_else[depth[-1][1]] = True
        elif FRAGMENT_END.match(raw):
            if not depth:
                out.append(Finding(path, i, "unbalanced", "`end` with no open fragment"))
            else:
                keyword, opened = depth.pop()
                if keyword == "alt" and not alt_had_else.get(opened, False):
                    out.append(
                        Finding(
                            path,
                            opened,
                            "alt-no-else",
                            "`alt` with a single branch — an unconditional-else "
                            "choice is `opt`, and readers take `alt` to mean two paths",
                        )
                    )
        elif ACTIVATE.match(raw):
            activations += 1
        elif DEACTIVATE.match(raw):
            activations -= 1

        # PlantUML drops a message with no target and renders the rest, so this
        # never reaches the SVG to be round-tripped. Catch it in the source.
        if DANGLING_ARROW.search(raw):
            out.append(
                Finding(path, i, "dangling", "arrow with no target — PlantUML drops the line")
            )

        message = MESSAGE.match(raw)
        if message and not FRAGMENT_OPEN.match(raw):
            for side in (message.group(1), message.group(2)):
                name = unquote(side)
                if name and name not in names:
                    out.append(
                        Finding(
                            path,
                            i,
                            "phantom",
                            f"message names {name!r}, which is never declared — "
                            "PlantUML invents a lifeline for it silently",
                        )
                    )

    for keyword, line in depth:
        out.append(Finding(path, line, "unbalanced", f"`{keyword}` is never closed by `end`"))
    if activations > 0:
        out.append(Finding(path, 0, "unbalanced", f"{activations} activate(s) never deactivated"))
    return out


def check_use_case(path: Path, lines: list[str]) -> list[Finding]:
    out: list[Finding] = []
    use_cases: dict[str, int] = {}
    inside_boundary = False
    boundary_depth = 0
    boundless: list[tuple[str, int]] = []
    associated: set[str] = set()

    actors = declared_actors(lines)
    actor_names = {name for identity, _display, _line in actors for name in identity}

    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw):
            continue
        if BOUNDARY_OPEN.match(raw):
            boundary_depth += 1
            inside_boundary = True
            continue
        if raw.strip() == "}" and boundary_depth:
            boundary_depth -= 1
            inside_boundary = boundary_depth > 0
            continue

        for match in USECASE_INLINE.finditer(raw):
            label = unquote(match.group(1) or match.group(2))
            if not label or label in actor_names:
                continue
            use_cases.setdefault(label, i)
            if not inside_boundary:
                boundless.append((label, i))

        assoc = ASSOC.match(raw)
        if assoc and ("-" in raw or ">" in raw):
            for side in (assoc.group(1), assoc.group(2)):
                associated.add(unquote(side))

    for label, line in boundless:
        out.append(
            Finding(
                path,
                line,
                "no-boundary",
                f"use case {label!r} sits outside every rectangle — with no system "
                "boundary a reader cannot tell what is in scope",
            )
        )
    for identity, display, line in actors:
        if not identity & associated:
            out.append(
                Finding(
                    path, line, "lone-actor", f"actor {display!r} is associated with no use case"
                )
            )
    for label, line in use_cases.items():
        if len(label.split()) < 2:
            out.append(
                Finding(
                    path,
                    line,
                    "not-a-goal",
                    f"use case {label!r} is one word — a use case is a goal the actor "
                    "reaches, so verb + object",
                )
            )
    return out


def message_labels(lines: list[str]) -> dict[str, int]:
    """Message labels plain enough to compare against rendered text."""
    labels: dict[str, int] = {}
    for i, raw in enumerate(lines, 1):
        if SKIP.match(raw) or FRAGMENT_OPEN.match(raw):
            continue
        match = MSG_LABEL.match(raw)
        if match and PLAIN_LABEL.match(match.group(1)):
            labels.setdefault(match.group(1), i)
    return labels


def check_render(path: Path, expected: dict[str, int]) -> list[Finding]:
    svg = path.with_suffix(".svg")
    if not svg.exists():
        return []
    text = " ".join(re.findall(r">([^<>]+)<", svg.read_text(encoding="utf-8", errors="replace")))
    missing = sorted({n for n in expected if n not in text})
    if not missing:
        return []
    return [
        Finding(
            path,
            0,
            "render-gap",
            f"{svg.name} does not contain {', '.join(repr(m) for m in missing[:4])}"
            + (f" (+{len(missing) - 4} more)" if len(missing) > 4 else "")
            + " — PlantUML exits 0 on a syntax error, so a wrong render looks like a right one",
        )
    ]


def collect(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        path = Path(raw)
        if path.is_dir():
            files.extend(sorted(path.rglob("*.puml")))
        elif path.suffix == ".puml":
            files.append(path)
    return files


def main(argv: list[str]) -> int:
    files = collect(argv)
    if not files:
        print("no .puml files found", file=sys.stderr)
        return 2

    findings: list[Finding] = []
    sequence_actors: dict[Path, list[tuple[set[str], str, int]]] = {}
    use_case_actors: set[str] = set()
    saw_use_case = False

    for path in files:
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except OSError as exc:
            print(f"unreadable: {path}: {exc}", file=sys.stderr)
            return 2
        names = declared_names(lines)
        if is_use_case(lines):
            saw_use_case = True
            findings.extend(check_use_case(path, lines))
            for identity, _display, _line in declared_actors(lines):
                use_case_actors |= identity
        else:
            findings.extend(check_sequence(path, lines, names))
            sequence_actors[path] = declared_actors(lines)
        findings.extend(check_render(path, {**declared_labels(lines), **message_labels(lines)}))

    # The reason both models live in one skill: an actor driving a sequence but
    # named in no use case is a participant nobody agreed to. Only actors are
    # compared — a sequence's internal lifelines are not use case actors.
    if saw_use_case:
        for path, actors in sequence_actors.items():
            for identity, display, line in actors:
                if not identity & use_case_actors:
                    findings.append(
                        Finding(
                            path,
                            line,
                            "undeclared",
                            f"actor {display!r} drives this sequence but appears in no "
                            "use case model",
                        )
                    )

    if not findings:
        print(f"{len(files)} model(s) checked, no findings")
        return 0
    for finding in findings:
        print(str(finding))
    print(f"\n{len(findings)} finding(s) across {len(files)} model(s)")
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
