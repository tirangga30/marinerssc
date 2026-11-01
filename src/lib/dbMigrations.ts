import { prisma } from './db';

let migrationRan = false;

export async function ensureDbColumns() {
  if (migrationRan) return;

  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://') || Boolean(process.env.VERCEL);

  if (isPostgres) {
    const pgMigrations = [
      `CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "teamName" TEXT DEFAULT 'TEAM',
        "teamLogo" TEXT DEFAULT '/defaultteam.webp',
        "clubType" TEXT DEFAULT 'SOCCER CLUB',
        "playerDefaultPhoto" TEXT DEFAULT '/playertemplate.webp',
        "loginWallpaper" TEXT DEFAULT '/NYCOMP.webp',
        "adminWallpaper" TEXT DEFAULT '/stadium_hero2.png',
        "posterInterval" INTEGER DEFAULT 5,
        "securityPin" TEXT DEFAULT '1234',
        "isCommunityEnabled" BOOLEAN DEFAULT true,
        "playerCardBg" TEXT DEFAULT '/bgprofil2.jpeg',
        "showHeroOverlay" BOOLEAN DEFAULT false,
        "heroTagline" TEXT DEFAULT 'SOCCER CLUB',
        "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.',
        "heroCtaText" TEXT DEFAULT 'LIHAT TIM',
        "whatsappMode" TEXT DEFAULT 'disabled',
        "whatsappToken" TEXT,
        "whatsappConnectedPhone" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `INSERT INTO "SystemSetting" ("id", "teamName", "securityPin") VALUES ('default', 'TEAM', '1234') ON CONFLICT ("id") DO NOTHING`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappMode" TEXT DEFAULT 'disabled'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappConnectedPhone" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappToken" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "adminWallpaper" TEXT DEFAULT '/stadium.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "playerCardBg" TEXT DEFAULT '/bgprofil2.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "showHeroOverlay" BOOLEAN DEFAULT false`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroTagline" TEXT DEFAULT 'SOCCER CLUB'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroCtaText" TEXT DEFAULT 'LIHAT TIM'`,
      `ALTER TABLE "FootballMatch" ADD COLUMN IF NOT EXISTS "sendWhatsAppInvite" BOOLEAN DEFAULT true`,
    ];

    for (const sql of pgMigrations) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (e) {
        console.warn(`[dbMigration PG warning] ${sql}:`, e);
      }
    }
  } else {
    // SQLite: ADD COLUMN without IF NOT EXISTS (ignore error if column already exists)
    const sqliteMigrations = [
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappMode" TEXT DEFAULT 'disabled'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappConnectedPhone" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappToken" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "adminWallpaper" TEXT DEFAULT '/stadium.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "playerCardBg" TEXT DEFAULT '/bgprofil2.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "showHeroOverlay" BOOLEAN DEFAULT 0`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroTagline" TEXT DEFAULT 'SOCCER CLUB'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroCtaText" TEXT DEFAULT 'LIHAT TIM'`,
      `ALTER TABLE "FootballMatch" ADD COLUMN "sendWhatsAppInvite" BOOLEAN DEFAULT 1`,
    ];

    for (const sql of sqliteMigrations) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Expected when column already exists in SQLite
      }
    }
  }

  migrationRan = true;
}
