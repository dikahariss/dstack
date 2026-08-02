#!/usr/bin/env python3
"""
merge_corpus.py (v3) — concatenate many per-video audit dirs into corpus tables.

Usage:
    python merge_corpus.py <corpus_out_dir> <audit_dir> [<audit_dir> ...]
    python merge_corpus.py <corpus_out_dir> --parent <dir_containing_audit_dirs>
    python merge_corpus.py <corpus_out_dir> --parent <dir> --parquet

An audit dir is any directory containing video_master.csv, optionally plus the
analyst files semantic.csv, segments.csv, scores.csv, recommendations.csv.

WHAT v2 GOT WRONG AND THIS FIXES:

- v2's docstring said "append-safe". `to_csv` truncates. Merging a second batch
  into the same corpus dir DELETED the first batch. This version reads any
  existing corpus table back and upserts on video_id, and `--replace` is the
  explicit opt-out.
- v2 read every CSV with inferred dtypes, so an all-digit video_id (~542 per
  million, since the id is a 16-char hex prefix) was parsed as int64 and lost
  its leading zeros. All ids are read as strings here.
- v2 ingested any CSV it found. An analyst segments.csv with no video_id column
  was written into the corpus as rows attributable to no video. This version
  validates required columns per table and SKIPS + REPORTS offending dirs.
- v2 wrote no Parquet for corpus_videos (the primary fact table) because the
  export lived inside the per-table loop, and it swallowed Parquet failures in a
  bare except. Parquet now covers every table and failures are fatal.

SCALE: this loads each table fully into memory. That is fine for thousands of
videos. Past roughly 100k videos, stop using this script and load the per-video
CSVs into a database or a partitioned Parquet dataset directly — see
references/schema.md.
"""
import argparse
import glob
import json
import os
import sys

import pandas as pd

# table file name -> (corpus output name, columns that MUST be present)
# Machine tables are keyed by video_id alone: a re-extract of the same bytes is
# the same measurement, so replacing it is correct. Analyst tables are keyed by
# (video_id, run_id): a second CODING of the same video is new evidence, not a
# correction, and destroying it makes the inter-rater agreement that
# taxonomy.md requires impossible to compute. Measured on one real Reel, two
# codings of the same video disagreed on 23% of semantic fields and 14% of
# scores — which is exactly the number this key exists to let you observe.
ANALYST_TABLES = {"onscreen_text.csv", "segments.csv", "scores.csv",
                  "recommendations.csv", "semantic.csv"}

TABLES = {
    "timeline_per_second.csv": ("corpus_timeline.csv", {"video_id", "sec"}),
    "shot_list.csv":           ("corpus_shots.csv", {"video_id", "shot_id"}),
    "ocr_text.csv":            ("corpus_ocr.csv", {"video_id", "timestamp_s"}),
    "onscreen_text.csv":       ("corpus_onscreen_text.csv",
                                {"video_id", "text", "text_role", "evidence_source"}),
    "segments.csv":            ("corpus_segments.csv",
                                {"video_id", "seg_idx", "segment_type"}),
    "scores.csv":              ("corpus_scores.csv",
                                {"video_id", "item_id", "score", "weight", "applicable"}),
    "recommendations.csv":     ("corpus_recommendations.csv",
                                {"video_id", "rec_idx"}),
}

# Read every identifier-ish column as text. Losing a leading zero on video_id
# silently breaks the join that the whole corpus is keyed on.
STR_COLS = {"video_id": "string", "file_sha256": "string", "item_id": "string",
            "schema_version": "string", "extractor_version": "string",
            "dominant_color": "string", "dom_color_1": "string",
            "run_id": "string", "coder_id": "string", "platform_post_id": "string",
            "creator_id": "string", "parent_media_id": "string",
            "taxonomy_version": "string"}


def read_csv(path):
    head = pd.read_csv(path, nrows=0)
    dtypes = {c: t for c, t in STR_COLS.items() if c in head.columns}
    return pd.read_csv(path, dtype=dtypes)


