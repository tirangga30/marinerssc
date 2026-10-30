import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      const attendances = await prisma.matchAttendance.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(attendances);
    }

    const attendance = await prisma.matchAttendance.findFirst({
      where: {
        matchId,
        playerId,
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json();

    const { playerId, status, declineReason } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'ID pemain wajib disertakan' }, { status: 400 });
    }

    if (!['CONFIRMED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid (harus CONFIRMED atau DECLINED)' }, { status: 400 });
    }

    const [match, player] = await Promise.all([
      prisma.footballMatch.findUnique({ where: { id: matchId } }),
      prisma.player.findUnique({ where: { id: playerId } }),
    ]);

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    if (!player) {
      return NextResponse.json({ error: 'Data pemain tidak ditemukan' }, { status: 404 });
    }

    const existing = await prisma.matchAttendance.findFirst({
      where: {
        matchId: match.id,
        playerId: player.id,
      },
    });

    let attendance;
    if (existing) {
      attendance = await prisma.matchAttendance.update({
        where: { id: existing.id },
        data: {
          status,
          declineReason: status === 'DECLINED' ? (declineReason || null) : null,
          playerName: player.name,
          updatedAt: new Date(),
        },
      });
    } else {
      attendance = await prisma.matchAttendance.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          playerType: 'SQUAD',
          playerName: player.name,
          status,
          declineReason: status === 'DECLINED' ? (declineReason || null) : null,
        },
      });
    }

    // Revalidate match details and matches list
    try {
      revalidatePath(`/matches/${matchId}`);
      revalidatePath('/matches');
    } catch (e) {
      // ignore in non-request context
    }

    return NextResponse.json({
      success: true,
      attendance,
      player: {
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
      },
    });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status kehadiran' }, { status: 500 });
  }
}
