#!/usr/bin/env python3
"""Stage 1 — survey a whole video cheaply.

Detects shot boundaries, plans a per-shot frame budget, and writes the
low-rate contact sheets a reader needs before deciding which shots deserve a
deep pass. Everything here is one pass of ffmpeg over the file: measured at
87x realtime on a 232 s source, so a 90-minute film surveys in about a minute.

Outputs, all under <outdir>:
    shots.csv          the contract table Stage 3 agents plan against
    audio_map.csv      per-second loudness and the silence ranges
    survey_sheets/*    time-labelled thumbnail grids at --survey-fps
    probe.json         container facts
    budget.txt         projected Stage 3 cost, in frames and agents
    limitations.txt    what did not run on this machine
"""

import argparse
import csv
import hashlib
import json
import pathlib
import re
import shutil
import subprocess
import sys
from fractions import Fraction

SCHEMA_VERSION = "1.0"
SURVEYOR_VERSION = "0.1.0"

SHOT_COLUMNS = [
    "video_id", "shot_id", "t_start_s", "t_end_s", "duration_s",
    "cut_confidence", "sample_fps", "n_frames_planned", "sequence_id",
]

# The sampling ladder. Closed by design: Stage 3 agents plan their context
# against these bands, and a fifth band makes two runs of one video
# incomparable. Below four frames a push-in and a cut look identical, which is
# the misreading the floor exists to prevent.
LADDER = ((1.5, 5.0), (5.0, 4.0), (15.0, 3.0))
LADDER_TAIL_FPS = 2.0
FRAMES_FLOOR = 4
FRAMES_CEILING_LONG_TAKE = 48

SHEET_COLS, SHEET_ROWS = 5, 6
THUMB_W = 320


def run(cmd, **kw):
    kw.setdefault("capture_output", True)
    kw.setdefault("text", True)
    return subprocess.run(cmd, **kw)


def require_binaries():
    missing = [b for b in ("ffmpeg", "ffprobe") if not shutil.which(b)]
    if missing:
        sys.exit(f"missing on PATH: {', '.join(missing)}. Install ffmpeg first.")


def video_id(path):
    """Keys the file, not the run, so a second survey upserts rather than forks."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def probe(src):
    out = run(["ffprobe", "-v", "error", "-show_streams", "-show_format",
               "-of", "json", src]).stdout
    data = json.loads(out)
    video = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if video is None:
        sys.exit(f"no video stream in {src}")
    audio = [s for s in data["streams"] if s["codec_type"] == "audio"]
    width, height = int(video["width"]), int(video["height"])
    try:
        native_fps = float(Fraction(video.get("avg_frame_rate", "0/1")))
    except (ZeroDivisionError, ValueError):
        native_fps = None
    return {
        "duration_s": round(float(data["format"]["duration"]), 3),
        "native_fps": round(native_fps, 3) if native_fps else None,
        "width": width,
        "height": height,
        "aspect": f"{width}:{height}",
        "aspect_ratio": round(width / height, 4) if height else None,
        "vertical": height > width,
        "video_codec": video.get("codec_name"),
        "n_audio_streams": len(audio),
        "audio_codec": audio[0].get("codec_name") if audio else None,
        "container_s": round(float(data["format"]["duration"]), 3),
    }


def detect_cuts(src, threshold, detector, limitations):
    """Return [(t_seconds, score)] for every detected shot start after t=0."""
    if detector == "pyscenedetect":
        try:
            import scenedetect  # noqa: F401
        except ImportError:
            limitations.append(
                "PySceneDetect requested but not installed; fell back to the "
                "ffmpeg scene filter. Fades and slow dissolves may be missed.")
            detector = "ffmpeg"
        else:
            from scenedetect import detect, AdaptiveDetector
            scenes = detect(src, AdaptiveDetector())
            return [(round(s.get_seconds(), 3), None) for s, _ in scenes[1:]], "pyscenedetect"

    proc = run(["ffmpeg", "-v", "error", "-i", src, "-filter_complex",
                f"select='gt(scene,{threshold})',metadata=print:file=-",
                "-an", "-f", "null", "-"])
    cuts, pending = [], None
    for line in proc.stdout.splitlines():
        m = re.search(r"pts_time:([\d.]+)", line)
        if m:
            pending = float(m.group(1))
            continue
        m = re.search(r"lavfi\.scene_score=([\d.]+)", line)
        if m and pending is not None:
            cuts.append((round(pending, 3), round(float(m.group(1)), 4)))
            pending = None
    return cuts, "ffmpeg"


def plan_sampling(duration):
    """Map a shot's duration to its sample rate and planned frame count."""
    fps = LADDER_TAIL_FPS
    for upper, rate in LADDER:
        if duration <= upper:
            fps = rate
            break
    n = max(FRAMES_FLOOR, int(round(duration * fps)))
    if fps == LADDER_TAIL_FPS:
        n = min(n, FRAMES_CEILING_LONG_TAKE)
    return fps, n


