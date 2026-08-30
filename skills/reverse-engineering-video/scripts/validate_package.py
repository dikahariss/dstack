#!/usr/bin/env python3
"""Gate the package before it is delivered.

Every rule here catches a failure that is invisible in the finished prose: a
hedge dropped between the data and the prompt, a bible key nothing defines, a
shot that quietly has no prompt at all. Exits 1 and names every violation, not
just the first — a validator that stops at the first error turns one fix into
many round trips.
"""

import argparse
import csv
import json
import pathlib
import re
import sys

TIERS = ("observed", "inferred", "unknown")

# Which fields each evidence column governs. Closed by design: these three
# groups are the ones a frame cannot measure directly, and adding a fourth
# changes what `shots_deep.csv` rows from two runs mean when unioned.
TIER_GROUPS = {
    "evidence_optics": ("lens_feel", "depth_of_field", "focal_length_est"),
    "evidence_light": ("light_source", "light_direction", "light_quality",
                       "colour_temp_est"),
    "evidence_grade": ("grade_name", "contrast", "saturation"),
}

# An inferred field carrying a NUMBER must read as a reading. The danger in an
# inferred field is false precision, and false precision is numeric: "85mm" and
# "3200K" look like measurements a frame cannot yield, while "shallow" and
# "muted" are plainly qualitative and cannot be mistaken for one.
HEDGES = ("reads as", "reads ", "approximately", "approx", "about ",
          "looks like", "appears", "suggests", "consistent with", "~")

REQUIRED_FILES = ("shots_deep.csv", "bible.json", "assembly.csv", "prompts.md")

ASSEMBLY_COLUMNS = ["order_index", "shot_id", "source_in_s", "source_out_s",
                    "timeline_in_s", "transition_in", "transition_duration_s",
                    "audio_bed_ref"]

GRAPHICS_COLUMNS = ["t_start_s", "t_end_s", "text", "text_role",
                    "position_band", "font_character", "animation_in",
                    "animation_out", "evidence_source"]


def hedged(value):
    low = value.lower()
    return any(marker in low for marker in HEDGES)


def check_tiers(row, where, problems):
    for column, fields in TIER_GROUPS.items():
        tier = (row.get(column) or "").strip()
        if tier not in TIERS:
            problems.append(f"{where}: {column}={tier!r} is not one of {TIERS}")
            continue
        filled = [(f, row.get(f, "").strip()) for f in fields
                  if (row.get(f) or "").strip()]
        if tier == "unknown" and filled:
            names = ", ".join(f for f, _ in filled)
            problems.append(
                f"{where}: {column}=unknown but {names} carries a value. "
                f"Either the group is unknown and empty, or it is a reading.")
        if tier == "inferred":
            for field, value in filled:
                if any(ch.isdigit() for ch in value) and not hedged(value):
                    problems.append(
                        f"{where}: {field}={value!r} states a figure as fact "
                        f"while {column}=inferred. A frame does not carry its "
                        f'EXIF — hedge it (e.g. "reads as {value}") or change '
                        f"the tier.")


def check_provenance(row, where, problems):
    for column in ("run_id", "coder_agent"):
        if not (row.get(column) or "").strip():
            problems.append(
                f"{where}: {column} is empty. It is part of the key — without "
                f"it a second reading of this video overwrites the first.")


def check_speech(row, where, problems):
    text = (row.get("speech_text") or "").strip()
    delivery = (row.get("speech_delivery") or "").strip()
    if delivery and not text and delivery != "unintelligible":
        problems.append(
            f"{where}: speech_delivery={delivery!r} with an empty speech_text. "
            f"A delivery note on an untranscribed line is a paraphrase in "
            f"disguise; use speech_delivery=unintelligible instead.")


def check_bible_refs(row, where, bible, problems):
    for column, section in (("subject_ref", "characters"),
                            ("location_ref", "locations"),
                            ("prop_ref", "props")):
        key = (row.get(column) or "").strip()
        if key and key not in bible.get(section, {}):
            problems.append(
                f"{where}: {column}={key} but bible.json {section} defines no "
                f"such key. Propose it, do not invent it.")


