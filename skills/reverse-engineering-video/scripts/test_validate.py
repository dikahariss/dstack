"""Tests for validate_package.py — the gate that stops a fabricated package.

Every rule here exists because the failure it catches is invisible downstream:
a hedge dropped on the way into a prompt, a bible key nothing defines, a shot
that quietly has no prompt. None of them look wrong in the delivered prose.
"""

import csv
import json
import pathlib
import subprocess
import sys
import tempfile

SCRIPT = pathlib.Path(__file__).parent / "validate_package.py"

GOOD_DEEP = {
    "video_id": "abc123", "shot_id": "sh0001", "sequence_id": "sq01",
    "t_start_s": "0.000", "t_end_s": "2.400",
    "subject_ref": "CHAR_01", "subject_description": "seated, coat still on",
    "subject_action": "turns toward camera", "subject_position": "frame right",
    "location_ref": "LOC_01", "time_of_day": "dusk", "weather": "clear",
    "set_dressing": "bare table", "background_elements": "window, rain streaks",
    "framing": "medium close", "angle": "eye level",
    "movement": "slow dolly in", "movement_speed": "slow",
    "lens_feel": "reads as a long lens", "depth_of_field": "shallow",
    "focal_length_est": "reads as 85-100mm equivalent",
    "light_source": "practical lamp", "light_direction": "side",
    "light_quality": "soft", "colour_temp_est": "reads tungsten-warm",
    "palette_hex": "#2b1d16;#c88a4a", "grade_name": "reads as warm low-contrast",
    "contrast": "low", "saturation": "muted",
    "playback_speed": "real time", "speed_ramp": "none",
    "speech_text": "", "speech_delivery": "", "sfx_diegetic": "rain on glass",
    "music_state": "absent", "music_change": "none",
    "transition_out": "cut", "transition_duration_s": "0",
    "evidence_optics": "inferred", "evidence_light": "observed",
    "evidence_grade": "inferred", "coder_agent": "agent-3", "run_id": "r001",
}

GOOD_BIBLE = {
    "characters": {"CHAR_01": {"description": "man in a grey overcoat",
                               "appears_in": ["sh0001"]}},
    "locations": {"LOC_01": {"description": "unlit room, rain outside",
                             "appears_in": ["sh0001"]}},
    "props": {},
    "look": {"palette": ["#2b1d16"], "grade_name": "reads as warm",
             "evidence": "inferred"},
    "audio_identity": {"music": "reads as absent", "ambience": "rain",
                       "evidence": "inferred"},
}

GOOD_ASSEMBLY = (
    "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
    "transition_in,transition_duration_s,audio_bed_ref\n"
    "1,sh0001,0.000,2.400,0.000,cut,0,BED_01\n")

GOOD_PROMPTS = "## sh0001\nMedium close, slow dolly in on a man in a grey coat.\n"


def write_pkg(tmp, deep=None, bible=None, assembly=None, prompts=None,
              graphics=None):
    d = pathlib.Path(tmp)
    row = dict(GOOD_DEEP)
    row.update(deep or {})
    with (d / "shots_deep.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(GOOD_DEEP))
        w.writeheader()
        w.writerow(row)
    (d / "bible.json").write_text(json.dumps(
        GOOD_BIBLE if bible is None else bible))
    (d / "assembly.csv").write_text(
        GOOD_ASSEMBLY if assembly is None else assembly)
    (d / "prompts.md").write_text(GOOD_PROMPTS if prompts is None else prompts)
    if graphics is not None:
        (d / "graphics.csv").write_text(graphics)
    return d


def run(d):
    return subprocess.run([sys.executable, str(SCRIPT), str(d)],
                          capture_output=True, text=True)


def test_accepts_a_well_formed_package():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp))
        assert r.returncode == 0, r.stderr


def test_rejects_an_inferred_field_stated_as_fact():
    # The entire point of the tier: `inferred` may not be asserted.
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"focal_length_est": "85mm"}))
        assert r.returncode == 1
        assert "focal_length_est" in r.stderr


def test_accepts_a_qualitative_inferred_value_without_a_hedge():
    # "muted" cannot be mistaken for a measurement; only a figure can.
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"grade_name": "warm low-contrast",
                                "saturation": "muted", "contrast": "low"}))
        assert r.returncode == 0, r.stderr


def test_rejects_a_kelvin_figure_stated_as_fact():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"evidence_light": "inferred",
                                "colour_temp_est": "3200K"}))
        assert r.returncode == 1 and "colour_temp_est" in r.stderr


