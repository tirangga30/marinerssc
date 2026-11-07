import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import PlayerProfileView from '@/components/player/PlayerProfileView';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function PlayerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ season?: string }>;
}) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : undefined;

  let currentSeasonObj: any = null;
  let latestSeasonObj: any = null;
  let player: any = null;
  let allMatches: any[] = [];

  let member: any = null;
  let playerCardBg = '/bgprofil2.webp';
  let playerDefaultPhoto = '/playertemplate.webp';

  try {
    const systemSetting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    }).catch(() => null);
    if (systemSetting?.playerCardBg) {
      playerCardBg = systemSetting.playerCardBg;
    }
    if (systemSetting?.playerDefaultPhoto) {
      playerDefaultPhoto = systemSetting.playerDefaultPhoto;
    }

    currentSeasonObj = await prisma.season.findFirst({
      where: { isCurrent: true },
      select: { name: true, year: true },
    });
    latestSeasonObj = await prisma.season.findFirst({
      orderBy: { year: 'desc' },
      select: { name: true, year: true },
    });

    player = await prisma.player.findUnique({
      where: { slug },
      include: {
        member: true,
        seasons: { select: { id: true, name: true, year: true } },
        events: {
          select: {
            id: true,
            matchId: true,
            type: true,
            minute: true,
            playerId: true,
            assistPlayerId: true,
          },
        },
        assistedEvents: {
          select: {
            id: true,
            matchId: true,
            type: true,
            minute: true,
            playerId: true,
            assistPlayerId: true,
          },
        },
      },
    });

    if (player) {
      allMatches = await prisma.footballMatch.findMany({
        select: {
          id: true,
          opponentName: true,
          opponentLogo: true,
          matchDate: true,
          competition: true,
          stage: true,
          seasonName: true,
          venue: true,
          isHome: true,
          homeScore: true,
          awayScore: true,
          status: true,
          duration: true,
          lineups: {
            where: { playerId: player.id },
            select: { id: true, isStarter: true, playerId: true },
          },
          attendances: {
            where: { playerId: player.id },
            select: {
              id: true,
              status: true,
              declineReason: true,
              playerId: true,
              invitedAt: true,
              isLateDecline: true,
              declinedAt: true,
            },
          },
          events: {
            select: {
              id: true,
              type: true,
              minute: true,
              playerId: true,
              assistPlayerId: true,
            },
          },
        },
        orderBy: { matchDate: 'desc' },
      });

      member = player.member || await prisma.member.findFirst({
        where: {
          OR: [
            { playerId: player.id },
            { fullName: player.name },
          ],
        },
      });
    }
  } catch (error) {
    console.error('Database error in PlayerDetailPage:', error);
  }

  if (!player || player.isGuest) notFound();

  const primarySeason = currentSeasonObj?.name || latestSeasonObj?.name || '2027';

  const nowMs = new Date().getTime();

  // All matches played by the club that have started or finished
  const activeMatches = (allMatches || []).filter((m: any) => {
    if (m.status === 'finished') return true;
    const hasFT = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
    if (hasFT) return true;
    const matchStartMs = new Date(m.matchDate).getTime();
    return !isNaN(matchStartMs) && nowMs >= matchStartMs;
  });

  return (
    <PlayerProfileView
      player={player}
      activeMatches={activeMatches}
      member={member}
      activeSeasonName={primarySeason}
      playerCardBg={playerCardBg}
      playerDefaultPhoto={playerDefaultPhoto}
      initialSeason={sParams?.season}
    />
  );
}
