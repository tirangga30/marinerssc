import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating matches competition names...');
  const matches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'asc' },
  });

  for (let i = 0; i < matches.length; i++) {
    const matchdayName = `Matchday ${i + 1}`;
    await prisma.footballMatch.update({
      where: { id: matches[i].id },
      data: { competition: matchdayName },
    });
    console.log(`Updated match ${matches[i].id} (${matches[i].opponentName}) to ${matchdayName}`);
  }

  console.log('Updating competition seasons...');
  await prisma.competition.updateMany({
    data: { season: '2026/2027' },
  });

  console.log('Done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
