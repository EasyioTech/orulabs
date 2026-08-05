"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StrokeData } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { Pen, Eraser, Highlighter, Trash2 } from "lucide-react";

// Fixed logical drawing space. Every client maps pointer input into these coordinates
// and scales back out when painting, so a stroke drawn on a phone lands in the same
// place on a projector. The wrapper is locked to 16:9 to keep the scale uniform.
const VW = 1280;
const VH = 720;
const MAX_POINTS = 1999; // stay under the validator's 2000-point cap per stroke
const MIN_DIST = 2; // min virtual px between sampled points — thins the point stream

const COLORS = ["#111827", "#ef4444", "#2563eb", "#16a34a", "#f59e0b", "#a855f7"];
type Tool = "pen" | "eraser" | "highlighter";

function paintStroke(ctx: CanvasRenderingContext2D, s: StrokeData, scale: number) {
  if (s.points.length === 0) return;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = s.color;
  ctx.lineWidth = Math.max(1, s.width * scale);
  if (s.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
  } else if (s.tool === "highlighter") {
    ctx.globalAlpha = 0.3;
    ctx.lineCap = "butt";
  }
  ctx.beginPath();
  const [first, ...rest] = s.points;
  ctx.moveTo(first.x * scale, first.y * scale);
  if (rest.length === 0) {
    ctx.lineTo(first.x * scale + 0.1, first.y * scale + 0.1);
  } else {
    for (const p of rest) ctx.lineTo(p.x * scale, p.y * scale);
  }
  ctx.stroke();
  ctx.restore();
}

export interface WhiteboardBoardProps {
  strokes: StrokeData[];
  readOnly?: boolean;
  onStroke?: (stroke: StrokeData) => void;
  onClear?: () => void;
  className?: string;
}

export function WhiteboardBoard({ strokes, readOnly, onStroke, onClear, className }: WhiteboardBoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef<StrokeData | null>(null);
  const scaleRef = useRef(1);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(4);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = scaleRef.current;
    for (const s of strokes) paintStroke(ctx, s, scale);
    if (drawingRef.current) paintStroke(ctx, drawingRef.current, scale);
  }, [strokes]);

  // Keep the backing store matched to the displayed size (DPR-aware) and repaint.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      scaleRef.current = canvas.width / VW;
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const toVirtual = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * VW;
    const y = ((e.clientY - rect.top) / rect.height) * VH;
    return { x: Math.min(VW, Math.max(0, x)), y: Math.min(VH, Math.max(0, y)) };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = {
      id: crypto.randomUUID(),
      color,
      width,
      tool,
      points: [toVirtual(e)],
    };
    redraw();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const stroke = drawingRef.current;
    if (readOnly || !stroke) return;
    const p = toVirtual(e);
    const last = stroke.points[stroke.points.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) < MIN_DIST) return;
    if (stroke.points.length < MAX_POINTS) stroke.points.push(p);
    redraw();
  };

  const handlePointerUp = () => {
    const stroke = drawingRef.current;
    drawingRef.current = null;
    if (readOnly || !stroke) return;
    redraw();
    onStroke?.(stroke);
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-white", className)}>
      <div ref={wrapRef} className="relative mx-auto aspect-[16/9] h-full max-h-full w-full max-w-full">
        <canvas
          ref={canvasRef}
          className={cn("absolute inset-0 h-full w-full touch-none", readOnly ? "cursor-default" : "cursor-crosshair")}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {!readOnly && (
        <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur">
          <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} title="Pen">
            <Pen size={16} />
          </ToolButton>
          <ToolButton active={tool === "highlighter"} onClick={() => setTool("highlighter")} title="Highlighter">
            <Highlighter size={16} />
          </ToolButton>
          <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} title="Eraser">
            <Eraser size={16} />
          </ToolButton>

          <div className="mx-1 h-5 w-px bg-gray-200" />

          {tool !== "eraser" &&
            COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={cn(
                  "h-5 w-5 rounded-full border transition-transform",
                  color === c ? "scale-110 border-gray-900 ring-2 ring-gray-300" : "border-gray-200",
                )}
              />
            ))}

          <input
            type="range"
            min={2}
            max={24}
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="mx-1 w-20 accent-gray-800"
            title="Stroke width"
          />

          <div className="mx-1 h-5 w-px bg-gray-200" />

          <ToolButton onClick={() => onClear?.()} title="Clear board">
            <Trash2 size={16} />
          </ToolButton>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
        active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100",
      )}
    >
      {children}
    </button>
  );
}
