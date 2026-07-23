import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { INestApplication } from '@nestjs/common';

export function setupSecurityMiddleware(app: INestApplication) {
  // Helmet HTTP Header security
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );

  // Global Rate Limiter: 100 requests per 15 mins
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });

  app.use(limiter);
}
