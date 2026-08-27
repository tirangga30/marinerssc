import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArrowLeft, Shield, Sparkles } from 'lucide-react';
import { Oswald } from 'next/font/google';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* FontAwesome soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

export const dynamic = 'force-dynamic';

function getPositionLabel(pos: string) {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'MIDFIELDER';
}

function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  if (parts.length === 2) {
    if (fullName.length > 20) return parts[0];
    return fullName;
  }
  const firstTwo = `${parts[0]} ${parts[1]}`;
  if (firstTwo.length > 18) {
    return parts[0];
  }
  return firstTwo;
}

export default async function CommunityPlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      matchAttendances: {
        where: { status: 'CONFIRMED' },
        include: {
          funMatch: {
            include: { events: true },
          },
          footballMatch: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      funMatchEvents: {
        include: { funMatch: true },
        orderBy: { minute: 'asc' },
      },
    },
  });

  if (!member) {
    notFound();
  }

  // Calculate dynamic stats
  const funMatchesPlayed = member.matchAttendances.filter((a) => a.funMatchId).length;
  const mainSquadMatchesPlayed = member.matchAttendances.filter((a) => a.matchId).length;
  const totalAppearances = (member.funAppearances || 0) + (member.mainAppearances || 0) || (funMatchesPlayed + mainSquadMatchesPlayed);

  const calculatedGoals = member.funMatchEvents.filter((e) => e.type === 'goal').length;
  const totalGoals = Math.max(member.goals || 0, calculatedGoals);

  const calculatedAssists = member.funMatchEvents.filter((e) => e.type === 'assist').length;
  const totalAssists = Math.max(member.assists || 0, calculatedAssists);

  const calculatedYellowCards = member.funMatchEvents.filter((e) => e.type === 'yellow_card').length;
  const totalYellowCards = Math.max(member.yellowCards || 0, calculatedYellowCards);

  const calculatedRedCards = member.funMatchEvents.filter((e) => e.type === 'red_card').length;
  const totalRedCards = Math.max(member.redCards || 0, calculatedRedCards);

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };

  const specs = [
    { label: 'Asal Domisili', value: member.origin || 'Indonesia' },
    {
      label: 'Masa Aktif',
      value: member.isPermanent
        ? 'Permanen (Lifetime)'
        : member.expiresAt
        ? (() => {
            const diff = new Date(member.expiresAt).getTime() - Date.now();
            const dateStr = new Date(member.expiresAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            if (diff <= 0) return `Expired (s.d ${dateStr})`;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            return `${days} Hari Lagi (s.d ${dateStr})`;
          })()
        : 'Aktif',
    },
    {
      label: 'Tanggal Gabung',
      value: member.joinedAt
        ? new Date(member.joinedAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : new Date(member.createdAt).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
    },
    { label: 'Status Akun', value: member.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif' },
  ];

  // Recent matches attended by member (Fun match & Tim Utama matches)
  const attendedAttendances = member.matchAttendances
    .filter((a) => a.funMatch || a.footballMatch)
    .slice(0, 10);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">



      {/* ═══════════════════════════════════════════════════ */}
      {/* PROFILE HEADER & STATS (IDENTIK DENGAN TIM UTAMA)   */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        
        {/* LEFT COLUMN: Player Photo Card (Aspect Ratio 4:5) */}
        <div className="md:col-span-5 lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-400/20 shadow-2xl bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14] flex flex-col">
          {/* Top Photo Box (Aspect Ratio 4:5) */}
          <div className="group relative aspect-[4/5] w-full overflow-hidden flex flex-col justify-end">
            <img
              src={member.photoUrl || '/playertemplate.png'}
              alt={member.fullName}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />

            {/* Top-Right Tag: "MEMBER" (tanpa jenis member) */}
            <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-black/60 border border-amber-300">
                <Sparkles className="w-3 h-3 text-slate-950 fill-slate-950" />
                MEMBER
              </span>
            </div>
            
            {/* Compact Black Gradient Overlay at Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14] via-[#060b14]/70 to-transparent pointer-events-none" />

            {/* Bottom Info: Extra Large Number alongside Name & Position */}
            <div className="relative z-10 p-5 sm:p-8 md:p-6 flex items-center gap-4 sm:gap-6 md:gap-5">
              <span className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black font-mono text-amber-400 leading-none shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {member.jerseyNumber}
              </span>
              <div className="min-w-0 space-y-1 sm:space-y-1.5">
                <h1 className="text-2xl sm:text-4xl md:text-3xl lg:text-4xl font-black text-white uppercase leading-tight drop-shadow-lg tracking-tight">
                  {member.nickname || formatDisplayName(member.fullName)}
                </h1>
                <p className="text-xs sm:text-base md:text-sm text-amber-400 font-extrabold uppercase tracking-widest leading-none drop-shadow">
                  {getPositionLabel(member.position)}
                </p>
              </div>
            </div>
          </div>

          {/* MOBILE ONLY: Physical Specs integrated in same box */}
          <div className="block md:hidden p-4 bg-gradient-to-b from-[#060b14] via-[#15120a]/80 to-[#0a1526]">
            <div className="grid grid-cols-2 gap-2.5">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-3 bg-slate-900/80 border border-slate-800/80 shadow-inner">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {item.label}
                  </span>
                  <span className="text-xs font-extrabold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (DESKTOP): Biodata & Akumulasi Musim Ini */}
        <div className="md:col-span-7 lg:col-span-7 space-y-4 md:space-y-6">
          
          {/* DESKTOP ONLY: Physical Specs / Biodata Panel */}
          <div className="hidden md:block rounded-3xl p-6 border border-amber-400/20 shadow-2xl bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14] space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-400/20 pb-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">Biodata Member</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {specs.map((item) => (
                <div key={item.label} className="rounded-xl p-4 bg-slate-900/80 border border-slate-800/80 shadow-inner">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {item.label}
                  </span>
                  <span className="text-base font-extrabold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STATS PANEL (Single Combined Wide Box - Clean & Uniform) */}
          <div className="grid grid-cols-5 divide-x divide-slate-800/80 bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14] rounded-2xl sm:rounded-3xl border border-amber-400/20 shadow-2xl overflow-hidden py-4 sm:py-5">
            {[
              { label: 'GOL', value: totalGoals },
              { label: 'ASSIST', value: totalAssists },
              { label: 'MAIN', value: totalAppearances },
              { label: 'KUNING', value: totalYellowCards },
              { label: 'MERAH', value: totalRedCards },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                  {s.label}
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LAST MATCHES (IDENTIK 100% DENGAN TIM UTAMA)        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-l font-black text-white">Last Matches</h2>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-xl" style={panelBg}>
          {attendedAttendances.length === 0 ? (
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
                {attendedAttendances.map((att: any, idx: number) => {
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
                        result = funMatch.teamAScore > funMatch.teamBScore ? 'W' : funMatch.teamAScore < funMatch.teamBScore ? 'L' : 'D';
                      } else if (isTeamB) {
                        result = funMatch.teamBScore > funMatch.teamAScore ? 'W' : funMatch.teamBScore < funMatch.teamAScore ? 'L' : 'D';
                      }
                    }
                  } else if (footballMatch) {
                    if (footballMatch.homeScore !== null && footballMatch.awayScore !== null) {
                      const our = footballMatch.isHome ? footballMatch.homeScore : footballMatch.awayScore;
                      const their = footballMatch.isHome ? footballMatch.awayScore : footballMatch.homeScore;
                      result = our > their ? 'W' : our < their ? 'L' : 'D';
                    }
                  }

                  const resultBg = result === 'W' ? '#16a34a' : result === 'L' ? '#dc2626' : result === 'D' ? '#d97706' : '#334155';
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

                  const href = isFunMatch ? `/community/matches/${funMatch.id}` : `/matches/${footballMatch.id}`;

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
                                    <span className="text-amber-400 font-black text-[10px] leading-none shrink-0" title="Assist">
                                      A
                                    </span>
                                  )}
                                  {e.type === 'yellow_card' && (
                                    <span className="w-2 h-3 bg-amber-400 rounded-[1px] inline-block shrink-0 shadow-xs border border-amber-300/40" title="Kartu Kuning" />
                                  )}
                                  {e.type === 'red_card' && (
                                    <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40" title="Kartu Merah" />
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
            </>
          )}
        </div>
      </div>

    </div>
  );
}
