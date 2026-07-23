import { Controller, Get, Post, Put, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from '../services/settings.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('api/settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get()
  async getSettings(@Req() req: any) {
    const data = await this.service.getSettings(req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }

  @Put()
  async updateSettings(@Body() body: any, @Req() req: any) {
    const data = await this.service.updateSettings(body, req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }

  @Post('setup')
  async setup(@Body() body: any, @Req() req: any) {
    const data = await this.service.setup(body, req.user.companyId || req.user.workspaceId);
    return { success: true, data };
  }
}
