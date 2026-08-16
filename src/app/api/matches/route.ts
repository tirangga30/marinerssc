import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const matches = await prisma.footballMatch.findMany({
      include: {
        lineups: { include: { player: true } },
        events: { include: { player: true, assistPlayer: true } },
      },
      orderBy: { matchDate: 'desc' },
    });
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pertandingan' }, { status: 500 });
  }
}

import { parseWibDate } from '@/lib/date';

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();

    const match = await prisma.footballMatch.create({
      data: {
        opponentName: data.opponentName,
        opponentLogo: data.opponentLogo || '/defaultteam.png',
        matchDate: parseWibDate(data.matchDate),
        competition: data.competition || 'Matchday 1',
        venue: data.venue || '',
        isHome: Boolean(data.isHome),
        isLiveEnabled: Boolean(data.isLiveEnabled),
        status: data.status || 'scheduled',
        homeScore: data.homeScore !== undefined && data.homeScore !== null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
        awayScore: data.awayScore !== undefined && data.awayScore !== null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
        formation: data.formation || '4-3-3',
        summary: data.summary || '',
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal membuat pertandingan' }, { status: 500 });
  }
}
