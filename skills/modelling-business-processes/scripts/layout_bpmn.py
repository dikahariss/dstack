#!/usr/bin/env python3
"""Generate BPMN DI for a lane-based process, keeping the pool and the lanes.

`bpmn-auto-layout` binds its plane to the *process* and emits no participant
or lane shape: the collaboration survives in the semantic model while the
roles vanish from the picture. This lays the same model out on a lane grid —
one row per lane, one column per topological rank — so a reader still sees
who does which step.

    python3 layout_bpmn.py in.bpmn out.bpmn

Exit 0 laid out, 1 refused with a reason on stderr, 2 unparseable.
"""

from __future__ import annotations

import sys
import xml.etree.ElementTree as ET
from collections import defaultdict, deque

NS = {
    "bpmn": "http://www.omg.org/spec/BPMN/20100524/MODEL",
    "bpmndi": "http://www.omg.org/spec/BPMN/20100524/DI",
    "dc": "http://www.omg.org/spec/DD/20100524/DC",
    "di": "http://www.omg.org/spec/DD/20100524/DI",
}

EVENTS = {
    "startEvent",
    "endEvent",
    "intermediateCatchEvent",
    "intermediateThrowEvent",
    "boundaryEvent",
}
GATEWAYS = {
    "exclusiveGateway",
    "parallelGateway",
    "inclusiveGateway",
    "eventBasedGateway",
    "complexGateway",
}
TASKS = {
    "task",
    "userTask",
    "serviceTask",
    "scriptTask",
    "manualTask",
    "sendTask",
    "receiveTask",
    "businessRuleTask",
    "callActivity",
}
CONTAINERS = {"subProcess", "transaction", "adHocSubProcess"}
FLOW_NODES = EVENTS | GATEWAYS | TASKS | CONTAINERS

# Geometry. Lane padding is deliberately generous: the back-edge channel is
# routed inside it, and a cramped lane is what makes a loop cross a task.
POOL_X, POOL_Y = 160, 80
LANE_HEADER_W = 30
CONTENT_PAD_X = 60
COL_W = 190
COL_ANCHOR = 50
ROW_PITCH = 120
# Padding has to hold the back-edge channel *and* the label bpmn-js draws above
# it. At 40 the label rendered outside the pool and was clipped.
LANE_PAD_Y = 56
BACK_CHANNEL_Y = 34
BACK_CHANNEL_PITCH = 16
LABEL_CHAR_W = 6.2
LABEL_LINE_H = 13

SIZES = {"event": (36, 36), "gateway": (50, 50), "task": (100, 80), "container": (140, 100)}


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def kind(tag: str) -> str:
    name = local(tag)
    if name in EVENTS:
        return "event"
    if name in GATEWAYS:
        return "gateway"
    if name in CONTAINERS:
        return "container"
    return "task"


class Box:
    __slots__ = ("x", "y", "w", "h")

    def __init__(self, x: float, y: float, w: float, h: float) -> None:
        self.x, self.y, self.w, self.h = x, y, w, h

    @property
    def right(self) -> float:
        return self.x + self.w

    @property
    def bottom(self) -> float:
        return self.y + self.h

    @property
    def midx(self) -> float:
        return self.x + self.w / 2

    @property
    def midy(self) -> float:
        return self.y + self.h / 2


def refuse(message: str) -> None:
    print(f"refused: {message}", file=sys.stderr)
    sys.exit(1)


def collect_lanes(process: ET.Element) -> list[tuple[str, str, str | None]]:
    """Leaf lanes in document order as (id, name, parent_id).

    A lane holding a childLaneSet is a container: its children become the rows
    and it becomes a band spanning them.
    """
    rows: list[tuple[str, str, str | None]] = []

    def walk(lane_set: ET.Element, parent: str | None) -> None:
        for lane in lane_set.findall("bpmn:lane", NS):
            lane_id = lane.get("id", "")
            child = lane.find("bpmn:childLaneSet", NS)
            if child is not None:
                walk(child, lane_id)
            else:
                rows.append((lane_id, lane.get("name", ""), parent))

    for lane_set in process.findall("bpmn:laneSet", NS):
        walk(lane_set, None)
    return rows


