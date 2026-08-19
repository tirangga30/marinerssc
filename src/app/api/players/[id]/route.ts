import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    // Allow edit in local development mode or if session exists
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (data.number !== undefined) updateData.number = parseInt(data.number);
    if (data.position !== undefined) {
      const p = (data.position || '').trim().toUpperCase();
      if (p === 'GK' || p === 'GOALKEEPER') updateData.position = 'GOALKEEPER';
      else if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) updateData.position = 'DEFENDER';
      else if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) updateData.position = 'MIDFIELDER';
      else updateData.position = 'FORWARD';
    }
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.heightCm !== undefined) updateData.heightCm = data.heightCm ? parseInt(data.heightCm) : null;
    if (data.weightKg !== undefined) updateData.weightKg = data.weightKg ? parseInt(data.weightKg) : null;
    if (data.photoUrl !== undefined) {
      const rawPhotoUrl = (data.photoUrl || '').trim();
      const isDefaultTemplate = !rawPhotoUrl || rawPhotoUrl === '/playertemplate.png' || rawPhotoUrl.includes('unsplash.com');

      if (!isDefaultTemplate) {
        const existingPhotoPlayer = await prisma.player.findFirst({
          where: {
            photoUrl: rawPhotoUrl,
            NOT: { id },
          },
        });
        if (existingPhotoPlayer) {
          return NextResponse.json(
            { error: `Foto ini sudah digunakan oleh pemain lain (${existingPhotoPlayer.name}). Silakan gunakan file foto lain.` },
            { status: 400 }
          );
        }
      }
      updateData.photoUrl = rawPhotoUrl;
    }
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.isCaptain !== undefined) updateData.isCaptain = Boolean(data.isCaptain);
    if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isGuest !== undefined) updateData.isGuest = Boolean(data.isGuest);
    if (data.goals !== undefined) updateData.goals = parseInt(data.goals || 0);
    if (data.assists !== undefined) updateData.assists = parseInt(data.assists || 0);
    if (data.appearances !== undefined) updateData.appearances = parseInt(data.appearances || 0);
    if (data.yellowCards !== undefined) updateData.yellowCards = parseInt(data.yellowCards || 0);
    if (data.redCards !== undefined) updateData.redCards = parseInt(data.redCards || 0);

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath(`/players/${player.slug}`);
    revalidatePath('/stats');

    return NextResponse.json(player);
  } catch (error: any) {
    console.error('PUT /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui data pemain' },
      { status: 500 }
    );
  }
}

import { cleanupUnusedUploads } from '@/lib/cleanup';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.player.delete({ where: { id } });

    cleanupUnusedUploads().catch(() => {});

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath('/stats');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus pemain' },
      { status: 500 }
    );
  }
}
