import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { parseWibDate } from '@/lib/date';
import { cleanupUnusedUploads } from '@/lib/cleanup';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get('season');
    const seasonId = searchParams.get('seasonId');

    const where: any = {};
    if (seasonId) {
      where.seasonId = seasonId;
    } else if (season) {
      where.seasonName = season;
    }

    const matches = await prisma.footballMatch.findMany({
      where,
      include: {
        lineups: { include: { player: true } },
        events: { include: { player: true, assistPlayer: true } },
        competitionRef: true,
        season: true,
      },
      orderBy: { matchDate: 'desc' },
    });
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pertandingan' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();

    let seasonId = data.seasonId || null;
    let seasonName = data.seasonName || '2026';
    if (!seasonId && seasonName) {
      const s = await prisma.season.findUnique({ where: { name: seasonName } });
      if (s) {
        seasonId = s.id;
        seasonName = s.name;
      }
    }

    let competitionId = data.competitionId || null;
    let competitionName = data.competition || 'FRIENDLY';
    if (competitionId && !data.competition) {
      const c = await prisma.competition.findUnique({ where: { id: competitionId } });
      if (c) competitionName = c.name;
    }

    const match = await prisma.footballMatch.create({
      data: {
        opponentName: data.opponentName,
        opponentLogo: data.opponentLogo || '/defaultteam.webp',
        matchDate: parseWibDate(data.matchDate),
        competition: competitionName,
        competitionId: competitionId,
        stage: data.stage || 'Matchday 1',
        seasonName: seasonName,
        seasonId: seasonId,
        venue: data.venue || '',
        isHome: Boolean(data.isHome),
        isLiveEnabled: Boolean(data.isLiveEnabled),
        status: data.status || 'scheduled',
        homeScore: data.homeScore !== undefined && data.homeScore !== null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
        awayScore: data.awayScore !== undefined && data.awayScore !== null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
        formation: data.formation || 'Belum Tersedia',
        summary: data.summary || '',
      },
    });

    await cleanupUnusedUploads();

    return NextResponse.json(match);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal membuat pertandingan' }, { status: 500 });
  }
}
