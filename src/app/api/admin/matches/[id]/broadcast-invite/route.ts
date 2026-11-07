import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';

function cleanIndonesianPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62') && cleaned.length > 5) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

function buildInviteMessage({
  playerName,
  teamName,
  opponentName,
  competition,
  stage,
  matchDate,
  venue,
  inviteUrl,
}: {
  playerName: string;
  teamName: string;
  opponentName: string;
  competition?: string;
  stage?: string | null;
  isHome?: boolean;
  matchDate: Date;
  venue?: string | null;
  inviteUrl: string;
}): string {
  const dateStr = formatWibDate(matchDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = formatWibTime(matchDate);
  const displayTeam = teamName || 'MARS FC';
  const stageLabel = (stage || competition || '').trim();
  const header = stageLabel ? `*MARS CALLING!* ${stageLabel}` : '*MARS CALLING!*';

  return `${header}
Halo *${playerName}*,

Anda dipanggil masuk dalam daftar skuad *${displayTeam}* untuk laga berikut:

⚔️ *Lawan*: ${opponentName}
📅 *Waktu*: ${dateStr} (Kickoff ${timeStr} WIB)
🏟️ *Tempat*: ${venue || 'Menyusul'}

Langsung konfirmasi satu klik di sini ya:
${inviteUrl}

Ditunggu konfirmasinya secepatnya!
*MARS*`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: matchId } = await params;

    const [match, systemSetting] = await Promise.all([
      prisma.footballMatch.findUnique({
        where: { id: matchId },
        include: {
          season: true,
          competitionRef: true,
        },
      }),
      (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null),
    ]);

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    const teamName = systemSetting?.teamName || 'MARINERS SC';

    // Existing attendances for this match
    const attendances = await prisma.matchAttendance.findMany({
      where: { matchId: match.id },
    });
    const attMap = new Map(attendances.map((a) => [a.playerId, a]));

    // Find active squad players for this season
    const seasonConditions: any[] = [];
    if (match.seasonId) seasonConditions.push({ seasons: { some: { id: match.seasonId } } });
    if (match.seasonName) {
      seasonConditions.push({ seasons: { some: { name: match.seasonName } } });
      seasonConditions.push({ seasonData: { contains: `"${match.seasonName}"` } });
    }

    const unknownExclusion = [
      { id: 'unknown-player' },
      { slug: 'tidak-diketahui' },
      { name: 'Tidak Diketahui' },
    ];

    let seasonPlayers = await prisma.player.findMany({
      where: {
        isGuest: false,
        NOT: unknownExclusion,
        OR: seasonConditions.length > 0 ? seasonConditions : undefined,
      },
      orderBy: { number: 'asc' },
    });

    // Fallback: If no players enrolled in that specific season yet, load all non-guest players
    if (seasonPlayers.length === 0) {
      seasonPlayers = await prisma.player.findMany({
        where: {
          isGuest: false,
          NOT: unknownExclusion,
        },
        orderBy: { number: 'asc' },
      });
    }

    // Also include loan players (isGuest: true)
    const loanPlayers = await prisma.player.findMany({
      where: {
        isGuest: true,
        NOT: unknownExclusion,
      },
      orderBy: { number: 'asc' },
    });

    // Also include extra players tied to this match (already has attendance or assigned as loan/guest)
    const extraPlayerIds = new Set<string>();
    attendances.forEach((a) => {
      if (a.playerId && a.playerId !== 'unknown-player') extraPlayerIds.add(a.playerId);
    });

    const extraPlayers = await prisma.player.findMany({
      where: {
        NOT: unknownExclusion,
        OR: [
          ...(extraPlayerIds.size > 0 ? [{ id: { in: Array.from(extraPlayerIds) } }] : []),
          { guestMatchId: match.id },
        ],
      },
    });

    // Merge and deduplicate
    const playerMap = new Map<string, any>();
    seasonPlayers.forEach((p) => playerMap.set(p.id, p));
    loanPlayers.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });
    extraPlayers.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });

    const players = Array.from(playerMap.values()).sort((a, b) => (a.number || 0) - (b.number || 0));

    const urlObj = new URL(req.url);
    const origin = urlObj.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://marinerssc.vercel.app';

    const playerInvites = players.map((p) => {
      const resolved = resolvePlayerForSeason(p, match.seasonName);
      const att = attMap.get(p.id);
      const isInvited = Boolean(att && (att.invitedAt || att.status === 'CONFIRMED' || att.status === 'DECLINED'));
      const status = att ? (isInvited ? att.status : 'NOT_INVITED') : 'NOT_INVITED';
      const declineReason = att?.declineReason || null;
      const cleanPhone = cleanIndonesianPhone(p.phone);
      const inviteUrl = `${origin}/matches/${match.id}?p=${p.id}`;
      const message = buildInviteMessage({
        playerName: p.name,
        teamName,
        opponentName: match.opponentName,
        competition: match.competition,
        stage: match.stage,
        isHome: match.isHome,
        matchDate: match.matchDate,
        venue: match.venue,
        inviteUrl,
      });
      const waUrl = cleanPhone
        ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
        : null;

      return {
        id: p.id,
        name: p.name,
        number: resolved.number,
        position: p.position,
        photoUrl: resolved.photoUrl,
        phone: p.phone,
        cleanPhone,
        status,
        isInvited,
        invitedAt: att?.invitedAt || null,
        declineReason,
        inviteUrl,
        message,
        waUrl,
        isGuest: Boolean(p.isGuest),
        playerType: p.isGuest ? 'LOAN' : 'SQUAD',
      };
    });

    const squadCount = playerInvites.filter((p) => !p.isGuest).length;
    const loanCount = playerInvites.filter((p) => p.isGuest).length;

    return NextResponse.json({
      match: {
        id: match.id,
        opponentName: match.opponentName,
        matchDate: match.matchDate,
        competition: match.competition,
        stage: match.stage,
        venue: match.venue,
        isHome: match.isHome,
        seasonName: match.seasonName,
      },
      hasWhatsAppToken: Boolean(systemSetting?.whatsappToken),
      whatsappMode: systemSetting?.whatsappMode || 'disabled',
      isInviteAllowed: (match as any).sendWhatsAppInvite !== false,
      totalPlayers: playerInvites.length,
      squadCount,
      loanCount,
      totalWithPhone: playerInvites.filter((p) => Boolean(p.cleanPhone)).length,
      confirmedCount: playerInvites.filter((p) => p.status === 'CONFIRMED').length,
      declinedCount: playerInvites.filter((p) => p.status === 'DECLINED').length,
      invitedCount: playerInvites.filter((p) => p.status === 'INVITED').length,
      notInvitedCount: playerInvites.filter((p) => p.status === 'NOT_INVITED').length,
      players: playerInvites,
    });
  } catch (error: any) {
    console.error('Error fetching broadcast invite data:', error);
    return NextResponse.json({ error: 'Gagal mengambil data broadcast undangan' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id: matchId } = await params;
    const body = await req.json().catch(() => ({}));
    const autoSendWhatsApp = Boolean(body.autoSendWhatsApp);

    const [match, systemSetting] = await Promise.all([
      prisma.footballMatch.findUnique({
        where: { id: matchId },
        include: {
          season: true,
        },
      }),
      (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
      }).catch(() => null),
    ]);

    if (!match) {
      return NextResponse.json({ error: 'Pertandingan tidak ditemukan' }, { status: 404 });
    }

    const teamName = systemSetting?.teamName || 'MARINERS SC';

    // Existing attendances for this match
    const existingAttendances = await prisma.matchAttendance.findMany({
      where: { matchId: match.id },
    });
    const existingMap = new Map(existingAttendances.map((a) => [a.playerId, a]));

    // Find active squad players for this season
    const seasonConditions: any[] = [];
    if (match.seasonId) seasonConditions.push({ seasons: { some: { id: match.seasonId } } });
    if (match.seasonName) {
      seasonConditions.push({ seasons: { some: { name: match.seasonName } } });
      seasonConditions.push({ seasonData: { contains: `"${match.seasonName}"` } });
    }

    const unknownExclusion = [
      { id: 'unknown-player' },
      { slug: 'tidak-diketahui' },
      { name: 'Tidak Diketahui' },
    ];

    let seasonPlayers = await prisma.player.findMany({
      where: {
        isGuest: false,
        NOT: unknownExclusion,
        OR: seasonConditions.length > 0 ? seasonConditions : undefined,
      },
      orderBy: { number: 'asc' },
    });

    if (seasonPlayers.length === 0) {
      seasonPlayers = await prisma.player.findMany({
        where: {
          isGuest: false,
          NOT: unknownExclusion,
        },
        orderBy: { number: 'asc' },
      });
    }

    // Also include loan players (isGuest: true)
    const loanPlayers = await prisma.player.findMany({
      where: {
        isGuest: true,
        NOT: unknownExclusion,
      },
      orderBy: { number: 'asc' },
    });

    // Also include extra players tied to this match (already has attendance or assigned as loan/guest)
    const extraPlayerIds = new Set<string>();
    existingAttendances.forEach((a) => {
      if (a.playerId && a.playerId !== 'unknown-player') extraPlayerIds.add(a.playerId);
    });

    const extraPlayers = await prisma.player.findMany({
      where: {
        NOT: unknownExclusion,
        OR: [
          ...(extraPlayerIds.size > 0 ? [{ id: { in: Array.from(extraPlayerIds) } }] : []),
          { guestMatchId: match.id },
        ],
      },
    });

    // Merge and deduplicate
    const playerMap = new Map<string, any>();
    seasonPlayers.forEach((p) => playerMap.set(p.id, p));
    loanPlayers.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });
    extraPlayers.forEach((p) => {
      if (!playerMap.has(p.id)) {
        playerMap.set(p.id, p);
      }
    });

    let players = Array.from(playerMap.values()).sort((a, b) => (a.number || 0) - (b.number || 0));

    // Mark single player as invited (e.g. when copying link or clicking WhatsApp button)
    if (body.markPlayerId) {
      const p = playerMap.get(body.markPlayerId) || players.find((pl) => pl.id === body.markPlayerId);
      if (p) {
        const existing = existingMap.get(p.id);
        if (existing) {
          await prisma.matchAttendance.update({
            where: { id: existing.id },
            data: {
              invitedAt: existing.invitedAt || new Date(),
              status: existing.status === 'NOT_INVITED' ? 'INVITED' : existing.status,
            },
          });
        } else {
          await prisma.matchAttendance.create({
            data: {
              matchId: match.id,
              playerId: p.id,
              playerType: p.isGuest ? 'GUEST' : 'SQUAD',
              playerName: p.name,
              status: 'INVITED',
              invitedAt: new Date(),
            },
          });
        }
        return NextResponse.json({ success: true, markedPlayerId: p.id });
      }
    }

    // Filter by playerIds if provided
    if (Array.isArray(body.playerIds) && body.playerIds.length > 0) {
      const allowed = new Set(body.playerIds);
      players = players.filter((p) => allowed.has(p.id));
    }

    for (const p of players) {
      const existing = existingMap.get(p.id);
      if (existing) {
        await prisma.matchAttendance.update({
          where: { id: existing.id },
          data: {
            invitedAt: existing.invitedAt || new Date(),
            status: existing.status === 'NOT_INVITED' ? 'INVITED' : existing.status,
          },
        });
      } else {
        await prisma.matchAttendance.create({
          data: {
            matchId: match.id,
            playerId: p.id,
            playerType: p.isGuest ? 'GUEST' : 'SQUAD',
            playerName: p.name,
            status: 'INVITED',
            invitedAt: new Date(),
          },
        });
      }
    }

    const urlObj = new URL(req.url);
    const origin = urlObj.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://marinerssc.vercel.app';

    // Automatic dispatch via WhatsApp Gateway (Fonnte) if token configured
    let gatewaySentCount = 0;
    let gatewayFailedCount = 0;
    const token = systemSetting?.whatsappToken?.trim();
    const isScanMode = (systemSetting?.whatsappMode || 'disabled') === 'scan';
    const isInviteAllowed = (match as any).sendWhatsAppInvite !== false;

    if (autoSendWhatsApp && token && isScanMode && isInviteAllowed) {
      const sendPromises = players
        .filter((p) => cleanIndonesianPhone(p.phone).length >= 10)
        .map(async (p) => {
          const cleanPhone = cleanIndonesianPhone(p.phone);
          const inviteUrl = `${origin}/matches/${match.id}?p=${p.id}`;
          const message = buildInviteMessage({
            playerName: p.name,
            teamName,
            opponentName: match.opponentName,
            competition: match.competition,
            stage: match.stage,
            isHome: match.isHome,
            matchDate: match.matchDate,
            venue: match.venue,
            inviteUrl,
          });

          try {
            const fRes = await fetch('https://api.fonnte.com/send', {
              method: 'POST',
              headers: {
                Authorization: token,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                target: cleanPhone,
                message: message,
              }),
            });
            const fData = await fRes.json().catch(() => null);
            if (fRes.ok && fData?.status) {
              gatewaySentCount++;
            } else {
              gatewayFailedCount++;
            }
          } catch (e) {
            console.error('Fonnte send error for', p.name, e);
            gatewayFailedCount++;
          }
        });

      await Promise.allSettled(sendPromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Undangan pertandingan berhasil disiapkan',
      totalInvited: players.length,
      gatewaySentCount,
      gatewayFailedCount,
      usedGateway: Boolean(autoSendWhatsApp && token),
    });
  } catch (error: any) {
    console.error('Error creating broadcast invites:', error);
    return NextResponse.json({ error: 'Gagal memproses broadcast undangan' }, { status: 500 });
  }
}

