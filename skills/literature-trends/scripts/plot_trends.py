#!/usr/bin/env python3
"""Render the standard research-trend diagram set from a topic x year table.

Database-agnostic. Palette follows the dataviz skill (colorblind-safe blue
sequential + blue/red diverging + status green/red). Read /dataviz before
tweaking colors.

Input CSV: first column = topic label; year columns are the 4-digit headers, e.g.
    topic,2021,2022,2023,2024,2025,2026
    AI in hiring,8,6,8,28,22,36
    ...
Any non-year column (total, baseline, notes, …) is ignored, so a table written
for humans by analyze_corpus.py or by hand plots without editing.
Optional keywords CSV: keyword,count (one per row).

Usage:
  plot_trends.py TOPIC_YEAR.csv [--keywords KW.csv] [-o OUTDIR]
                 [--partial-year] [--source "caption text"]

--partial-year marks the LAST year column as partial (annotated *, excluded
from growth). Figures: fig1_ranking, fig2_positioning, fig3_heatmap,
fig4_trajectories, (fig5_keywords).  Requires matplotlib.
"""
import argparse, csv, os, re, sys
try:
    import numpy as np, matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.colors import LinearSegmentedColormap, TwoSlopeNorm, to_rgba
    from matplotlib.patches import Rectangle
    from matplotlib.lines import Line2D
except ImportError:
    sys.exit("needs matplotlib + numpy: pip install matplotlib")

SURF, INK, INK2, MUTED = "#fcfcfb", "#0b0b0b", "#52514e", "#898781"
GRID, BASE, BLUE, RED, GRAYMID = "#e1e0d9", "#c3c2b7", "#2a78d6", "#e34948", "#f0efec"
GOOD, CRIT = "#006300", "#d03b3b"
SEQ = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"]
CAT = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"]
SEQ_CMAP = LinearSegmentedColormap.from_list("s", SEQ)
DIV_CMAP = LinearSegmentedColormap.from_list("d", [RED, GRAYMID, BLUE])
plt.rcParams.update({"font.family": "sans-serif", "font.sans-serif": ["DejaVu Sans"],
                     "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF,
                     "text.color": INK, "axes.edgecolor": BASE, "axes.labelcolor": INK2,
                     "xtick.color": MUTED, "ytick.color": MUTED, "font.size": 11})


def clean(ax):
    for s in ("top", "right"): ax.spines[s].set_visible(False)
    for s in ("left", "bottom"): ax.spines[s].set_color(BASE)
    ax.tick_params(length=0)


