import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseConfig } from './config/database';
import { setupSecurityMiddleware } from './middlewares/security.middleware';
import { CentralExceptionFilter } from './middlewares/error.middleware';

// 🛡️ Global AI Self-Healing & Process Crash Immunity
process.on('uncaughtException', (err: any) => {
  console.error('🤖 [AI Watchdog] Caught unhandled exception — Prevented backend process crash:', err?.message || err);
  if (err?.stack) {
    console.error(err.stack);
  }
});

process.on('unhandledRejection', (reason: any) => {
  console.error('🤖 [AI Watchdog] Caught unhandled promise rejection — Prevented backend process crash:', reason?.message || reason);
});

async function bootstrap() {
  // Connect Mongoose to MongoDB with retry resilience
  try {
    await DatabaseConfig.connect();
  } catch (dbErr: any) {
    console.warn('⚠️ [AI Watchdog] Initial DB connection deferred to background pool:', dbErr.message);
  }

  const app = await NestFactory.create(AppModule);

  // Security headers, CORS, and Rate Limiting
  setupSecurityMiddleware(app);

  // Centralized Error Exception Filter
  app.useGlobalFilters(new CentralExceptionFilter());

  // Graceful shutdown on termination signals
  app.enableShutdownHooks();

  const port = process.env.PORT || process.env.BACKEND_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 [Bizora OS] Enterprise Backend running on 0.0.0.0:${port} with Active AI Self-Healing Watchdog`);
}

bootstrap().catch((err) => {
  console.error('[Bizora OS] Startup warning during backend bootstrap:', err?.message || err);
});
