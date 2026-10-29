import { Controller, Post, Get, Body, Req, Query } from '@nestjs/common';
import { AiService } from '../services/ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  async askAi(@Req() req, @Body() body: any) {
    const user = req.user;
    const query = typeof body === 'string' ? body : (body?.query || '');
    return await this.aiService.askAi(user?.workspaceId || 'grandsquare-mall', query, body);
  }

  @Get('model-status')
  async getModelStatus() {
    return await this.aiService.getModelStatus();
  }

  @Post('model-config')
  async updateModelConfig(@Body() body: any) {
    return await this.aiService.updateModelConfig(body?.data || body);
  }

  @Get('training-dataset')
  async getTrainingDataset(@Query('limit') limit?: string) {
    const lim = limit ? parseInt(limit, 10) : 100;
    return await this.aiService.getTrainingDataset(lim);
  }
}
