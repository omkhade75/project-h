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
  throw new Error(result.error || result.message || 'Login failed');
};

export const getCurrentSessionServer = async () => {
  const result = await fetchApi<{ user: AuthUser | null }>('/api/auth/me', {
    method: 'GET',
  });
  
  if (result.success && result.data) {
    return { user: result.data.user || null };
  }
  return { user: null };
};

export const logoutServer = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizora_access_token');
  }
  return { success: true };
};

export const impersonateTenantServer = async (data: { data: { workspaceId: string } }) => {
  const payload = data.data ? data.data : data;
  const result = await fetchApi('/api/auth/impersonate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  
  if (result.success) {
    return { success: true };
  }
  throw new Error(result.error || result.message || 'Failed to impersonate');
};

export const stopImpersonatingServer = async () => {
  const result = await fetchApi('/api/auth/stop-impersonate', {
    method: 'POST',
  });
  
  if (result.success) {
    return { success: true };
  }
  throw new Error(result.error || result.message || 'Failed to stop impersonating');
};
