import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const funMatch = await prisma.funMatch.findUnique({
      where: { id },
      include: {
        attendances: {
          include: { member: true },
          orderBy: { createdAt: 'asc' },
        },
        events: {
          include: { member: true },
          orderBy: { minute: 'asc' },
        },
      },
    });

    if (!funMatch) {
      return NextResponse.json({ error: 'Fun match tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ funMatch });
  } catch (error) {
    console.error('Error fetching fun match:', error);
    return NextResponse.json({ error: 'Gagal mengambil detail fun match' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.funMatch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Fun match tidak ditemukan' }, { status: 404 });
    }

    let finalStatus = data.status !== undefined ? data.status : existing.status;
    const finalScoreA = data.teamAScore !== undefined ? (data.teamAScore === null || data.teamAScore === '' ? null : parseInt(data.teamAScore)) : existing.teamAScore;
    const finalScoreB = data.teamBScore !== undefined ? (data.teamBScore === null || data.teamBScore === '' ? null : parseInt(data.teamBScore)) : existing.teamBScore;

    if (finalScoreA !== null && finalScoreB !== null && finalStatus === 'scheduled') {
      finalStatus = 'finished';
    }

    const updated = await prisma.funMatch.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        venue: data.venue !== undefined ? data.venue : existing.venue,
        teamAName: data.teamAName !== undefined ? data.teamAName : existing.teamAName,
        teamBName: data.teamBName !== undefined ? data.teamBName : existing.teamBName,
        teamAScore: finalScoreA,
        teamBScore: finalScoreB,
        status: finalStatus,
        duration: data.duration !== undefined ? parseInt(data.duration) : existing.duration,
        summary: data.summary !== undefined ? data.summary : existing.summary,
        matchDate: data.matchDate ? new Date(data.matchDate) : existing.matchDate,
      },
    });

    try {
      revalidatePath('/community');
      revalidatePath('/community/matches');
      revalidatePath(`/community/matches/${id}`);
      revalidatePath('/');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({ success: true, funMatch: updated });
  } catch (error) {
    console.error('Error updating fun match:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data fun match' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.funMatch.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Fun match berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting fun match:', error);
    return NextResponse.json({ error: 'Gagal menghapus fun match' }, { status: 500 });
  }
}
