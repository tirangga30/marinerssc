import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { recalculateAllPlayerStats } from '@/lib/stats';
import { revalidatePath } from 'next/cache';

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
    const { id: matchId } = await params;
    const body = await req.json();
    const { lineups, events, formation, status, homeScore, awayScore, duration, isLiveEnabled, nonSquadReasons, pin } = body;

    const session = await getAdminSession();
    let isAuthorized = Boolean(session);

    if (!isAuthorized && pin) {
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
      if (String(pin).trim() === String(expectedPin).trim()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Tidak sah: Sesi admin atau PIN keamanan diperlukan' }, { status: 401 });
    }

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

    // Reset old lineups
    await prisma.matchLineup.deleteMany({ where: { matchId } });
    if (events !== undefined) {
      await prisma.matchEvent.deleteMany({ where: { matchId } });
    }

    // Insert new lineups (pastikan setiap playerId unik, starters diprioritaskan)
    if (Array.isArray(lineups) && lineups.length > 0) {
      const seenPlayerIds = new Set<string>();
      const sanitizedLineups: any[] = [];

      // Starters first
      for (const l of lineups.filter((x: any) => x.isStarter)) {
        if (l.playerId && !seenPlayerIds.has(l.playerId)) {
          seenPlayerIds.add(l.playerId);
          sanitizedLineups.push(l);
        }
      }
      // Bench second (tidak boleh ada yang sudah masuk starter)
      for (const l of lineups.filter((x: any) => !x.isStarter)) {
        if (l.playerId && !seenPlayerIds.has(l.playerId)) {
          seenPlayerIds.add(l.playerId);
          sanitizedLineups.push(l);
        }
      }

      await prisma.matchLineup.createMany({
        data: sanitizedLineups.map((l: any) => ({
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
      const hasUnknown = events.some(
        (e: any) => e.playerId === 'unknown' || e.playerId === 'unknown-player' || e.assistPlayerId === 'unknown' || e.assistPlayerId === 'unknown-player'
      );
      if (hasUnknown) {
        await prisma.player.upsert({
          where: { id: 'unknown-player' },
          update: { isGuest: true, hidePhoto: true },
          create: {
            id: 'unknown-player',
            name: 'Tidak Diketahui',
            slug: 'tidak-diketahui',
            number: 0,
            position: 'FORWARD',
            photoUrl: '/playertemplate.webp',
            bio: 'Pemain Tidak Diketahui',
            isGuest: true,
            hidePhoto: true,
            status: 'Inactive',
          },
        });
      }

      await prisma.matchEvent.createMany({
        data: events.map((e: any) => ({
          matchId,
          playerId: (e.playerId === 'unknown' || e.playerId === 'unknown-player') ? 'unknown-player' : e.playerId,
          assistPlayerId: (e.assistPlayerId === 'unknown' || e.assistPlayerId === 'unknown-player')
            ? 'unknown-player'
            : (e.assistPlayerId || null),
          type: e.type,
          minute: parseIntDef(e.minute, 0),
          description: e.description || '',
        })),
      });
    }

    // Handle non-squad player reasons in MatchAttendance
    const activePlayerIds = new Set(Array.isArray(lineups) ? lineups.map((l: any) => l.playerId) : []);

    if (nonSquadReasons && typeof nonSquadReasons === 'object') {
      for (const [pId, reasonVal] of Object.entries(nonSquadReasons)) {
        if (activePlayerIds.has(pId)) continue;

        const reason = typeof reasonVal === 'string' ? reasonVal.trim() : '';
        const existing = await prisma.matchAttendance.findFirst({
          where: { matchId, playerId: pId },
        });

        if (reason && reason !== 'Tidak terdaftar' && reason !== 'Tidak masuk skuad') {
          if (existing) {
            await prisma.matchAttendance.update({
              where: { id: existing.id },
              data: {
                status: 'DECLINED',
                declineReason: reason,
              },
            });
          } else {
            const pRec = await prisma.player.findUnique({ where: { id: pId } });
            await prisma.matchAttendance.create({
              data: {
                matchId,
                playerId: pId,
                playerName: pRec?.name || 'Player',
                playerType: 'SQUAD',
                status: 'DECLINED',
                declineReason: reason,
              },
            });
          }
        } else {
          // If reset to "Tidak terdaftar" or empty
          if (existing) {
            await prisma.matchAttendance.update({
              where: { id: existing.id },
              data: {
                status: 'DECLINED',
                declineReason: (reason === 'Tidak terdaftar' || reason === 'Tidak masuk skuad') ? 'Tidak terdaftar' : null,
              },
            });
          }
        }
      }
    }

    // For active squad players in the lineup, clear any decline reasons
    if (activePlayerIds.size > 0) {
      await prisma.matchAttendance.updateMany({
        where: {
          matchId,
          playerId: { in: Array.from(activePlayerIds) },
          status: 'DECLINED',
        },
        data: {
          status: 'CONFIRMED',
          declineReason: null,
        },
      });
    }

    await recalculateAllPlayerStats();

    try {
      revalidatePath('/');
      revalidatePath('/players');
      revalidatePath('/players/[slug]', 'page');
      revalidatePath('/stats');
      revalidatePath('/matches');
      revalidatePath(`/matches/${matchId}`);
    } catch (revErr) {
      console.warn('Lineup revalidatePath warning:', revErr);
    }

    const updatedMatch = await prisma.footballMatch.findUnique({
      where: { id: matchId },
      include: {
        lineups: { include: { player: true } },
        events: { include: { player: true, assistPlayer: true } },
        attendances: true,
      },
    });

    return NextResponse.json(updatedMatch);
  } catch (error: any) {
    console.error('Lineup Save Error:', error);
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui susunan pemain & event' }, { status: 500 });
  }
}
