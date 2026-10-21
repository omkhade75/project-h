import { INestApplication } from '@nestjs/common';
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Known disposable, burner, and spam email provider domains
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'yopmail.com',
  'trashmail.com',
  'dispostable.com',
  'getairmail.com',
  'mytemp.email',
  'temp-mail.org',
  'fakeinbox.com',
  'throwawaymail.com',
  'mohmal.com',
  'generator.email',
  'tempail.com',
  'burnermail.io',
  'inboxkitten.com',
  'crazymailing.com',
  'mailcatch.com',
  'nada.ltd',
  'dropmail.me',
  'getnada.com',
  'disposablemail.com',
  'fakemailgenerator.com',
  'emailondeck.com',
  'temp-mail.io',
  'internxt.com',
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

// In-memory sliding window for email burst protection (Anti-Mail-Bombing)
const emailThrottleMap = new Map<string, { count: number; windowStart: number }>();

// Clean up expired email throttle entries every 30 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of emailThrottleMap.entries()) {
    if (now - entry.windowStart > 15 * 60 * 1000) {
      emailThrottleMap.delete(email);
    }
  }
}, 30 * 60 * 1000).unref();

// Recursive sanitizer to strip MongoDB NoSQL injection operators ($gt, $ne, $where, etc.)
function sanitizeNoSqlOperators(obj: any) {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSqlOperators(obj[key]);
    }
  }
}

export function setupSecurityMiddleware(app: INestApplication) {
  // 1. Helmet HTTP Header security (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
  app.use(helmet());

  // 2. CORS configuration — locked to Bizora portals, Render subdomains, and development localhost
  const explicitOrigins = (
    process.env.CORS_ORIGIN ||
    'https://bizora-owner.onrender.com,https://bizora-admin.onrender.com,https://bizora-supplier.onrender.com,https://bizora-customer.onrender.com,https://bizora-web.onrender.com'
  )
    .split(',')
    .map((s) => s.trim());

  app.use(
    cors({
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void
      ) => {
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

  // 3. Global General Rate Limiter: 5000 requests per 15 mins (Whitelists /api/health watchdog)
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: any) =>
      req.path === '/api/health' || req.path === '/api/health/report-error',
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });
  app.use(globalLimiter);

  // 4. Strict Authentication & Registration Rate Limiter (Anti-Brute-Force & Anti-Credential-Stuffing)
  const authAndRegLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 40, // 40 attempts per IP per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        'Security Defense: Too many authentication or registration requests from this IP. Please try again after 15 minutes.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  });

  // Apply strict limiter to sensitive auth and registration endpoints
  app.use('/api/auth/login', authAndRegLimiter);
  app.use('/api/auth/register', authAndRegLimiter);
  app.use('/api/registration', authAndRegLimiter);
  app.use('/api/system-admin/register', authAndRegLimiter);

  // 5. Anti-Spam, Honeypot Bot Trap, Disposable Email Filter & NoSQL Injection Sanitizer
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      // A. Bot Honeypot Trap: Invisible input field submitted by automated web crawlers/bots
      if (
        req.body &&
        (req.body._hp_trap || req.body.website_bot_trap || req.body.hp_honeypot)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Automated bot submission detected and blocked.',
          code: 'BOT_HONEYPOT_TRIGGERED',
        });
      }

      // B. Disposable/Temporary Email Domain Blocker
      const emailCandidate =
        req.body?.email || req.body?.ownerEmail || req.body?.toEmail;
      if (typeof emailCandidate === 'string' && emailCandidate.includes('@')) {
        if (isDisposableEmail(emailCandidate)) {
          return res.status(400).json({
            success: false,
            message:
              'Temporary or disposable email domains are blocked. Please use an authentic personal or business email address.',
            code: 'DISPOSABLE_EMAIL_BLOCKED',
          });
        }

        // C. Anti-Mail-Bombing Cooldown (Max 5 registration/auth requests per email per 15 min)
        const isAuthOrReg =
          req.path?.includes('/register') ||
          req.path?.includes('/registration') ||
          req.path?.includes('/auth');

        if (isAuthOrReg) {
          const cleanEmail = emailCandidate.toLowerCase().trim();
          const now = Date.now();
          const entry = emailThrottleMap.get(cleanEmail);

          if (entry) {
            if (now - entry.windowStart < 15 * 60 * 1000) {
              if (entry.count >= 5) {
                return res.status(429).json({
                  success: false,
                  message:
                    'Anti-Spam Shield: Too many requests for this email address. Please wait 15 minutes before retrying.',
                  code: 'EMAIL_BURST_THROTTLED',
                });
              }
              entry.count++;
            } else {
              emailThrottleMap.set(cleanEmail, { count: 1, windowStart: now });
            }
          } else {
            emailThrottleMap.set(cleanEmail, { count: 1, windowStart: now });
          }
        }
      }

      // D. NoSQL Operator Injection Sanitizer (Strips keys with $ or .)
      if (req.body && typeof req.body === 'object') {
        sanitizeNoSqlOperators(req.body);
      }
    }
    next();
  });
}
