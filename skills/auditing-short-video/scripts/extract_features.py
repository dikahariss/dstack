#!/usr/bin/env python3
"""
extract_features.py (v3) — turn a short-form video into a corpus-ready dataset.

Usage:
    python extract_features.py <video_path> <audit_dir>
        [--fps 2] [--scene 0.2]
        [--platform instagram_reels|tiktok|youtube_shorts|generic]
        [--ocr-lang eng] [--keep-frames] [--max-frames 1800]

Every table carries `video_id` (sha256[:16] of file bytes) plus the provenance
needed to interpret it, so rows from different machines and different years stay
comparable. See references/schema.md for the frozen data contract.

CONTRACT RULES THIS FILE ENFORCES (v2 violated all four):

1. Missing is NULL, never 0. If OCR did not run, the OCR columns are empty and
   `ocr_available=False`. If there is no audio, the audio columns are empty. If
   face detection is unavailable, the face columns are empty. A zero in this
   dataset always means "measured, and the answer was zero".
2. Every table emits its full declared column set, in declared order, always.
   Optional inputs produce nulls, never absent columns — otherwise SQL UNION and
   Parquet schema unification break across videos.
3. Constant motion time base. `motion_score` is an inter-frame difference, so it
   is meaningless across videos unless the gap between frames is identical. The
   sampling rate is therefore FIXED, not a function of duration. If a very long
   video forces a lower rate, `motion_*` is nulled in the master row rather than
   silently rescaled.
4. Every derived percentage ships with its numerator and denominator, so a
   corpus can pool them instead of averaging percentages.

Outputs in <audit_dir>:
    video_master.csv         ONE flat row — the aggregation unit
    frame_features.csv       per sampled frame
    timeline_per_second.csv  one row per WHOLE second, gaps included as nulls
    shot_list.csv            per detected shot
    ocr_text.csv             on-screen text (empty table when OCR unavailable)
    analysis.json            nested mirror + provenance + limitations
    limitations.txt          auto-detected blind spots of this run
    contact_sheets/S*.jpg    time-labeled thumbnail grids — VIEW for semantics
    frames/                  sampled frames (deleted unless --keep-frames)
    probe.json               raw ffprobe
"""
import argparse
import glob
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import sys
import wave
from datetime import datetime, timezone
from fractions import Fraction

import numpy as np
from PIL import Image, ImageDraw

try:
    import cv2
except ImportError:
    sys.exit("cv2 not installed. See requirements.txt next to this script.")
try:
    import pandas as pd
except ImportError:
    sys.exit("pandas not installed. See requirements.txt next to this script.")

SCHEMA_VERSION = "3.0"
EXTRACTOR_VERSION = "3.1.0"

# k-means picks initial centres from OpenCV's global RNG. Unseeded, the
# dominant-colour columns can differ between runs on identical bytes.
cv2.setRNGSeed(20260802)

# Platform UI margins as a fraction of frame height/width. Sources and dates are
# in references/benchmarks.md. `generic` is the strictest envelope of the three,
# so an unknown target cannot be scored leniently.
SAFE_ZONES = {
    "instagram_reels": dict(top=0.14, bottom=0.35, left=0.06, right=0.06),
    "tiktok":          dict(top=0.07, bottom=0.25, left=0.04, right=0.13),
    "youtube_shorts":  dict(top=0.06, bottom=0.21, left=0.04, right=0.11),
    "generic":         dict(top=0.14, bottom=0.35, left=0.06, right=0.13),
}

BEAT_TOL_S = 0.12

TIMELINE_COLUMNS = [
    "video_id", "schema_version", "extractor_version", "param_sample_fps", "sec",
    "n_frames_in_sec", "brightness", "saturation", "colorfulness", "sharpness",
    "motion_score", "edge_density", "face_count", "face_area_ratio",
    "dominant_color", "audio_dbfs", "speech_band_ratio", "bass_ratio",
    "ocr_text", "text_area_ratio", "cuts_in_sec",
]
SHOT_COLUMNS = [
    "video_id", "schema_version", "extractor_version", "shot_id", "start_s",
    "end_s", "duration_s", "mean_brightness", "mean_motion", "has_face",
    "dominant_color",
]
OCR_COLUMNS = [
    "video_id", "schema_version", "extractor_version", "timestamp_s", "ocr_text",
    "ocr_word_count", "text_area_ratio", "text_zone",
]


def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def require_binaries():
    missing = [b for b in ("ffmpeg", "ffprobe") if shutil.which(b) is None]
    if missing:
        sys.exit(f"Required binary not found on PATH: {', '.join(missing)}. "
                 "Install ffmpeg before running this script.")


