import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cleanupUnusedUploads } from '@/lib/cleanup';
import { renamePlayerPhotoFile } from '@/lib/fileNaming';
import { parsePlayerSeasonData } from '@/lib/seasonPlayer';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();

    const existingPlayer = await prisma.player.findUnique({
      where: { id },
      include: { seasons: true },
    });
    if (!existingPlayer) {
      return NextResponse.json({ error: 'Pemain tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      let baseSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      let slug = baseSlug;
      const existingSlug = await prisma.player.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingSlug) {
        slug = `${baseSlug}-${parseInt(data.number) || existingPlayer.number}`;
      }
      const existingSlug2 = await prisma.player.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingSlug2) {
        slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
      }
      updateData.slug = slug;
    }

    // Determine target season if provided
    const targetSeason = (data.seasonName || data.seasonId || '').trim();

    // 1. Number validation and season override
    let targetNumber = existingPlayer.number;
    if (data.number !== undefined) {
      const newNum = parseInt(data.number);
      targetNumber = newNum;

      if (!existingPlayer.isGuest) {
        if (targetSeason) {
          // Check conflict strictly among other players in this target season
          const otherPlayersInSeason = await prisma.player.findMany({
            where: {
              isGuest: false,
              NOT: { id },
              seasons: { some: { OR: [{ name: targetSeason }, { id: targetSeason }] } },
            },
            select: { id: true, name: true, number: true, seasonData: true },
          });

          const conflictPlayer = otherPlayersInSeason.find((p) => {
            const sd = parsePlayerSeasonData(p.seasonData);
            const resolvedNum = typeof sd[targetSeason]?.number === 'number' ? sd[targetSeason].number : p.number;
            return resolvedNum === newNum;
          });

          if (conflictPlayer) {
            return NextResponse.json(
              { error: `Nomor punggung ${newNum} sudah digunakan oleh ${conflictPlayer.name} di musim ${targetSeason}.` },
              { status: 400 }
            );
          }
        } else if (newNum !== existingPlayer.number) {
          const conflict = await prisma.player.findFirst({
            where: {
              number: newNum,
              isGuest: false,
              NOT: { id },
            },
          });
          if (conflict) {
            return NextResponse.json(
              { error: `Nomor punggung ${newNum} sudah digunakan oleh ${conflict.name}.` },
              { status: 400 }
            );
          }
        }
      }
    }

    if (data.position !== undefined) {
      const p = (data.position || '').trim().toUpperCase();
      if (p === 'GK' || p === 'GOALKEEPER') updateData.position = 'GOALKEEPER';
      else if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) updateData.position = 'DEFENDER';
      else if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) updateData.position = 'MIDFIELDER';
      else updateData.position = 'FORWARD';
    }
    if (data.nationality !== undefined) updateData.nationality = data.nationality;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.heightCm !== undefined) updateData.heightCm = data.heightCm ? parseInt(data.heightCm) : null;
    if (data.weightKg !== undefined) updateData.weightKg = data.weightKg ? parseInt(data.weightKg) : null;

    // 2. Photo validation
    let targetPhotoUrl = existingPlayer.photoUrl;
    if (data.photoUrl !== undefined) {
      const rawPhotoUrl = (data.photoUrl || '').trim();
      const isDefaultTemplate = !rawPhotoUrl || rawPhotoUrl === '/playertemplate.webp' || rawPhotoUrl.includes('unsplash.com');

      if (!isDefaultTemplate) {
        const existingPhotoPlayer = await prisma.player.findFirst({
          where: {
            photoUrl: rawPhotoUrl,
            NOT: { id },
          },
        });
        if (existingPhotoPlayer) {
          return NextResponse.json(
            { error: `Foto ini sudah digunakan oleh pemain lain (${existingPhotoPlayer.name}). Silakan gunakan file foto lain.` },
            { status: 400 }
          );
        }
      }
      targetPhotoUrl = rawPhotoUrl;
    }

    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.isCaptain !== undefined) updateData.isCaptain = Boolean(data.isCaptain);
    if (data.isFeatured !== undefined) updateData.isFeatured = Boolean(data.isFeatured);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.isGuest !== undefined) updateData.isGuest = Boolean(data.isGuest);
    if (data.goals !== undefined) updateData.goals = parseInt(data.goals || 0);
    if (data.assists !== undefined) updateData.assists = parseInt(data.assists || 0);
    if (data.appearances !== undefined) updateData.appearances = parseInt(data.appearances || 0);
    if (data.yellowCards !== undefined) updateData.yellowCards = parseInt(data.yellowCards || 0);
    if (data.redCards !== undefined) updateData.redCards = parseInt(data.redCards || 0);

    // 3. Rename photo on disk if needed
    const finalPos = updateData.position || existingPlayer.position;
    const finalName = updateData.name || existingPlayer.name;

    if (targetPhotoUrl && targetPhotoUrl.startsWith('/uploads/players/')) {
      const renamedUrl = renamePlayerPhotoFile(targetPhotoUrl, finalPos, targetNumber, finalName, targetSeason || null);
      if (renamedUrl) {
        targetPhotoUrl = renamedUrl;
      }
    }

    // 4. Handle season-specific data isolation
    if (targetSeason) {
      const seasonMap = parsePlayerSeasonData(existingPlayer.seasonData);

      // Snapshot other existing seasons if they don't have an override yet
      // This guarantees editing in 2027 will NEVER mutate 2026 data!
      existingPlayer.seasons.forEach((s) => {
        const sKey = s.name;
        if (sKey !== targetSeason && !seasonMap[sKey]) {
          seasonMap[sKey] = {
            photoUrl: existingPlayer.photoUrl,
            number: existingPlayer.number,
          };
        }
      });

      // Set target season overrides
      seasonMap[targetSeason] = {
        photoUrl: targetPhotoUrl,
        number: targetNumber,
      };

      updateData.seasonData = JSON.stringify(seasonMap);

      // Also update baseline if target season is marked as current or is the only season
      const targetSeasonObj = existingPlayer.seasons.find((s) => s.name === targetSeason || s.id === targetSeason);
      if (!targetSeasonObj || targetSeasonObj.isCurrent || existingPlayer.seasons.length <= 1) {
        updateData.photoUrl = targetPhotoUrl;
        updateData.number = targetNumber;
      }
    } else {
      updateData.photoUrl = targetPhotoUrl;
      updateData.number = targetNumber;
    }

    const player = await prisma.player.update({
      where: { id },
      data: updateData,
    });

    // Automatically remove replaced unreferenced files from disk
    await cleanupUnusedUploads();

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath(`/players/${player.slug}`);
    revalidatePath('/admin/players');
    revalidatePath('/stats');

    return NextResponse.json(player);
  } catch (error: any) {
    console.error('PUT /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal memperbarui data pemain' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Sesi berakhir. Silakan login ulang di portal admin.' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.player.delete({ where: { id } });

    // Automatically remove deleted player's files from disk
    await cleanupUnusedUploads();

    revalidatePath('/');
    revalidatePath('/players');
    revalidatePath('/stats');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/players error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menghapus pemain' },
      { status: 500 }
    );
  }
}
