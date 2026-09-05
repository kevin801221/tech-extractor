import React, { useState, useRef } from 'react';
import { 
  FileEdit, 
  Globe2, 
  FolderUp, 
  Wand2, 
  Workflow, 
  Terminal, 
  Timer, 
  Compass, 
  ShieldAlert, 
  Globe, 
  ArrowRight,
  Eraser,
  Loader2,
  Library,
  CheckCircle2,
  FileCode2,
  Boxes,
  Database,
  Blocks,
  Link2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import { SummaryPerspective, SummaryLanguage, SampleArticle } from '../types';
import { SAMPLE_ARTICLES } from '../data/sampleArticles';
import { safeFetchJson } from '../lib/api';

interface ArticleInputSectionProps {
  onSummarize: (text: string, title?: string, perspective?: SummaryPerspective, language?: SummaryLanguage, url?: string) => Promise<void>;
  isLoading: boolean;
}

export const ArticleInputSection: React.FC<ArticleInputSectionProps> = ({
  onSummarize,
  isLoading,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'url' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [perspective, setPerspective] = useState<SummaryPerspective>('ARCHITECT');
  const [language, setLanguage] = useState<SummaryLanguage>('zh-TW');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTextareaCollapsed, setIsTextareaCollapsed] = useState(false);
  const [textareaRows, setTextareaRows] = useState(8);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Perspectives metadata
  const perspectives: Array<{
    id: SummaryPerspective;
    name: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      id: 'ARCHITECT',
      name: '系統架構師',
      description: '系統設計、高可用性、選型權衡 (Trade-offs) 與遷移風險',
      icon: Workflow,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'DEVELOPER',
      name: '資深工程師',
      description: '核心程式碼範例、實作細節、API 設計與踩坑指南 (Gotchas)',
      icon: Terminal,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'TLDR',
      name: '3分鐘極簡速讀',
      description: '3 點核心結論、關鍵一句話總結與適用情境',
      icon: Timer,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'BEGINNER',
      name: '新手白話拆解',
      description: '通俗白話解釋、關鍵術語百科與核心觀念圖解',
      icon: Compass,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 'PERF_SECURITY',
      name: '效能與資安',
      description: '高併發吞吐、記憶體與 I/O 消耗、安全性風險評估',
      icon: ShieldAlert,
      color: 'from-rose-500 to-red-600',
    },
  ];

  // Helper to get specific icon for sample articles
  const getSampleIcon = (id: string) => {
    switch (id) {
      case 'sample-rsc':
        return Boxes;
      case 'sample-cache-raft':
        return Database;
      case 'sample-modular-monolith':
        return Blocks;
      default:
        return FileCode2;
    }
  };

  // Estimated stats
  const charCount = rawText.trim().length;
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadMins = Math.max(1, Math.ceil(charCount > 0 ? charCount / 500 : wordCount / 200));

  const handleFetchUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMessage('請輸入有效的文章網址');
      return;
    }
    setErrorMessage(null);
    setIsFetchingUrl(true);
    try {
      const data = await safeFetchJson<{ text: string; title?: string; url: string }>('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });

      setRawText(data.text);
      if (data.title && !articleTitle) {
        setArticleTitle(data.title);
      }
      setInputMode('text');
    } catch (err: any) {
      setErrorMessage(err.message || '擷取網址失敗，請手動複製貼上文章內文');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawText(content);
        if (!articleTitle) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setArticleTitle(cleanName);
        }
        setInputMode('text');
      }
    };
    reader.onerror = () => {
      setErrorMessage('讀取檔案失敗');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = (sample: SampleArticle) => {
    setArticleTitle(sample.title);
    setRawText(sample.text);
    setInputMode('text');
    setErrorMessage(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!rawText.trim()) {
      setErrorMessage('請先輸入或載入技術文章內文');
      return;
    }
    setErrorMessage(null);
    await onSummarize(rawText, articleTitle, perspective, language, urlInput);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Hero Welcome banner */}
      <div className="text-center space-y-2 py-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
          技術文章 <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">AI 深度摘要器</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          貼上技術部落格、RFC 規格書、架構文檔或 GitHub README，瞬間提煉精準架構視角、關鍵程式碼與踩坑防護。
        </p>
      </div>

      {/* Preset Quick Picks */}
      <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Library className="w-4 h-4 text-indigo-400" />
          <span>範例技術文章（點擊即可立即載入測試）</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAMPLE_ARTICLES.map((sample) => {
            const SampleIcon = getSampleIcon(sample.id);
            return (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                className="group text-left p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer shadow-sm hover:shadow-indigo-500/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium flex items-center gap-1.5">
                      <SampleIcon className="w-3 h-3 text-indigo-400" />
                      <span>{sample.category}</span>
                    </span>
                    <span>約 {sample.readTime}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-indigo-300 line-clamp-2 transition-colors">
                    {sample.title}
                  </h4>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-indigo-400 font-medium opacity-80 group-hover:opacity-100">
                  <span>載入並檢視</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Input Card */}
      <div className="bg-slate-850/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Input Mode Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setInputMode('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              inputMode === 'text'
                ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/40 border border-pink-400/50'
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-950/30 border border-transparent'
            }`}
          >
            <FileEdit className={`w-4 h-4 ${inputMode === 'text' ? 'text-white' : 'text-pink-400'}`} />
            <span>貼上文章 / Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              inputMode === 'url'
                ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/40 border border-pink-400/50'
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-950/30 border border-transparent'
            }`}
          >
            <Globe2 className={`w-4 h-4 ${inputMode === 'url' ? 'text-white' : 'text-pink-400'}`} />
            <span>網址匯入 URL</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              inputMode === 'file'
                ? 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-600/40 border border-pink-400/50'
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-950/30 border border-transparent'
            }`}
          >
            <FolderUp className={`w-4 h-4 ${inputMode === 'file' ? 'text-white' : 'text-pink-400'}`} />
            <span>上傳檔案 (.md/.txt/.ts)</span>
          </button>
        </div>

        {/* Input Bodies */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Optional Title Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              文章標題 (選填，留空將由 AI 自動推斷)
            </label>
            <input
              type="text"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              placeholder="例如：深入解析 React Server Components 架構演進"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                輸入技術文章或部落格網址 (支援 Medium, Dev.to, 官方文件, GitHub 等)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/blog/microservices-vs-monolith"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleFetchUrl}
                  disabled={isFetchingUrl || !urlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>擷取中...</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>擷取內文</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* File Upload Mode */}
          {inputMode === 'file' && (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.json,.html,.ts,.tsx,.js,.py,.go"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
                  <FileCode2 className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  點擊上傳或拖曳檔案至此處
                </p>
                <p className="text-xs text-slate-400">
                  支援 Markdown (.md)、純文字 (.txt)、程式代碼檔 (.ts, .js, .py, .go, .json)
                </p>
              </div>
            </div>
          )}

          {/* Text Area (always active or previewed) */}
          <div className="space-y-2 border border-orange-500/30 bg-orange-950/5 rounded-2xl p-4 sm:p-5 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-500/20 pb-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <label className="text-xs sm:text-sm font-bold text-orange-400 tracking-wide">
                  文章內文編輯區 (Orange Workspace)
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/30 text-orange-300">
                  可摺疊 & 自訂大小
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                {rawText && (
                  <>
                    <span>字數: <strong className="text-orange-400 font-mono">{charCount}</strong> 字</span>
                    <span className="hidden sm:inline">•</span>
                    <span>預估讀時: <strong className="text-orange-300 font-mono">{estimatedReadMins}</strong> 分鐘</span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                
                {/* Size controls - visible only if not collapsed */}
                {!isTextareaCollapsed && (
                  <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTextareaRows(6)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        textareaRows === 6 ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      小
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextareaRows(12)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        textareaRows === 12 ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      中
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextareaRows(20)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        textareaRows === 20 ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      大
                    </button>
                  </div>
                )}

                {rawText && !isTextareaCollapsed && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawText('');
                      setArticleTitle('');
                    }}
                    className="text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer ml-1"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>清空</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsTextareaCollapsed(!isTextareaCollapsed)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 font-semibold transition-all border border-orange-500/20 cursor-pointer ml-1"
                >
                  {isTextareaCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>展開</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>摺疊</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isTextareaCollapsed ? (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="在此貼上您欲分析的技術文章、系統設計文件、RFC 草案或工程文章內文..."
                rows={textareaRows}
                className="w-full p-4 rounded-xl bg-slate-950/95 border border-orange-500/40 text-slate-100 placeholder-slate-600 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-y"
              />
            ) : (
              <div 
                onClick={() => setIsTextareaCollapsed(false)}
                className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-orange-500/30 text-center text-slate-400 hover:text-orange-300 hover:border-orange-500/50 transition-all cursor-pointer select-none"
              >
                <p className="text-xs sm:text-sm font-medium">
                  {rawText ? `文章內文已摺疊 (${charCount} 字) - 點擊此處快速展開` : '點擊展開並貼上文章內文'}
                </p>
              </div>
            )}
          </div>

          {/* Perspective Customizer */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-indigo-400" />
                <span>選擇摘要視角與分析深度</span>
              </label>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>輸出語言:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SummaryLanguage)}
                  className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="zh-TW">繁體中文 (台灣)</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {perspectives.map((p) => {
                const Icon = p.icon;
                const isSelected = perspective === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPerspective(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/40 shadow-md shadow-indigo-500/10'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-tr ${p.color} text-white shadow-sm`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-100">{p.name}</span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Submit Action CTA */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isLoading || !rawText.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.99] cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Gemini 3.7 Flash 正在進行深度架構分析與摘要中...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>開始智慧摘要分析 (Generate Technical Summary)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
