export interface PerformanceActivity {
  id: string;
  matchId: string;
  opponentName: string;
  matchDate: Date | string;
  stage?: string | null;
  type:
    | 'goal'
    | 'assist'
    | 'appearance'
    | 'declined_appearance'
    | 'ignored_invite'
    | 'late_decline'
    | 'no_show'
    | 'yellow_card'
    | 'red_card'
    | 'other';
  title: string;
  reason: string;
  points: number;
  minute?: number;
}

export interface PlayerPerformanceResult {
  totalPoints: number; // Total EXP (matchPoints + disciplinePoints)
  matchPoints: number; // Top Performa: Gol (+5), Assist (+3), Tampil (+1), Tampil Tanpa Konfirmasi (0), Kartu Kuning (-1), Kartu Merah (-3)
  disciplinePoints: number; // Disiplin Undangan: Abaikan (-3), Batal <1 Jam (-1), Tanpa Kabar (-4)
  goalsCount: number;
  assistsCount: number;
  appearancesCount: number;
  yellowCount: number;
  redCount: number;
  penaltiesCount: number;
  isIndiscipline: boolean;
  status: 'Active' | 'INDISCIPLINE' | 'Injured' | 'Inactive';
  badgeColor: {
    border: string;
    bg: string;
    text: string;
    ring: string;
    level: 'normal' | 'yellow' | 'orange' | 'red';
  };
  activities: PerformanceActivity[];
}

export function getExpBadgeColor(points: number): PlayerPerformanceResult['badgeColor'] {
  if (points <= -30) {
    // -30 dan seterusnya : MERAH
    return {
      border: 'border-rose-500/90',
      bg: 'bg-gradient-to-t from-rose-600/50 via-rose-500/25 to-rose-400/10',
      text: 'text-white',
      ring: 'ring-rose-500/30',
      level: 'red',
    };
  }
  if (points <= -15) {
    // -15 sampai -29 : ORANYE
    return {
      border: 'border-orange-500/90',
      bg: 'bg-gradient-to-t from-orange-600/45 via-orange-500/20 to-orange-400/5',
      text: 'text-white',
      ring: 'ring-orange-500/30',
      level: 'orange',
    };
  }
  if (points <= 0) {
    // 0 sampai -14 : KUNING
    return {
      border: 'border-yellow-400/90',
      bg: 'bg-gradient-to-t from-yellow-500/45 via-yellow-400/20 to-yellow-300/5',
      text: 'text-white',
      ring: 'ring-yellow-400/30',
      level: 'yellow',
    };
  }
  // 1 dan seterusnya : HIJAU
  return {
    border: 'border-emerald-400/90',
    bg: 'bg-gradient-to-t from-emerald-600/45 via-emerald-500/20 to-emerald-400/5',
    text: 'text-white',
    ring: 'ring-emerald-400/30',
    level: 'normal',
  };
}

const EXEMPT_REASONS = [
  'cedera',
  'injured',
  'inactive',
  'nonaktif',
  'tidak terdaftar',
  'tidak masuk skuad',
  'sakit',
  'izin',
  'tugas',
  'dinas',
  'dispensasi',
  'exemption',
  'exempt',
];

function isExemptReason(reason?: string | null): boolean {
  if (!reason) return false;
  const lower = reason.trim().toLowerCase();
  return EXEMPT_REASONS.some((r) => lower.includes(r));
}

/**
 * Calculates a player's performance points, activities, and discipline status
 * for a specific season or across all eligible matches.
 */
