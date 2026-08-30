#!/usr/bin/env python3
"""Stage 1 — survey a whole video cheaply.

Detects shot boundaries, plans a per-shot frame budget, and writes the
low-rate contact sheets a reader needs before deciding which shots deserve a
deep pass.

Cost, measured on this class of machine: a 232 s source surveys in about 8 s,
a 3642 s (60.7 min) source in about 5.5 min with every pass on. Detection and
the sheets each decode the file once; the loudness pass is off by default
because a rebuild never reads it. Detection results are cached, so changing --threshold
afterwards costs nothing.

Outputs, all under <outdir>:
    shots.csv          the contract table Stage 3 agents plan against
    cuts.csv           every candidate boundary above the detection floor
    calibration.txt    what each threshold would have produced
    audio_map.csv      per-second loudness and silence ranges (--audio-map only)
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

# Detection runs once at this floor and every candidate is cached, so
# --threshold filters a table instead of re-decoding the file. Measured on a
# 300 s window of one source: 0.30 found 4 cuts, 0.15 found 19, 0.08 found 30.
# No single value serves all content, and the wrong one is wrong everywhere
# downstream, so the choice has to be visible and cheap to change.
DETECT_FLOOR = 0.05
CALIBRATION_THRESHOLDS = (0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 0.50)

# A second detector, for boundaries frame-differencing cannot see at ANY
# threshold. A dip to black spreads its change over many frames, so no
# consecutive pair differs much: measured on one source, a real cut at ~4.0 s
# produced no candidate at all above a 0.05 floor, while absolute brightness
# bottomed at YAVG 18/255. The dip is dark, not black, so pic_th=0.98 refuses
# it. The run must also be SHORT — a genuinely dark scene lasts longer than a
# transition, and that length is what separates the two.
BLACK_MIN_S, BLACK_MAX_S = 0.02, 1.0
BLACK_PIC_TH, BLACK_PIX_TH = 0.85, 0.15
LONG_TAKE_WARN_S = 20.0

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
LABEL_MIN_PX = 22


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


def load_cached_cuts(outdir):
    path = outdir / "cuts.csv"
    if not path.is_file():
        return None, None
    with path.open() as f:
        reader = csv.DictReader(f)
        rows = [(float(r["t_s"]), None if r["score"] == "" else float(r["score"]))
                for r in reader]
    meta = json.loads((outdir / "cuts_meta.json").read_text())
    return rows, meta


def save_cuts(outdir, cuts, meta):
    with (outdir / "cuts.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["t_s", "score"])
        for t, score in cuts:
            w.writerow([f"{t:.3f}", "" if score is None else f"{score:.4f}"])
    (outdir / "cuts_meta.json").write_text(json.dumps(meta, indent=2))


def calibration_table(cuts, duration):
    """What each candidate threshold would produce, so the choice is informed."""
    lines = ["threshold  n_shots  mean_shot_s"]
    for t in CALIBRATION_THRESHOLDS:
        n = sum(1 for _, s in cuts if s is None or s > t) + 1
        lines.append(f"{t:>9.2f}  {n:>7d}  {duration / n:>11.2f}")
    return "\n".join(lines) + "\n"


def detect_cuts(src, detector, limitations):
    """Return [(t_seconds, score)] for every candidate boundary above the floor."""
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
                f"select='gt(scene,{DETECT_FLOOR})',metadata=print:file=-",
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
    cuts += detect_fades(src)
    cuts.sort()
    return cuts, "ffmpeg"


def detect_fades(src):
    """Find dip-to-black transitions, which frame-differencing never scores.

    Scored 1.0 so the boundary survives every threshold in the calibration
    table: a fade is a cut whatever sensitivity the reader picks.
    """
    proc = run(["ffmpeg", "-v", "info", "-i", src, "-vf",
                f"blackdetect=d={BLACK_MIN_S}:pic_th={BLACK_PIC_TH}"
                f":pix_th={BLACK_PIX_TH}", "-an", "-f", "null", "-"])
    out = []
    for m in re.finditer(r"black_start:([\d.]+)\s+black_end:([\d.]+)",
                         proc.stderr):
        start, end = float(m.group(1)), float(m.group(2))
        if start <= 0.01 or end - start > BLACK_MAX_S:
            continue                # a black head, or a dark scene, not a dip
        out.append((round((start + end) / 2, 3), 1.0))
    return out


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


def build_shots(vid, cuts, duration, threshold):
    kept = [(t, s) for t, s in cuts
            if 0.0 < t < duration and (s is None or s > threshold)]
    boundaries = [0.0] + [t for t, _ in kept] + [round(duration, 3)]
    scores = [1.0] + [s for _, s in kept]
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


def label_font(thumb_h):
    """A default-size label is unreadable on a tall thumbnail; scale to it."""
    from PIL import ImageFont
    size = max(LABEL_MIN_PX, thumb_h // 18)
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                 "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size)
    except TypeError:                       # pillow < 10.1 has no size argument
        return ImageFont.load_default()


def label(draw, x, y, text, font):
    """Dark plate under the text: a yellow label vanishes on a bright frame."""
    box = draw.textbbox((x, y), text, font=font)
    draw.rectangle((box[0] - 4, box[1] - 2, box[2] + 4, box[3] + 2), fill="black")
    draw.text((x, y), text, fill="yellow", font=font)


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
    font = label_font(thumb_h)
    n_sheets = 0
    for start in range(0, len(frames), per_sheet):
        block = frames[start:start + per_sheet]
        # Size the grid to the frames actually in this block. A fixed 5x6 padded
        # the last sheet with empty cells, and a vertical source turned 8 frames
        # into a 1600x3414 image that was mostly black — a reader pays for those
        # pixels in tokens and learns nothing from them.
        cols = min(SHEET_COLS, len(block))
        rows = -(-len(block) // cols)
        canvas = Image.new("RGB", (THUMB_W * cols, thumb_h * rows), "black")
        draw = ImageDraw.Draw(canvas)
        for i, frame in enumerate(block):
            x, y = (i % cols) * THUMB_W, (i // cols) * thumb_h
            canvas.paste(Image.open(frame), (x, y))
            seconds = (start + i) / survey_fps
            label(draw, x + 6, y + 6, f"t={seconds:.0f}s", font)
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
                    help="scene score above which a candidate becomes a cut; "
                         "read calibration.txt and re-run to change it — "
                         "re-running is free once cuts.csv exists")
    ap.add_argument("--detector", default="ffmpeg",
                    choices=("ffmpeg", "pyscenedetect"))
    ap.add_argument("--survey-fps", type=float, default=0.25,
                    help="rate for the whole-file contact sheets")
    ap.add_argument("--max-frames", type=int, default=400,
                    help="hard per-agent frame cap the budget is planned against")
    ap.add_argument("--no-sheets", action="store_true",
                    help="skip the contact sheets; one decode cheaper, but "
                         "nobody can read what the video is about")
    ap.add_argument("--audio-map", action="store_true",
                    help="write per-second loudness and silence ranges. Off by "
                         "default: it costs a whole decode pass, and the audio "
                         "for a rebuild is generated per shot from the deep "
                         "rows, not read off a per-second curve")
    ap.add_argument("--redetect", action="store_true",
                    help="ignore a cached cuts.csv and decode again")
    args = ap.parse_args()

    require_binaries()
    src = str(pathlib.Path(args.video).expanduser().resolve())
    if not pathlib.Path(src).is_file():
        sys.exit(f"not a file: {src}")
    outdir = pathlib.Path(args.outdir).expanduser().resolve()
    outdir.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(outdir / "_frames", ignore_errors=True)

    limitations = []
    facts = probe(src)
    vid = video_id(src)
    duration = facts["duration_s"]

    cuts, meta = (None, None) if args.redetect else load_cached_cuts(outdir)
    if cuts is not None and meta.get("video_id") == vid:
        detector_used = meta["detector"]
        reused = True
    else:
        cuts, detector_used = detect_cuts(src, args.detector, limitations)
        save_cuts(outdir, cuts, {"video_id": vid, "detector": detector_used,
                                 "detect_floor": DETECT_FLOOR,
                                 "n_candidates": len(cuts)})
        reused = False

    (outdir / "calibration.txt").write_text(
        calibration_table(cuts, duration)
        + "\nRe-run with --threshold <value> to adopt a row. Detection is\n"
          "cached in cuts.csv, so a different threshold costs no decoding.\n")

    shots = build_shots(vid, cuts, duration, args.threshold)
    with (outdir / "shots.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=SHOT_COLUMNS)
        w.writeheader()
        w.writerows(shots)

    mean_shot = sum(float(r["duration_s"]) for r in shots) / len(shots)
    if mean_shot > LONG_TAKE_WARN_S:
        limitations.append(
            f"Mean shot is {mean_shot:.1f}s at --threshold {args.threshold}. "
            f"That is either genuine long-take material or a threshold too high "
            f"for this content — read calibration.txt and decide before Stage 3, "
            f"because every downstream reading inherits this boundary set.")

    if args.audio_map:
        audio_map(src, outdir, duration, facts["n_audio_streams"] > 0, limitations)
    else:
        limitations.append("audio_map.csv not written (default). Pass "
                           "--audio-map if you need the per-second loudness "
                           "curve; the rebuild does not.")

    if args.no_sheets:
        n_sheets = 0
        limitations.append("--no-sheets: survey_sheets/ were not built, so the "
                           "semantic pass has nothing to read.")
    else:
        shutil.rmtree(outdir / "survey_sheets", ignore_errors=True)
        n_sheets = contact_sheets(src, outdir, args.survey_fps, limitations)

    total, agents = write_budget(outdir, shots, args.max_frames)

    facts.update(video_id=vid, schema_version=SCHEMA_VERSION,
                 surveyor_version=SURVEYOR_VERSION, detector=detector_used,
                 detect_floor=DETECT_FLOOR, threshold=args.threshold,
                 n_cut_candidates=len(cuts), cuts_reused=reused,
                 survey_fps=args.survey_fps, n_shots=len(shots),
                 n_survey_sheets=n_sheets, source_path=src)
    (outdir / "probe.json").write_text(json.dumps(facts, indent=2))
    (outdir / "limitations.txt").write_text(
        "\n".join(limitations) if limitations
        else "Every survey measurement ran on this machine.\n")

    print(f"{len(shots)} shots, mean {mean_shot:.2f}s, detector={detector_used}"
          f"{' (cuts reused)' if reused else ''}")
    print(f"Stage 3 budget: {total} frames -> {agents} agent(s) "
          f"at {args.max_frames} frames each")
    print(f"Read {outdir}/calibration.txt and {outdir}/limitations.txt, then "
          f"view {outdir}/survey_sheets/S*.jpg before choosing shots.")


if __name__ == "__main__":
    main()