def read_sidecar(src):
    """yt-dlp writes <name>.info.json next to the media. It carries the platform
    identity this dataset cannot reconstruct from file bytes: the post id, the
    creator, and the publish date. Harvesting it is the only step whose window
    closes — a deleted post cannot be re-fetched, and a re-encode mints a new
    video_id with nothing tying it to the original."""
    base = os.path.splitext(src)[0]
    for cand in (base + ".info.json", base + ".json"):
        if os.path.isfile(cand):
            try:
                d = json.load(open(cand))
            except (ValueError, OSError):
                return {}, ""
            ts = d.get("timestamp")
            return dict(
                platform=d.get("extractor_key") or d.get("extractor") or "",
                platform_post_id=d.get("id") or "",
                post_url=d.get("webpage_url") or "",
                creator_id=str(d.get("uploader_id") or ""),
                creator_handle=d.get("channel") or d.get("uploader") or "",
                published_at_utc=(datetime.fromtimestamp(ts, timezone.utc)
                                  .strftime("%Y-%m-%dT%H:%M:%SZ") if ts else ""),
                parent_media_id=str(d.get("playlist_id") or ""),
                engagement_likes=d.get("like_count"),
                engagement_comments=d.get("comment_count"),
                engagement_views=d.get("view_count"),
                engagement_captured_at_utc=(
                    datetime.fromtimestamp(os.path.getmtime(cand), timezone.utc)
                    .strftime("%Y-%m-%dT%H:%M:%SZ")),
            ), os.path.basename(cand)
    return {}, ""


def sha16(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while b := f.read(chunk):
            h.update(b)
    return h.hexdigest()[:16], h.hexdigest()


def ffmpeg_version():
    out = run(["ffmpeg", "-version"]).stdout
    parts = out.split()
    return parts[2] if len(parts) > 2 else ""


def colorfulness(bgr):
    B, G, R = cv2.split(bgr.astype("float"))
    rg = np.absolute(R - G)
    yb = np.absolute(0.5 * (R + G) - B)
    return (np.sqrt(rg.std() ** 2 + yb.std() ** 2)
            + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))


def dominant_hex(bgr, k=3):
    small = cv2.resize(bgr, (60, 60)).reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(small, k, None, crit, 3, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels.flatten(), minlength=k)
    order = np.argsort(-counts)
    return [("#%02X%02X%02X" % (int(centers[i][2]), int(centers[i][1]), int(centers[i][0])),
             round(float(counts[i]) / len(labels), 3)) for i in order]


def make_face_detector(limitations):
    """OpenCV 5 removed cv2.CascadeClassifier while keeping cv2.data.haarcascades,
    so the presence of the data path proves nothing. Degrade to NULL, never 0."""
    if not hasattr(cv2, "CascadeClassifier"):
        limitations.append(
            f"Face detection unavailable: OpenCV {cv2.__version__} has no "
            "CascadeClassifier. Face columns are NULL (not 0).")
        return None
    try:
        c = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        if c.empty():
            limitations.append("Face cascade file empty — face columns are NULL.")
            return None
        limitations.append("Face detection: frontal Haar cascade only — "
                           "profile and occluded faces are missed.")
        return c
    except Exception as e:                                       # noqa: BLE001
        limitations.append(f"Face detection unavailable ({type(e).__name__}) — "
                           "face columns are NULL.")
        return None


def merged_coverage(centers, tol, span):
    """Fraction of `span` covered by the UNION of +/-tol windows around centers.

    v2 used 2*tol*n/span, which double-counts every overlapping pair and so
    overstates the random baseline whenever onsets are dense — understating the
    lift exactly where the music is busiest."""
    if not centers or span <= 0:
        return None
    iv = sorted((max(0.0, c - tol), min(span, c + tol)) for c in centers)
    total, cur_s, cur_e = 0.0, iv[0][0], iv[0][1]
    for s, e in iv[1:]:
        if s <= cur_e:
            cur_e = max(cur_e, e)
        else:
            total += cur_e - cur_s
            cur_s, cur_e = s, e
    total += cur_e - cur_s
    return min(1.0, total / span)


