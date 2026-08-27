import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cleanupUnusedUploads } from '@/lib/cleanup';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const guestsOnly = searchParams.get('guestsOnly') === 'true';

    let whereClause: any = { isGuest: false, member: null };

    if (guestsOnly) {
      whereClause = { isGuest: true };
    } else if (matchId) {
      whereClause = {}; // Ambil semua pemain agar dapat memisahkan skuad utama, tamu match ini, dan rekomendasi tamu match lain

      // Auto-sync confirmed members for this match into Player table so they can be dragged in lineup
      try {
        const confirmedMemberAttendances = await prisma.matchAttendance.findMany({
          where: {
            matchId,
            status: 'CONFIRMED',
            memberId: { not: null },
          },
          include: { member: true },
        });

        for (const att of confirmedMemberAttendances) {
          if (att.member) {
            let p = att.member.playerId
              ? await prisma.player.findUnique({ where: { id: att.member.playerId } })
              : null;

            if (!p) {
              p = await prisma.player.findFirst({
                where: { name: att.member.fullName },
              });
            }

            if (!p) {
              let baseSlug = att.member.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              let slug = baseSlug;
              if (await prisma.player.findUnique({ where: { slug } })) {
                slug = `${baseSlug}-${att.member.jerseyNumber}`;
              }

              let num = att.member.jerseyNumber;
              if (await prisma.player.findUnique({ where: { number: num } })) {
                let altNum = 30;
                while (await prisma.player.findUnique({ where: { number: altNum } })) {
                  altNum++;
                }
                num = altNum;
              }

              p = await prisma.player.create({
                data: {
                  name: att.member.fullName,
                  slug,
                  number: num,
                  position: (() => {
                    const pos = (att.member.position || '').toUpperCase();
                    if (pos === 'GK' || pos === 'GOALKEEPER') return 'GOALKEEPER';
                    if (pos === 'DF' || pos === 'DEFENDER') return 'DEFENDER';
                    if (pos === 'MF' || pos === 'MIDFIELDER') return 'MIDFIELDER';
                    return 'FORWARD';
                  })(),
                  photoUrl: att.member.photoUrl || '/defaultplayer.png',
                  isGuest: false,
                  bio: `Member Komunitas Mariners SC (${att.member.tier})`,
                },
              });
            }

            if (att.member.playerId !== p.id) {
              await prisma.member.update({
                where: { id: att.member.id },
                data: { playerId: p.id },
              });
            }

            if (att.playerId !== p.id) {
              await prisma.matchAttendance.update({
                where: { id: att.id },
                data: { playerId: p.id },
              });
            }
          }
        }
      } catch (syncErr) {
        console.error('Error syncing confirmed members to player table:', syncErr);
      }
    }

    const players = await prisma.player.findMany({
      where: whereClause,
      orderBy: { number: 'asc' },
    });

    const getPositionWeight = (pos: string): number => {
      const p = (pos || '').toUpperCase();
      if (p === 'GK' || p === 'GOALKEEPER') return 1;
      if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 2;
      if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 3;
      if (p === 'FW' || p === 'FORWARD' || p.includes('ST') || p.includes('LW') || p.includes('RW')) return 4;
      return 5;
    };

    players.sort((a, b) => {
      const wA = getPositionWeight(a.position);
      const wB = getPositionWeight(b.position);
      if (wA !== wB) return wA - wB;
      return a.number - b.number;
    });

    return NextResponse.json(players);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data pemain' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const data = await req.json();
    let slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (data.isGuest) {
      slug = `${slug}-guest-${Date.now()}`;
    }

    const requestedNumber = parseInt(data.number);
    const existingPlayer = await prisma.player.findUnique({ where: { number: requestedNumber } });
    let finalNumber = requestedNumber;

    if (existingPlayer) {
      if (data.isGuest) {
        const maxPlayer = await prisma.player.findFirst({ orderBy: { number: 'desc' } });
        finalNumber = (maxPlayer?.number || 99) + 1;
      } else {
        return NextResponse.json({ error: `Nomor punggung ${requestedNumber} sudah digunakan oleh pemain lain.` }, { status: 400 });
      }
    }

    // Check for duplicate photo file (ignore default placeholders / template photos)
    const rawPhotoUrl = (data.photoUrl || '').trim();
    const isDefaultTemplate = !rawPhotoUrl || rawPhotoUrl === '/playertemplate.png' || rawPhotoUrl.includes('unsplash.com');

    if (!isDefaultTemplate) {
      const existingPhotoPlayer = await prisma.player.findFirst({
        where: { photoUrl: rawPhotoUrl },
      });
      if (existingPhotoPlayer) {
        return NextResponse.json(
          { error: `Foto ini sudah digunakan oleh pemain lain (${existingPhotoPlayer.name}). Silakan gunakan file foto lain.` },
          { status: 400 }
        );
      }
    }

    const player = await prisma.player.create({
      data: {
        name: data.name,
        slug,
        number: finalNumber,
        position: (() => {
          const p = (data.position || '').trim().toUpperCase();
          if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
          if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DEFENDER';
          if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 'MIDFIELDER';
          return 'FORWARD';
        })(),
        nationality: data.nationality || 'Indonesia',
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        heightCm: data.heightCm ? parseInt(data.heightCm) : null,
        weightKg: data.weightKg ? parseInt(data.weightKg) : null,
        photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80',
        bio: data.bio || '',
        isCaptain: Boolean(data.isCaptain),
        isFeatured: Boolean(data.isFeatured),
        status: data.status || 'Active',
        isGuest: Boolean(data.isGuest),
        guestMatchId: data.guestMatchId || null,
        goals: parseInt(data.goals || 0),
        assists: parseInt(data.assists || 0),
        appearances: parseInt(data.appearances || 0),
        yellowCards: parseInt(data.yellowCards || 0),
        redCards: parseInt(data.redCards || 0),
      },
    });

    await cleanupUnusedUploads();

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath('/stats');

    return NextResponse.json(player);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error?.message || 'Gagal menambah pemain' }, { status: 500 });
  }
}
