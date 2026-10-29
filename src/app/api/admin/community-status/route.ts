import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });
    return NextResponse.json({
      isCommunityEnabled: setting ? setting.isCommunityEnabled !== false : true,
    });
  } catch (err: any) {
    return NextResponse.json({ isCommunityEnabled: true });
  }
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { isCommunityEnabled } = body;

    const enabled = Boolean(isCommunityEnabled);

    const updated = await (prisma as any).systemSetting.upsert({
      where: { id: 'default' },
      update: {
        isCommunityEnabled: enabled,
      },
      create: {
        id: 'default',
        teamName: 'Mariners SC',
        teamLogo: '/marinerssc.webp',
        loginWallpaper: '/newposter.webp',
        adminWallpaper: '/stadium_hero2.png',
        securityPin: '1234',
        isCommunityEnabled: enabled,
      },
    });

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/community');
      revalidatePath('/matches');
    } catch (revErr) {
      console.warn('Revalidation notice:', revErr);
    }

    return NextResponse.json({
      success: true,
      isCommunityEnabled: updated.isCommunityEnabled !== false,
      message: enabled
        ? 'Portal Soccer Community berhasil diaktifkan untuk publik'
        : 'Portal Soccer Community berhasil dinonaktifkan (disembunyikan dari publik)',
    });
  } catch (err: any) {
    console.error('Error toggling community status:', err);
    return NextResponse.json({ error: 'Gagal memperbarui status komunitas' }, { status: 500 });
  }
}

