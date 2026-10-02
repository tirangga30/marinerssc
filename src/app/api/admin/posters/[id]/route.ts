import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await (prisma as any).heroPoster.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ success: true, poster: updated });
  } catch (err: any) {
    console.error('Error updating hero poster:', err);
    return NextResponse.json({ error: 'Gagal memperbarui status poster' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await (prisma as any).heroPoster.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Poster berhasil dihapus' });
  } catch (err: any) {
    console.error('Error deleting hero poster:', err);
    return NextResponse.json({ error: 'Gagal menghapus poster' }, { status: 500 });
  }
}
