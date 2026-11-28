import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { calculatePlayerPerformance } from '@/lib/performancePoints';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      const attendances = await prisma.matchAttendance.findMany({
        where: { matchId },
        include: { player: true },
        orderBy: { createdAt: 'asc' },
      });
      return NextResponse.json(attendances);
    }

    const [attendance, match, allMatches] = await Promise.all([
      prisma.matchAttendance.findFirst({
        where: {
          matchId,
          OR: [
            { playerId },
            { player: { slug: playerId } },
          ],
        },
        include: {
          player: true,
        },
      }),
      prisma.footballMatch.findUnique({
        where: { id: matchId },
        select: { seasonName: true, inviteNotes: true, statusJourney: true },
      }),
      prisma.footballMatch.findMany({
        select: {
          id: true,
          opponentName: true,
          stage: true,
          matchDate: true,
          seasonName: true,
          lineups: {
            where: { OR: [{ playerId }, { player: { slug: playerId } }] },
            select: { playerId: true, isStarter: true },
          },
          attendances: {
            where: { OR: [{ playerId }, { player: { slug: playerId } }] },
            select: {
              playerId: true,
              status: true,
              declineReason: true,
              invitedAt: true,
              isLateDecline: true,
              declinedAt: true,
              isManualConfirm: true,
            },
          },
          events: {
            where: {
              OR: [
                { playerId },
                { player: { slug: playerId } },
                { assistPlayerId: playerId },
                { assistPlayer: { slug: playerId } },
              ],
            },
            select: { type: true, minute: true, playerId: true, assistPlayerId: true },
          },
        },
        orderBy: { matchDate: 'desc' },
      }),
    ]);

    let playerObj = attendance?.player || null;
    if (!playerObj) {
      playerObj = await prisma.player.findFirst({
        where: {
          OR: [{ id: playerId }, { slug: playerId }],
        },
      });
    }

    const targetSeason = match?.seasonName || '2026';
    let performance: any = null;
    if (playerObj) {
      try {
        performance = calculatePlayerPerformance(playerObj, allMatches, targetSeason);
      } catch (err) {
        console.error('Failed to calculate player performance:', err);
      }
    }

    return NextResponse.json({
      attendance: attendance || null,
      player: playerObj,
      performance,
      inviteNotes: match?.inviteNotes || null,
      statusJourney: match?.statusJourney || null,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Gagal mengambil data kehadiran' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params;
    const body = await req.json();

    const { playerId, status, declineReason } = body;

    if (!playerId) {
      return NextResponse.json({ error: 'ID pemain wajib disertakan' }, { status: 400 });
    }

    if (!['CONFIRMED', 'DECLINED'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid (harus CONFIRMED atau DECLINED)' }, { status: 400 });
    }

    const [match, player] = await Promise.all([
      prisma.footballMatch.findUnique({ where: { id: matchId } }),
      prisma.player.findFirst({
        where: {
          OR: [{ id: playerId }, { slug: playerId }],
        },
      }),
    ]);

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    if (!player) {
      return NextResponse.json({ error: 'Data pemain tidak ditemukan' }, { status: 404 });
    }

    // 1. Validasi waktu pertandingan (Invite kedaluwarsa jika waktu sudah tiba atau laga selesai)
    const now = new Date();
    const matchTime = new Date(match.matchDate);
    if (!isNaN(matchTime.getTime()) && now.getTime() >= matchTime.getTime()) {
      return NextResponse.json(
        { error: 'Waktu pertandingan telah tiba. Undangan konfirmasi kehadiran sudah ditutup.' },
        { status: 400 }
      );
    }
    if (match.status === 'finished') {
      return NextResponse.json(
        { error: 'Pertandingan telah selesai. Undangan konfirmasi kehadiran sudah ditutup.' },
        { status: 400 }
      );
    }

    const existing = await prisma.matchAttendance.findFirst({
      where: {
        matchId: match.id,
        playerId: player.id,
      },
    });

    const isWithin1HourBeforeKickoff =
      !isNaN(matchTime.getTime()) &&
      matchTime.getTime() - now.getTime() <= 3600 * 1000 &&
      now.getTime() < matchTime.getTime();
    const isLate = Boolean(body.isLateDecline || isWithin1HourBeforeKickoff);

    let attendance;
    if (existing) {
      attendance = await prisma.matchAttendance.update({
        where: { id: existing.id },
        data: {
          status,
          declineReason: status === 'DECLINED' ? (declineReason || null) : null,
          isLateDecline: status === 'DECLINED' ? isLate : false,
          declinedAt: status === 'DECLINED' ? new Date() : null,
          playerName: player.name,
          updatedAt: new Date(),
        },
      });
    } else {
      attendance = await prisma.matchAttendance.create({
        data: {
          matchId: match.id,
          playerId: player.id,
          playerType: 'SQUAD',
          playerName: player.name,
          status,
          declineReason: status === 'DECLINED' ? (declineReason || null) : null,
          isLateDecline: status === 'DECLINED' ? isLate : false,
          declinedAt: status === 'DECLINED' ? new Date() : null,
        },
      });
    }

    // 2. Jika Lineup sudah tersedia dan pemain konfirmasi IKUT, otomatis masukkan ke Cadangan (Substitution)
    if (status === 'CONFIRMED') {
      const lineupCount = await prisma.matchLineup.count({
        where: { matchId: match.id },
      });
      if (lineupCount > 0) {
        const existingLineup = await prisma.matchLineup.findFirst({
          where: {
            matchId: match.id,
            playerId: player.id,
          },
        });
        if (!existingLineup) {
          await prisma.matchLineup.create({
            data: {
              matchId: match.id,
              playerId: player.id,
              isStarter: false,
              pitchPosition: 'SUB',
              positionName: 'Substitute',
            },
          });
        }
      }
    } else if (status === 'DECLINED') {
      // Jika membatalkan kehadiran, hapus dari cadangan (bukan starter) jika ada
      await prisma.matchLineup.deleteMany({
        where: {
          matchId: match.id,
          playerId: player.id,
          isStarter: false,
        },
      });
    }

    // Revalidate match details and matches list
    try {
      revalidatePath(`/matches/${matchId}`);
      revalidatePath('/matches');
    } catch (e) {
      // ignore in non-request context
    }

    return NextResponse.json({
      success: true,
      attendance,
      player: {
        id: player.id,
        name: player.name,
        number: player.number,
        position: player.position,
      },
    });
  } catch (error: any) {
    console.error('Error updating attendance:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status kehadiran' }, { status: 500 });
  }
}

