import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { MongoClient } from 'mongodb';

@Injectable()
export class MongodbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongodbService.name);
  private client: MongoClient | null = null;
  public isConnected = false;

  public getUri(): string {
    return process.env.MONGODB_URI || "";
  }

  async onModuleInit() {
    const uri = this.getUri();

    try {
      this.client = new MongoClient(uri, {
        connectTimeoutMS: 6000,
        socketTimeoutMS: 10000,
      });
      await this.client.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to MongoDB Atlas Database.');
    } catch (error: any) {
      this.logger.error('Failed to connect to MongoDB Atlas Database, fallback to mock mode:', error.message);
      this.client = null;
      this.isConnected = false;
    }
  }

  async checkHealth(): Promise<{ ok: boolean; latencyMs: number; collections: string[]; collectionCounts: Record<string, number>; error?: string }> {
    const start = Date.now();
    try {
      if (!this.client || !this.isConnected) {
        await this.onModuleInit();
      }
      if (this.client && this.isConnected) {
        const db = this.client.db('bizora');
        await db.command({ ping: 1 });
        const cols = await db.listCollections().toArray();
        const collectionNames = cols.map(c => c.name);
        const collectionCounts: Record<string, number> = {};
        
        // Count key collections
        const keyCols = ['products', 'transactions', 'customers', 'suppliers', 'expenses', 'auditlogs', 'users', 'ai_logs', 'whatsapp_logs'];
        for (const colName of keyCols) {
          try {
            collectionCounts[colName] = await db.collection(colName).countDocuments();
          } catch (_) {
            collectionCounts[colName] = 0;
          }
        }

        return {
          ok: true,
          latencyMs: Date.now() - start,
          collections: collectionNames,
          collectionCounts,
        };
      }
      return { ok: false, latencyMs: Date.now() - start, collections: [], collectionCounts: {}, error: 'MongoDB client not connected' };
    } catch (e: any) {
      return { ok: false, latencyMs: Date.now() - start, collections: [], collectionCounts: {}, error: e.message };
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.close();
    }
  }

  async logAiInteraction(data: {
    workspaceId: string;
    userId: string;
    query: string;
    intent: string;
    response: any;
  }) {
    const interaction = { ...data, timestamp: new Date() };
    if (this.client && this.isConnected) {
      try {
        const db = this.client.db('bizora');
        await db.collection('ai_logs').insertOne(interaction);
      } catch (e) {
        this.logger.error('Failed to log AI interaction to MongoDB:', e);
      }
    } else {
      this.logger.log(`[Mock MongoDB AI Log] ${JSON.stringify(interaction)}`);
    }
  }

  async logWhatsAppAudit(data: {
    workspaceId: string;
    phoneNumber: string;
    direction: 'incoming' | 'outgoing';
    messageText: string;
    status: string;
  }) {
    const logEntry = { ...data, timestamp: new Date() };
    if (this.client && this.isConnected) {
      try {
        const db = this.client.db('bizora');
        await db.collection('whatsapp_logs').insertOne(logEntry);
      } catch (e) {
        this.logger.error('Failed to log WhatsApp audit to MongoDB:', e);
      }
    } else {
      this.logger.log(`[Mock MongoDB WhatsApp Log] ${JSON.stringify(logEntry)}`);
    }
  }
}
