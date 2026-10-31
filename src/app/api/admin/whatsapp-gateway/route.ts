import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { ensureDbColumns } from '@/lib/dbMigrations';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbColumns().catch(() => null);

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const mode = setting?.whatsappMode || 'disabled';
    const token = setting?.whatsappToken?.trim() || '';

    if (mode === 'disabled' || !token) {
      return NextResponse.json({
        mode,
        token: token ? '•'.repeat(Math.max(0, token.length - 4)) + token.slice(-4) : '',
        rawToken: token,
        status: 'disconnected',
        device_status: 'disconnected',
        device: setting?.whatsappConnectedPhone || null,
        message: 'WhatsApp Gateway nonaktif atau token belum dikonfigurasi',
      });
    }

    // Probe Fonnte device status
    try {
      const fRes = await fetch('https://api.fonnte.com/device', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        cache: 'no-store',
      });

      const fData = await fRes.json().catch(() => null);

      if (fRes.ok && fData) {
        const isConnected = fData.device_status === 'connect';
        const connectedPhone = fData.device || fData.name || null;

        // Update connected phone in DB if changed
        if (isConnected && connectedPhone && connectedPhone !== setting?.whatsappConnectedPhone) {
          await (prisma as any).systemSetting.update({
            where: { id: 'default' },
            data: { whatsappConnectedPhone: String(connectedPhone) },
          }).catch(() => null);
        }

        return NextResponse.json({
          mode,
          token: token ? '•'.repeat(Math.max(0, token.length - 4)) + token.slice(-4) : '',
          rawToken: token,
          status: isConnected ? 'connected' : 'disconnected',
          device_status: fData.device_status,
          device: connectedPhone,
          name: fData.name,
          quota: fData.quota,
          expired: fData.expired,
        });
      }
    } catch (e: any) {
      console.warn('Fonnte device check warning:', e.message);
    }

    return NextResponse.json({
      mode,
      token: token ? '•'.repeat(Math.max(0, token.length - 4)) + token.slice(-4) : '',
      rawToken: token,
      status: 'disconnected',
      device_status: 'disconnected',
      device: setting?.whatsappConnectedPhone || null,
      message: 'Gagal menghubungi server WhatsApp Gateway',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbColumns().catch(() => null);

    const body = await req.json();
    const { action, token: customToken } = body;

    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const token = (customToken || setting?.whatsappToken || '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Token WhatsApp Gateway wajib diisi terlebih dahulu' },
        { status: 400 }
      );
    }

    if (action === 'qr') {
      // Request QR Code from Fonnte
      const fRes = await fetch('https://api.fonnte.com/qr', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        cache: 'no-store',
      });

      const fData = await fRes.json().catch(() => null);

      if (!fRes.ok || !fData) {
        return NextResponse.json(
          { error: 'Gagal membuat QR Code dari WhatsApp Gateway' },
          { status: 502 }
        );
      }

      // Fonnte returns url with base64 data image or qr string
      return NextResponse.json({
        success: Boolean(fData.status),
        url: fData.url || null, // data:image/png;base64,...
        qr: fData.qr || null,
        device_status: fData.device_status || 'disconnected',
        message: fData.reason || fData.detail || 'Scan QR Code menggunakan WhatsApp di HP Anda',
      });
    }

    if (action === 'disconnect') {
      // Disconnect current device from Fonnte
      const fRes = await fetch('https://api.fonnte.com/disconnect', {
        method: 'POST',
        headers: {
          Authorization: token,
        },
        cache: 'no-store',
      });

      const fData = await fRes.json().catch(() => null);

      // Clear connected phone in DB
      await (prisma as any).systemSetting.update({
        where: { id: 'default' },
        data: { whatsappConnectedPhone: null },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: fData?.detail || 'Perangkat WhatsApp berhasil diputuskan',
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

