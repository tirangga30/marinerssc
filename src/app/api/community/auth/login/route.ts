import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signMemberToken } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { memberCode, password } = await req.json();

    if (!memberCode || !password) {
      return NextResponse.json(
        { error: 'ID Member dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const cleanCode = memberCode.trim().toUpperCase();

    // Find member by memberCode (case-insensitive)
    const member = await prisma.member.findFirst({
      where: {
        memberCode: {
          equals: cleanCode,
          mode: 'insensitive',
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'ID Member atau kata sandi tidak sesuai' },
        { status: 401 }
      );
    }

    // Password comparison
    if (member.password !== password.trim()) {
      return NextResponse.json(
        { error: 'ID Member atau kata sandi tidak sesuai' },
        { status: 401 }
      );
    }

    // Check approval & payment status
    if (member.status === 'PENDING' || member.paymentStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'Akun Anda sedang dalam proses verifikasi pembayaran oleh Admin. Silakan tunggu konfirmasi username dan password yang akan dikirim melalui WhatsApp.' },
        { status: 403 }
      );
    }

    if (member.paymentStatus === 'REJECTED') {
      return NextResponse.json(
        { error: 'Bukti pembayaran pendaftaran Anda ditolak. Silakan hubungi admin Mariners SC.' },
        { status: 403 }
      );
    }

    if (member.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Akun member Anda saat ini non-aktif. Silakan hubungi admin untuk aktivasi kembali.' },
        { status: 403 }
      );
    }

    const token = await signMemberToken({
      memberId: member.id,
      memberCode: member.memberCode,
      fullName: member.fullName,
      tier: member.tier,
    });

    const response = NextResponse.json({
      success: true,
      member: {
        id: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        tier: member.tier,
        jerseyNumber: member.jerseyNumber,
        position: member.position,
        photoUrl: member.photoUrl,
        status: member.status,
      },
    });

    response.cookies.set('member_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Member login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
