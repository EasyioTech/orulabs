"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import { cn } from "@oruclass/utils";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link as LinkIcon, Palette, Undo, Redo, WifiOff, RefreshCw, Loader2 } from "lucide-react";

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const toggleLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const colors = ["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 border-b border-gray-100 rounded-t-lg">
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("bold") && "bg-gray-200 text-brand-600")} title="Bold" type="button"><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("italic") && "bg-gray-200 text-brand-600")} title="Italic" type="button"><Italic size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("underline") && "bg-gray-200 text-brand-600")} title="Underline" type="button"><UnderlineIcon size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("strike") && "bg-gray-200 text-brand-600")} title="Strikethrough" type="button"><Strikethrough size={16} /></button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("bulletList") && "bg-gray-200 text-brand-600")} title="Bullet List" type="button"><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("orderedList") && "bg-gray-200 text-brand-600")} title="Ordered List" type="button"><ListOrdered size={16} /></button>
      <div className="w-px h-5 bg-gray-300 mx-1" />
      <button onClick={toggleLink} className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("link") && "bg-gray-200 text-brand-600")} title="Link" type="button"><LinkIcon size={16} /></button>
      <div className="flex items-center gap-0.5 ml-1 relative group">
        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1" title="Text Color" type="button"><Palette size={16} /></button>
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:flex flex-wrap w-32 gap-1 z-10">
          {colors.map((color) => (
            <button key={color} type="button" className="w-6 h-6 rounded border border-gray-100" style={{ backgroundColor: color }} onClick={() => editor.chain().focus().setColor(color).run()} />
          ))}
        </div>
      </div>
      <div className="flex-1" />
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-50 transition-colors" title="Undo" type="button"><Undo size={16} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-50 transition-colors" title="Redo" type="button"><Redo size={16} /></button>
    </div>
  );
};

const colorArray = ["#f87171", "#fb923c", "#fbbf24", "#34d399", "#38bdf8", "#818cf8", "#c084fc", "#f472b6"];

function EditorView({ provider, ydoc, initialContent, minHeight }: { provider: HocuspocusProvider, ydoc: Y.Doc, initialContent?: string, minHeight: string }) {
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

  useEffect(() => {
    const handleStatus = ({ status }: { status: string }) => {
      if (status === "connected") setStatus("connected");
      else if (status === "connecting") setStatus("connecting");
      else setStatus("disconnected");
    };
    
    // Set initial status
    if ((provider as { status?: string }).status === "connected") setStatus("connected");
    
    provider.on("status", handleStatus);
    return () => {
      provider.off("status", handleStatus);
    };
  }, [provider]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // @ts-ignore
        history: false,
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user?.name || "Anonymous",
          color: colorArray[Math.floor(Math.random() * colorArray.length)],
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-6 py-8 h-full bg-white",
        style: `min-height: ${minHeight};`,
      },
    },
  });

  useEffect(() => {
    if (!editor || !initialContent || status !== "connected") return;
    const t = setTimeout(() => {
      if (editor.isEmpty) editor.commands.setContent(initialContent);
    }, 500);
    return () => clearTimeout(t);
  }, [editor, initialContent, status]);

  return (
    <div className="flex flex-col h-full bg-gray-50/50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <MenuBar editor={editor} />
      
      {status !== "connected" && (
        <div className={cn(
          "flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold border-b",
          status === "connecting"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-red-50 text-red-700 border-red-200"
        )}>
          {status === "connecting" ? (
            <><RefreshCw size={12} className="animate-spin" /> Connecting to collaborative document...</>
          ) : (
            <><WifiOff size={12} /> Disconnected — changes may not be saved</>
          )}
        </div>
      )}

      <div className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-4xl shadow-sm rounded border border-gray-200 overflow-hidden bg-white">
          <EditorContent editor={editor} className="h-full min-h-[500px]" />
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .collaboration-cursor__caret {
          border-left: 1px solid #0d0d0d;
          border-right: 1px solid #0d0d0d;
          margin-left: -1px;
          margin-right: -1px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }
        .collaboration-cursor__label {
          border-radius: 3px 3px 3px 0;
          color: #fff;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          left: -1px;
          line-height: normal;
          padding: 0.1rem 0.3rem;
          position: absolute;
          top: -1.4em;
          user-select: none;
          white-space: nowrap;
        }
      `}} />
    </div>
  );
}

interface LiveDocumentEditorProps {
  documentId: string;
  initialContent?: string;
  minHeight?: string;
}

export function LiveDocumentEditor({ documentId, initialContent, minHeight = "400px" }: LiveDocumentEditorProps) {
  const [collab, setCollab] = useState<{ provider: HocuspocusProvider, ydoc: Y.Doc } | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const wsUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      ? process.env.NEXT_PUBLIC_SOCKET_URL.replace(/^http/, "ws") + "/collaboration"
      : (process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "ws://localhost:3001")).replace(/^http/, "ws") + "/collaboration";
      
    const prov = new HocuspocusProvider({
      url: wsUrl,
      name: documentId,
      document: doc,
    });
    
    setCollab({ provider: prov, ydoc: doc });
    
    return () => {
      prov.destroy();
    };
  }, [documentId]);

  if (!collab) {
    return (
      <div className="flex flex-col h-full bg-gray-50/50 border border-gray-200 rounded-xl overflow-hidden shadow-sm items-center justify-center text-gray-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mb-2" />
        Initializing document...
      </div>
    );
  }

  return <EditorView key={collab.ydoc.guid} provider={collab.provider} ydoc={collab.ydoc} initialContent={initialContent} minHeight={minHeight} />;
}
