import { NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

export async function GET() {
  const candidateUrls = [
    process.env.DATABASE_URL,
    'postgresql://postgres:Crimesney71011@db.dokkypjturwhppjgrptu.supabase.co:5432/postgres',
    'postgresql://postgres.dokkypjturwhppjgrptu:Crimesney71011@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.dokkypjturwhppjgrptu:Crimesney71011@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres',
  ].filter(Boolean) as string[];

  let client: Client | null = null;
  let connectedUrl = '';
  let lastError: any = null;

  for (const url of candidateUrls) {
    try {
      const c = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      await c.connect();
      client = c;
      connectedUrl = url;
      break;
    } catch (err: any) {
      lastError = err;
      console.error(`Failed connecting to ${url}:`, err?.message);
    }
  }

  if (!client) {
    return NextResponse.json(
      { error: `Koneksi Supabase gagal. Error: ${lastError?.message || 'Unknown'}` },
      { status: 500 }
    );
  }

  try {
    // 1. Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "isAdmin" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Player" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "number" INTEGER UNIQUE NOT NULL,
        "position" TEXT NOT NULL,
        "birthDate" TIMESTAMP(3),
        "nationality" TEXT DEFAULT 'Indonesia',
        "heightCm" INTEGER,
        "weightKg" INTEGER,
        "photoUrl" TEXT NOT NULL,
        "bio" TEXT NOT NULL,
        "isCaptain" BOOLEAN DEFAULT false,
        "status" TEXT DEFAULT 'Active',
        "goals" INTEGER DEFAULT 0,
        "assists" INTEGER DEFAULT 0,
        "appearances" INTEGER DEFAULT 0,
        "yellowCards" INTEGER DEFAULT 0,
        "redCards" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "FootballMatch" (
        "id" TEXT PRIMARY KEY,
        "opponentName" TEXT NOT NULL,
        "opponentLogo" TEXT NOT NULL,
        "matchDate" TIMESTAMP(3) NOT NULL,
        "competition" TEXT DEFAULT 'Matchday 1',
        "venue" TEXT DEFAULT 'Stadion Gelora Samudra, Jakarta',
        "isHome" BOOLEAN DEFAULT true,
        "status" TEXT DEFAULT 'scheduled',
        "homeScore" INTEGER,
        "awayScore" INTEGER,
        "formation" TEXT DEFAULT '4-3-3',
        "summary" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "MatchLineup" (
        "id" TEXT PRIMARY KEY,
        "matchId" TEXT NOT NULL,
        "playerId" TEXT NOT NULL,
        "isStarter" BOOLEAN DEFAULT true,
        "pitchPosition" TEXT NOT NULL,
        "positionName" TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "MatchEvent" (
        "id" TEXT PRIMARY KEY,
        "matchId" TEXT NOT NULL,
        "playerId" TEXT NOT NULL,
        "assistPlayerId" TEXT,
        "type" TEXT NOT NULL,
        "minute" INTEGER NOT NULL,
        "description" TEXT
      );

      CREATE TABLE IF NOT EXISTS "Article" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "category" TEXT DEFAULT 'Kabar Tim',
        "thumbnail" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "publishedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Competition" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "slug" TEXT UNIQUE NOT NULL,
        "season" TEXT DEFAULT '2026/2027',
        "type" TEXT DEFAULT 'Liga',
        "isPrimary" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Insert Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO "User" ("id", "name", "email", "password", "isAdmin", "createdAt", "updatedAt")
      VALUES ('admin-id-1', 'Mariners FC Admin', 'admin@marinersfc.com', '${hashedPassword}', true, NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE SET "password" = '${hashedPassword}';
    `);

    // 3. Insert Players
    const playersData = [
      ['p1', 'Maarten Paes', 'maarten-paes', 1, 'GK', '1998-05-14', 'Indonesia', 191, 84, 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80', 'Kiper tembok kokoh Mariners FC', false, 'Active', 0, 0, 12, 1, 0],
      ['p2', 'Jay Idzes', 'jay-idzes', 4, 'DF', '2000-06-02', 'Indonesia', 190, 82, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80', 'Bek tengah berkarisma tinggi', true, 'Active', 2, 1, 12, 2, 0],
      ['p3', 'Rizky Ridho', 'rizky-ridho', 5, 'DF', '2001-11-21', 'Indonesia', 183, 75, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80', 'Defender serba bisa', false, 'Active', 1, 0, 11, 3, 0],
      ['p4', 'Pratama Arhan', 'pratama-arhan', 12, 'DF', '2001-12-21', 'Indonesia', 172, 64, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80', 'Bek kiri lincah lemparan jauh', false, 'Active', 1, 4, 10, 1, 0],
      ['p5', 'Sandy Walsh', 'sandy-walsh', 6, 'DF', '1995-03-14', 'Indonesia', 185, 78, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80', 'Bek kanan berpengalaman Europe', false, 'Active', 1, 2, 10, 2, 0],
      ['p6', 'Thom Haye', 'thom-haye', 19, 'MF', '1995-02-09', 'Indonesia', 187, 80, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', 'Jenderal lapangan tengah The Professor', false, 'Active', 3, 6, 12, 2, 0],
      ['p7', 'Marselino Ferdinan', 'marselino-ferdinan', 7, 'MF', '2004-09-09', 'Indonesia', 176, 67, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80', 'Wonderkid dribel eksotik', false, 'Active', 5, 4, 12, 1, 0],
      ['p8', 'Rafael Struick', 'rafael-struick', 9, 'FW', '2003-03-27', 'Indonesia', 187, 76, 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80', 'Penyerang tajam finisher dingin', false, 'Active', 6, 2, 12, 2, 0],
      ['p9', 'Ramadhan Sananta', 'ramadhan-sananta', 11, 'FW', '2002-11-27', 'Indonesia', 182, 77, 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80', 'Striker haus gol target man', false, 'Active', 7, 1, 11, 1, 0],
      ['p10', 'Ragnar Oratmangoen', 'ragnar-oratmangoen', 10, 'FW', '1998-01-21', 'Indonesia', 180, 74, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80', 'Winger kreatif Wak Haji', false, 'Active', 5, 5, 12, 0, 0],
    ];

    for (const p of playersData) {
      await client.query(`
        INSERT INTO "Player" ("id", "name", "slug", "number", "position", "birthDate", "nationality", "heightCm", "weightKg", "photoUrl", "bio", "isCaptain", "status", "goals", "assists", "appearances", "yellowCards", "redCards", "createdAt", "updatedAt")
        VALUES ('${p[0]}', '${p[1]}', '${p[2]}', ${p[3]}, '${p[4]}', '${p[5]}', '${p[6]}', ${p[7]}, ${p[8]}, '${p[9]}', '${p[10]}', ${p[11]}, '${p[12]}', ${p[13]}, ${p[14]}, ${p[15]}, ${p[16]}, ${p[17]}, NOW(), NOW())
        ON CONFLICT ("slug") DO NOTHING;
      `);
    }

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'SELAMAT! Tabel PostgreSQL Supabase berhasil dibuat & di-seed 100%!',
      admin: 'admin@marinersfc.com',
      password: 'password123',
    });
  } catch (error: any) {
    console.error('Setup DB DDL error:', error);
    if (client) await client.end();
    return NextResponse.json(
      { error: error?.message || 'Gagal menyetel database' },
      { status: 500 }
    );
  }
}