def titles(ax, t, sub, fs=13):
    ax.set_title(t, fontsize=fs, fontweight="bold", color=INK, pad=42, loc="left")
    ax.text(0, 1.012, sub, transform=ax.transAxes, fontsize=9.3, color=INK2, va="bottom")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("table"); ap.add_argument("--keywords"); ap.add_argument("-o", "--outdir", default=".")
    ap.add_argument("--partial-year", action="store_true"); ap.add_argument("--source", default="")
    a = ap.parse_args(); os.makedirs(a.outdir, exist_ok=True)

    if not os.path.isfile(a.table):
        sys.exit("table not found: " + a.table)
    with open(a.table, encoding="utf-8-sig") as tf:
        rows = [r for r in csv.reader(tf) if r]
    if len(rows) < 2 or len(rows[0]) < 2:
        sys.exit("table needs a header row + >=1 topic row, and >=1 year column")
    hdr, data = rows[0], rows[1:]
    # Year columns are the 4-digit headers only. A trailing total/baseline/notes
    # column would otherwise be read as a year — silently, when it is numeric —
    # which corrupts every figure and the growth computation.
    ycol = [i for i, c in enumerate(hdr) if i and re.fullmatch(r"\d{4}", c.strip())]
    if not ycol:
        sys.exit("no 4-digit year columns in the header row: " + ",".join(hdr))
    years = [hdr[i].strip() for i in ycol]
    T = [{"label": r[0], "y": [int(float(r[i] or 0)) if i < len(r) else 0 for i in ycol]}
         for r in data if r and r[0].strip()]
    if not T:
        sys.exit("no topic rows with a label found in the table")
    for t in T:
        t["total"] = sum(t["y"])
        last_full = -2 if a.partial_year else -1
        a0, a1 = t["y"][0], t["y"][last_full]
        t["growth"] = (a1 - a0) / a0 if a0 else 0.0
        t["last_full"] = t["y"][last_full]
    ylab = years[:-1] + [years[-1] + "*"] if a.partial_year else years
    # `x or y if c else z` parses as `(x or y) if c else z` — that dropped the
    # "* = partial year" note whenever --source was also given, leaving the
    # starred year label unexplained. Compose both parts instead.
    cap = " ".join(p for p in (a.source, "* = partial year." if a.partial_year else "") if p)
    P = lambda n: os.path.join(a.outdir, n)

    # fig1 ranking
    ts = sorted(T, key=lambda x: x["total"])
    fig, ax = plt.subplots(figsize=(10, max(4, .5 * len(ts) + 1.5))); clean(ax)
    ax.xaxis.grid(True, color=GRID, lw=.8)
    nrm = plt.Normalize(min(t["total"] for t in ts), max(t["total"] for t in ts))
    ax.barh([t["label"] for t in ts], [t["total"] for t in ts],
            color=[SEQ_CMAP(.3 + .6 * nrm(t["total"])) for t in ts], height=.72, zorder=3)
    mx = max(t["total"] for t in ts)
    for i, t in enumerate(ts):
        ax.text(t["total"] + mx * .01, i, f"{t['total']:,}", va="center", fontsize=10, fontweight="bold", color=INK)
        up = t["growth"] >= 0
        ax.text(t["total"] + mx * .10, i, f"{'▲' if up else '▼'}{t['growth']*100:+.0f}%",
                va="center", fontsize=9.5, color=GOOD if up else CRIT, fontweight="bold")
    ax.set_xlim(0, mx * 1.25); ax.set_xlabel("Total publications")
    titles(ax, "Topic volume & trend direction", "bar = total volume · badge = growth first→last full year")
    if cap: fig.text(.01, -.01, cap, fontsize=7.6, color=MUTED)
    fig.savefig(P("fig1_ranking.png"), dpi=200, bbox_inches="tight"); plt.close(fig)

    # fig2 positioning
    fig, ax = plt.subplots(figsize=(11.6, 7)); clean(ax)
    med = float(np.median([t["total"] for t in T]))
    nrm = TwoSlopeNorm(vmin=-40, vcenter=0, vmax=max(60, max(t["growth"] * 100 for t in T)))
    col = {i: DIV_CMAP(nrm(t["growth"] * 100)) for i, t in enumerate(T)}
    lo = min(t["total"] for t in T); hi = max(t["total"] for t in T)
    ax.set_xscale("log"); ax.set_xlim(lo * .8, hi * 1.25)
    ymax = max(t["growth"] * 100 for t in T) * 1.15 + 10; ymin = min(t["growth"] * 100 for t in T) * 1.1 - 5
    ax.set_ylim(ymin, ymax)
    ax.add_patch(Rectangle((lo * .8, 0), med - lo * .8, ymax, color=to_rgba("#1baf7a", .08), zorder=0))
    ax.axvline(med, color=BASE, lw=1, ls="--"); ax.axhline(0, color=BASE, lw=1.3)
    for i, t in enumerate(T):
        ax.scatter(t["total"], t["growth"] * 100, s=70 + t["last_full"] * 3.2, color=col[i],
                   edgecolor="white", lw=1.4, zorder=4, alpha=.95)
        ax.annotate(str(i + 1), (t["total"], t["growth"] * 100), ha="center", va="center",
                    fontsize=8, color="white", fontweight="bold", zorder=5)
    ax.set_xlabel("Total volume (log)"); ax.set_ylabel("Growth first→last full year (%)")
    ax.xaxis.grid(True, color=GRID, lw=.7); ax.yaxis.grid(True, color=GRID, lw=.7)
    ax.annotate("EMERGING\n(small + fast-growing)", (lo * .85, ymax * .92), fontsize=9.4,
                color="#0f7a54", fontweight="bold", va="top")
    titles(ax, "Positioning: volume × growth", "top-left (green) = emerging niche · dot size = last full-year count")
    h = [Line2D([0], [0], marker="o", ls="", mfc=col[i], mec="white", ms=10, label=f"{i+1}.  {t['label']}")
         for i, t in enumerate(T)]
    ax.legend(handles=h, loc="center left", bbox_to_anchor=(1.02, .5), frameon=False,
              fontsize=8.6, labelspacing=.6, title="Topics", title_fontsize=9.3)
    if cap: fig.text(.01, -.01, cap, fontsize=7.6, color=MUTED)
    fig.savefig(P("fig2_positioning.png"), dpi=200, bbox_inches="tight"); plt.close(fig)

    # fig3 heatmap (row-normalized, ordered by growth)
    ts = sorted(T, key=lambda x: -x["growth"])
    M = np.array([t["y"] for t in ts], dtype=float); Mn = M / M.max(axis=1, keepdims=True)
    fig, ax = plt.subplots(figsize=(1.2 * len(years) + 4, .5 * len(ts) + 1.5))
    im = ax.imshow(Mn, aspect="auto", cmap=SEQ_CMAP, vmin=0, vmax=1)
    ax.set_xticks(range(len(years))); ax.set_xticklabels(ylab)
    ax.set_yticks(range(len(ts))); ax.set_yticklabels([t["label"] for t in ts]); ax.tick_params(length=0)
    for s in ax.spines.values(): s.set_visible(False)
    for i in range(len(ts)):
        for j in range(len(years)):
            ax.text(j, i, f"{int(M[i,j])}", ha="center", va="center", fontsize=8.4,
                    color="white" if Mn[i, j] > .55 else INK)
    titles(ax, "Trend shape per topic (row-normalized to peak)",
           "number = actual count · color = share of that topic's peak year · ordered by growth")
    if cap: fig.text(.01, -.02, cap, fontsize=7.6, color=MUTED)
    fig.savefig(P("fig3_heatmap.png"), dpi=200, bbox_inches="tight"); plt.close(fig)

    # fig4 trajectories (indexed base=100); pick <=8 (top growers + decliners)
    sel = T if len(T) <= 8 else sorted(T, key=lambda x: -x["growth"])[:5] + sorted(T, key=lambda x: x["growth"])[:2]
    n_full = len(years) - 1 if a.partial_year else len(years)
    xs = [int(y.rstrip("*")) if y.rstrip("*").isdigit() else i for i, y in enumerate(years[:n_full])]
    fig, ax = plt.subplots(figsize=(10, 6.4)); clean(ax); ax.axhline(100, color=BASE, lw=1, ls="--")
    for k, t in enumerate(sel):
        base = t["y"][0] or 1
        idx = [t["y"][i] / base * 100 for i in range(n_full)]
        c = CAT[k % len(CAT)]
        ax.plot(xs, idx, color=c, lw=2.4, marker="o", ms=6, mfc=c, mec="white", mew=1.2)
        ax.text(xs[-1] + (xs[-1]-xs[0])*.01, idx[-1], f" {t['label']}", color=c, fontsize=9.2, va="center", fontweight="bold")
    ax.set_xticks(xs); ax.set_ylabel("Index (first year = 100)"); ax.yaxis.grid(True, color=GRID, lw=.7)
    ax.set_xlim(xs[0], xs[-1] + (xs[-1]-xs[0]) * .45)
    titles(ax, "Growth trajectories (first year = 100)", "above 100 = growing · below = shrinking (partial year excluded)")
    if cap: fig.text(.01, -.01, cap, fontsize=7.6, color=MUTED)
    fig.savefig(P("fig4_trajectories.png"), dpi=200, bbox_inches="tight"); plt.close(fig)

    figs = ["fig1_ranking", "fig2_positioning", "fig3_heatmap", "fig4_trajectories"]
    # fig5 keywords
    if a.keywords and os.path.exists(a.keywords):
        kr = [r for r in csv.reader(open(a.keywords, encoding="utf-8"))][1:]
        kr = [(r[0], int(float(r[1]))) for r in kr if len(r) >= 2][:20][::-1]
        if kr:
            fig, ax = plt.subplots(figsize=(9.4, .34 * len(kr) + 1.6)); clean(ax); ax.xaxis.grid(True, color=GRID, lw=.7)
            nrm = plt.Normalize(min(c for _, c in kr), max(c for _, c in kr))
            ax.barh([k for k, _ in kr], [c for _, c in kr],
                    color=[SEQ_CMAP(.32 + .6 * nrm(c)) for _, c in kr], height=.74, zorder=3)
            for i, (_, c) in enumerate(kr): ax.text(c, i, f" {c}", va="center", fontsize=9, fontweight="bold", color=INK)
            titles(ax, "Top author keywords in corpus", "frequency across unique records")
            if cap: fig.text(.01, -.015, cap, fontsize=7.6, color=MUTED)
            fig.savefig(P("fig5_keywords.png"), dpi=200, bbox_inches="tight"); plt.close(fig); figs.append("fig5_keywords")

    print("rendered: " + ", ".join(f + ".png" for f in figs) + f"  -> {a.outdir}")


if __name__ == "__main__":
    main()
