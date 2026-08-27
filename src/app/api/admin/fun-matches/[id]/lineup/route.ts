import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: funMatchId } = await params;
    const body = await req.json();

    const { action } = body;

    // 1. Assign player to Team A / Team B / Pool
    if (action === 'ASSIGN_TEAM') {
      const { attendanceId, assignedTeam } = body; // 'TEAM_A' | 'TEAM_B' | null
      await prisma.matchAttendance.update({
        where: { id: attendanceId },
        data: { assignedTeam },
      });
      return NextResponse.json({ success: true });
    }

    // 2. Add Attendance manual by Admin
    if (action === 'ADD_MEMBER_TO_MATCH') {
      const { memberId, assignedTeam } = body;
      const member = await prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
      }

      const existing = await prisma.matchAttendance.findFirst({
        where: { funMatchId, memberId },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: { status: 'CONFIRMED', assignedTeam: assignedTeam || existing.assignedTeam },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            funMatchId,
            memberId,
            playerType: 'MEMBER',
            playerName: member.fullName,
            status: 'CONFIRMED',
            assignedTeam: assignedTeam || null,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    // 3. Remove from match
    if (action === 'REMOVE_ATTENDANCE') {
      const { attendanceId } = body;
      await prisma.matchAttendance.delete({
        where: { id: attendanceId },
      });
      return NextResponse.json({ success: true });
    }

    // 4. Add Event (Goal, Assist, Yellow Card, Red Card)
    if (action === 'ADD_EVENT') {
      const { memberId, playerName, team, type, minute, description } = body;
      if (!team || !type) {
        return NextResponse.json({ error: 'Tim dan jenis event wajib diisi' }, { status: 400 });
      }

      const newEvent = await prisma.funMatchEvent.create({
        data: {
          funMatchId,
          memberId: memberId || null,
          playerName: playerName || null,
          team,
          type,
          minute: parseInt(minute) || 0,
          description: description || null,
        },
      });

      // Update Member personal stats if memberId is given
      if (memberId) {
        if (type === 'goal') {
          await prisma.member.update({ where: { id: memberId }, data: { goals: { increment: 1 } } });
        } else if (type === 'assist') {
          await prisma.member.update({ where: { id: memberId }, data: { assists: { increment: 1 } } });
        } else if (type === 'yellow_card') {
          await prisma.member.update({ where: { id: memberId }, data: { yellowCards: { increment: 1 } } });
        } else if (type === 'red_card') {
          await prisma.member.update({ where: { id: memberId }, data: { redCards: { increment: 1 } } });
        }
      }

      // If goal, auto-sync FunMatch scores
      if (type === 'goal') {
        const goalCountA = await prisma.funMatchEvent.count({ where: { funMatchId, team: 'TEAM_A', type: 'goal' } });
        const goalCountB = await prisma.funMatchEvent.count({ where: { funMatchId, team: 'TEAM_B', type: 'goal' } });
        await prisma.funMatch.update({
          where: { id: funMatchId },
          data: {
            teamAScore: goalCountA,
            teamBScore: goalCountB,
          },
        });
      }

      try {
        revalidatePath('/community');
        revalidatePath('/community/matches');
        revalidatePath(`/community/matches/${funMatchId}`);
        revalidatePath('/');
      } catch (e) {}

      return NextResponse.json({ success: true, event: newEvent });
    }

    // 5. Delete Event
    if (action === 'DELETE_EVENT') {
      const { eventId } = body;
      const event = await prisma.funMatchEvent.findUnique({ where: { id: eventId } });
      if (event && event.memberId) {
        if (event.type === 'goal') {
          await prisma.member.update({ where: { id: event.memberId }, data: { goals: { decrement: 1 } } });
        } else if (event.type === 'assist') {
          await prisma.member.update({ where: { id: event.memberId }, data: { assists: { decrement: 1 } } });
        } else if (event.type === 'yellow_card') {
          await prisma.member.update({ where: { id: event.memberId }, data: { yellowCards: { decrement: 1 } } });
        } else if (event.type === 'red_card') {
          await prisma.member.update({ where: { id: event.memberId }, data: { redCards: { decrement: 1 } } });
        }
      }
      await prisma.funMatchEvent.delete({ where: { id: eventId } });

      // If goal deleted, re-sync score
      if (event && event.type === 'goal') {
        const goalCountA = await prisma.funMatchEvent.count({ where: { funMatchId, team: 'TEAM_A', type: 'goal' } });
        const goalCountB = await prisma.funMatchEvent.count({ where: { funMatchId, team: 'TEAM_B', type: 'goal' } });
        await prisma.funMatch.update({
          where: { id: funMatchId },
          data: {
            teamAScore: goalCountA,
            teamBScore: goalCountB,
          },
        });
      }

      try {
        revalidatePath('/community');
        revalidatePath('/community/matches');
        revalidatePath(`/community/matches/${funMatchId}`);
        revalidatePath('/');
      } catch (e) {}

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 });
  } catch (error) {
    console.error('Error in fun match lineup handler:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
