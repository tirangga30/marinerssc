import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMemberSession } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getMemberSession();
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { id: session.memberId },
      include: {
        funMatchEvents: true,
        matchAttendances: {
          include: {
            footballMatch: true,
            funMatch: true,
          },
          orderBy: { createdAt: 'desc' },
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

    if (!member) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Calculate strictly from Fun Matches
    const funGoals = (member.funMatchEvents || []).filter(
      (e: any) => e.type === 'goal' || e.type === 'penalty'
    ).length;
    const funAssists = (member.funMatchEvents || []).filter(
      (e: any) => e.type === 'assist'
    ).length;
    const funYellowCards = (member.funMatchEvents || []).filter(
      (e: any) => e.type === 'yellow_card'
    ).length;
    const funRedCards = (member.funMatchEvents || []).filter(
      (e: any) => e.type === 'red_card' || e.type === 'second_yellow'
    ).length;
    const nowMs = Date.now();
    const funAppearances = (member.matchAttendances || []).filter((a: any) => {
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

    const totalGoals = Math.max(member.goals || 0, funGoals);
    const totalAssists = Math.max(member.assists || 0, funAssists);
    const totalAppearances = Math.max(member.funAppearances || 0, funAppearances);
    const totalYellowCards = Math.max(member.yellowCards || 0, funYellowCards);
    const totalRedCards = Math.max(member.redCards || 0, funRedCards);

    return NextResponse.json({
      authenticated: true,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        nickname: member.nickname,
        origin: member.origin,
        phone: member.phone,
        photoUrl: member.photoUrl,
        position: member.position,
        altPosition: member.altPosition,
        jerseyNumber: member.jerseyNumber,
        tier: member.tier,
        status: member.status,
        joinedAt: member.joinedAt,
        expiresAt: member.expiresAt,
        funAppearances,
        mainAppearances: member.mainAppearances || 0,
        totalGoals,
        totalAssists,
        totalAppearances,
        totalYellowCards,
        totalRedCards,
        goals: totalGoals,
        assists: totalAssists,
        yellowCards: totalYellowCards,
        redCards: totalRedCards,
      },
      attendances: member.matchAttendances,
    });
  } catch (error) {
    console.error('Member me error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak diizinkan. Silakan login terlebih dahulu.' }, { status: 401 });
    }

    const { photoUrl } = await req.json();

    if (!photoUrl) {
      return NextResponse.json({ error: 'Foto tidak valid.' }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { id: session.memberId },
      data: { photoUrl },
    });

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error) {
    console.error('Update member photo error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui foto profil' }, { status: 500 });
  }
}
