import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      teamName: setting?.teamName || 'Mariners SC',
      teamLogo: setting?.teamLogo || '/marinerssc.webp',
      loginWallpaper: setting?.loginWallpaper || '/newposter.webp',
      adminWallpaper: setting?.adminWallpaper || '/stadium_hero2.png',
      hasCustomPin: setting ? setting.securityPin !== '1234' : false,
    });
  } catch (err: any) {
    console.error('Error fetching system settings:', err);
    return NextResponse.json({
      teamName: 'Mariners SC',
      teamLogo: '/marinerssc.webp',
      loginWallpaper: '/newposter.webp',
      adminWallpaper: '/stadium_hero2.png',
      hasCustomPin: false,
    });
  }
}

export async function PUT(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get('team_mgmt_unlocked')?.value === 'true';
  if (!unlocked) {
    return NextResponse.json({ error: 'Portal Team Management terkunci. Silakan masukkan PIN terlebih dahulu.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { teamName, teamLogo, loginWallpaper, adminWallpaper, currentPin, newPin } = body;

    const currentSetting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const updateData: any = {};

    if (teamName !== undefined && typeof teamName === 'string') {
      updateData.teamName = teamName.trim() || 'Mariners SC';
    }

    if (teamLogo !== undefined && typeof teamLogo === 'string' && teamLogo.trim()) {
      updateData.teamLogo = teamLogo.trim();

      // If the teamLogo is a local file in /uploads/, also copy it to /public/marinerssc.webp
      try {
        if (teamLogo.startsWith('/uploads/')) {
          const sourcePath = path.join(process.cwd(), 'public', teamLogo.replace(/^\//, ''));
          const targetPath = path.join(process.cwd(), 'public', 'marinerssc.webp');
          if (fs.existsSync(sourcePath)) {
            // Backup original default once if not already backed up
            const backupPath = path.join(process.cwd(), 'public', 'marinerssc_default.webp');
            if (!fs.existsSync(backupPath) && fs.existsSync(targetPath)) {
              fs.copyFileSync(targetPath, backupPath);
            }
            fs.copyFileSync(sourcePath, targetPath);
          }
        }
      } catch (copyErr) {
        console.warn('Error syncing marinerssc.webp:', copyErr);
      }
    }

    if (loginWallpaper !== undefined && typeof loginWallpaper === 'string') {
      updateData.loginWallpaper = loginWallpaper.trim() || '/newposter.webp';
    }

    if (adminWallpaper !== undefined && typeof adminWallpaper === 'string') {
      updateData.adminWallpaper = adminWallpaper.trim() || '/stadium_hero2.png';
    }

    // Changing Security PIN
    if (newPin) {
      const cleanNewPin = String(newPin).trim();
      if (cleanNewPin.length < 4 || cleanNewPin.length > 8) {
        return NextResponse.json({ error: 'PIN baru harus terdiri dari 4 hingga 8 digit angka' }, { status: 400 });
      }

      const expectedPin = currentSetting?.securityPin || '1234';
      if (String(currentPin).trim() !== String(expectedPin).trim()) {
        return NextResponse.json({ error: 'PIN lama salah' }, { status: 400 });
      }

      updateData.securityPin = cleanNewPin;
    }

    const updated = await (prisma as any).systemSetting.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        teamName: updateData.teamName || 'Mariners SC',
        teamLogo: updateData.teamLogo || '/marinerssc.webp',
        loginWallpaper: updateData.loginWallpaper || '/newposter.webp',
        adminWallpaper: updateData.adminWallpaper || '/stadium_hero2.png',
        securityPin: updateData.securityPin || '1234',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan tim berhasil disimpan',
      settings: {
        teamName: updated.teamName,
        teamLogo: updated.teamLogo,
        loginWallpaper: updated.loginWallpaper,
        adminWallpaper: updated.adminWallpaper,
      },
    });
  } catch (err: any) {
    console.error('Error updating system settings:', err);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan tim' }, { status: 500 });
  }
}
