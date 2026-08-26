import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const funMatches = await prisma.funMatch.findMany({
      include: {
        attendances: {
          include: { member: true },
        },
        events: {
          include: { member: true },
        },
      },
      orderBy: { matchDate: 'desc' },
    });

    return NextResponse.json({ funMatches });
  } catch (error) {
    console.error('Error fetching fun matches:', error);
    return NextResponse.json({ error: 'Gagal mengambil data fun match' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();
    const {
      title = 'Fun Match Community',
      matchDate,
      venue = 'Stadion Gelora Samudra, Jakarta',
      teamAName = 'TIM A (NAVY)',
      teamBName = 'TIM B (GOLD)',
      duration = 60,
    } = data;

    if (!matchDate) {
      return NextResponse.json({ error: 'Tanggal & waktu pertandingan wajib diisi' }, { status: 400 });
    }

    const funMatch = await prisma.funMatch.create({
      data: {
        title,
        matchDate: new Date(matchDate),
        venue,
        teamAName,
        teamBName,
        duration: parseInt(duration) || 60,
        status: 'scheduled',
      },
    });

    return NextResponse.json({ success: true, funMatch });
  } catch (error) {
    console.error('Error creating fun match:', error);
    return NextResponse.json({ error: 'Gagal membuat pertandingan fun match' }, { status: 500 });
  }
}
