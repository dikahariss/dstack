#!/usr/bin/env python3
"""Mine Claude Code session transcripts for recurring failure signal.

The transcript corpus is large (gigabytes across thousands of files), so an
agent must never read it directly. This script does the deterministic pass and
emits a compact digest the agent can reason over.

What it extracts, and why each one is trustworthy:

  corrections  A human message that reads as a correction, paired with the
               assistant text immediately before it. This is the richest seam:
               it captures the moment a claim was rejected.
  tool_errors  tool_result blocks with is_error=true, grouped by tool and by a
               normalised error signature. Fully mechanical - no interpretation.
  denials      Tool calls the user refused. A refused call is a preference
               stated in the strongest terms available.
  rework       Files written or edited many times inside one session, which is
               the fingerprint of trial-and-error rather than a planned change.

Subagent transcripts (agent-*.jsonl) are EXCLUDED. Their "user" turns are
prompts this agent wrote, not human input; counting them inflates every metric
and makes the agent grade its own homework.

Usage:
  mine_sessions.py [--root DIR] [--since DAYS] [--project SUBSTR]
                   [--out FILE] [--top N] [--quiet]

  --root     transcript root (default ~/.claude/projects)
  --since    only sessions with activity in the last N days (default 7)
  --project  only project dirs whose name contains SUBSTR
  --out      write JSON digest here (default stdout is the summary only)
  --top      how many items per section in the summary (default 12)

Dependency-free. Reads only; writes only the file you name with --out.
"""
import argparse, json, os, re, sys, time, collections, pathlib

# A correction is a human turn that pushes back on what just happened. Kept
# deliberately broad in Indonesian and English; precision comes from the agent
# reading the pairs, not from this regex.
CORRECTION = re.compile(
    r"\b(padahal|ternyata|kok\s+masih|masih\s+belum|masih\s+ada|bukan\s+itu|salah|keliru"
    r"|harusnya|seharusnya|tapi\s+masih|belum\s+beres|tidak\s+sesuai|gak\s+sesuai"
    r"|jangan\s+sampai|kenapa\s+\w+\s*(gagal|error|belum)"
    r"|that'?s\s+wrong|not\s+what\s+i|you\s+didn'?t|still\s+(broken|failing|wrong)"
    r"|actually\s+it|no,\s)\b", re.I)

# Distinct from a correction: an explicit demand to verify before claiming.
VERIFY_DEMAND = re.compile(
    r"\b(pastikan|verifikasi|cek\s+(kembali|lagi|dulu)|periksa\s+kembali|yakin\?"
    r"|jangan\s+halusinasi|jangan\s+ngarang|buktikan|verify|make\s+sure|double.?check)\b", re.I)

WRITE_TOOLS = {"Write", "Edit", "NotebookEdit"}


def human_text(msg):
    """Return the human-authored text of a user turn, or None.

    A user turn carrying tool_result blocks is transport, not a person talking.
    """
    c = msg.get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        if any(isinstance(x, dict) and x.get("type") == "tool_result" for x in c):
            return None
        parts = [x.get("text", "") for x in c if isinstance(x, dict) and x.get("type") == "text"]
        return "\n".join(p for p in parts if p) or None
    return None


def norm_error(s, limit=160):
    """Collapse an error string to a signature so variants group together."""
    s = " ".join(str(s).split())
    s = re.sub(r"/[\w./~-]+", "<path>", s)
    s = re.sub(r"\b[0-9a-f]{7,}\b", "<hash>", s)
    s = re.sub(r"\b\d+\b", "<n>", s)
    return s[:limit]


