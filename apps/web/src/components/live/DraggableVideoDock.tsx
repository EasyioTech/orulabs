"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Move, X, PictureInPicture2 } from "lucide-react";
import { VideoConferenceRoom } from "./VideoConferenceRoom";
import { cn } from "@oruclass/utils";

type DockMode = "pip" | "docked" | "fullscreen";

export function DraggableVideoDock({ 
  trainingId, 
  onClose,
  boundsRef
}: { 
  trainingId: string; 
  onClose: () => void;
  boundsRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [mode, setMode] = useState<DockMode>("docked");
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile && mode === "docked") {
        setMode("pip");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [mode]);

  const variants = {
    pip: {
      width: 140,
      height: 200,
      borderRadius: 16,
    },
    docked: {
      width: 384, // w-96
      height: 500,
      borderRadius: 16,
    },
    fullscreen: {
      width: "100%",
      height: "100%",
      borderRadius: 0,
      x: 0,
      y: 0,
    }
  };

  return (
    <motion.div
      drag={mode !== "fullscreen"}
      dragConstraints={boundsRef}
      dragElastic={0.1}
      dragMomentum={false}
      initial={false}
      animate={mode}
      variants={variants}
      className={cn(
        "absolute z-50 flex flex-col bg-black shadow-2xl overflow-hidden",
        mode !== "fullscreen" && "cursor-move border border-white/20"
      )}
      style={{
        bottom: mode !== "fullscreen" ? (isMobile ? 16 : 24) : 0,
        right: mode !== "fullscreen" ? (isMobile ? 16 : 24) : 0,
        touchAction: "none"
      }}
    >
      {/* Header Toolbar - Appears on hover */}
      <div className="group absolute top-0 inset-x-0 h-12 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-between px-2">
        <div className="flex items-center gap-1 text-white/70 pl-1">
          {mode !== "fullscreen" && <Move size={14} />}
        </div>
        
        <div className="flex items-center gap-1">
          {mode !== "pip" && (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMode("pip")} 
              className="p-1.5 hover:bg-white/20 rounded text-white/90 transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture2 size={15} />
            </button>
          )}
          {mode !== "docked" && (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMode("docked")} 
              className="p-1.5 hover:bg-white/20 rounded text-white/90 transition-colors"
              title="Theater Mode"
            >
              <Minimize2 size={15} />
            </button>
          )}
          {mode !== "fullscreen" && !isMobile && (
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setMode("fullscreen")} 
              className="p-1.5 hover:bg-white/20 rounded text-white/90 transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={15} />
            </button>
          )}
          <button 
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose} 
            className="p-1.5 hover:bg-red-500 hover:text-white rounded text-white/90 transition-colors ml-1"
            title="Close"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full h-full pointer-events-auto select-none">
        <VideoConferenceRoom trainingId={trainingId} />
      </div>
    </motion.div>
  );
}
