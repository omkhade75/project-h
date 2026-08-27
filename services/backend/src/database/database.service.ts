import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from 'bizora-database';

const DEFAULT_DATABASE_URL = "postgresql://postgres.eisqbwanrguvoxguqpjz:iq0L2FsHuqg7fd5e@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  public client: PrismaClient = this;
  public isConnected = false;
  private connectingPromise: Promise<void> | null = null;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
        },
      },
    });
  }

  async ensureConnected(): Promise<void> {
    if (this.connectingPromise) {
      return this.connectingPromise;
    }
    this.connectingPromise = (async () => {
      try {
        await this.$connect();
        this.isConnected = true;
      } catch (err: any) {
        this.isConnected = false;
        throw err;
      } finally {
        this.connectingPromise = null;
      }
    })();
    return this.connectingPromise;
  }

  async onModuleInit() {
    try {
      await this.ensureConnected();
      await this.$queryRaw`SELECT 1`;
      this.isConnected = true;
      this.logger.log('Successfully connected to Supabase PostgreSQL Database.');
    } catch (err: any) {
      this.isConnected = false;
      this.logger.warn(
        `PostgreSQL connection init notice: ${err.message}. Auto-remediation enabled.`
      );
    }

    // Start 2-minute keep-alive to keep connection pool warm 24/7
    this.startKeepAlive();
  }

  private startKeepAlive() {
    if (this.keepAliveInterval) return;
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
        this.isConnected = true;
      } catch (err: any) {
        this.logger.warn(`Keep-alive ping auto-reconnecting: ${err.message}`);
        await this.ensureConnected().catch(() => {});
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  async checkHealth(): Promise<{ ok: boolean; latencyMs: number; entityCounts: Record<string, number>; error?: string }> {
    const start = Date.now();
    try {
      // Step 1: Probe query with automatic reconnect & retry if connection dropped
      try {
        await this.$queryRaw`SELECT 1`;
        this.isConnected = true;
      } catch (probeErr: any) {
        this.logger.warn(`Initial PostgreSQL probe notice: ${probeErr.message}. Auto-reconnecting engine...`);
        await this.ensureConnected();
        // Retry probe after clean reconnect
        await this.$queryRaw`SELECT 1`;
        this.isConnected = true;
      }

      // Step 2: Fetch schema entity counts safely
      const entityCounts: Record<string, number> = {};
      try { entityCounts.workspaces = await this.workspace.count().catch(() => 0); } catch (_) {}
      try { entityCounts.users = await this.user.count().catch(() => 0); } catch (_) {}
      try { entityCounts.pendingRegistrations = await this.pendingRegistration.count().catch(() => 0); } catch (_) {}
      try { entityCounts.products = await this.product.count().catch(() => 0); } catch (_) {}
      try { entityCounts.transactions = await this.transaction.count().catch(() => 0); } catch (_) {}
      try { entityCounts.customers = await this.customer.count().catch(() => 0); } catch (_) {}
      try { entityCounts.suppliers = await this.supplier.count().catch(() => 0); } catch (_) {}
      try { entityCounts.inventoryStocks = await this.inventoryStock.count().catch(() => 0); } catch (_) {}
      try { entityCounts.expenses = await this.expense.count().catch(() => 0); } catch (_) {}
      try { entityCounts.purchaseOrders = await this.purchaseOrder.count().catch(() => 0); } catch (_) {}

      return {
        ok: true,
        latencyMs: Date.now() - start,
        entityCounts,
      };
    } catch (err: any) {
      this.isConnected = false;
      return {
        ok: false,
        latencyMs: Date.now() - start,
        entityCounts: {},
        error: err.message,
      };
    }
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.isConnected) {
      await this.$disconnect().catch(() => {});
    }
  }
}


