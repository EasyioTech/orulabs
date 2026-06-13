"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Pen, Highlighter, Eraser, Trash2, Check, Download, Undo2, Redo2 } from "lucide-react";
import type { StrokeData } from "@oruclass/types";
import { cn } from "@oruclass/utils";
import { 
  Square, 
  Minus, 
  ArrowRight,
  Shapes,
  Palette
} from "lucide-react";

interface AdvancedWhiteboardProps {
  strokes: StrokeData[];
  onStrokeEnd: (stroke: StrokeData) => void;
  onStrokesChange?: (strokes: StrokeData[]) => void;
  onClear: () => void;
  readonly?: boolean;
  className?: string;
}

type ToolType = "pen" | "highlighter" | "eraser" | "line" | "arrow" | "square";

const PRESET_PENS = [
  { id: "black", color: "#1e293b", defaultSize: 3 },
  { id: "red", color: "#ef4444", defaultSize: 3 },
  { id: "blue", color: "#3b82f6", defaultSize: 3 }
];
const HIGHLIGHTER_COLOR = "rgba(253, 224, 71, 0.5)"; // Yellow highlighter
const SIZES = [2, 4, 6, 8, 12];
const HIGHLIGHTER_SIZE = 24;
const ERASER_SIZE = 30;

const distToSegmentSquared = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
};

const isPointNearStroke = (p: {x: number, y: number}, stroke: StrokeData, eraserRadius: number) => {
  const thresholdSquared = eraserRadius ** 2;
  if (stroke.points.length < 2) return false;
  
  if (stroke.tool === "square") {
    const start = stroke.points[0];
    const end = stroke.points[stroke.points.length - 1];
    const corners = [
      start,
      { x: end.x, y: start.y },
      end,
      { x: start.x, y: end.y }
    ];
    for (let i = 0; i < 4; i++) {
      if (distToSegmentSquared(p, corners[i], corners[(i + 1) % 4]) <= thresholdSquared) return true;
    }
    return false;
  }
  
  if (stroke.tool === "line" || stroke.tool === "arrow") {
    return distToSegmentSquared(p, stroke.points[0], stroke.points[stroke.points.length - 1]) <= thresholdSquared;
  }
  
  for (let i = 0; i < stroke.points.length - 1; i++) {
    if (distToSegmentSquared(p, stroke.points[i], stroke.points[i + 1]) <= thresholdSquared) return true;
  }
  return false;
};

