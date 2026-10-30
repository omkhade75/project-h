export const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== "undefined" && process.env) {
    if (process.env.VITE_API_URL) return process.env.VITE_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.startsWith("192.168.") ||
      h.startsWith("10.") ||
      h.startsWith("172.") ||
      h.endsWith(".local")
    ) {
      return `http://${h}:3000`;
    }
  }
  return "https://bizora-backend-gtoe.onrender.com";
};

export const API_BASE_URL = getApiBaseUrl();

// 🛡️ Frontend Auto-Healing: Listen for stale chunk load errors upon new deployments and auto-refresh
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = (event.message || "").toLowerCase();
    if (
      msg.includes("failed to fetch dynamically imported module") ||
      msg.includes("loading chunk")
    ) {
      console.warn(
        "🤖 [Frontend Auto-Healing] Detected deployment chunk version mismatch. Auto-refreshing...",
      );
      const hasReloaded = sessionStorage.getItem("bizora_chunk_reload");
      if (!hasReloaded) {
        sessionStorage.setItem("bizora_chunk_reload", "true");
        window.location.reload();
      }
    }
  });
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ success: boolean; data?: T; message?: string; error?: any; isSelfHealed?: boolean }> {
  const maxRetries = 2;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxRetries) {
    attempt++;
    let timeoutId: any = null;
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("bizora_access_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }

      const baseUrl = getApiBaseUrl();

      // ⚡ Resilient failover: 8-second timeout to accommodate cold starts
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(baseUrl + endpoint, {
        ...options,
        headers,
        signal: options.signal || controller.signal,
      });

      if (timeoutId) clearTimeout(timeoutId);

      let result: any;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (response.ok) {
        return result || { success: true, data: [] as any };
      }

      // If transient server error (502, 503, 504) or rate limit (429), auto-retry once quickly
      if ((response.status >= 502 && response.status <= 504) || response.status === 429) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
      }

      return {
        success: result?.success ?? false,
        data: result?.data ?? ([] as any),
        message: result?.message || result?.error || `HTTP ${response.status}`,
        error: result?.error || result?.message || `HTTP ${response.status}`,
        isSelfHealed: result?.isSelfHealed,
      };
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      lastError = err;
      if (attempt < maxRetries && err.name !== "AbortError") {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      break;
    }
  }

  return {
    success: false,
    data: [] as any,
    message: lastError?.message || "Network unreachable. Auto-healing active.",
    error: lastError?.message || "Network unreachable",
    isSelfHealed: true,
  };
}
