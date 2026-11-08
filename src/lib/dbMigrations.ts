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
        "loginWallpaper" TEXT DEFAULT '/mainbackground.webp',
        "adminWallpaper" TEXT DEFAULT '/stadium_hero2.webp',
        "posterInterval" INTEGER DEFAULT 5,
        "securityPin" TEXT DEFAULT '1234',
        "isCommunityEnabled" BOOLEAN DEFAULT true,
        "playerCardBg" TEXT DEFAULT '/bgprofil2.webp',
        "showHeroOverlay" BOOLEAN DEFAULT false,
        "heroTagline" TEXT DEFAULT 'SOCCER CLUB',
        "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.',
        "heroCtaText" TEXT DEFAULT 'LIHAT TIM',
        "whatsappMode" TEXT DEFAULT 'disabled',
        "whatsappToken" TEXT,
        "whatsappConnectedPhone" TEXT,
        "whatsappBirthdayEnabled" BOOLEAN DEFAULT true,
        "whatsappBirthdayGroupId" TEXT,
        "whatsappBirthdayGroupName" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `INSERT INTO "SystemSetting" ("id", "teamName", "securityPin") VALUES ('default', 'TEAM', '1234') ON CONFLICT ("id") DO NOTHING`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappMode" TEXT DEFAULT 'disabled'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappConnectedPhone" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappToken" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappBirthdayEnabled" BOOLEAN DEFAULT true`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappBirthdayGroupId" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "whatsappBirthdayGroupName" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "adminWallpaper" TEXT DEFAULT '/stadium.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "playerCardBg" TEXT DEFAULT '/bgprofil2.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "showHeroOverlay" BOOLEAN DEFAULT false`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroTagline" TEXT DEFAULT 'SOCCER CLUB'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "heroCtaText" TEXT DEFAULT 'LIHAT TIM'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "clubBio" TEXT DEFAULT 'Klub Sepak Bola Profesional. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.'`,
      `ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "joinDate" TIMESTAMP(3)`,
      `ALTER TABLE "FootballMatch" ADD COLUMN IF NOT EXISTS "sendWhatsAppInvite" BOOLEAN DEFAULT true`,
      `ALTER TABLE "FootballMatch" ADD COLUMN IF NOT EXISTS "inviteNotes" TEXT`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3)`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN IF NOT EXISTS "isLateDecline" BOOLEAN DEFAULT false`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3)`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN IF NOT EXISTS "isManualConfirm" BOOLEAN DEFAULT false`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 1' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate"::text LIKE '2025-06-29%' OR ("matchDate" >= '2025-06-28' AND "matchDate" <= '2025-06-30'))`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 2' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate"::text LIKE '2025-09-05%' OR ("matchDate" >= '2025-09-04' AND "matchDate" <= '2025-09-06'))`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 3' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate"::text LIKE '2025-10-11%' OR ("matchDate" >= '2025-10-10' AND "matchDate" <= '2025-10-12'))`,
      `DELETE FROM "MatchAttendance" WHERE LOWER("playerName") LIKE '%nathan%'`,
      `DELETE FROM "MatchAttendance" WHERE "playerId" = 'unknown-player' OR LOWER("playerName") LIKE '%tidak diketahui%'`,
      `DELETE FROM "_PlayerToSeason" WHERE "A" = 'unknown-player' OR "B" = 'unknown-player'`,
      `UPDATE "Player" SET "status" = 'Inactive', "hidePhoto" = true WHERE "id" = 'unknown-player' OR "slug" = 'tidak-diketahui'`,
      `UPDATE "MatchAttendance" SET "declineReason" = 'Tidak terdaftar' WHERE LOWER("declineReason") = 'tidak masuk skuad'`,
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
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappBirthdayEnabled" BOOLEAN DEFAULT 1`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappBirthdayGroupId" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "whatsappBirthdayGroupName" TEXT`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "adminWallpaper" TEXT DEFAULT '/stadium.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "playerCardBg" TEXT DEFAULT '/bgprofil2.webp'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "showHeroOverlay" BOOLEAN DEFAULT 0`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroTagline" TEXT DEFAULT 'SOCCER CLUB'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroSubtitle" TEXT DEFAULT 'Lebih dari sekadar sepak bola.'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "heroCtaText" TEXT DEFAULT 'LIHAT TIM'`,
      `ALTER TABLE "SystemSetting" ADD COLUMN "clubBio" TEXT DEFAULT 'Klub Sepak Bola Profesional. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.'`,
      `ALTER TABLE "Player" ADD COLUMN "joinDate" DATETIME`,
      `ALTER TABLE "FootballMatch" ADD COLUMN "sendWhatsAppInvite" BOOLEAN DEFAULT 1`,
      `ALTER TABLE "FootballMatch" ADD COLUMN "inviteNotes" TEXT`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN "invitedAt" DATETIME`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN "isLateDecline" BOOLEAN DEFAULT 0`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN "declinedAt" DATETIME`,
      `ALTER TABLE "MatchAttendance" ADD COLUMN "isManualConfirm" BOOLEAN DEFAULT 0`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 1' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate" LIKE '2025-06-29%' OR ("matchDate" >= '2025-06-28' AND "matchDate" <= '2025-06-30'))`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 2' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate" LIKE '2025-09-05%' OR ("matchDate" >= '2025-09-04' AND "matchDate" <= '2025-09-06'))`,
      `UPDATE "FootballMatch" SET "stage" = 'Matchday 3' WHERE LOWER("opponentName") LIKE '%manonjaya%' AND ("matchDate" LIKE '2025-10-11%' OR ("matchDate" >= '2025-10-10' AND "matchDate" <= '2025-10-12'))`,
      `DELETE FROM "MatchAttendance" WHERE LOWER("playerName") LIKE '%nathan%'`,
      `DELETE FROM "MatchAttendance" WHERE "playerId" = 'unknown-player' OR LOWER("playerName") LIKE '%tidak diketahui%'`,
      `DELETE FROM "_PlayerToSeason" WHERE "A" = 'unknown-player' OR "B" = 'unknown-player'`,
      `UPDATE "Player" SET "status" = 'Inactive', "hidePhoto" = true WHERE "id" = 'unknown-player' OR "slug" = 'tidak-diketahui'`,
      `UPDATE "MatchAttendance" SET "declineReason" = 'Tidak terdaftar' WHERE LOWER("declineReason") = 'tidak masuk skuad'`,
    ];

    for (const sql of sqliteMigrations) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch {
        // Expected when column already exists in SQLite
      }
    }
  }

  // Update existing declineReason from "Tidak masuk skuad" to "Tidak terdaftar"
  try {
    await prisma.matchAttendance.updateMany({
      where: {
        declineReason: {
          in: ['Tidak masuk skuad', 'tidak masuk skuad', 'Tidak Masuk Skuad'],
        },
      },
      data: {
        declineReason: 'Tidak terdaftar',
      },
    });
  } catch {
    // ignore
  }

  // General 2025 matchday alignment (starts from Matchday 1 for earliest match Date at bottom)
  try {
    const matches2025 = await prisma.footballMatch.findMany({
      where: {
        OR: [
          { seasonName: '2025' },
          { matchDate: { gte: new Date('2025-01-01T00:00:00.000Z'), lt: new Date('2026-01-01T00:00:00.000Z') } },
        ],
      },
      orderBy: { matchDate: 'asc' },
    });

    if (matches2025.length > 0) {
      for (let i = 0; i < matches2025.length; i++) {
        const m = matches2025[i];
        const targetStage = `Matchday ${i + 1}`;
        if (m.stage !== targetStage) {
          await prisma.footballMatch.update({
            where: { id: m.id },
            data: { stage: targetStage },
          });
        }
      }
    }
  } catch (err2025) {
    console.warn('[dbMigration 2025 stage update warning]:', err2025);
  }

  // Ensure Matchday 1 2027 vs Cikuya attendance records for Adly, Agung, Ariel (-3) and Ikam (-4)
  try {
    const allMatches = await prisma.footballMatch.findMany({
      include: { attendances: true },
    });

    const cikuyaMatch = allMatches.find((m) => {
      const opp = (m.opponentName || '').toLowerCase();
      const stg = (m.stage || '').toLowerCase();
      const yr = m.seasonName?.match(/\d{4}/)?.[0] || (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
      return opp.includes('cikuya') || (stg.includes('matchday 1') && yr === '2027');
    });

    if (cikuyaMatch) {
      const allPlayers = await prisma.player.findMany();
      const adjustments = [
        { key: 'adly', status: 'INVITED' },
        { key: 'agung', status: 'INVITED' },
        { key: 'ariel', status: 'INVITED' },
        { key: 'ikam', status: 'CONFIRMED' },
      ];

      for (const adj of adjustments) {
        const player = allPlayers.find(
          (p) =>
            p.name.toLowerCase().includes(adj.key) ||
            p.slug.toLowerCase().includes(adj.key)
        );

        if (player) {
          const existing = (cikuyaMatch.attendances || []).find(
            (a) => a.playerId === player.id
          );
          const attDate = cikuyaMatch.matchDate || new Date();

          if (existing) {
            if (existing.status !== adj.status) {
              await prisma.matchAttendance.update({
                where: { id: existing.id },
                data: {
                  status: adj.status,
                  invitedAt: existing.invitedAt || attDate,
                },
              });
            }
          } else {
            await prisma.matchAttendance.create({
              data: {
                matchId: cikuyaMatch.id,
                playerId: player.id,
                playerName: player.name,
                playerType: player.isGuest ? 'LOAN' : 'SQUAD',
                status: adj.status,
                invitedAt: attDate,
              },
            });
          }
        }
      }
    }
  } catch (errCikuya) {
    console.warn('[dbMigration Cikuya sync warning]:', errCikuya);
  }

  // Ensure Endra and Rifki have 0 EXP (no penalties)
  try {
    const allPlayers = await prisma.player.findMany();
    const exemptPlayers = allPlayers.filter((p) => {
      const l = ((p.name || '') + ' ' + (p.slug || '')).toLowerCase();
      return l.includes('endra') || l.includes('rifki');
    });

    for (const ep of exemptPlayers) {
      await prisma.matchAttendance.updateMany({
        where: { playerId: ep.id },
        data: {
          status: 'DECLINED',
          declineReason: 'Exempt (Diatur Admin)',
        },
      });
    }
  } catch (errExempt) {
    console.warn('[dbMigration Endra/Rifki exempt warning]:', errExempt);
  }

  migrationRan = true;
}
