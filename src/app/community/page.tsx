import React from 'react';
import { prisma } from '@/lib/db';
import { getMemberSession } from '@/lib/memberAuth';
import CommunityPortal from '@/components/CommunityPortal';

export const dynamic = 'force-dynamic';

function getDynamicFunMatchStatus(fm: any): 'scheduled' | 'live' | 'finished' {
  if (!fm) return 'scheduled';
  if (fm.status === 'finished') return 'finished';
  if (fm.teamAScore !== null && fm.teamBScore !== null && fm.teamAScore !== undefined && fm.teamBScore !== undefined) {
    return 'finished';
  }

  const now = new Date();
  const start = new Date(fm.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  const durationMinutes = fm.duration || 60;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  if (fm.status === 'live' || (now >= start && now < end)) {
    return 'live';
  }

  if (now >= end) {
    return 'finished';
  }

  return 'scheduled';
}

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
      // Calculate strictly from Fun Matches
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
      const nowMs = Date.now();
      const funAppearances = (rawMember.matchAttendances || []).filter((a: any) => {
        if (!a.funMatchId || a.status !== 'CONFIRMED') return false;
        const fm = a.funMatch;
        if (!fm) return false;
        if (fm.status === 'scheduled') {
          const matchStartMs = new Date(fm.matchDate).getTime();
          if (isNaN(matchStartMs) || nowMs < matchStartMs) return false;
        }
        const isPlayed =
          fm.status === 'finished' ||
          fm.status === 'live' ||
          (fm.teamAScore !== null && fm.teamBScore !== null) ||
          nowMs >= new Date(fm.matchDate).getTime();
        return isPlayed && (a.assignedTeam === 'TEAM_A' || a.assignedTeam === 'TEAM_B');
      }).length;

      const totalGoals = Math.max(rawMember.goals || 0, funGoals);
      const totalAssists = Math.max(rawMember.assists || 0, funAssists);
      const totalAppearances = Math.max(rawMember.funAppearances || 0, funAppearances);
      const totalYellowCards = Math.max(rawMember.yellowCards || 0, funYellowCards);
      const totalRedCards = Math.max(rawMember.redCards || 0, funRedCards);

      memberData = {
        ...rawMember,
        totalGoals,
        totalAssists,
        totalAppearances,
        totalYellowCards,
        totalRedCards,
        funAppearances: totalAppearances,
        mainAppearances: rawMember.mainAppearances || 0,
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

  // Fetch and categorize Fun Matches & Community Data in parallel for maximum speed
  const now = new Date();
  const [allFunMatches, totalMembersCount, upcomingMainSquadMatch] = await Promise.all([
    prisma.funMatch.findMany({
      include: {
        attendances: {
          include: { member: true },
        },
        events: true,
      },
      orderBy: { matchDate: 'asc' },
    }),
    prisma.member.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.footballMatch.findFirst({
      where: {
        matchDate: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
        status: { not: 'finished' },
      },
      orderBy: { matchDate: 'asc' },
    }),
  ]);

  const funMatchesWithStatus = allFunMatches.map((fm) => ({
    ...fm,
    computedStatus: getDynamicFunMatchStatus(fm),
  }));

  // Upcoming Fun Match: earliest scheduled or live match
  const upcomingFunMatch =
    funMatchesWithStatus
      .filter((fm) => fm.computedStatus === 'scheduled' || fm.computedStatus === 'live')
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0] ||
    funMatchesWithStatus[funMatchesWithStatus.length - 1] ||
    null;

  // Confirmed attendees for upcoming fun match
  const confirmedAttendees = upcomingFunMatch ? upcomingFunMatch.attendances : [];

  // Recent / Finished Fun Matches: latest finished matches
  const recentFunMatches = funMatchesWithStatus
    .filter((fm) => fm.computedStatus === 'finished')
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 6);

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
