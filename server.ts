import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Fetch article text from URL
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '請提供有效的網址 URL' });
    }

    // Auto-prefix protocol if missing
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: '無效的網址格式，請確認是否包含正確的網域名稱（例如：https://example.com/article）' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      console.error('Fetch URL network error:', fetchErr);
      if (fetchErr.name === 'AbortError') {
        return res.status(408).json({ 
          error: '網頁讀取逾時（超過 15 秒）。該網站伺服器無回應或連線過慢，建議您直接將文章內容複製貼上。' 
        });
      }
      const cause = fetchErr.cause ? ` (${fetchErr.cause.message || fetchErr.cause.code || fetchErr.cause})` : '';
      return res.status(502).json({ 
        error: `無法連線至該網址${cause}。可能原因：該網站阻擋自動化爬蟲（如 Medium、Cloudflare 防護）、需要登入權限，或伺服器無法連線。建議直接將文章複製貼上或上傳檔案。` 
      });
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        return res.status(response.status).json({ 
          error: `該網站拒絕存取 (HTTP ${response.status} Forbidden)。網站啟用了反爬蟲或需要會員登入，請直接複製貼上文章內文。` 
        });
      }
      if (response.status === 404) {
        return res.status(404).json({ error: '找不到該網頁文章 (HTTP 404 Not Found)，請檢查網址是否正確。' });
      }
      return res.status(response.status).json({ error: `擷取網頁失敗 (HTTP ${response.status})，建議直接複製文章內容進行摘要。` });
    }

    const html = await response.text();

    // Basic HTML extraction: Extract title and readable body content
    let extractedTitle = '';
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].trim();
    }

    // Remove script, style, svg, header/footer/nav tags
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
      .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (m, code) => `\n\`\`\`\n${code}\n\`\`\`\n`)
      .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (m, lvl, txt) => `\n\n${'#'.repeat(Number(lvl))} ${txt.replace(/<[^>]+>/g, '').trim()}\n\n`)
      .replace(/<p[^>]*>(.*?)<\/p>/gi, (m, txt) => `\n${txt.replace(/<[^>]+>/g, '').trim()}\n`)
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (m, txt) => `\n* ${txt.replace(/<[^>]+>/g, '').trim()}`)
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // If cleanText is still too short or full of garbage, provide a fallback
    if (cleanText.length < 50) {
      cleanText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000);
    } else if (cleanText.length > 30000) {
      cleanText = cleanText.slice(0, 30000);
    }

    res.json({
      title: extractedTitle || '線上技術文章',
      url: parsedUrl.toString(),
      text: cleanText,
    });
  } catch (error: any) {
    console.error('Error fetching URL:', error);
    res.status(500).json({ error: error.message || '擷取文章內容時發生錯誤' });
  }
});

