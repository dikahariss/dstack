#!/usr/bin/env python3
"""Legibility checks over a .drawio source file.

Reads the source, never the rendered SVG. The source is draw.io's persisted
contract; the SVG's label encoding is a renderer detail that already broke one
parser (1 <text> against 20 <foreignObject> in a single file). The source is
also present whether or not a renderer exists, so this runs everywhere.

Four checks, each with a number:

  edge-through-shape   an edge penetrating > 8 px into a box it does not connect
  element-overlap      partial intersection > 20 px^2 (full containment skipped)
  text-overflow        len(label) * font-size * 0.55 > width - 8
  reserved-region      an element inside a stencil's reserved area

Exit 0 clean, 1 findings, 2 unparseable. **2 is not a pass.**

Usage: python3 check_geometry.py <file>.drawio [...]
"""
from __future__ import annotations

import re
import sys
import xml.etree.ElementTree as ET

EDGE_INTO_BOX_PX = 8
OVERLAP_AREA_PX2 = 20
TEXT_PAD_PX = 8
CHAR_WIDTH_RATIO = 0.55
DEFAULT_FONT_PX = 12

# A stencil that draws chrome of its own, and how much it reserves.
# Measured, not guessed: browserWindow's separator sits at y=110 for frame
# heights of 200, 400 and 600 — the reservation is fixed, not proportional.
RESERVED_TOP = {"mxgraph.mockup.containers.browserWindow": 110}


class Cell:
    __slots__ = ("id", "label", "style", "x", "y", "w", "h", "is_edge", "src", "tgt")

    def __init__(self, el, geo):
        self.id = el.get("id", "?")
        self.label = (el.get("value") or "").strip()
        self.style = el.get("style") or ""
        self.x = float(geo.get("x", 0))
        self.y = float(geo.get("y", 0))
        self.w = float(geo.get("width", 0))
        self.h = float(geo.get("height", 0))
        self.is_edge = el.get("edge") == "1"
        self.src = el.get("source")
        self.tgt = el.get("target")

    @property
    def box(self):
        return (self.x, self.y, self.x + self.w, self.y + self.h)

    @property
    def centre(self):
        return (self.x + self.w / 2, self.y + self.h / 2)

    def font_px(self):
        m = re.search(r"fontSize=(\d+)", self.style)
        return int(m.group(1)) if m else DEFAULT_FONT_PX

    def stencil(self):
        m = re.search(r"shape=([\w.]+)", self.style)
        return m.group(1) if m else None


def parse(path):
    """Return (vertices, edges). Raises on anything unreadable."""
    root = ET.parse(path).getroot()
    verts, edges = [], []
    for el in root.iter("mxCell"):
        geo = el.find("mxGeometry")
        if geo is None:
            continue
        c = Cell(el, geo)
        (edges if c.is_edge else verts).append(c)
    return verts, edges


def overlap_area(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    dx = min(ax2, bx2) - max(ax1, bx1)
    dy = min(ay2, by2) - max(ay1, by1)
    return dx * dy if dx > 0 and dy > 0 else 0.0


def contains(outer, inner):
    ox1, oy1, ox2, oy2 = outer
    ix1, iy1, ix2, iy2 = inner
    return ox1 <= ix1 and oy1 <= iy1 and ox2 >= ix2 and oy2 >= iy2


def segment_into_box(p, q, box, tol):
    """Depth the segment p->q penetrates box, by sampling. 0 if it never enters.

    Sampling rather than analytic clipping: the segment is a straight run
    between two centres, the boxes are axis-aligned, and 200 samples resolves
    an 8 px threshold on any diagram a person would read.
    """
    x1, y1, x2, y2 = box
    inside = [
        t / 200
        for t in range(201)
        if x1 <= p[0] + (q[0] - p[0]) * t / 200 <= x2
        and y1 <= p[1] + (q[1] - p[1]) * t / 200 <= y2
    ]
    if not inside:
        return 0.0
    span = (max(inside) - min(inside)) * ((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2) ** 0.5
    return span if span > tol else 0.0


def check(path):
    verts, edges = parse(path)
    by_id = {c.id: c for c in verts}
    findings = []

    # 1. edge through a shape it does not connect
    for e in edges:
        s, t = by_id.get(e.src), by_id.get(e.tgt)
        if not s or not t:
            continue
        for v in verts:
            if v.id in (e.src, e.tgt) or v.w == 0 or v.h == 0:
                continue
            if contains(v.box, s.box) or contains(v.box, t.box):
                continue  # a container holding an endpoint is not a crossing
            d = segment_into_box(s.centre, t.centre, v.box, EDGE_INTO_BOX_PX)
            if d:
                findings.append(
                    f"edge-through-shape | {e.id} through {v.id} | {d:.0f}px | >{EDGE_INTO_BOX_PX}px"
                )

    # 2. partial overlap between two elements; containment is intentional
    for i, a in enumerate(verts):
        for b in verts[i + 1 :]:
            if a.w == 0 or b.w == 0:
                continue
            if contains(a.box, b.box) or contains(b.box, a.box):
                continue
            area = overlap_area(a.box, b.box)
            if area > OVERLAP_AREA_PX2:
                findings.append(
                    f"element-overlap | {a.id} x {b.id} | {area:.0f}px2 | >{OVERLAP_AREA_PX2}px2"
                )

    # 3. text wider than its box
    for v in verts:
        if not v.label or v.w == 0:
            continue
        longest = max(v.label.split("\n"), key=len)
        need = len(longest) * v.font_px() * CHAR_WIDTH_RATIO
        if need > v.w - TEXT_PAD_PX:
            findings.append(
                f"text-overflow | {v.id} | needs {need:.0f}px, box {v.w:.0f}px | >width-{TEXT_PAD_PX}px"
            )

    # 4. an element sitting in a stencil's reserved region
    for frame in verts:
        top = RESERVED_TOP.get(frame.stencil() or "")
        if top is None:
            continue
        for v in verts:
            if v is frame or v.w == 0:
                continue
            if not contains(frame.box, v.box):
                continue
            if v.y < frame.y + top:
                findings.append(
                    f"reserved-region | {v.id} in {frame.id} | y={v.y - frame.y:.0f}px from frame top | needs >={top}px"
                )

    return findings


def main(argv):
    if len(argv) < 2:
        print(__doc__.strip().splitlines()[-1], file=sys.stderr)
        return 2
    worst = 0
    for path in argv[1:]:
        try:
            findings = check(path)
        except Exception as exc:  # unreadable input is never a pass
            print(f"UNPARSEABLE | {path} | {type(exc).__name__}: {exc}", file=sys.stderr)
            worst = 2
            continue
        for f in findings:
            print(f"{path}: {f}")
        if findings and worst < 1:
            worst = 1
        if not findings:
            print(f"{path}: clean — 4 checks, 0 findings")
    return worst


if __name__ == "__main__":
    sys.exit(main(sys.argv))
