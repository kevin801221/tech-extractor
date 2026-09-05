import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Workflow, 
  Terminal, 
  Library, 
  Network, 
  MessageSquareCode, 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Clock, 
  Timer, 
  ShieldAlert, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles,
  ArrowRight,
  Download,
  FileDown,
  AlertTriangle,
  Flame,
  Zap,
  Boxes,
  FileCode2,
  CheckCheck
} from 'lucide-react';
import { SummaryOutput, SummaryPerspective, SummaryLanguage } from '../types';
import { CodeBlock } from './CodeBlock';
import { VoiceReader } from './VoiceReader';
import { InteractiveQA } from './InteractiveQA';

interface SummaryDashboardProps {
  summary: SummaryOutput;
  rawText: string;
  perspective: SummaryPerspective;
  language: SummaryLanguage;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onChangePerspective: (p: SummaryPerspective) => void;
}

type TabType = 'executive' | 'architecture' | 'code' | 'concepts' | 'mindmap' | 'qa';

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  summary,
  rawText,
  perspective,
  language,
  isBookmarked,
  onToggleBookmark,
  onChangePerspective,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('executive');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Copy full summary to clipboard
  const handleCopyMarkdown = (format: 'markdown' | 'bullets' | 'text') => {
    let textToCopy = '';

    if (format === 'markdown') {
      textToCopy = `# ${summary.title} (技術摘要)
> 一句話總結: ${summary.oneSentencePitch}
難易度: ${summary.difficultyLevel} | 原文約 ${summary.originalEstimatedReadTimeMinutes} 分鐘 ➔ 摘要約 ${summary.summaryReadTimeMinutes} 分鐘
標籤: ${summary.tags.join(', ')}

## 📌 核心重點 (Executive Summary)
${summary.executiveSummary.map((item) => `- ${item}`).join('\n')}

## 🏛️ 架構與設計 (Architecture)
${summary.architectureInsights.overview}

### 核心優勢 (Pros):
${summary.architectureInsights.tradeoffs.pros.map((p) => `+ ${p}`).join('\n')}

### 潛在劣勢 (Cons):
${summary.architectureInsights.tradeoffs.cons.map((c) => `- ${c}`).join('\n')}

### 適用時機: ${summary.architectureInsights.tradeoffs.whenToUse}
### 避免時機: ${summary.architectureInsights.tradeoffs.whenToAvoid}

${
  summary.codeAndImplementation.hasCode && summary.codeAndImplementation.coreSnippet
    ? `## 💻 核心程式碼 (${summary.codeAndImplementation.primaryLanguage || 'Code'})
\`\`\`${summary.codeAndImplementation.primaryLanguage || ''}
${summary.codeAndImplementation.coreSnippet}
\`\`\`
${summary.codeAndImplementation.explanation || ''}
`
    : ''
}

## ⚠️ 踩坑指南與注意事項
${summary.codeAndImplementation.gotchasAndPitfalls.map((g) => `- ⚠️ ${g}`).join('\n')}

## 🗺️ 心智圖綱要
\`\`\`
${summary.mindmapOutline}
\`\`\`
`;
    } else if (format === 'bullets') {
      textToCopy = `📌 ${summary.title} - 核心摘要要點：
1. ${summary.oneSentencePitch}
${summary.executiveSummary.map((item, idx) => `${idx + 2}. ${item}`).join('\n')}
適用場景：${summary.architectureInsights.tradeoffs.whenToUse}`;
    } else {
      textToCopy = `${summary.title}\n\n${summary.oneSentencePitch}\n\n${summary.executiveSummary.join('\n')}`;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback(format);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  // Export summary as .md file
  const handleDownloadMarkdown = () => {
    const markdownContent = `# ${summary.title}\n\n> ${summary.oneSentencePitch}\n\n## 核心結論\n${summary.executiveSummary.map((e) => `- ${e}`).join('\n')}\n\n## 架構設計\n${summary.architectureInsights.overview}\n\n## 心智圖大綱\n\`\`\`\n${summary.mindmapOutline}\n\`\`\``;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${summary.title.replace(/[/\\?%*:|"<>]/g, '_')}_summary.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Category filter for concepts
  const categories = ['ALL', ...Array.from(new Set(summary.coreConcepts.map((c) => c.category)))];
  const filteredConcepts = selectedCategory === 'ALL'
    ? summary.coreConcepts
    : summary.coreConcepts.filter((c) => c.category === selectedCategory);

  // Time saved percentage
  const timeSavedPercent = Math.max(
    50,
    Math.round(
      ((summary.originalEstimatedReadTimeMinutes - summary.summaryReadTimeMinutes) /
        Math.max(1, summary.originalEstimatedReadTimeMinutes)) *
        100
    )
  );

  const difficultyColor = {
    Beginner: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    Intermediate: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    Advanced: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    Expert: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  }[summary.difficultyLevel] || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';

  const perspectiveNames: Record<SummaryPerspective, string> = {
    ARCHITECT: '系統架構師視角',
    DEVELOPER: '資深工程師視角',
    TLDR: '3分鐘極簡速讀',
    BEGINNER: '新手白話拆解',
    PERF_SECURITY: '效能與資安視角',
  };

  // Full text string for speech synthesis
  const speechText = `${summary.title}。一句話總結：${summary.oneSentencePitch}。核心重點：${summary.executiveSummary.join('。')}`;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Top Meta & Title Card */}
      <div className="bg-slate-850/90 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl backdrop-blur-sm space-y-4">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${difficultyColor}`}>
              難度: {summary.difficultyLevel}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {perspectiveNames[perspective]}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400" />
              原文 ~{summary.originalEstimatedReadTimeMinutes} 分鐘 ➔ 速讀 {summary.summaryReadTimeMinutes} 分鐘 (節省 {timeSavedPercent}%)
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Voice Reader */}
            <VoiceReader textToRead={speechText} />

            {/* Bookmark button */}
            <button
              onClick={onToggleBookmark}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400'
              }`}
              title={isBookmarked ? '取消收藏' : '收藏此摘要'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            {/* Copy dropdown / buttons */}
            <div className="relative flex items-center gap-1">
              <button
                onClick={() => handleCopyMarkdown('markdown')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
                title="複製 Markdown 格式摘要"
              >
                {copyFeedback === 'markdown' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">已複製 MD</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>複製 Markdown</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="下載 .md 檔案"
              >
                <FileDown className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {summary.title}
        </h2>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {summary.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/60"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar gap-1 p-1 bg-slate-900/60 rounded-xl">
        <button
          onClick={() => setActiveTab('executive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'executive'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>核心速覽 TL;DR</span>
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'architecture'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>架構與權衡 (Trade-offs)</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'code'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>核心代碼與踩坑</span>
        </button>

        <button
          onClick={() => setActiveTab('concepts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'concepts'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>技術名詞庫 ({summary.coreConcepts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mindmap')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'mindmap'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>心智導圖</span>
        </button>

        <button
          onClick={() => setActiveTab('qa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'qa'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          <span>深度問答 Q&A</span>
        </button>
      </div>

      {/* TAB 1: EXECUTIVE SUMMARY */}
      {activeTab === 'executive' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* One-Sentence Pitch Card */}
          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  一向精華 (Executive One-Liner)
                </span>
                <p className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
                  "{summary.oneSentencePitch}"
                </p>
              </div>
            </div>
          </div>

          {/* Key Takeaways Card */}
          <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>關鍵結論與核心要點 (Key Takeaways)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {summary.executiveSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-200 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Next Steps */}
          {summary.recommendedNextSteps && summary.recommendedNextSteps.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-emerald-400" />
                <span>工程師推薦延伸步驟 (Actionable Next Steps)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {summary.recommendedNextSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 text-xs sm:text-sm flex items-start gap-2.5"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ARCHITECTURE & TRADEOFFS */}
      {activeTab === 'architecture' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Architecture Overview */}
          <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-400" />
              <span>系統設計與架構核心理念 (Architecture Design)</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {summary.architectureInsights.overview}
            </p>
          </div>

          {/* Data Flow or Workflow if present */}
          {summary.architectureInsights.dataFlowOrWorkflow && (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <span>資料流向與生命週期 (Data Flow / Execution Lifecycle)</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm font-mono text-cyan-300 leading-relaxed whitespace-pre-line">
                {summary.architectureInsights.dataFlowOrWorkflow}
              </div>
            </div>
          )}

          {/* Key Decisions */}
          {summary.architectureInsights.keyDecisions && summary.architectureInsights.keyDecisions.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span>關鍵架構決策 (Key Architectural Decisions)</span>
              </h3>
              <ul className="space-y-2">
                {summary.architectureInsights.keyDecisions.map((dec, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-2" />
                    <span>{dec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pros & Cons Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pros */}
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" />
                <span>核心優勢與效益 (Pros)</span>
              </h4>
              <ul className="space-y-2">
                {summary.architectureInsights.tradeoffs.pros.map((pro, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-emerald-200">
                    <span className="text-emerald-400 font-bold mt-0.5">+</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                <ThumbsDown className="w-4 h-4" />
                <span>潛在挑戰與代價 (Cons & Trade-offs)</span>
              </h4>
              <ul className="space-y-2">
                {summary.architectureInsights.tradeoffs.cons.map((con, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-rose-200">
                    <span className="text-rose-400 font-bold mt-0.5">-</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* When to Use vs When to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>何時適合採用 (When to Use)</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {summary.architectureInsights.tradeoffs.whenToUse}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>何時應避免 / 過度設計 (When to Avoid)</span>
              </span>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {summary.architectureInsights.tradeoffs.whenToAvoid}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CODE & GOTCHAS */}
      {activeTab === 'code' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {summary.codeAndImplementation.hasCode && summary.codeAndImplementation.coreSnippet ? (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-400" />
                  <span>核心實作範例 (Core Implementation Snippet)</span>
                </h3>
              </div>

              <CodeBlock
                code={summary.codeAndImplementation.coreSnippet}
                language={summary.codeAndImplementation.primaryLanguage || 'typescript'}
              />

              {summary.codeAndImplementation.explanation && (
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-indigo-300">邏輯深入解析：</span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {summary.codeAndImplementation.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 text-center py-10">
              <Terminal className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">此技術文章以概念與架構討論為主，未包含特定代碼區塊。</p>
            </div>
          )}

          {/* Best Practices */}
          {summary.codeAndImplementation.bestPractices && summary.codeAndImplementation.bestPractices.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>工程實務最佳實踐 (Best Practices)</span>
              </h3>
              <div className="space-y-2">
                {summary.codeAndImplementation.bestPractices.map((bp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/10 border border-emerald-500/20 text-xs sm:text-sm text-slate-200"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                    <span>{bp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gotchas & Pitfalls */}
          {summary.codeAndImplementation.gotchasAndPitfalls && summary.codeAndImplementation.gotchasAndPitfalls.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>常見踩坑地雷與注意事項 (Gotchas & Pitfalls)</span>
              </h3>
              <div className="space-y-2.5">
                {summary.codeAndImplementation.gotchasAndPitfalls.map((pitfall, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs sm:text-sm leading-relaxed"
                  >
                    <span className="p-1 rounded bg-rose-500/20 text-rose-400 shrink-0 mt-0.5 flex items-center justify-center">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    </span>
                    <span>{pitfall}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TECH GLOSSARY & CONCEPTS */}
      {activeTab === 'concepts' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 mr-1">領域分類:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat === 'ALL' ? '全部名詞' : cat}
              </button>
            ))}
          </div>

          {/* Concepts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredConcepts.map((c, idx) => {
              const badgeColors = {
                critical: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
                high: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                medium: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
              }[c.importance] || 'bg-slate-800 text-slate-300 border-slate-700';

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-850/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-indigo-300 border border-slate-700">
                        {c.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeColors}`}>
                        {c.importance}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white tracking-tight">{c.term}</h4>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                      {c.definition}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: MINDMAP OUTLINE */}
      {activeTab === 'mindmap' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="p-6 rounded-2xl bg-slate-850/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-indigo-400" />
                <span>結構化心智導圖 (Visual Mindmap Outline)</span>
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summary.mindmapOutline);
                  setCopyFeedback('mindmap');
                  setTimeout(() => setCopyFeedback(null), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all cursor-pointer"
              >
                {copyFeedback === 'mindmap' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已複製導圖</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-indigo-400" />
                    <span>複製大綱</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-indigo-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {summary.mindmapOutline}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INTERACTIVE QA */}
      {activeTab === 'qa' && (
        <div className="animate-in fade-in duration-200">
          <InteractiveQA articleText={rawText} summary={summary} />
        </div>
      )}
    </div>
  );
};
