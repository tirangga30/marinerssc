import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const unlocked = cookieStore.get('team_mgmt_unlocked')?.value === 'true';
  if (!unlocked) {
    return NextResponse.json({ error: 'Portal terkunci' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { name, email, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};

    if (name && typeof name === 'string') {
      updateData.name = name.trim();
    }

    if (email && typeof email === 'string') {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (emailTaken) {
          return NextResponse.json({ error: 'Email sudah digunakan pengguna lain' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }

    if (password && typeof password === 'string' && password.trim()) {
      const cleanPassword = password.trim();
      if (cleanPassword.length < 6) {
        return NextResponse.json({ error: 'Kata sandi baru minimal 6 karakter' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(cleanPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Data pengguna berhasil diperbarui', user: updated });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: 'Gagal memperbarui pengguna' }, { status: 500 });
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

  const cookieStore = await cookies();
  const unlocked = cookieStore.get('team_mgmt_unlocked')?.value === 'true';
  if (!unlocked) {
    return NextResponse.json({ error: 'Portal terkunci' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const adminCount = await prisma.user.count({ where: { isAdmin: true } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun admin terakhir' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ error: 'Gagal menghapus pengguna' }, { status: 500 });
  }
}
