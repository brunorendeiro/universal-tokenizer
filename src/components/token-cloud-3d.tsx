"use client";

import { useEffect, useRef, useState } from "react";
import { project } from "@/lib/vec3-projection";
import { valueToColor } from "@/lib/heatmap-color";

const AUTO_ROTATE_SPEED = 0.15; // radians per second
const VIEWPORT_HEIGHT = 380;

export function TokenCloud3D({
  tokens,
  points,
  magnitudes,
}: {
  tokens: string[];
  /** Pre-reduced [x, y, z] coordinates, one per token. */
  points: [number, number, number][];
  /** 0..1 per token — drives point color, a stand-in "4th dimension". */
  magnitudes: number[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [yaw, setYaw] = useState(0.4);
  const [pitch, setPitch] = useState(-0.3);
  const [dragging, setDragging] = useState(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTime = useRef<number | null>(null);

  // Gentle auto-rotate while idle; pauses the instant the user drags.
  useEffect(() => {
    if (dragging) return;
    const tick = (time: number) => {
      if (lastFrameTime.current != null) {
        const dt = (time - lastFrameTime.current) / 1000;
        setYaw((y) => y + AUTO_ROTATE_SPEED * dt);
      }
      lastFrameTime.current = time;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastFrameTime.current = null;
    };
  }, [dragging]);

  const maxAbs = Math.max(
    1e-6,
    ...points.flatMap((p) => p.map((v) => Math.abs(v))),
  );
  const viewportRadius = VIEWPORT_HEIGHT / 2;
  const scaleFactor = (viewportRadius * 0.72) / maxAbs;

  function handlePointerDown(e: React.PointerEvent) {
    setDragging(true);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setYaw((y) => y + dx * 0.008);
    setPitch((p) => Math.max(-1.4, Math.min(1.4, p + dy * 0.008)));
  }

  function handlePointerUp() {
    setDragging(false);
    lastPointer.current = null;
  }

  const projected = points.map((p) => project(p, yaw, pitch, scaleFactor, viewportRadius));
  // Painter's algorithm: draw far points first so near ones layer on top.
  const order = projected
    .map((_, i) => i)
    .sort((a, b) => projected[a].depth - projected[b].depth);

  // Three reference axes through the origin (where each PCA component is
  // zero), so the rotation has a visible frame instead of points floating
  // with no sense of orientation or scale.
  const axisReach = maxAbs * 1.2;
  const axisLines: { from: [number, number, number]; to: [number, number, number] }[] = [
    { from: [-axisReach, 0, 0], to: [axisReach, 0, 0] },
    { from: [0, -axisReach, 0], to: [0, axisReach, 0] },
    { from: [0, 0, -axisReach], to: [0, 0, axisReach] },
  ];
  const projectedAxes = axisLines.map(({ from, to }) => ({
    from: project(from, yaw, pitch, scaleFactor, viewportRadius),
    to: project(to, yaw, pitch, scaleFactor, viewportRadius),
  }));
  const origin = project([0, 0, 0], yaw, pitch, scaleFactor, viewportRadius);

  return (
    <div
      ref={containerRef}
      className="bg-muted/20 relative touch-none overflow-hidden rounded-md border select-none"
      style={{ height: VIEWPORT_HEIGHT, cursor: dragging ? "grabbing" : "grab" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        {projectedAxes.map((axis, i) => (
          <line
            key={i}
            x1={viewportRadius + axis.from.x}
            y1={viewportRadius + axis.from.y}
            x2={viewportRadius + axis.to.x}
            y2={viewportRadius + axis.to.y}
            className="stroke-muted-foreground/25"
            strokeWidth={1}
          />
        ))}
        <circle
          cx={viewportRadius + origin.x}
          cy={viewportRadius + origin.y}
          r={2.5}
          className="fill-muted-foreground/40"
        />
      </svg>
      {order.map((i) => {
        const proj = projected[i];
        const fontSize = 11 + proj.depth * 8;
        const opacity = 0.35 + proj.depth * 0.65;
        const color = valueToColor(magnitudes[i] ?? 0.5);
        return (
          <div
            key={i}
            className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
            style={{
              left: viewportRadius + proj.x,
              top: viewportRadius + proj.y,
              opacity,
              zIndex: Math.round(proj.depth * 1000),
            }}
          >
            <span
              className="block rounded-full"
              style={{ width: 6 + proj.depth * 4, height: 6 + proj.depth * 4, backgroundColor: color }}
            />
            <span
              className="font-mono whitespace-nowrap"
              style={{ fontSize }}
            >
              {tokens[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
