"use client";

import React, { useCallback, useState } from "react";
import { Tldraw, useEditor } from "tldraw";
import "tldraw/tldraw.css";
import { cn } from "@oruclass/utils";

interface AdvancedWhiteboardProps {
  snapshot?: any;
  onChange?: (snapshot: any) => void;
  readonly?: boolean;
  className?: string;
}

export function AdvancedWhiteboard({ snapshot, onChange, readonly, className }: AdvancedWhiteboardProps) {
  const [store] = useState(() => {
    // We cannot create a complex syncing store right away without custom Yjs/Liveblocks logic.
    // However, we can initialize tldraw and listen to its changes.
    return undefined; // Let tldraw create its default store
  });

  const handleMount = useCallback((editor: any) => {
    if (snapshot && Object.keys(snapshot).length > 0) {
      editor.store.loadSnapshot(snapshot);
    }
    
    if (readonly) {
      editor.updateInstanceState({ isReadonly: true });
    }

    if (onChange && !readonly) {
      editor.store.listen(() => {
        // Debounce or send snapshot directly
        const currentSnapshot = editor.store.getSnapshot();
        onChange(currentSnapshot);
      });
    }
  }, [snapshot, onChange, readonly]);

  return (
    <div className={cn("relative w-full h-full bg-[#f3f3f3] overflow-hidden", className)}>
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Tldraw 
          onMount={handleMount}
        />
      </div>
    </div>
  );
}
