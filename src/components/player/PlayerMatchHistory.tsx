'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useSystemSetting } from '@/context/SystemSettingContext';

/* FontAwesome soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i
    className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle"
    style={{ fontSize: `${size}px` }}
  />
);

function getResult(match: {
  homeScore: number | null;
  awayScore: number | null;
  isHome: boolean;
}) {
  if (match.homeScore === null || match.awayScore === null) return null;
  const our = match.isHome ? match.homeScore : match.awayScore;
  const their = match.isHome ? match.awayScore : match.homeScore;
  if (our > their) return 'W';
  if (our < their) return 'L';
  return 'D';
}

interface PlayerMatchHistoryProps {
  matches: any[];
  player: {
    id: string;
    createdAt?: string | Date;
    joinDate?: string | Date | null;
    seasons?: Array<{ id: string; name: string; year?: number }>;
    isGuest?: boolean;
    events?: any[];
    assistedEvents?: any[];
  };
  selectedSeason?: string;
  onSelectSeason?: (season: string) => void;
  hideSeasonTabs?: boolean;
}

export default function PlayerMatchHistory({
  matches,
  player,
  selectedSeason: selectedSeasonProp,
  onSelectSeason,
  hideSeasonTabs = false,
}: PlayerMatchHistoryProps) {
  const { teamName, teamLogo } = useSystemSetting();
  const displayTeamName = (teamName || 'TEAM').toUpperCase();
  const displayTeamLogo = teamLogo || '/defaultteam.webp';
  const [visibleCount, setVisibleCount] = useState(10);
  const [internalSeason, setInternalSeason] = useState<string>('SEMUA');

  const selectedSeason = selectedSeasonProp !== undefined ? selectedSeasonProp : internalSeason;
  const setSelectedSeason = onSelectSeason || setInternalSeason;

  // Cek apakah pemain sudah pernah mencatatkan menit bermain di lapangan (starter atau pemain pengganti)
  const hasPlayedOnPitch = matches.some((m: any) => {
    const l = (m.lineups || []).find((line: any) => line.playerId === player.id);
    if (l && l.isStarter) return true;
    const matchEvents = m.events || [];
    return matchEvents.some(
      (e: any) =>
        e.type === 'sub' &&
        (e.playerId === player.id || e.player?.id === player.id)
    );
  });

  // Cari tanggal pertama kali pemain masuk dalam lineup (starter / bench)
  const matchesInLineup = matches.filter((m: any) =>
    (m.lineups || []).some((l: any) => l.playerId === player.id)
  );
  const firstLineupDateMs = matchesInLineup.length > 0
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
  const eligibleMatches = matches.filter((m: any) => {
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

  // Ambil daftar musim unik HANYA dari pertandingan yang berhak diikuti pemain
  const seasonList = Array.from(
    new Set(
      eligibleMatches
        .map((m: any) => {
          const s = m.seasonName;
          if (s) {
            const yr = s.match(/\d{4}/)?.[0];
            return yr || s;
          }
          return m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '';
        })
        .filter(Boolean)
    )
  ).sort((a, b) => b.localeCompare(a));

  const seasonTabs = seasonList.length > 0 ? ['SEMUA', ...seasonList] : [];
  const activeSeason = selectedSeasonProp !== undefined
    ? selectedSeasonProp
    : (seasonTabs.includes(internalSeason) ? internalSeason : (seasonTabs[0] || 'SEMUA'));

  // Filter berdasarkan musim pilihan
  const filteredMatches = activeSeason === 'SEMUA'
    ? eligibleMatches
    : eligibleMatches.filter((m: any) => {
        const s = m.seasonName || (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
        const yr = m.seasonName?.match(/\d{4}/)?.[0] || (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
        return s === activeSeason || s.includes(activeSeason) || yr === activeSeason;
      });

  const displayedMatches = filteredMatches.slice(0, visibleCount);
  const hasMore = visibleCount < filteredMatches.length;
  const remainingCount = filteredMatches.length - visibleCount;

  const panelBg = { background: '#ffffff', border: '1px solid #e2e8f0' };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
        <h2 className="text-base sm:text-lg font-black text-slate-900">Last Matches</h2>

        {/* ── Season Navigation Tabs (hanya tampil jika tidak di-handle oleh parent) ── */}
        {!hideSeasonTabs && seasonTabs.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {seasonTabs.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSelectedSeason(s);
                  setVisibleCount(10);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeSeason === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {s === 'SEMUA' ? 'SEMUA' : `Musim ${s}`}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl overflow-hidden shadow-sm" style={panelBg}>
        {/* Catatan jika pemain sudah masuk skuad klub namun belum pernah bermain di lapangan */}
        {!hasPlayedOnPitch && eligibleMatches.length > 0 && (
          <div className="px-4 py-3 bg-amber-50/90 border-b border-amber-200/80 flex items-start sm:items-center gap-2.5 text-amber-900">
            <div className="w-5 h-5 rounded-full bg-amber-200/90 flex items-center justify-center shrink-0 text-amber-800 text-xs font-black">
              i
            </div>
            <p className="text-xs font-semibold leading-relaxed">
              Pemain telah resmi masuk dalam skuad klub, namun belum melakoni penampilan perdana (menit bermain) di lapangan.
            </p>
          </div>
        )}

        {filteredMatches.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-2">
            <Shield className="w-9 h-9 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">
              {eligibleMatches.length === 0
                ? 'Belum ada jadwal pertandingan yang tercatat sejak pemain bergabung.'
                : `Tidak ada catatan pertandingan di ${activeSeason === 'SEMUA' ? 'seluruh musim' : `Musim ${activeSeason}`}`}
            </p>
          </div>
        ) : (
          <>
            {/* ── Table Header ── */}
            <div
              className="grid px-3 sm:px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider items-center gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: '64px 1fr auto',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                color: '#64748b',
              }}
            >
              <span>Tanggal</span>
              <div className="flex items-center justify-between pr-1 sm:pr-2">
                <span>Pertandingan</span>
                <span className="text-right">Status / Menit</span>
              </div>
              <span className="text-right pr-1">Skor</span>
            </div>

            {/* ── Rows ── */}
            <div>
              {displayedMatches.map((match: any, idx: number) => {
                const result = getResult(match);

                const lineup = (match.lineups || []).find((l: any) => l.playerId === player.id);
                const isNotInSquad = !lineup;

                const attendance = (match.attendances || []).find((a: any) => a.playerId === player.id);
                const nonSquadStatus = attendance?.declineReason?.trim() || 'Tidak masuk skuad';

                const evts = (player.events || []).filter((e: any) => e.matchId === match.id);
                const assistEvts = (player.assistedEvents || []).filter(
                  (e: any) => e.matchId === match.id && e.type !== 'sub'
                );

                const ownGoals = evts.filter((e: any) => e.type === 'own_goal').length;
                const penalties = evts.filter((e: any) => e.type === 'penalty').length;
                const regularGoals = evts.filter((e: any) => e.type === 'goal').length;
                const goals = regularGoals + ownGoals + penalties;
                const assists = evts.filter((e: any) => e.type === 'assist').length + assistEvts.length;
                const yc = evts.filter((e: any) => e.type === 'yellow_card').length;
                const hasSecondYellow = evts.some((e: any) => e.type === 'second_yellow') || yc >= 2;
                const hasDirectRed = evts.some((e: any) => e.type === 'red_card');
                const rc = hasSecondYellow || hasDirectRed ? 1 : 0;

                const resultBg =
                  result === 'W' ? '#16a34a' : result === 'L' ? '#dc2626' : '#d97706';
                const rowBorder = idx === 0 ? 'none' : '1px solid #f1f5f9';

                /* Shared match team labels */
                const TopTeam = match.isHome
                  ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={displayTeamLogo}
                          alt={displayTeamName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-bold uppercase tracking-wide truncate flex-1 text-blue-600">
                          {String(displayTeamName || 'TEAM').toUpperCase()}
                        </span>
                      </div>
                    )
                  : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={match.opponentLogo || '/defaultteam.webp'}
                          alt={match.opponentName || 'OPPONENT'}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide truncate flex-1 text-slate-800">
                          {String(match.opponentName || 'OPPONENT').toUpperCase()}
                        </span>
                      </div>
                    );

                const BottomTeam = match.isHome
                  ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={match.opponentLogo || '/defaultteam.webp'}
                          alt={match.opponentName || 'OPPONENT'}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide truncate flex-1 text-slate-800">
                          {String(match.opponentName || 'OPPONENT').toUpperCase()}
                        </span>
                      </div>
                    )
                  : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={displayTeamLogo}
                          alt={displayTeamName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-bold uppercase tracking-wide truncate flex-1 text-blue-600">
                          {String(displayTeamName || 'TEAM').toUpperCase()}
                        </span>
                      </div>
                    );

                const isStarter = lineup ? lineup.isStarter : false;
                const matchEvents = match.events || [];

                const chronEvts = matchEvents
                  .filter((e: any) => {
                    const isPlayer = e.player?.id === player.id || e.playerId === player.id;
                    const isAssist = e.assistPlayer?.id === player.id || e.assistPlayerId === player.id;
                    return isPlayer || isAssist;
                  })
                  .flatMap((e: any, evtIdx: number) => {
                    const isPlayer = e.player?.id === player.id || e.playerId === player.id;
                    const isAssist = e.assistPlayer?.id === player.id || e.assistPlayerId === player.id;
                    const evtsList: Array<{ id: string; type: string; minute: number }> = [];

                    if (e.type === 'sub') {
                      // Sub out icon removed per request
                    } else if (e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty') {
                      if (isPlayer)
                        evtsList.push({ id: e.id || `evt-${evtIdx}`, type: e.type, minute: e.minute });
                      if (isAssist)
                        evtsList.push({ id: e.id || `ast-${evtIdx}`, type: 'assist', minute: e.minute });
                    } else if (
                      e.type === 'yellow_card' ||
                      e.type === 'second_yellow' ||
                      e.type === 'red_card'
                    ) {
                      if (isPlayer)
                        evtsList.push({ id: e.id || `evt-${evtIdx}`, type: e.type, minute: e.minute });
                    }
                    return evtsList;
                  })
                  .sort((a: any, b: any) => a.minute - b.minute);

                const isSubbedIn = matchEvents.some(
                  (e: any) => e.type === 'sub' && (e.playerId === player.id || e.player?.id === player.id)
                );
                const isOnBenchOnly = !isNotInSquad && !isStarter && !isSubbedIn;

                // Hitung Menit Bermain
                const matchDuration = match.duration || 60;
                let minutesPlayed = 0;

                if (isStarter) {
                  const subOutEvt = matchEvents.find(
                    (e: any) =>
                      e.type === 'sub' &&
                      (e.assistPlayerId === player.id || e.assistPlayer?.id === player.id)
                  );
                  const redEvt = matchEvents.find(
                    (e: any) =>
                      (e.playerId === player.id || e.player?.id === player.id) &&
                      (e.type === 'red_card' || e.type === 'second_yellow')
                  );

                  let endMinute = matchDuration;
                  if (subOutEvt && typeof subOutEvt.minute === 'number') {
                    endMinute = Math.min(endMinute, subOutEvt.minute);
                  }
                  if (redEvt && typeof redEvt.minute === 'number') {
                    endMinute = Math.min(endMinute, redEvt.minute);
                  }
                  minutesPlayed = Math.max(1, endMinute);
                } else if (isSubbedIn) {
                  const subInEvt = matchEvents.find(
                    (e: any) =>
                      e.type === 'sub' &&
                      (e.playerId === player.id || e.player?.id === player.id)
                  );
                  const subInMinute = subInEvt?.minute || 0;

                  const subOutEvt = matchEvents.find(
                    (e: any) =>
                      e.type === 'sub' &&
                      (e.assistPlayerId === player.id || e.assistPlayer?.id === player.id) &&
                      e.minute > subInMinute
                  );
                  const redEvt = matchEvents.find(
                    (e: any) =>
                      (e.playerId === player.id || e.player?.id === player.id) &&
                      (e.type === 'red_card' || e.type === 'second_yellow') &&
                      e.minute > subInMinute
                  );

                  let endMinute = matchDuration;
                  if (subOutEvt && typeof subOutEvt.minute === 'number') {
                    endMinute = Math.min(endMinute, subOutEvt.minute);
                  }
                  if (redEvt && typeof redEvt.minute === 'number') {
                    endMinute = Math.min(endMinute, redEvt.minute);
                  }
                  minutesPlayed = Math.max(1, endMinute - subInMinute);
                }

                const hasEvents = chronEvts.length > 0;

                const dateStr = new Date(match.matchDate)
                  .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                  .replace('/', '.');

                const matchComp = (match.competition || 'FRIENDLY').toUpperCase();
                const prevMatch = idx > 0 ? displayedMatches[idx - 1] : null;
                const prevComp = prevMatch ? (prevMatch.competition || 'FRIENDLY').toUpperCase() : null;
                const prevSeason = prevMatch ? (prevMatch.seasonName || '') : '';
                const currentSeason = match.seasonName || '';

                // Group strictly by competition and season, NOT per matchday
                const isNewCompGroup =
                  idx === 0 ||
                  matchComp !== prevComp ||
                  currentSeason !== prevSeason;

                // Extract only year from seasonName (e.g. "2026")
                const seasonYear = match.seasonName
                  ? (match.seasonName.match(/\d{4}/)?.[0] || match.seasonName)
                  : (match.matchDate ? new Date(match.matchDate).getFullYear().toString() : '');

                return (
                  <React.Fragment key={match.id}>
                    {isNewCompGroup && (
                      <div
                        className="px-4 py-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider"
                        style={{
                          background: '#f8fafc',
                          borderTop: idx === 0 ? 'none' : '1px solid #e2e8f0',
                          borderBottom: '1px solid #e2e8f0',
                          color: '#0f172a',
                        }}
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-slate-900 font-black">{match.competition || 'FRIENDLY'}</span>
                          {seasonYear && (
                            <span className="text-slate-500 font-mono text-[10px] font-bold">
                              {seasonYear}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <Link
                      href={`/matches/${match.id}`}
                      className="grid px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-slate-50 transition-colors items-center cursor-pointer gap-2 sm:gap-3"
                      style={{
                        gridTemplateColumns: '64px 1fr auto',
                        borderTop: isNewCompGroup ? 'none' : rowBorder,
                      }}
                    >
                      {/* Date */}
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">
                        {dateStr}
                      </span>

                      {/* Match Teams & Status / Minutes */}
                      <div className="flex items-center justify-between gap-3 min-w-0 pr-1 sm:pr-2">
                        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                          <TopTeam />
                          <BottomTeam />
                        </div>

                        {/* Status / Menit Bermain & Event Icons (Di sebelah kiri skor) */}
                        <div className="flex items-center justify-end gap-1.5 shrink-0 text-right">
                          {isNotInSquad ? (
                            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                              {nonSquadStatus}
                            </span>
                          ) : isOnBenchOnly ? (
                            <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                              On the bench
                            </span>
                          ) : (
                            <>
                              {hasEvents && (
                                <div className="flex items-center gap-1">
                                  {chronEvts.map((e: any) => (
                                    <span key={e.id} className="inline-flex items-center justify-center">
                                      {e.type === 'goal' && <BallIcon size={12} />}
                                      {e.type === 'own_goal' && (
                                        <i
                                          className="fa-regular fa-futbol text-red-500 text-[11px] shrink-0"
                                          title="Gol Bunuh Diri"
                                        />
                                      )}
                                      {e.type === 'penalty' && (
                                        <span
                                          className="relative inline-flex items-center shrink-0 mr-1"
                                          title="Gol Penalti"
                                        >
                                          <i className="fa-regular fa-futbol text-amber-500 text-[11px]" />
                                          <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                            P
                                          </span>
                                        </span>
                                      )}
                                      {e.type === 'assist' && (
                                        <span
                                          className="text-amber-600 font-black text-[11px] leading-none shrink-0"
                                          title="Assist"
                                        >
                                          A
                                        </span>
                                      )}
                                      {e.type === 'yellow_card' && (
                                        <span
                                          className="w-2.5 h-3.5 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-400"
                                          title="Kartu Kuning"
                                        />
                                      )}
                                      {e.type === 'second_yellow' && (
                                        <span
                                          className="relative inline-flex items-center shrink-0 align-middle ml-0.5"
                                          title="Kartu Kuning 2x (Kartu Merah)"
                                        >
                                          <span
                                            className="w-2.5 h-3.5 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs"
                                            style={{ transform: 'translate(-1.5px, -0.5px)' }}
                                          />
                                          <span className="w-2.5 h-3.5 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                        </span>
                                      )}
                                      {e.type === 'red_card' && (
                                        <span
                                          className="w-2.5 h-3.5 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-500"
                                          title="Kartu Merah"
                                        />
                                      )}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-800">
                                {minutesPlayed}&apos;
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Vertically Stacked Scores directly to the left of Result Badge */}
                      <div className="flex items-center justify-end gap-2 sm:gap-2.5 shrink-0 pl-1">
                        {match.homeScore !== null && match.awayScore !== null && match.homeScore !== undefined && match.awayScore !== undefined && (
                          <div className="flex flex-col text-right justify-center gap-0.5 font-mono font-black text-xs sm:text-sm leading-tight">
                            <span style={{ color: match.isHome ? '#2563eb' : '#0f172a' }}>
                              {match.homeScore}
                            </span>
                            <span style={{ color: match.isHome ? '#0f172a' : '#2563eb' }}>
                              {match.awayScore}
                            </span>
                          </div>
                        )}

                        {result ? (
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ background: resultBg }}
                          >
                            {result}
                          </span>
                        ) : (
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0"
                            style={{ background: '#94a3b8' }}
                            title="Belum Dimainkan"
                          >
                            ?
                          </span>
                        )}
                      </div>
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>

            {/* ── Navigation Bar ── */}
            {filteredMatches.length > 10 && (
              <div className="py-3 px-4 flex items-center justify-between border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
                <span className="text-[11px] sm:text-xs">
                  {hasMore ? (
                    <>
                      Menampilkan <strong className="text-slate-900 font-mono">{displayedMatches.length}</strong> dari{' '}
                      <strong className="text-slate-900 font-mono">{filteredMatches.length}</strong> riwayat pertandingan
                    </>
                  ) : (
                    <>
                      Menampilkan seluruh <strong className="text-slate-900 font-mono">{filteredMatches.length}</strong> riwayat pertandingan
                    </>
                  )}
                </span>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {visibleCount > 10 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(10)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      Tutup ke 10 awal
                    </button>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Buka 10 riwayat lagi
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
