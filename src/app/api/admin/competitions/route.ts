import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get('seasonId');
    const seasonName = searchParams.get('season');

    const where: any = {};
    if (seasonId) {
      where.seasonId = seasonId;
    } else if (seasonName) {
      where.season = seasonName;
    }

    const competitions = await prisma.competition.findMany({
      where,
      include: {
        seasonRef: {
          select: { id: true, name: true, year: true, isCurrent: true },
        },
        _count: {
          select: { matches: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    return NextResponse.json(competitions);
  } catch (error: any) {
    console.error('Failed to fetch competitions:', error);
    return NextResponse.json({ error: 'Gagal mengambil kompetisi' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const body = await req.json();
    const { name, seasonId, seasonName, type, isPrimary } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kompetisi harus diisi' }, { status: 400 });
    }

    const cleanName = name.trim().toUpperCase();
    let targetSeasonId = seasonId;
    let targetSeasonName = seasonName;

    if (targetSeasonId && !targetSeasonName) {
      const s = await prisma.season.findUnique({ where: { id: targetSeasonId } });
      if (s) targetSeasonName = s.name;
    } else if (!targetSeasonId && targetSeasonName) {
      const s = await prisma.season.findUnique({ where: { name: targetSeasonName } });
      if (s) targetSeasonId = s.id;
    } else if (!targetSeasonId && !targetSeasonName) {
      const curr = await prisma.season.findFirst({ where: { isCurrent: true } }) || await prisma.season.findFirst();
      if (curr) {
        targetSeasonId = curr.id;
        targetSeasonName = curr.name;
      } else {
        targetSeasonName = '2026';
      }
    }

    // Slug generator
    const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const seasonSuffix = targetSeasonName ? `-${targetSeasonName}` : '';
    let slug = `${baseSlug}${seasonSuffix}`;
    let count = 1;
    while (await prisma.competition.findUnique({ where: { slug } })) {
      count++;
      slug = `${baseSlug}${seasonSuffix}-${count}`;
    }

    const competition = await prisma.competition.create({
      data: {
        name: cleanName,
        slug,
        season: targetSeasonName || '2026',
        seasonId: targetSeasonId || null,
        type: type || 'Turnamen',
        isPrimary: Boolean(isPrimary),
      },
    });

    revalidatePath('/matches');

    return NextResponse.json(competition);
  } catch (error: any) {
    console.error('Failed to create competition:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat kompetisi' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, seasonId, seasonName, type, isPrimary } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID kompetisi wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.competition.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Kompetisi tidak ditemukan' }, { status: 404 });
    }

    let targetSeasonId = seasonId !== undefined ? seasonId : existing.seasonId;
    let targetSeasonName = seasonName !== undefined ? seasonName : existing.season;

    if (seasonId && !seasonName) {
      const s = await prisma.season.findUnique({ where: { id: seasonId } });
      if (s) targetSeasonName = s.name;
    }

    const cleanName = name ? name.trim().toUpperCase() : existing.name;

    const updated = await prisma.competition.update({
      where: { id },
      data: {
        name: cleanName,
        season: targetSeasonName,
        seasonId: targetSeasonId,
        type: type !== undefined ? type : existing.type,
        isPrimary: isPrimary !== undefined ? Boolean(isPrimary) : existing.isPrimary,
      },
    });

    // If name changed, update corresponding matches' competition string
    if (name && cleanName !== existing.name) {
      await prisma.footballMatch.updateMany({
        where: { competitionId: id },
        data: { competition: cleanName },
      });
    }

    revalidatePath('/matches');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update competition:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui kompetisi' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID kompetisi wajib' }, { status: 400 });
    }

    const comp = await prisma.competition.findUnique({
      where: { id },
      include: {
        _count: { select: { matches: true } },
      },
    });

    if (!comp) {
      return NextResponse.json({ error: 'Kompetisi tidak ditemukan' }, { status: 404 });
    }

    if (comp._count.matches > 0) {
      return NextResponse.json(
        { error: `Kompetisi ini digunakan oleh ${comp._count.matches} pertandingan. Pindahkan atau hapus pertandingan terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.competition.delete({ where: { id } });

    revalidatePath('/matches');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete competition:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus kompetisi' }, { status: 500 });
  }
}
