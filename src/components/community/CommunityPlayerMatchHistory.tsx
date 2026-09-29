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

interface CommunityPlayerMatchHistoryProps {
  attendances: any[];
  member: {
    id: string;
    fullName: string;
  };
}

export default function CommunityPlayerMatchHistory({
  attendances,
  member,
}: CommunityPlayerMatchHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(10);

  const displayedAttendances = attendances.slice(0, visibleCount);
  const hasMore = visibleCount < attendances.length;
  const remainingCount = attendances.length - visibleCount;

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-white">Last Matches</h2>
          {attendances.length > 0 && (
            <span className="text-xs font-bold text-slate-400 font-mono">
              ({displayedAttendances.length} dari {attendances.length})
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-xl" style={panelBg}>
        {attendances.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Shield className="w-9 h-9 mx-auto text-slate-700" />
            <p className="text-sm font-semibold text-slate-500">
              Belum ada riwayat pertandingan
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
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

            {/* Rows */}
            <div>
              {displayedAttendances.map((att: any, idx: number) => {
                const funMatch = att.funMatch;
                const footballMatch = att.footballMatch;
                if (!funMatch && !footballMatch) return null;

                const isFunMatch = Boolean(funMatch);
                const match = funMatch || footballMatch;

                const isTeamA = isFunMatch && att.assignedTeam === 'TEAM_A';
                const isTeamB = isFunMatch && att.assignedTeam === 'TEAM_B';

                let result: 'W' | 'L' | 'D' | null = null;
                if (isFunMatch) {
                  if (funMatch.teamAScore !== null && funMatch.teamBScore !== null) {
                    if (isTeamA) {
                      result =
                        funMatch.teamAScore > funMatch.teamBScore
                          ? 'W'
                          : funMatch.teamAScore < funMatch.teamBScore
                          ? 'L'
                          : 'D';
                    } else if (isTeamB) {
                      result =
                        funMatch.teamBScore > funMatch.teamAScore
                          ? 'W'
                          : funMatch.teamBScore < funMatch.teamAScore
                          ? 'L'
                          : 'D';
                    }
                  }
                } else if (footballMatch) {
                  if (footballMatch.homeScore !== null && footballMatch.awayScore !== null) {
                    const our = footballMatch.isHome
                      ? footballMatch.homeScore
                      : footballMatch.awayScore;
                    const their = footballMatch.isHome
                      ? footballMatch.awayScore
                      : footballMatch.homeScore;
                    result = our > their ? 'W' : our < their ? 'L' : 'D';
                  }
                }

                const resultBg =
                  result === 'W'
                    ? '#16a34a'
                    : result === 'L'
                    ? '#dc2626'
                    : result === 'D'
                    ? '#d97706'
                    : '#334155';
                const rowBorder = idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)';

                // Filter events for this member in this match
                const memberEvents = isFunMatch
                  ? (funMatch.events || []).filter(
                      (e: any) => e.memberId === member.id || e.playerName === member.fullName
                    )
                  : [];

                const dateStr = new Date(match.matchDate)
                  .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                  .replace('/', '.');

                const href = isFunMatch
                  ? `/community/matches/${funMatch.id}`
                  : `/matches/${footballMatch.id}`;

                return (
                  <Link
                    key={att.id}
                    href={href}
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
                          {isFunMatch ? (
                            <>
                              {/* Top Team (Team A) */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-blue-950 text-sky-400 font-mono font-black text-[9px] flex items-center justify-center border border-sky-400/40">
                                  A
                                </span>
                                <span
                                  className={`text-xs font-bold truncate flex-1 ${
                                    isTeamA ? 'text-sky-300' : 'text-slate-400 font-semibold'
                                  }`}
                                >
                                  {funMatch.teamAName} {isTeamA && '(Tim Anda)'}
                                </span>
                              </div>

                              {/* Bottom Team (Team B) */}
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-amber-950 text-amber-400 font-mono font-black text-[9px] flex items-center justify-center border border-amber-400/40">
                                  B
                                </span>
                                <span
                                  className={`text-xs font-bold truncate flex-1 ${
                                    isTeamB ? 'text-amber-300' : 'text-slate-400 font-semibold'
                                  }`}
                                >
                                  {funMatch.teamBName} {isTeamB && '(Tim Anda)'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-amber-950 text-amber-400 font-mono font-black text-[9px] flex items-center justify-center border border-amber-400/40">
                                  ★
                                </span>
                                <span className="text-xs font-bold truncate flex-1 text-sky-300">
                                  Mariners SC (Tim Utama)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-3.5 h-3.5 rounded bg-slate-900 text-slate-400 font-mono font-black text-[9px] flex items-center justify-center border border-slate-700">
                                  vs
                                </span>
                                <span className="text-xs font-bold truncate flex-1 text-slate-300">
                                  {footballMatch.opponentName}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Member Match Events */}
                        {memberEvents.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {memberEvents.map((e: any) => (
                              <span key={e.id} className="inline-flex items-center justify-center">
                                {e.type === 'goal' && <BallIcon size={11} />}
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
                                {e.type === 'red_card' && (
                                  <span
                                    className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40"
                                    title="Kartu Merah"
                                  />
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scores & Result */}
                    <div className="flex items-center justify-end gap-2.5 shrink-0">
                      <div className="flex flex-col text-right justify-center gap-0.5 font-mono font-black text-xs sm:text-sm leading-tight">
                        {isFunMatch ? (
                          <>
                            <span style={{ color: isTeamA ? '#38bdf8' : '#f1f5f9' }}>
                              {funMatch.teamAScore ?? '—'}
                            </span>
                            <span style={{ color: isTeamB ? '#f59e0b' : '#94a3b8' }}>
                              {funMatch.teamBScore ?? '—'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ color: '#38bdf8' }}>
                              {footballMatch.homeScore ?? '—'}
                            </span>
                            <span style={{ color: '#f1f5f9' }}>
                              {footballMatch.awayScore ?? '—'}
                            </span>
                          </>
                        )}
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

            {/* ── Navigation / Load More Button ── */}
            {hasMore ? (
              <div className="p-3 sm:p-4 text-center border-t border-white/[0.06] bg-slate-950/40">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 active:scale-95 border border-amber-400/30 hover:border-amber-400/60 text-amber-400 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer group"
                >
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                  <span>Buka 10 Riwayat Lagi</span>
                  <span className="text-[10px] text-amber-300 font-semibold font-mono bg-amber-950/90 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Tersisa {remainingCount}
                  </span>
                </button>
              </div>
            ) : (
              attendances.length > 10 && (
                <div className="py-3 px-4 flex items-center justify-between border-t border-white/[0.04] bg-slate-950/20 text-xs text-slate-400">
                  <span className="text-[11px] sm:text-xs">
                    Menampilkan seluruh <strong className="text-white font-mono">{attendances.length}</strong> riwayat pertandingan
                  </span>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(10)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    Tutup ke 10 awal
                  </button>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
