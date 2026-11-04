'use client';

import React, { useState } from 'react';
import { Shield, Sparkles, Calendar, Ruler, Weight } from 'lucide-react';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';
import PlayerMatchHistory from './PlayerMatchHistory';

function getPositionLabel(pos: string) {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'FORWARD';
}

function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;

  if (parts.length === 2) {
    if (fullName.length > 20) return parts[0];
    return fullName;
  }

  // 3 or more words: take first and middle name (first 2 words)
  const firstTwo = `${parts[0]} ${parts[1]}`;
  if (firstTwo.length > 18) {
    return parts[0];
  }
  return firstTwo;
}

export function computePlayerStats(
  player: any,
  activeMatches: any[],
  selectedSeason: string
) {
  const isAll = selectedSeason === 'SEMUA' || selectedSeason === 'all';

  const seasonMatches = isAll
    ? activeMatches
    : activeMatches.filter((m: any) => {
        const s = (m.seasonName || '').trim();
        const yr =
          m.seasonName?.match(/\d{4}/)?.[0] ||
          (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
        return s === selectedSeason || s.includes(selectedSeason) || yr === selectedSeason;
      });

  const seasonMatchIds = new Set(seasonMatches.map((m: any) => m.id));

  // Hitung jumlah penampilan (Starter maupun Cadangan yang masuk skuad laga)
  const appearances = seasonMatches.filter((m: any) => {
    const l = (m.lineups || []).find((line: any) => line.playerId === player.id);
    return Boolean(l);
  }).length;

  // Hitung gol (goal atau penalty)
  const goals = (player.events || []).filter((e: any) => {
    if (!seasonMatchIds.has(e.matchId)) return false;
    return e.type === 'goal' || e.type === 'penalty';
  }).length;

  // Hitung assist
  const assists =
    (player.events || []).filter((e: any) => {
      if (!seasonMatchIds.has(e.matchId)) return false;
      return e.type === 'assist';
    }).length +
    (player.assistedEvents || []).filter((e: any) => {
      if (!seasonMatchIds.has(e.matchId)) return false;
      return e.type !== 'sub';
    }).length;

  // Hitung kartu kuning
  const yellowCards = (player.events || []).filter((e: any) => {
    if (!seasonMatchIds.has(e.matchId)) return false;
    return e.type === 'yellow_card';
  }).length;

  // Hitung kartu merah (direct red atau second yellow)
  const redCards = (player.events || []).filter((e: any) => {
    if (!seasonMatchIds.has(e.matchId)) return false;
    return e.type === 'red_card' || e.type === 'second_yellow';
  }).length;

  // Untuk mode 'SEMUA', pertahankan nilai baseline dari tabel pemain jika lebih tinggi
  if (isAll) {
    return {
      appearances: Math.max(player.appearances || 0, appearances),
      goals: Math.max(player.goals || 0, goals),
      assists: Math.max(player.assists || 0, assists),
      yellowCards: Math.max(player.yellowCards || 0, yellowCards),
      redCards: Math.max(player.redCards || 0, redCards),
    };
  }

  // Jika pemain hanya punya 1 musim dan event log kosong tapi baseline player ada, gunakan baseline
  const playerSeasonCount = Array.isArray(player.seasons) ? player.seasons.length : 0;
  if (playerSeasonCount <= 1 && appearances === 0 && (player.appearances || 0) > 0) {
    return {
      appearances: player.appearances || 0,
      goals: player.goals || 0,
      assists: player.assists || 0,
      yellowCards: player.yellowCards || 0,
      redCards: player.redCards || 0,
    };
  }

  return {
    appearances,
    goals,
    assists,
    yellowCards,
    redCards,
  };
}

interface PlayerProfileViewProps {
  player: any;
  activeMatches: any[];
  member: any;
  activeSeasonName: string;
  playerCardBg: string;
  playerDefaultPhoto: string;
  initialSeason?: string;
}

export default function PlayerProfileView({
  player,
  activeMatches,
  member,
  activeSeasonName,
  playerCardBg,
  playerDefaultPhoto,
  initialSeason,
}: PlayerProfileViewProps) {
  // Tanggal laga pertama di mana pemain masuk lineup
  const matchesInLineup = activeMatches.filter((m: any) =>
    (m.lineups || []).some((l: any) => l.playerId === player.id)
  );
  const firstLineupDateMs =
    matchesInLineup.length > 0
      ? Math.min(...matchesInLineup.map((m: any) => new Date(m.matchDate).getTime()))
      : null;

  // Nama dan tahun musim yang diikuti oleh pemain
  const playerSeasonNames = new Set(
    (player.seasons || [])
      .map((s: any) => s.name?.trim().toLowerCase())
      .filter(Boolean)
  );
  const playerSeasonYears = new Set(
    (player.seasons || [])
      .map((s: any) => s.year?.toString() || s.name?.match(/\d{4}/)?.[0])
      .filter(Boolean)
  );
  const hasSeasonEnrollment = playerSeasonNames.size > 0 || playerSeasonYears.size > 0;
  const joinDateMs = player.joinDate ? new Date(player.joinDate).getTime() : null;

  // Saring riwayat laga sejak pemain bergabung:
  // - Pemain di lineup -> selalu muncul
  // - Pemain yang tidak ditarik ke musim baru JANGAN tampilkan laga/musim barunya
  const eligibleMatches = activeMatches.filter((m: any) => {
    // 1. Jika pemain masuk dalam lineup laga ini
    const inLineup = (m.lineups || []).some((l: any) => l.playerId === player.id);
    if (inLineup) return true;

    const mSeason = (m.seasonName || '').trim().toLowerCase();
    const mYear =
      m.seasonName?.match(/\d{4}/)?.[0] ||
      (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');

    const isEnrolledInSeason = playerSeasonNames.has(mSeason) || playerSeasonYears.has(mYear);

    // 2. Jika pemain terdaftar dalam musim tertentu: HANYA boleh melihat laga musim yang diikutinya
    if (hasSeasonEnrollment) {
      if (!isEnrolledInSeason) return false;
      if (joinDateMs !== null && !isNaN(joinDateMs)) {
        const mDateMs = new Date(m.matchDate).getTime();
        return !isNaN(mDateMs) && mDateMs >= joinDateMs - 12 * 3600 * 1000;
      }
      return true;
    }

    // 3. Jika belum terikat musim spesifik, gunakan joinDate jika ada
    if (joinDateMs !== null && !isNaN(joinDateMs)) {
      const mDateMs = new Date(m.matchDate).getTime();
      return !isNaN(mDateMs) && mDateMs >= joinDateMs - 12 * 3600 * 1000;
    }

    // 4. Jika sudah pernah melakoni debut/lineup di tanggal tertentu
    if (firstLineupDateMs !== null) {
      const mDateMs = new Date(m.matchDate).getTime();
      return !isNaN(mDateMs) && mDateMs >= firstLineupDateMs - 12 * 3600 * 1000;
    }

    // 5. Jika belum pernah masuk lineup dan tidak terikat musim khusus, gunakan player.createdAt
    if (player.createdAt) {
      const mDateMs = new Date(m.matchDate).getTime();
      const createdDateMs = new Date(player.createdAt).getTime();
      if (!isNaN(mDateMs) && !isNaN(createdDateMs)) {
        return mDateMs >= createdDateMs - 24 * 3600 * 1000;
      }
    }

    return false;
  });

  // Ambil daftar tahun musim unik dari eligibleMatches DAN player.seasons
  const matchSeasons = eligibleMatches
    .map((m: any) => {
      const s = m.seasonName;
      if (s) {
        const yr = s.match(/\d{4}/)?.[0];
        return yr || s;
      }
      return m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '';
    })
    .filter(Boolean);

  const enrolledSeasons = (player.seasons || [])
    .map((s: any) => s.year?.toString() || s.name?.match(/\d{4}/)?.[0] || s.name)
    .filter(Boolean);

  // Tentukan tahun aktif default / musim utama (e.g. 2027)
  const cleanActiveYear = activeSeasonName?.match(/\d{4}/)?.[0] || activeSeasonName || '2027';

  // Musim hanya yang benar-benar diikuti oleh pemain. JANGAN tambahkan musim baru jika pemain belum ditarik ke musim baru!
  const seasonsSet = new Set([...matchSeasons, ...enrolledSeasons]);
  const seasonList = Array.from(seasonsSet).sort((a, b) =>
    b.localeCompare(a)
  );

  // Posisi SEMUA di kiri
  const seasonTabs = seasonList.length > 0 ? ['SEMUA', ...seasonList] : ['SEMUA'];

  // Default season: jika pemain ada di musim utama aktif (2027), tampilkan 2027.
  // Jika TIDAK ditarik ke musim 2027, tampilkan musim terbaru yang diikutinya (e.g. 2025).
  const getDefaultSeason = () => {
    if (initialSeason && seasonTabs.includes(initialSeason)) {
      return initialSeason;
    }
    if (cleanActiveYear && seasonsSet.has(cleanActiveYear)) {
      return cleanActiveYear;
    }
    if (seasonList.length > 0) {
      return seasonList[0];
    }
    return 'SEMUA';
  };

  const [selectedSeason, setSelectedSeason] = useState<string>(getDefaultSeason);

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    try {
      const url = new URL(window.location.href);
      if (season === 'SEMUA') {
        url.searchParams.delete('season');
      } else {
        url.searchParams.set('season', season);
      }
      window.history.replaceState(null, '', url.toString());
    } catch {}
  };

  // Resolusi data nomor punggung & foto pemain untuk musim utama aktif
  const resolvedPlayer = resolvePlayerForSeason(player, activeSeasonName);

  // Hitung statistik pemain dinamis untuk musim yang sedang dipilih
  const currentStats = computePlayerStats(player, activeMatches, selectedSeason);

  // Biodata specs
  const birthDateValue = player.birthDate
    ? new Date(player.birthDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const nationalityValue =
    player.nationality && player.nationality.trim() !== '' && player.nationality !== '-'
      ? player.nationality
      : 'Indonesia';

  const specs = [
    { label: 'Tanggal Lahir', value: birthDateValue },
    { label: 'Kewarganegaraan', value: nationalityValue },
    { label: 'Tinggi Badan', value: player.heightCm ? `${player.heightCm} cm` : '—' },
    { label: 'Berat Badan', value: player.weightKg ? `${player.weightKg} kg` : '—' },
  ];

  // For pure guest player without season enrollment, only pass matches where in lineup
  const isPureGuest = player.isGuest && !hasSeasonEnrollment;
  const matchesForHistory = isPureGuest
    ? activeMatches.filter((m: any) => (m.lineups || []).some((l: any) => l.playerId === player.id))
    : activeMatches;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">
      {/* ═══════════════════════════════════════════════════ */}
      {/* MOBILE PROFILE HEADER (Edge-to-Edge Full Bleed)     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="block md:hidden -mx-3 -mt-6 bg-white border-b border-slate-200 overflow-hidden">
        {/* Top 4:3 Stadium Hero Box */}
        <div className="group relative w-full aspect-[4/3] overflow-hidden bg-slate-950 select-none">
          {/* Background Stadium Photo */}
          <img
            src={playerCardBg}
            alt="Stadium Background"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-transparent to-transparent opacity-85 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-[#060b14]/25 to-[#060b14]/75 pointer-events-none" />

          {/* Main Cut-out Player Photo */}
          <div className="absolute inset-x-0 top-0 bottom-[40px] overflow-hidden pointer-events-none z-10">
            <img
              src={
                resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp'
                  ? resolvedPlayer.photoUrl
                  : playerDefaultPhoto
              }
              alt={resolvedPlayer.name}
              className="absolute bottom-0 left-[66%] -translate-x-1/2 translate-y-[20%] h-[96%] sm:h-[100%] w-auto max-w-none object-contain object-bottom drop-shadow-[0_8px_20px_rgba(0,0,0,0.65)] scale-[1.18] sm:scale-[1.22] origin-bottom"
            />
          </div>

          {/* Gradasi Hitam Latar Font */}
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/65 to-transparent pointer-events-none z-10" />

          {/* Member Tag */}
          {member && (
            <div className="absolute top-3 right-3 z-30">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md border border-amber-300">
                <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                MEMBER
              </span>
            </div>
          )}

          {/* Nomor, Nama & Posisi Pemain */}
          <div className="absolute left-3.5 sm:left-4 bottom-[58px] sm:bottom-[64px] z-20 flex items-center gap-3 sm:gap-3.5 max-w-[70%] sm:max-w-[65%]">
            <span className="text-5xl sm:text-6xl font-black font-mono text-sky-400 leading-none shrink-0">
              {resolvedPlayer.number}
            </span>

            <div className="w-[1.5px] h-10 sm:h-12 bg-white/40 shrink-0" />

            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase leading-tight tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] truncate">
                {formatDisplayName(player.name)}
              </h1>
              <p className="text-[9px] sm:text-[10px] text-sky-400 font-bold uppercase tracking-widest leading-none mt-1">
                {getPositionLabel(player.position)}
              </p>
            </div>
          </div>

          {/* Frosted Glass Floating Specs Bar */}
          <div className="absolute inset-x-2 bottom-2 z-20 rounded-xl bg-[#091528]/85 backdrop-blur-md border border-white/15 px-2 py-2 shadow-2xl">
            <div className="grid grid-cols-4 gap-1 items-center">
              {/* Tanggal Lahir */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Calendar className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Tanggal Lahir
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {birthDateValue}
                  </p>
                </div>
              </div>

              {/* Kewarganegaraan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-3.5 h-2.5 rounded-xs overflow-hidden border border-white/20 flex flex-col shadow-xs shrink-0">
                    <div className="h-[5px] bg-[#e70011] w-full" />
                    <div className="h-[5px] bg-white w-full" />
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Kewarganegaraan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {nationalityValue}
                  </p>
                </div>
              </div>

              {/* Tinggi Badan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Ruler className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Tinggi Badan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {player.heightCm ? `${player.heightCm} cm` : '—'}
                  </p>
                </div>
              </div>

              {/* Berat Badan */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                  <Weight className="w-3 h-3 text-slate-200" />
                </div>
                <div className="min-w-0">
                  <p className="text-[6.5px] sm:text-[7.5px] font-medium text-slate-300 uppercase tracking-wider truncate leading-none">
                    Berat Badan
                  </p>
                  <p className="text-[8.5px] sm:text-[9.5px] font-black text-white truncate leading-tight mt-0.5">
                    {player.weightKg ? `${player.weightKg} kg` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Clean White Stats Bar (Dynamic based on selected season) */}
        <div className="py-3 px-2 sm:px-4 bg-white">
          <div className="grid grid-cols-5 divide-x divide-slate-100 text-center items-center">
            {[
              { label: 'MAIN', value: currentStats.appearances },
              { label: 'GOL', value: currentStats.goals },
              { label: 'ASSIST', value: currentStats.assists },
              { label: 'KUNING', value: currentStats.yellowCards },
              { label: 'MERAH', value: currentStats.redCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-0.5 sm:px-1">
                <span className="text-xl sm:text-2xl font-black font-mono text-[#0066cc] tracking-tight leading-none">
                  {s.value}
                </span>
                <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-slate-400 mt-1 leading-none">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DESKTOP PROFILE HEADER                              */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN: Player Photo Card (Aspect Ratio 4:5 with Stadium Backdrop) */}
        <div className="md:col-span-5 lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-md bg-white flex flex-col">
          <div className="group relative aspect-[4/5] w-full overflow-hidden flex flex-col justify-end bg-slate-950">
            {/* Background Stadium Photo */}
            <img
              src={playerCardBg}
              alt="Stadium Background"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/50 to-transparent pointer-events-none" />

            {/* Ghost Action Shot */}
            <img
              src={
                resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp'
                  ? resolvedPlayer.photoUrl
                  : playerDefaultPhoto
              }
              alt=""
              className="absolute right-[-10%] top-2 h-[95%] object-contain opacity-20 mix-blend-luminosity grayscale pointer-events-none"
            />

            {/* Full Cut-out Photo */}
            <img
              src={
                resolvedPlayer.photoUrl && resolvedPlayer.photoUrl !== '/playertemplate.webp'
                  ? resolvedPlayer.photoUrl
                  : playerDefaultPhoto
              }
              alt={resolvedPlayer.name}
              className="absolute inset-0 w-full h-full object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] z-10"
            />

            {/* Gradasi Hitam Pekat di Bawah */}
            <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent pointer-events-none z-15" />

            {/* Top-Right Tag: "MEMBER" */}
            {member && (
              <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md border border-amber-300">
                  <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                  MEMBER
                </span>
              </div>
            )}

            {/* Bottom Info: Extra Large Number alongside Name & Position */}
            <div className="relative z-20 p-5 sm:p-8 md:p-6 flex items-center gap-4 sm:gap-6 md:gap-5">
              <span className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {resolvedPlayer.number}
              </span>
              <div className="min-w-0 space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-4xl md:text-3xl lg:text-4xl font-black text-white uppercase leading-tight drop-shadow-lg tracking-tight">
                  {formatDisplayName(player.name)}
                </h1>
                <p className="text-xs sm:text-base md:text-sm text-sky-400 font-extrabold uppercase tracking-widest leading-none drop-shadow">
                  {getPositionLabel(player.position)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (DESKTOP): Biodata & Akumulasi Musim Pilihan */}
        <div className="md:col-span-7 lg:col-span-7 space-y-4 md:space-y-6">
          {/* Physical Specs / Biodata Panel */}
          <div className="rounded-3xl p-6 border border-slate-200 shadow-sm bg-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900 uppercase tracking-wider">Biodata Pemain</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-4 bg-slate-50 border border-slate-200 shadow-xs">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    {item.label}
                  </span>
                  <span className="text-base font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STATS PANEL (Dynamic based on selected season) */}
          <div className="grid grid-cols-5 divide-x divide-slate-100 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden py-4 sm:py-5">
            {[
              { label: 'MAIN', value: currentStats.appearances },
              { label: 'GOL', value: currentStats.goals },
              { label: 'ASSIST', value: currentStats.assists },
              { label: 'KUNING', value: currentStats.yellowCards },
              { label: 'MERAH', value: currentStats.redCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                <span className="text-2xl sm:text-4xl font-black font-mono text-blue-600 tracking-tight">
                  {s.value}
                </span>
                <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LAST MATCHES & SEASON NAVIGATION                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="space-y-3 sm:space-y-4">
        {seasonTabs.length > 1 && (
          <div className="flex items-center justify-start gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
            {seasonTabs.map((s) => {
              const isActive = selectedSeason === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSeasonChange(s)}
                  className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {s === 'SEMUA' ? 'SEMUA' : (s.toUpperCase().startsWith('MUSIM') ? s.toUpperCase() : `MUSIM ${s}`)}
                </button>
              );
            })}
          </div>
        )}

        <PlayerMatchHistory
          matches={matchesForHistory}
          player={player}
          selectedSeason={selectedSeason}
          hideSeasonTabs={true}
        />
      </div>
    </div>
  );
}

