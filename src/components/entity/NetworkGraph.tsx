"use client";

import * as React from "react";
import { cn } from "@togo-framework/ui-core";

export interface GraphNode {
  id: string;
  label?: string;
  group?: string;
}
export interface GraphLink {
  source: string;
  target: string;
}
export interface NetworkGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  className?: string;
  /** Map a group → CSS color. Falls back to a token palette. */
  groupColor?: (group: string | undefined) => string;
  /** Node circle radius. */
  nodeRadius?: number;
  /** Fired when a node is clicked (not dragged). */
  onNodeClick?: (node: GraphNode) => void;
}

const PALETTE = [
  "hsl(345 75% 45%)", "hsl(217 91% 60%)", "hsl(160 84% 39%)",
  "hsl(38 92% 50%)", "hsl(263 70% 60%)", "hsl(199 89% 48%)",
];

interface Particle {
  x: number; y: number; vx: number; vy: number;
  fx?: number | null; fy?: number | null; // fixed position while dragging
}

/** NetworkGraph — a dependency-free, **live force-directed** SVG graph with
 * **draggable** nodes. Nodes repel, links act as springs, and the layout settles;
 * dragging a node pins it to the pointer and reheats the simulation so the graph
 * reacts dynamically. Pass `nodes` + `links`. */
export function NetworkGraph({
  nodes, links, width = 640, height = 420, className, groupColor,
  nodeRadius = 11, onNodeClick,
}: NetworkGraphProps) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const sim = React.useRef<Map<string, Particle>>(new Map());
  const alpha = React.useRef(1);
  const raf = React.useRef<number | null>(null);
  const drag = React.useRef<{ id: string; moved: boolean } | null>(null);
  const [, tick] = React.useReducer((c) => c + 1, 0);
  const [hover, setHover] = React.useState<string | null>(null);

  const groups = React.useMemo(() => Array.from(new Set(nodes.map((n) => n.group ?? "default"))), [nodes]);
  const colorOf = (g: string | undefined) =>
    groupColor?.(g) ?? PALETTE[Math.max(0, groups.indexOf(g ?? "default")) % PALETTE.length];

  const stop = React.useCallback(() => {
    if (raf.current != null) { cancelAnimationFrame(raf.current); raf.current = null; }
  }, []);

  const step = React.useCallback(() => {
    const m = sim.current;
    const ids = Array.from(m.keys());
    const a = alpha.current;
    // charge repulsion (all pairs)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const p = m.get(ids[i])!, q = m.get(ids[j])!;
        let dx = p.x - q.x, dy = p.y - q.y;
        const d2 = dx * dx + dy * dy || 0.01;
        const d = Math.sqrt(d2);
        const f = (3200 / d2) * a;
        dx /= d; dy /= d;
        p.vx += dx * f; p.vy += dy * f;
        q.vx -= dx * f; q.vy -= dy * f;
      }
    }
    // link springs
    for (const l of links) {
      const p = m.get(l.source), q = m.get(l.target);
      if (!p || !q) continue;
      let dx = q.x - p.x, dy = q.y - p.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - 100) * 0.045 * a;
      dx /= d; dy /= d;
      p.vx += dx * f; p.vy += dy * f;
      q.vx -= dx * f; q.vy -= dy * f;
    }
    // centering gravity + integrate (Verlet-ish with damping)
    for (const p of m.values()) {
      if (p.fx != null) { p.x = p.fx; p.y = p.fy!; p.vx = 0; p.vy = 0; continue; }
      p.vx += (width / 2 - p.x) * 0.0015 * a;
      p.vy += (height / 2 - p.y) * 0.0015 * a;
      p.vx *= 0.86; p.vy *= 0.86;
      p.x = Math.max(nodeRadius + 4, Math.min(width - nodeRadius - 4, p.x + p.vx));
      p.y = Math.max(nodeRadius + 4, Math.min(height - nodeRadius - 4, p.y + p.vy));
    }
    alpha.current = drag.current ? Math.max(a, 0.3) : a * 0.99;
    tick();
    if (alpha.current > 0.02 || drag.current) raf.current = requestAnimationFrame(step);
    else raf.current = null;
  }, [links, width, height, nodeRadius]);

  const start = React.useCallback(() => {
    if (raf.current == null) raf.current = requestAnimationFrame(step);
  }, [step]);

  // (Re)seed the simulation when the graph changes; reuse existing positions.
  React.useEffect(() => {
    const prev = sim.current;
    const next = new Map<string, Particle>();
    const n = nodes.length || 1;
    nodes.forEach((node, i) => {
      const old = prev.get(node.id);
      if (old) next.set(node.id, old);
      else {
        const ang = (i / n) * Math.PI * 2;
        const R = Math.min(width, height) / 3;
        next.set(node.id, { x: width / 2 + R * Math.cos(ang), y: height / 2 + R * Math.sin(ang), vx: 0, vy: 0 });
      }
    });
    sim.current = next;
    alpha.current = 1; // reheat
    start();
    return stop;
  }, [nodes, links, width, height, start, stop]);

  function toSvg(e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function onDown(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const p = sim.current.get(id);
    if (p) { const m = toSvg(e); p.fx = m.x; p.fy = m.y; }
    drag.current = { id, moved: false };
    alpha.current = Math.max(alpha.current, 0.5);
    start();
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = sim.current.get(d.id);
    if (p) { const m = toSvg(e); p.fx = m.x; p.fy = m.y; d.moved = true; }
  }
  function onUp(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = sim.current.get(d.id);
    if (p) { p.fx = null; p.fy = null; }
    if (!d.moved) { const node = nodes.find((n) => n.id === d.id); if (node) onNodeClick?.(node); }
    drag.current = null;
    alpha.current = Math.max(alpha.current, 0.3);
    start();
  }

  const m = sim.current;
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("w-full touch-none select-none rounded-xl border border-border bg-card", className)}
      role="img"
      aria-label="Network graph (drag nodes to rearrange)"
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {links.map((l, i) => {
        const a = m.get(l.source), b = m.get(l.target);
        if (!a || !b) return null;
        const active = hover != null && (l.source === hover || l.target === hover);
        return (
          <line
            key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={active ? "hsl(var(--primary))" : "hsl(var(--border))"}
            strokeWidth={active ? 2 : 1.5}
            strokeOpacity={hover != null && !active ? 0.4 : 1}
          />
        );
      })}
      {nodes.map((n) => {
        const p = m.get(n.id);
        if (!p) return null;
        const dim = hover != null && hover !== n.id;
        return (
          <g
            key={n.id}
            transform={`translate(${p.x},${p.y})`}
            style={{ cursor: "grab", opacity: dim ? 0.45 : 1 }}
            onPointerDown={(e) => onDown(n.id, e)}
            onPointerEnter={() => setHover(n.id)}
            onPointerLeave={() => setHover(null)}
          >
            <circle r={nodeRadius} fill={colorOf(n.group)} stroke="hsl(var(--background))" strokeWidth={2} />
            <text y={nodeRadius + 14} textAnchor="middle" className="fill-foreground" style={{ fontSize: 11, pointerEvents: "none" }}>
              {n.label ?? n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
