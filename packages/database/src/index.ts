import { PrismaClient } from "@prisma/client";

const DEFAULT_DATABASE_URL = "postgresql://postgres.eisqbwanrguvoxguqpjz:iq0L2FsHuqg7fd5e@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DEFAULT_DATABASE_URL;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
    },
  },
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (e) {
    console.warn("Database connection failed:", e);
    return false;
  }
}

export * from "@prisma/client";