export function calculatePlayerPerformance(
  player: any,
  matches: any[],
  targetSeason: string // e.g. "2027", "2026", "SEMUA", "all"
): PlayerPerformanceResult {
  const isAll = targetSeason === 'SEMUA' || targetSeason === 'all';
  const nowMs = Date.now();

  // Filter matches for the targeted season
  const seasonMatches = isAll
    ? matches
    : matches.filter((m: any) => {
        const s = (m.seasonName || m.season?.name || '').trim();
        const yr =
          m.seasonName?.match(/\d{4}/)?.[0] ||
          m.season?.name?.match(/\d{4}/)?.[0] ||
          (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
        return s === targetSeason || s.includes(targetSeason) || yr === targetSeason;
      });

  const activities: PerformanceActivity[] = [];

  let goalsCount = 0;
  let assistsCount = 0;
  let appearancesCount = 0;
  let yellowCount = 0;
  let redCount = 0;
  let penaltiesCount = 0;

  const playerId = player.id;
  const isLoan = Boolean(player.isGuest);
  const joinDateMs = player.joinDate ? new Date(player.joinDate).getTime() : null;
  const playerNameLower = (player.name || '').toLowerCase();
  const playerSlugLower = (player.slug || '').toLowerCase();
  const playerStatusLower = (player.status || '').toLowerCase().trim();
  const isPlayerInactiveOrInjured =
    playerStatusLower === 'inactive' ||
    playerStatusLower === 'injured' ||
    playerStatusLower === 'cedera';
  const isExemptPlayer =
    playerNameLower.includes('endra') ||
    playerSlugLower.includes('endra') ||
    playerNameLower.includes('rifki') ||
    playerSlugLower.includes('rifki');

  for (const match of seasonMatches) {
    const matchDateObj = match.matchDate ? new Date(match.matchDate) : null;
    const matchDateMs = matchDateObj ? matchDateObj.getTime() : 0;
    const isPastKickoff =
      match.status === 'finished' || (matchDateMs > 0 && nowMs >= matchDateMs);

    const matchSeasonYear =
      parseInt(match.seasonName?.match(/\d{4}/)?.[0] || '', 10) ||
      (matchDateObj ? matchDateObj.getFullYear() : 0);

    // Discipline rules ONLY apply starting season 2027 onwards
    const isDisciplineSeason = matchSeasonYear >= 2027;

    // Discipline rules DO NOT apply to loan players, inactive or injured players, OR matches before joinDate
    const isDisciplineEligible =
      isDisciplineSeason &&
      !isLoan &&
      !isPlayerInactiveOrInjured &&
      (joinDateMs === null || isNaN(joinDateMs) || matchDateMs >= joinDateMs - 12 * 3600 * 1000);

    // Check lineup participation
    const lineup = (match.lineups || []).find(
      (l: any) => l.playerId === playerId || l.player?.id === playerId
    );
    const inLineup = Boolean(lineup);

    // Check match attendance record
    const attendance = (match.attendances || []).find(
      (a: any) => a.playerId === playerId || a.player?.id === playerId
    );

    // Check events for this match
    // Goals: goal, penalty
    const matchEvents = (match.events || []).filter(
      (e: any) => e.playerId === playerId || e.player?.id === playerId
    );
    const assistedMatchEvents = (match.events || []).filter(
      (e: any) =>
        (e.assistPlayerId === playerId || e.assistPlayer?.id === playerId) &&
        e.type !== 'sub'
    );

    // 1. Lineup appearance & attendance interaction
    const attStatus = attendance?.status;
    const isManualConfirm = Boolean(attendance?.isManualConfirm);
    const wasInvited =
      Boolean(attendance) &&
      (Boolean(attendance.invitedAt) || attStatus === 'INVITED' || attStatus === 'CONFIRMED' || attStatus === 'DECLINED');

    if (inLineup) {
      appearancesCount++;

      // User rule:
      // "jika di klik manual poin pertandingan gak akan nambah +1, karena itu khusus pemain yang tidak konfirmasi/tidak ikut namun tiba tiba ikut, masuknya ke tampil tanpa konfirmasi"
      const isUnconfirmedAppearance =
        isDisciplineEligible &&
        (isManualConfirm || attStatus === 'DECLINED' || !wasInvited || attStatus === 'INVITED' || attStatus === 'NOT_INVITED');

      if (isUnconfirmedAppearance) {
        activities.push({
          id: `${match.id}-app-unconfirmed`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'declined_appearance',
          title: 'Tampil Tanpa Konfirmasi',
          reason: isManualConfirm
            ? 'Dikonfirmasi manual oleh admin (tampil tanpa konfirmasi mandiri, 0 poin)'
            : attStatus === 'DECLINED'
            ? 'Tampil di laga meski awalnya berstatus Tidak Ikut (0 poin)'
            : 'Tampil di laga tanpa melakukan konfirmasi kehadiran (0 poin)',
          points: 0,
        });
      } else {
        activities.push({
          id: `${match.id}-app`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'appearance',
          title: 'Tampil di Pertandingan',
          reason: lineup.isStarter ? 'Starter Skuad Utama' : 'Pemain Pengganti',
          points: 1,
        });
      }
    } else if (isDisciplineEligible && isPastKickoff && wasInvited && !isExemptPlayer && !isManualConfirm) {
      // Player was NOT in lineup, match passed kickoff: evaluate discipline rules
      const isExempt = isExemptReason(attendance?.declineReason);
      if (!isExempt) {
        if (attStatus === 'CONFIRMED') {
          // User rule: "ikut tetapi tiba-tiba tidak datang ke pertandingan tanpa mengubah status = -4"
          penaltiesCount++;
          activities.push({
            id: `${match.id}-no-show`,
            matchId: match.id,
            opponentName: match.opponentName,
            matchDate: match.matchDate,
            stage: match.stage,
            type: 'no_show',
            title: 'Konfirmasi Hadir Tanpa Kabar',
            reason: 'Tercatat konfirmasi hadir namun tidak datang ke laga tanpa alasan resmi',
            points: -4,
          });
        } else if (attStatus === 'INVITED') {
          // User rule: "Mengabaikan invite = -3"
          penaltiesCount++;
          activities.push({
            id: `${match.id}-ignored`,
            matchId: match.id,
            opponentName: match.opponentName,
            matchDate: match.matchDate,
            stage: match.stage,
            type: 'ignored_invite',
            title: 'Mengabaikan Undangan',
            reason: 'Tidak merespons undangan kehadiran hingga waktu kickoff tiba',
            points: -3,
          });
        } else if (attStatus === 'DECLINED') {
          // User rule: "mengubah status menjadi batal kurang dari 1 jam menelang kickoff = -1"
          if (attendance?.isLateDecline) {
            penaltiesCount++;
            activities.push({
              id: `${match.id}-late-decline`,
              matchId: match.id,
              opponentName: match.opponentName,
              matchDate: match.matchDate,
              stage: match.stage,
              type: 'late_decline',
              title: 'Batal Hadir < 1 Jam Kickoff',
              reason: 'Membatalkan kehadiran mendadak kurang dari 1 jam sebelum pertandingan',
              points: -1,
            });
          }
        }
      }
    }

    // Special user adjustment for Matchday 1 2027 vs Cikuya (without WA invite broadcast):
    // adly -3, agung -3, ariel -3, ikam -4
    const isCikuyaMatch =
      Boolean(match.opponentName && match.opponentName.toLowerCase().includes('cikuya')) ||
      (Boolean(match.stage && match.stage.toLowerCase().includes('matchday 1')) &&
        (matchSeasonYear === 2027 || (match.opponentName && match.opponentName.toLowerCase().includes('cikuya'))));

    if (isCikuyaMatch && isDisciplineEligible && !inLineup && !isExemptPlayer) {
      const alreadyHasDiscipline = activities.some(
        (a) => a.matchId === match.id && (a.type === 'ignored_invite' || a.type === 'no_show')
      );

      if (!alreadyHasDiscipline) {
        if (playerNameLower.includes('adly') || playerSlugLower.includes('adly')) {
          penaltiesCount++;
          activities.push({
            id: `${match.id}-cikuya-adly-ignored`,
            matchId: match.id,
            opponentName: match.opponentName || 'Cikuya',
            matchDate: match.matchDate,
            stage: match.stage || 'Matchday 1',
            type: 'ignored_invite',
            title: 'Mengabaikan Undangan',
            reason: 'Mengabaikan invite pertandingan (Matchday 1 vs Cikuya)',
            points: -3,
          });
        } else if (playerNameLower.includes('agung') || playerSlugLower.includes('agung')) {
          penaltiesCount++;
          activities.push({
            id: `${match.id}-cikuya-agung-ignored`,
            matchId: match.id,
            opponentName: match.opponentName || 'Cikuya',
            matchDate: match.matchDate,
            stage: match.stage || 'Matchday 1',
            type: 'ignored_invite',
            title: 'Mengabaikan Undangan',
            reason: 'Mengabaikan invite pertandingan (Matchday 1 vs Cikuya)',
            points: -3,
          });
        } else if (playerNameLower.includes('ariel') || playerSlugLower.includes('ariel')) {
          penaltiesCount++;
          activities.push({
            id: `${match.id}-cikuya-ariel-ignored`,
            matchId: match.id,
            opponentName: match.opponentName || 'Cikuya',
            matchDate: match.matchDate,
            stage: match.stage || 'Matchday 1',
            type: 'ignored_invite',
            title: 'Mengabaikan Undangan',
            reason: 'Mengabaikan invite pertandingan (Matchday 1 vs Cikuya)',
            points: -3,
          });
        } else if (playerNameLower.includes('ikam') || playerSlugLower.includes('ikam')) {
          penaltiesCount++;
          activities.push({
            id: `${match.id}-cikuya-ikam-no-show`,
            matchId: match.id,
            opponentName: match.opponentName || 'Cikuya',
            matchDate: match.matchDate,
            stage: match.stage || 'Matchday 1',
            type: 'no_show',
            title: 'Konfirmasi Hadir Tanpa Kabar',
            reason: 'Konfirmasi ikut namun tidak hadir ke laga (Matchday 1 vs Cikuya)',
            points: -4,
          });
        }
      }
    }

    // 2. Goals (+5)
    for (const ge of matchEvents) {
      if (ge.type === 'goal' || ge.type === 'penalty') {
        goalsCount++;
        activities.push({
          id: ge.id || `${match.id}-goal-${ge.minute || 0}`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'goal',
          title: ge.type === 'penalty' ? 'Gol Penalti (+5)' : 'Mencetak Gol (+5)',
          reason: `Gol pada menit ke-${ge.minute || '—'}`,
          minute: ge.minute,
          points: 5,
        });
      }
    }

    // 3. Assists (+3)
    const directAssists = matchEvents.filter((e: any) => e.type === 'assist');
    for (const ae of directAssists) {
      assistsCount++;
      activities.push({
        id: ae.id || `${match.id}-assist-${ae.minute || 0}`,
        matchId: match.id,
        opponentName: match.opponentName,
        matchDate: match.matchDate,
        stage: match.stage,
        type: 'assist',
        title: 'Memberikan Assist (+3)',
        reason: `Assist pada menit ke-${ae.minute || '—'}`,
        minute: ae.minute,
        points: 3,
      });
    }

    for (const ae of assistedMatchEvents) {
      // Prevent duplicate if already counted in direct assists
      if (!directAssists.some((d: any) => d.id === ae.id)) {
        assistsCount++;
        activities.push({
          id: ae.id || `${match.id}-assisted-${ae.minute || 0}`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'assist',
          title: 'Memberikan Assist (+3)',
          reason: `Assist gol pada menit ke-${ae.minute || '—'}`,
          minute: ae.minute,
          points: 3,
        });
      }
    }

    // 4. Yellow Cards (-1)
    for (const yc of matchEvents) {
      if (yc.type === 'yellow_card') {
        yellowCount++;
        activities.push({
          id: yc.id || `${match.id}-yc-${yc.minute || 0}`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'yellow_card',
          title: 'Kartu Kuning (-1)',
          reason: `Peringatan kartu kuning menit ke-${yc.minute || '—'}`,
          minute: yc.minute,
          points: -1,
        });
      }
    }

    // 5. Red Cards (-3)
    for (const rc of matchEvents) {
      if (rc.type === 'red_card' || rc.type === 'second_yellow') {
        redCount++;
        activities.push({
          id: rc.id || `${match.id}-rc-${rc.minute || 0}`,
          matchId: match.id,
          opponentName: match.opponentName,
          matchDate: match.matchDate,
          stage: match.stage,
          type: 'red_card',
          title: rc.type === 'second_yellow' ? 'Kartu Merah (2 Kuning) (-3)' : 'Kartu Merah Langsung (-3)',
          reason: `Pelanggaran kartu merah menit ke-${rc.minute || '—'}`,
          minute: rc.minute,
          points: -3,
        });
      }
    }
  }

  // Admin explicit override: Endra 0 EXP, Rifki 0 EXP (remove any penalties)
  if (isExemptPlayer) {
    const nonPenalties = activities.filter(
      (act) => !['ignored_invite', 'late_decline', 'no_show'].includes(act.type)
    );
    activities.length = 0;
    activities.push(...nonPenalties);
    penaltiesCount = 0;
  }

  // Sort activities newest first
  activities.sort((a, b) => {
    const timeA = new Date(a.matchDate).getTime();
    const timeB = new Date(b.matchDate).getTime();
    if (timeA !== timeB) return timeB - timeA;
    return (b.minute || 0) - (a.minute || 0);
  });

  // Calculate pure match performance points (Goal +5, Assist +3, Appearance +1, Declined Appearance 0, Yellow -1, Red -3)
  const matchActivities = activities.filter((act) =>
    ['goal', 'assist', 'appearance', 'declined_appearance', 'yellow_card', 'red_card'].includes(act.type)
  );
  const matchPoints = matchActivities.reduce((sum, item) => sum + item.points, 0);

  // Calculate discipline penalties (Ignored invite -3, Late decline -1, No show -4)
  const disciplineActivities = activities.filter((act) =>
    ['ignored_invite', 'late_decline', 'no_show'].includes(act.type)
  );
  const disciplinePoints = disciplineActivities.reduce((sum, item) => sum + item.points, 0);

  // Total EXP = matchPoints + disciplinePoints (sum of all activities)
  const totalPoints = activities.reduce((sum, item) => sum + item.points, 0);

  // Status Indiscipline rule:
  // "jika topperform udah minus 30 di musim itu, maka otomatis status pemain INDISCIPLINE dan tidak ditampilkan di halaman pemain/daftar skuad"
  const isIndiscipline = totalPoints <= -30;
  let status: 'Active' | 'INDISCIPLINE' | 'Injured' | 'Inactive' = isIndiscipline
    ? 'INDISCIPLINE'
    : isPlayerInactiveOrInjured
    ? (playerStatusLower === 'inactive' ? 'Inactive' : 'Injured')
    : 'Active';

  const badgeColor = getExpBadgeColor(totalPoints);

  return {
    totalPoints,
    matchPoints,
    disciplinePoints,
    goalsCount,
    assistsCount,
    appearancesCount,
    yellowCount,
    redCount,
    penaltiesCount,
    isIndiscipline,
    status,
    badgeColor,
    activities,
  };
}

