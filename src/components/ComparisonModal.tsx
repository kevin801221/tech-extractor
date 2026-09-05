import React, { useState } from 'react';
import { X, Columns2, FileText, Sparkles, CheckCircle2, Workflow, AlertTriangle } from 'lucide-react';
import { SummaryOutput } from '../types';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  summary: SummaryOutput;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  rawText,
  summary,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-7xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Columns2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>原文與 AI 摘要雙欄對照</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-normal">
                  Split Comparison Mode
                </span>
              </h3>
              <p className="text-xs text-slate-400">{summary.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Side-by-Side Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 overflow-hidden">
          {/* Left Column: Original Full Text */}
          <div className="h-full flex flex-col overflow-hidden bg-slate-950/60">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>原文全文 (約 {summary.originalEstimatedReadTimeMinutes} 分鐘閱讀)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {rawText.length} 字
              </span>
            </div>
            <div className="flex-1 p-5 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
              {rawText}
            </div>
          </div>

          {/* Right Column: AI Structured Summary */}
          <div className="h-full flex flex-col overflow-hidden bg-slate-900/40">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI 架構提煉摘要 (約 {summary.summaryReadTimeMinutes} 分鐘速讀)</span>
              </span>
            </div>
            <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed">
              {/* Pitch */}
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                  核心結論
                </span>
                <p className="font-semibold text-slate-100">{summary.oneSentencePitch}</p>
              </div>

              {/* Takeaways */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>關鍵要點：</span>
                </span>
                <ul className="space-y-1.5">
                  {summary.executiveSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Architecture Overview */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                  <span>架構設計理念：</span>
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{summary.architectureInsights.overview}</p>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-200">
                  <span className="font-bold text-emerald-400 block mb-1">優點 (Pros):</span>
                  {summary.architectureInsights.tradeoffs.pros.map((p, i) => (
                    <div key={i}>+ {p}</div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-200">
                  <span className="font-bold text-rose-400 block mb-1">缺點 (Cons):</span>
                  {summary.architectureInsights.tradeoffs.cons.map((c, i) => (
                    <div key={i}>- {c}</div>
                  ))}
                </div>
              </div>

              {/* Gotchas */}
              {summary.codeAndImplementation.gotchasAndPitfalls.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>踩坑提示：</span>
                  </span>
                  {summary.codeAndImplementation.gotchasAndPitfalls.map((g, i) => (
                    <div key={i}>• {g}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
