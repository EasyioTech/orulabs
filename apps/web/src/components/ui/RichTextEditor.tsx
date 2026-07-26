"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Link as LinkIcon, Palette, Undo, Redo } from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@oruclass/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const toggleLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null;
  }

  const colors = ["#000000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#a855f7"];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 border-b border-gray-100 rounded-t-lg">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("bold") && "bg-gray-200 text-brand-600")}
        title="Bold"
        type="button"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("italic") && "bg-gray-200 text-brand-600")}
        title="Italic"
        type="button"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("underline") && "bg-gray-200 text-brand-600")}
        title="Underline"
        type="button"
      >
        <UnderlineIcon size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("strike") && "bg-gray-200 text-brand-600")}
        title="Strikethrough"
        type="button"
      >
        <Strikethrough size={16} />
      </button>
      
      <div className="w-px h-5 bg-gray-300 mx-1" />
      
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("bulletList") && "bg-gray-200 text-brand-600")}
        title="Bullet List"
        type="button"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("orderedList") && "bg-gray-200 text-brand-600")}
        title="Ordered List"
        type="button"
      >
        <ListOrdered size={16} />
      </button>
      
      <div className="w-px h-5 bg-gray-300 mx-1" />

      <button
        onClick={toggleLink}
        className={cn("p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors", editor.isActive("link") && "bg-gray-200 text-brand-600")}
        title="Link"
        type="button"
      >
        <LinkIcon size={16} />
      </button>

      <div className="flex items-center gap-0.5 ml-1 relative group">
        <button
          className="p-1.5 rounded hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1"
          title="Text Color"
          type="button"
        >
          <Palette size={16} />
        </button>
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-100 rounded-lg shadow-lg hidden group-hover:flex flex-wrap w-32 gap-1 z-10">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded border border-gray-100"
              style={{ backgroundColor: color }}
              onClick={() => editor.chain().focus().setColor(color).run()}
            />
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-50 transition-colors"
        title="Undo"
        type="button"
      >
        <Undo size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-50 transition-colors"
        title="Redo"
        type="button"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder = "Type here...", className, minHeight = "150px" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight};`,
      },
    },
  });

  // Keep content in sync if value prop changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className={cn("border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all", className)}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-auto bg-white" />
    </div>
  );
}
