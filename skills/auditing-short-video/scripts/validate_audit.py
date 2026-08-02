#!/usr/bin/env python3
"""
validate_audit.py — check one audit directory against its own contract.

Usage:
    python validate_audit.py <audit_dir> [--strict]

Exits 0 when clean, 1 on any ERROR, and 1 on any WARNING under --strict.

WHY THIS EXISTS. An audit shipped with `objective = sell` — a value that is not
in the `objective` enum, that silently failed to open the Monetization gate so
three items were scored when the rule says they must be `applicable=false`, and
that will match no query filter in any corpus. It rendered to .xlsx and was
presented as a result. The defect was not that a coder typed the wrong token;
coders always will. The defect was that nothing looked.

The controlled vocabularies are PARSED FROM references/taxonomy.md rather than
duplicated here, so the validator cannot drift from the document analysts read.
"""
import argparse
import json
import os
import re
import sys

import pandas as pd

HERE = os.path.dirname(os.path.abspath(__file__))
REFS = os.path.join(os.path.dirname(HERE), "references")

MON_ITEMS = {"MON-01", "MON-02", "MON-03"}
MON_GATE_OBJECTIVES = {"traffic", "lead_gen", "sales"}

EXPECTED_ITEMS = 36


def load_vocab():
    """Parse the authoritative ```enums block in taxonomy.md. One source of
    truth, no heuristics — an earlier prose-scraping parser leaked funnel_stage
    values into objective, which would have let `objective=bottom` validate."""
    t = open(os.path.join(REFS, "taxonomy.md")).read()
    m = re.search(r"```enums\n(.*?)```", t, re.S)
    if not m:
        sys.exit("taxonomy.md has no ```enums block — cannot validate.")
    vocab = {}
    for line in m.group(1).strip().splitlines():
        if ":" not in line:
            continue
        k, _, vals = line.partition(":")
        vocab[k.strip()] = set(vals.split())
    return vocab


class Report:
    def __init__(self):
        self.err, self.warn = [], []

    def error(self, code, msg):
        self.err.append((code, msg))

    def warning(self, code, msg):
        self.warn.append((code, msg))


def check_enums(ad, vocab, r):
    p = os.path.join(ad, "semantic.csv")
    if not os.path.exists(p):
        r.warning("SEM-MISSING", "semantic.csv absent — semantics not coded")
        return None
    df = pd.read_csv(p, dtype=str)
    if df.empty:
        r.error("SEM-EMPTY", "semantic.csv has no row")
        return None
    row = df.iloc[0]
    single = ["subject_domain", "intent", "production_mode", "objective",
              "funnel_stage", "hook_device", "commercial_relationship"]
    for col in single:
        if col not in row.index or pd.isna(row[col]):
            continue
        val = str(row[col]).strip()
        legal = vocab.get(col)
        if legal and val not in legal:
            r.error("ENUM", f"semantic.{col} = '{val}' is not in the enum. "
                            f"Legal: {', '.join(sorted(legal))}")
    for col in ("pull_mechanisms", "platform_targets"):
        if col not in row.index or pd.isna(row[col]):
            continue
        legal = vocab.get(col)
        for tok in str(row[col]).split("|"):
            tok = tok.strip()
            if tok and legal and tok not in legal:
                r.error("ENUM", f"semantic.{col} contains '{tok}', not in the enum")
    return row


def check_gate(ad, sem, r):
    """MUST: objective outside the gate => the three MON items are applicable=false."""
    p = os.path.join(ad, "scores.csv")
    if sem is None or not os.path.exists(p):
        return
    obj = str(sem.get("objective", "")).strip()
    sc = pd.read_csv(p, dtype=str)
    if "item_id" not in sc.columns:
        return
    mon = sc[sc.item_id.isin(MON_ITEMS)]
    applicable = mon[mon.applicable.astype(str).str.lower() == "true"]
    if obj not in MON_GATE_OBJECTIVES and len(applicable):
        r.error("GATE", f"objective='{obj}' does not open the Monetization gate "
                        f"(needs one of {sorted(MON_GATE_OBJECTIVES)}), but "
                        f"{sorted(applicable.item_id)} are applicable=true. "
                        "The denominator is wrong and nothing logged it.")
    if obj in MON_GATE_OBJECTIVES and len(applicable) == 0 and len(mon):
        r.warning("GATE", f"objective='{obj}' opens the Monetization gate but no "
                          "MON item is applicable — confirm that is deliberate.")


