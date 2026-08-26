import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function generateMemberCode(): string {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `MSC-M${randomDigits}`;
}

export async function GET(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (tier && tier !== 'ALL') {
      where.tier = tier;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { memberCode: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { origin: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      include: {
        player: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Gagal mengambil data member' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();
    const {
      fullName,
      nickname,
      origin,
      phone,
      photoUrl,
      position = 'MF',
      altPosition,
      jerseyNumber,
      tier = 'FAN',
      status = 'ACTIVE',
      password,
    } = data;

    if (!fullName || !origin || !phone) {
      return NextResponse.json({ error: 'Nama, asal, dan nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    let memberCode = generateMemberCode();
    let exists = await prisma.member.findUnique({ where: { memberCode } });
    let attempts = 0;
    while (exists && attempts < 10) {
      memberCode = generateMemberCode();
      exists = await prisma.member.findUnique({ where: { memberCode } });
      attempts++;
    }

    const randomNum = Math.floor(Math.random() * (99 - 30 + 1)) + 30;
    const finalJerseyNum = jerseyNumber ? parseInt(jerseyNumber) : randomNum;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const finalPassword = password?.trim() || `mariners${cleanPhone.slice(-4) || '2026'}`;

    const member = await prisma.member.create({
      data: {
        memberCode,
        password: finalPassword,
        fullName: fullName.trim(),
        nickname: nickname?.trim() || null,
        origin: origin.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || '/defaultplayer.png',
        position: position.toUpperCase(),
        altPosition: altPosition ? altPosition.toUpperCase() : null,
        jerseyNumber: finalJerseyNum,
        tier: tier.toUpperCase(),
        status: status.toUpperCase(),
        paymentStatus: 'VERIFIED',
      },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json({ error: 'Gagal menambahkan member' }, { status: 500 });
  }
}
