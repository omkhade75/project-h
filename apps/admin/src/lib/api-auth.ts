import { fetchApi } from './api-client';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId: string | null;
  workspaceId: string;
  isSystemAdmin: boolean;
  setupCompleted: boolean;
  originalAdminId?: string;
  isImpersonating?: boolean;
};

export const loginServer = async (data: { data: { email: string; password: string } }) => {
  try {
    const payload = data.data ? data.data : data; 
    const result = await fetchApi<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && result.data?.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('bizora_access_token', result.data.token);
      }
      return { success: true, user: result.data.user };
    }
    return { success: false, user: null, error: result.error || result.message || 'Login failed' };
  } catch (err: any) {
    return { success: false, user: null, error: err?.message || 'Login failed' };
  }
};

export const getCurrentSessionServer = async () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bizora_access_token') : null;
    if (!token) {
      return { user: null };
    }

    const result = await fetchApi<{ user: AuthUser | null }>('/api/auth/me', {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      return { user: result.data.user || result.data || null };
    }
    return { user: null };
  } catch (err) {
    return { user: null };
  }
};

export const logoutServer = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizora_access_token');
  }
  return { success: true };
};

export const impersonateTenantServer = async (data: { data: { workspaceId: string } }) => {
  try {
    const payload = data.data ? data.data : data;
    const result = await fetchApi('/api/auth/impersonate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (result.success) {
      return { success: true };
    }
    return { success: false };
  } catch (err) {
    return { success: false };
  }
};

export const stopImpersonatingServer = async () => {
  try {
    const result = await fetchApi('/api/auth/stop-impersonate', {
      method: 'POST',
    });
    
    if (result.success) {
      return { success: true };
    }
    return { success: false };
  } catch (err) {
    return { success: false };
  }
};
