import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;

    const attendances = await prisma.matchAttendance.findMany({
      where: { matchId },
      include: {
        player: true,
        member: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const allSquadPlayers = await prisma.player.findMany({
      where: { isGuest: false },
      orderBy: { number: 'asc' },
    });

    const allMembers = await prisma.member.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { jerseyNumber: 'asc' },
    });

    return NextResponse.json({
      attendances,
      allSquadPlayers,
      allMembers,
    });
  } catch (error) {
    console.error('Error fetching match attendance:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: matchId } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === 'INVITE_MEMBER') {
      const { memberId } = body;
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });

      const existing = await prisma.matchAttendance.findFirst({
        where: { matchId, memberId },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: { status: 'INVITED', declineReason: null },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            matchId,
            memberId,
            playerType: 'MEMBER',
            playerName: member.fullName,
            status: 'INVITED', // Menunggu konfirmasi member di web portal
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_SQUAD_PLAYER') {
      const { playerId } = body;
      const player = await prisma.player.findUnique({ where: { id: playerId } });
      if (!player) return NextResponse.json({ error: 'Pemain tidak ditemukan' }, { status: 404 });

      const existing = await prisma.matchAttendance.findFirst({
        where: { matchId, playerId },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: { status: 'CONFIRMED' },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            matchId,
            playerId,
            playerType: 'SQUAD',
            playerName: player.name,
            status: 'CONFIRMED',
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'ADD_GUEST_PLAYER') {
      const { name, position = 'FW', number = 0, photoUrl = '/defaultplayer.png' } = body;
      if (!name) return NextResponse.json({ error: 'Nama pemain tamu wajib diisi' }, { status: 400 });

      // Create guest player in Player table
      let baseSlug = `guest-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      let slug = `${baseSlug}-${Date.now()}`;

      // Pick an unused guest number
      let num = number ? parseInt(number) : 0;
      if (num === 0) {
        let testNum = 90;
        while (await prisma.player.findUnique({ where: { number: testNum } })) {
          testNum++;
        }
        num = testNum;
      }

      const guestPlayer = await prisma.player.create({
        data: {
          name: name.trim(),
          slug,
          number: num,
          position: position.toUpperCase(),
          photoUrl,
          isGuest: true,
          guestMatchId: matchId,
          bio: 'Pemain Tamu (Guest Player)',
        },
      });

      // Add to attendance
      await prisma.matchAttendance.create({
        data: {
          matchId,
          playerId: guestPlayer.id,
          playerType: 'GUEST',
          playerName: guestPlayer.name,
          status: 'CONFIRMED',
        },
      });

      return NextResponse.json({ success: true, player: guestPlayer });
    }

    if (action === 'REMOVE_ATTENDANCE') {
      const { attendanceId } = body;
      await prisma.matchAttendance.delete({
        where: { id: attendanceId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'SET_STATUS') {
      const { attendanceId, status } = body;
      await prisma.matchAttendance.update({
        where: { id: attendanceId },
        data: { status },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error) {
    console.error('Error handling match attendance:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
