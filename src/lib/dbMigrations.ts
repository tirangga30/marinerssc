import { prisma } from './db';

let migrationRan = false;

export async function ensureDbColumns() {
  if (migrationRan) return;
  try {
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SystemSetting' AND column_name = 'whatsappMode') THEN
          ALTER TABLE "SystemSetting" ADD COLUMN "whatsappMode" TEXT DEFAULT 'disabled';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SystemSetting' AND column_name = 'whatsappConnectedPhone') THEN
          ALTER TABLE "SystemSetting" ADD COLUMN "whatsappConnectedPhone" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SystemSetting' AND column_name = 'whatsappToken') THEN
          ALTER TABLE "SystemSetting" ADD COLUMN "whatsappToken" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'FootballMatch' AND column_name = 'sendWhatsAppInvite') THEN
          ALTER TABLE "FootballMatch" ADD COLUMN "sendWhatsAppInvite" BOOLEAN DEFAULT true;
        END IF;
      END $$;
    `);
    migrationRan = true;
  } catch (pgErr) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "SystemSetting" ADD COLUMN "whatsappMode" TEXT DEFAULT 'disabled'`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "SystemSetting" ADD COLUMN "whatsappConnectedPhone" TEXT`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "SystemSetting" ADD COLUMN "whatsappToken" TEXT`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "FootballMatch" ADD COLUMN "sendWhatsAppInvite" BOOLEAN DEFAULT 1`);
    } catch {}
    migrationRan = true;
  }
}
