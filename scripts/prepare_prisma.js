const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const schemaPrisma = path.join(rootDir, 'prisma', 'schema.prisma');
const schemaLocal = path.join(rootDir, 'prisma', 'schema.local.prisma');
const schemaNeon = path.join(rootDir, 'prisma', 'schema.neon.prisma');

const dbUrl = process.env.DATABASE_URL || '';
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://') || isVercel;

if (isPostgres) {
  if (fs.existsSync(schemaNeon)) {
    fs.copyFileSync(schemaNeon, schemaPrisma);
    console.log('[prepare_prisma] Detected Vercel/PostgreSQL environment -> Using prisma/schema.neon.prisma');
  }
} else if (dbUrl.startsWith('file:') || (!dbUrl && !isVercel)) {
  if (fs.existsSync(schemaLocal)) {
    fs.copyFileSync(schemaLocal, schemaPrisma);
    console.log('[prepare_prisma] Detected Local SQLite environment -> Using prisma/schema.local.prisma');
  }
}

