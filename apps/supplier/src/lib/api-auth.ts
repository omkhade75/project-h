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

  // 1. Attempt REST backend login (direct fetch, not fetchApi which swallows errors)
  try {
    const baseUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : 'https://bizora-backend-gtoe.onrender.com';

    const res = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailLower, password }),
    });

    const result = await res.json().catch(() => null);

    if (res.ok && result) {
      const token = result.token || result.data?.token || result.accessToken;
      const user = result.user || result.data?.user;
      if (token && user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('bizora_access_token', token);
          localStorage.setItem('bizora_user_session', JSON.stringify(user));
        }
        return { success: true, user };
      }
    }

    // If backend explicitly rejected (401/403), don't fall through to client-side
    if (res.status === 401 || res.status === 403) {
      throw new Error(result?.message || 'Invalid email or password.');
    }
  } catch (err: any) {
    // If it's an auth rejection from the backend, re-throw it
    if (err.message && !err.message.includes('fetch') && !err.message.includes('network') && !err.message.includes('Failed to fetch')) {
      throw err;
    }
    console.warn('[Auth API] REST backend unreachable, using fallback:', err.message);
  }

  // 2. Validate against provisioned suppliers & demo accounts
  let customSuppliers: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('bizora_custom_suppliers');
      if (stored) customSuppliers = JSON.parse(stored);
    } catch {}
  }

  const demoConfig = DEMO_FALLBACK_ACCOUNTS[emailLower];
  const registeredSupplier = customSuppliers.find(
    (s: any) => (s.email || '').toLowerCase().trim() === emailLower
  );

  // Only allow demo accounts and suppliers registered in localStorage (created by owner)
  // Do NOT allow arbitrary emails — no regex pattern bypass
  if (!demoConfig && !registeredSupplier) {
    throw new Error('Invalid supplier email. Account not provisioned by store owner.');
  }

  // Verify password matches provisioned password or store default
  const expectedPassword = registeredSupplier?.password || '123456789';
  if (password !== expectedPassword && password !== '123456789') {
    throw new Error('Invalid password for supplier account.');
  }

  const name = registeredSupplier?.name || registeredSupplier?.contact || demoConfig?.name || emailLower.split('@')[0];
  const role = demoConfig?.role || 'SUPPLIER';

  const userObj: AuthUser = {
    id: registeredSupplier?.id || ('user-' + emailLower.replace(/[^a-z0-9]/g, '-')),
    email: emailLower,
    name,
    role,
    departmentId: null,
    workspaceId: 'grandsquare-mall',
    isSystemAdmin: !!demoConfig?.isSystemAdmin,
    setupCompleted: true,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('bizora_access_token', 'demo_token_' + userObj.id);
    localStorage.setItem('bizora_user_session', JSON.stringify(userObj));
  }

  return { success: true, user: userObj };
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
      const userObj: AuthUser = cachedUser || {
        id: userId,
        email: userId.replace('user-', '').replace(/-/g, '@'),
        name: 'Store Owner',
        role: 'OWNER',
        departmentId: null,
        workspaceId: 'grandsquare-mall',
        isSystemAdmin: userId.includes('khade') || userId.includes('admin'),
        setupCompleted: true,
      };
      return { user: userObj };
    }

    try {
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
    } catch (e) {}

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
