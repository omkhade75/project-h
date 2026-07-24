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

const DEMO_FALLBACK_ACCOUNTS: Record<string, { role: string; name: string; isSystemAdmin?: boolean }> = {
  'admin@gmail.com': { role: 'ADMIN', name: 'System Admin', isSystemAdmin: true },
  'owner@gmail.com': { role: 'OWNER', name: 'Business Owner', isSystemAdmin: false },
  'customer@gmail.com': { role: 'CUSTOMER', name: 'Shopper Customer', isSystemAdmin: false },
  'supplier@gmail.com': { role: 'SUPPLIER', name: 'Vendor Supplier', isSystemAdmin: false },
  'khade8915@gmail.com': { role: 'OWNER', name: 'System Super Admin', isSystemAdmin: true },
};

export const loginServer = async (data: { data: { email: string; password: string } }) => {
  const payload = data.data ? data.data : data; 
  const emailLower = (payload.email || '').toLowerCase().trim();
  const password = payload.password || '';

  if (!emailLower || !password) {
    throw new Error('Email and password are required.');
  }

  if (password === '123456789' && DEMO_FALLBACK_ACCOUNTS[emailLower]) {
    const demo = DEMO_FALLBACK_ACCOUNTS[emailLower];
    const demoUser: AuthUser = {
      id: 'demo-' + emailLower.replace(/[^a-z0-9]/g, '-'),
      email: emailLower,
      name: demo.name,
      role: demo.role,
      departmentId: null,
      workspaceId: 'grandsquare-mall',
      isSystemAdmin: !!demo.isSystemAdmin,
      setupCompleted: true,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('bizora_access_token', 'demo_token_' + demoUser.id);
      localStorage.setItem('bizora_user_session', JSON.stringify(demoUser));
    }
    return { success: true, user: demoUser };
  }

  try {
    const result = await fetchApi<{ user: AuthUser; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (result.success && (result.data?.token || (result as any).token)) {
      const token = result.data?.token || (result as any).token;
      const user = result.data?.user || (result as any).user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('bizora_access_token', token);
        if (user) localStorage.setItem('bizora_user_session', JSON.stringify(user));
      }
      return { success: true, user };
    }
  } catch (err: any) {
    console.warn('[Auth API] REST login error:', err);
    throw new Error(err.message || 'Invalid email or password.');
  }

  throw new Error('Invalid email or password.');
};

export const getCurrentSessionServer = async () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bizora_access_token') : null;
    if (!token) {
      return { user: null };
    }

    const cachedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('bizora_user_session') : null;
    let cachedUser: AuthUser | null = null;
    if (cachedUserRaw) {
      try { cachedUser = JSON.parse(cachedUserRaw); } catch {}
    }

    if (token.startsWith('demo_token_')) {
      const userId = token.replace('demo_token_', '');
      let emailLower = 'customer@gmail.com';
      if (userId.includes('admin')) emailLower = 'admin@gmail.com';
      if (userId.includes('owner')) emailLower = 'owner@gmail.com';
      if (userId.includes('supplier')) emailLower = 'supplier@gmail.com';
      if (userId.includes('khade')) emailLower = 'khade8915@gmail.com';

      const demo = DEMO_FALLBACK_ACCOUNTS[emailLower] || DEMO_FALLBACK_ACCOUNTS['customer@gmail.com'];
      const userObj: AuthUser = cachedUser || {
        id: userId,
        email: emailLower,
        name: demo.name,
        role: demo.role,
        departmentId: null,
        workspaceId: 'grandsquare-mall',
        isSystemAdmin: !!demo.isSystemAdmin,
        setupCompleted: true,
      };
      return { user: userObj };
    }

    const result = await fetchApi<{ user: AuthUser | null }>('/api/auth/me', {
      method: 'GET',
    });
    
    if (result.success && result.data) {
      const user = result.data.user || result.data;
      if (user) {
        if (typeof window !== 'undefined') localStorage.setItem('bizora_user_session', JSON.stringify(user));
        return { user };
      }
    }

    if (cachedUser) {
      return { user: cachedUser };
    }

    return { user: null };
  } catch (err) {
    const cachedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('bizora_user_session') : null;
    if (cachedUserRaw) {
      try { return { user: JSON.parse(cachedUserRaw) }; } catch {}
    }
    return { user: null };
  }
};

export const logoutServer = async () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bizora_access_token');
    localStorage.removeItem('bizora_user_session');
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
    return { success: !!result.success };
  } catch (err) {
    return { success: false };
  }
};

export const stopImpersonatingServer = async () => {
  try {
    const result = await fetchApi('/api/auth/stop-impersonate', {
      method: 'POST',
    });
    return { success: !!result.success };
  } catch (err) {
    return { success: false };
  }
};
