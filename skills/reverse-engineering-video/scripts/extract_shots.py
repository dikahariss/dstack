#!/usr/bin/env python3
"""Stage 3 support — extract one slice of shots densely.

The survey planned a frame count per shot; this delivers exactly that count,
plus the matching audio window and a labelled contact sheet, for one contiguous
range of shots. One agent calls this once for its own range and reads nothing
outside it.

Refusing an over-budget slice is the point. Truncating instead would hand an
agent fewer frames than the budget arithmetic promised, and nothing downstream
would notice.
"""

import argparse
import csv
import json
import pathlib
import shutil
import subprocess
import sys

THUMB_W = 320
SHEET_COLS = 4


def run(cmd, **kw):
    kw.setdefault("capture_output", True)
    kw.setdefault("text", True)
    return subprocess.run(cmd, **kw)


def require_binaries():
    missing = [b for b in ("ffmpeg", "ffprobe") if not shutil.which(b)]
    if missing:
        sys.exit(f"missing on PATH: {', '.join(missing)}. Install ffmpeg first.")


def parse_range(spec, n_shots):
    try:
        if "-" in spec:
            lo, hi = (int(part) for part in spec.split("-", 1))
        else:
            lo = hi = int(spec)
    except ValueError:
        sys.exit(f"--shots must be N or A-B, got {spec!r}")
    if lo < 0 or hi < lo:
        sys.exit(f"--shots range is empty or negative: {spec!r}")
    if lo >= n_shots:
        sys.exit(f"--shots {spec} starts past the last shot ({n_shots - 1})")
    return lo, min(hi, n_shots - 1)


def has_audio(src):
    out = run(["ffprobe", "-v", "error", "-select_streams", "a",
               "-show_entries", "stream=index", "-of", "csv=p=0", src]).stdout
    return bool(out.strip())


def frame_times(start, duration, n):
    """Mid-point of each of n equal bins.

    Sampling the bin mid-point rather than its edge keeps the first frame off
    the cut itself, where a dissolve or motion blur belongs to neither shot.
    """
    step = duration / n
    return [start + (i + 0.5) * step for i in range(n)]


def extract_frames(src, shot_dir, start, duration, n):
    """Deliver exactly n frames, cheaply when possible and exactly always."""
    shot_dir.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t",
         f"{duration:.3f}", "-i", src, "-vf", f"fps={n / duration:.6f}",
         "-frames:v", str(n), "-q:v", "3", str(shot_dir / "f%04d.jpg")])
    frames = sorted(shot_dir.glob("f*.jpg"))
    for extra in frames[n:]:
        extra.unlink()
    frames = sorted(shot_dir.glob("f*.jpg"))
    # The fps filter can come up short at a segment boundary. Fill the gap by
    # seeking each missing timestamp directly: exact, and paid for only here.
    if len(frames) < n:
        for i, t in enumerate(frame_times(start, duration, n)):
            target = shot_dir / f"f{i + 1:04d}.jpg"
            if target.exists():
                continue
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", src,
                 "-frames:v", "1", "-q:v", "3", str(target)])
        frames = sorted(shot_dir.glob("f*.jpg"))
    return frames


def extract_audio(src, shot_dir, start, duration):
    target = shot_dir / "audio.wav"
    run(["ffmpeg", "-v", "error", "-y", "-ss", f"{start:.3f}", "-t",
         f"{duration:.3f}", "-i", src, "-vn", "-acodec", "pcm_s16le",
         "-ar", "16000", "-ac", "1", str(target)])
    return target if target.exists() else None


