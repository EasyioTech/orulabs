"use client";

import React, { useRef, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { Play, RotateCcw, CheckCircle2 } from "lucide-react";
import { cn } from "@oruclass/utils";

interface MonacoLiveEditorProps {
  language: string;
  initialCode: string;
  value: string;
  onChange: (value: string) => void;
  readonly?: boolean;
  className?: string;
  prompt?: string;
}

export function MonacoLiveEditor({
  language,
  initialCode,
  value,
  onChange,
  readonly = false,
  className,
  prompt
}: MonacoLiveEditorProps) {
  const monaco = useMonaco();
  const [output, setOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fallback simple execution for JavaScript just to show it works entirely client-side
  const handleExecute = async () => {
    if (language !== "javascript") {
      setOutput(`Execution for ${language} requires a backend sandbox (coming soon!).\nOnly JS runs locally.`);
      return;
    }

    setIsExecuting(true);
    setOutput(null);

    try {
      // Very basic local execution via Function constructor just to prove it works
      const logs: string[] = [];
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      // Wrap in async IIFE
      const code = `(async () => { ${value} })()`;
      await new Function(code)();
      
      console.log = originalConsoleLog;
      setOutput(logs.join('\n') || "Execution finished with no output.");
    } catch (e: any) {
      setOutput(`Error: ${e.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    onChange(initialCode);
    setOutput(null);
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-2xl border border-slate-700/50", className)}>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333333]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs font-mono text-slate-400 ml-2 bg-slate-800/50 px-2 py-0.5 rounded uppercase tracking-wider">
            {language}
          </span>
        </div>
        
        {!readonly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Play size={14} className={isExecuting ? "animate-pulse" : ""} />
              {isExecuting ? "Running..." : "Run Code"}
            </button>
          </div>
        )}
      </div>

      {prompt && (
        <div className="px-5 py-4 bg-slate-800/40 border-b border-slate-700/50">
          <h3 className="text-sm font-semibold text-indigo-300 mb-1 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Challenge
          </h3>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">{prompt}</p>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 relative min-h-[300px]">
        <Editor
          height="100%"
          language={language === "node" ? "javascript" : language}
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val ?? "")}
          options={{
            readOnly: readonly,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
          loading={
            <div className="flex items-center justify-center h-full text-slate-500">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
              Loading Monaco Editor...
            </div>
          }
        />
      </div>

      {/* Output Console */}
      {output !== null && (
        <div className="h-48 bg-[#0d0d0d] border-t border-[#333333] flex flex-col relative animate-in slide-in-from-bottom-5">
          <div className="px-4 py-2 bg-[#1a1a1a] border-b border-[#333333] flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Console Output</span>
            <button onClick={() => setOutput(null)} className="text-xs text-slate-500 hover:text-white transition-colors">
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <pre className={cn("text-sm font-mono whitespace-pre-wrap", output.startsWith("Error") ? "text-red-400" : "text-green-400")}>
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
