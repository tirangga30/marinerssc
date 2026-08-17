import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, ArrowRight, Flame, Sparkles } from 'lucide-react';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { formatWibDate, formatWibTime } from '@/lib/date';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const normalizePos = (pos: string) => {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'FORWARD';
};

function formatBoxDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;

  if (fullName.length <= 14) return fullName;
  return parts[0];
}


function getDynamicMatchStatus(m: any): 'scheduled' | 'live' | 'finished' | 'score_pending' {
  if (!m) return 'scheduled';

  const hasScore = m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined;
  const hasFulltime = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
  const isExplicitlyFinished = m.status === 'finished' || hasFulltime;

  const now = new Date();
  const start = new Date(m.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  let isTimeFinished = false;
  if (m.isLiveEnabled !== false) {
    isTimeFinished = isExplicitlyFinished;
  } else {
    const durationMinutes = m.duration || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    isTimeFinished = isExplicitlyFinished || now >= end;
  }

  if (isTimeFinished) {
    if (!hasScore) return 'score_pending';
    return 'finished';
  }

  if (now >= start) return 'live';
  return 'scheduled';
}

export default async function HomePage() {
  let matches: any[] = [];
  let articles: any[] = [];
  let featuredPlayers: any[] = [];

  try {
    const rawMatches = await prisma.footballMatch.findMany({
      include: {
        events: true,
      },
      orderBy: { matchDate: 'asc' },
    });

    matches = rawMatches.map((m: any, idx: number) => ({
      ...m,
      matchday: idx + 1
    }));

    articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    // Fetch players starred/favorited by admin (isFeatured = true), or fallback to top players
    featuredPlayers = await prisma.player.findMany({
      where: { isFeatured: true },
      orderBy: { number: 'asc' },
      take: 6,
    });

    if (featuredPlayers.length === 0) {
      featuredPlayers = await prisma.player.findMany({
        take: 6,
        orderBy: { appearances: 'desc' },
      });
    }
  } catch (error) {
    console.error('Error fetching data from database:', error);
  }

  const matchesWithStatus = matches.map((m: any) => ({
    ...m,
    computedStatus: getDynamicMatchStatus(m)
  }));

  const liveMatch = matchesWithStatus.find((m: any) => m.computedStatus === 'live');
  const upcomingMatch = matchesWithStatus
    .filter((m: any) => m.computedStatus === 'scheduled')
    .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];
  const lastFinishedMatch = matchesWithStatus
    .filter((m: any) => m.computedStatus === 'finished')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0];

  const nextMatch = liveMatch || upcomingMatch || lastFinishedMatch || matchesWithStatus[0];
  const featuredStatus = nextMatch ? getDynamicMatchStatus(nextMatch) : 'scheduled';

  const finishedMatches = matchesWithStatus.filter((m: any) => m.computedStatus === 'finished');
  const totalFinished = finishedMatches.length;

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let totalGoals = 0;
  let concededGoals = 0;

  finishedMatches.forEach((m: any) => {
    const marinersScore = m.isHome ? m.homeScore : m.awayScore;
    const opponentScore = m.isHome ? m.awayScore : m.homeScore;

    if (marinersScore !== null && opponentScore !== null) {
      totalGoals += marinersScore;
      concededGoals += opponentScore;

      if (marinersScore > opponentScore) {
        wins++;
      } else if (marinersScore === opponentScore) {
        draws++;
      } else {
        losses++;
      }
    }
  });

  const winRate = totalFinished > 0 ? Math.round((wins / totalFinished) * 100) : 0;

  return (
    <div className="space-y-8 sm:space-y-16 pb-12">
      
      {/* HERO SECTION - COMPACT MOBILE HEIGHT */}
      <section className="relative py-6 sm:py-20 min-h-0 sm:min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-blue-500/20 px-2 sm:px-3">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-95 contrast-105 scale-105 transform duration-1000"
          style={{ backgroundImage: `url('/players.jpeg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/55 to-[#060b14]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060b14]/50 via-transparent to-[#060b14]/50" />

        {/* Floating Blue Spotlight Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-2 text-center space-y-3 sm:space-y-6 pt-2 sm:pt-12">
          
          {/* Badge Top */}
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full glass-panel-blue text-sky-300 text-[9px] sm:text-xs font-extrabold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
            <span>Musim 2026/2027</span>
          </div>

          <h1 className="text-2xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-tight sm:leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
            BERJUANG DENGAN KEHORMATAN, <br />
            <span className="blue-gradient-text">MERAIH KEJAYAAN</span>
          </h1>

          <p className="max-w-2xl mx-auto text-[11px] sm:text-lg text-slate-200 font-medium leading-normal sm:leading-relaxed">
            Selamat datang di rumah resmi <strong className="text-sky-300">Mariners SC</strong>. Saksikan aksi terbaik pertahanan dan gol-gol spektakuler laskar Samudra.
          </p>

          {/* COMPACT HERO BUTTONS ON MOBILE */}
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 pt-1 sm:pt-4">
            <Link
              href="/players"
              className="flex items-center gap-1.5 px-3 sm:px-6 py-1.5 sm:py-3.5 rounded-lg sm:rounded-xl font-extrabold uppercase white-blue-btn text-[10px] sm:text-sm"
            >
              Skuad Tim
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </Link>
            <Link
              href="/matches"
              className="flex items-center gap-1.5 px-3 sm:px-6 py-1.5 sm:py-3.5 rounded-lg sm:rounded-xl font-bold uppercase text-white glass-panel border border-slate-700 hover:border-sky-400 hover:text-sky-300 transition-all text-[10px] sm:text-sm"
            >
              Jadwal Laga
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
            </Link>
          </div>

        </div>
      </section>

      {/* MATCH SCORECARD FEATURED */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 -mt-6 sm:-mt-20 relative z-20">
        <Link
          href={nextMatch ? `/matches/${nextMatch.id}` : '/matches'}
          className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
        >
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
            {featuredStatus === 'live' ? (
              <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
              </span>
            ) : featuredStatus === 'scheduled' ? (
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-sky-300 transition-colors">
                Laga Mendatang
              </h3>
            ) : (
              <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-sky-300 transition-colors">
                Hasil Pertandingan Terakhir
              </h3>
            )}
            <span className="flex items-center gap-1.5 sm:gap-2">
              {nextMatch && (
                <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                  {formatWibDate(nextMatch.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                Matchday {nextMatch?.matchday || 1}
              </span>
            </span>
          </div>

          {nextMatch ? (
            <>
              <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                
                {/* Mariners SC (Home/Away) - NO BOX */}
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                  <div className="order-2 sm:order-1 text-center sm:text-right">
                    <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">MARINERS SC</h4>

                  </div>
                  <div className="order-1 sm:order-2 flex items-center justify-center">
                    <img
                      src="/marinerssc.png"
                      alt="Mariners SC Logo"
                      className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Score / VS Badge */}
                <div className="space-y-0.5 sm:space-y-2">
                  {featuredStatus === 'live' ? (
                    <LiveScoreDisplay
                      targetDate={nextMatch.matchDate}
                      duration={nextMatch.duration}
                      homeScore={nextMatch.homeScore ?? 0}
                      awayScore={nextMatch.awayScore ?? 0}
                      isLiveEnabled={nextMatch.isLiveEnabled !== false}
                      events={nextMatch.events}
                      status={featuredStatus}
                    />
                  ) : featuredStatus === 'score_pending' ? (
                    <>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                      <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                        VS
                      </div>
                    </>
                  ) : featuredStatus === 'finished' ? (
                    <>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                      <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                        {nextMatch.homeScore ?? 0} : {nextMatch.awayScore ?? 0}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                        {formatWibTime(nextMatch.matchDate)}
                      </p>
                      <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                        VS
                      </div>
                    </>
                  )}
                  <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">{nextMatch.venue}</p>
                </div>

                {/* Opponent - NO BOX */}
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                  <div className="flex items-center justify-center">
                    <img
                      src={nextMatch.opponentLogo}
                      alt={nextMatch.opponentName}
                      className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">{nextMatch.opponentName}</h4>

                  </div>
                </div>

              </div>

              {/* COUNTDOWN / LIVE / FINISHED TIMER INSIDE THE BOX */}
              <MatchTimer targetDate={nextMatch.matchDate} status={featuredStatus} duration={nextMatch.duration} isLiveEnabled={nextMatch.isLiveEnabled !== false} />
            </>
          ) : (
            <div className="text-center py-3 text-xs text-slate-400">
              Menghubungkan data pertandingan Mariners SC...
            </div>
          )}

        </Link>
      </section>

      {/* 3 PERTANDINGAN TERAKHIR */}
      {finishedMatches.length > 0 && (() => {
        const last3 = [...finishedMatches]
          .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
          .slice(0, 3);
        return (
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-3 sm:mb-5 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-sky-400 inline-block" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">3 Pertandingan Terakhir</h2>
            </div>
            <div className="space-y-2">
              {last3.map((m: any) => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
                >
                  {/* Top Bar Header */}
                  {(() => {
                    const our = m.isHome ? m.homeScore : m.awayScore;
                    const their = m.isHome ? m.awayScore : m.homeScore;
                    const result = our > their ? 'WIN' : our < their ? 'LOSE' : 'DRAW';
                    const resultColor = result === 'WIN' ? '#16a34a' : result === 'LOSE' ? '#dc2626' : '#d97706';
                    const resultBg = result === 'WIN' ? 'rgba(22,163,74,0.15)' : result === 'LOSE' ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)';
                    return (
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
                        <span
                          className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border"
                          style={{ color: resultColor, background: resultBg, borderColor: `${resultColor}40` }}
                        >
                          {result}
                        </span>
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                            {formatWibDate(m.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                            Matchday {m.matchday}
                          </span>
                        </span>
                      </div>
                    );
                  })()}

                  {/* Main Scoreboard Content */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">

                    {/* Home Team */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                      <div className="order-2 sm:order-1 text-center sm:text-right">
                        <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                          {m.isHome ? 'MARINERS SC' : m.opponentName}
                        </h4>
                      </div>
                      <div className="order-1 sm:order-2 flex items-center justify-center">
                        <img
                          src={m.isHome ? '/marinerssc.png' : (m.opponentLogo || '/defaultteam.png')}
                          alt={m.isHome ? 'Mariners SC' : m.opponentName}
                          className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Score */}
                    <div className="space-y-0.5 sm:space-y-2">
                      <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                        FULL TIME
                      </p>
                      <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                        {m.homeScore} : {m.awayScore}
                      </div>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">{m.venue}</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                      <div className="flex items-center justify-center">
                        <img
                          src={!m.isHome ? '/marinerssc.png' : (m.opponentLogo || '/defaultteam.png')}
                          alt={!m.isHome ? 'Mariners SC' : m.opponentName}
                          className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                          {!m.isHome ? 'MARINERS SC' : m.opponentName}
                        </h4>
                      </div>
                    </div>

                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}


      {/* SEASON STATS OVERVIEW - MOVED TO DIRECTLY BELOW BOXMATCH */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-sky-400/20 bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526]">
          <div className="text-center max-w-xl mx-auto mb-3 sm:mb-6 space-y-0.5">
            <h2 className="text-base sm:text-2xl font-black uppercase text-white">Statistik Musim 2026/2027</h2>
            <p className="text-[9px] sm:text-xs text-slate-300">Performa resmi klub Mariners SC di musim ini</p>
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-800/80 bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] rounded-2xl sm:rounded-3xl border border-sky-400/20 shadow-2xl overflow-hidden py-3 sm:py-5">
            {[
              { label: 'WIN RATE', value: `${winRate}%` },
              { label: 'MAIN', value: totalFinished },
              { label: 'MENANG', value: wins },
              { label: 'SERI', value: draws },
              { label: 'KALAH', value: losses },
              { label: 'GOL', value: totalGoals },
              { label: 'KEMASUKAN', value: concededGoals },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                <span className="text-sm sm:text-3xl md:text-4xl font-black font-mono text-white tracking-tight">
                  {s.value}
                </span>
                <span className="text-[8px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 truncate max-w-full">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLAYERS GRID - DYNAMIC PLAYERS */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
        <div className="flex items-end justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-base sm:text-3xl font-black uppercase text-white">
              Mariners SC Players
            </h2>
          </div>
          <Link
            href="/players"
            className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-0.5"
          >
            Semua Pemain <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 2 COLUMNS ON MOBILE: grid-cols-2 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
          {featuredPlayers.map((player: any) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-400/60 shadow-xl card-glow-hover flex flex-col justify-end"
            >
              {/* Full Photo */}
              <img
                src={player.photoUrl || '/playertemplate.png'}
                alt={player.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Compact Black Gradient Overlay at Bottom */}
              <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/60 to-transparent pointer-events-none" />

              {/* Bottom Info: Number alongside Name & Position (Compact box font size) */}
              <div className="relative z-10 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-md">
                  {player.number}
                </span>
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white group-hover:text-sky-300 transition-colors uppercase leading-tight">
                    {formatBoxDisplayName(player.name)}
                  </h3>
                  <p className="text-[7px] sm:text-[8px] md:text-[9px] text-sky-400/90 font-bold uppercase tracking-widest leading-none">
                    {normalizePos(player.position)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* LATEST NEWS GRID - 3 COLUMNS SIDE-BY-SIDE ON MOBILE */}
      <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
        <div className="flex items-end justify-between border-b border-slate-800 pb-2">
          <div>
            <h2 className="text-base sm:text-3xl font-black uppercase text-white">
              Berita Klub
            </h2>
          </div>
          <Link
            href="/articles"
            className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-0.5"
          >
            Semua Berita <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 3 COLUMNS ON MOBILE: grid-cols-3 */}
        <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group glass-panel rounded-lg sm:rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
            >
              <div className="relative w-full overflow-hidden bg-slate-900">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-1 sm:top-3 left-1 sm:left-3 px-1 sm:px-2.5 py-0.5 rounded bg-white text-blue-950 font-black text-[7px] sm:text-[10px] uppercase tracking-wider shadow">
                  {article.category}
                </div>
              </div>
              <div className="p-2 sm:p-5 flex-1 flex flex-col justify-between space-y-1 sm:space-y-3">
                <div>
                  <span className="text-[8px] sm:text-[11px] text-slate-400 block mb-0.5">
                    {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <h3 className="text-[10px] sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-tight sm:leading-normal">
                    {article.title}
                  </h3>
                </div>
                <span className="text-[8px] sm:text-xs font-bold text-sky-400 hidden sm:flex items-center gap-1 pt-1">
                  Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