def lane_membership(process: ET.Element) -> dict[str, str]:
    """flowNodeRef -> leaf lane id."""
    member: dict[str, str] = {}
    for lane in process.iter():
        if local(lane.tag) != "lane":
            continue
        if lane.find("bpmn:childLaneSet", NS) is not None:
            continue
        lane_id = lane.get("id", "")
        for ref in lane.findall("bpmn:flowNodeRef", NS):
            if ref.text:
                member[ref.text.strip()] = lane_id
    return member


def rank_columns(nodes: list[str], flows: list[tuple[str, str, str]]) -> dict[str, int]:
    """Longest-path rank over the flow graph with back edges removed.

    Back edges are found by a DFS in document order, so the same model always
    ranks the same way — regeneration must not move a node.
    """
    succ: dict[str, list[str]] = defaultdict(list)
    for _fid, src, tgt in flows:
        if src in nodes and tgt in nodes:
            succ[src].append(tgt)

    colour = {n: 0 for n in nodes}  # 0 white, 1 grey, 2 black
    back: set[tuple[str, str]] = set()

    def visit(start: str) -> None:
        stack: list[tuple[str, int]] = [(start, 0)]
        colour[start] = 1
        while stack:
            node, i = stack.pop()
            if i < len(succ[node]):
                stack.append((node, i + 1))
                nxt = succ[node][i]
                if colour[nxt] == 1:
                    back.add((node, nxt))
                elif colour[nxt] == 0:
                    colour[nxt] = 1
                    stack.append((nxt, 0))
            else:
                colour[node] = 2

    for n in nodes:
        if colour[n] == 0:
            visit(n)

    forward = [(s, t) for _f, s, t in flows if s in nodes and t in nodes and (s, t) not in back]
    indeg = {n: 0 for n in nodes}
    fsucc: dict[str, list[str]] = defaultdict(list)
    for s, t in forward:
        fsucc[s].append(t)
        indeg[t] += 1

    rank = {n: 0 for n in nodes}
    queue = deque(n for n in nodes if indeg[n] == 0)
    seen = 0
    while queue:
        node = queue.popleft()
        seen += 1
        for t in fsucc[node]:
            rank[t] = max(rank[t], rank[node] + 1)
            indeg[t] -= 1
            if indeg[t] == 0:
                queue.append(t)
    if seen != len(nodes):  # a cycle the DFS missed; rank what we can
        for n in nodes:
            rank.setdefault(n, 0)
    return rank


