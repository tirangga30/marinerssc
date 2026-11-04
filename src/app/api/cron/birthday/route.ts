import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ensureDbColumns } from '@/lib/dbMigrations';

export const dynamic = 'force-dynamic';

export function buildBirthdayMessage(playerName: string, age: number, teamName: string = 'MARS') {
  const ageText = age > 0 ? `Genap berusia ${age} tahun! 🥳🔥` : `merayakan hari ulang tahunnya! 🥳🔥`;
  const signature = (teamName || 'MARS').trim();

  return `🎂 HBD *${playerName}* 🎉⚽\n\nHari ini, ${playerName} ${ageText}\n\nSemoga panjang umur, sehat selalu, murah rezeki, makin gacor di lapangan, dan terus membawa kemenangan bagi tim! \n\nYuk beri ucapan dan doa terbaik buat ${playerName} di grup ini! 👏🎂\n\n*${signature}*`;
}

async function verifyAuth(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  // If Vercel CRON_SECRET is configured, check bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Allow admin session
  const admin = await getAdminSession();
  if (admin) {
    return true;
  }

  // If no cron secret is configured in env, allow Vercel cron invocation
  if (!cronSecret) {
    return true;
  }

  return false;
}

export async function GET(req: Request) {
  try {
    const isAuthorized = await verifyAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDbColumns().catch(() => null);

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      return NextResponse.json({ success: false, message: 'System setting tidak ditemukan' });
    }

    if (setting.whatsappMode !== 'scan' || !setting.whatsappToken?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'WhatsApp Gateway belum diaktifkan (Mode Scan QR) atau token belum diatur',
      });
    }

    if (setting.whatsappBirthdayEnabled === false) {
      return NextResponse.json({
        success: false,
        message: 'Pengiriman ucapan ulang tahun otomatis ke WhatsApp grup sedang dinonaktifkan',
      });
    }

    const targetGroupId = setting.whatsappBirthdayGroupId?.trim();
    if (!targetGroupId) {
      return NextResponse.json({
        success: false,
        message: 'Target Grup WhatsApp belum diisi di Team Management',
      });
    }

    // Hitung tanggal hari ini dalam WIB (Asia/Jakarta)
    const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const currentDay = nowWib.getDate();
    const currentMonth = nowWib.getMonth();
    const currentYear = nowWib.getFullYear();

    // Query semua pemain yang memiliki tanggal lahir
    const players = await prisma.player.findMany({
      where: {
        birthDate: { not: null },
        NOT: { id: 'unknown-player' },
      },
      select: {
        id: true,
        name: true,
        number: true,
        position: true,
        birthDate: true,
      },
    });

    const birthdayPlayers = players.filter((p) => {
      if (!p.birthDate) return false;
      const bDate = new Date(p.birthDate);
      return bDate.getUTCDate() === currentDay && bDate.getUTCMonth() === currentMonth;
    });

    if (birthdayPlayers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada pemain yang berulang tahun hari ini',
        dateWib: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
        count: 0,
      });
    }

    const results = [];
    for (const player of birthdayPlayers) {
      const bYear = new Date(player.birthDate!).getUTCFullYear();
      let age = currentYear - bYear;
      if (age <= 0 || isNaN(age)) age = 0;

      const message = buildBirthdayMessage(player.name, age, setting.teamName || 'MARS');

      try {
        const fRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            Authorization: setting.whatsappToken.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            target: targetGroupId,
            message: message,
          }),
        });

        const fData = await fRes.json().catch(() => null);
        results.push({
          playerId: player.id,
          playerName: player.name,
          age,
          status: fRes.ok && fData?.status ? 'sent' : 'failed',
          response: fData,
        });
      } catch (err: any) {
        results.push({
          playerId: player.id,
          playerName: player.name,
          age,
          status: 'failed',
          error: err.message,
        });
      }

      // Delay 1.2 detik antar pengiriman jika ada lebih dari 1 pemain
      if (birthdayPlayers.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses ucapan ulang tahun untuk ${birthdayPlayers.length} pemain`,
      dateWib: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`,
      targetGroup: targetGroupId,
      results,
    });
  } catch (error: any) {
    console.error('Error running birthday cron:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

// POST: Digunakan untuk Test Kirim atau Trigger Manual oleh Admin
export async function POST(req: Request) {
  try {
    const isAuthorized = await verifyAuth(req);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDbColumns().catch(() => null);

    const body = await req.json().catch(() => ({}));
    const { test = false, targetGroupId: customGroupId, playerName, age } = body;

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      return NextResponse.json({ error: 'System setting tidak ditemukan' }, { status: 400 });
    }

    const token = setting.whatsappToken?.trim();
    if (!token) {
      return NextResponse.json({ error: 'Token WhatsApp Gateway belum diatur' }, { status: 400 });
    }

    const targetGroupId = (customGroupId || setting.whatsappBirthdayGroupId || '').trim();
    if (!targetGroupId) {
      return NextResponse.json({ error: 'Target Grup WhatsApp belum ditentukan' }, { status: 400 });
    }

    // Jika test kirim
    if (test) {
      const sampleName = playerName || 'Budi Pratama';
      const sampleAge = Number(age) || 24;
      const testMessage = buildBirthdayMessage(sampleName, sampleAge, setting.teamName || 'MARS');

      const fRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: targetGroupId,
          message: testMessage,
        }),
      });

      const fData = await fRes.json().catch(() => null);

      if (fRes.ok && fData?.status) {
        return NextResponse.json({
          success: true,
          message: `Pesan tes berhasil dikirim ke grup (${targetGroupId})!`,
          data: fData,
        });
      } else {
        return NextResponse.json({
          success: false,
          error: fData?.reason || fData?.detail || 'Gagal mengirim pesan tes ke grup',
          data: fData,
        }, { status: 400 });
      }
    }

    // Jika POST biasa tanpa flag test, jalankan logika hari ini
    return GET(req);
  } catch (error: any) {
    console.error('Error in birthday post handler:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

