import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'typescript' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div className="relative my-4 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-2xl overflow-hidden font-mono text-sm">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="flex items-center gap-1.5 font-medium text-slate-300 ml-2">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs border border-slate-700/60 active:scale-95 cursor-pointer"
          title="複製程式碼"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">已複製</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>複製代碼</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed text-[13px] bg-gradient-to-b from-slate-950 to-slate-900/60">
        <pre className="table w-full">
          {lines.map((line, idx) => (
            <div key={idx} className="table-row hover:bg-indigo-500/5">
              <span className="table-cell pr-4 text-right select-none text-slate-600 text-xs w-8">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre font-mono">{line || ' '}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};
