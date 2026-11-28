import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: matchId } = await params;
    const { pin } = await req.json();

    if (!pin) {
      return NextResponse.json({ error: 'PIN wajib diisi' }, { status: 400 });
    }

    // Check match kickoff status
    const match = await prisma.footballMatch.findUnique({
      where: { id: matchId },
      select: { matchDate: true, status: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    if (match.status === 'live' || match.status === 'finished') {
      return NextResponse.json({ error: 'Pengaturan formasi ditutup karena laga sudah dimulai atau selesai' }, { status: 403 });
    }

    if (match.matchDate && new Date() >= new Date(match.matchDate)) {
      return NextResponse.json({ error: 'Waktu kickoff pertandingan telah lewat' }, { status: 403 });
    }

    // Fetch system security PIN (configured in Team Management)
    let expectedPin = '1234';
    try {
      const setting = await (prisma as any).systemSetting?.findUnique({
        where: { id: 'default' },
      });
      if (setting?.securityPin) {
        expectedPin = setting.securityPin;
      }
    } catch (dbErr) {
      console.warn('DB error reading securityPin:', dbErr);
    }

    if (String(pin).trim() !== String(expectedPin).trim()) {
      return NextResponse.json({ error: 'PIN keamanan salah' }, { status: 403 });
    }

    return NextResponse.json({ success: true, message: 'PIN berhasil diverifikasi' });
  } catch (err: any) {
    console.error('Error verifying lineup PIN:', err);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
