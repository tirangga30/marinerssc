'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';

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
    events?: any[];
    assistedEvents?: any[];
  };
}

export default function PlayerMatchHistory({ matches, player }: PlayerMatchHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const displayedMatches = matches.slice(0, visibleCount);
  const hasMore = visibleCount < matches.length;
  const remainingCount = matches.length - visibleCount;

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div>
      <div className="flex items-end justify-between mb-3">
        <h2 className="text-l font-black text-white">Last Matches</h2>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-xl" style={panelBg}>
        {matches.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Shield className="w-9 h-9 mx-auto" style={{ color: '#1e293b' }} />
            <p className="text-sm font-semibold" style={{ color: '#475569' }}>
              Belum ada riwayat pertandingan
            </p>
          </div>
        ) : (
          <>
            {/* ── Table Header ── */}
            <div
              className="grid px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider items-center"
              style={{
                gridTemplateColumns: '64px 1fr auto',
                background: 'rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                color: '#64748b',
              }}
            >
              <span>Tanggal</span>
              <span>Pertandingan</span>
              <span className="text-right pr-1">Skor &amp; Hasil</span>
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
                const rowBorder = idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)';

                /* Shared match team labels */
                const TopTeam = match.isHome
                  ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src="/marinerssc.webp"
                          alt="Mariners SC"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>
                          Mariners SC
                        </span>
                      </div>
                    )
                  : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={match.opponentLogo}
                          alt={match.opponentName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>
                          {match.opponentName}
                        </span>
                      </div>
                    );

                const BottomTeam = match.isHome
                  ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src={match.opponentLogo}
                          alt={match.opponentName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>
                          {match.opponentName}
                        </span>
                      </div>
                    )
                  : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img
                          src="/marinerssc.webp"
                          alt="Mariners SC"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>
                          Mariners SC
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
                      if (isAssist)
                        evtsList.push({ id: e.id || `subout-${evtIdx}`, type: 'sub_out', minute: e.minute });
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

                const hasEvents = chronEvts.length > 0;

                const dateStr = new Date(match.matchDate)
                  .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                  .replace('/', '.');

                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className="grid px-3 sm:px-4 py-3 hover:bg-white/[0.03] transition-colors items-center cursor-pointer"
                    style={{
                      gridTemplateColumns: '64px 1fr auto',
                      borderTop: rowBorder,
                    }}
                  >
                    {/* Date */}
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                      {dateStr}
                    </span>

                    {/* Match Teams & Event Badges */}
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <TopTeam />
                          <BottomTeam />
                        </div>
                        {/* Tidak masuk skuad / On the bench badge OR event icons */}
                        {isNotInSquad ? (
                          <span
                            className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                              nonSquadStatus === 'Cedera'
                                ? 'text-rose-300 bg-rose-950/60 border-rose-600/50'
                                : nonSquadStatus === 'Akumulasi Kartu'
                                ? 'text-amber-300 bg-amber-950/60 border-amber-600/50'
                                : nonSquadStatus === 'Izin'
                                ? 'text-sky-300 bg-sky-950/60 border-sky-600/50'
                                : nonSquadStatus === 'Sakit'
                                ? 'text-purple-300 bg-purple-950/60 border-purple-600/50'
                                : nonSquadStatus === 'Diistirahatkan'
                                ? 'text-emerald-300 bg-emerald-950/60 border-emerald-600/50'
                                : 'text-slate-400 bg-slate-800/80 border-slate-700/80'
                            }`}
                          >
                            {nonSquadStatus}
                          </span>
                        ) : isOnBenchOnly ? (
                          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80 shrink-0">
                            On the bench
                          </span>
                        ) : (
                          hasEvents && (
                            <div className="flex items-center gap-1 shrink-0">
                              {chronEvts.map((e: any) => (
                                <span key={e.id} className="inline-flex items-center justify-center">
                                  {e.type === 'sub_out' && (
                                    <i
                                      className="fa-solid fa-right-left text-red-500 text-[9px] shrink-0"
                                      title="Digantikan"
                                    />
                                  )}
                                  {e.type === 'goal' && <BallIcon size={11} />}
                                  {e.type === 'own_goal' && (
                                    <i
                                      className="fa-regular fa-futbol text-red-500 text-[10px] shrink-0"
                                      title="Gol Bunuh Diri"
                                    />
                                  )}
                                  {e.type === 'penalty' && (
                                    <span
                                      className="relative inline-flex items-center shrink-0 mr-1"
                                      title="Gol Penalti"
                                    >
                                      <i className="fa-regular fa-futbol text-amber-400 text-[10px]" />
                                      <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                        P
                                      </span>
                                    </span>
                                  )}
                                  {e.type === 'assist' && (
                                    <span
                                      className="text-amber-400 font-black text-[10px] leading-none shrink-0"
                                      title="Assist"
                                    >
                                      A
                                    </span>
                                  )}
                                  {e.type === 'yellow_card' && (
                                    <span
                                      className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-300/40"
                                      title="Kartu Kuning"
                                    />
                                  )}
                                  {e.type === 'second_yellow' && (
                                    <span
                                      className="relative inline-flex items-center shrink-0 align-middle ml-0.5"
                                      title="Kartu Kuning 2x (Kartu Merah)"
                                    >
                                      <span
                                        className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs"
                                        style={{ transform: 'translate(-1.5px, -0.5px)' }}
                                      />
                                      <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                                    </span>
                                  )}
                                  {e.type === 'red_card' && (
                                    <span
                                      className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40"
                                      title="Kartu Merah"
                                    />
                                  )}
                                </span>
                              ))}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Vertically Stacked Scores directly to the left of Result Badge */}
                    <div className="flex items-center justify-end gap-2.5 shrink-0">
                      <div className="flex flex-col text-right justify-center gap-0.5 font-mono font-black text-xs sm:text-sm leading-tight">
                        <span style={{ color: match.isHome ? '#38bdf8' : '#f1f5f9' }}>
                          {match.homeScore ?? '—'}
                        </span>
                        <span style={{ color: match.isHome ? '#f1f5f9' : '#38bdf8' }}>
                          {match.awayScore ?? '—'}
                        </span>
                      </div>

                      {result ? (
                        <span
                          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0"
                          style={{ background: resultBg }}
                        >
                          {result}
                        </span>
                      ) : (
                        <span style={{ color: '#334155' }}>—</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* ── Navigation Bar ── */}
            {matches.length > 10 && (
              <div className="py-3 px-4 flex items-center justify-between border-t border-white/[0.04] bg-slate-950/20 text-xs text-slate-400">
                <span className="text-[11px] sm:text-xs">
                  {hasMore ? (
                    <>
                      Menampilkan <strong className="text-white font-mono">{displayedMatches.length}</strong> dari{' '}
                      <strong className="text-white font-mono">{matches.length}</strong> riwayat pertandingan
                    </>
                  ) : (
                    <>
                      Menampilkan seluruh <strong className="text-white font-mono">{matches.length}</strong> riwayat pertandingan
                    </>
                  )}
                </span>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {visibleCount > 10 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(10)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
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
