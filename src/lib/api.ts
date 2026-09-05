/**
 * Safe API fetch helper with robust JSON parsing and HTML fallback error handling
 */
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (netErr: any) {
    console.error('Network request failed:', netErr);
    const msg = netErr.message || '';
    if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) {
      throw new Error('無法連線至後端伺服器，請檢查網路連線或稍後再試。');
    }
    throw new Error(`網路請求失敗: ${msg || '連線異常'}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let errorMsg = `伺服器回應錯誤 (HTTP ${res.status})`;
    if (contentType.includes('application/json')) {
      try {
        const errJson = await res.json();
        errorMsg = errJson.error || errJson.message || errorMsg;
      } catch {
        // ignore parse error
      }
    } else {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<!doctype') || text.includes('<html')) {
        if (res.status === 404) {
          errorMsg = '找不到對應的 API 服務端點 (404 Not Found)';
        } else if (res.status === 502 || res.status === 504) {
          errorMsg = '伺服器連線逾時或暫時中斷 (502/504)，請稍後再試。';
        } else {
          errorMsg = `伺服器回應異常 (HTTP ${res.status})，請稍後重試。`;
        }
      } else if (text.trim()) {
        errorMsg = text.slice(0, 200);
      }
    }
    throw new Error(errorMsg);
  }

  // Handle successful response
  if (contentType.includes('application/json')) {
    try {
      return (await res.json()) as T;
    } catch (parseErr) {
      console.error('Failed to parse JSON response:', parseErr);
      throw new Error('伺服器回傳資料格式解析失敗，請重新嘗試。');
    }
  }

  const rawText = await res.text();
  try {
    return JSON.parse(rawText) as T;
  } catch (e) {
    console.error('Non-JSON response received:', rawText.slice(0, 200));
    if (rawText.includes('<!DOCTYPE') || rawText.includes('<!doctype')) {
      throw new Error('後端伺服器尚未完全就緒或回傳了網頁，請稍候 3 秒後重新嘗試。');
    }
    throw new Error('無法解析伺服器回傳之內容格式');
  }
}
