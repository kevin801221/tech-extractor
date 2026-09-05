import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArticleInputSection } from './components/ArticleInputSection';
import { SummaryDashboard } from './components/SummaryDashboard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ComparisonModal } from './components/ComparisonModal';
import { 
  SummaryOutput, 
  SummaryPerspective, 
  SummaryLanguage, 
  SavedArticleSummary 
} from './types';
import { SAMPLE_ARTICLES } from './data/sampleArticles';
import { safeFetchJson } from './lib/api';

const STORAGE_KEY = 'TECH_ARTICLE_SUMMARIZER_HISTORY_V1';

export default function App() {
  const [currentSummary, setCurrentSummary] = useState<SummaryOutput | null>(null);
  const [currentRawText, setCurrentRawText] = useState<string>('');
  const [currentPerspective, setCurrentPerspective] = useState<SummaryPerspective>('ARCHITECT');
  const [currentLanguage, setCurrentLanguage] = useState<SummaryLanguage>('zh-TW');
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(undefined);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);

  const [history, setHistory] = useState<SavedArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [historyFilterBookmark, setHistoryFilterBookmark] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistoryToStorage = (updatedHistory: SavedArticleSummary[]) => {
    setHistory(updatedHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to persist history', e);
    }
  };

  // Perform Summarization
  const handleSummarize = async (
    text: string,
    title?: string,
    perspective: SummaryPerspective = 'ARCHITECT',
    language: SummaryLanguage = 'zh-TW',
    url?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const generatedSummary = await safeFetchJson<SummaryOutput>('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          title,
          perspective,
          language,
        }),
      });

      const newId = `summary-${Date.now()}`;

      setCurrentSummary(generatedSummary);
      setCurrentRawText(text);
      setCurrentPerspective(perspective);
      setCurrentLanguage(language);
      setCurrentUrl(url);
      setCurrentArticleId(newId);

      // Save to history
      const newEntry: SavedArticleSummary = {
        id: newId,
        createdAt: new Date().toISOString(),
        title: generatedSummary.title || title || '技術文章摘要',
        url,
        rawText: text,
        perspective,
        language,
        summary: generatedSummary,
        isBookmarked: false,
      };

      const updatedHistory = [newEntry, ...history.filter((h) => h.id !== newId)].slice(0, 50);
      saveHistoryToStorage(updatedHistory);

      // Scroll to top of summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Summarize error:', err);
      setErrorMessage(err.message || '生成摘要時發生錯誤，請稍後重試。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBookmarkCurrent = () => {
    if (!currentArticleId) return;
    const updated = history.map((item) =>
      item.id === currentArticleId ? { ...item, isBookmarked: !item.isBookmarked } : item
    );
    saveHistoryToStorage(updated);
  };

  const handleToggleBookmarkItem = (id: string) => {
    const updated = history.map((item) =>
      item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
    );
    saveHistoryToStorage(updated);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    saveHistoryToStorage(updated);
    if (currentArticleId === id) {
      setCurrentArticleId(null);
    }
  };

  const handleClearAllHistory = () => {
    saveHistoryToStorage([]);
  };

  const handleSelectFromHistory = (item: SavedArticleSummary) => {
    setCurrentSummary(item.summary);
    setCurrentRawText(item.rawText);
    setCurrentPerspective(item.perspective);
    setCurrentLanguage(item.language);
    setCurrentUrl(item.url);
    setCurrentArticleId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewArticle = () => {
    setCurrentSummary(null);
    setCurrentRawText('');
    setCurrentArticleId(null);
    setErrorMessage(null);
  };

  const isCurrentBookmarked = history.find((h) => h.id === currentArticleId)?.isBookmarked ?? false;
  const bookmarkedCount = history.filter((h) => h.isBookmarked).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        historyCount={history.length}
        bookmarkedCount={bookmarkedCount}
        onOpenHistory={() => {
          setHistoryFilterBookmark(false);
          setIsHistoryOpen(true);
        }}
        onOpenBookmarks={() => {
          setHistoryFilterBookmark(true);
          setIsHistoryOpen(true);
        }}
        onNewArticle={handleNewArticle}
        hasActiveSummary={!!currentSummary}
        onOpenComparison={() => setIsComparisonOpen(true)}
        hasOriginalText={!!currentRawText}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMessage && (
          <div className="max-w-5xl mx-auto mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-sm flex items-center justify-between shadow-lg">
            <span>⚠️ {errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white text-xs underline font-semibold ml-4 cursor-pointer"
            >
              關閉
            </button>
          </div>
        )}

        {currentSummary ? (
          <SummaryDashboard
            summary={currentSummary}
            rawText={currentRawText}
            perspective={currentPerspective}
            language={currentLanguage}
            isBookmarked={isCurrentBookmarked}
            onToggleBookmark={handleToggleBookmarkCurrent}
            onChangePerspective={(p) => {
              handleSummarize(currentRawText, currentSummary.title, p, currentLanguage, currentUrl);
            }}
          />
        ) : (
          <ArticleInputSection
            onSummarize={handleSummarize}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>技術文章摘要器 • Powered by Google Gemini 3.7 Flash</span>
          <span>支援 Markdown, URL 擷取, 代碼高亮, 心智導圖, Web Speech 語音朗讀與多維度架構視角</span>
        </div>
      </footer>

      {/* History Slide-over Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectArticle={handleSelectFromHistory}
        onDeleteArticle={handleDeleteHistoryItem}
        onToggleBookmark={handleToggleBookmarkItem}
        onClearAll={handleClearAllHistory}
        initialFilterBookmark={historyFilterBookmark}
      />

      {/* Side-by-side Split View Modal */}
      {currentSummary && (
        <ComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          rawText={currentRawText}
          summary={currentSummary}
        />
      )}
    </div>
  );
}
