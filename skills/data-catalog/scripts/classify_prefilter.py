#!/usr/bin/env python3
"""
classify_prefilter.py — deterministic IN/OUT pre-classifier for the
/data-catalog skill (Stage 1).

Given a list of table names (one per line, from stdin or a file), emit a
classification per table:

    KEEP  — reference or audit/history data; in-scope by rule
    DROP  — framework / backup / temp / session / cache; out-of-scope by rule
    GREY  — no rule matched; hand to LLM judgment

Only GREY tables need LLM reasoning. This keeps the bulk of a 40+ app
estate off the model (the hybrid split).

Usage:
    python classify_prefilter.py < tables.txt
    python classify_prefilter.py tables.txt
    python classify_prefilter.py tables.txt --json

Schema-qualified names ("public.django_session") are accepted; only the
table part is matched. Matching is case-insensitive. First rule wins.
"""
from __future__ import annotations

import json
import re
import sys

# Ordered rules: first match wins. (label, reason, regex)
RULES = [
    ("DROP", "framework table",       r"^(django_|auth_|alembic_|flyway_|knex_|sequelize)"),
    ("DROP", "migration bookkeeping", r"(^|_)migrations?($|_)"),
    ("DROP", "backup copy",           r"(^|_)(bak|backup|bkp|old|copy)($|_|\d)"),
    ("DROP", "temp/scratch",          r"(^|_)(tmp|temp|scratch|dummy)($|_|\d)"),
    ("DROP", "session/cache/queue",   r"(^|_)(session|sessions|cache|celery|jobqueue)($|_)"),
    ("KEEP", "audit/history",         r"_(audit|history|hist|log|changelog)$"),
    ("KEEP", "reference/lookup",      r"^(master_|ref_|lookup_|kode_|kd_)"),
]
COMPILED = [(label, reason, re.compile(pat, re.IGNORECASE)) for label, reason, pat in RULES]


def table_part(name: str) -> str:
    """Strip schema qualifier and quoting; return the bare table name."""
    name = name.strip().strip('"').strip("`")
    return name.split(".")[-1] if "." in name else name


def classify(name: str) -> tuple[str, str]:
    table = table_part(name)
    if not table:
        return ("GREY", "empty name")
    for label, reason, pattern in COMPILED:
        if pattern.search(table):
            return (label, reason)
    return ("GREY", "no rule matched — needs LLM judgment")


def main(argv: list[str]) -> int:
    as_json = "--json" in argv
    paths = [a for a in argv[1:] if not a.startswith("-")]
    if paths:
        with open(paths[0], encoding="utf-8") as handle:
            lines = handle.read().splitlines()
    else:
        lines = sys.stdin.read().splitlines()

    rows: list[dict[str, str]] = []
    counts = {"KEEP": 0, "DROP": 0, "GREY": 0}
    for line in lines:
        if not line.strip():
            continue
        label, reason = classify(line)
        counts[label] += 1
        rows.append({"table": line.strip(), "class": label, "reason": reason})

    if as_json:
        json.dump({"summary": counts, "rows": rows}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    else:
        for row in rows:
            sys.stdout.write(f"{row['table']}\t{row['class']}\t{row['reason']}\n")
        total = sum(counts.values())
        grey = counts["GREY"]
        pct = (grey / total * 100) if total else 0
        sys.stderr.write(
            f"\n{total} tables: {counts['KEEP']} KEEP, {counts['DROP']} DROP, "
            f"{grey} GREY ({pct:.0f}% need LLM)\n"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
