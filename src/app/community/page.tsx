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
    memberData = await prisma.member.findUnique({
      where: { id: session.memberId },
    });

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

  // Fetch upcoming Fun Match
  const now = new Date();
  const upcomingFunMatch = await prisma.funMatch.findFirst({
    where: {
      matchDate: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
    },
    include: {
      attendances: {
        include: { member: true },
      },
    },
    orderBy: { matchDate: 'asc' },
  });

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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10">
      <CommunityPortal
        initialMember={memberData}
        upcomingFunMatch={upcomingFunMatch}
        upcomingMainSquadInvitation={upcomingMainSquadInvitation}
        declinedInvitations={declinedInvitations}
        allConfirmedFunMatchPlayers={confirmedAttendees}
        recentFunMatches={recentFunMatches}
        totalMembersCount={totalMembersCount}
      />
    </div>
  );
}
