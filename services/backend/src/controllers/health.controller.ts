import { Controller, Get } from '@nestjs/common';
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
}
