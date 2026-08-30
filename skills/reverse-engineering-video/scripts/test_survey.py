"""Contract tests for survey_video.py.

shots.csv is read by Stage 3 subagents and by validate_package.py, so its
column set and its tiling property are a contract, not an implementation detail.
"""

import csv
import json
import pathlib
import subprocess
import sys
import tempfile

SCRIPT = pathlib.Path(__file__).parent / "survey_video.py"

COLUMNS = [
    "video_id",
    "shot_id",
    "t_start_s",
    "t_end_s",
    "duration_s",
    "cut_confidence",
    "sample_fps",
    "n_frames_planned",
    "sequence_id",
]


def make_clip(path, segments=("red", "blue", "green"), seconds=2):
    """Solid-colour segments concatenated: len(segments) - 1 guaranteed cuts."""
    inputs = []
    for colour in segments:
        inputs += ["-f", "lavfi", "-i", f"color=c={colour}:s=320x240:d={seconds}"]
    joined = "".join(f"[{i}]" for i in range(len(segments)))
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex",
         f"{joined}concat=n={len(segments)}:v=1:a=0", "-r", "25", str(path)],
        check=True,
    )


def survey(tmp, **flags):
    clip = pathlib.Path(tmp) / "clip.mp4"
    make_clip(clip)
    out = pathlib.Path(tmp) / "survey"
    argv = [sys.executable, str(SCRIPT), str(clip), str(out)]
    for key, value in flags.items():
        argv += [f"--{key.replace('_', '-')}", str(value)]
    subprocess.run(argv, check=True, capture_output=True, text=True)
    return out


def rows(out):
    with (out / "shots.csv").open() as f:
        return list(csv.DictReader(f))


def test_detects_two_cuts_and_writes_contract_columns():
    with tempfile.TemporaryDirectory() as tmp:
        out = survey(tmp)
        got = rows(out)
        assert list(got[0].keys()) == COLUMNS, f"column drift: {list(got[0].keys())}"
        assert len(got) == 3, f"expected 3 shots, got {len(got)}"
        assert float(got[0]["t_start_s"]) == 0.0
        assert abs(float(got[-1]["t_end_s"]) - 6.0) < 0.2


def test_shots_tile_the_file_without_gaps_or_overlaps():
    with tempfile.TemporaryDirectory() as tmp:
        got = rows(survey(tmp))
        for a, b in zip(got, got[1:]):
            assert a["t_end_s"] == b["t_start_s"], (
                f"{a['shot_id']} ends {a['t_end_s']} but {b['shot_id']} "
                f"starts {b['t_start_s']} — the shot list must tile"
            )


def test_sample_fps_follows_the_duration_ladder():
    # A 2.0 s shot sits in the 1.5-5 s band, so 4 fps and 8 planned frames.
    with tempfile.TemporaryDirectory() as tmp:
        got = rows(survey(tmp))
        assert float(got[0]["sample_fps"]) == 4.0
        assert int(got[0]["n_frames_planned"]) == 8


def test_every_shot_gets_at_least_four_frames():
    # Below four frames a push-in and a cut are indistinguishable, which is the
    # failure the whole ladder exists to prevent.
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        make_clip(clip, segments=("red", "blue", "green"), seconds=1)
        out = pathlib.Path(tmp) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)],
                       check=True, capture_output=True)
        for row in rows(out):
            assert int(row["n_frames_planned"]) >= 4, row


def test_probe_and_budget_are_written_for_the_caller_to_read():
    with tempfile.TemporaryDirectory() as tmp:
        out = survey(tmp)
        probe = json.loads((out / "probe.json").read_text())
        for key in ("duration_s", "native_fps", "width", "height", "aspect"):
            assert key in probe, f"probe.json missing {key}"
        budget = (out / "budget.txt").read_text()
        assert "n_shots" in budget and "n_agents" in budget, budget