def scan(path):
    """Yield one record per session file. Never holds the whole corpus."""
    out = {
        "file": str(path), "project": path.parent.name, "mtime": path.stat().st_mtime,
        "human_turns": 0, "corrections": [], "verify_demands": 0,
        "tool_uses": 0, "errors": [], "denials": [], "writes": collections.Counter(),
    }
    prev_assistant = None
    pending = {}                      # tool_use_id -> (tool, brief)
    try:
        fh = path.open(errors="ignore")
    except OSError:
        return out
    with fh:
        for line in fh:
            try:
                d = json.loads(line)
            except Exception:
                continue
            m = d.get("message")
            if not isinstance(m, dict):
                continue
            t = d.get("type")
            c = m.get("content")

            if t == "assistant" and isinstance(c, list):
                for x in c:
                    if not isinstance(x, dict):
                        continue
                    if x.get("type") == "text" and x.get("text", "").strip():
                        prev_assistant = x["text"].strip()
                    elif x.get("type") == "tool_use":
                        out["tool_uses"] += 1
                        name = x.get("name", "?")
                        inp = x.get("input") or {}
                        brief = inp.get("description") or inp.get("file_path") or inp.get("command") or ""
                        pending[x.get("id")] = (name, " ".join(str(brief).split())[:120])
                        if name in WRITE_TOOLS and inp.get("file_path"):
                            out["writes"][inp["file_path"]] += 1

            elif t == "user":
                if isinstance(c, list):
                    for x in c:
                        if not isinstance(x, dict) or x.get("type") != "tool_result":
                            continue
                        tool, brief = pending.get(x.get("tool_use_id"), ("?", ""))
                        body = x.get("content")
                        if isinstance(body, list):
                            body = " ".join(y.get("text", "") for y in body if isinstance(y, dict))
                        body = str(body or "")
                        if x.get("is_error"):
                            # A refusal is a user decision; a failure is the tool's.
                            bucket = "denials" if re.search(
                                r"user (doesn'?t want|rejected|denied)|tool use was rejected", body, re.I
                            ) else "errors"
                            out[bucket].append({"tool": tool, "target": brief,
                                                "signature": norm_error(body)})
                    continue

                text = human_text(m)
                if not text:
                    continue
                text = " ".join(text.split())
                # Slash commands and harness-injected blocks are not the user talking.
                if not text or text.startswith("/") or text.startswith("<"):
                    continue
                out["human_turns"] += 1
                if VERIFY_DEMAND.search(text):
                    out["verify_demands"] += 1
                if CORRECTION.search(text) and prev_assistant:
                    out["corrections"].append({
                        "claim": prev_assistant[:400],
                        "correction": text[:400],
                    })
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=os.path.expanduser("~/.claude/projects"))
    ap.add_argument("--since", type=int, default=7, help="days back (0 = all)")
    ap.add_argument("--project", default="", help="substring filter on project dir")
    ap.add_argument("--out", default="")
    ap.add_argument("--top", type=int, default=12)
    ap.add_argument("--quiet", action="store_true")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    if not root.is_dir():
        sys.exit(f"transcript root not found: {root}")
    cutoff = time.time() - a.since * 86400 if a.since else 0

    files = [f for f in root.rglob("*.jsonl")
             if not f.name.startswith("agent-")           # subagent transcripts
             and a.project in f.parent.name
             and f.stat().st_mtime >= cutoff]

    agg = {"scanned": 0, "human_turns": 0, "tool_uses": 0, "verify_demands": 0,
           "corrections": [], "errors": collections.Counter(),
           "error_examples": {}, "denials": collections.Counter(),
           "rework": [], "projects": collections.Counter()}

    for f in files:
        r = scan(f)
        agg["scanned"] += 1
        agg["human_turns"] += r["human_turns"]
        agg["tool_uses"] += r["tool_uses"]
        agg["verify_demands"] += r["verify_demands"]
        agg["projects"][r["project"]] += r["human_turns"]
        for c in r["corrections"]:
            c["project"] = r["project"]
            agg["corrections"].append(c)
        for e in r["errors"]:
            key = (e["tool"], e["signature"])
            agg["errors"][key] += 1
            agg["error_examples"].setdefault(key, e["target"])
        for d in r["denials"]:
            agg["denials"][(d["tool"], d["target"])] += 1
        for path_, n in r["writes"].items():
            if n >= 4:                                     # trial-and-error fingerprint
                agg["rework"].append({"file": path_, "edits": n, "project": r["project"]})

    agg["rework"].sort(key=lambda x: -x["edits"])

    if a.out:
        payload = dict(agg)
        payload["errors"] = [{"tool": k[0], "signature": k[1], "count": v,
                              "example": agg["error_examples"].get(k, "")}
                             for k, v in agg["errors"].most_common()]
        payload["denials"] = [{"tool": k[0], "target": k[1], "count": v}
                              for k, v in agg["denials"].most_common()]
        payload["projects"] = dict(agg["projects"])
        payload.pop("error_examples", None)
        pathlib.Path(a.out).write_text(json.dumps(payload, ensure_ascii=False, indent=2))

    if a.quiet:
        return

    w = sys.stdout.write
    win = f"last {a.since}d" if a.since else "all time"
    w(f"# Session digest — learning-from-sessions ({win})\n\n")
    w(f"sessions {agg['scanned']} | human turns {agg['human_turns']} | "
      f"tool calls {agg['tool_uses']}\n")
    ht = max(agg["human_turns"], 1)
    w(f"corrections {len(agg['corrections'])} ({len(agg['corrections'])*100//ht}% of human turns) | "
      f"verify demands {agg['verify_demands']} ({agg['verify_demands']*100//ht}%)\n")
    w(f"tool errors {sum(agg['errors'].values())} | denials {sum(agg['denials'].values())} | "
      f"rework files {len(agg['rework'])}\n\n")

    if not agg["scanned"]:
        w("No sessions in the window. Widen --since.\n")
        return

    w("## Correction pairs (claim -> pushback)\n\n")
    for c in agg["corrections"][:a.top]:
        w(f"- [{c['project'][:44]}]\n  claim: {c['claim'][:200]}\n  push : {c['correction'][:200]}\n")
    if len(agg["corrections"]) > a.top:
        w(f"  ... {len(agg['corrections'])-a.top} more (see --out JSON)\n")

    w("\n## Tool errors by signature\n\n")
    for (tool, sig), n in agg["errors"].most_common(a.top):
        w(f"- {n:3d}x {tool}: {sig}\n")

    if agg["denials"]:
        w("\n## Refused tool calls\n\n")
        for (tool, target), n in agg["denials"].most_common(a.top):
            w(f"- {n:3d}x {tool}: {target}\n")

    if agg["rework"]:
        w("\n## Rework (>=4 edits to one file in one session)\n\n")
        for r in agg["rework"][:a.top]:
            w(f"- {r['edits']:3d}x {r['file']}\n")

    w("\n## Where the time went\n\n")
    for p, n in agg["projects"].most_common(a.top):
        w(f"- {n:5d} turns  {p}\n")


if __name__ == "__main__":
    main()
