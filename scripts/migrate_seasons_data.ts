import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Migrating season and competition data...');

  // 1. Upsert Season 2026
  const season2026 = await prisma.season.upsert({
    where: { name: '2026' },
    update: { isCurrent: true, year: 2026 },
    create: { name: '2026', year: 2026, isCurrent: true }
  });
  console.log('Season 2026 ready:', season2026.id);

  // 2. Upsert Competition FRIENDLY for 2026
  const friendlyComp = await prisma.competition.upsert({
    where: { slug: 'friendly-2026' },
    update: {
      name: 'FRIENDLY',
      season: '2026',
      seasonId: season2026.id,
      type: 'Friendly',
      isPrimary: true
    },
    create: {
      name: 'FRIENDLY',
      slug: 'friendly-2026',
      season: '2026',
      seasonId: season2026.id,
      type: 'Friendly',
      isPrimary: true
    }
  });
  console.log('Competition FRIENDLY ready:', friendlyComp.id);

  // 3. Update all existing matches
  const matches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'asc' }
  });
  console.log(`Found ${matches.length} matches to update`);

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    // If competition had "Matchday X", keep it as stage, or fallback to chronological Matchday ${i + 1}
    let stage = m.competition?.startsWith('Matchday') ? m.competition : `Matchday ${i + 1}`;
    if (m.stage && m.stage !== 'Matchday 1') {
      stage = m.stage;
    }

    await prisma.footballMatch.update({
      where: { id: m.id },
      data: {
        seasonId: season2026.id,
        seasonName: '2026',
        competition: 'FRIENDLY',
        competitionId: friendlyComp.id,
        stage: stage
      }
    });
  }
  console.log('All matches updated with season & competition.');

  // 4. Connect all non-guest players to Season 2026
  const players = await prisma.player.findMany({
    where: { isGuest: false }
  });
  console.log(`Connecting ${players.length} players to Season 2026`);

  for (const p of players) {
    await prisma.player.update({
      where: { id: p.id },
      data: {
        seasons: {
          connect: { id: season2026.id }
        }
      }
    });
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
