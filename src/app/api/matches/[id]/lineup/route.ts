import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { recalculateAllPlayerStats } from '@/lib/stats';

function parseNullableInt(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

function parseIntDef(val: any, def: number): number {
  if (val === null || val === undefined || val === '') return def;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? def : parsed;
}

function parseNullableFloat(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: matchId } = await params;
    const { lineups, events, formation, status, homeScore, awayScore, duration, isLiveEnabled } = await req.json();

    const updateData: any = {};
    if (formation !== undefined) updateData.formation = formation;
    if (status !== undefined) updateData.status = status;
    if (homeScore !== undefined) updateData.homeScore = parseNullableInt(homeScore);
    if (awayScore !== undefined) updateData.awayScore = parseNullableInt(awayScore);
    if (duration !== undefined) updateData.duration = parseIntDef(duration, 60);
    if (isLiveEnabled !== undefined) updateData.isLiveEnabled = Boolean(isLiveEnabled);

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
          x: parseNullableFloat(l.x),
          y: parseNullableFloat(l.y),
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
          minute: parseIntDef(e.minute, 0),
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
  } catch (error: any) {
    console.error('Lineup Save Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui susunan pemain & event' }, { status: 500 });
  }
}
