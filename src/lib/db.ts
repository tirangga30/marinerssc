import { PrismaClient } from '@prisma/client';
import path from 'path';

// Fix SQLite file path for both Windows and Vercel serverless environments
const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db');
const fileUrl = `file:${sqlitePath}`;

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:') || process.env.DATABASE_URL.startsWith('postgresql:')) {
  process.env.DATABASE_URL = fileUrl;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: fileUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
