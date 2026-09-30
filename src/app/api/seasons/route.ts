import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: [{ year: 'desc' }, { name: 'desc' }],
      select: {
        id: true,
        name: true,
        year: true,
        isCurrent: true,
        _count: {
          select: {
            matches: true,
            competitions: true,
            players: true,
          },
        },
      },
    });
    return NextResponse.json(seasons);
  } catch (error: any) {
    console.error('Failed to fetch seasons:', error);
    return NextResponse.json({ error: 'Gagal mengambil data musim' }, { status: 500 });
  }
}
