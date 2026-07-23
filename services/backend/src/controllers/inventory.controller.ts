import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('stock')
  async getStock(@Req() req: any) {
    const data = await this.service.getStock(req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }

  @Get('movements')
  async getMovements(@Req() req: any) {
    const data = await this.service.getMovements(req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }

  @Post('mutate')
  async mutate(@Body() body: any, @Req() req: any) {
    const data = await this.service.mutate({ ...body, performedBy: req.user.userId }, req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }

  @Get('expiry')
  async getExpiry(@Req() req: any) {
    const data = await this.service.getExpiry(req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }
}
