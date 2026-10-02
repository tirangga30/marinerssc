import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let interval = 5;
    try {
      const rows: any = await (prisma as any).$queryRawUnsafe(
        `SELECT "posterInterval" FROM "SystemSetting" WHERE id = 'default' LIMIT 1`
      );
      if (rows && rows[0] && typeof rows[0].posterInterval === 'number') {
        interval = rows[0].posterInterval;
      }
    } catch {
      const setting = await (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null);
      if (setting && typeof setting.posterInterval === 'number') {
        interval = setting.posterInterval;
      }
    }

    const posters = await (prisma as any).heroPoster.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      posters: posters || [],
      interval,
    });
  } catch (err: any) {
    console.error('Error fetching hero posters:', err);
    return NextResponse.json({ error: 'Gagal mengambil data poster' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rawInterval = parseInt(body.interval, 10);
    if (isNaN(rawInterval) || rawInterval < 3 || rawInterval > 10) {
      return NextResponse.json({ error: 'Durasi pergantian poster harus antara 3 hingga 10 detik' }, { status: 400 });
    }

    try {
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO "SystemSetting" (id, "posterInterval", "teamName", "teamLogo", "loginWallpaper", "adminWallpaper", "securityPin", "createdAt", "updatedAt")
        VALUES ('default', $1, 'Mariners SC', '/marinerssc.webp', '/newposter.webp', '/stadium_hero2.png', '1234', NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET "posterInterval" = $1, "updatedAt" = NOW()`,
        rawInterval
      );
    } catch (sqlErr) {
      console.warn('Raw SQL insert on conflict failed, trying Prisma upsert:', sqlErr);
      await (prisma as any).systemSetting.upsert({
        where: { id: 'default' },
        update: { posterInterval: rawInterval },
        create: { id: 'default', posterInterval: rawInterval },
      });
    }

    return NextResponse.json({ success: true, interval: rawInterval });
  } catch (err: any) {
    console.error('Error updating poster interval:', err);
    return NextResponse.json({ error: 'Gagal memperbarui durasi pergantian poster: ' + (err?.message || 'DB Error') }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, imageUrl, title, subtitle, linkUrl, order, isActive } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Gambar poster wajib diunggah' }, { status: 400 });
    }

    // Check if poster already exists by id OR by slot order
    let existingPoster = null;
    if (id) {
      existingPoster = await (prisma as any).heroPoster?.findUnique({ where: { id } }).catch(() => null);
    }
    if (!existingPoster && typeof order === 'number') {
      existingPoster = await (prisma as any).heroPoster?.findFirst({ where: { order } }).catch(() => null);
    }

    let poster;
    if (existingPoster) {
      poster = await (prisma as any).heroPoster.update({
        where: { id: existingPoster.id },
        data: {
          imageUrl,
          title: title !== undefined ? title : existingPoster.title,
          subtitle: subtitle !== undefined ? subtitle : existingPoster.subtitle,
          linkUrl: linkUrl !== undefined ? linkUrl : existingPoster.linkUrl,
          order: typeof order === 'number' ? order : existingPoster.order,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
    } else {
      const currentCount = await (prisma as any).heroPoster?.count().catch(() => 0);
      if (currentCount >= 5) {
        return NextResponse.json({ error: 'Maksimal 5 poster utama' }, { status: 400 });
      }

      poster = await (prisma as any).heroPoster.create({
        data: {
          imageUrl,
          title: title || null,
          subtitle: subtitle || null,
          linkUrl: linkUrl || null,
          order: typeof order === 'number' ? order : currentCount + 1,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
    }

    return NextResponse.json({ success: true, poster });
  } catch (err: any) {
    console.error('Error saving hero poster:', err);
    return NextResponse.json({ error: 'Gagal menyimpan poster' }, { status: 500 });
  }
}
