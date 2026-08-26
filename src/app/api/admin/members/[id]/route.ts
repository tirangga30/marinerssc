import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.member.update({
      where: { id },
      data: {
        fullName: data.fullName !== undefined ? data.fullName.trim() : existing.fullName,
        nickname: data.nickname !== undefined ? data.nickname?.trim() || null : existing.nickname,
        origin: data.origin !== undefined ? data.origin.trim() : existing.origin,
        phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
        photoUrl: data.photoUrl !== undefined ? data.photoUrl : existing.photoUrl,
        position: data.position !== undefined ? data.position.toUpperCase() : existing.position,
        altPosition: data.altPosition !== undefined ? (data.altPosition ? data.altPosition.toUpperCase() : null) : existing.altPosition,
        jerseyNumber: data.jerseyNumber !== undefined ? parseInt(data.jerseyNumber) : existing.jerseyNumber,
        tier: data.tier !== undefined ? data.tier.toUpperCase() : existing.tier,
        status: data.status !== undefined ? data.status.toUpperCase() : existing.status,
        password: data.password !== undefined && data.password.trim() !== '' ? data.password.trim() : existing.password,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : existing.expiresAt,
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json({ error: 'Gagal memperbarui data member' }, { status: 500 });
  }
}

// Promosi ke Skuad Utama
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const { assignedNumber } = await req.json();

    const member = await prisma.member.findUnique({
      where: { id },
      include: { player: true },
    });

    if (!member) {
      return NextResponse.json({ error: 'Member tidak ditemukan' }, { status: 404 });
    }

    let finalNumber = assignedNumber ? parseInt(assignedNumber) : member.jerseyNumber;
    if (isNaN(finalNumber)) finalNumber = member.jerseyNumber;

    // Check if number is already taken in Player table
    let existingPlayerWithNum = await prisma.player.findUnique({ where: { number: finalNumber } });
    if (existingPlayerWithNum && (!member.playerId || existingPlayerWithNum.id !== member.playerId)) {
      // Find alternative free number
      let altNum = 30;
      while (await prisma.player.findUnique({ where: { number: altNum } })) {
        altNum++;
      }
      finalNumber = altNum;
    }

    let baseSlug = member.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let slugExists = await prisma.player.findUnique({ where: { slug } });
    if (slugExists && (!member.playerId || slugExists.id !== member.playerId)) {
      slug = `${baseSlug}-${finalNumber}`;
    }

    let playerRecord;
    if (member.playerId && member.player) {
      // Update existing Player record
      playerRecord = await prisma.player.update({
        where: { id: member.playerId },
        data: {
          name: member.fullName,
          number: finalNumber,
          position: member.position,
          photoUrl: member.photoUrl || '/defaultplayer.png',
          isGuest: false,
          status: 'Active',
        },
      });
    } else {
      // Create new permanent Player record
      playerRecord = await prisma.player.create({
        data: {
          name: member.fullName,
          slug,
          number: finalNumber,
          position: member.position,
          photoUrl: member.photoUrl || '/defaultplayer.png',
          bio: `Pemain promosi resmi dari Mariners Soccer Community (Tier ${member.tier}).`,
          nationality: 'Indonesia',
          isGuest: false,
          status: 'Active',
        },
      });
    }

    // Link back to member
    await prisma.member.update({
      where: { id },
      data: {
        isPermanent: true,
        playerId: playerRecord.id,
        jerseyNumber: finalNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${member.fullName} berhasil ditarik menjadi pemain tetap Skuad Utama dengan Nomor Punggung #${finalNumber}!`,
      player: playerRecord,
    });
  } catch (error) {
    console.error('Error promoting member to squad:', error);
    return NextResponse.json({ error: 'Gagal menarik member ke Skuad Utama' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.member.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Member berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Gagal menghapus member' }, { status: 500 });
  }
}
