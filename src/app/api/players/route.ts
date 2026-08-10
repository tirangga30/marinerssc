import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function GET() {
  try {
    const players = await prisma.player.findMany({
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
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const player = await prisma.player.create({
      data: {
        name: data.name,
        slug,
        number: parseInt(data.number),
        position: data.position,
        nationality: data.nationality || 'Indonesia',
        heightCm: data.heightCm ? parseInt(data.heightCm) : null,
        weightKg: data.weightKg ? parseInt(data.weightKg) : null,
        photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
        bio: data.bio || '',
        isCaptain: Boolean(data.isCaptain),
        status: data.status || 'Active',
        goals: parseInt(data.goals || 0),
        assists: parseInt(data.assists || 0),
        appearances: parseInt(data.appearances || 0),
        yellowCards: parseInt(data.yellowCards || 0),
        redCards: parseInt(data.redCards || 0),
      },
    });

    return NextResponse.json(player);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal menambah pemain' }, { status: 500 });
  }
}
