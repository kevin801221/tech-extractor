export type SummaryPerspective = 
  | 'ARCHITECT'      // 系統架構與選型權衡
  | 'DEVELOPER'      // 核心實作與踩坑指南
  | 'TLDR'           // 3 分鐘速讀精華
  | 'BEGINNER'       // 白話觀念與名詞拆解
  | 'PERF_SECURITY'; // 效能優化與資安評估

export type SummaryLanguage = 'zh-TW' | 'zh-CN' | 'en' | 'ja';

export interface ConceptItem {
  term: string;
  definition: string;
  importance: 'critical' | 'high' | 'medium';
  category: string;
}

export interface Tradeoffs {
  pros: string[];
  cons: string[];
  whenToUse: string;
  whenToAvoid: string;
}

export interface ArchitectureInsights {
  overview: string;
  keyDecisions: string[];
  tradeoffs: Tradeoffs;
  dataFlowOrWorkflow?: string;
}

export interface CodeAndImplementation {
  hasCode: boolean;
  primaryLanguage?: string;
  coreSnippet?: string;
  explanation?: string;
  bestPractices: string[];
  gotchasAndPitfalls: string[];
}

export interface SummaryOutput {
  title: string;
  originalEstimatedReadTimeMinutes: number;
  summaryReadTimeMinutes: number;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  tags: string[];
  oneSentencePitch: string;
  executiveSummary: string[];
  coreConcepts: ConceptItem[];
  architectureInsights: ArchitectureInsights;
  codeAndImplementation: CodeAndImplementation;
  mindmapOutline: string;
  recommendedNextSteps: string[];
}

export interface SavedArticleSummary {
  id: string;
  createdAt: string;
  title: string;
  url?: string;
  rawText: string;
  perspective: SummaryPerspective;
  language: SummaryLanguage;
  summary: SummaryOutput;
  isBookmarked: boolean;
}

export interface QAMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface SampleArticle {
  id: string;
  title: string;
  category: string;
  source: string;
  readTime: string;
  text: string;
}
