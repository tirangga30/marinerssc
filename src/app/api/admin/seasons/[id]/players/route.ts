import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        players: {
          select: {
            id: true,
            name: true,
            number: true,
            position: true,
            photoUrl: true,
          },
        },
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Musim tidak ditemukan' }, { status: 404 });
    }

    const allPlayers = await prisma.player.findMany({
      where: { isGuest: false },
      orderBy: [{ number: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        photoUrl: true,
      },
    });

    const enrolledPlayerIds = season.players.map((p) => p.id);

    return NextResponse.json({
      season,
      enrolledPlayerIds,
      allPlayers,
    });
  } catch (error: any) {
    console.error('Failed to get season players:', error);
    return NextResponse.json({ error: 'Gagal mengambil skuad musim' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const { playerIds } = await req.json();

    if (!Array.isArray(playerIds)) {
      return NextResponse.json({ error: 'Data playerIds tidak valid' }, { status: 400 });
    }

    // Validate that no two enrolled players share the same jersey number in this season
    const playersToEnroll = await prisma.player.findMany({
      where: { id: { in: playerIds }, isGuest: false },
      select: { id: true, name: true, number: true },
    });

    const seenNumbers = new Map<number, string>();
    for (const p of playersToEnroll) {
      if (seenNumbers.has(p.number)) {
        return NextResponse.json(
          {
            error: `Konflik nomor punggung di musim ini: Nomor #${p.number} digunakan oleh lebih dari 1 pemain (${seenNumbers.get(p.number)} & ${p.name}). Sesuaikan nomor punggung salah satu pemain terlebih dahulu.`,
          },
          { status: 400 }
        );
      }
      seenNumbers.set(p.number, p.name);
    }

    const updated = await prisma.season.update({
      where: { id },
      data: {
        players: {
          set: playerIds.map((pid: string) => ({ id: pid })),
        },
      },
      include: {
        _count: { select: { players: true } },
      },
    });

    return NextResponse.json({
      success: true,
      playerCount: updated._count.players,
    });
  } catch (error: any) {
    console.error('Failed to update season squad:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan skuad musim' }, { status: 500 });
  }
}
