import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const backupPath = path.join(__dirname, 'backup_data.json');
  if (!fs.existsSync(backupPath)) {
    console.error('File prisma/backup_data.json tidak ditemukan!');
    return;
  }

  const raw = fs.readFileSync(backupPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('Memulai import data ke database cloud...');

  // 1. Users
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {
          name: u.name,
          password: u.password,
          isAdmin: Boolean(u.isAdmin),
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          isAdmin: Boolean(u.isAdmin),
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.users.length} users`);
  }

  // 2. Competitions
  if (Array.isArray(data.competitions)) {
    for (const c of data.competitions) {
      await prisma.competition.upsert({
        where: { slug: c.slug },
        update: {
          name: c.name,
          season: c.season || '2026/2027',
          type: c.type || 'Liga',
          isPrimary: Boolean(c.isPrimary),
        },
        create: {
          id: c.id,
          name: c.name,
          slug: c.slug,
          season: c.season || '2026/2027',
          type: c.type || 'Liga',
          isPrimary: Boolean(c.isPrimary),
          createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
          updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.competitions.length} competitions`);
  }

  // 3. Players
  if (Array.isArray(data.players)) {
    for (const p of data.players) {
      await prisma.player.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          number: p.number,
          position: p.position,
          birthDate: p.birthDate ? new Date(p.birthDate) : null,
          nationality: p.nationality || 'Indonesia',
          heightCm: p.heightCm,
          weightKg: p.weightKg,
          photoUrl: p.photoUrl,
          bio: p.bio || '',
          isCaptain: Boolean(p.isCaptain),
          isFeatured: Boolean(p.isFeatured),
          status: p.status || 'Active',
          isGuest: Boolean(p.isGuest),
          hidePhoto: Boolean(p.hidePhoto),
          guestMatchId: p.guestMatchId || null,
          goals: p.goals || 0,
          assists: p.assists || 0,
          appearances: p.appearances || 0,
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0,
        },
        create: {
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
          bio: p.bio || '',
          isCaptain: Boolean(p.isCaptain),
          isFeatured: Boolean(p.isFeatured),
          status: p.status || 'Active',
          isGuest: Boolean(p.isGuest),
          hidePhoto: Boolean(p.hidePhoto),
          guestMatchId: p.guestMatchId || null,
          goals: p.goals || 0,
          assists: p.assists || 0,
          appearances: p.appearances || 0,
          yellowCards: p.yellowCards || 0,
          redCards: p.redCards || 0,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.players.length} players`);
  }

  // 4. Football Matches
  if (Array.isArray(data.matches)) {
    for (const m of data.matches) {
      await prisma.footballMatch.upsert({
        where: { id: m.id },
        update: {
          opponentName: m.opponentName,
          opponentLogo: m.opponentLogo,
          matchDate: new Date(m.matchDate),
          competition: m.competition || 'BRI Liga 1',
          venue: m.venue || 'Stadion Gelora Samudra, Jakarta',
          isHome: Boolean(m.isHome),
          isLiveEnabled: Boolean(m.isLiveEnabled),
          status: m.status || 'scheduled',
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          formation: m.formation || 'Belum Tersedia',
          summary: m.summary || '',
          duration: m.duration || 60,
          extraTime: m.extraTime || 0,
        },
        create: {
          id: m.id,
          opponentName: m.opponentName,
          opponentLogo: m.opponentLogo,
          matchDate: new Date(m.matchDate),
          competition: m.competition || 'BRI Liga 1',
          venue: m.venue || 'Stadion Gelora Samudra, Jakarta',
          isHome: Boolean(m.isHome),
          isLiveEnabled: Boolean(m.isLiveEnabled),
          status: m.status || 'scheduled',
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          formation: m.formation || 'Belum Tersedia',
          summary: m.summary || '',
          duration: m.duration || 60,
          extraTime: m.extraTime || 0,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.matches.length} matches`);
  }

  // 5. Lineups
  if (Array.isArray(data.lineups)) {
    // Delete existing lineups to re-insert cleanly
    await prisma.matchLineup.deleteMany({});
    for (const l of data.lineups) {
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
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.lineups.length} lineups`);
  }

  // 6. Events
  if (Array.isArray(data.events)) {
    await prisma.matchEvent.deleteMany({});
    for (const e of data.events) {
      await prisma.matchEvent.create({
        data: {
          id: e.id,
          matchId: e.matchId,
          playerId: e.playerId,
          assistPlayerId: e.assistPlayerId || null,
          type: e.type,
          minute: e.minute,
          description: e.description || '',
          createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.events.length} events`);
  }

  // 7. Articles
  if (Array.isArray(data.articles)) {
    for (const a of data.articles) {
      await prisma.article.upsert({
        where: { slug: a.slug },
        update: {
          title: a.title,
          category: a.category || 'Kabar Tim',
          thumbnail: a.thumbnail,
          images: a.images || null,
          content: a.content,
          publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        },
        create: {
          id: a.id,
          title: a.title,
          slug: a.slug,
          category: a.category || 'Kabar Tim',
          thumbnail: a.thumbnail,
          images: a.images || null,
          content: a.content,
          publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
        },
      });
    }
    console.log(`✓ Imported ${data.articles.length} articles`);
  }

  console.log('🎉 Semua data berhasil dimigrasikan!');
}

main()
  .catch((e) => {
    console.error('Error saat restore data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
