import mongoose from 'mongoose';

export class DatabaseConfig {
  private static isConnected = false;

  public static getUri(): string {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('placeholder') || uri.includes('YOUR-')) {
      console.error('[MongoDB Atlas] MONGODB_URI environment variable is not set. Set it in your Render/hosting dashboard.');
      // Graceful fallback: return empty string, connect() will handle the error
      return '';
    }
    return uri;
  }

  public static async connect(): Promise<typeof mongoose | null> {
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return mongoose;
    }

    const uri = this.getUri();

    try {
      mongoose.set('strictQuery', true);
      const db = await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 6000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      console.log('[MongoDB Atlas] Mongoose connection established successfully.');

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB Atlas] Connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB Atlas] Disconnected from database server.');
        this.isConnected = false;
      });

      return db;
    } catch (error) {
      console.error('[MongoDB Atlas] Failed to connect:', error);
      this.isConnected = false;
      return null;
    }
  }

  public static async ping(): Promise<{ ok: boolean; latencyMs: number; readyState: number; error?: string }> {
    const start = Date.now();
    try {
      if (!this.isConnected || mongoose.connection.readyState !== 1) {
        await this.connect();
      }
      if (mongoose.connection.readyState === 1) {
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
        }
        return { ok: true, latencyMs: Date.now() - start, readyState: mongoose.connection.readyState };
      }
      return { ok: false, latencyMs: Date.now() - start, readyState: mongoose.connection.readyState, error: 'Mongoose readyState not connected' };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, readyState: mongoose.connection.readyState, error: err.message };
    }
  }

  public static getStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

