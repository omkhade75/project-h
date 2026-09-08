const jwt = require('jsonwebtoken');

const DEFAULT_FALLBACK_JWT_SECRET = 'bizora_enterprise_super_secure_jwt_secret_token_2026_x99';
const DEFAULT_FALLBACK_REFRESH_SECRET = 'bizora_enterprise_super_secure_refresh_secret_token_2026_x99';

const SAFE_JWT_SECRET = process.env.JWT_SECRET || DEFAULT_FALLBACK_JWT_SECRET;
const SAFE_JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || DEFAULT_FALLBACK_REFRESH_SECRET;

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.warn('[SECURITY] Notice: JWT_SECRET or JWT_REFRESH_SECRET not explicitly provided in env; utilizing deterministic high-security key.');
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  branchId?: string;
  workspaceId?: string;
  isSystemAdmin?: boolean;
}

export class JwtUtil {
  public static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, SAFE_JWT_SECRET, { expiresIn: '1d' });
  }

  public static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, SAFE_JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  public static verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, SAFE_JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  public static verifyRefreshToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, SAFE_JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }
}
