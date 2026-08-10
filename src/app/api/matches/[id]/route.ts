import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang.' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const match = await prisma.footballMatch.update({
      where: { id },
      data: {
        opponentName: data.opponentName,
        opponentLogo: data.opponentLogo,
        matchDate: new Date(data.matchDate),
        competition: data.competition || 'BRI Liga 1',
        venue: data.venue,
        isHome: Boolean(data.isHome),
        status: data.status,
        homeScore: data.homeScore !== undefined && data.homeScore !== null && data.homeScore !== '' ? parseInt(data.homeScore) : null,
        awayScore: data.awayScore !== undefined && data.awayScore !== null && data.awayScore !== '' ? parseInt(data.awayScore) : null,
        formation: data.formation || '4-3-3',
        summary: data.summary,
      },
    });

    revalidatePath('/');
    revalidatePath('/matches');
    revalidatePath(`/matches/${id}`);
    revalidatePath('/stats');

    return NextResponse.json(match);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui laga' }, { status: 500 });
  }
}
