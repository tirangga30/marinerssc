import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    // 1. Try fetching user from Database
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (e) {
      console.error('DB query error on login:', e);
    }

    // 2. Default fallback for admin@marinersfc.com / password123
    if (!user && email === 'admin@marinersfc.com' && password === 'password123') {
      const token = await signToken({
        userId: 'admin-id-fallback',
        email: 'admin@marinersfc.com',
        isAdmin: true,
      });

      const response = NextResponse.json({
        success: true,
        user: { id: 'admin-id-fallback', name: 'Mariners FC Admin', email: 'admin@marinersfc.com' },
      });

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 jam
        path: '/',
      });

      return response;
    }

    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Kredensial tidak valid' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
