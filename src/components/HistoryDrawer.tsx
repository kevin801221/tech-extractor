import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  ArrowRight, 
  Clock3, 
  Library,
  Download
} from 'lucide-react';
import { SavedArticleSummary } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedArticleSummary[];
  onSelectArticle: (item: SavedArticleSummary) => void;
  onDeleteArticle: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onClearAll: () => void;
  initialFilterBookmark?: boolean;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectArticle,
  onDeleteArticle,
  onToggleBookmark,
  onClearAll,
  initialFilterBookmark = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyBookmarks, setOnlyBookmarks] = useState(initialFilterBookmark);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    const matchesBookmark = onlyBookmarks ? item.isBookmarked : true;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.oneSentencePitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesBookmark && matchesSearch;
  });

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tech_summaries_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Clock3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">歷史摘要記錄與收藏庫</h3>
              <p className="text-xs text-slate-400">共 {history.length} 篇摘要已儲存在本機瀏覽器</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋標題、技術標籤或摘要內容..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setOnlyBookmarks(false)}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  !onlyBookmarks ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                全部 ({history.length})
              </button>
              <button
                onClick={() => setOnlyBookmarks(true)}
                className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1 ${
                  onlyBookmarks ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>已收藏 ({history.filter((h) => h.isBookmarked).length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                disabled={history.length === 0}
                className="flex items-center gap-1 text-slate-400 hover:text-indigo-300 disabled:opacity-40 transition-colors"
                title="匯出 JSON 備份"
              >
                <Download className="w-3.5 h-3.5" />
                <span>匯出備份</span>
              </button>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('確定要清空所有歷史摘要記錄嗎？')) {
                      onClearAll();
                    }
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Library className="w-10 h-10 text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">尚無符合的摘要記錄</p>
              <p className="text-xs text-slate-500">摘要過的文章將會自動儲存在此處方便日後重溫。</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition-all space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {item.summary.difficultyLevel}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleBookmark(item.id)}
                        className={`p-1.5 rounded transition-colors ${
                          item.isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'
                        }`}
                        title={item.isBookmarked ? '已收藏' : '收藏'}
                      >
                        {item.isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onDeleteArticle(item.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        title="刪除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4
                    onClick={() => {
                      onSelectArticle(item);
                      onClose();
                    }}
                    className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer line-clamp-2"
                  >
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {item.summary.oneSentencePitch}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-850">
                  <span>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={() => {
                      onSelectArticle(item);
                      onClose();
                    }}
                    className="flex items-center gap-1 text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform cursor-pointer"
                  >
                    <span>開啟摘要</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
