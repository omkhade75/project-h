import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { LedgerService } from '../services/ledger.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseUtil } from '../utils/response.util';

@Controller('api/ledger')
@UseGuards(JwtAuthGuard)
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('balances')
  async getBalances(@Req() req: any) {
    const data = await this.ledgerService.getLedgerBalances(req.user.workspaceId);
    return ResponseUtil.success(data, 'Ledger balances retrieved successfully');
  }

  @Post('revenue')
  async recordRevenue(@Req() req: any, @Body() body: any) {
    await this.ledgerService.recordIncomingRevenue(req.user.workspaceId, body);
    return ResponseUtil.success(null, 'Incoming revenue recorded successfully');
  }

  @Get('incoming-payments')
  async getIncomingPayments(@Req() req: any) {
    const data = await this.ledgerService.getIncomingPayments(req.user.workspaceId);
    return ResponseUtil.success(data, 'Incoming payments retrieved successfully');
  }

  @Post('tax-payment')
  async recordTaxPayment(@Req() req: any, @Body() body: any) {
    await this.ledgerService.recordTaxPayment(req.user.workspaceId, body);
    return ResponseUtil.success(null, 'Tax payment recorded successfully');
  }

  @Get('tax-payments')
  async getTaxPayments(@Req() req: any) {
    const data = await this.ledgerService.getTaxPayments(req.user.workspaceId);
    return ResponseUtil.success(data, 'Tax payments retrieved successfully');
  }
}
