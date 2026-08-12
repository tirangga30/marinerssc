import { prisma } from '@/lib/db';

export async function recalculateAllPlayerStats() {
  try {
    const players = await prisma.player.findMany({
      include: {
        lineups: { include: { match: true } },
        events: { include: { match: true } },
        assistedEvents: { include: { match: true } },
      },
    });

    for (const p of players) {
      const finishedLineups = (p.lineups || []).filter((l) => l.match.status === 'finished');
      const appearances = finishedLineups.length;

      // Exclude own_goal! Only count regular goals and penalty goals
      const goals = (p.events || []).filter(
        (e) => (e.type === 'goal' || e.type === 'penalty') && e.match.status === 'finished'
      ).length;

      // Direct assist events or assistedEvents relation in finished matches
      const directAssists = (p.events || []).filter(
        (e) => e.type === 'assist' && e.match.status === 'finished'
      ).length;
      const assistedCount = (p.assistedEvents || []).filter(
        (e) => e.match?.status === 'finished'
      ).length;
      const assists = directAssists + assistedCount;

      const yellowCards = (p.events || []).filter(
        (e) => e.type === 'yellow_card' && e.match.status === 'finished'
      ).length;

      // Direct red cards + second_yellow + matches with >= 2 yellow cards
      const directRedCards = (p.events || []).filter(
        (e) => (e.type === 'red_card' || e.type === 'second_yellow') && e.match.status === 'finished'
      ).length;

      const matchesWithTwoYellows = new Set<string>();
      const matchYellowCounts: Record<string, number> = {};
      (p.events || []).forEach((e) => {
        if (e.type === 'yellow_card' && e.match?.status === 'finished') {
          matchYellowCounts[e.matchId] = (matchYellowCounts[e.matchId] || 0) + 1;
          if (matchYellowCounts[e.matchId] >= 2) {
            matchesWithTwoYellows.add(e.matchId);
          }
        }
      });

      const redCards = directRedCards + matchesWithTwoYellows.size;

      await prisma.player.update({
        where: { id: p.id },
        data: {
          appearances,
          goals,
          assists,
          yellowCards,
          redCards,
        },
      });
    }
  } catch (err) {
    console.error('Failed to recalculate player stats:', err);
  }
}