export function AdvancedWhiteboard({ strokes, onStrokeEnd, onStrokesChange, onClear, readonly, className }: AdvancedWhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [activeTool, setActiveTool] = useState<ToolType>("pen");
  const [activePenId, setActivePenId] = useState<string>("black");
  
  const [penSizes, setPenSizes] = useState<Record<string, number>>({
    black: 3, red: 3, blue: 3
  });
  
  const [currentStroke, setCurrentStroke] = useState<StrokeData | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
  const [showSizePopover, setShowSizePopover] = useState(false);
  const [showShapePopover, setShowShapePopover] = useState(false);
  const [customColor, setCustomColor] = useState("#9333ea");

  // Responsive canvas sizing
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        setCanvasDimensions({ width: width * dpr, height: height * dpr });
        
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }
      }
    });
    
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Drawing Engine
  const renderStrokes = useCallback((ctx: CanvasRenderingContext2D, strokesToRender: StrokeData[], dpr: number) => {
    strokesToRender.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      if (stroke.tool === "square") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
        ctx.strokeRect(start.x * dpr, start.y * dpr, (end.x - start.x) * dpr, (end.y - start.y) * dpr);
        return;
      }
      
      if (stroke.tool === "line" || stroke.tool === "arrow") {
        const start = stroke.points[0];
        const end = stroke.points[stroke.points.length - 1];
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width * dpr;
        ctx.beginPath();
        ctx.moveTo(start.x * dpr, start.y * dpr);
        ctx.lineTo(end.x * dpr, end.y * dpr);
        ctx.stroke();
        
        if (stroke.tool === "arrow") {
          const angle = Math.atan2(end.y - start.y, end.x - start.x);
          const headlen = 10 + stroke.width * 2;
          ctx.beginPath();
          ctx.moveTo(end.x * dpr, end.y * dpr);
          ctx.lineTo((end.x - headlen * Math.cos(angle - Math.PI / 6)) * dpr, (end.y - headlen * Math.sin(angle - Math.PI / 6)) * dpr);
          ctx.moveTo(end.x * dpr, end.y * dpr);
          ctx.lineTo((end.x - headlen * Math.cos(angle + Math.PI / 6)) * dpr, (end.y - headlen * Math.sin(angle + Math.PI / 6)) * dpr);
          ctx.stroke();
        }
        return;
      }

      ctx.beginPath();
      
      if (stroke.tool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
      }
      
      ctx.lineWidth = stroke.width * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      
      ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * dpr, stroke.points[i].y * dpr);
      }
      ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over"; // reset
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all completed strokes
    renderStrokes(ctx, strokes, dpr);
    
    // Draw current active stroke
    if (currentStroke) {
      renderStrokes(ctx, [currentStroke], dpr);
    }
  }, [strokes, currentStroke, canvasDimensions, renderStrokes]);

  // Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readonly) return;
    if (e.pointerType === "mouse" && e.button !== 0) return; // Only left click
    
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "eraser") {
      let strokeDeleted = false;
      const newStrokes = [...strokes];
      // iterate backwards to delete top-most first
      for (let i = newStrokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke({x, y}, newStrokes[i], ERASER_SIZE / 2)) {
          newStrokes.splice(i, 1);
          strokeDeleted = true;
          break; // delete one at a time per down-click
        }
      }
      if (strokeDeleted && onStrokesChange) {
        onStrokesChange(newStrokes);
      }
      // Also set state for dragging to erase multiple
      setCurrentStroke({ points: [{x, y}], color: "transparent", width: 1, tool: "eraser" });
      setShowSizePopover(false);
      setShowShapePopover(false);
      return;
    }
    
    let color = activePenId === "custom" ? customColor : (PRESET_PENS.find(p => p.id === activePenId)?.color || "#000");
    let width = penSizes[activePenId] || 3;
    
    if (activeTool === "highlighter") {
      color = HIGHLIGHTER_COLOR;
      width = HIGHLIGHTER_SIZE;
    }
    
    setCurrentStroke({
      points: [{ x, y }],
      color,
      width,
      tool: activeTool
    });
    setShowSizePopover(false);
    setShowShapePopover(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentStroke || readonly) return;
    // Simple pressure simulation for styluses (optional enhancement)
    const pressure = e.pressure ? Math.max(e.pressure, 0.2) : 1;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "eraser") {
      let strokeDeleted = false;
      const newStrokes = [...strokes];
      for (let i = newStrokes.length - 1; i >= 0; i--) {
        if (isPointNearStroke({x, y}, newStrokes[i], ERASER_SIZE / 2)) {
          newStrokes.splice(i, 1);
          strokeDeleted = true;
          break;
        }
      }
      if (strokeDeleted && onStrokesChange) {
        onStrokesChange(newStrokes);
      }
      return;
    }
    
    setCurrentStroke(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        points: [...prev.points, { x, y }]
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (currentStroke && currentStroke.tool !== "eraser") {
      onStrokeEnd(currentStroke);
    }
    setCurrentStroke(null);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "whiteboard.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getCursor = () => {
    if (readonly) return "default";
    if (activeTool === "eraser") return "cell";
    return "crosshair";
  };

  const selectPen = (id: string) => {
    if (activeTool === "pen" && activePenId === id) {
      setShowSizePopover(!showSizePopover); // Toggle size menu if already active
      setShowShapePopover(false);
    } else {
      setActiveTool("pen");
      setActivePenId(id);
      setShowSizePopover(false);
      setShowShapePopover(false);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-full bg-[#f3f3f3] overflow-hidden flex flex-col",
        "bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:24px_24px]", // Subtle dot grid like MS Whiteboard
        className
      )}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      
      {/* MS Whiteboard-style Toolbar */}
      {!readonly && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          
          {/* Popover for Pen Size */}
          {showSizePopover && activeTool === "pen" && (
            <div className="mb-3 bg-white rounded-xl shadow-md border border-gray-100 p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setPenSizes(prev => ({ ...prev, [activePenId]: size }))}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    penSizes[activePenId] === size ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50"
                  )}
                >
                  <div 
                    className="rounded-full bg-gray-800" 
                    style={{ 
                      width: size + 2, 
                      height: size + 2,
                      backgroundColor: PRESET_PENS.find(p => p.id === activePenId)?.color 
                    }} 
                  />
                </button>
              ))}
            </div>
          )}

          {/* Popover for Shapes */}
          {showShapePopover && (
            <div className="mb-3 bg-white rounded-xl shadow-md border border-gray-100 p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
              <button
                onClick={() => { setActiveTool("square"); setShowShapePopover(false); }}
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", activeTool === "square" ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50")}
                title="Square"
              >
                <Square size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => { setActiveTool("line"); setShowShapePopover(false); }}
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", activeTool === "line" ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50")}
                title="Line"
              >
                <Minus size={20} className="text-gray-700" />
              </button>
              <button
                onClick={() => { setActiveTool("arrow"); setShowShapePopover(false); }}
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", activeTool === "arrow" ? "bg-gray-100 shadow-sm" : "hover:bg-gray-50")}
                title="Arrow"
              >
                <ArrowRight size={20} className="text-gray-700" />
              </button>
            </div>
          )}

          {/* Main Toolbar Pill */}
          <div className="bg-white/95 backdrop-blur-xl shadow-md border border-white/50 rounded-full px-1.5 md:px-2 py-1 md:py-1.5 flex items-center gap-1 md:gap-1.5">
            {/* Pens */}
            {PRESET_PENS.map((pen) => {
              const isActive = activeTool === "pen" && activePenId === pen.id;
              return (
                <button
                  key={pen.id}
                  onClick={() => selectPen(pen.id)}
                  className={cn(
                    "relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 group",
                    isActive ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  title={`Pen (${pen.id})`}
                >
                  <div className="relative">
                    <Pen 
                      size={20} 
                      className={cn(
                        "transition-transform", 
                        isActive ? "text-gray-800 -translate-y-1" : "text-gray-500"
                      )} 
                    />
                    <div 
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 rounded-full"
                      style={{ backgroundColor: pen.color }}
                    />
                  </div>
                </button>
              );
            })}

            {/* Custom Color Pen */}
            <button
              onClick={() => selectPen("custom")}
              className={cn(
                "relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 group",
                activeTool === "pen" && activePenId === "custom" ? "bg-gray-100" : "hover:bg-gray-50"
              )}
              title="Custom Color Pen"
            >
              <div className="relative flex items-center justify-center w-full h-full">
                <Palette 
                  size={20} 
                  style={{ color: customColor }}
                  className={cn(
                    "transition-transform",
                    activeTool === "pen" && activePenId === "custom" ? "-translate-y-1" : ""
                  )}
                />
                <input 
                  type="color" 
                  value={customColor} 
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Pick Color"
                  onClick={(e) => {
                    // Prevent button click from toggling size popover if we just want to change color
                    e.stopPropagation();
                    setActiveTool("pen");
                    setActivePenId("custom");
                  }}
                />
              </div>
            </button>

            <div className="w-[1px] h-8 bg-gray-200 mx-1" />

            {/* Highlighter */}
            <button
              onClick={() => {
                setShowSizePopover(false);
                setShowShapePopover(false);
                setActiveTool("highlighter");
              }}
              className={cn(
                "relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 group",
                activeTool === "highlighter" ? "bg-gray-100" : "hover:bg-gray-50"
              )}
              title="Highlighter"
            >
              <div className="relative">
                <Highlighter 
                  size={20} 
                  className={cn(
                    "transition-transform",
                    activeTool === "highlighter" ? "text-gray-800 -translate-y-1" : "text-gray-500"
                  )}
                />
                <div 
                  className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 rounded-full"
                  style={{ backgroundColor: "#fde047" }} // Yellow solid for icon
                />
              </div>
            </button>

            {/* Eraser */}
            <button
              onClick={() => {
                setShowSizePopover(false);
                setShowShapePopover(false);
                setActiveTool("eraser");
              }}
              className={cn(
                "relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 group",
                activeTool === "eraser" ? "bg-gray-100" : "hover:bg-gray-50"
              )}
              title="Eraser"
            >
              <Eraser 
                size={20} 
                className={cn(
                  "transition-transform",
                  activeTool === "eraser" ? "text-gray-800" : "text-gray-500"
                )}
              />
            </button>

            <div className="w-[1px] h-8 bg-gray-200 mx-1" />

            {/* Shapes */}
            <button
              onClick={() => {
                setShowShapePopover(!showShapePopover);
                setShowSizePopover(false);
                if (activeTool !== "square" && activeTool !== "line" && activeTool !== "arrow") {
                  setActiveTool("square"); // default shape
                }
              }}
              className={cn(
                "relative w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full transition-all duration-200 group",
                (activeTool === "square" || activeTool === "line" || activeTool === "arrow") ? "bg-gray-100" : "hover:bg-gray-50"
              )}
              title="Shapes"
            >
              <Shapes 
                size={20} 
                className={cn(
                  "transition-transform",
                  (activeTool === "square" || activeTool === "line" || activeTool === "arrow") ? "text-gray-800 -translate-y-1" : "text-gray-500"
                )}
              />
            </button>

            <div className="w-[1px] h-8 bg-gray-200 mx-1" />
            
            {/* Download Board */}
            <button
              onClick={handleDownload}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full text-gray-500 hover:text-brand-600 hover:bg-brand-50 transition-colors duration-200"
              title="Download Board"
            >
              <Download size={20} />
            </button>

            {/* Clear Board */}
            <button
              onClick={onClear}
              className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
              title="Clear Board"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
