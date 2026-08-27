import React from 'react';
import { prisma } from '@/lib/db';
import { getMemberSession } from '@/lib/memberAuth';
import CommunityPortal from '@/components/CommunityPortal';

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const session = await getMemberSession();

  let memberData: any = null;
  let upcomingMainSquadInvitation: any = null;
  let declinedInvitations: any[] = [];

  if (session) {
    const rawMember = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        funMatchEvents: true,
        matchAttendances: {
          include: {
            funMatch: true,
            footballMatch: true,
          },
        },
        player: {
          include: {
            events: true,
            assistedEvents: true,
            lineups: {
              include: {
                match: {
                  include: {
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (rawMember) {
      // 1. Calculate from Fun Match Events
      const funGoals = (rawMember.funMatchEvents || []).filter(
        (e: any) => e.type === 'goal' || e.type === 'penalty'
      ).length;
      const funAssists = (rawMember.funMatchEvents || []).filter(
        (e: any) => e.type === 'assist'
      ).length;
      const funYellowCards = (rawMember.funMatchEvents || []).filter(
        (e: any) => e.type === 'yellow_card'
      ).length;
      const funRedCards = (rawMember.funMatchEvents || []).filter(
        (e: any) => e.type === 'red_card' || e.type === 'second_yellow'
      ).length;
      const funAppearances = (rawMember.matchAttendances || []).filter(
        (a: any) => a.funMatchId && a.status === 'CONFIRMED'
      ).length;

      // 2. Calculate from Tim Utama (if member called up / linked)
      const mainGoals = rawMember.player
        ? (rawMember.player.events || []).filter(
            (e: any) => e.type === 'goal' || e.type === 'penalty'
          ).length
        : 0;
      const mainAssists = rawMember.player
        ? (rawMember.player.events || []).filter((e: any) => e.type === 'assist').length +
          (rawMember.player.assistedEvents || []).filter((e: any) => e.type !== 'sub').length
        : 0;
      const mainYellowCards = rawMember.player
        ? (rawMember.player.events || []).filter((e: any) => e.type === 'yellow_card').length
        : 0;
      const mainRedCards = rawMember.player
        ? (rawMember.player.events || []).filter(
            (e: any) => e.type === 'red_card' || e.type === 'second_yellow'
          ).length
        : 0;
      const mainAppearances = rawMember.player
        ? (rawMember.player.lineups || []).filter((l: any) => {
            if (l.isStarter) return true;
            const matchEvents = l.match?.events || [];
            return matchEvents.some(
              (e: any) => e.type === 'sub' && e.playerId === rawMember.player?.id
            );
          }).length
        : (rawMember.matchAttendances || []).filter(
            (a: any) => a.matchId && a.status === 'CONFIRMED'
          ).length;

      const totalGoals = Math.max(rawMember.goals || 0, funGoals + mainGoals);
      const totalAssists = Math.max(rawMember.assists || 0, funAssists + mainAssists);
      const totalAppearances = Math.max(
        (rawMember.funAppearances || 0) + (rawMember.mainAppearances || 0),
        funAppearances + mainAppearances
      );
      const totalYellowCards = Math.max(
        rawMember.yellowCards || 0,
        funYellowCards + mainYellowCards
      );
      const totalRedCards = Math.max(
        rawMember.redCards || 0,
        funRedCards + mainRedCards
      );

      memberData = {
        ...rawMember,
        totalGoals,
        totalAssists,
        totalAppearances,
        totalYellowCards,
        totalRedCards,
        funAppearances,
        mainAppearances,
      };
    }

    // Check if there is an upcoming main squad match where this member is invited
    const now = new Date();
    const upcomingInvitation = await prisma.matchAttendance.findFirst({
      where: {
        memberId: session.memberId,
        matchId: { not: null },
        footballMatch: {
          matchDate: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) }, // recent or upcoming
        },
      },
      include: {
        footballMatch: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (upcomingInvitation) {
      upcomingMainSquadInvitation = upcomingInvitation;
    }

    // Fetch declined invitations
    declinedInvitations = await prisma.matchAttendance.findMany({
      where: {
        memberId: session.memberId,
        matchId: { not: null },
        status: 'DECLINED',
      },
      include: {
        footballMatch: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  }

  // Fetch upcoming or active Fun Match
  const now = new Date();
  let upcomingFunMatch = await prisma.funMatch.findFirst({
    where: {
      matchDate: { gte: new Date(now.getTime() - 8 * 60 * 60 * 1000) },
    },
    include: {
      attendances: {
        include: { member: true },
      },
    },
    orderBy: { matchDate: 'asc' },
  });

  // If no upcoming fun match found, fallback to the latest fun match
  if (!upcomingFunMatch) {
    upcomingFunMatch = await prisma.funMatch.findFirst({
      include: {
        attendances: {
          include: { member: true },
        },
      },
      orderBy: { matchDate: 'desc' },
    });
  }

  // Confirmed attendees for upcoming fun match
  const confirmedAttendees = upcomingFunMatch ? upcomingFunMatch.attendances : [];

  // Recent fun matches
  const recentFunMatches = await prisma.funMatch.findMany({
    take: 6,
    orderBy: { matchDate: 'desc' },
  });

  const totalMembersCount = await prisma.member.count({
    where: { status: 'ACTIVE' },
  });

  // Upcoming main squad match (general schedule)
  const upcomingMainSquadMatch = await prisma.footballMatch.findFirst({
    where: {
      matchDate: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
      status: { not: 'finished' },
    },
    orderBy: { matchDate: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <CommunityPortal
        initialMember={memberData}
        upcomingFunMatch={upcomingFunMatch}
        upcomingMainSquadInvitation={upcomingMainSquadInvitation}
        upcomingMainSquadMatch={upcomingMainSquadMatch}
        declinedInvitations={declinedInvitations}
        allConfirmedFunMatchPlayers={confirmedAttendees}
        recentFunMatches={recentFunMatches}
        totalMembersCount={totalMembersCount}
      />
    </div>
  );
}
