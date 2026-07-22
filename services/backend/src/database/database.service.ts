import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { prisma, checkDbConnection, PrismaClient } from 'bizora-database';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public client: PrismaClient = prisma;
  public isConnected = false;

  async onModuleInit() {
    this.isConnected = await checkDbConnection();
    if (this.isConnected) {
      this.logger.log('Successfully connected to Supabase PostgreSQL Database.');
      await this.client.$connect();
    } else {
      this.logger.warn(
        'Supabase PostgreSQL Database is not configured or offline. Running in offline/mock fallback mode.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.client.$disconnect();
    }
  }
}
