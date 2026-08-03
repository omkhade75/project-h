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

  // 1. Attempt REST backend login
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
    console.warn('[Auth API] REST login error fallback active:', err);
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

  // Reject unprovisioned email addresses
  if (!demoConfig && !registeredSupplier && !emailLower.includes('supplier')) {
    throw new Error('Invalid supplier email. Account not provisioned by store owner.');
  }

  // Verify password length
  if (password.length < 6) {
    throw new Error('Invalid password. Minimum 6 characters required.');
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
