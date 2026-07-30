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

  async sendHealthAlertEmail(report: any) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not found. Cannot send health alert email.');
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: 'khade8915@gmail.com',
          subject: 'Backend Health Alert',
          html: `<p>Health check issues detected:</p><pre>${JSON.stringify(report, null, 2)}</pre>`,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Failed to send health email: ${await response.text()}`);
      } else {
        this.logger.log('Health alert email sent successfully.');
      }
    } catch (err: any) {
      this.logger.error(`Error sending health alert email: ${err.message}`);
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
