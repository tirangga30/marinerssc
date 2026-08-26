import React from 'react';
import { prisma } from '@/lib/db';
import HomeClientView from '@/components/HomeClientView';

export const dynamic = 'force-dynamic';

function getDynamicMatchStatus(m: any): 'scheduled' | 'live' | 'finished' | 'score_pending' {
  if (!m) return 'scheduled';

  const hasScore = m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined;
  const hasFulltime = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
  const isExplicitlyFinished = m.status === 'finished' || hasFulltime;

  const now = new Date();
  const start = new Date(m.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  let isTimeFinished = false;
  if (m.isLiveEnabled !== false) {
    isTimeFinished = isExplicitlyFinished;
  } else {
    const durationMinutes = m.duration || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    isTimeFinished = isExplicitlyFinished || now >= end;
  }

  if (isTimeFinished) {
    if (!hasScore) return 'score_pending';
    return 'finished';
  }

  if (now >= start) return 'live';
  return 'scheduled';
}

export default async function HomePage() {
  let matches: any[] = [];
  let articles: any[] = [];
  let featuredPlayers: any[] = [];

  // Community data
  let funMatches: any[] = [];
  let communityMembers: any[] = [];
  let allFunMatchEvents: any[] = [];

  try {
    const [
      rawMatches,
      fetchedArticles,
      starredPlayers,
      rawFunMatches,
      activeMembers,
      events,
    ] = await Promise.all([
      prisma.footballMatch.findMany({
        include: { events: true },
        orderBy: { matchDate: 'asc' },
      }),
      prisma.article.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 3,
      }),
      prisma.player.findMany({
        where: { isFeatured: true, isGuest: false },
        orderBy: { number: 'asc' },
        take: 6,
      }),
      prisma.funMatch.findMany({
        include: { events: true },
        orderBy: { matchDate: 'asc' },
      }),
      prisma.member.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { jerseyNumber: 'asc' },
      }),
      prisma.funMatchEvent.findMany({
        where: { type: 'goal' },
        include: { member: true },
      }),
    ]);

    matches = rawMatches.map((m: any, idx: number) => ({
      ...m,
      matchday: idx + 1,
    }));

    articles = fetchedArticles;
    featuredPlayers = starredPlayers;

    if (featuredPlayers.length === 0) {
      featuredPlayers = await prisma.player.findMany({
        where: { isGuest: false },
        take: 6,
        orderBy: { appearances: 'desc' },
      });
    }

    funMatches = rawFunMatches;
    communityMembers = activeMembers;
    allFunMatchEvents = events;
  } catch (error) {
    console.error('Error fetching home page data:', error);
  }

  // 1. Process Main Squad Data
  const matchesWithStatus = matches.map((m: any) => ({
    ...m,
    computedStatus: getDynamicMatchStatus(m),
  }));

  const liveMatch = matchesWithStatus.find((m: any) => m.computedStatus === 'live');
  const upcomingMatch = matchesWithStatus
    .filter((m: any) => m.computedStatus === 'scheduled')
    .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];
  const lastFinishedMatch = matchesWithStatus
    .filter((m: any) => m.computedStatus === 'finished')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0];

  const nextMatch = liveMatch || upcomingMatch || lastFinishedMatch || matchesWithStatus[0];
  const featuredStatus = nextMatch ? getDynamicMatchStatus(nextMatch) : 'scheduled';

  const finishedMatches = matchesWithStatus.filter((m: any) => m.computedStatus === 'finished');
  const totalFinished = finishedMatches.length;

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalGoals = 0;
  let concededGoals = 0;

  finishedMatches.forEach((m: any) => {
    const marinersScore = m.isHome ? m.homeScore : m.awayScore;
    const opponentScore = m.isHome ? m.awayScore : m.homeScore;

    if (marinersScore !== null && opponentScore !== null) {
      totalGoals += marinersScore;
      concededGoals += opponentScore;

      if (marinersScore > opponentScore) {
        wins++;
      } else if (marinersScore === opponentScore) {
        draws++;
      } else {
        losses++;
      }
    }
  });

  const winRate = totalFinished > 0 ? Math.round((wins / totalFinished) * 100) : 0;

  // 2. Process Soccer Community Data
  const liveFunMatch = funMatches.find((fm: any) => fm.status === 'live');
  const upcomingFunMatch = funMatches
    .filter((fm: any) => fm.status === 'scheduled')
    .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];
  const lastFinishedFunMatch = funMatches
    .filter((fm: any) => fm.status === 'finished')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0];

  const nextFunMatch = liveFunMatch || upcomingFunMatch || lastFinishedFunMatch || funMatches[0] || null;

  const finishedFunMatches = funMatches
    .filter((fm: any) => fm.status === 'finished')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  const recentFunMatches = finishedFunMatches.slice(0, 3);

  // Calculate Community Goals & Top Scorer
  const totalCommunityGoals = funMatches.reduce((acc, fm) => acc + (fm.teamAScore || 0) + (fm.teamBScore || 0), 0);

  // Member goal counter
  const memberGoalCounts: Record<string, { name: string; count: number }> = {};
  communityMembers.forEach((m) => {
    memberGoalCounts[m.id] = { name: m.nickname || m.fullName, count: m.goals || 0 };
  });

  allFunMatchEvents.forEach((e) => {
    if (e.memberId && memberGoalCounts[e.memberId]) {
      memberGoalCounts[e.memberId].count += 1;
    }
  });

  let topScorerName = 'Belum Ada';
  let topScorerGoals = 0;
  Object.values(memberGoalCounts).forEach((item) => {
    if (item.count > topScorerGoals) {
      topScorerGoals = item.count;
      topScorerName = item.name;
    }
  });

  const mainSquadData = {
    nextMatch,
    featuredStatus,
    finishedMatches,
    winRate,
    totalFinished,
    wins,
    draws,
    losses,
    totalGoals,
    concededGoals,
    featuredPlayers,
    articles,
  };

  const communityData = {
    nextFunMatch,
    recentFunMatches,
    communityMembers,
    totalMembers: communityMembers.length,
    totalFunMatches: funMatches.length,
    totalCommunityGoals,
    topScorerName,
    topScorerGoals,
  };

  return <HomeClientView mainSquadData={mainSquadData} communityData={communityData} />;
}
