import { Controller, Get, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from '../services/transactions.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseUtil } from '../utils/response.util';

/**
 * TRANSACTIONS CONTROLLER
 * -------------------------------------------------------------
 * Role: HTTP Entrypoint for POS Billing & Financial Transactions.
 * Design Pattern: Controller-Service-Repository
 * Security: Protected by JwtAuthGuard (requires valid Bearer token).
 * Multi-Tenancy: Automatically extracts workspaceId, user role, and email from req.user.
 */
@Controller('api/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getTransactions(@Req() req: any) {
    const data = await this.transactionsService.getTransactions(req.user.workspaceId, req.user.role, req.user.email);
    return ResponseUtil.success(data, 'Transactions retrieved successfully');
  }

  @Post()
  async createTransaction(@Req() req: any, @Body() body: any) {
    const data = await this.transactionsService.createTransaction(
      req.user.workspaceId,
      req.user.email,
      req.user.role,
      body
    );
    return ResponseUtil.success(data, 'Transaction created successfully');
  }

  @Delete()
  async clearTransactions(@Req() req: any) {
    const data = await this.transactionsService.clearTransactions(req.user.workspaceId);
    return ResponseUtil.success(data, 'All transactions cleared successfully');
  }
}
