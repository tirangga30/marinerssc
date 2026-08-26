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
        matchAttendances: {
          include: {
            footballMatch: true,
            funMatch: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

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
        funAppearances: member.funAppearances,
        mainAppearances: member.mainAppearances,
        goals: member.goals,
        assists: member.assists,
        yellowCards: member.yellowCards,
        redCards: member.redCards,
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
