import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMemberSession } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) {
      return NextResponse.json({ error: 'Sesi member tidak valid. Silakan login.' }, { status: 401 });
    }

    const { matchId, funMatchId, action, reason } = await req.json();

    if (!action || (!matchId && !funMatchId)) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
    }

    const statusValue = action === 'JOIN' ? 'CONFIRMED' : 'DECLINED';

    if (funMatchId) {
      // RSVP Fun Match
      const existing = await prisma.matchAttendance.findFirst({
        where: {
          funMatchId,
          memberId: session.memberId,
        },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: {
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Tidak bisa hadir') : null,
          },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            funMatchId,
            memberId: session.memberId,
            playerType: 'MEMBER',
            playerName: session.fullName,
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Tidak bisa hadir') : null,
          },
        });
      }
    } else if (matchId) {
      // Respond to Tim Utama invitation
      const existing = await prisma.matchAttendance.findFirst({
        where: {
          matchId,
          memberId: session.memberId,
        },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: {
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Menolak panggilan tim utama') : null,
          },
        });
      } else {
        // If not invited yet, create as confirmed/declined
        await prisma.matchAttendance.create({
          data: {
            matchId,
            memberId: session.memberId,
            playerType: 'MEMBER',
            playerName: session.fullName,
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Menolak panggilan tim utama') : null,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'JOIN' ? 'Konfirmasi kehadiran berhasil!' : 'Kehadiran dibatalkan / ditolak.',
      status: statusValue,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Gagal memproses konfirmasi kehadiran' }, { status: 500 });
  }
}
