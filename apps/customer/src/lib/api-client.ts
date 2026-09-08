export const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'https://bizora-backend-gtoe.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// 🛡️ Frontend Auto-Healing: Listen for stale chunk load errors upon new deployments and auto-refresh
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = (event.message || '').toLowerCase();
    if (msg.includes('failed to fetch dynamically imported module') || msg.includes('loading chunk')) {
      console.warn('🤖 [Frontend Auto-Healing] Detected deployment chunk version mismatch. Auto-refreshing...');
      const hasReloaded = sessionStorage.getItem('bizora_chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('bizora_chunk_reload', 'true');
        window.location.reload();
      }
    }
  });
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any; isSelfHealed?: boolean }> {
  const maxRetries = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bizora_access_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const baseUrl = getApiBaseUrl();
      const response = await fetch(baseUrl + endpoint, {
        ...options,
        headers,
      });

      let result: any;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      // If successful, return result
      if (response.ok) {
        return result || { success: true, data: [] as any };
      }

      // If transient server error (502, 503, 504) or rate limit (429), auto-retry with backoff
      if ((response.status >= 502 && response.status <= 504) || response.status === 429) {
        if (attempt < maxRetries) {
          const delay = Math.min(attempt * 600, 2000) + Math.random() * 200;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
      }

      // Return server-reported error or self-healed payload
      return {
        success: result?.success ?? false,
        data: result?.data ?? ([] as any),
        message: result?.message || result?.error || `HTTP ${response.status}`,
        error: result?.error || result?.message || `HTTP ${response.status}`,
        isSelfHealed: result?.isSelfHealed,
      };
    } catch (err: any) {
      lastError = err;
      // Network drop: auto-retry with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(attempt * 500, 1500) + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
    }
  }

  // Graceful degradation on network timeout
  return {
    success: false,
    data: [] as any,
    message: lastError?.message || 'Network unreachable. Auto-healing active.',
    error: lastError?.message || 'Network unreachable',
    isSelfHealed: true,
  };
}
