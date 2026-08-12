import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const guestsOnly = searchParams.get('guestsOnly') === 'true';

    let whereClause: any = { isGuest: false };

    if (guestsOnly) {
      whereClause = { isGuest: true };
    } else if (matchId) {
      whereClause = {}; // Ambil semua pemain agar dapat memisahkan skuad utama, tamu match ini, dan rekomendasi tamu match lain
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      orderBy: { number: 'asc' },
    });
    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pemain' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const data = await req.json();
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (data.isGuest) {
      slug = `${slug}-guest-${Date.now()}`;
    }

    const requestedNumber = parseInt(data.number);
    const existingPlayer = await prisma.player.findUnique({ where: { number: requestedNumber } });
    let finalNumber = requestedNumber;

    if (existingPlayer) {
      if (data.isGuest) {
        const maxPlayer = await prisma.player.findFirst({ orderBy: { number: 'desc' } });
        finalNumber = (maxPlayer?.number || 99) + 1;
      } else {
        return NextResponse.json({ error: `Nomor punggung ${requestedNumber} sudah digunakan oleh pemain lain.` }, { status: 400 });
      }
    }

    const player = await prisma.player.create({
      data: {
        name: data.name,
        slug,
        number: finalNumber,
        position: data.position,
        nationality: data.nationality || 'Indonesia',
        heightCm: data.heightCm ? parseInt(data.heightCm) : null,
        weightKg: data.weightKg ? parseInt(data.weightKg) : null,
        photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
        bio: data.bio || '',
        isCaptain: Boolean(data.isCaptain),
        isFeatured: Boolean(data.isFeatured),
        status: data.status || 'Active',
        isGuest: Boolean(data.isGuest),
        guestMatchId: data.guestMatchId || null,
        goals: parseInt(data.goals || 0),
        assists: parseInt(data.assists || 0),
        appearances: parseInt(data.appearances || 0),
        yellowCards: parseInt(data.yellowCards || 0),
        redCards: parseInt(data.redCards || 0),
      },
    });

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath('/stats');

    return NextResponse.json(player);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Gagal menambah pemain' }, { status: 500 });
  }
}