// Summarize technical article
app.post('/api/summarize', async (req, res) => {
  try {
    const { text, title, perspective = 'ARCHITECT', language = 'zh-TW' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: '請提供欲摘要的技術文章內容' });
    }

    const ai = getGeminiClient();

    const perspectiveInstructions: Record<string, string> = {
      ARCHITECT: '重點聚焦於：系統設計架構、高可用性/可擴展性考量、技術選型優劣勢、權衡與妥協 (Trade-offs)、遷移風險與系統演進。',
      DEVELOPER: '重點聚焦於：核心程式碼實作關鍵、底層原理、API 設計與用法、常見陷阱 (Gotchas & Pitfalls)、效能調校與最佳實踐。',
      TLDR: '重點聚焦於：極度精簡高效，3 分鐘內可吸收的最核心結論、3 大精華重點、適用與不適用場景。',
      BEGINNER: '重點聚焦於：通俗白話解釋、新手友善的名詞解釋、核心觀念圖解拆解、從零理解該技術在解決什麼問題。',
      PERF_SECURITY: '重點聚焦於：運算效能 (CPU/Memory/I/O)、網路延遲、安全漏洞防範、高併發瓶頸與資源消耗評估。'
    };

    const languageNames: Record<string, string> = {
      'zh-TW': '繁體中文 (Traditional Chinese, 台灣術語慣例，如「伺服器」、「併發」、「快取」)',
      'zh-CN': '简体中文 (Simplified Chinese)',
      'en': 'English',
      'ja': '日本語 (Japanese)'
    };

    const currentPerspective = perspectiveInstructions[perspective] || perspectiveInstructions['ARCHITECT'];
    const targetLang = languageNames[language] || languageNames['zh-TW'];

    const systemInstruction = `你是一位世界頂級的資深軟體架構師兼技術作家，精通全端開發、雲原生、分散式系統、演算法與軟體架構。
你的任務是將使用者提供的技術文章進行深度解析與結構化摘要。

【分析視角設定】：
${currentPerspective}

【語言要求】：
請使用 ${targetLang} 輸出所有摘要內容與文字說明（程式碼與標準術語英文名可保留）。

【摘要嚴格規範】：
1. 確保提煉的內容精準、客觀、具備高度實務參考價值。
2. 避免無意義的空泛廢話，直接切入核心痛點與架構本質。
3. 如果文章包含關鍵程式碼或演算法，請提煉最具代表性的核心片段並附上解說。
4. 產生清晰的階層化心智圖大綱（使用縮排階層文字或 Emoji 清單）。
5. 必須嚴格輸出合法的 JSON 物件格式。`;

    const prompt = `請針對以下技術文章進行深度結構化分析與摘要：

文章標題（若有）：${title || '未命名技術文章'}

文章原文內容：
---
${text.slice(0, 35000)}
---`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: '文章精準技術標題',
            },
            originalEstimatedReadTimeMinutes: {
              type: Type.INTEGER,
              description: '原文預估完整閱讀所需分鐘數',
            },
            summaryReadTimeMinutes: {
              type: Type.INTEGER,
              description: '本摘要速讀所需分鐘數（例如 2 或 3）',
            },
            difficultyLevel: {
              type: Type.STRING,
              enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
              description: '技術難易度評級',
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '技術領域與關鍵標籤（例如 ["React", "SSR", "Web Performance"]）',
            },
            oneSentencePitch: {
              type: Type.STRING,
              description: '一句話精華總結（直擊文章的核心價值與結論）',
            },
            executiveSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3~5 點最重要的核心技術結論與摘要',
            },
            coreConcepts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING, description: '技術專有名詞或概念' },
                  definition: { type: Type.STRING, description: '白話且精準的定義與作用' },
                  importance: { type: Type.STRING, enum: ['critical', 'high', 'medium'], description: '重要性' },
                  category: { type: Type.STRING, description: '所屬分類（如 架構、演算法、工具、通訊協定）' },
                },
                required: ['term', 'definition', 'importance', 'category'],
              },
              description: '文章中提及的核心技術名詞與概念拆解',
            },
            architectureInsights: {
              type: Type.OBJECT,
              properties: {
                overview: { type: Type.STRING, description: '系統架構與設計核心理念分析' },
                dataFlowOrWorkflow: { type: Type.STRING, description: '資料流向、執行週期或運作步驟說明' },
                keyDecisions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '關鍵設計決策與架構原則',
                },
                tradeoffs: {
                  type: Type.OBJECT,
                  properties: {
                    pros: { type: Type.ARRAY, items: { type: Type.STRING }, description: '核心優勢與好處' },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING }, description: '潛在缺點與代價' },
                    whenToUse: { type: Type.STRING, description: '最適合採用的時機與場景' },
                    whenToAvoid: { type: Type.STRING, description: '應避免使用或過度設計的時機' },
                  },
                  required: ['pros', 'cons', 'whenToUse', 'whenToAvoid'],
                },
              },
              required: ['overview', 'keyDecisions', 'tradeoffs'],
            },
            codeAndImplementation: {
              type: Type.OBJECT,
              properties: {
                hasCode: { type: Type.BOOLEAN, description: '文章是否涉及程式碼或實作邏輯' },
                primaryLanguage: { type: Type.STRING, description: '主要程式語言（如 TypeScript, Go, Rust, Python 等）' },
                coreSnippet: { type: Type.STRING, description: '最核心的示範程式碼片段（含註解）' },
                explanation: { type: Type.STRING, description: '該程式碼片段的關鍵邏輯拆解' },
                bestPractices: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '實務開發最佳實踐建議',
                },
                gotchasAndPitfalls: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '常見踩坑點、地雷與注意事項',
                },
              },
              required: ['hasCode', 'bestPractices', 'gotchasAndPitfalls'],
            },
            mindmapOutline: {
              type: Type.STRING,
              description: '結構化文字心智圖大綱（使用清晰的層級與縮排結構，適合快速理解全局骨架）',
            },
            recommendedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '工程師延伸探索、閱讀或實作推薦下一步',
            },
          },
          required: [
            'title',
            'originalEstimatedReadTimeMinutes',
            'summaryReadTimeMinutes',
            'difficultyLevel',
            'tags',
            'oneSentencePitch',
            'executiveSummary',
            'coreConcepts',
            'architectureInsights',
            'codeAndImplementation',
            'mindmapOutline',
            'recommendedNextSteps',
          ],
        },
      },
    });

    const responseText = response.text || '';
    if (!responseText) {
      throw new Error('AI 未能產生有效的分析結果，請重試');
    }
    const parsedData = JSON.parse(responseText);

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error generating summary:', error);
    let userMsg = error.message || '生成摘要時發生錯誤，請稍後重試';
    if (userMsg.includes('GEMINI_API_KEY')) {
      userMsg = '尚未設定 GEMINI_API_KEY 環境變數，請於環境設定中配置 Gemini API 金鑰。';
    } else if (userMsg.includes('fetch failed') || userMsg.includes('ENOTFOUND') || userMsg.includes('ECONNREFUSED')) {
      userMsg = '連線至 AI 服務時網路異常 (fetch failed)，請檢查伺服器網路連線或稍後再試。';
    } else if (userMsg.includes('429') || userMsg.includes('quota') || userMsg.includes('RESOURCE_EXHAUSTED')) {
      userMsg = 'API 呼叫頻率已達上限 (429 Rate Limit)，請稍候 30 秒後重試。';
    }
    res.status(500).json({ error: userMsg });
  }
});

