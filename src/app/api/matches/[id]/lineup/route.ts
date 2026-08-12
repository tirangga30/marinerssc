import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { recalculateAllPlayerStats } from '@/lib/stats';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: matchId } = await params;
    const { lineups, events, formation, status, homeScore, awayScore, duration } = await req.json();

    const updateData: any = {};
    if (formation !== undefined) updateData.formation = formation;
    if (status !== undefined) updateData.status = status;
    if (homeScore !== undefined) updateData.homeScore = homeScore === '' ? null : parseInt(homeScore);
    if (awayScore !== undefined) updateData.awayScore = awayScore === '' ? null : parseInt(awayScore);
    if (duration !== undefined) updateData.duration = parseInt(duration);

    if (Object.keys(updateData).length > 0) {
      await prisma.footballMatch.update({
        where: { id: matchId },
        data: updateData,
      });
    }

    // Reset old lineups and events
    await prisma.matchLineup.deleteMany({ where: { matchId } });
    await prisma.matchEvent.deleteMany({ where: { matchId } });

    // Insert new lineups
    if (Array.isArray(lineups) && lineups.length > 0) {
      await prisma.matchLineup.createMany({
        data: lineups.map((l: any) => ({
          matchId,
          playerId: l.playerId,
          isStarter: Boolean(l.isStarter),
          pitchPosition: l.pitchPosition || 'SUB',
          positionName: l.positionName || 'Substitute',
          x: l.x !== undefined ? parseFloat(l.x) : null,
          y: l.y !== undefined ? parseFloat(l.y) : null,
        })),
      });
    }

    // Insert new events
    if (Array.isArray(events) && events.length > 0) {
      await prisma.matchEvent.createMany({
        data: events.map((e: any) => ({
          matchId,
          playerId: e.playerId,
          assistPlayerId: e.assistPlayerId || null,
          type: e.type,
          minute: parseInt(e.minute),
          description: e.description || '',
        })),
      });
    }

    await recalculateAllPlayerStats();

    const updatedMatch = await prisma.footballMatch.findUnique({
      where: { id: matchId },
      include: {
        lineups: { include: { player: true } },
        events: { include: { player: true, assistPlayer: true } },
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Gagal memperbarui susunan pemain & event' }, { status: 500 });
  }
}
