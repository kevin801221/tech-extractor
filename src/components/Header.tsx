import React from 'react';
import { TerminalSquare, Bookmark, Clock3, FilePlus2, Sparkles, Columns2 } from 'lucide-react';

interface HeaderProps {
  historyCount: number;
  bookmarkedCount: number;
  onOpenHistory: () => void;
  onOpenBookmarks: () => void;
  onNewArticle: () => void;
  hasActiveSummary: boolean;
  onOpenComparison?: () => void;
  hasOriginalText?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  historyCount,
  bookmarkedCount,
  onOpenHistory,
  onOpenBookmarks,
  onNewArticle,
  hasActiveSummary,
  onOpenComparison,
  hasOriginalText,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <TerminalSquare className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-indigo-100 to-cyan-200 bg-clip-text text-transparent">
                技術文章摘要器
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                <Sparkles className="w-2.5 h-2.5" />
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              專為工程師提煉系統架構、關鍵代碼、選型權衡與踩坑指南
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {hasActiveSummary && (
            <button
              onClick={onNewArticle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs sm:text-sm font-medium transition-all shadow-sm shadow-indigo-600/30 active:scale-95 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>摘要新文章</span>
            </button>
          )}

          {hasActiveSummary && hasOriginalText && onOpenComparison && (
            <button
              onClick={onOpenComparison}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-all border border-slate-700/70 active:scale-95 cursor-pointer"
              title="原文與摘要雙欄對照"
            >
              <Columns2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">雙欄對照</span>
            </button>
          )}

          <button
            onClick={onOpenBookmarks}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-all border border-slate-700/60 cursor-pointer"
            title="查看已收藏文章"
          >
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">收藏</span>
            {bookmarkedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                {bookmarkedCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium transition-all border border-slate-700/60 cursor-pointer"
            title="歷史摘要記錄"
          >
            <Clock3 className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">歷史</span>
            {historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