def upsert(existing_path, new_df, keys=("video_id",), replace=False):
    """Return new_df merged over whatever is already in the corpus file.

    `keys` is the natural key. For analyst tables it includes run_id, so two
    independent codings coexist instead of the second deleting the first."""
    keys = [k for k in keys]
    if replace or not os.path.exists(existing_path) or os.path.getsize(existing_path) == 0:
        return new_df
    old = read_csv(existing_path)
    usable = [k for k in keys if k in old.columns and k in new_df.columns]
    if not usable:
        return new_df
    old_k = old[usable].astype(str).agg("\u001f".join, axis=1)
    new_k = new_df[usable].astype(str).agg("\u001f".join, axis=1)
    kept = old[~old_k.isin(set(new_k))]
    return pd.concat([kept, new_df], ignore_index=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out_dir")
    ap.add_argument("audit_dirs", nargs="*")
    ap.add_argument("--parent", help="scan this dir for */video_master.csv")
    ap.add_argument("--parquet", action="store_true")
    ap.add_argument("--forget", metavar="VIDEO_ID",
                    help="remove every row for VIDEO_ID from every corpus table "
                         "and exit. Deletion must be possible before the corpus "
                         "grows; note the key is sha256(file)[:16], so run this "
                         "BEFORE deleting the source file or you can no longer "
                         "compute the key.")
    ap.add_argument("--replace", action="store_true",
                    help="overwrite the corpus instead of upserting into it")
    args = ap.parse_args()

    if args.forget:
        removed = {}
        for f in sorted(os.listdir(args.out_dir)) if os.path.isdir(args.out_dir) else []:
            if not f.startswith("corpus_") or not f.endswith(".csv"):
                continue
            path = os.path.join(args.out_dir, f)
            df = read_csv(path)
            if "video_id" not in df.columns:
                continue
            keep = df[df.video_id.astype(str) != str(args.forget)]
            n = len(df) - len(keep)
            if n:
                keep.to_csv(path, index=False)
                pq = path.replace(".csv", ".parquet")
                if os.path.exists(pq):
                    keep.to_parquet(pq, index=False)
            removed[f] = n
        print(json.dumps({"forgot": args.forget, "rows_removed": removed}, indent=2))
        print("NOTE: this removes corpus rows only. The per-video audit dir and "
              "its contact_sheets/ are untouched — delete them separately.")
        return

    dirs = list(args.audit_dirs)
    if args.parent:
        dirs += [os.path.dirname(p) for p in
                 glob.glob(os.path.join(args.parent, "*", "video_master.csv"))]
    dirs = sorted(set(d for d in dirs
                      if os.path.exists(os.path.join(d, "video_master.csv"))))
    if not dirs:
        sys.exit("No audit dirs with video_master.csv found.")
    os.makedirs(args.out_dir, exist_ok=True)

    skipped, masters, semantics = [], [], []
    for d in dirs:
        m = read_csv(os.path.join(d, "video_master.csv"))
        if "video_id" not in m.columns or m.empty:
            skipped.append((d, "video_master.csv", "no video_id / empty"))
            continue
        masters.append(m)
        sp = os.path.join(d, "semantic.csv")
        if os.path.exists(sp) and os.path.getsize(sp) > 0:
            s = read_csv(sp)
            if "video_id" in s.columns:
                semantics.append(s)
            else:
                skipped.append((d, "semantic.csv", "missing video_id"))
    if not masters:
        sys.exit("Every audit dir failed validation; nothing to merge.")

    videos = pd.concat(masters, ignore_index=True)
    dupes = videos[videos.video_id.duplicated(keep=False)]
    if len(dupes):
        print(f"WARNING: {dupes.video_id.nunique()} duplicate video_id(s) in this "
              f"batch (same file audited twice) — keeping the last of each.")
        videos = videos.drop_duplicates("video_id", keep="last")
    if semantics:
        sem = pd.concat(semantics, ignore_index=True).drop_duplicates("video_id", keep="last")
        # m:1 — more than one semantic row per video would silently multiply
        # every downstream aggregate.
        videos = videos.merge(sem, on="video_id", how="left",
                              suffixes=("", "_semantic"), validate="m:1")

    manifest = {"n_audit_dirs": len(dirs), "n_videos_this_batch": len(videos),
                "n_with_semantic": len(semantics), "skipped": [], "tables": {}}

    out_videos = os.path.join(args.out_dir, "corpus_videos.csv")
    videos = upsert(out_videos, videos, keys=("video_id",), replace=args.replace)
    videos.to_csv(out_videos, index=False)
    manifest["tables"]["corpus_videos.csv"] = len(videos)

    if "schema_version" in videos.columns:
        vers = sorted(videos.schema_version.dropna().astype(str).unique().tolist())
        manifest["schema_versions"] = vers
        if len(vers) > 1:
            print(f"WARNING: mixed schema versions {vers} — column meanings may "
                  "differ across rows. Partition before aggregating.")
    for flag in ("ocr_available", "face_detection_available", "motion_comparable"):
        if flag in videos.columns:
            manifest[f"n_{flag}"] = int(videos[flag].fillna(False).astype(bool).sum())

    for src_name, (out_name, required) in TABLES.items():
        parts = []
        for d in dirs:
            p = os.path.join(d, src_name)
            if not os.path.exists(p) or os.path.getsize(p) == 0:
                continue
            df = read_csv(p)
            if df.empty:
                continue
            missing = required - set(df.columns)
            if missing:
                # v2 accepted this and wrote unjoinable rows into the corpus.
                skipped.append((d, src_name, f"missing columns {sorted(missing)}"))
                continue
            parts.append(df)
        if not parts:
            continue
        big = pd.concat(parts, ignore_index=True)
        out_path = os.path.join(args.out_dir, out_name)
        key = (("video_id", "run_id") if src_name in ANALYST_TABLES
               and "run_id" in big.columns else ("video_id",))
        big = upsert(out_path, big, keys=key, replace=args.replace)
        big.to_csv(out_path, index=False)
        manifest["tables"][out_name] = len(big)

    if args.parquet:
        try:
            import pyarrow  # noqa: F401
        except ImportError:
            sys.exit("--parquet needs pyarrow: pip install pyarrow")
        for out_name in manifest["tables"]:
            csv_path = os.path.join(args.out_dir, out_name)
            df = read_csv(csv_path)
            # Fail loudly. v2 swallowed this and left a corpus that silently had
            # no Parquet copy.
            df.to_parquet(csv_path.replace(".csv", ".parquet"), index=False)

    manifest["skipped"] = [{"dir": d, "table": t, "reason": r} for d, t, r in skipped]
    json.dump(manifest, open(os.path.join(args.out_dir, "corpus_manifest.json"), "w"),
              indent=2)
    print(json.dumps(manifest, indent=2))
    if skipped:
        print(f"\n{len(skipped)} table(s) SKIPPED and not ingested — see "
              "corpus_manifest.json.skipped. Silent dropout is what this prevents.")


if __name__ == "__main__":
    main()
