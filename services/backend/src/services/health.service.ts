import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as os from 'os';

@Injectable()
export class HealthService implements OnModuleInit {
  private readonly logger = new Logger(HealthService.name);

  constructor(private prisma: DatabaseService) {}

  onModuleInit() {
    this.startScheduledChecks();
  }

  async runFullHealthCheck() {
    const startTime = Date.now();
    let dbStatus = 'up';
    let dbError = null;
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'down';
      dbError = err.message;
    }

    const responseTime = Date.now() - startTime;
    const memoryUsage = process.memoryUsage();
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbStatus,
      dbError,
      responseTimeMs: responseTime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
      },
      system: {
        freeMem: os.freemem(),
        totalMem: os.totalmem(),
      }
    };

    // Trigger alert if DB is down or response time is very high (> 5s)
    if (dbStatus === 'down' || responseTime > 5000) {
      await this.sendHealthAlertEmail(report);
    }

    return report;
  }

  async sendHealthAlertEmail(report: any, isTest = false) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not found in environment.');
      return {
        sent: false,
        reason: 'RESEND_API_KEY environment variable is missing on server. Add RESEND_API_KEY to Render Environment Variables to receive real email alerts.'
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Bizora Health Monitor <onboarding@resend.dev>',
          to: 'khade8915@gmail.com',
          subject: isTest ? '🚨 [TEST ALERT] Bizora Health Check Email' : '🚨 [ALERT] Bizora Backend Issue Detected',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a;">
              <h2 style="color: #dc2626;">🚨 Bizora System Health ${isTest ? 'Test Notification' : 'Alert'}</h2>
              <p>Automated health check completed for <strong>bizora-backend</strong>.</p>
              <table style="border-collapse: collapse; width: 100%; max-width: 500px; margin: 15px 0; border: 1px solid #e5e7eb;">
                <tr style="background: #f9fafb;"><td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Timestamp</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${report.timestamp}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Database Status</td><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: ${report.dbStatus === 'up' ? '#16a34a' : '#dc2626'};">${report.dbStatus.toUpperCase()}</td></tr>
                <tr style="background: #f9fafb;"><td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Response Time</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${report.responseTimeMs} ms</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; border: 1px solid #e5e7eb;">Uptime</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${Math.round(report.uptime)} seconds</td></tr>
              </table>
              <h4>Full Health JSON Report:</h4>
              <pre style="background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 12px; overflow-x: auto;">${JSON.stringify(report, null, 2)}</pre>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Failed to send health email: ${errorText}`);
        return { sent: false, reason: errorText };
      } else {
        this.logger.log('Health alert email sent successfully.');
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
      this.logger.log('Running scheduled health check...');
      await this.runFullHealthCheck();
    }, 5 * 60 * 1000);
  }
}
