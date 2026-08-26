import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Try fetching user from Database
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
        },
      });
    } catch (e) {
      console.error('DB query error on login:', e);
    }

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    let isMatch = false;
    if (user.password === cleanPassword) {
      isMatch = true;
    } else {
      try {
        isMatch = await bcrypt.compare(cleanPassword, user.password);
      } catch (err) {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
