import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { recalculateAllPlayerStats } from '@/lib/stats';
import { parseWibDate } from '@/lib/date';
import { cleanupUnusedUploads } from '@/lib/cleanup';
import { renameMatchLogoFile } from '@/lib/fileNaming';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.footballMatch.findUnique({
      where: { id },
      include: {
        lineups: { include: { player: true } },
        events: {
          include: { player: true, assistPlayer: true },
          orderBy: { minute: 'asc' },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    const allMatches = await prisma.footballMatch.findMany({
      orderBy: { matchDate: 'asc' },
      select: { id: true },
    });
    const matchdayIndex = allMatches.findIndex(m => m.id === id) + 1;
    match.competition = `Matchday ${matchdayIndex}`;

    return NextResponse.json(match);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal mengambil data laga' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang.' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existingMatch = await prisma.footballMatch.findUnique({ where: { id } });
    if (!existingMatch) {
      return NextResponse.json({ error: 'Laga tidak ditemukan' }, { status: 404 });
    }

    const finalOpponentName = data.opponentName || existingMatch.opponentName;
    let finalLogo = data.opponentLogo !== undefined ? data.opponentLogo : existingMatch.opponentLogo;

    // Auto-rename logo file on disk if opponent name changed and logo exists
    if (finalLogo && finalLogo.startsWith('/uploads/matches/')) {
      const renamedUrl = renameMatchLogoFile(finalLogo, finalOpponentName);
      if (renamedUrl) {
        finalLogo = renamedUrl;
      }
    }

    const match = await prisma.footballMatch.update({
      where: { id },
      data: {
        opponentName: finalOpponentName,
        opponentLogo: finalLogo,
        matchDate: parseWibDate(data.matchDate),
        competition: data.competition || 'Matchday 1',
        venue: data.venue,
        isHome: Boolean(data.isHome),
        status: data.status,
        homeScore: data.homeScore !== undefined && data.homeScore !== null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
        awayScore: data.awayScore !== undefined && data.awayScore !== null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
        formation: data.formation || 'Belum Tersedia',
        duration: data.duration !== undefined ? parseInt(data.duration) : 60,
        extraTime: data.extraTime !== undefined ? parseInt(data.extraTime) : 0,
        isLiveEnabled: data.isLiveEnabled !== undefined ? Boolean(data.isLiveEnabled) : undefined,
        summary: data.summary,
      },
    });

    await recalculateAllPlayerStats();

    // Automatically remove replaced unreferenced files from disk
    await cleanupUnusedUploads();

    revalidatePath('/');
    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    revalidatePath('/stats');

    return NextResponse.json(match);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui laga' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.matchLineup.deleteMany({ where: { matchId: id } });
    await prisma.matchEvent.deleteMany({ where: { matchId: id } });
    await prisma.footballMatch.delete({ where: { id } });

    await recalculateAllPlayerStats();

    // Automatically remove deleted match's files from disk
    await cleanupUnusedUploads();

    revalidatePath('/');
    revalidatePath('/matches');
    revalidatePath('/stats');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal menghapus laga' }, { status: 500 });
  }
}
