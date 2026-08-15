import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArrowLeft, BarChart2, Shield } from 'lucide-react';
import { Oswald } from 'next/font/google';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* FontAwesome soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" style={{ fontSize: `${size}px` }} />
);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getResult(match: {
  isHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
}) {
  if (match.homeScore === null || match.awayScore === null) return null;
  const our = match.isHome ? match.homeScore : match.awayScore;
  const their = match.isHome ? match.awayScore : match.homeScore;
  if (our > their) return 'W';
  if (our < their) return 'L';
  return 'D';
}

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


export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const player = await prisma.player.findUnique({
    where: { slug },
    include: {
      lineups: {
        include: { match: true },
        orderBy: { match: { matchDate: 'desc' } },
      },
      events: {
        include: { match: true },
      },
      assistedEvents: {
        include: { match: true },
      },
    },
  });

  if (!player || player.isGuest) notFound();

  const finishedLineups = (player.lineups || []).filter(
    (l: any) => l.match.status === 'finished'
  );
  const recentMatches = finishedLineups.slice(0, 6);

  // Dynamic accurate season statistics calculations across all finished matches (Excluding own_goals!)
  const totalGoals = Math.max(
    player.goals,
    (player.events || []).filter((e: any) => (e.type === 'goal' || e.type === 'penalty') && e.match?.status === 'finished').length
  );
  const totalAssists = Math.max(
    player.assists,
    (player.events || []).filter((e: any) => e.type === 'assist').length + (player.assistedEvents || []).length
  );
  const totalAppearances = Math.max(player.appearances, finishedLineups.length);
  const totalYellowCards = Math.max(player.yellowCards, (player.events || []).filter((e: any) => e.type === 'yellow_card').length);
  const totalRedCards = Math.max(player.redCards, (player.events || []).filter((e: any) => e.type === 'red_card').length);

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };
  const specBg = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  const specs = [
    {
      label: 'Tanggal Lahir',
      value: player.birthDate
        ? new Date(player.birthDate).toLocaleDateString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
        })
        : '—',
    },
    { label: 'Kewarganegaraan', value: player.nationality || 'Indonesia' },
    { label: 'Tinggi Badan', value: player.heightCm ? `${player.heightCm} cm` : '—' },
    { label: 'Berat Badan', value: player.weightKg ? `${player.weightKg} kg` : '—' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">

      {/* ═══════════════════════════════════════════════════ */}
      {/* PROFILE HEADER & STATS                             */}
      {/* MOBILE: Photo top with overlay, specs below (1 box)*/}
      {/* DESKTOP: Photo 4:5 left, Biodata + Stats right     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
        {/* LEFT COLUMN: Player Photo Card (Aspect Ratio 4:5) */}
        <div className="md:col-span-5 lg:col-span-5 rounded-2xl sm:rounded-3xl overflow-hidden border border-sky-400/20 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] flex flex-col">
          {/* Top Photo Box (Aspect Ratio 4:5) */}
          <div className="group relative aspect-[4/5] w-full overflow-hidden flex flex-col justify-end">
            {/* Full Photo */}
            <img
              src={player.photoUrl || '/playertemplate.png'}
              alt={player.name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            
            {/* Soft Black Gradient Overlay at Bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-[#060b14] via-[#060b14]/75 via-50% to-transparent pointer-events-none" />

            {/* Bottom Info: Extra Large Number alongside Name & Position */}
            <div className="relative z-10 p-5 sm:p-8 md:p-6 flex items-center gap-4 sm:gap-6 md:gap-5">
              <span className="text-5xl sm:text-7xl md:text-7xl lg:text-8xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {player.number}
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

          {/* MOBILE ONLY: Physical Specs integrated in same box (seamless without border line) */}
          <div className="block md:hidden p-4 bg-gradient-to-b from-[#060b14] via-[#091222]/80 to-[#0a1526]">
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
          <div className="hidden md:block rounded-3xl p-6 border border-sky-400/20 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] space-y-4">
            <div className="flex items-center gap-2 border-b border-sky-400/20 pb-3">
              <Shield className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-black text-white uppercase tracking-wider">Biodata Pemain</h2>
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

          {/* AKUMULASI MUSIM INI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" style={{ color: '#f59e0b' }} />
              <h2 className="text-base sm:text-lg font-black text-white">Akumulasi Musim Ini</h2>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[
                { label: 'GOL', value: totalGoals, color: '#f59e0b' },
                { label: 'ASSIST', value: totalAssists, color: '#38bdf8' },
                { label: 'MAIN', value: totalAppearances, color: '#a78bfa' },
                { label: 'KUNING', value: totalYellowCards, color: '#facc15' },
                { label: 'MERAH', value: totalRedCards, color: '#f87171' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl flex flex-col items-center justify-center py-4 sm:py-5 gap-1 text-center"
                  style={panelBg}
                >
                  <span className={`text-2xl sm:text-3xl font-black text-white ${oswald.className}`} style={{ letterSpacing: '0.02em' }}>
                    {s.value}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LAST MATCHES                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-l font-black text-white">Last Matches</h2>
          
        </div>

        <div className="rounded-2xl overflow-hidden shadow-xl" style={panelBg}>
          {recentMatches.length === 0 ? (
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
                {recentMatches.map((lineup: any, idx: number) => {
                  const match = lineup.match;
                  const result = getResult(match);

                  const evts = (player.events || []).filter((e: any) => e.matchId === match.id);
                  const assistEvts = (player.assistedEvents || []).filter((e: any) => e.matchId === match.id);

                  const ownGoals = evts.filter((e: any) => e.type === 'own_goal').length;
                  const penalties = evts.filter((e: any) => e.type === 'penalty').length;
                  const regularGoals = evts.filter((e: any) => e.type === 'goal').length;
                  const goals = regularGoals + ownGoals + penalties;
                  const assists = evts.filter((e: any) => e.type === 'assist').length + assistEvts.length;
                  const yc = evts.filter((e: any) => e.type === 'yellow_card').length;
                  const hasSecondYellow = evts.some((e: any) => e.type === 'second_yellow') || yc >= 2;
                  const hasDirectRed = evts.some((e: any) => e.type === 'red_card');
                  const rc = (hasSecondYellow || hasDirectRed) ? 1 : 0;

                  const resultBg = result === 'W' ? '#16a34a' : result === 'L' ? '#dc2626' : '#d97706';
                  const rowBorder = idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)';

                  /* Shared match team labels */
                  const TopTeam = match.isHome
                    ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/marinerssc.png" alt="Mariners SC" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>Mariners SC</span>
                      </div>
                    )
                    : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src={match.opponentLogo} alt={match.opponentName} className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>{match.opponentName}</span>
                      </div>
                    );

                  const BottomTeam = match.isHome
                    ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src={match.opponentLogo} alt={match.opponentName} className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>{match.opponentName}</span>
                      </div>
                    )
                    : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/marinerssc.png" alt="Mariners SC" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>Mariners SC</span>
                      </div>
                    );

                  const hasEvents = goals > 0 || assists > 0 || rc > 0;

                  const MatchCell = () => (
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <TopTeam />
                        <BottomTeam />
                      </div>
                      {/* Event icons: Regular Goals / Own Goals / Penalty & Assists */}
                      {hasEvents && (
                        <div className="flex items-center gap-1 shrink-0">
                          {Array.from({ length: Math.min(regularGoals, 3) }).map((_, i) => (
                            <BallIcon key={`g${i}`} size={11} />
                          ))}
                          {Array.from({ length: Math.min(ownGoals, 3) }).map((_, i) => (
                            <i key={`og${i}`} className="fa-regular fa-futbol text-red-500 text-[10px] shrink-0" title="Gol Bunuh Diri" />
                          ))}
                          {Array.from({ length: Math.min(penalties, 3) }).map((_, i) => (
                            <span key={`p${i}`} className="relative inline-flex items-center shrink-0 mr-1" title="Gol Penalti">
                              <i className="fa-regular fa-futbol text-amber-400 text-[10px]" />
                              <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-400 text-slate-950 font-black text-[6px] flex items-center justify-center leading-none shadow-xs">
                                P
                              </span>
                            </span>
                          ))}
                          {Array.from({ length: Math.min(assists, 3) }).map((_, i) => (
                            <span
                              key={`a${i}`}
                              className="text-amber-400 font-black text-[10px] leading-none shrink-0"
                              title="Assist"
                            >
                              A
                            </span>
                          ))}
                          {hasSecondYellow ? (
                            <span className="relative inline-flex items-center shrink-0 align-middle ml-0.5" title="Kartu Kuning 2x (Kartu Merah)">
                              <span className="w-2 h-3 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                              <span className="w-2 h-3 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
                            </span>
                          ) : hasDirectRed ? (
                            <span className="w-2 h-3 bg-red-600 rounded-[1px] inline-block shrink-0 shadow-xs border border-red-400/40" title="Kartu Merah" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  );

                  const dateStr = new Date(match.matchDate)
                    .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                    .replace('/', '.');

                  return (
                    <Link
                      key={lineup.id}
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
                        <MatchCell />
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
            </>
          )}
        </div>
      </div>

    </div>
  );
}
