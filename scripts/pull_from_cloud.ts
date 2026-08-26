import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const CLOUD_DATABASE_URL = 'postgresql://neondb_owner:npg_4qz7JKfLXMuv@ep-royal-band-aylok87j.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient();

async function pullData() {
  console.log('Connecting to Neon PostgreSQL cloud database...');
  const pgClient = new Client({
    connectionString: CLOUD_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pgClient.connect();
  console.log('✓ Connected to Neon Cloud PostgreSQL.');

  // 1. Fetch all data from Cloud tables
  console.log('Fetching all tables from Cloud...');

  const usersRes = await pgClient.query('SELECT * FROM "User"');
  const competitionsRes = await pgClient.query('SELECT * FROM "Competition"');
  const playersRes = await pgClient.query('SELECT * FROM "Player"');
  const matchesRes = await pgClient.query('SELECT * FROM "FootballMatch"');
  const lineupsRes = await pgClient.query('SELECT * FROM "MatchLineup"');
  const matchEventsRes = await pgClient.query('SELECT * FROM "MatchEvent"');
  const articlesRes = await pgClient.query('SELECT * FROM "Article"');

  let membersRes: { rows: any[] } = { rows: [] };
  let funMatchesRes: { rows: any[] } = { rows: [] };
  let attendancesRes: { rows: any[] } = { rows: [] };
  let funMatchEventsRes: { rows: any[] } = { rows: [] };

  try {
    membersRes = await pgClient.query('SELECT * FROM "Member"');
  } catch (e) {
    console.log('Member table not present or empty in cloud');
  }
  try {
    funMatchesRes = await pgClient.query('SELECT * FROM "FunMatch"');
  } catch (e) {
    console.log('FunMatch table not present or empty in cloud');
  }
  try {
    attendancesRes = await pgClient.query('SELECT * FROM "MatchAttendance"');
  } catch (e) {
    console.log('MatchAttendance table not present or empty in cloud');
  }
  try {
    funMatchEventsRes = await pgClient.query('SELECT * FROM "FunMatchEvent"');
  } catch (e) {
    console.log('FunMatchEvent table not present or empty in cloud');
  }

  await pgClient.end();

  const exportData: Record<string, any[]> = {
    users: usersRes.rows,
    competitions: competitionsRes.rows,
    players: playersRes.rows,
    matches: matchesRes.rows,
    lineups: lineupsRes.rows,
    events: matchEventsRes.rows,
    articles: articlesRes.rows,
    members: membersRes.rows,
    funMatches: funMatchesRes.rows,
    attendances: attendancesRes.rows,
    funMatchEvents: funMatchEventsRes.rows,
  };

  console.log(`Fetched counts:
- Users: ${exportData.users.length}
- Competitions: ${exportData.competitions.length}
- Players: ${exportData.players.length}
- Matches: ${exportData.matches.length}
- Lineups: ${exportData.lineups.length}
- Match Events: ${exportData.events.length}
- Articles: ${exportData.articles.length}
- Members: ${exportData.members.length}
- Fun Matches: ${exportData.funMatches.length}
- Match Attendances: ${exportData.attendances.length}
- Fun Match Events: ${exportData.funMatchEvents.length}
  `);

  // Save to prisma/backup_data.json
  const backupFilePath = path.join(process.cwd(), 'prisma', 'backup_data.json');
  fs.writeFileSync(backupFilePath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`✓ Backup saved to ${backupFilePath}`);

  // 2. Clear and Insert into Local SQLite Database
  console.log('Importing into local SQLite database...');

  // Delete child records first
  await prisma.funMatchEvent.deleteMany();
  await prisma.matchAttendance.deleteMany();
  await prisma.matchEvent.deleteMany();
  await prisma.matchLineup.deleteMany();
  await prisma.member.deleteMany();
  await prisma.funMatch.deleteMany();
  await prisma.footballMatch.deleteMany();
  await prisma.player.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();

  // Insert Users
  for (const u of exportData.users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        isAdmin: Boolean(u.isAdmin),
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      },
    });
  }

  // Insert Competitions
  for (const c of exportData.competitions) {
    await prisma.competition.create({
      data: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        season: c.season || '2026/2027',
        type: c.type || 'Liga',
        isPrimary: Boolean(c.isPrimary),
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
    });
  }

  // Insert Players
  for (const p of exportData.players) {
    await prisma.player.create({
      data: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        number: p.number,
        position: p.position,
        birthDate: p.birthDate ? new Date(p.birthDate) : null,
        nationality: p.nationality || 'Indonesia',
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        photoUrl: p.photoUrl,
        bio: p.bio,
        isCaptain: Boolean(p.isCaptain),
        isFeatured: Boolean(p.isFeatured),
        isGuest: Boolean(p.isGuest),
        status: p.status || 'Active',
        goals: p.goals || 0,
        assists: p.assists || 0,
        appearances: p.appearances || 0,
        yellowCards: p.yellowCards || 0,
        redCards: p.redCards || 0,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
    });
  }

  // Insert Matches
  for (const m of exportData.matches) {
    await prisma.footballMatch.create({
      data: {
        id: m.id,
        status: m.status || 'scheduled',
        opponentName: m.opponentName,
        opponentLogo: m.opponentLogo,
        matchDate: new Date(m.matchDate),
        competition: m.competition,
        venue: m.venue,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        isHome: Boolean(m.isHome),
        formation: m.formation,
        duration: m.duration || 60,
        isLiveEnabled: m.isLiveEnabled !== false,
        extraTime: m.extraTime || 0,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      },
    });
  }

  // Insert Lineups
  for (const l of exportData.lineups) {
    await prisma.matchLineup.create({
      data: {
        id: l.id,
        matchId: l.matchId,
        playerId: l.playerId,
        isStarter: Boolean(l.isStarter),
        pitchPosition: l.pitchPosition,
        positionName: l.positionName,
        x: l.x,
        y: l.y,
        createdAt: new Date(l.createdAt),
      },
    });
  }

  // Insert Match Events
  for (const e of exportData.events) {
    await prisma.matchEvent.create({
      data: {
        id: e.id,
        matchId: e.matchId,
        playerId: e.playerId,
        assistPlayerId: e.assistPlayerId || null,
        type: e.type,
        minute: e.minute,
        description: e.description,
        createdAt: new Date(e.createdAt),
      },
    });
  }

  // Insert Articles
  for (const a of exportData.articles) {
    await prisma.article.create({
      data: {
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category || 'Kabar Tim',
        thumbnail: a.thumbnail,
        images: a.images,
        content: a.content,
        publishedAt: new Date(a.publishedAt),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      },
    });
  }

  // Insert Members
  for (const mem of exportData.members) {
    await prisma.member.create({
      data: {
        id: mem.id,
        memberCode: mem.memberCode,
        password: mem.password,
        fullName: mem.fullName,
        nickname: mem.nickname,
        origin: mem.origin,
        phone: mem.phone,
        photoUrl: mem.photoUrl,
        position: mem.position,
        altPosition: mem.altPosition,
        jerseyNumber: mem.jerseyNumber,
        tier: mem.tier,
        status: mem.status || 'ACTIVE',
        paymentProof: mem.paymentProof,
        paymentStatus: mem.paymentStatus || 'VERIFIED',
        joinedAt: new Date(mem.joinedAt || mem.createdAt),
        expiresAt: mem.expiresAt ? new Date(mem.expiresAt) : null,
        isPermanent: Boolean(mem.isPermanent),
        playerId: mem.playerId,
        funAppearances: mem.funAppearances || 0,
        mainAppearances: mem.mainAppearances || 0,
        goals: mem.goals || 0,
        assists: mem.assists || 0,
        yellowCards: mem.yellowCards || 0,
        redCards: mem.redCards || 0,
        createdAt: new Date(mem.createdAt),
        updatedAt: new Date(mem.updatedAt),
      },
    });
  }

  // Insert Fun Matches
  for (const fm of exportData.funMatches) {
    await prisma.funMatch.create({
      data: {
        id: fm.id,
        title: fm.title,
        matchDate: new Date(fm.matchDate),
        venue: fm.venue,
        teamAName: fm.teamAName,
        teamBName: fm.teamBName,
        teamALogo: fm.teamALogo,
        teamBLogo: fm.teamBLogo,
        teamAScore: fm.teamAScore,
        teamBScore: fm.teamBScore,
        status: fm.status || 'scheduled',
        duration: fm.duration || 60,
        createdAt: new Date(fm.createdAt),
        updatedAt: new Date(fm.updatedAt),
      },
    });
  }

  // Insert Match Attendances
  for (const att of exportData.attendances) {
    await prisma.matchAttendance.create({
      data: {
        id: att.id,
        matchId: att.matchId || att.footballMatchId || null,
        funMatchId: att.funMatchId || null,
        memberId: att.memberId || null,
        playerId: att.playerId || null,
        playerType: att.playerType || 'MEMBER',
        playerName: att.playerName || null,
        status: att.status || 'INVITED',
        declineReason: att.declineReason || null,
        assignedTeam: att.assignedTeam || att.teamSide || null,
        createdAt: new Date(att.createdAt),
        updatedAt: new Date(att.updatedAt),
      },
    });
  }

  // Insert Fun Match Events
  for (const fme of exportData.funMatchEvents) {
    await prisma.funMatchEvent.create({
      data: {
        id: fme.id,
        funMatchId: fme.funMatchId,
        memberId: fme.memberId || null,
        playerName: fme.playerName || null,
        team: fme.team || fme.teamSide || 'TEAM_A',
        type: fme.type,
        minute: fme.minute,
        description: fme.description || null,
        createdAt: new Date(fme.createdAt),
      },
    });
  }

  console.log('🎉 SUKSES! Seluruh data dari cloud Neon telah berhasil dipindahkan ke SQLite lokal (prisma/dev.db)!');
}

pullData()
  .catch((err) => {
    console.error('Error pulling data:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
