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
  isHome,
  matchDate,
  venue,
  inviteUrl,
}: {
  playerName: string;
  teamName: string;
  opponentName: string;
  competition: string;
  stage?: string | null;
  isHome: boolean;
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
  const homeAway = isHome ? 'Kandang (Home)' : 'Tandang (Away)';
  const compLabel = stage ? `${competition} - ${stage}` : competition;

  return `Halo *${playerName}*,

Anda dipanggil bertanding membela *${teamName}*! ⚽🔥

📋 *DETAIL PERTANDINGAN*:
⚔️ *Lawan*: ${opponentName}
🏆 *Kompetisi*: ${compLabel}
🏠 *Status*: ${homeAway}
📅 *Waktu*: ${dateStr}
⏰ *Kickoff*: ${timeStr} WIB
📍 *Lokasi*: ${venue || 'Menyusul'}

Mohon konfirmasi kesiapan dan kehadiran Anda untuk laga ini melalui tautan resmi di bawah:
👉 ${inviteUrl}

Pilihan kehadiran di web:
✅ IKUT BERTANDING
❌ TIDAK BISA IKUT

Terima kasih atas komitmen dan semangat juangnya! 🔵⚪
*${teamName} Management*`;
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

    // Find active squad players for this season
    let players = await prisma.player.findMany({
      where: {
        isGuest: false,
        OR: [
          ...(match.seasonId ? [{ seasons: { some: { id: match.seasonId } } }] : []),
          ...(match.seasonName ? [{ seasons: { some: { name: match.seasonName } } }] : []),
        ],
      },
      orderBy: { number: 'asc' },
    });

    // Fallback: If no players enrolled in that specific season yet, load all non-guest players
    if (players.length === 0) {
      players = await prisma.player.findMany({
        where: { isGuest: false },
        orderBy: { number: 'asc' },
      });
    }

    // Existing attendances
    const attendances = await prisma.matchAttendance.findMany({
      where: { matchId: match.id },
    });
    const attMap = new Map(attendances.map((a) => [a.playerId, a]));

    const urlObj = new URL(req.url);
    const origin = urlObj.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://marinerssc.vercel.app';

    const playerInvites = players.map((p) => {
      const resolved = resolvePlayerForSeason(p, match.seasonName);
      const att = attMap.get(p.id);
      const status = att ? att.status : 'INVITED';
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
        declineReason,
        inviteUrl,
        message,
        waUrl,
      };
    });

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
      totalWithPhone: playerInvites.filter((p) => Boolean(p.cleanPhone)).length,
      confirmedCount: playerInvites.filter((p) => p.status === 'CONFIRMED').length,
      declinedCount: playerInvites.filter((p) => p.status === 'DECLINED').length,
      invitedCount: playerInvites.filter((p) => p.status === 'INVITED').length,
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

    // Find active squad players for this season
    let players = await prisma.player.findMany({
      where: {
        isGuest: false,
        OR: [
          ...(match.seasonId ? [{ seasons: { some: { id: match.seasonId } } }] : []),
          ...(match.seasonName ? [{ seasons: { some: { name: match.seasonName } } }] : []),
        ],
      },
      orderBy: { number: 'asc' },
    });

    if (players.length === 0) {
      players = await prisma.player.findMany({
        where: { isGuest: false },
        orderBy: { number: 'asc' },
      });
    }

    // Filter by playerIds if provided
    if (Array.isArray(body.playerIds) && body.playerIds.length > 0) {
      const allowed = new Set(body.playerIds);
      players = players.filter((p) => allowed.has(p.id));
    }

    // Upsert MatchAttendance for each player as 'INVITED'
    const existingAttendances = await prisma.matchAttendance.findMany({
      where: { matchId: match.id },
    });
    const existingMap = new Map(existingAttendances.map((a) => [a.playerId, a]));

    for (const p of players) {
      const existing = existingMap.get(p.id);
      if (!existing) {
        await prisma.matchAttendance.create({
          data: {
            matchId: match.id,
            playerId: p.id,
            playerType: 'SQUAD',
            playerName: p.name,
            status: 'INVITED',
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

