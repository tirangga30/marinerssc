import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.footballMatch.findUnique({
      where: { id },
      include: {
        lineups: { include: { player: true } },
        events: { include: { player: true, assistPlayer: true }, orderBy: { minute: 'asc' } },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil detail pertandingan' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const match = await prisma.footballMatch.update({
      where: { id },
      data: {
        opponentName: data.opponentName,
        opponentLogo: data.opponentLogo,
        matchDate: new Date(data.matchDate),
        competition: data.competition,
        venue: data.venue,
        isHome: Boolean(data.isHome),
        status: data.status,
        homeScore: data.homeScore !== null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
        awayScore: data.awayScore !== null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
        formation: data.formation,
        summary: data.summary,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memperbarui pertandingan' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.footballMatch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus pertandingan' }, { status: 500 });
  }
}