def binom_sf(k, n, p):
    """P(X >= k) for X ~ Binomial(n, p). Exact; n here is a cut count (tens)."""
    if not n or p is None:
        return None
    p = min(max(p, 0.0), 1.0)
    return float(sum(math.comb(n, i) * p ** i * (1 - p) ** (n - i)
                     for i in range(k, n + 1)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("outdir")
    ap.add_argument("--fps", type=float, default=2.0,
                    help="FIXED sampling rate; constant across videos by design.")
    ap.add_argument("--scene", type=float, default=0.2)
    ap.add_argument("--platform", default="generic", choices=sorted(SAFE_ZONES))
    ap.add_argument("--ocr-lang", default="eng")
    ap.add_argument("--keep-frames", action="store_true")
    ap.add_argument("--max-frames", type=int, default=1800)
    args = ap.parse_args()

    require_binaries()
    src, outdir = args.video, args.outdir
    if not os.path.isfile(src):
        sys.exit(f"Not a file: {src}")

    # v2 reused whatever was already in frames/, so a re-run at a different --fps
    # mixed two runs' frames into one row. Always start clean.
    for sub in ("frames", "contact_sheets"):
        shutil.rmtree(os.path.join(outdir, sub), ignore_errors=True)
        os.makedirs(os.path.join(outdir, sub), exist_ok=True)

    _pending_lims = []
    sidecar, sidecar_name = read_sidecar(src)
    if not sidecar:
        _pending_lims.append(
            "No yt-dlp .info.json sidecar found next to the media: platform post id, "
            "creator_id and published_at_utc are NULL. Without them this row cannot "
            "be joined to platform analytics and cannot be placed on a timeline.")
    limitations = [
        "No speech-to-text: spoken words are NOT transcribed. speech_band_ratio "
        "is the energy share in 300-3400 Hz (the telephony band), which music "
        "also occupies — it does not identify speech.",
        "Semantic labels (genre, pull mechanisms, segments) come from the analyst "
        "viewing contact sheets, not from this script.",
    ]
    limitations += _pending_lims
    vid16, vid_full = sha16(src)

    # ---------- probe ----------
    probe = run(["ffprobe", "-v", "error", "-print_format", "json",
                 "-show_format", "-show_streams", src])
    if probe.returncode != 0 or not probe.stdout.strip():
        sys.exit(f"ffprobe could not read {src}:\n{probe.stderr.strip()[:400]}")
    d = json.loads(probe.stdout)
    json.dump(d, open(f"{outdir}/probe.json", "w"), indent=1)
    fmt = d.get("format", {})
    streams = d.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    if v is None:
        sys.exit("No video stream found.")

    raw_dur = fmt.get("duration") or v.get("duration")
    if raw_dur is None or float(raw_dur) <= 0:
        # v2 substituted 0 here and then emitted shot_pct_under_0_5s=100.0 — a
        # fabricated hyper-cut signature indistinguishable from a real one.
        sys.exit("Container reports no duration. Refusing to emit duration-derived "
                 "columns from a fabricated 0. Remux with "
                 "`ffmpeg -i in -c copy out.mp4` and re-run.")
    duration = float(raw_dur)

    fr_rate = v.get("avg_frame_rate", "0/0")
    try:
        native_fps = float(Fraction(fr_rate)) or None            # v2 used eval()
    except (ZeroDivisionError, ValueError):
        native_fps = None
    W, H = v["width"], v["height"]
    ar = W / H
    aspect = ("9:16" if abs(ar - 9 / 16) < 0.02 else
              "16:9" if abs(ar - 16 / 9) < 0.02 else
              "1:1" if abs(ar - 1) < 0.02 else
              "4:5" if abs(ar - 0.8) < 0.02 else f"{W}:{H}")
    orientation = "portrait" if ar < 0.95 else ("landscape" if ar > 1.05 else "square")
    tags = fmt.get("tags", {}) or {}

    # ---------- frames (constant time base) ----------
    sample_fps, motion_comparable = args.fps, True
    if duration * args.fps > args.max_frames:
        sample_fps = max(0.25, args.max_frames / duration)
        motion_comparable = False
        limitations.append(
            f"Long video: sampling reduced to {sample_fps:.2f} fps, so the motion "
            f"time base is {1 / sample_fps:.2f} s instead of {1 / args.fps:.2f} s. "
            "motion_* is NULL in the master row — it is not comparable with videos "
            "sampled at the standard rate.")
    motion_dt = round(1.0 / sample_fps, 4)

    ff = run(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps={sample_fps}",
              "-q:v", "3", f"{outdir}/frames/fr_%05d.jpg", "-y"])
    frames = sorted(glob.glob(f"{outdir}/frames/fr_*.jpg"))
    if not frames:
        sys.exit(f"Frame extraction produced no frames.\n{ff.stderr.strip()[:400]}")

    cascade = make_face_detector(limitations)
    face_available = cascade is not None
    rows, prev = [], None
    for i, f in enumerate(frames):
        img = cv2.imread(f)
        if img is None:
            continue
        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        # Frame 0 has no predecessor. v2 wrote 0.0, which always landed inside the
        # hook window and deflated hook_motion by a factor of 1/n_hook_frames.
        motion = float(np.mean(cv2.absdiff(gray, prev))) if prev is not None else None
        prev = gray
        if face_available:
            faces = cascade.detectMultiScale(gray, 1.15, 6,
                                             minSize=(max(40, h // 20),) * 2)
            n_faces = int(len(faces))
            face_area = round(float(sum(fw * fh for *_, fw, fh in faces)) / (w * h), 4)
        else:
            n_faces, face_area = None, None
        dom = dominant_hex(img)
        rows.append(dict(
            video_id=vid16, frame_idx=i, timestamp_s=round(i / sample_fps, 3),
            brightness=round(float(gray.mean()) / 255, 4),
            contrast=round(float(gray.std()) / 255, 4),
            saturation=round(float(hsv[:, :, 1].mean()) / 255, 4),
            colorfulness=round(float(colorfulness(img)), 2),
            sharpness=round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2),
            motion_score=round(motion, 3) if motion is not None else None,
            edge_density=round(float(cv2.Canny(gray, 100, 200).mean()) / 255, 4),
            face_count=n_faces, face_area_ratio=face_area,
            dominant_color_1=dom[0][0], dominant_share_1=dom[0][1],
            dominant_color_2=dom[1][0] if len(dom) > 1 else dom[0][0]))
    fr = pd.DataFrame(rows)

    # ---------- OCR ----------
    ocr_available, tesseract_ver, pytesseract_ver = False, "", ""
    ocr = pd.DataFrame(columns=OCR_COLUMNS)
    try:
        import pytesseract
        if shutil.which("tesseract") is None:
            # v2 guarded only ImportError, then shelled out to `tesseract` on the
            # next line — a FileNotFoundError that killed the whole run.
            raise FileNotFoundError("tesseract binary not on PATH")
        pytesseract_ver = getattr(pytesseract, "__version__", "")
        tesseract_ver = str(pytesseract.get_tesseract_version())
        langs = [l for l in run(["tesseract", "--list-langs"]).stdout.splitlines()[1:] if l]
        if langs and args.ocr_lang not in langs:
            limitations.append(
                f"OCR language '{args.ocr_lang}' not installed (have: "
                f"{', '.join(langs)}) — recall for other scripts will be low.")
        step = max(1, int(round(sample_fps)))
        orows = []
        for i, f in enumerate(frames):
            if i % step:
                continue
            gray = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2GRAY)
            h, w = gray.shape
            dd = pytesseract.image_to_data(gray, lang=args.ocr_lang,
                                           output_type=pytesseract.Output.DATAFRAME)
            dd = dd[(dd.conf > 55) & dd.text.notna()]
            dd = dd[dd.text.astype(str).str.strip().str.len() > 1]
            zone = ""
            if len(dd):
                cy = (dd.top + dd.height / 2).mean() / h
                zone = "top" if cy < 0.33 else ("middle" if cy < 0.66 else "bottom")
            orows.append(dict(
                video_id=vid16, schema_version=SCHEMA_VERSION,
                extractor_version=EXTRACTOR_VERSION,
                timestamp_s=round(i / sample_fps, 2),
                ocr_text=" ".join(dd.text.astype(str)).strip(),
                ocr_word_count=len(dd),
                text_area_ratio=(round(float((dd.width * dd.height).sum()) / (w * h), 4)
                                 if len(dd) else 0.0),
                text_zone=zone))
        ocr = pd.DataFrame(orows) if orows else pd.DataFrame(columns=OCR_COLUMNS)
        ocr_available = True
        limitations.append(
            f"OCR sampled ~1 frame/s at conf>55, lang={args.ocr_lang}. Text shown "
            "for under a second, or in an uninstalled script, is missed.")
    except Exception as e:                                       # noqa: BLE001
        limitations.append(
            f"OCR unavailable ({type(e).__name__}: {e}). All OCR columns are NULL, "
            "NOT 0 — do not read this as 'the video has no on-screen text', and do "
            "not score GRW-02 or ACC-01 from it.")

    # ---------- audio ----------
    au, loud, silences, beats = None, {}, [], []
    has_audio = a is not None
    wav = f"{outdir}/_audio.wav"
    if has_audio and run(["ffmpeg", "-v", "error", "-i", src, "-vn", "-ac", "1",
                          "-ar", "16000", wav, "-y"]).returncode == 0 \
            and os.path.exists(wav):
        w = wave.open(wav)
        sr = w.getframerate()
        sig = np.frombuffer(w.readframes(w.getnframes()),
                            dtype=np.int16).astype(np.float32) / 32768.0
        w.close()
        win = int(sr * 0.5)
        arows = []
        for i in range(0, max(1, len(sig) - win // 2), win):
            seg = sig[i:i + win]
            if len(seg) < 16:
                continue
            rms = float(np.sqrt((seg ** 2).mean()))
            spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
            freq = np.fft.rfftfreq(len(seg), 1 / sr)
            tot = spec.sum() + 1e-9
            arows.append(dict(
                sec=int(i / sr),
                audio_dbfs=round(20 * np.log10(rms + 1e-9), 2),
                speech_band_ratio=round(
                    float(spec[(freq >= 300) & (freq <= 3400)].sum() / tot), 4),
                bass_ratio=round(float(spec[freq < 250].sum() / tot), 4)))
        au = pd.DataFrame(arows).groupby("sec").mean().reset_index() if arows else None

        # ebur128 gets its own pass: combined-filter runs returned a bogus -70 LUFS.
        log = run(["ffmpeg", "-i", src, "-af", "ebur128=peak=true",
                   "-f", "null", "-"]).stderr
        tail = log[log.rfind("Summary:"):]

        def grab(pat):
            m = re.search(pat, tail)
            return float(m.group(1)) if m else None

        loud = dict(integrated_lufs=grab(r"I:\s+(-?\d+\.\d+) LUFS"),
                    loudness_range_lu=grab(r"LRA:\s+(-?\d+\.\d+) LU"),
                    true_peak_dbfs=grab(r"Peak:\s+(-?\d+\.\d+) dBFS"))
        slog = run(["ffmpeg", "-i", src, "-af", "silencedetect=n=-35dB:d=0.4",
                    "-f", "null", "-"]).stderr
        silences = [(float(x), float(y)) for x, y in re.findall(
            r"silence_start: (-?\d+\.?\d*)[\s\S]*?silence_end: (-?\d+\.?\d*)", slog)]
        hop, nfft = 512, 1024
        if len(sig) > nfft:
            S = np.array([np.abs(np.fft.rfft(sig[i:i + nfft] * np.hanning(nfft)))
                          for i in range(0, len(sig) - nfft, hop)])
            flux = np.maximum(0, np.diff(S, axis=0)).sum(axis=1)
            if flux.std() > 0:
                flux = (flux - flux.mean()) / flux.std()
            times = np.arange(len(flux)) * hop / sr
            beats = [t for i, t in enumerate(times)
                     if flux[i] > 1.3 and flux[i] == max(flux[max(0, i - 4):i + 5])]
        os.remove(wav)
    else:
        has_audio = False
        limitations.append("No audio stream — all audio columns are NULL, not 0.")

    # ---------- shots ----------
    p = run(["ffmpeg", "-i", src, "-filter:v",
             f"select='gt(scene,{args.scene})',metadata=print:file=-",
             "-f", "null", "-"])
    cuts = sorted(float(x) for x in re.findall(r"pts_time:(\d+\.?\d*)", p.stdout)
                  if 0 < float(x) < duration)
    bounds = [0.0] + cuts + [duration]
    srows = []
    for i in range(len(bounds) - 1):
        s, e = bounds[i], bounds[i + 1]
        sub = fr[(fr.timestamp_s >= s) & (fr.timestamp_s < e)]
        has_motion = len(sub) and sub.motion_score.notna().any()
        srows.append(dict(
            video_id=vid16, schema_version=SCHEMA_VERSION,
            extractor_version=EXTRACTOR_VERSION,
            shot_id=i + 1, start_s=round(s, 2), end_s=round(e, 2),
            duration_s=round(e - s, 2),
            mean_brightness=round(float(sub.brightness.mean()), 4) if len(sub) else None,
            mean_motion=round(float(sub.motion_score.mean()), 3) if has_motion else None,
            has_face=(bool(sub.face_count.sum() > 0)
                      if face_available and len(sub) else None),
            dominant_color=(sub.dominant_color_1.mode().iloc[0]
                            if len(sub) and len(sub.dominant_color_1.mode()) else None)))
    sh = pd.DataFrame(srows).reindex(columns=SHOT_COLUMNS)
    dur_arr = sh.duration_s.to_numpy(dtype=float)

    # ---------- per-second join, reindexed to EVERY second ----------
    fr["sec"] = fr.timestamp_s.astype(int)
    agg = fr.groupby("sec").agg(
        n_frames_in_sec=("frame_idx", "size"),
        brightness=("brightness", "mean"), saturation=("saturation", "mean"),
        colorfulness=("colorfulness", "mean"), sharpness=("sharpness", "mean"),
        motion_score=("motion_score", "mean"), edge_density=("edge_density", "mean"),
        face_count=("face_count", "max"), face_area_ratio=("face_area_ratio", "max"),
        dominant_color=("dominant_color_1",
                        lambda x: x.mode().iloc[0] if len(x.mode()) else None),
    ).reset_index()
    # v2 emitted only the seconds that happened to hold a frame, so a join to a
    # retention-per-second export silently dropped the rest.
    full = pd.DataFrame({"sec": range(0, int(math.ceil(duration)))})
    sec = full.merge(agg, on="sec", how="left")
    sec["n_frames_in_sec"] = sec["n_frames_in_sec"].fillna(0).astype(int)
    if au is not None and len(au):
        sec = sec.merge(au, on="sec", how="left")
    if ocr_available and len(ocr):
        o2 = ocr.copy()
        o2["sec"] = o2.timestamp_s.astype(int)
        sec = sec.merge(o2.groupby("sec").agg(
            ocr_text=("ocr_text", lambda x: " | ".join(t for t in x if t)),
            text_area_ratio=("text_area_ratio", "max")).reset_index(),
            on="sec", how="left")
    cc = (pd.Series([int(c) for c in cuts]).value_counts().rename_axis("sec")
          .reset_index(name="cuts_in_sec")) if cuts else \
        pd.DataFrame(columns=["sec", "cuts_in_sec"])
    sec = sec.merge(cc, on="sec", how="left")
    sec["cuts_in_sec"] = sec["cuts_in_sec"].fillna(0).astype(int)
    sec["video_id"] = vid16
    sec["schema_version"] = SCHEMA_VERSION
    sec["extractor_version"] = EXTRACTOR_VERSION
    sec["param_sample_fps"] = round(sample_fps, 3)
    sec = sec.reindex(columns=TIMELINE_COLUMNS)   # full set, fixed order, always

    # ---------- cut-beat sync ----------
    sync = base = lift = bpm = sync_p = n_synced = None
    if beats and cuts:
        synced = [c for c in cuts if any(abs(c - b) <= BEAT_TOL_S for b in beats)]
        n_synced = len(synced)
        sync = round(100 * n_synced / len(cuts), 1)
        cov = merged_coverage(beats, BEAT_TOL_S, duration)
        base = round(100 * cov, 1) if cov is not None else None
        lift = round(sync - base, 1) if base is not None else None
        # v2 told the analyst any positive lift was craft. On 11 cuts the
        # statistic moves in 9.1 pp steps; without a p-value that is noise.
        sp = binom_sf(n_synced, len(cuts), cov)
        sync_p = round(sp, 4) if sp is not None else None
        ioi = np.diff(beats)
        ioi = ioi[(ioi > 0.25) & (ioi < 1.2)]
        bpm = round(60 / float(np.median(ioi)), 1) if len(ioi) else None

    def hist(img):
        h = cv2.calcHist([cv2.cvtColor(img, cv2.COLOR_BGR2HSV)], [0, 1], None,
                         [40, 40], [0, 180, 0, 256])
        return cv2.normalize(h, h).flatten()

    loop_sim = round(float(cv2.compareHist(hist(cv2.imread(frames[0])),
                                           hist(cv2.imread(frames[-1])),
                                           cv2.HISTCMP_CORREL)), 3)

    # ---------- edge-energy distribution vs platform UI ----------
    # Renamed from "saliency": this is |Laplacian| edge energy. It has no centre
    # bias, no face prior and no colour term, so it is NOT where a viewer looks.
    z = SAFE_ZONES[args.platform]
    safe_area = (1 - z["top"] - z["bottom"]) * (1 - z["left"] - z["right"])
    szrows = []
    for f in frames:
        img = cv2.imread(f)
        h, w = img.shape[:2]
        e = np.abs(cv2.Laplacian(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), cv2.CV_64F))
        tot = e.sum() + 1e-9
        t0, b0 = int(z["top"] * h), int((1 - z["bottom"]) * h)
        l0, r0 = int(z["left"] * w), int((1 - z["right"]) * w)
        # Disjoint by construction: v2's bands overlapped and summed to >1.
        szrows.append(dict(
            top=float(e[:t0].sum()) / tot,
            bottom=float(e[b0:].sum()) / tot,
            left=float(e[t0:b0, :l0].sum()) / tot,
            right=float(e[t0:b0, r0:].sum()) / tot,
            safe=float(e[t0:b0, l0:r0].sum()) / tot))
    sz = {k: round(float(v), 4) for k, v in pd.DataFrame(szrows).mean().items()}
    # 1.0 == exactly what uniform texture would put in the safe box. v2 compared a
    # raw share against 70% when uniform texture alone only scores ~56%.
    sz_index = round(sz["safe"] / safe_area, 3) if safe_area > 0 else None

    hook = fr[fr.timestamp_s < 3]
    rest = fr[fr.timestamp_s >= 3]

    def hv(col):
        if not len(hook) or not len(rest):
            return None, None
        a_, b_ = hook[col].mean(), rest[col].mean()
        return (round(float(a_), 3) if pd.notna(a_) else None,
                round(float(b_), 3) if pd.notna(b_) else None)

    hb, rb = hv("brightness")
    hs_, rs = hv("saturation")
    hc, rc = hv("colorfulness")
    hm, rm = hv("motion_score")
    hsp, rsp = hv("sharpness")

    # ---------- contact sheets ----------
    step = max(1, int(round(sample_fps)))
    thumbs = []
    for i, f in enumerate(frames):
        if i % step:
            continue
        im = Image.open(f).convert("RGB")
        im = im.resize((360, max(1, int(im.height * 360 / im.width))))
        dr = ImageDraw.Draw(im)
        label = f"t={i / sample_fps:.0f}s"
        dr.rectangle([0, 0, 8 + 9 * len(label), 26], fill=(0, 0, 0))
        dr.text((5, 6), label, fill=(255, 255, 0))
        thumbs.append(im)
    n_sheets = 0
    if thumbs:
        tw, th = thumbs[0].size
        for gi in range(0, len(thumbs), 5):
            ch = thumbs[gi:gi + 5]
            canvas = Image.new("RGB", (tw * len(ch), th), (20, 20, 20))
            for j, im in enumerate(ch):
                canvas.paste(im, (j * tw, 0))
            canvas.save(f"{outdir}/contact_sheets/S{gi // 5:02d}.jpg", quality=88)
            n_sheets += 1

    # ---------- flat master row ----------
    def m(c):
        val = fr[c].mean()
        return round(float(val), 4) if pd.notna(val) else None

    def sd(c):
        val = fr[c].std()
        return round(float(val), 4) if pd.notna(val) else None

    dom_mode = fr.dominant_color_1.mode()
    n_ocr_rows = len(ocr) if ocr_available else 0
    n_ocr_with_text = int((ocr.ocr_word_count > 0).sum()) if ocr_available and len(ocr) else 0

    master = dict(
        video_id=vid16, file_sha256=vid_full,
        schema_version=SCHEMA_VERSION, extractor_version=EXTRACTOR_VERSION,
        extracted_at_utc=datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        param_sample_fps=round(sample_fps, 3), param_motion_dt_s=motion_dt,
        param_scene_threshold=args.scene, param_platform=args.platform,
        param_beat_tol_s=BEAT_TOL_S,
        # provenance: which measurements were even possible on this machine
        ocr_available=ocr_available, face_detection_available=face_available,
        motion_comparable=motion_comparable,
        tool_ffmpeg=ffmpeg_version(), tool_opencv=cv2.__version__,
        tool_pandas=pd.__version__, tool_tesseract=tesseract_ver,
        tool_pytesseract=pytesseract_ver,
        source_file=os.path.basename(src),
        sidecar_file=sidecar_name,
        platform=sidecar.get("platform"),
        platform_post_id=sidecar.get("platform_post_id"),
        post_url=sidecar.get("post_url"),
        creator_id=sidecar.get("creator_id"),
        creator_handle=sidecar.get("creator_handle"),
        published_at_utc=sidecar.get("published_at_utc"),
        parent_media_id=sidecar.get("parent_media_id"),
        engagement_likes=sidecar.get("engagement_likes"),
        engagement_comments=sidecar.get("engagement_comments"),
        engagement_views=sidecar.get("engagement_views"),
        engagement_captured_at_utc=sidecar.get("engagement_captured_at_utc"),
        container_creation_time=tags.get("creation_time", ""),
        container_encoder=tags.get("encoder", ""),
        filesize_mb=round(int(fmt["size"]) / 1e6, 3) if fmt.get("size") else None,
        duration_s=round(duration, 2), width=W, height=H,
        aspect_ratio=aspect, orientation=orientation,
        fps=round(native_fps, 2) if native_fps else None,
        video_codec=v.get("codec_name"), pix_fmt=v.get("pix_fmt"),
        has_audio=has_audio,
        audio_codec=a.get("codec_name") if a else None,
        audio_sample_rate=int(a["sample_rate"]) if a and a.get("sample_rate") else None,
        audio_channels=a.get("channels") if a else None,
        bitrate_kbps=round(int(fmt["bit_rate"]) / 1000) if fmt.get("bit_rate") else None,
        n_sampled_frames=len(frames), n_contact_sheets=n_sheets,
        total_cuts=len(cuts), cuts_per_second=round(len(cuts) / duration, 3),
        n_shots=len(dur_arr),
        shot_mean_s=round(float(dur_arr.mean()), 2),
        shot_median_s=round(float(np.median(dur_arr)), 2),
        shot_min_s=round(float(dur_arr.min()), 2),
        shot_max_s=round(float(dur_arr.max()), 2),
        shot_under_0_5s_n=int((dur_arr < 0.5).sum()),
        shot_pct_under_0_5s=round(100 * float((dur_arr < 0.5).mean()), 1),
        shot_under_1s_n=int((dur_arr < 1.0).sum()),
        shot_pct_under_1s=round(100 * float((dur_arr < 1.0).mean()), 1),
        brightness_mean=m("brightness"), brightness_std=sd("brightness"),
        contrast_mean=m("contrast"),
        saturation_mean=m("saturation"), saturation_std=sd("saturation"),
        colorfulness_mean=m("colorfulness"), colorfulness_std=sd("colorfulness"),
        colorfulness_median=round(float(fr.colorfulness.median()), 2),
        sharpness_mean=m("sharpness"), sharpness_std=sd("sharpness"),
        sharpness_median=round(float(fr.sharpness.median()), 2),
        # motion_* is nulled rather than rescaled when the time base changed
        motion_mean=m("motion_score") if motion_comparable else None,
        motion_std=sd("motion_score") if motion_comparable else None,
        motion_median=(round(float(fr.motion_score.median()), 3)
                       if motion_comparable and fr.motion_score.notna().any() else None),
        edge_density_mean=m("edge_density"),
        frames_with_face_n=int((fr.face_count > 0).sum()) if face_available else None,
        frames_with_face_pct=(round(100 * float((fr.face_count > 0).mean()), 1)
                              if face_available else None),
        max_face_area_ratio=(round(float(fr.face_area_ratio.max()), 4)
                             if face_available else None),
        dom_color_1=dom_mode.iloc[0] if len(dom_mode) else None,
        # OCR: numerator + denominator so a corpus can pool instead of averaging
        ocr_frames_sampled=n_ocr_rows if ocr_available else None,
        ocr_frames_with_text=n_ocr_with_text if ocr_available else None,
        seconds_with_text_pct=(round(100 * n_ocr_with_text / n_ocr_rows, 1)
                               if ocr_available and n_ocr_rows else None),
        total_ocr_words=(int(ocr.ocr_word_count.sum())
                         if ocr_available and len(ocr) else None),
        max_text_area_ratio=(round(float(ocr.text_area_ratio.max()), 4)
                             if ocr_available and len(ocr) else None),
        integrated_lufs=loud.get("integrated_lufs"),
        loudness_range_lu=loud.get("loudness_range_lu"),
        true_peak_dbfs=loud.get("true_peak_dbfs"),
        audio_dbfs_mean=(round(float(au.audio_dbfs.mean()), 2)
                         if au is not None and len(au) else None),
        speech_band_ratio_mean=(round(float(au.speech_band_ratio.mean()), 4)
                                if au is not None and len(au) else None),
        bass_ratio_mean=(round(float(au.bass_ratio.mean()), 4)
                         if au is not None and len(au) else None),
        n_silences=len(silences) if has_audio else None,
        silence_total_s=round(sum(e - s for s, e in silences), 2) if has_audio else None,
        bpm_estimate=bpm, n_onsets=len(beats) if has_audio else None,
        n_cuts_tested=len(cuts) if (beats and cuts) else None,
        n_cuts_synced=n_synced,
        cut_beat_sync_pct=sync, cut_beat_sync_baseline_pct=base,
        cut_beat_sync_lift=lift, cut_beat_sync_p=sync_p,
        loop_similarity=loop_sim,
        edge_energy_top=sz["top"], edge_energy_bottom=sz["bottom"],
        edge_energy_left=sz["left"], edge_energy_right=sz["right"],
        edge_energy_safe=sz["safe"], safe_area_fraction=round(safe_area, 4),
        edge_energy_safe_index=sz_index,
        hook_brightness=hb, rest_brightness=rb,
        hook_saturation=hs_, rest_saturation=rs,
        hook_colorfulness=hc, rest_colorfulness=rc,
        hook_motion=hm, rest_motion=rm,
        hook_sharpness=hsp, rest_sharpness=rsp,
        hook_frames_n=int(len(hook)),
    )
    if len(hook) < 4:
        limitations.append(
            f"Hook window holds only {len(hook)} sampled frames — hook_* means are "
            "too thin to compare against rest_*; treat CRD-01/CRD-03 as unscored.")
    if aspect != "9:16":
        limitations.append(
            f"Aspect ratio is {aspect}, not 9:16. Platform UI margins assume a 9:16 "
            "canvas, so edge_energy_* describes a frame the feed never shows. Do "
            "not score GRW-05 from it.")
    limitations.append(
        f"Cut detection used --scene {args.scene}. This threshold is sensitive: on a "
        "synthetic clip with 11 known cuts, 0.2 found 16 and 0.4 found exactly 11. "
        "total_cuts, cuts_per_second and every shot_* column are only comparable "
        "across videos extracted at the SAME param_scene_threshold.")

    pd.DataFrame([master]).to_csv(f"{outdir}/video_master.csv", index=False)
    fr.drop(columns=["sec"]).to_csv(f"{outdir}/frame_features.csv", index=False)
    sec.to_csv(f"{outdir}/timeline_per_second.csv", index=False)
    sh.to_csv(f"{outdir}/shot_list.csv", index=False)
    ocr.reindex(columns=OCR_COLUMNS).to_csv(f"{outdir}/ocr_text.csv", index=False)
    json.dump(dict(master=master, silence_segments=silences, limitations=limitations),
              open(f"{outdir}/analysis.json", "w"), indent=2, default=str)
    open(f"{outdir}/limitations.txt", "w").write(
        "\n".join(f"- {l}" for l in limitations))

    if not args.keep_frames:
        shutil.rmtree(f"{outdir}/frames", ignore_errors=True)

    print(json.dumps(master, indent=1, default=str))
    print(f"\nWrote {outdir}/ — video_id={vid16}, platform={args.platform}. "
          "View contact_sheets/S*.jpg next.")
    if not ocr_available:
        print("NOTE: OCR did not run. OCR columns are NULL. Do NOT score "
              "GRW-02 / ACC-01 — they are unmeasured, not zero.")


if __name__ == "__main__":
    main()
