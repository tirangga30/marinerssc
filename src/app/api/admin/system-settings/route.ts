import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
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
      teamName: setting?.teamName || 'TEAM',
      teamLogo: setting?.teamLogo || '/defaultteam.webp',
      clubType: setting?.clubType || 'SOCCER CLUB',
      playerDefaultPhoto: setting?.playerDefaultPhoto || '/playertemplate.webp',
      loginWallpaper: setting?.loginWallpaper || '/NYCOMP.webp',
      adminWallpaper: setting?.adminWallpaper || '/stadium.webp',
      playerCardBg: setting?.playerCardBg || '/bgprofil2.webp',
      hasCustomPin: setting ? setting.securityPin !== '1234' : false,
      isCommunityEnabled: setting ? setting.isCommunityEnabled !== false : true,
      showHeroOverlay: setting ? Boolean(setting.showHeroOverlay) : false,
      heroTagline: setting?.heroTagline || 'SOCCER CLUB',
      heroSubtitle: setting?.heroSubtitle || 'Lebih dari sekadar sepak bola.',
      heroCtaText: setting?.heroCtaText || 'LIHAT TIM',
      whatsappMode: setting?.whatsappMode || 'disabled',
      whatsappToken: setting?.whatsappToken || '',
      whatsappConnectedPhone: setting?.whatsappConnectedPhone || '',
    });
  } catch (err: any) {
    console.error('Error fetching system settings:', err);
    return NextResponse.json({
      teamName: 'TEAM',
      teamLogo: '/defaultteam.webp',
      clubType: 'SOCCER CLUB',
      playerDefaultPhoto: '/playertemplate.webp',
      loginWallpaper: '/NYCOMP.webp',
      adminWallpaper: '/stadium.webp',
      playerCardBg: '/bgprofil2.webp',
      hasCustomPin: false,
      isCommunityEnabled: true,
      showHeroOverlay: false,
      heroTagline: 'SOCCER CLUB',
      heroSubtitle: 'Lebih dari sekadar sepak bola.',
      heroCtaText: 'LIHAT TIM',
      whatsappMode: 'disabled',
      whatsappToken: '',
      whatsappConnectedPhone: '',
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
    const {
      teamName, teamLogo, clubType, playerDefaultPhoto, loginWallpaper, adminWallpaper,
      playerCardBg, isCommunityEnabled, showHeroOverlay,
      heroTagline, heroSubtitle, heroCtaText,
      whatsappMode, whatsappToken,
      currentPin, newPin
    } = body;

    const currentSetting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const updateData: any = {};

    if (clubType !== undefined && typeof clubType === 'string') {
      const cleanClubType = clubType.trim().toUpperCase();
      updateData.clubType = cleanClubType === 'FOOTBALL CLUB' ? 'FOOTBALL CLUB' : 'SOCCER CLUB';
    }

    if (playerDefaultPhoto !== undefined && typeof playerDefaultPhoto === 'string') {
      updateData.playerDefaultPhoto = playerDefaultPhoto.trim() || '/playertemplate.webp';
    }

    if (isCommunityEnabled !== undefined) {
      updateData.isCommunityEnabled = Boolean(isCommunityEnabled);
    }

    if (showHeroOverlay !== undefined) {
      updateData.showHeroOverlay = Boolean(showHeroOverlay);
    }

    if (heroTagline !== undefined && typeof heroTagline === 'string') {
      updateData.heroTagline = heroTagline.trim() || 'SOCCER CLUB';
    }

    if (heroSubtitle !== undefined && typeof heroSubtitle === 'string') {
      updateData.heroSubtitle = heroSubtitle.trim() || 'Lebih dari sekadar sepak bola.';
    }

    if (heroCtaText !== undefined && typeof heroCtaText === 'string') {
      updateData.heroCtaText = heroCtaText.trim() || 'LIHAT TIM';
    }

    if (playerCardBg !== undefined && typeof playerCardBg === 'string') {
      updateData.playerCardBg = playerCardBg.trim() || '/bgprofil2.webp';
    }

    if (teamName !== undefined && typeof teamName === 'string') {
      updateData.teamName = teamName.trim() || 'TEAM';
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
      updateData.loginWallpaper = loginWallpaper.trim() || '/NYCOMP.webp';
    }

    if (adminWallpaper !== undefined && typeof adminWallpaper === 'string') {
      updateData.adminWallpaper = adminWallpaper.trim() || '/stadium.webp';
    }

    if (whatsappMode !== undefined && typeof whatsappMode === 'string') {
      const cleanMode = whatsappMode.trim().toLowerCase();
      updateData.whatsappMode = cleanMode === 'scan' ? 'scan' : 'disabled';
    }

    if (whatsappToken !== undefined && typeof whatsappToken === 'string') {
      updateData.whatsappToken = whatsappToken.trim();
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
        teamName: updateData.teamName || 'TEAM',
        teamLogo: updateData.teamLogo || '/defaultteam.webp',
        clubType: updateData.clubType || 'SOCCER CLUB',
        playerDefaultPhoto: updateData.playerDefaultPhoto || '/playertemplate.webp',
        loginWallpaper: updateData.loginWallpaper || '/NYCOMP.webp',
        adminWallpaper: updateData.adminWallpaper || '/stadium.webp',
        playerCardBg: updateData.playerCardBg || '/bgprofil2.webp',
        securityPin: updateData.securityPin || '1234',
        isCommunityEnabled: updateData.isCommunityEnabled !== undefined ? updateData.isCommunityEnabled : true,
        showHeroOverlay: updateData.showHeroOverlay !== undefined ? updateData.showHeroOverlay : false,
        heroTagline: updateData.heroTagline || 'SOCCER CLUB',
        heroSubtitle: updateData.heroSubtitle || 'Lebih dari sekadar sepak bola.',
        heroCtaText: updateData.heroCtaText || 'LIHAT TIM',
        whatsappMode: updateData.whatsappMode || 'disabled',
        whatsappToken: updateData.whatsappToken || null,
      },
    });

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/matches');
      revalidatePath('/players');
      revalidatePath('/stats');
    } catch (revErr) {
      console.warn('Revalidation notice:', revErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan tim berhasil disimpan',
      settings: {
        teamName: updated.teamName,
        teamLogo: updated.teamLogo,
        clubType: updated.clubType,
        playerDefaultPhoto: updated.playerDefaultPhoto,
        loginWallpaper: updated.loginWallpaper,
        adminWallpaper: updated.adminWallpaper,
        playerCardBg: updated.playerCardBg,
        showHeroOverlay: updated.showHeroOverlay,
        heroTagline: updated.heroTagline,
        heroSubtitle: updated.heroSubtitle,
        heroCtaText: updated.heroCtaText,
        whatsappMode: updated.whatsappMode,
        whatsappToken: updated.whatsappToken,
        whatsappConnectedPhone: updated.whatsappConnectedPhone,
      },
    });
  } catch (err: any) {
    console.error('Error updating system settings:', err);
    return NextResponse.json({ error: 'Gagal memperbarui pengaturan tim' }, { status: 500 });
  }
}
