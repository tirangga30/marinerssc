import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signMemberToken } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

function generateRandomJerseyNumber(): number {
  return Math.floor(Math.random() * (99 - 30 + 1)) + 30; // 30 to 99
}

function generateMemberCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `MSC-M${randomDigits}`;
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      fullName,
      nickname,
      origin,
      phone,
      photoUrl,
      position,
      altPosition,
      tier = 'FAN',
      paymentProof,
      password,
      requestedJerseyNumber,
    } = data;

    if (!fullName || !origin || !phone || !position) {
      return NextResponse.json(
        { error: 'Nama lengkap, asal domisili, no WhatsApp, dan posisi wajib diisi' },
        { status: 400 }
      );
    }

    // Generate unique memberCode
    let memberCode = generateMemberCode();
    let exists = await prisma.member.findUnique({ where: { memberCode } });
    let attempts = 0;
    while (exists && attempts < 10) {
      memberCode = generateMemberCode();
      exists = await prisma.member.findUnique({ where: { memberCode } });
      attempts++;
    }

    // Determine Jersey Number (30 - 99)
    let jerseyNum = requestedJerseyNumber
      ? parseInt(requestedJerseyNumber)
      : generateRandomJerseyNumber();
    if (isNaN(jerseyNum) || jerseyNum < 30 || jerseyNum > 99) {
      jerseyNum = generateRandomJerseyNumber();
    }

    // Default password if not provided
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const defaultPassword = password?.trim() || `mariners${cleanPhone.slice(-4) || '2026'}`;

    // Expiry calculation based on tier
    const now = new Date();
    let expiresAt: Date | null = null;
    if (tier === 'PRO') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else if (tier === 'ELITE') {
      expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000); // 180 days (6 months)
    } else {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days (FAN 1 match)
    }

    const newMember = await prisma.member.create({
      data: {
        memberCode,
        password: defaultPassword,
        fullName: fullName.trim(),
        nickname: nickname?.trim() || null,
        origin: origin.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || '/defaultplayer.png',
        position: position.toUpperCase(),
        altPosition: altPosition ? altPosition.toUpperCase() : null,
        jerseyNumber: jerseyNum,
        tier: tier.toUpperCase(),
        status: 'PENDING', // Menunggu konfirmasi bukti pembayaran dari admin
        paymentProof: paymentProof || null,
        paymentStatus: 'PENDING',
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        memberCode: newMember.memberCode,
        fullName: newMember.fullName,
        tier: newMember.tier,
        jerseyNumber: newMember.jerseyNumber,
        position: newMember.position,
        photoUrl: newMember.photoUrl,
        phone: newMember.phone,
        status: newMember.status,
        paymentStatus: newMember.paymentStatus,
      },
      message: 'Pendaftaran berhasil! Bukti pembayaran sedang menunggu konfirmasi admin.',
    });
  } catch (error) {
    console.error('Member registration error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pendaftaran member' },
      { status: 500 }
    );
  }
}
