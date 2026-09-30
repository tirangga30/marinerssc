import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const seasons = await prisma.season.findMany({
      orderBy: [{ year: 'desc' }, { name: 'desc' }],
      include: {
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
    console.error('Failed to fetch admin seasons:', error);
    return NextResponse.json({ error: 'Gagal mengambil data musim' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const body = await req.json();
    const { name, year, isCurrent, copyFromSeasonId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama musim harus diisi' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanYear = parseInt(year) || new Date().getFullYear();

    const existing = await prisma.season.findUnique({
      where: { name: cleanName },
    });
    if (existing) {
      return NextResponse.json({ error: `Musim ${cleanName} sudah terdaftar` }, { status: 400 });
    }

    // If marked current, unset current on other seasons
    if (isCurrent) {
      await prisma.season.updateMany({
        data: { isCurrent: false },
      });
    }

    // Create the season
    const season = await prisma.season.create({
      data: {
        name: cleanName,
        year: cleanYear,
        isCurrent: Boolean(isCurrent),
      },
    });

    // Auto-create default FRIENDLY competition for this season
    const friendlySlug = `friendly-${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;
    await prisma.competition.create({
      data: {
        name: 'FRIENDLY',
        slug: friendlySlug,
        season: cleanName,
        seasonId: season.id,
        type: 'Friendly',
        isPrimary: true,
      },
    });

    // If copyFromSeasonId provided, copy squad connections
    if (copyFromSeasonId) {
      const sourceSeason = await prisma.season.findUnique({
        where: { id: copyFromSeasonId },
        include: { players: { select: { id: true } } },
      });
      if (sourceSeason && sourceSeason.players.length > 0) {
        await prisma.season.update({
          where: { id: season.id },
          data: {
            players: {
              connect: sourceSeason.players.map((p) => ({ id: p.id })),
            },
          },
        });
      }
    }

    revalidatePath('/');
    revalidatePath('/matches');

    return NextResponse.json(season);
  } catch (error: any) {
    console.error('Failed to create season:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat musim' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, year, isCurrent } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID musim wajib diisi' }, { status: 400 });
    }

    const existing = await prisma.season.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Musim tidak ditemukan' }, { status: 404 });
    }

    if (isCurrent) {
      await prisma.season.updateMany({
        where: { id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const updated = await prisma.season.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(year ? { year: parseInt(year) } : {}),
        ...(isCurrent !== undefined ? { isCurrent: Boolean(isCurrent) } : {}),
      },
    });

    // If name changed, update seasonName in related matches and competitions
    if (name && name.trim() !== existing.name) {
      await prisma.footballMatch.updateMany({
        where: { seasonId: id },
        data: { seasonName: name.trim() },
      });
      await prisma.competition.updateMany({
        where: { seasonId: id },
        data: { season: name.trim() },
      });
    }

    revalidatePath('/');
    revalidatePath('/matches');

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update season:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui musim' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID musim wajib' }, { status: 400 });
    }

    const season = await prisma.season.findUnique({
      where: { id },
      include: {
        _count: { select: { matches: true } },
      },
    });

    if (!season) {
      return NextResponse.json({ error: 'Musim tidak ditemukan' }, { status: 404 });
    }

    if (season._count.matches > 0) {
      return NextResponse.json(
        { error: `Musim ini memiliki ${season._count.matches} pertandingan. Hapus atau pindahkan pertandingan terlebih dahulu.` },
        { status: 400 }
      );
    }

    await prisma.season.delete({ where: { id } });

    revalidatePath('/');
    revalidatePath('/matches');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete season:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus musim' }, { status: 500 });
  }
}
