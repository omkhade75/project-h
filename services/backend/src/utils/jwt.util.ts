const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('[SECURITY] JWT_SECRET and JWT_REFRESH_SECRET environment variables are REQUIRED. Set them in your Render/hosting dashboard.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

const SAFE_JWT_SECRET = JWT_SECRET || 'dev-only-unsafe-key-' + Date.now();
const SAFE_JWT_REFRESH_SECRET = JWT_REFRESH_SECRET || 'dev-only-unsafe-refresh-' + Date.now();

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  companyId?: string;
  branchId?: string;
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
