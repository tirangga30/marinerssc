import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
    const body = await req.json();
    const { playerId, isFeatured, featuredPlayerIds } = body;

    const season = await prisma.season.findUnique({
      where: { id },
      include: { players: { select: { id: true, isFeatured: true } } },
    });
    if (!season) {
      return NextResponse.json({ error: 'Musim tidak ditemukan' }, { status: 404 });
    }

    let finalIds: string[] = [];
    if (Array.isArray(featuredPlayerIds)) {
      finalIds = featuredPlayerIds.slice(0, 6);
    } else if (playerId) {
      const current = season.featuredPlayerIds || [];
      if (isFeatured) {
        if (current.length >= 6) {
          return NextResponse.json(
            { error: `Maksimal 6 pemain beranda untuk musim ${season.name} sudah tercapai.` },
            { status: 400 }
          );
        }
        finalIds = [...new Set([...current, playerId])];
      } else {
        finalIds = current.filter((pid) => pid !== playerId);
      }
    }

    const updatedSeason = await prisma.season.update({
      where: { id },
      data: { featuredPlayerIds: finalIds },
    });

    if (playerId) {
      // Also update player.isFeatured as fallback
      await prisma.player.update({
        where: { id: playerId },
        data: { isFeatured: Boolean(isFeatured) },
      });
    }

    revalidatePath('/');
    revalidatePath('/players');

    return NextResponse.json({
      success: true,
      featuredPlayerIds: updatedSeason.featuredPlayerIds,
    });
  } catch (error: any) {
    console.error('Failed to update featured players for season:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengubah pemain bintang musim' },
      { status: 500 }
    );
  }
}
