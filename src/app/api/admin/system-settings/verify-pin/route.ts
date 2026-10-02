import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get('team_mgmt_unlocked')?.value === 'true';

  return NextResponse.json({ unlocked });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { pin } = await req.json();
    if (!pin) {
      return NextResponse.json({ error: 'PIN wajib diisi' }, { status: 400 });
    }

    let expectedPin = '1234';
    try {
      const setting = await (prisma as any).systemSetting?.findUnique({
        where: { id: 'default' },
      });
      if (setting?.securityPin) {
        expectedPin = setting.securityPin;
      }
    } catch (dbErr) {
      console.warn('DB error fetching systemSetting in verify-pin, using fallback 1234:', dbErr);
    }

    if (String(pin).trim() !== String(expectedPin).trim()) {
      return NextResponse.json({ error: 'PIN keamanan salah' }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set('team_mgmt_unlocked', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7200, // 2 hours
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'PIN berhasil diverifikasi' });
  } catch (err: any) {
    console.error('Error verifying PIN:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('team_mgmt_unlocked');
  return NextResponse.json({ success: true, message: 'Portal berhasil dikunci kembali' });
}
