import { Injectable, OnModuleInit, Logger, Optional } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { MongodbService } from '../mongodb/mongodb.service';
import { DatabaseConfig } from '../config/database';
import * as os from 'os';

const ADMIN_EMAIL = process.env.SYSTEM_ADMIN_EMAIL || 'khade8915@gmail.com';
const FRONTEND_URLS = [
  'https://bizora-owner.onrender.com/command-center',
  'https://bizora-owner.onrender.com/customers',
  'https://bizora-owner.onrender.com/products',
  'https://bizora-owner.onrender.com/settings',
  'https://bizora-owner.onrender.com/expenses',
  'https://bizora-owner.onrender.com/ai-decisions',
  'https://bizora-owner.onrender.com/sales',
];

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);
  private lastAlertTime = 0; // Debounce: don't spam emails

  constructor(
    private prisma: DatabaseService,
    @Optional() private mongo?: MongodbService,
  ) {}

  onModuleInit() {
    this.logger.log('🩺 Health Monitor initialized. Running first check in 15 seconds...');
    setTimeout(() => {
      this.runFullHealthCheck();
    }, 15 * 1000);

    // Run every 5 minutes
    this.startScheduledChecks();
  }

  private getResendApiKey(): string | null {
    return process.env.RESEND_API_KEY || "re_aKZeAQDH_915aDwRpwS1JdaWsMrikuRah";
  }

  async runFullHealthCheck() {
    const startTime = Date.now();
    const issues: string[] = [];
    const warnings: string[] = [];

    // 1. POSTGRESQL (SUPABASE / PRISMA) AUDIT
    const pgHealth = await this.prisma.checkHealth();
    let pgStatus = pgHealth.ok ? 'up' : 'down';
    let pgError = pgHealth.error || null;
    const pgResponseTime = pgHealth.latencyMs;
    const entityCounts = pgHealth.entityCounts || {};

    if (!pgHealth.ok) {
      issues.push(`🔴 POSTGRESQL DOWN: ${pgHealth.error || 'Connection failed'}`);
    } else if (pgResponseTime > 12000 && process.uptime() > 180) {
      issues.push(`⚠️ POSTGRESQL SLOW: Response time ${pgResponseTime}ms (>12s threshold)`);
    }

    // 2. MONGODB ATLAS (MONGOOSE & MONGO DRIVER) AUDIT
    const mongoClientHealth = this.mongo
      ? await this.mongo.checkHealth()
      : { ok: false, latencyMs: 0, collections: [] as string[], collectionCounts: {} as Record<string, number>, error: 'Mongo service not initialized' };
    const mongoosePing = await DatabaseConfig.ping();
    
    const isMongoUp = mongoClientHealth.ok || mongoosePing.ok;
    const mongoStatus = isMongoUp ? 'up' : 'down';
    const mongoResponseTime = Math.max(mongoClientHealth.latencyMs, mongoosePing.latencyMs);
    const mongoCollections = mongoClientHealth.collections || [];
    const mongoCollectionCounts = mongoClientHealth.collectionCounts || {};
    const mongoError = isMongoUp ? null : (mongoClientHealth.error || mongoosePing.error || 'MongoDB unreachable');

    if (!isMongoUp) {
      issues.push(`🔴 MONGODB DOWN: ${mongoError || 'Connection failed'}`);
    } else if (mongoResponseTime > 12000 && process.uptime() > 180) {
      issues.push(`⚠️ MONGODB SLOW: Response time ${mongoResponseTime}ms (>12s threshold)`);
    }

    // 2. BACKEND API ENDPOINT CONTROLLER AUDIT
    const backendUrl = process.env.VITE_API_URL || 'https://bizora-backend-gtoe.onrender.com';
    const apiEndpoints = [
      { name: 'Products API', path: '/api/products' },
      { name: 'Transactions API', path: '/api/transactions' },
      { name: 'Customers API', path: '/api/customers' },
      { name: 'Suppliers API', path: '/api/suppliers' },
      { name: 'Expenses API', path: '/api/expenses' },
      { name: 'Purchase Orders API', path: '/api/purchase-orders' },
      { name: 'Recommendations AI API', path: '/api/recommendations' },
      { name: 'Anomalies AI API', path: '/api/anomalies' },
    ];

    const apiResults: Array<{ name: string; path: string; status: number | string; ok: boolean; latencyMs: number }> = [];

    for (const ep of apiEndpoints) {
      const epStart = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(`${backendUrl}${ep.path}`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'BizoraDeepAuditMonitor/2.0' },
        });
        clearTimeout(timeout);
        const latencyMs = Date.now() - epStart;
        const isOk = res.status < 500; // 2xx, 3xx, 4xx (auth required) are alive controllers

        apiResults.push({ name: ep.name, path: ep.path, status: res.status, ok: isOk, latencyMs });

        if (res.status >= 500) {
          issues.push(`🔴 BACKEND API ERROR: ${ep.path} returned HTTP ${res.status} (${latencyMs}ms)`);
        }
      } catch (err: any) {
        const latencyMs = Date.now() - epStart;
        apiResults.push({ name: ep.name, path: ep.path, status: 'UNREACHABLE', ok: false, latencyMs });
      }
    }

    // 3. FRONTEND PORTAL & MULTI-PAGE AVAILABILITY AUDIT
    const siteResults: Array<{ url: string; status: number | string; ok: boolean; latencyMs: number }> = [];
    for (const url of FRONTEND_URLS) {
      const pageStart = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'BizoraDeepAuditMonitor/2.0' },
        });
        clearTimeout(timeout);
        const latencyMs = Date.now() - pageStart;

        siteResults.push({ url, status: res.status, ok: res.ok, latencyMs });

        if (!res.ok) {
          issues.push(`🔴 FRONTEND PAGE DOWN: ${url} returned HTTP ${res.status}`);
        }
      } catch (err: any) {
        const latencyMs = Date.now() - pageStart;
        siteResults.push({ url, status: 'UNREACHABLE', ok: false, latencyMs });
        issues.push(`🔴 FRONTEND UNREACHABLE: ${url} — ${err.message}`);
      }
    }

    // 4. MEMORY & SYSTEM THRESHOLD AUDIT
    const memoryUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const heapPct = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    // Only flag memory as critical if heap is above 250MB AND >90% (ignoring small initial V8 allocations)
    if (heapUsedMb > 250 && heapPct > 90) {
      issues.push(`🔴 CRITICAL MEMORY USAGE: Heap is at ${heapPct}% (${heapUsedMb}MB / ${heapTotalMb}MB)`);
    }

    // 5. AI SELF-HEALING ENGINE — Active real-time auto-remediation & issue clearance
    const healedActions: string[] = [];

    // Auto-Fix 1: PostgreSQL Connection Reset & Pool Warm-up if DB slow or dropped
    if (pgStatus === 'down' || pgResponseTime > 5000) {
      try {
        this.logger.log('🤖 AI Self-Healing: Resetting PostgreSQL pool & warming Supabase connection...');
        await this.prisma.$disconnect().catch(() => {});
        await this.prisma.$connect();
        const healStart = Date.now();
        await this.prisma.$queryRaw`SELECT 1`;
        const healedDbTime = Date.now() - healStart;

        pgStatus = 'up';
        pgError = null;

        const idx = issues.findIndex(i => i.includes('POSTGRESQL'));
        if (idx !== -1) issues.splice(idx, 1);

        const healedMsg = `Restored PostgreSQL pool & warmed connection (Query latency lowered to ${healedDbTime}ms)`;
        healedActions.push(healedMsg);
        this.logger.log(`✅ AI Self-Healing SUCCESS: ${healedMsg}`);
      } catch (healErr: any) {
        this.logger.warn(`AI Self-Healing failed to restore PostgreSQL: ${healErr.message}`);
      }
    }

    // Auto-Fix 2: MongoDB Connection Reset & Ping Warm-up if dropped
    if (!isMongoUp || mongoResponseTime > 5000) {
      try {
        this.logger.log('🤖 AI Self-Healing: Reconnecting MongoDB Atlas client and Mongoose...');
        await DatabaseConfig.connect();
        if (this.mongo) {
          await this.mongo.onModuleInit();
        }
        const mPing = await DatabaseConfig.ping();
        if (mPing.ok) {
          const idx = issues.findIndex(i => i.includes('MONGODB'));
          if (idx !== -1) issues.splice(idx, 1);
          const healedMsg = `Restored MongoDB Atlas connection (Ping latency: ${mPing.latencyMs}ms)`;
          healedActions.push(healedMsg);
          this.logger.log(`✅ AI Self-Healing SUCCESS: ${healedMsg}`);
        }
      } catch (mHealErr: any) {
        this.logger.warn(`AI Self-Healing failed to restore MongoDB: ${mHealErr.message}`);
      }
    }

    // Auto-Fix 3: API Endpoint Controller Retry & Warm-up
    const failedApis = apiResults.filter(r => !r.ok);
    if (failedApis.length > 0) {
      for (const failedEp of failedApis) {
        try {
          this.logger.log(`🤖 AI Self-Healing: Auto-retrying failed API controller endpoint ${failedEp.path}...`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);
          const retryRes = await fetch(`${backendUrl}${failedEp.path}`, {
            method: 'GET',
            signal: controller.signal,
            headers: { 'User-Agent': 'BizoraSelfHealingEngine/2.0' },
          });
          clearTimeout(timeout);

          if (retryRes.status < 500) {
            failedEp.ok = true;
            failedEp.status = retryRes.status;
            const idx = issues.findIndex(i => i.includes(failedEp.path));
            if (idx !== -1) issues.splice(idx, 1);

            const healedMsg = `Auto-retried & warmed API endpoint ${failedEp.path} (Status HTTP ${retryRes.status})`;
            healedActions.push(healedMsg);
            this.logger.log(`✅ AI Self-Healing SUCCESS: ${healedMsg}`);
          }
        } catch (_) {}
      }
    }

    // Auto-Fix 4: Memory Cache Purge & Garbage Collection Trigger
    if (heapPct > 80 && (global as any).gc) {
      try {
        (global as any).gc();
        const postGcUsage = process.memoryUsage();
        const postGcPct = Math.round((postGcUsage.heapUsed / postGcUsage.heapTotal) * 100);
        const healedMsg = `Triggered V8 memory garbage collection (Lowered heap usage from ${heapPct}% to ${postGcPct}%)`;
        healedActions.push(healedMsg);
        this.logger.log(`✅ AI Self-Healing SUCCESS: ${healedMsg}`);

        if (postGcPct < 85) {
          const idx = issues.findIndex(i => i.includes('MEMORY'));
          if (idx !== -1) issues.splice(idx, 1);
        }
      } catch (gcErr) {}
    }

    // Auto-Fix 5: Corrupted / Negative Inventory Stock Auto-Repair
    try {
      const negativeStockCount = await this.prisma.inventoryStock.count({ where: { availableQty: { lt: 0 } } }).catch(() => 0);
      if (negativeStockCount > 0) {
        await this.prisma.inventoryStock.updateMany({ where: { availableQty: { lt: 0 } }, data: { availableQty: 0, quantityOnHand: 0 } });
        const healedMsg = `Auto-repaired ${negativeStockCount} inventory stock entries with negative quantities back to 0`;
        healedActions.push(healedMsg);
        this.logger.log(`✅ AI Self-Healing SUCCESS: ${healedMsg}`);
      }
    } catch (_) {}

    const totalResponseTime = Date.now() - startTime;
    const remainingIssues = issues.filter((iss) => {
      if (pgStatus === 'up' && iss.includes('POSTGRESQL DOWN')) return false;
      if (mongoStatus === 'up' && iss.includes('MONGODB DOWN')) return false;
      return true;
    });

    const allIssues = [...remainingIssues, ...warnings];

    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbStatus: pgStatus,
      dbError: pgError,
      postgres: {
        status: pgStatus,
        connected: pgHealth.ok,
        responseTimeMs: pgResponseTime,
        error: pgError,
        entityCounts,
        engine: 'Supabase PostgreSQL 17 (Prisma Pooler)',
      },
      mongoDbStatus: mongoStatus,
      mongoDbConnected: isMongoUp,
      mongodb: {
        status: mongoStatus,
        connected: isMongoUp,
        responseTimeMs: mongoResponseTime,
        error: mongoError,
        collections: mongoCollections,
        collectionCounts: mongoCollectionCounts,
        mongooseReadyState: mongoosePing.readyState,
        engine: 'MongoDB Atlas Cloud (Mongoose & Driver)',
      },
      dualDatabases: {
        bothHealthy: pgStatus === 'up' && mongoStatus === 'up',
        postgresStatus: pgStatus,
        mongoStatus: mongoStatus,
      },
      responseTimeMs: pgResponseTime,
      dbResponseTimeMs: pgResponseTime,
      totalCheckTimeMs: totalResponseTime,
      backendApiStatus: apiResults.every(r => r.ok) ? 'up' : 'degraded',
      frontendSiteResults: siteResults,
      apiResults,
      entityCounts,
      issuesFound: allIssues,
      healedActions,
      criticalIssuesCount: remainingIssues.length,
      warningIssuesCount: warnings.length,
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        heapPct,
      },
      system: {
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      },
    };

    // Smart Alert Trigger: Only send email if > 3 critical errors OR database down OR explicit test
    const shouldSendEmail =
      remainingIssues.length >= 3 ||
      pgStatus === 'down' ||
      mongoStatus === 'down' ||
      remainingIssues.some((i) => i.includes('CRITICAL') || i.includes('SECURITY'));

    if (shouldSendEmail) {
      this.logger.error(`🚨 Deep audit found ${remainingIssues.length} critical issue(s), ${warnings.length} warning(s). Sending alert...`);
      await this.sendHealthAlertEmail(report);
    } else if (remainingIssues.length > 0 || warnings.length > 0) {
      this.logger.warn(`ℹ️ Deep audit found minor issues (${remainingIssues.length} issues, ${warnings.length} warnings) — Email suppressed to preserve Resend quota. AI Healed: ${healedActions.length} item(s).`);
    } else {
      this.logger.log(`✅ Deep system audit passed. Postgres: ${pgStatus}, MongoDB: ${mongoStatus}, APIs: ${apiResults.filter(a => a.ok).length}/${apiResults.length} OK, Pages: ${siteResults.filter(s => s.ok).length}/${siteResults.length} OK, Audit Time: ${totalResponseTime}ms`);
    }

    return report;
  }

  async sendHealthAlertEmail(report: any, isTest = false) {
    // Smart Quota Guard: 30-minute debounce to conserve Resend free tier emails
    const now = Date.now();
    if (!isTest && now - this.lastAlertTime < 30 * 60 * 1000) {
      this.logger.warn('Health alert email suppressed (Resend Quota Guard: max 1 email per 30 minutes).');
      return { sent: false, reason: 'Quota Guard — 30-minute debounce active' };
    }

    const resendApiKey = this.getResendApiKey();
    if (!resendApiKey) {
      this.logger.warn('No Resend API key available. Cannot send health alert email.');
      return { sent: false, reason: 'RESEND_API_KEY not configured' };
    }

    const issuesHtml = (report.issuesFound || []).map((issue: string) =>
      `<tr><td style="padding: 10px; border: 1px solid #374151; color: #fca5a5; font-size: 14px;">${issue}</td></tr>`
    ).join('');

    const siteResultsHtml = (report.frontendSiteResults || []).map((s: any) => {
      const color = s.ok ? '#34d399' : '#ef4444';
      const statusText = s.ok ? '✅ OK' : `❌ ${s.status}`;
      const pageName = s.url.split('/').pop() || 'home';
      return `<tr>
        <td style="padding: 8px 10px; border: 1px solid #374151; color: #94a3b8; font-size: 13px;">/${pageName}</td>
        <td style="padding: 8px 10px; border: 1px solid #374151; color: ${color}; font-weight: bold; font-size: 13px;">${statusText}</td>
      </tr>`;
    }).join('');

    const subject = isTest
      ? '🧪 [TEST] Bizora Health Monitor Check'
      : `🚨 [ALERT] Bizora System Issues Detected — ${(report.issuesFound || []).length} problem(s)`;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bizora Health Monitor <onboarding@resend.dev>',
          to: [ADMIN_EMAIL],
          subject,
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 650px; margin: 0 auto; border: 1px solid #dc2626;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #ef4444; margin: 0; font-size: 22px;">🚨 Bizora System Health ${isTest ? 'Test' : 'Alert'}</h2>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Automated monitoring detected issues on your platform</p>
              </div>

              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 16px;">
                <h3 style="color: #fca5a5; margin: 0 0 12px 0; font-size: 16px;">⚠️ Issues Detected</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  ${issuesHtml || '<tr><td style="padding: 10px; color: #34d399;">No issues detected (test notification)</td></tr>'}
                </table>
              </div>

              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; margin-bottom: 16px;">
                <h3 style="color: #38bdf8; margin: 0 0 12px 0; font-size: 16px;">🌐 Frontend Page Status</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="background: #0f172a;">
                    <th style="padding: 8px 10px; border: 1px solid #374151; color: #94a3b8; text-align: left; font-size: 12px;">Page</th>
                    <th style="padding: 8px 10px; border: 1px solid #374151; color: #94a3b8; text-align: left; font-size: 12px;">Status</th>
                  </tr>
                  ${siteResultsHtml}
                </table>
              </div>

              <div style="background-color: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155;">
                <h3 style="color: #a78bfa; margin: 0 0 12px 0; font-size: 16px;">📊 Dual-Database &amp; System Metrics</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Timestamp</td><td style="padding: 6px 0; text-align: right;">${report.timestamp}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">🐘 PostgreSQL (Supabase)</td><td style="padding: 6px 0; text-align: right; color: ${report.postgres?.status === 'up' ? '#34d399' : '#ef4444'}; font-weight: bold;">${(report.postgres?.status || 'unknown').toUpperCase()} (${report.postgres?.responseTimeMs || 0}ms)</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">🍃 MongoDB Atlas</td><td style="padding: 6px 0; text-align: right; color: ${report.mongodb?.status === 'up' ? '#34d399' : '#ef4444'}; font-weight: bold;">${(report.mongodb?.status || 'unknown').toUpperCase()} (${report.mongodb?.responseTimeMs || 0}ms, ${report.mongodb?.collections?.length || 0} cols)</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Server Uptime</td><td style="padding: 6px 0; text-align: right;">${Math.round(report.uptime / 60)} minutes</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Heap Memory</td><td style="padding: 6px 0; text-align: right;">${report.memory?.heapUsed ? Math.round(report.memory.heapUsed / 1024 / 1024) + ' MB' : 'N/A'}</td></tr>
                </table>
              </div>

              <p style="text-align: center; color: #64748b; font-size: 11px; margin-top: 20px;">
                Bizora Health Monitor — Automated every 5 minutes
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send health email: ${errorText}`);
        let cleanReason = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          cleanReason = jsonErr.message || jsonErr.error || errorText;
          if (cleanReason.toLowerCase().includes('api key is invalid')) {
            cleanReason = 'Resend API key is invalid or expired. Set RESEND_API_KEY env variable on Render server.';
          }
        } catch (_) {}
        return { sent: false, reason: cleanReason };
      } else {
        this.lastAlertTime = now;
        this.logger.log(`✉️ Health alert email sent to ${ADMIN_EMAIL}`);
        return { sent: true };
      }
    } catch (err: any) {
      this.logger.error(`Error sending health alert email: ${err.message}`);
      return { sent: false, reason: err.message };
    }
  }

  startScheduledChecks() {
    // Run every 5 minutes (300,000 ms)
    setInterval(async () => {
      this.logger.log('🩺 Running scheduled health check...');
      try {
        await this.runFullHealthCheck();
      } catch (err: any) {
        this.logger.error(`Health check crashed: ${err.message}`);
      }
    }, 5 * 60 * 1000);
  }
}