def contact_sheet(shot_dir, frames, start, duration, limitations):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        if not limitations:
            limitations.append("pillow is not installed; per-shot contact "
                               "sheets were not built. Read the individual "
                               "f*.jpg frames instead.")
        return None
    if not frames:
        return None
    times = frame_times(start, duration, len(frames))
    thumbs = [Image.open(f) for f in frames]
    scale = THUMB_W / thumbs[0].width
    thumb_h = int(thumbs[0].height * scale)
    cols = min(SHEET_COLS, len(thumbs))
    rows = -(-len(thumbs) // cols)
    canvas = Image.new("RGB", (THUMB_W * cols, thumb_h * rows), "black")
    draw = ImageDraw.Draw(canvas)
    for i, thumb in enumerate(thumbs):
        x, y = (i % cols) * THUMB_W, (i // cols) * thumb_h
        canvas.paste(thumb.resize((THUMB_W, thumb_h)), (x, y))
        draw.text((x + 4, y + 4), f"{i + 1} t={times[i]:.2f}s", fill="yellow")
    target = shot_dir / "sheet.jpg"
    canvas.save(target, quality=88)
    return target


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("survey_dir", help="the directory survey_video.py wrote")
    ap.add_argument("--shots", required=True,
                    help="inclusive shot index range, e.g. 0-49, or a single N")
    ap.add_argument("--max-frames", type=int, default=400,
                    help="hard cap for one agent's slice; over it, refuse")
    ap.add_argument("--outdir", default=None,
                    help="defaults to <survey_dir>/shots")
    args = ap.parse_args()

    require_binaries()
    src = str(pathlib.Path(args.video).expanduser().resolve())
    survey_dir = pathlib.Path(args.survey_dir).expanduser().resolve()
    shots_csv = survey_dir / "shots.csv"
    if not shots_csv.is_file():
        sys.exit(f"no shots.csv in {survey_dir} — run survey_video.py first")

    with shots_csv.open() as f:
        all_shots = list(csv.DictReader(f))
    if not all_shots:
        sys.exit(f"shots.csv in {survey_dir} is empty")

    lo, hi = parse_range(args.shots, len(all_shots))
    slice_rows = all_shots[lo:hi + 1]
    planned = sum(int(r["n_frames_planned"]) for r in slice_rows)
    if planned > args.max_frames:
        print(f"slice {args.shots} plans {planned} frames, over the cap of "
              f"{args.max_frames}. Split it: about "
              f"{max(1, len(slice_rows) * args.max_frames // planned)} shots "
              f"fit in one agent at this density.", file=sys.stderr)
        return 2

    outdir = pathlib.Path(args.outdir).expanduser().resolve() if args.outdir \
        else survey_dir / "shots"
    outdir.mkdir(parents=True, exist_ok=True)

    limitations = []
    audio_present = has_audio(src)
    if not audio_present:
        limitations.append("no audio stream in the source; audio.wav was not "
                           "written and every audio field in the deep pass is "
                           "unrecoverable, not absent.")

    extracted, manifest_shots = 0, []
    for row in slice_rows:
        shot_dir = outdir / row["shot_id"]
        shutil.rmtree(shot_dir, ignore_errors=True)
        start = float(row["t_start_s"])
        duration = float(row["duration_s"])
        n = int(row["n_frames_planned"])
        frames = extract_frames(src, shot_dir, start, duration, n)
        if audio_present:
            extract_audio(src, shot_dir, start, duration)
        contact_sheet(shot_dir, frames, start, duration, limitations)
        extracted += len(frames)
        manifest_shots.append(row["shot_id"])
        if len(frames) != n:
            limitations.append(
                f"{row['shot_id']}: delivered {len(frames)} frames, planned "
                f"{n}. The budget arithmetic assumed {n}.")

    manifest = {
        "video_id": slice_rows[0]["video_id"],
        "slice": f"{lo}-{hi}",
        "shot_ids": manifest_shots,
        "n_shots": len(manifest_shots),
        "n_frames_planned": planned,
        "n_frames_extracted": extracted,
        "max_frames": args.max_frames,
        "audio_present": audio_present,
        "t_start_s": float(slice_rows[0]["t_start_s"]),
        "t_end_s": float(slice_rows[-1]["t_end_s"]),
    }
    (outdir / f"slice_{lo}-{hi}.json").write_text(json.dumps(manifest, indent=2))
    (outdir / "limitations.txt").write_text(
        "\n".join(limitations) if limitations
        else "Every extraction ran as planned.\n")

    print(f"slice {lo}-{hi}: {len(manifest_shots)} shots, {extracted} frames "
          f"({planned} planned), audio={'yes' if audio_present else 'no'}")
    print(f"View {outdir}/<shot_id>/sheet.jpg, then write shots_deep.csv rows "
          f"for exactly these shot_ids.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
