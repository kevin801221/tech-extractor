import { SampleArticle } from '../types';

export const SAMPLE_ARTICLES: SampleArticle[] = [
  {
    id: 'rsc-architecture',
    title: '深入解析 React Server Components (RSC) 底層架構與邊緣渲染演進',
    category: '前端與全端架構',
    source: 'Tech Engineering Blog',
    readTime: '12 min',
    text: `# 深入解析 React Server Components (RSC) 底層架構與邊緣渲染演進

## 1. 背景與傳統 SSR 的瓶頸

在傳統的 React SSR（伺服器端渲染）架構中，雖然 HTML 在伺服器上快速產出並傳送至客戶端，但瀏覽器仍必須下載整個頁面所需的 JavaScript Bundle，並經歷完整的 **Hydration（注水/水合）** 過程。這導致了兩大主要問題：

1. **Bundle 體積膨脹**：即使某些組件（如複雜的 Markdown 解析器或資料格式化套件）只在伺服器端運算一次，其相依代碼依然會被打包進客戶端 Bundle。
2. **Hydration Waterfall 瀑布流**：在 Hydration 完成之前，頁面無法響應使用者事件，且深層嵌套組件的資料請求可能造成連續等待。

\`\`\`tsx
// 傳統 SSR 中，即便只需在後端渲染，依賴套件仍會打包進 Client Bundle
import { marked } from 'marked'; // 150KB bundle
export default function BlogPost({ content }: { content: string }) {
  const html = marked.parse(content);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
\`\`\`

## 2. React Server Components 的架構本質

React Server Components (RSC) 引入了一種全新的執行環境邊界：**組件在伺服器端執行且「永遠不傳送其 JavaScript 代碼到客戶端」**。

### 核心運作機制：
- **RSC Payload (Flight Wire Protocol)**: 伺服器端將 Server Component 渲染為特殊的 JSON-like 串流格式（React Flight 協議），其中包含 HTML 虛擬節點描述以及 Client Component 的引用指針（Placeholders），而非傳統靜態 HTML 或原始 JS 檔案。
- **零客戶端 Bundle 成本**: 在 Server Component 中引入的套件（如 \`fs\`, \`db client\`, \`heavy-math-library\`）完全留在伺服器端。
- **無縫邊界混合**: Server Component 可以包裹 Client Component，Client Component 亦可透過 \`children\` 或 Slot 接收已在伺服器渲染完成的 Server Component。

\`\`\`tsx
// app/posts/[id]/page.tsx (Server Component)
import { db } from '@/lib/db';
import { PostViewer } from '@/components/PostViewer'; // Client Component with 'use client'
import { marked } from 'marked'; // 留在後端，0KB Client Bundle!

export default async function PostPage({ params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: params.id } });
  const renderedContent = marked.parse(post.content);

  return (
    <article className="prose">
      <h1>{post.title}</h1>
      <PostViewer html={renderedContent}>
        {/* 可以傳遞互動式子組件 */}
      </PostViewer>
    </article>
  );
}
\`\`\`

## 3. 架構權衡與選型考量 (Trade-offs)

### 優點：
- **大幅縮小 JavaScript 體積**：核心資料處理與靜態視圖均無客戶端 runtime 負擔。
- **直接存取後端資源**：直接在組件內 query Database、存取檔案系統或安全讀取內部 microservice token，無需額外建立多層 REST API。
- **自動 Streaming SSR**：配合 React Suspense，各區塊能以 chunk 形式逐步流式推送到瀏覽器。

### 挑戰與陷阱：
- **心智模型轉換成本高**：需要嚴格區分 Server Component 與 Client Component，無法在 Server Component 中使用 \`useState\`, \`useEffect\` 或瀏覽器 API。
- **Context API 限制**：React Context 無法跨越 Server-to-Client 邊界直接共享 mutable 狀態。
- **伺服器運算負載 (Server Compute Cost)**：在高併發情境下，若未搭配適當的 Caching 策略（如 ISR / Tag-based revalidation），伺服器 CPU 消耗將顯著上升。

## 4. 實務最佳實踐建議
1. **儘可能將組件保持為 Server Component**，僅在需要 DOM 事件監聽、狀態機或瀏覽器專屬 API 時才標記 \`'use client'\`。
2. **葉節點下沉策略 (Push Client Components to Leaves)**：將互動邏輯封裝在小型葉子組件中，避免將大範圍頂層組件標記為 client component。
3. **搭配精細的 Suspense 邊界**，優先顯示外框骨架屏（Skeleton），避免單一慢速 DB 查詢卡死整個頁面渲染。`
  },
  {
    id: 'distributed-cache-raft',
    title: '高併發分散式快取設計：從一致性雜湊、快取雪崩到 Raft 共識複製',
    category: '後端與分散式系統',
    source: 'Distributed Systems Journal',
    readTime: '15 min',
    text: `# 高併發分散式快取設計：從一致性雜湊、快取雪崩到 Raft 共識複製

## 1. 分散式快取核心挑戰

在百萬 QPS 的微服務架構中，快取層是保護底層關聯式資料庫（如 PostgreSQL / MySQL）免於崩潰的最後一道防線。然而，構建高可用分散式快取面臨三大致命瓶頸：

1. **快取穿透 (Cache Penetration)**：大量查詢不存在的 Key，導致請求直穿 DB。
2. **快取擊穿 (Cache Stampede / Hotspot Invalid)**：超高流量的熱點 Key 在過期瞬間，數萬請求同時湧入 DB 重建快取。
3. **快取雪崩 (Cache Avalanche)**：大量 Key 在同一時間過期，或快取節點集體宕機。

## 2. 節點分片演進：一致性雜湊 (Consistent Hashing)

傳統的 \`hash(key) % N\` 在節點動態增減時會導致高達 \`N / (N+1)\` 的快取資料全面失效。

### 虛擬節點 (Virtual Nodes) 環形架構：
- 將雜湊空間映射至 $0 \\sim 2^{32}-1$ 的虛擬環。
- 每個物理節點配置 100~200 個虛擬節點均勻散佈於環上。
- 資料 Key 透過雜湊值順時鐘尋找最近的虛擬節點。
- 節點異動時，僅有相鄰節點的局部資料需要重新遷移，將震盪影響最小化。

\`\`\`go
// 一致性雜湊環核心實作 (Go 範例)
type ConsistentHashRing struct {
    hashFunc HashFunc
    replicas int               // 虛擬節點倍數
    ring     []uint32          // 排序後的虛擬節點 hash 清單
    nodes    map[uint32]string // hash -> 物理節點位址
    mu       sync.RWMutex
}

func (c *ConsistentHashRing) Get(key string) string {
    c.mu.RLock()
    defer c.mu.RUnlock()
    if len(c.ring) == 0 {
        return ""
    }
    hash := c.hashFunc([]byte(key))
    // 二分搜尋法找到第一個 >= hash 的虛擬節點
    idx := sort.Search(len(c.ring), func(i int) bool {
        return c.ring[i] >= hash
    })
    if idx == len(c.ring) {
        idx = 0 // 環狀繞回
    }
    return c.nodes[c.ring[idx]]
}
\`\`\`

## 3. 防禦架構：互斥鎖與 Singleflight 機制

針對熱點 Key 擊穿問題，採用 **Singleflight** (請求合併) 模式：保證同一個 Key 同一時刻只有一個 Goroutine / 執行緒去 DB 載入資料，其餘請求阻塞等待其廣播通知。

\`\`\`go
// Singleflight 防止快取擊穿
type Group struct {
    mu sync.Mutex
    m  map[string]*call
}

func (g *Group) Do(key string, fn func() (interface{}, error)) (interface{}, error) {
    g.mu.Lock()
    if c, ok := g.m[key]; ok {
        g.mu.Unlock()
        c.wg.Wait()
        return c.val, c.err
    }
    c := new(call)
    c.wg.Add(1)
    g.m[key] = c
    g.mu.Unlock()

    c.val, c.err = fn()
    c.wg.Done()

    g.mu.Lock()
    delete(g.m, key)
    g.mu.Unlock()
    return c.val, c.err
}
\`\`\`

## 4. 資料一致性與 Raft 複製狀態機

在多副本 (Replication) 架構中，主從非同步複製可能存在讀寫不一致風險。採用輕量級 Raft 共識協定：
- **Leader 節點** 統一接收寫入操作，將日誌（Log Entry）廣播至各 Follower。
- 當過半數（Quorum: \`N/2 + 1\`）節點成功寫入 Log，Leader 執行 Commit 並反饋客戶端。
- 保證在極端網路分區（Split-brain）情境下依然維持強一致性 (Linearizability)。

## 5. 總結與架構決策矩陣
- 對於**極致吞吐、允許弱一致**場景：採用 Redis Cluster + 邏輯過期 (Soft TTL) + Singleflight。
- 對於**嚴格一致性、元數據配置快取**場景：採用 Raft-based distributed KV (如 etcd)。`
  },
  {
    id: 'modular-monolith-transition',
    title: '雲原生反思：從過度微服務化重構回模組化單體架構 (Modular Monolith)',
    category: '軟體架構與工程管理',
    source: 'Software Architecture Quarterly',
    readTime: '10 min',
    text: `# 雲原生反思：從過度微服務化重構回模組化單體架構 (Modular Monolith)

## 1. 微服務狂熱後的反思

過去數年間，「微服務架構」被視為現代軟體工程的標準答案。然而，許多團隊在業務規模尚未達到數千人時便強行拆分數十個微服務，導致巨額的架構負債：

1. **分散式事務的地獄**：為了保持跨服務資料一致性，引入複雜的 Saga、2PC 或事件最終一致性方案，造成排查 Bug 成本呈指數級暴增。
2. **網路延遲與故障級聯**：單一用戶請求可能觸發十幾次跨服務 RPC 呼叫，任何一個環節逾時都會造成連鎖雪崩。
3. **維運成本居高不下**：Kubernetes 叢集、Service Mesh、分散式追蹤（Jaeger/Zipkin）、分散式日誌維護耗費龐大人力。

## 2. 什麼是模組化單體架構 (Modular Monolith)？

模組化單體並非回到昔日雜亂無章的「大泥球 (Big Ball of Mud)」，而是**在單一程式碼庫與單一部署單元內，強制實施嚴格的模組邊界與領域隔離**。

### 核心設計原則：
- **物理單體，邏輯微服務**：共享同一個運作行程 (Process)，但模組間禁止直接存取內部資料庫表或內部私有類別。
- **公開 API 合約**：各領域模組（如 \`Billing\`, \`Identity\`, \`Inventory\`）僅對外暴露嚴格定義的 Interface 或內部 Event 訂閱。
- **零網路成本呼叫**：模組間互動透過記憶體內的方法呼叫（In-memory Method Call）或進程內事件匯流排（In-process Event Bus），延遲從數十毫秒降至微秒級。

\`\`\`typescript
// 模組化單體架構範例：模組邊界隔離
// modules/billing/public-api.ts -> 僅匯出對外公開合約
export interface BillingService {
  charge(userId: string, amountCents: number): Promise<PaymentResult>;
}

// modules/orders/order-service.ts
import { BillingService } from '../billing/public-api';

export class OrderService {
  constructor(private billing: BillingService) {}

  async checkout(orderId: string) {
    // 記憶體內直接調用，零網路延遲，零序列化負擔！
    const res = await this.billing.charge('user_123', 5000);
    if (!res.success) throw new Error('Payment failed');
  }
}
\`\`\`

## 3. 效益與權衡分析 (Trade-offs)

### 顯著優勢：
- **極致開發效率與重構自由**：IDE 能直接跨模組追蹤依賴，重構時編譯器即時揪錯，大幅縮短 CI/CD 驗證時間。
- **資源使用率高**：無需為每個微服務預留過量容器 CPU/RAM，伺服器成本通常可降低 40%~70%。
- **保留未來拆分彈性**：由於模組邊界清晰、資料表按領域垂直劃分，若未來特定模組（如 AI 運算）需獨立擴展，可極為平滑地剝離為獨立微服務。

## 4. 結語與架構建議
若團隊規模在 50 人以下、日活並非億級，**優先選擇「模組化單體」是性價比最高、交付速度最快的理性決策**。`
  }
];