def build(path_in: str, path_out: str) -> None:
    for prefix, uri in NS.items():
        ET.register_namespace(prefix, uri)
    try:
        tree = ET.parse(path_in)
    except ET.ParseError as exc:
        print(f"unparseable: {exc}", file=sys.stderr)
        sys.exit(2)
    root = tree.getroot()

    collaboration = root.find("bpmn:collaboration", NS)
    participants = collaboration.findall("bpmn:participant", NS) if collaboration is not None else []
    if len(participants) > 1:
        refuse(
            "more than one participant. This lays out a single pool; a "
            "multi-pool collaboration with message flows needs a modeller."
        )

    if participants:
        process_ref = participants[0].get("processRef")
        process = next(
            (p for p in root.findall("bpmn:process", NS) if p.get("id") == process_ref), None
        )
        if process is None:
            refuse(f"participant references processRef={process_ref!r}, which does not exist")
    else:
        procs = root.findall("bpmn:process", NS)
        if len(procs) != 1:
            refuse(f"expected exactly one process, found {len(procs)}")
        process = procs[0]

    nodes: list[str] = []
    node_el: dict[str, ET.Element] = {}
    for child in process:
        if local(child.tag) in FLOW_NODES:
            nid = child.get("id")
            if nid:
                nodes.append(nid)
                node_el[nid] = child
    if not nodes:
        refuse("the process holds no flow nodes")

    flows = [
        (f.get("id", ""), f.get("sourceRef", ""), f.get("targetRef", ""))
        for f in process.findall("bpmn:sequenceFlow", NS)
    ]

    lane_rows = collect_lanes(process)
    member = lane_membership(process)
    if lane_rows:
        unassigned = [n for n in nodes if n not in member]
        if unassigned:
            refuse(
                "these flow nodes belong to no lane: "
                + ", ".join(unassigned)
                + ". A lane is the role that performs the step; a node outside "
                "every lane has no owner."
            )
        rows = [(lid, name, parent) for lid, name, parent in lane_rows]
    else:
        rows = [("__single__", "", None)]
        member = {n: "__single__" for n in nodes}

    row_index = {lid: i for i, (lid, _n, _p) in enumerate(rows)}
    rank = rank_columns(nodes, flows)
    n_cols = max(rank.values()) + 1

    # Cell occupancy decides lane height before any coordinate is fixed.
    cell: dict[tuple[int, int], list[str]] = defaultdict(list)
    for n in nodes:
        cell[(row_index[member[n]], rank[n])].append(n)

    lane_h: list[float] = []
    for r in range(len(rows)):
        deepest = max((len(cell[(r, c)]) for c in range(n_cols)), default=0)
        lane_h.append(max(1, deepest) * ROW_PITCH + 2 * LANE_PAD_Y)

    lane_y: list[float] = []
    y = POOL_Y
    for h in lane_h:
        lane_y.append(y)
        y += h

    content_x0 = POOL_X + LANE_HEADER_W + CONTENT_PAD_X

    box: dict[str, Box] = {}
    for (r, c), members in cell.items():
        stack_h = len(members) * ROW_PITCH
        y0 = lane_y[r] + (lane_h[r] - stack_h) / 2
        for i, nid in enumerate(members):
            w, h = SIZES[kind(node_el[nid].tag)]
            cx = content_x0 + c * COL_W + COL_ANCHOR
            cy = y0 + i * ROW_PITCH + ROW_PITCH / 2
            box[nid] = Box(cx - w / 2, cy - h / 2, w, h)

    # A boundary event is not ranked on its own; it sits on its host's edge.
    for nid, el in node_el.items():
        host = el.get("attachedToRef")
        if host and host in box:
            hb = box[host]
            b = box[nid]
            b.x, b.y = hb.midx - b.w / 2, hb.bottom - b.h / 2

    # The pool wraps the content it actually holds, not the last column's slot.
    pool = Box(
        POOL_X,
        POOL_Y,
        max(b.right for b in box.values()) + CONTENT_PAD_X - POOL_X,
        sum(lane_h),
    )

    for old in root.findall("bpmndi:BPMNDiagram", NS):
        root.remove(old)

    plane_ref = collaboration.get("id") if collaboration is not None else process.get("id")
    diagram = ET.SubElement(root, f"{{{NS['bpmndi']}}}BPMNDiagram", {"id": "BPMNDiagram_1"})
    plane = ET.SubElement(
        diagram,
        f"{{{NS['bpmndi']}}}BPMNPlane",
        {"id": "BPMNPlane_1", "bpmnElement": plane_ref or ""},
    )

    def bounds(parent: ET.Element, b: Box) -> None:
        ET.SubElement(
            parent,
            f"{{{NS['dc']}}}Bounds",
            {
                "x": f"{b.x:.0f}",
                "y": f"{b.y:.0f}",
                "width": f"{b.w:.0f}",
                "height": f"{b.h:.0f}",
            },
        )

    def shape(el_id: str, b: Box, horizontal: bool = False, label: str = "") -> None:
        attrs = {"id": f"{el_id}_di", "bpmnElement": el_id}
        if horizontal:
            attrs["isHorizontal"] = "true"
        node = ET.SubElement(plane, f"{{{NS['bpmndi']}}}BPMNShape", attrs)
        bounds(node, b)
        if not label:
            return
        # An event or gateway draws its name outside the shape, and bpmn-js
        # sizes that box from the shape's own width — 36 px, which hyphenates
        # mid-word. Declaring the label bounds is what stops it.
        width = max(90.0, min(170.0, len(label) * LABEL_CHAR_W + 8))
        per_line = max(1, int(width / LABEL_CHAR_W))
        lines = max(1, -(-len(label) // per_line))
        height = lines * LABEL_LINE_H + 4
        di_label = ET.SubElement(node, f"{{{NS['bpmndi']}}}BPMNLabel")
        bounds(di_label, Box(b.midx - width / 2, b.bottom + 5, width, height))

    if participants:
        shape(participants[0].get("id", ""), pool, horizontal=True)
    if lane_rows:
        for i, (lid, _name, _parent) in enumerate(rows):
            shape(
                lid,
                Box(POOL_X + LANE_HEADER_W, lane_y[i], pool.w - LANE_HEADER_W, lane_h[i]),
                horizontal=True,
            )
        # A parent lane spans the rows it contains.
        spans: dict[str, list[int]] = defaultdict(list)
        for i, (_lid, _name, parent) in enumerate(rows):
            if parent:
                spans[parent].append(i)
        for parent, idx in spans.items():
            top, bottom = min(idx), max(idx)
            shape(
                parent,
                Box(
                    POOL_X + LANE_HEADER_W,
                    lane_y[top],
                    pool.w - LANE_HEADER_W,
                    sum(lane_h[top : bottom + 1]),
                ),
                horizontal=True,
            )

    for nid in nodes:
        outside = kind(node_el[nid].tag) in ("event", "gateway")
        shape(nid, box[nid], label=node_el[nid].get("name", "") if outside else "")

    back_used: dict[int, int] = defaultdict(int)
    for fid, src, tgt in flows:
        if src not in box or tgt not in box:
            continue
        s, t = box[src], box[tgt]
        edge = ET.SubElement(
            plane,
            f"{{{NS['bpmndi']}}}BPMNEdge",
            {"id": f"{fid}_di", "bpmnElement": fid},
        )
        if rank[tgt] > rank[src]:
            if abs(s.midy - t.midy) < 1:
                points = [(s.right, s.midy), (t.x, t.midy)]
            else:
                mid = (s.right + t.x) / 2
                points = [(s.right, s.midy), (mid, s.midy), (mid, t.midy), (t.x, t.midy)]
        else:
            top_row = min(row_index[member[src]], row_index[member[tgt]])
            slot = back_used[top_row]
            back_used[top_row] += 1
            channel = lane_y[top_row] + BACK_CHANNEL_Y + slot * BACK_CHANNEL_PITCH
            points = [(s.midx, s.y), (s.midx, channel), (t.midx, channel), (t.midx, t.y)]
        for px, py in points:
            ET.SubElement(
                edge, f"{{{NS['di']}}}waypoint", {"x": f"{px:.0f}", "y": f"{py:.0f}"}
            )

    with open(path_out, "wb") as handle:
        handle.write(b'<?xml version="1.0" encoding="UTF-8"?>\n')
        tree.write(handle, encoding="utf-8", xml_declaration=False)

    lanes_note = f"{len(rows)} lane(s)" if lane_rows else "no lanes"
    print(
        f"laid out {len(nodes)} nodes, {len(flows)} flows, {lanes_note}, "
        f"{n_cols} columns -> {path_out}"
    )


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__, file=sys.stderr)
        sys.exit(2)
    build(sys.argv[1], sys.argv[2])
