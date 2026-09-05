import React, { useState, useRef, useEffect } from 'react';
import { MessageSquareCode, SendHorizontal, Bot, User, Sparkles, Loader2, Copy, Check, HelpCircle } from 'lucide-react';
import { SummaryOutput, QAMessage } from '../types';
import { CodeBlock } from './CodeBlock';
import { safeFetchJson } from '../lib/api';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface InteractiveQAProps {
  articleText: string;
  summary: SummaryOutput;
}

export const InteractiveQA: React.FC<InteractiveQAProps> = ({ articleText, summary }) => {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    '與目前主流替代方案相比，核心權衡與遷移成本如何？',
    '在百萬高併發或生產環境落地時，最大的潛在瓶頸是什麼？',
    '能否提供一個更簡潔但涵蓋錯誤處理的實作範例？',
    '對於初學團隊而言，學習曲線與心智模型最大的轉換難點在哪？',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || isLoading) return;

    const userMsg: QAMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: textToAsk.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setIsLoading(true);

    try {
      const data = await safeFetchJson<{ answer: string }>('/api/ask-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText,
          summary,
          question: userMsg.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const botMsg: QAMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: QAMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ 解答時發生錯誤: ${err.message || '請稍後重試'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <MessageSquareCode className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <span>針對文章深度技術提問 (Interactive AI Q&A)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-normal">
              Gemini Context Aware
            </span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            AI 已吸收本文所有架構與代碼細節，您可以隨時追問實務踩坑、替代方案比較、底層細節或實作範例。
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>推薦提問方向：</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                className="text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-850 hover:border-indigo-500/40 text-xs text-slate-300 hover:text-indigo-300 transition-all cursor-pointer flex items-start gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message List */}
      {messages.length > 0 && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 rounded-xl bg-slate-950/80 border border-slate-850">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 text-[11px] opacity-75">
                    <span className="font-semibold">{isUser ? '您' : 'AI 技術專家'}</span>
                    <div className="flex items-center gap-2">
                      <span>{m.timestamp}</span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(m.content, idx)}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="複製回答"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="markdown-body prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-pre:my-2 prose-ul:my-1.5">
                      <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 p-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>AI 正在深入分析文章細節並撰寫解答...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="輸入關於此技術文章的追問（例如：如何避免快取擊穿？代碼中的鎖如何優化？...）"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <SendHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">發送提問</span>
        </button>
      </form>
    </div>
  );
};
