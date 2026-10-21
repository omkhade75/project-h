import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { CommsService } from '../services/comms.service';

@Controller('api/comms')
export class CommsController {
  constructor(private readonly commsService: CommsService) {}

  @Get('whatsapp/config')
  async getWhatsAppConfig() {
    return await this.commsService.getWhatsAppConfig();
  }

  @Post('whatsapp/config')
  async updateWhatsAppConfig(@Body() body: any) {
    return await this.commsService.updateWhatsAppConfig(body);
  }

  @Post('whatsapp/send')
  async sendWhatsAppMessage(@Req() req, @Body() body: any) {
    const user = req.user;
    return await this.commsService.sendWhatsAppMessage({
      ...body,
      workspaceId: user?.workspaceId || 'grandsquare-mall',
    });
  }

  @Post('whatsapp/broadcast')
  async sendWhatsAppBroadcast(@Req() req, @Body() body: any) {
    const user = req.user;
    return await this.commsService.sendWhatsAppBroadcast(user?.workspaceId || 'grandsquare-mall', body);
  }

  @Get('vapi/config')
  async getVapiConfig() {
    return await this.commsService.getVapiConfig();
  }

  @Post('vapi/config')
  async updateVapiConfig(@Body() body: any) {
    return await this.commsService.updateVapiConfig(body);
  }

  @Post('vapi/call')
  async initiateVapiCall(@Req() req, @Body() body: any) {
    const user = req.user;
    return await this.commsService.initiateVapiCall(user?.workspaceId || 'grandsquare-mall', body);
  }

  @Get('vapi/webhook')
  async getVapiWebhook() {
    return { status: 'active', channel: 'Vapi Webhook Adapter', service: 'Bizora AI Voice' };
  }

  @Post('vapi/webhook')
  async handleVapiWebhook(@Body() body: any) {
    return await this.commsService.handleVapiWebhook(body);
  }

  @Get('logs')
  async getMessageLogs(@Req() req) {
    const user = req.user;
    return await this.commsService.getMessageLogs(user?.workspaceId || 'grandsquare-mall');
  }
}
