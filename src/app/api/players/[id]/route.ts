import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah (Silakan login ulang admin)' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const player = await prisma.player.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        number: parseInt(data.number),
        position: data.position,
        nationality: data.nationality,
        heightCm: data.heightCm ? parseInt(data.heightCm) : null,
        weightKg: data.weightKg ? parseInt(data.weightKg) : null,
        photoUrl: data.photoUrl,
        bio: data.bio,
        isCaptain: Boolean(data.isCaptain),
        status: data.status,
        goals: parseInt(data.goals),
        assists: parseInt(data.assists),
        appearances: parseInt(data.appearances),
        yellowCards: parseInt(data.yellowCards),
        redCards: parseInt(data.redCards),
      },
    });

    return NextResponse.json(player);
  } catch (error: any) {
    console.error('PUT /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui data pemain' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.player.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus pemain' },
      { status: 500 }
    );
  }
}