// Ask follow-up question regarding the article
app.post('/api/ask-question', async (req, res) => {
  try {
    const { articleText, summary, question, history = [] } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: '請提供您的提問內容' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `你是一位專業的技術顧問與資深工程師。使用者正在研讀一篇技術文章並有進一步的技術疑問。
請根據提供的文章內容與摘要，深入、清晰、具體地回答使用者的問題。
如有需要，提供代碼示例、架構圖解釋或不同技術方案的比較。`;

    const context = `【文章標題】：${summary?.title || '技術文章'}
【一向總結】：${summary?.oneSentencePitch || ''}
【核心要點】：${JSON.stringify(summary?.executiveSummary || [])}

【文章原文節錄】：
${(articleText || '').slice(0, 15000)}

【歷史對話】：
${history.map((h: any) => `${h.role === 'user' ? '使用者' : '專家'}: ${h.content}`).join('\n')}

【使用者的最新提問】：
${question}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: context,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      answer: response.text || '無法生成回答，請嘗試更具體的問題。',
    });
  } catch (error: any) {
    console.error('Error in Q&A:', error);
    let userMsg = error.message || '解答提問時發生錯誤';
    if (userMsg.includes('GEMINI_API_KEY')) {
      userMsg = '尚未設定 GEMINI_API_KEY 環境變數。';
    } else if (userMsg.includes('fetch failed')) {
      userMsg = '連線至 AI 服務失敗 (fetch failed)，請稍候重試。';
    }
    res.status(500).json({ error: userMsg });
  }
});

// 404 handler for API routes to prevent Vite from returning index.html for API calls
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `找不到此 API 端點: ${req.method} ${req.path}` });
});

async function startServer() {
  // Vite dev middleware or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`技術文章摘要器 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error during startServer:', err);
  process.exit(1);
});
