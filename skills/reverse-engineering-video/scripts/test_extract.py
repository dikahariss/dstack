"""Contract tests for extract_shots.py.

Stage 3 agents read what this writes. The planned frame count in shots.csv is a
promise; an extractor that quietly delivers fewer frames, or more, breaks the
budget arithmetic every fan-out decision rests on.
"""

import csv
import pathlib
import subprocess
import sys
import tempfile

from test_survey import make_clip

SCRIPT = pathlib.Path(__file__).parent / "extract_shots.py"
SURVEY = pathlib.Path(__file__).parent / "survey_video.py"


def surveyed(tmp, seconds=2, with_audio=True):
    clip = pathlib.Path(tmp) / "clip.mp4"
    if with_audio:
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y",
             "-f", "lavfi", "-i", "color=c=red:s=320x240:d=2",
             "-f", "lavfi", "-i", "color=c=blue:s=320x240:d=2",
             "-f", "lavfi", "-i", "color=c=green:s=320x240:d=2",
             "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds * 3}",
             "-filter_complex", "[0][1][2]concat=n=3:v=1:a=0[v]",
             "-map", "[v]", "-map", "3:a", "-r", "25", "-shortest", str(clip)],
            check=True)
    else:
        make_clip(clip, seconds=seconds)
    out = pathlib.Path(tmp) / "survey"
    subprocess.run([sys.executable, str(SURVEY), str(clip), str(out)],
                   check=True, capture_output=True)
    return clip, out


def rows(out):
    with (out / "shots.csv").open() as f:
        return list(csv.DictReader(f))


def extract(clip, out, *extra):
    return subprocess.run(
        [sys.executable, str(SCRIPT), str(clip), str(out), *extra],
        capture_output=True, text=True)


def test_extracts_exactly_n_frames_planned_per_shot():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        assert extract(clip, out, "--shots", "0-2").returncode == 0
        for row in rows(out):
            frames = sorted((out / "shots" / row["shot_id"]).glob("f*.jpg"))
            assert len(frames) == int(row["n_frames_planned"]), (
                f"{row['shot_id']}: extracted {len(frames)}, "
                f"planned {row['n_frames_planned']}")


def test_writes_one_audio_slice_per_shot_matching_the_shot_window():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        assert extract(clip, out, "--shots", "0-2").returncode == 0
        for row in rows(out):
            wav = out / "shots" / row["shot_id"] / "audio.wav"
            assert wav.exists(), f"{row['shot_id']}: no audio slice"
            dur = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", str(wav)],
                capture_output=True, text=True).stdout.strip()
            assert abs(float(dur) - float(row["duration_s"])) < 0.15, (
                f"{row['shot_id']}: audio {dur}s vs shot {row['duration_s']}s")


def test_refuses_a_slice_whose_budget_exceeds_the_cap():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        r = extract(clip, out, "--shots", "0-2", "--max-frames", "5")
        assert r.returncode == 2, "an over-budget slice must refuse, not truncate"
        assert "0-2" in r.stderr and "5" in r.stderr, (
            "the refusal must name the range and the cap so the caller re-splits")


def test_writes_one_contact_sheet_per_shot():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        assert extract(clip, out, "--shots", "0-2").returncode == 0
        sheets = sorted((out / "shots").rglob("sheet.jpg"))
        assert len(sheets) == 3, f"expected 3 sheets, got {len(sheets)}"


def test_a_partial_slice_touches_only_its_own_shots():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        assert extract(clip, out, "--shots", "1-1").returncode == 0
        present = sorted(p.name for p in (out / "shots").iterdir() if p.is_dir())
        assert present == ["sh0001"], f"slice leaked: {present}"


def test_records_the_slice_manifest_an_agent_reports_against():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        assert extract(clip, out, "--shots", "0-1").returncode == 0
        manifest = out / "shots" / "slice_0-1.json"
        assert manifest.exists(), "no manifest for the slice"
        import json
        data = json.loads(manifest.read_text())
        assert data["shot_ids"] == ["sh0000", "sh0001"]
        assert data["n_frames_extracted"] > 0


def test_missing_shots_csv_fails_loudly():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp)
        (out / "shots.csv").unlink()
        r = extract(clip, out, "--shots", "0-2")
        assert r.returncode != 0 and "shots.csv" in r.stderr


def test_a_video_without_audio_still_extracts_frames():
    with tempfile.TemporaryDirectory() as tmp:
        clip, out = surveyed(tmp, with_audio=False)
        r = extract(clip, out, "--shots", "0-2")
        assert r.returncode == 0, r.stderr
        assert sorted((out / "shots" / "sh0000").glob("f*.jpg"))
        assert not (out / "shots" / "sh0000" / "audio.wav").exists()
        assert "no audio stream" in (out / "shots" / "limitations.txt").read_text()


def main():
    failures = 0
    for name, fn in sorted(globals().items()):
        if not name.startswith("test_"):
            continue
        try:
            fn()
            print(f"  pass  {name}")
        except Exception as exc:  # noqa: BLE001 - test runner
            failures += 1
            print(f"  FAIL  {name}: {exc}")
    print(f"\n{failures} failed")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
