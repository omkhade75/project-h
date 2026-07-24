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

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
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

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[API Client Error] Failed request to ' + endpoint + ':', error);
    return { success: false, error };
  }
}
