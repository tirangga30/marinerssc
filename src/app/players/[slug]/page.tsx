import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArrowLeft, BarChart2, Shield } from 'lucide-react';
import { Oswald } from 'next/font/google';

const oswald = Oswald({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

/* Yellow 2D soccer ball icon */
const BallIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', flexShrink: 0 }}>
    <circle cx="50" cy="50" r="50" fill="#facc15" />
    {/* Center pentagon */}
    <polygon points="50,30 66,42 60,62 40,62 34,42" fill="#111827" />
    {/* Top */}
    <polygon points="50,4 59,18 50,30 41,18" fill="#111827" />
    {/* Top-right */}
    <polygon points="78,16 82,34 66,42 61,26" fill="#111827" />
    {/* Bottom-right */}
    <polygon points="84,66 72,82 60,72 60,62 74,56" fill="#111827" />
    {/* Bottom-left */}
    <polygon points="16,66 26,82 40,72 40,62 28,56" fill="#111827" />
    {/* Top-left */}
    <polygon points="22,16 39,26 34,42 18,34" fill="#111827" />
  </svg>
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
  const map: Record<string, string> = {
    GK: 'Penjaga Gawang',
    DF: 'Bek',
    MF: 'Gelandang',
    FW: 'Penyerang',
  };
  return map[pos] || pos;
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
        take: 6,
      },
      events: {
        include: { match: true },
      },
    },
  });

  if (!player) notFound();

  const recentMatches = player.lineups.filter(
    (l) => l.match.status === 'finished'
  );

  const panelBg = { background: '#0d1628', border: '1px solid rgba(255,255,255,0.08)' };
  const specBg = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6">

      {/* Back */}
      <Link
        href="/players"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors font-semibold group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Pemain
      </Link>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PROFILE CARD                                        */}
      {/* MOBILE: centered photo top, info below              */}
      {/* DESKTOP: photo left, info right                     */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={panelBg}>

        {/* ── MOBILE layout (flex-col, centered) ── */}
        <div className="flex flex-col items-center pt-6 pb-5 px-4 sm:hidden">
          {/* Photo */}
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden mb-4 shadow-xl"
            style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
            <img
              src={player.photoUrl}
              alt={player.name}
              className="w-full h-full object-cover object-top"
            />
            {player.isCaptain && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-black text-white uppercase"
                style={{ background: '#2563eb' }}
              >
                C
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="px-2.5 py-1 rounded text-xs font-black"
              style={{ background: '#f59e0b', color: '#0f172a' }}
            >
              #{player.number}
            </span>
            <span
              className="px-2.5 py-1 rounded text-xs font-black text-white uppercase"
              style={{ background: '#1d4ed8' }}
            >
              {getPositionLabel(player.position)}
            </span>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-black uppercase text-white text-center leading-tight tracking-tight mb-1">
            {player.name}
          </h1>
          <p className="text-sm font-bold mb-4" style={{ color: '#38bdf8' }}>
            Mariners SC #{player.number}
          </p>

          {/* Physical specs 2×2 */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {[
              {
                label: 'Tanggal Lahir',
                value: player.birthDate
                  ? new Date(player.birthDate).toLocaleDateString('id-ID', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })
                  : '—',
              },
              { label: 'Kewarganegaraan', value: player.nationality || 'Indonesia' },
              {
                label: 'Tinggi Badan',
                value: player.heightCm ? `${player.heightCm} cm` : '—',
              },
              {
                label: 'Berat Badan',
                value: player.weightKg ? `${player.weightKg} kg` : '—',
              },
            ].map((item) => (
              <div key={item.label} className="rounded-lg px-3 py-2.5" style={specBg}>
                <span
                  className="block text-[9px] font-bold uppercase tracking-wider mb-1"
                  style={{ color: '#64748b' }}
                >
                  {item.label}
                </span>
                <span className="text-sm font-extrabold text-slate-100">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── DESKTOP layout (photo left, info right) ── */}
        <div className="hidden sm:flex gap-0">
          {/* Photo */}
          <div className="relative shrink-0 w-48" style={{ minHeight: '220px' }}>
            <img
              src={player.photoUrl}
              alt={player.name}
              className="w-full h-full object-cover object-top"
              style={{ minHeight: '220px' }}
            />
            {player.isCaptain && (
              <div
                className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded text-white font-black text-[9px] uppercase"
                style={{ background: '#2563eb' }}
              >
                <Shield className="w-2.5 h-2.5" /> C
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 p-7 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded text-xs font-black"
                  style={{ background: '#f59e0b', color: '#0f172a' }}
                >
                  #{player.number}
                </span>
                <span
                  className="px-2.5 py-1 rounded text-xs font-black text-white uppercase"
                  style={{ background: '#1d4ed8' }}
                >
                  {getPositionLabel(player.position)}
                </span>
              </div>
              <h1 className="text-4xl font-black uppercase text-white leading-none tracking-tight">
                {player.name}
              </h1>
              <p className="text-sm font-bold" style={{ color: '#38bdf8' }}>
                Mariners SC #{player.number}
              </p>
            </div>

            {/* Specs 4-col */}
            <div className="grid grid-cols-4 gap-2">
              {[
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
              ].map((item) => (
                <div key={item.label} className="rounded-lg px-3 py-2.5" style={specBg}>
                  <span className="block text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-extrabold text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* AKUMULASI MUSIM INI                                 */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5" style={{ color: '#f59e0b' }} />
          <h2 className="text-base sm:text-lg font-black text-white">Akumulasi Musim Ini</h2>
        </div>
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {[
            { label: 'GOL', value: player.goals, color: '#f59e0b' },
            { label: 'ASSIST', value: player.assists, color: '#38bdf8' },
            { label: 'MAIN', value: player.appearances, color: '#a78bfa' },
            { label: 'KUNING', value: player.yellowCards, color: '#facc15' },
            { label: 'MERAH', value: player.redCards, color: '#f87171' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl flex flex-col items-center justify-center py-4 sm:py-5 gap-1 text-center"
              style={panelBg}
            >
              <span className={`text-2xl sm:text-3xl font-black ${oswald.className}`} style={{ color: s.color, letterSpacing: '0.02em' }}>
                {s.value}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* LAST MATCHES                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-xl font-black text-white">Last Matches</h2>
          <span className="text-xs font-semibold" style={{ color: '#38bdf8' }}>Riwayat Laga Terakhir</span>
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
              {/* ── MOBILE Table Header (3 col) ── */}
              <div
                className="grid sm:hidden px-3 py-2 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: '44px 1fr 40px',
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: '#475569',
                }}
              >
                <span>Tanggal</span>
                <span>Pertandingan &amp; Skor</span>
                <span className="text-center">Hasil</span>
              </div>

              {/* ── DESKTOP Table Header (7 col) ── */}
              <div
                className="hidden sm:grid px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  gridTemplateColumns: '72px 1fr 44px 44px 44px 44px 52px',
                  background: 'rgba(255,255,255,0.03)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  color: '#475569',
                }}
              >
                <span>Tanggal</span>
                <span>Pertandingan &amp; Skor</span>
                <span className="text-center flex items-center justify-center"><BallIcon size={12} /></span>
                <span className="text-center">🎯</span>
                <span className="text-center text-yellow-400">■</span>
                <span className="text-center text-red-500">■</span>
                <span className="text-center">Hasil</span>
              </div>

              {/* ── Rows ── */}
              <div>
                {recentMatches.map((lineup, idx) => {
                  const match = lineup.match;
                  const result = getResult(match);
                  const ourScore = match.isHome ? match.homeScore : match.awayScore;
                  const theirScore = match.isHome ? match.awayScore : match.homeScore;

                  const evts = player.events.filter((e) => e.matchId === match.id);
                  const goals = evts.filter((e) => e.type === 'goal').length;
                  const assists = evts.filter((e) => e.type === 'assist').length;
                  const yc = evts.filter((e) => e.type === 'yellow_card').length;
                  const rc = evts.filter((e) => e.type === 'red_card').length;

                  const resultBg = result === 'W' ? '#16a34a' : result === 'L' ? '#dc2626' : '#475569';



                  const rowBorder = idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)';

                  /* ─── shared match cell ─── */
                  /* Home team always top, away team bottom */
                  const TopTeam = match.isHome
                    ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/marinerssc.png" alt="Mariners SC" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>Mariners SC</span>
                        <span className="text-sm font-black tabular-nums shrink-0 ml-1" style={{ color: '#f1f5f9' }}>{ourScore ?? '—'}</span>
                      </div>
                    )
                    : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src={match.opponentLogo} alt={match.opponentName} className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>{match.opponentName}</span>
                        <span className="text-sm font-black tabular-nums shrink-0 ml-auto" style={{ color: '#64748b' }}>{theirScore ?? '—'}</span>
                      </div>
                    );

                  const BottomTeam = match.isHome
                    ? () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src={match.opponentLogo} alt={match.opponentName} className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-semibold truncate flex-1" style={{ color: '#94a3b8' }}>{match.opponentName}</span>
                        <span className="text-sm font-black tabular-nums shrink-0 ml-auto" style={{ color: '#64748b' }}>{theirScore ?? '—'}</span>
                      </div>
                    )
                    : () => (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <img src="/marinerssc.png" alt="Mariners SC" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-xs font-bold truncate flex-1" style={{ color: '#38bdf8' }}>Mariners SC</span>
                        <span className="text-sm font-black tabular-nums shrink-0 ml-1" style={{ color: '#f1f5f9' }}>{ourScore ?? '—'}</span>
                      </div>
                    );

                  /* Event icons centered between the two rows */
                  const hasEvents = goals > 0 || assists > 0 || yc > 0 || rc > 0;

                  const MatchCell = () => (
                    <div className="flex items-stretch gap-2 min-w-0">
                      {/* Teams stacked */}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <TopTeam />
                        <BottomTeam />
                      </div>
                      {/* Event icons — vertically centered */}
                      {hasEvents && (
                        <div className="flex items-center gap-1 shrink-0">
                          {Array.from({ length: Math.min(goals, 3) }).map((_, i) => (
                            <BallIcon key={`g${i}`} size={15} />
                          ))}
                          {Array.from({ length: Math.min(assists, 2) }).map((_, i) => (
                            <span key={`a${i}`} style={{ fontSize: 13, lineHeight: 1 }}>🎯</span>
                          ))}
                          {yc > 0 && <span style={{ fontSize: 13, lineHeight: 1 }}>🟨</span>}
                          {rc > 0 && <span style={{ fontSize: 13, lineHeight: 1 }}>🟥</span>}
                        </div>
                      )}
                    </div>
                  );

                  const dateStr = new Date(match.matchDate)
                    .toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })
                    .replace('/', '.');

                  return (
                    <React.Fragment key={lineup.id}>
                      {/* ── MOBILE ROW (3 col) ── */}
                      <Link
                        href={`/matches/${match.id}`}
                        className="grid sm:hidden px-3 py-3 hover:bg-white/[0.03] transition-colors items-center"
                        style={{
                          gridTemplateColumns: '44px 1fr 40px',
                          borderTop: rowBorder,
                        }}
                      >
                        {/* Date */}
                        <span className="text-[11px] font-bold" style={{ color: '#64748b' }}>
                          {dateStr}
                        </span>

                        {/* Match */}
                        <div className="min-w-0 pr-2">
                          <MatchCell />
                        </div>

                        {/* Result */}
                        <div className="flex items-center justify-center">
                          {result ? (
                            <span
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white"
                              style={{ background: resultBg }}
                            >
                              {result}
                            </span>
                          ) : <span style={{ color: '#334155' }}>—</span>}
                        </div>
                      </Link>

                      {/* ── DESKTOP ROW (7 col) ── */}
                      <Link
                        href={`/matches/${match.id}`}
                        className="hidden sm:grid px-4 py-3 hover:bg-white/[0.03] transition-colors items-center"
                        style={{
                          gridTemplateColumns: '72px 1fr 44px 44px 44px 44px 52px',
                          borderTop: rowBorder,
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: '#64748b' }}>{dateStr}</span>

                        <div className="pr-2 min-w-0"><MatchCell /></div>

                        <span className="text-center text-sm font-black" style={{ color: goals > 0 ? '#38bdf8' : '#334155' }}>{goals}</span>
                        <span className="text-center text-sm font-black" style={{ color: assists > 0 ? '#34d399' : '#334155' }}>{assists}</span>
                        <span className="text-center text-sm font-black" style={{ color: yc > 0 ? '#facc15' : '#334155' }}>{yc}</span>
                        <span className="text-center text-sm font-black" style={{ color: rc > 0 ? '#f87171' : '#334155' }}>{rc}</span>

                        <div className="flex items-center justify-center">
                          {result ? (
                            <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white" style={{ background: resultBg }}>
                              {result}
                            </span>
                          ) : <span style={{ color: '#334155' }}>—</span>}
                        </div>
                      </Link>
                    </React.Fragment>
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
