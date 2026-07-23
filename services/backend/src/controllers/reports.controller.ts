import { Controller, Get, Post, Req } from '@nestjs/common';
import { ReportsService } from '../services/reports.service';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('payments')
  async getPaymentReports(@Req() req) {
    const user = req.user;
    return await this.reportsService.getPaymentReports(user?.workspaceId || 'grandsquare-mall');
  }

  @Post('whatsapp')
  async sendAllReportsWhatsApp(@Req() req) {
    const user = req.user;
    return await this.reportsService.sendAllReportsWhatsApp(user?.workspaceId || 'grandsquare-mall');
  }
}