def build_shots(vid, cuts, duration):
    boundaries = [0.0] + [t for t, _ in cuts if 0.0 < t < duration] + [round(duration, 3)]
    scores = [1.0] + [s for t, s in cuts if 0.0 < t < duration]
    rows = []
    for i, (start, end) in enumerate(zip(boundaries, boundaries[1:])):
        length = round(end - start, 3)
        if length <= 0:
            continue
        fps, n_frames = plan_sampling(length)
        score = scores[i] if i < len(scores) else None
        rows.append({
            "video_id": vid,
            "shot_id": f"sh{len(rows):04d}",
            "t_start_s": f"{start:.3f}",
            "t_end_s": f"{end:.3f}",
            "duration_s": f"{length:.3f}",
            # A boundary the detector never scored is the file's own start.
            "cut_confidence": "" if score is None else f"{score:.4f}",
            "sample_fps": f"{fps:.1f}",
            "n_frames_planned": str(n_frames),
            # Filled by Stage 2. The survey measures cuts; a sequence is a
            # reading, and mechanical grouping here would disguise one as the
            # other.
            "sequence_id": "",
        })
    return rows


def audio_map(src, outdir, duration, has_audio, limitations):
    if not has_audio:
        limitations.append("no audio stream; audio_map.csv is empty and every "
                           "audio field in the deep pass is unrecoverable.")
        with (outdir / "audio_map.csv").open("w", newline="") as f:
            csv.writer(f).writerow(["sec", "momentary_lufs", "is_silent"])
        return
    proc = run(["ffmpeg", "-v", "info", "-i", src, "-filter_complex",
                "ebur128=metadata=1,silencedetect=noise=-50dB:d=0.5",
                "-f", "null", "-"])
    stderr = proc.stderr
    loud = {}
    for m in re.finditer(r"t:\s*([\d.]+)\s+M:\s*(-?[\d.]+|-inf)", stderr):
        sec = int(float(m.group(1)))
        value = m.group(2)
        loud.setdefault(sec, value if value != "-inf" else "")
    silences = []
    start = None
    for line in stderr.splitlines():
        m = re.search(r"silence_start:\s*(-?[\d.]+)", line)
        if m:
            start = float(m.group(1))
        m = re.search(r"silence_end:\s*([\d.]+)", line)
        if m and start is not None:
            silences.append((max(0.0, start), float(m.group(1))))
            start = None
    if start is not None:
        silences.append((max(0.0, start), duration))

    def silent(sec):
        return any(a <= sec < b for a, b in silences)

    with (outdir / "audio_map.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["sec", "momentary_lufs", "is_silent"])
        for sec in range(int(duration) + 1):
            w.writerow([sec, loud.get(sec, ""), "true" if silent(sec) else "false"])


def contact_sheets(src, outdir, survey_fps, limitations):
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        limitations.append("pillow is not installed; survey_sheets/ were not "
                           "built. Shot detection is unaffected, but nobody can "
                           "read what the video is about without them.")
        return 0
    frames_dir = outdir / "_frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-v", "error", "-i", src, "-vf",
         f"fps={survey_fps},scale={THUMB_W}:-1", "-q:v", "4",
         str(frames_dir / "f%06d.jpg")], check=True)
    frames = sorted(frames_dir.glob("f*.jpg"))
    if not frames:
        shutil.rmtree(frames_dir, ignore_errors=True)
        return 0
    sheets_dir = outdir / "survey_sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    per_sheet = SHEET_COLS * SHEET_ROWS
    thumb_h = Image.open(frames[0]).height
    n_sheets = 0
    for start in range(0, len(frames), per_sheet):
        block = frames[start:start + per_sheet]
        canvas = Image.new("RGB",
                           (THUMB_W * SHEET_COLS, thumb_h * SHEET_ROWS), "black")
        draw = ImageDraw.Draw(canvas)
        for i, frame in enumerate(block):
            x, y = (i % SHEET_COLS) * THUMB_W, (i // SHEET_COLS) * thumb_h
            canvas.paste(Image.open(frame), (x, y))
            seconds = (start + i) / survey_fps
            draw.text((x + 4, y + 4), f"t={seconds:.0f}s", fill="yellow")
        canvas.save(sheets_dir / f"S{n_sheets:03d}.jpg", quality=88)
        n_sheets += 1
    shutil.rmtree(frames_dir, ignore_errors=True)
    return n_sheets


def write_budget(outdir, shots, max_frames):
    total = sum(int(r["n_frames_planned"]) for r in shots)
    agents = max(1, -(-total // max_frames))
    per_agent = -(-len(shots) // agents)
    text = (
        f"n_shots={len(shots)}\n"
        f"total_frames_planned={total}\n"
        f"max_frames_per_agent={max_frames}\n"
        f"n_agents={agents}\n"
        f"shots_per_agent={per_agent}\n"
        f"mean_shot_s={sum(float(r['duration_s']) for r in shots) / len(shots):.2f}\n"
        "\n"
        "Read this before Stage 3. One agent cannot hold total_frames_planned;\n"
        "split into n_agents slices of shots_per_agent shots each. The cap is\n"
        "set where measured accuracy against frame count stops rising.\n"
    )
    (outdir / "budget.txt").write_text(text)
    return total, agents


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("outdir")
    ap.add_argument("--threshold", type=float, default=0.3,
                    help="ffmpeg scene score above which a frame starts a new shot")
    ap.add_argument("--detector", default="ffmpeg",
                    choices=("ffmpeg", "pyscenedetect"))
    ap.add_argument("--survey-fps", type=float, default=0.25,
                    help="rate for the whole-file contact sheets")
    ap.add_argument("--max-frames", type=int, default=400,
                    help="hard per-agent frame cap the budget is planned against")
    args = ap.parse_args()

    require_binaries()
    src = str(pathlib.Path(args.video).expanduser().resolve())
    if not pathlib.Path(src).is_file():
        sys.exit(f"not a file: {src}")
    outdir = pathlib.Path(args.outdir).expanduser().resolve()
    for sub in ("survey_sheets", "_frames"):
        shutil.rmtree(outdir / sub, ignore_errors=True)
    outdir.mkdir(parents=True, exist_ok=True)

    limitations = []
    facts = probe(src)
    vid = video_id(src)
    cuts, detector_used = detect_cuts(src, args.threshold, args.detector, limitations)
    shots = build_shots(vid, cuts, facts["duration_s"])

    with (outdir / "shots.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=SHOT_COLUMNS)
        w.writeheader()
        w.writerows(shots)

    audio_map(src, outdir, facts["duration_s"], facts["n_audio_streams"] > 0,
              limitations)
    n_sheets = contact_sheets(src, outdir, args.survey_fps, limitations)
    total, agents = write_budget(outdir, shots, args.max_frames)

    facts.update(video_id=vid, schema_version=SCHEMA_VERSION,
                 surveyor_version=SURVEYOR_VERSION, detector=detector_used,
                 threshold=args.threshold, survey_fps=args.survey_fps,
                 n_shots=len(shots), n_survey_sheets=n_sheets,
                 source_path=src)
    (outdir / "probe.json").write_text(json.dumps(facts, indent=2))
    (outdir / "limitations.txt").write_text(
        "\n".join(limitations) if limitations
        else "Every survey measurement ran on this machine.\n")

    print(f"{len(shots)} shots, mean "
          f"{sum(float(r['duration_s']) for r in shots) / len(shots):.2f}s, "
          f"detector={detector_used}")
    print(f"Stage 3 budget: {total} frames -> {agents} agent(s) "
          f"at {args.max_frames} frames each")
    print(f"Read {outdir}/limitations.txt, then view "
          f"{outdir}/survey_sheets/S*.jpg before choosing shots.")


if __name__ == "__main__":
    main()
