import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResponseUtil } from '../utils/response.util';

@Controller('api/accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccountsData(@Req() req: any) {
    const data = await this.accountsService.getAccountsData(req.user.workspaceId);
    return ResponseUtil.success(data, 'Accounts data retrieved successfully');
  }

  @Post('fixed-deposit')
  async createFixedDeposit(@Req() req: any, @Body() body: any) {
    const data = await this.accountsService.createFixedDeposit(req.user.workspaceId, body);
    return ResponseUtil.success(data, 'Fixed deposit created successfully');
  }

  @Post('corporate-loan')
  async createCorporateLoan(@Req() req: any, @Body() body: any) {
    const data = await this.accountsService.createCorporateLoan(req.user.workspaceId, body);
    return ResponseUtil.success(data, 'Corporate loan created successfully');
  }

  @Post('repay-loan')
  async repayLoan(@Req() req: any, @Body() body: { loanId: string; amount: number }) {
    const data = await this.accountsService.repayLoan(req.user.workspaceId, body.loanId, body.amount);
    return ResponseUtil.success(data, 'Loan repaid successfully');
  }

  @Post('pay-purchase-order')
  async payPurchaseOrder(@Req() req: any, @Body() body: { poId: string }) {
    const data = await this.accountsService.payPurchaseOrder(req.user.workspaceId, body.poId);
    return ResponseUtil.success(data, 'Purchase order paid successfully');
  }
}
