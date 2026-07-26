"use client";

import React, { useCallback, useState } from "react";
import { Tldraw, useEditor, getSnapshot, loadSnapshot } from "tldraw";
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
      loadSnapshot(editor.store, snapshot);
    }
    
    if (readonly) {
      editor.updateInstanceState({ isReadonly: true });
    }

    if (onChange && !readonly) {
      let timeoutId: NodeJS.Timeout;
      editor.store.listen((entry: any) => {
        // Only sync if the change comes from the user (not remote) and affects the document
        if (entry.source !== 'user') return;
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const currentSnapshot = getSnapshot(editor.store);
          onChange(currentSnapshot);
        }, 300); // 300ms debounce to simulate "pen up"
      }, { scope: 'document', source: 'user' });
    }
  }, [snapshot, onChange, readonly]);

  return (
    <div className={cn("relative w-full h-full bg-[#f3f3f3] overflow-hidden", className)}>
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        <Tldraw 
          onMount={handleMount}
          licenseKey={process.env.NEXT_PUBLIC_TLDRAW_LICENSE_KEY}
        />
      </div>
    </div>
  );
}