def check_scores(ad, vocab, r):
    p = os.path.join(ad, "scores.csv")
    if not os.path.exists(p):
        r.warning("SCORES-MISSING", "scores.csv absent — checklist not scored")
        return
    sc = pd.read_csv(p)
    for col in ("run_id", "coder_id"):
        if col not in sc.columns:
            r.error("PROV", f"scores.csv has no {col}. Without it a second coding "
                            "overwrites the first in the corpus and inter-rater "
                            "agreement cannot be computed.")
    if len(sc) != EXPECTED_ITEMS:
        r.error("COUNT", f"scores.csv has {len(sc)} rows, expected {EXPECTED_ITEMS}")
    if sc.item_id.duplicated().any():
        r.error("DUP", f"duplicate item_id: {sorted(sc.item_id[sc.item_id.duplicated()])}")

    app = sc.applicable.astype(str).str.strip().str.lower()
    bad = sc[~app.isin(("true", "false"))]
    if len(bad):
        r.error("APPLICABLE", f"applicable must be exactly true/false; got "
                              f"{sorted(set(bad.applicable.astype(str)))} on "
                              f"{sorted(bad.item_id)}. Anything else parses as "
                              "false and silently drops the item from BOTH sums.")
    live = sc[app == "true"]
    ns = live[live.score.isna()]
    if len(ns):
        r.error("SCORE-BLANK", f"applicable=true with no score: {sorted(ns.item_id)}. "
                               "The workbook renders a blank score as 0 at full "
                               "weight and prints CRITICAL.")
    rng = live[live.score.notna() & ~live.score.between(0, 5)]
    if len(rng):
        r.error("SCORE-RANGE", f"score outside 0-5: {sorted(rng.item_id)}")
    w = sc[~sc.weight.between(1, 3)]
    if len(w):
        r.error("WEIGHT-RANGE", f"weight outside 1-3: {sorted(w.item_id)}")

    # the action contract
    if "action" in sc.columns:
        need = live[live.score.notna() & (live.score < 5)]
        act = need.action.astype(str).str.strip()
        empty = need[need.action.isna() | (act == "")]
        if len(empty):
            r.error("ACTION", f"{len(empty)} below-benchmark items have no action: "
                              f"{sorted(empty.item_id)}. The checklist calls this "
                              "column a contract; an audit nobody can act on is "
                              "not an audit. For a 4 that needs no edit, write "
                              "the literal 'no change needed'.")
        # a fix invented only to satisfy the column is worse than none
        lazy = need[act.str.lower().isin(("n/a", "none", "-", "tbd"))]
        if len(lazy):
            r.error("ACTION-LAZY", f"placeholder actions on {sorted(lazy.item_id)}; "
                                   "use a real edit or 'no change needed'")
    if "item" in sc.columns:
        ph = sc[sc.item.astype(str).str.match(r"^item [A-Z]{3}-\d\d$")]
        if len(ph):
            r.error("PLACEHOLDER", f"{len(ph)} items carry placeholder text like "
                                   f"'{ph.item.iloc[0]}' instead of the real item.")

    if "evidence_source" in sc.columns:
        es = sc.evidence_source.astype(str).str.strip().str.lower()
        legal_es = vocab.get("evidence_source", set())
        illegal = sorted(set(es[~es.isin(legal_es | {"nan", ""})]))
        if illegal:
            r.error("EVSRC", f"evidence_source values not in the enum: {illegal}. "
                             f"Legal: {sorted(legal_es)}")
        # 'stated' must record an actual answer, not the coder's inference
        st = sc[es == "stated"]
        for _, row in st.iterrows():
            ev = str(row.get("evidence", "")).lower()
            if "not asked" in ev or "unanswered" in ev or "user was not" in ev:
                r.error("EVSRC-STATED",
                        f"{row.item_id} is evidence_source=stated while its own "
                        "evidence says the user was not asked. `stated` means a "
                        "question was asked and answered; fabricating it corrupts "
                        "the one column that tells a reader how much to trust the row.")
    return sc