def test_rejects_a_filled_field_whose_tier_says_unknown():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"evidence_light": "unknown"}))
        assert r.returncode == 1
        assert "unknown" in r.stderr and "light_source" in r.stderr


def test_accepts_unknown_when_the_group_is_actually_empty():
    # A 2D graphic: no lens, no lamp. Empty plus `unknown` is the correct row.
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {
            "evidence_optics": "unknown", "lens_feel": "",
            "depth_of_field": "", "focal_length_est": ""}))
        assert r.returncode == 0, r.stderr


def test_rejects_an_illegal_evidence_tier():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"evidence_grade": "probably"}))
        assert r.returncode == 1 and "probably" in r.stderr


def test_rejects_a_bible_reference_no_bible_entry_defines():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"subject_ref": "CHAR_99"}))
        assert r.returncode == 1 and "CHAR_99" in r.stderr


def test_accepts_a_prop_as_the_subject_of_a_shot():
    # A shot whose subject is an object, not a person: a plant on a stand, a
    # machine forming a pot. Forcing subject_ref into `characters` would make
    # such a shot record an empty subject.
    with tempfile.TemporaryDirectory() as tmp:
        bible = json.loads(json.dumps(GOOD_BIBLE))
        bible["props"]["PROP_01"] = {"description": "a hydraulic press",
                                     "appears_in": ["sh0001"]}
        r = run(write_pkg(tmp, {"subject_ref": "PROP_01"}, bible=bible))
        assert r.returncode == 0, r.stderr


def test_still_rejects_a_subject_ref_no_section_defines():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"subject_ref": "THING_99"}))
        assert r.returncode == 1 and "THING_99" in r.stderr


def test_rejects_a_deep_row_missing_run_id():
    # Without run_id a second reading silently overwrites the first, and the
    # disagreement between two readings is the most useful signal a re-read has.
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"run_id": ""}))
        assert r.returncode == 1 and "run_id" in r.stderr


def test_rejects_a_deep_row_missing_coder_agent():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"coder_agent": ""}))
        assert r.returncode == 1 and "coder_agent" in r.stderr


def test_rejects_an_assembly_row_naming_a_shot_that_does_not_exist():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, assembly=(
            "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
            "transition_in,transition_duration_s,audio_bed_ref\n"
            "1,sh9999,0.000,2.400,0.000,cut,0,BED_01\n")))
        assert r.returncode == 1 and "sh9999" in r.stderr


def test_rejects_a_shot_absent_from_the_assembly():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, assembly=(
            "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
            "transition_in,transition_duration_s,audio_bed_ref\n")))
        assert r.returncode == 1 and "sh0001" in r.stderr


def test_rejects_a_duplicate_order_index():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, assembly=(
            "order_index,shot_id,source_in_s,source_out_s,timeline_in_s,"
            "transition_in,transition_duration_s,audio_bed_ref\n"
            "1,sh0001,0.000,2.400,0.000,cut,0,BED_01\n"
            "1,sh0001,0.000,2.400,2.400,cut,0,BED_01\n")))
        assert r.returncode == 1 and "order_index" in r.stderr


def test_rejects_a_shot_with_no_prompt():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, prompts="## nothing here\n"))
        assert r.returncode == 1 and "sh0001" in r.stderr


def test_rejects_speech_delivery_without_speech_text():
    # A delivery note on a line nobody transcribed is a paraphrase in disguise.
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"speech_delivery": "urgent, clipped"}))
        assert r.returncode == 1 and "speech" in r.stderr


def test_rejects_a_graphics_row_with_no_text():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, graphics=(
            "t_start_s,t_end_s,text,text_role,position_band,font_character,"
            "animation_in,animation_out,evidence_source\n"
            "1.0,3.0,,title,centre,heavy grotesque,fade,cut,vision\n")))
        assert r.returncode == 1 and "text" in r.stderr


def test_reports_every_violation_not_just_the_first():
    with tempfile.TemporaryDirectory() as tmp:
        r = run(write_pkg(tmp, {"run_id": "", "coder_agent": "",
                                "focal_length_est": "85mm"}))
        assert r.returncode == 1
        for expected in ("run_id", "coder_agent", "focal_length_est"):
            assert expected in r.stderr, f"{expected} not reported"


def test_missing_required_file_fails_loudly():
    with tempfile.TemporaryDirectory() as tmp:
        d = write_pkg(tmp)
        (d / "bible.json").unlink()
        r = run(d)
        assert r.returncode == 1 and "bible.json" in r.stderr


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
