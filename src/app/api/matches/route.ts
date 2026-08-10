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
        opponentLogo: data.opponentLogo || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
        matchDate: new Date(data.matchDate),
        competition: data.competition || 'BRI Liga 1',
        venue: data.venue || 'Stadion Gelora Samudra, Jakarta',
        isHome: Boolean(data.isHome),
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
