import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { prisma, checkDbConnection, PrismaClient } from 'bizora-database';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public client: PrismaClient = this;
  public isConnected = false;

  async onModuleInit() {
    this.isConnected = await checkDbConnection();
    if (this.isConnected) {
      this.logger.log('Successfully connected to Supabase PostgreSQL Database.');
      await this.$connect();
    } else {
      this.logger.warn(
        'Supabase PostgreSQL Database is not configured or offline. Running in offline/mock fallback mode.',
      );
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
