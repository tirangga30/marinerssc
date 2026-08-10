import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:.')) {
    return process.env.DATABASE_URL;
  }

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const srcDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(srcDbPath)) {
        try {
          fs.copyFileSync(srcDbPath, tmpDbPath);
        } catch (e) {
          console.error('Failed to copy dev.db to /tmp:', e);
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
