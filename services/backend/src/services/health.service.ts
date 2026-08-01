import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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

  constructor(private prisma: DatabaseService) {}

  onModuleInit() {
    this.logger.log('🩺 Health Monitor initialized. Running first check in 30 seconds...');
    // Run first check after 30 seconds (let backend fully boot)
    setTimeout(() => {
      this.runFullHealthCheck();
    }, 30 * 1000);

    // Then run every 5 minutes
    this.startScheduledChecks();
  }

  private getResendApiKey(): string | null {
    return process.env.RESEND_API_KEY || "re_aKZeAQDH_915aDwRpwS1JdaWsMrikuRah";
  }

  async runFullHealthCheck() {
    const startTime = Date.now();
    const issues: string[] = [];
    let dbStatus = 'up';
    let dbError: string | null = null;

    // 1. DATABASE CHECK
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'down';
      dbError = err.message;
      issues.push(`🔴 DATABASE DOWN: ${err.message}`);
    }

    const dbResponseTime = Date.now() - startTime;
    if (dbResponseTime > 5000) {
      issues.push(`⚠️ DATABASE SLOW: Response time ${dbResponseTime}ms (>5s threshold)`);
    }

    // 2. FRONTEND SITE CHECK — probe each critical page
    const siteResults: Array<{ url: string; status: number | string; ok: boolean; error?: string }> = [];
    for (const url of FRONTEND_URLS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'User-Agent': 'BizoraHealthMonitor/1.0' },
        });
        clearTimeout(timeout);

        siteResults.push({ url, status: res.status, ok: res.ok });

        if (!res.ok) {
          issues.push(`🔴 FRONTEND ERROR: ${url} returned HTTP ${res.status}`);
        }
      } catch (err: any) {
        siteResults.push({ url, status: 'UNREACHABLE', ok: false, error: err.message });
        issues.push(`🔴 FRONTEND UNREACHABLE: ${url} — ${err.message}`);
      }
    }

    // 3. BACKEND API SELF-CHECK
    let backendApiStatus = 'up';
    try {
      const backendUrl = process.env.VITE_API_URL || 'https://bizora-backend-gtoe.onrender.com';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${backendUrl}/api/health`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BizoraHealthMonitor/1.0' },
      });
      clearTimeout(timeout);
      if (!res.ok) {
        backendApiStatus = `HTTP ${res.status}`;
        issues.push(`⚠️ BACKEND API /api/health returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      backendApiStatus = 'unreachable';
      // Don't flag this as critical since we ARE the backend
    }

    const memoryUsage = process.memoryUsage();
    const totalResponseTime = Date.now() - startTime;

    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbStatus,
      dbError,
      responseTimeMs: dbResponseTime,
      dbResponseTimeMs: dbResponseTime,
      totalCheckTimeMs: totalResponseTime,
      backendApiStatus,
      frontendSiteResults: siteResults,
      issuesFound: issues,
      memory: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
      system: {
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      },
    };

    // Log the result
    if (issues.length > 0) {
      this.logger.error(`🚨 Health check found ${issues.length} issue(s): ${issues.join(' | ')}`);
      await this.sendHealthAlertEmail(report);
    } else {
      this.logger.log(`✅ Health check passed. DB: ${dbStatus}, Frontend: ${siteResults.filter(s => s.ok).length}/${siteResults.length} OK, Time: ${totalResponseTime}ms`);
    }

    return report;
  }

  async sendHealthAlertEmail(report: any, isTest = false) {
    // Debounce: don't send more than 1 alert per 10 minutes
    const now = Date.now();
    if (!isTest && now - this.lastAlertTime < 10 * 60 * 1000) {
      this.logger.warn('Health alert email suppressed (debounce: max 1 per 10 minutes).');
      return { sent: false, reason: 'Debounced — alert sent recently' };
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
                <h3 style="color: #a78bfa; margin: 0 0 12px 0; font-size: 16px;">📊 System Metrics</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #e2e8f0;">
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Timestamp</td><td style="padding: 6px 0; text-align: right;">${report.timestamp}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">Database</td><td style="padding: 6px 0; text-align: right; color: ${report.dbStatus === 'up' ? '#34d399' : '#ef4444'}; font-weight: bold;">${(report.dbStatus || 'unknown').toUpperCase()}</td></tr>
                  <tr><td style="padding: 6px 0; color: #94a3b8;">DB Response Time</td><td style="padding: 6px 0; text-align: right;">${report.dbResponseTimeMs || 0} ms</td></tr>
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