def test_video_id_is_stable_across_runs_of_the_same_file():
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        make_clip(clip)
        ids = []
        for n in range(2):
            out = pathlib.Path(tmp) / f"survey{n}"
            subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)],
                           check=True, capture_output=True)
            with (out / "shots.csv").open() as f:
                ids.append(next(csv.DictReader(f))["video_id"])
        assert ids[0] == ids[1], "video_id must key the file, not the run"


def test_threshold_controls_sensitivity():
    with tempfile.TemporaryDirectory() as tmp:
        loose = len(rows(survey(tmp, threshold=0.99)))
        assert loose == 1, f"a threshold of 0.99 should find no cuts, got {loose}"


def test_cuts_are_cached_so_a_rerun_at_a_new_threshold_skips_detection():
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        make_clip(clip)
        out = pathlib.Path(tmp) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)],
                       check=True, capture_output=True)
        assert (out / "cuts.csv").is_file()
        assert json.loads((out / "probe.json").read_text())["cuts_reused"] is False
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--threshold", "0.99"], check=True, capture_output=True)
        probe = json.loads((out / "probe.json").read_text())
        assert probe["cuts_reused"] is True, "a threshold change must not re-decode"
        assert probe["n_shots"] == 1, "0.99 keeps no cut, so one shot spans the file"


def test_calibration_table_shows_what_each_threshold_would_produce():
    with tempfile.TemporaryDirectory() as tmp:
        out = survey(tmp)
        table = (out / "calibration.txt").read_text()
        assert "threshold" in table and "n_shots" in table
        rows = [l.split() for l in table.splitlines() if l.strip()
                and l.split()[0].replace(".", "").isdigit()]
        counts = [int(r[1]) for r in rows]
        assert counts == sorted(counts, reverse=True), (
            f"a higher threshold can never yield more shots: {counts}")


def test_a_long_mean_shot_is_flagged_rather_than_passed_downstream():
    # One 30 s take: no cuts, so the mean lands far above the long-take warning.
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        make_clip(clip, segments=("red",), seconds=30)
        out = pathlib.Path(tmp) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out)],
                       check=True, capture_output=True)
        assert "Mean shot is" in (out / "limitations.txt").read_text()


def test_skipping_the_optional_passes_is_recorded_not_silent():
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        make_clip(clip)
        out = pathlib.Path(tmp) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--no-sheets", "--no-audio-map"],
                       check=True, capture_output=True)
        limits = (out / "limitations.txt").read_text()
        assert "--no-sheets" in limits and "--no-audio-map" in limits


def test_a_sheet_has_no_empty_cells_beyond_the_last_frame():
    # A fixed 5x6 grid turned 8 frames from a 9:16 source into a 1600x3414
    # image that was mostly black. A reader pays for those pixels in tokens.
    from PIL import Image
    with tempfile.TemporaryDirectory() as tmp:
        clip = pathlib.Path(tmp) / "clip.mp4"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-f", "lavfi",
             "-i", "color=c=red:s=180x320:d=8", "-r", "25", str(clip)],
            check=True)
        out = pathlib.Path(tmp) / "survey"
        subprocess.run([sys.executable, str(SCRIPT), str(clip), str(out),
                        "--survey-fps", "0.25"], check=True, capture_output=True)
        sheet = next((out / "survey_sheets").glob("S*.jpg"))
        img = Image.open(sheet)
        # 8 s at 0.25 fps is 2 frames, so the grid is 2 cols x 1 row. The thumb
        # is 320 wide and the source is 9:16, so one row is ~569 px tall; the
        # old fixed 5x6 grid would have produced 1600 x ~3414.
        cols, thumb_h = 2, round(320 * 320 / 180)
        assert img.width == 320 * cols, f"width {img.width}, expected {320*cols}"
        rows = img.height / thumb_h
        assert rows < 1.05, (
            f"sheet is {img.width}x{img.height} = {rows:.1f} rows for 2 frames; "
            f"every row past the first is empty cells the reader pays for")


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
