import { Controller, Get, Post, Body } from '@nestjs/common';
import { HealthService } from '../services/health.service';

@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    const report = await this.healthService.runFullHealthCheck();
    return {
      success: report.dbStatus === 'up',
      data: report
    };
  }

  @Post('auto-heal')
  async triggerAutoHeal() {
    return await this.healthService.executeAutoHealing();
  }

  @Get('self-healing-log')
  async getSelfHealingLog() {
    return this.healthService.getSelfHealingJournal();
  }

  @Post('report-error')
  async reportFrontendError(@Body() body: any) {
    const errorData = body?.data ? body.data : body;
    const record = this.healthService.recordFrontendError(errorData);
    return {
      success: true,
      data: record,
    };
  }

  @Get('frontend-errors')
  async getFrontendErrors() {
    const errors = this.healthService.getRecentFrontendErrors();
    return {
      success: true,
      count: errors.length,
      data: errors,
    };
  }

  @Post('clear-frontend-errors')
  async clearFrontendErrors() {
    this.healthService.clearRecentFrontendErrors();
    return {
      success: true,
      message: 'Frontend errors cleared',
    };
  }

  @Post('test-email')
  async triggerTestEmail() {
    const report = await this.healthService.runFullHealthCheck();
    const emailResult = await this.healthService.sendHealthAlertEmail(report, true);
    return {
      success: emailResult.sent,
      emailResult,
      data: report
    };
  }
}
