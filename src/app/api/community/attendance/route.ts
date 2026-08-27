import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMemberSession } from '@/lib/memberAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getMemberSession();
    if (!session) {
      return NextResponse.json({ error: 'Sesi member tidak valid. Silakan login.' }, { status: 401 });
    }

    const { matchId, funMatchId, action, reason, playBoth = false } = await req.json();

    if (!action || (!matchId && !funMatchId)) {
      return NextResponse.json({ error: 'Parameter tidak lengkap' }, { status: 400 });
    }

    const statusValue = action === 'JOIN' ? 'CONFIRMED' : 'DECLINED';

    if (funMatchId) {
      // RSVP Fun Match
      const existing = await prisma.matchAttendance.findFirst({
        where: {
          funMatchId,
          memberId: session.memberId,
        },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: {
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Tidak bisa hadir') : null,
          },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            funMatchId,
            memberId: session.memberId,
            playerType: 'MEMBER',
            playerName: session.fullName,
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Tidak bisa hadir') : null,
          },
        });
      }
    } else if (matchId) {
      // Respond to Tim Utama invitation
      let linkedPlayerId: string | null = null;
      if (action === 'JOIN') {
        const mem = await prisma.member.findUnique({
          where: { id: session.memberId },
          include: { player: true },
        });

        if (mem) {
          let p = mem.playerId
            ? await prisma.player.findUnique({ where: { id: mem.playerId } })
            : null;

          if (!p) {
            p = await prisma.player.findFirst({
              where: { name: mem.fullName },
            });
          }

          if (!p) {
            let baseSlug = mem.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            let slug = baseSlug;
            if (await prisma.player.findUnique({ where: { slug } })) {
              slug = `${baseSlug}-${mem.jerseyNumber}`;
            }

            let num = mem.jerseyNumber;
            if (await prisma.player.findUnique({ where: { number: num } })) {
              let altNum = 30;
              while (await prisma.player.findUnique({ where: { number: altNum } })) {
                altNum++;
              }
              num = altNum;
            }

            p = await prisma.player.create({
              data: {
                name: mem.fullName,
                slug,
                number: num,
                position: (() => {
                  const pos = (mem.position || '').toUpperCase();
                  if (pos === 'GK' || pos === 'GOALKEEPER') return 'GOALKEEPER';
                  if (pos === 'DF' || pos === 'DEFENDER') return 'DEFENDER';
                  if (pos === 'MF' || pos === 'MIDFIELDER') return 'MIDFIELDER';
                  return 'FORWARD';
                })(),
                photoUrl: mem.photoUrl || '/defaultplayer.png',
                isGuest: false,
                bio: `Member Komunitas Mariners SC (${mem.tier})`,
              },
            });
          }

          linkedPlayerId = p.id;

          if (mem.playerId !== p.id) {
            await prisma.member.update({
              where: { id: mem.id },
              data: { playerId: p.id },
            });
          }
        }
      }

      const existing = await prisma.matchAttendance.findFirst({
        where: {
          matchId,
          memberId: session.memberId,
        },
      });

      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: {
            status: statusValue,
            playerId: linkedPlayerId || existing.playerId,
            declineReason: action === 'DECLINE' ? (reason || 'Menolak panggilan tim utama') : null,
          },
        });
      } else {
        // If not invited yet, create as confirmed/declined
        await prisma.matchAttendance.create({
          data: {
            matchId,
            memberId: session.memberId,
            playerId: linkedPlayerId,
            playerType: 'MEMBER',
            playerName: session.fullName,
            status: statusValue,
            declineReason: action === 'DECLINE' ? (reason || 'Menolak panggilan tim utama') : null,
          },
        });
      }

      // Handle Fun Match Synchronization when joining Tim Utama
      if (action === 'JOIN') {
        const now = new Date();
        const upcomingFunMatch = await prisma.funMatch.findFirst({
          where: {
            matchDate: { gte: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
          },
          orderBy: { matchDate: 'asc' },
        });

        if (upcomingFunMatch) {
          const funExisting = await prisma.matchAttendance.findFirst({
            where: {
              funMatchId: upcomingFunMatch.id,
              memberId: session.memberId,
            },
          });

          if (playBoth) {
            // Member chooses to play both (2x match)
            if (funExisting) {
              await prisma.matchAttendance.update({
                where: { id: funExisting.id },
                data: { status: 'CONFIRMED', declineReason: null },
              });
            } else {
              await prisma.matchAttendance.create({
                data: {
                  funMatchId: upcomingFunMatch.id,
                  memberId: session.memberId,
                  playerType: 'MEMBER',
                  playerName: session.fullName,
                  status: 'CONFIRMED',
                },
              });
            }
          } else {
            // Default: Auto-decline fun match so they focus on Main Squad
            if (funExisting) {
              await prisma.matchAttendance.update({
                where: { id: funExisting.id },
                data: {
                  status: 'DECLINED',
                  declineReason: 'Fokus bermain di Skuad Utama',
                },
              });
            } else {
              await prisma.matchAttendance.create({
                data: {
                  funMatchId: upcomingFunMatch.id,
                  memberId: session.memberId,
                  playerType: 'MEMBER',
                  playerName: session.fullName,
                  status: 'DECLINED',
                  declineReason: 'Fokus bermain di Skuad Utama',
                },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'JOIN' ? 'Konfirmasi kehadiran berhasil!' : 'Kehadiran dibatalkan / ditolak.',
      status: statusValue,
    });
  } catch (error) {
    console.error('Attendance error:', error);
    return NextResponse.json({ error: 'Gagal memproses konfirmasi kehadiran' }, { status: 500 });
  }
}