def check_segments(ad, r):
    p = os.path.join(ad, "segments.csv")
    if not os.path.exists(p):
        return
    sg = pd.read_csv(p).sort_values("seg_idx")
    m = os.path.join(ad, "video_master.csv")
    dur = pd.read_csv(m).duration_s.iloc[0] if os.path.exists(m) else None
    if sg.start_s.iloc[0] != 0:
        r.error("TILE", f"segments must start at 0, got {sg.start_s.iloc[0]}")
    gaps = [(sg.end_s.iloc[i], sg.start_s.iloc[i + 1]) for i in range(len(sg) - 1)
            if abs(sg.end_s.iloc[i] - sg.start_s.iloc[i + 1]) > 1e-6]
    if gaps:
        r.error("TILE", f"segments must tile with no gap or overlap; breaks at {gaps}")
    if dur is not None and abs(sg.end_s.iloc[-1] - dur) > 0.05:
        r.error("TILE", f"last segment ends {sg.end_s.iloc[-1]}, duration is {dur}")
    if (sg.segment_type == "hook_reveal").sum() != 1:
        r.error("TILE", "exactly one hook_reveal segment is required")


def check_provenance(ad, r):
    for t in ("segments.csv", "onscreen_text.csv", "recommendations.csv", "semantic.csv"):
        p = os.path.join(ad, t)
        if not os.path.exists(p):
            continue
        cols = pd.read_csv(p, nrows=0).columns
        for c in ("run_id", "coder_id"):
            if c not in cols:
                r.error("PROV", f"{t} has no {c} — the corpus cannot keep two codings")


def check_master(ad, r):
    p = os.path.join(ad, "video_master.csv")
    if not os.path.exists(p):
        r.error("NO-MASTER", "video_master.csv absent — this is not an audit dir")
        return
    m = pd.read_csv(p).iloc[0]
    if not str(m.get("platform_post_id", "")).strip() or pd.isna(m.get("platform_post_id")):
        r.warning("JOIN", "no platform_post_id: this row cannot be joined to "
                          "platform analytics, and the window closes when the "
                          "post is deleted.")
    if pd.isna(m.get("published_at_utc")) or not str(m.get("published_at_utc", "")).strip():
        r.warning("JOIN", "no published_at_utc: no trend analysis is possible, and "
                          "engagement figures have no age.")
    if pd.isna(m.get("creator_id")) or not str(m.get("creator_id", "")).strip():
        r.warning("JOIN", "no creator_id: every cross-video comparison is a "
                          "between-creator comparison wearing a content label.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audit_dir")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 on warnings as well as errors")
    args = ap.parse_args()
    ad = args.audit_dir
    if not os.path.isdir(ad):
        sys.exit(f"Not a directory: {ad}")

    vocab = load_vocab()
    r = Report()
    check_master(ad, r)
    sem = check_enums(ad, vocab, r)
    check_gate(ad, sem, r)
    check_scores(ad, vocab, r)
    check_segments(ad, r)
    check_provenance(ad, r)

    for code, msg in r.err:
        print(f"ERROR   [{code}] {msg}")
    for code, msg in r.warn:
        print(f"WARNING [{code}] {msg}")
    print(f"\n{os.path.basename(ad.rstrip('/'))}: "
          f"{len(r.err)} error(s), {len(r.warn)} warning(s)")
    if r.err:
        return 1
    if r.warn and args.strict:
        return 1
    print("PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
