import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateRandomJerseyNumber(): number {
  return Math.floor(Math.random() * 99) + 1; // 1 to 99
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

    // VALIDATION: Semua form pendaftaran dan bukti transfer wajib diisi lengkap
    if (!fullName?.trim() || !origin?.trim() || !phone?.trim() || !position?.trim() || !photoUrl || !paymentProof) {
      return NextResponse.json(
        { error: 'Mohon lengkapi semua data pendaftaran (Nama, Asal Domisili, No WhatsApp, Posisi, Foto Profil, dan Bukti Transfer Pembayaran).' },
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

    // Determine Jersey Number (1 - 99)
    let jerseyNum = requestedJerseyNumber
      ? parseInt(requestedJerseyNumber)
      : generateRandomJerseyNumber();
    if (isNaN(jerseyNum) || jerseyNum < 1 || jerseyNum > 99) {
      jerseyNum = generateRandomJerseyNumber();
    }

    // Default password if not provided (e.g. mariners1234 from phone last 4 digits)
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

    // STATUS BARU: PENDING & PAYMENT PENDING (Admin harus verifikasi bukti bayar terlebih dahulu)
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
        status: 'PENDING', // Menunggu konfirmasi admin
        paymentProof: paymentProof,
        paymentStatus: 'PENDING', // Bukti pembayaran menunggu review admin
        expiresAt,
      },
    });

    // TIDAK LANGSUNG LOGIN: Kembalikan status pendingApproval agar calon member menunggu konfirmasi WA dari admin
    return NextResponse.json({
      success: true,
      pendingApproval: true,
      member: {
        id: newMember.id,
        memberCode: newMember.memberCode,
        fullName: newMember.fullName,
        phone: newMember.phone,
        tier: newMember.tier,
        status: newMember.status,
      },
    });
  } catch (error) {
    console.error('Member registration error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mendaftar. Silakan coba beberapa saat lagi.' },
      { status: 500 }
    );
  }
}
