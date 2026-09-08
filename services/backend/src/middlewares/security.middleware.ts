import { INestApplication } from '@nestjs/common';
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

export function setupSecurityMiddleware(app: INestApplication) {
  // Helmet HTTP Header security
  app.use(helmet());

  // CORS configuration — locked to Bizora portals, Render subdomains, and development localhost
  const explicitOrigins = (process.env.CORS_ORIGIN 
    || 'https://bizora-owner.onrender.com,https://bizora-admin.onrender.com,https://bizora-supplier.onrender.com,https://bizora-customer.onrender.com,https://bizora-web.onrender.com'
  ).split(',').map(s => s.trim());

  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) return callback(null, true);
        if (
          explicitOrigins.includes(origin) ||
          origin.endsWith('.onrender.com') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1')
        ) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
    })
  );

  // Global Rate Limiter: 5000 requests per 15 mins (Whitelists /api/health watchdog)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) => req.path === '/api/health' || req.path === '/api/health/report-error',
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });

  app.use(limiter);
}
