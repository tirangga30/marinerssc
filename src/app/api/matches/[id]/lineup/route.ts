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
    const { lineups, events, formation } = await req.json();

    if (formation) {
      await prisma.footballMatch.update({
        where: { id: matchId },
        data: { formation },
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