def check_assembly(path, shot_ids, problems):
    with path.open() as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != ASSEMBLY_COLUMNS:
            problems.append(
                f"assembly.csv: columns {reader.fieldnames} do not match the "
                f"contract {ASSEMBLY_COLUMNS}")
            return
        rows = list(reader)
    seen_order, placed = set(), set()
    for i, row in enumerate(rows, start=2):
        where = f"assembly.csv:{i}"
        shot = (row.get("shot_id") or "").strip()
        if shot not in shot_ids:
            problems.append(
                f"{where}: shot_id={shot} is not in shots_deep.csv")
        else:
            placed.add(shot)
        order = (row.get("order_index") or "").strip()
        if order in seen_order:
            problems.append(f"{where}: order_index={order} is duplicated; "
                            f"two clips cannot hold one timeline position")
        seen_order.add(order)
    for missing in sorted(shot_ids - placed):
        problems.append(
            f"assembly.csv: {missing} has no row. A shot with no place on the "
            f"timeline cannot be reassembled.")


def check_graphics(path, problems):
    with path.open() as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != GRAPHICS_COLUMNS:
            problems.append(
                f"graphics.csv: columns {reader.fieldnames} do not match the "
                f"contract {GRAPHICS_COLUMNS}")
            return
        for i, row in enumerate(reader, start=2):
            if not (row.get("text") or "").strip():
                problems.append(
                    f"graphics.csv:{i}: text is empty. A graphics row with no "
                    f"text records nothing.")


def check_prompts(path, shot_ids, problems):
    body = path.read_text()
    for shot in sorted(shot_ids):
        if not re.search(rf"(?m)^#+\s*{re.escape(shot)}\b", body):
            problems.append(
                f"prompts.md: no section for {shot}. Every shot in "
                f"shots_deep.csv needs a prompt, or it cannot be regenerated.")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("package_dir")
    args = ap.parse_args()

    pkg = pathlib.Path(args.package_dir).expanduser().resolve()
    problems = []

    for name in REQUIRED_FILES:
        if not (pkg / name).is_file():
            problems.append(f"{name} is missing from {pkg}")
    if problems:
        for problem in problems:
            print(problem, file=sys.stderr)
        print(f"\n{len(problems)} problem(s). Package not deliverable.",
              file=sys.stderr)
        return 1

    try:
        bible = json.loads((pkg / "bible.json").read_text())
    except json.JSONDecodeError as exc:
        print(f"bible.json is not valid JSON: {exc}", file=sys.stderr)
        return 1

    with (pkg / "shots_deep.csv").open() as f:
        deep = list(csv.DictReader(f))
    if not deep:
        print("shots_deep.csv has no rows", file=sys.stderr)
        return 1

    shot_ids = set()
    for i, row in enumerate(deep, start=2):
        where = f"shots_deep.csv:{i}"
        shot = (row.get("shot_id") or "").strip()
        if not shot:
            problems.append(f"{where}: shot_id is empty")
            continue
        if shot in shot_ids:
            problems.append(f"{where}: shot_id={shot} is duplicated")
        shot_ids.add(shot)
        check_tiers(row, where, problems)
        check_provenance(row, where, problems)
        check_speech(row, where, problems)
        check_bible_refs(row, where, bible, problems)

    check_assembly(pkg / "assembly.csv", shot_ids, problems)
    check_prompts(pkg / "prompts.md", shot_ids, problems)
    if (pkg / "graphics.csv").is_file():
        check_graphics(pkg / "graphics.csv", problems)

    if problems:
        for problem in problems:
            print(problem, file=sys.stderr)
        print(f"\n{len(problems)} problem(s). Package not deliverable.",
              file=sys.stderr)
        return 1

    print(f"OK — {len(deep)} shots, all tiers consistent, every shot placed "
          f"and prompted.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
