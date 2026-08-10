import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Calendar, ArrowRight, Flame, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  let matches: any[] = [];
  let articles: any[] = [];
  let featuredPlayers: any[] = [];

  try {
    matches = await prisma.footballMatch.findMany({
      orderBy: { matchDate: 'asc' },
    });

    articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    featuredPlayers = await prisma.player.findMany({
      where: {
        slug: {
          in: ['jay-idzes', 'thom-haye', 'marselino-ferdinan', 'rafael-struick', 'maarten-paes', 'ramadhan-sananta'],
        },
      },
      take: 6,
    });
  } catch (error) {
    console.error('Error fetching data from database:', error);
  }

  const nextMatch = matches.find((m: any) => m.status === 'scheduled') || matches[matches.length - 1];

  const totalMatches = matches.filter((m: any) => m.status === 'finished').length;
  const wins = matches.filter((m: any) => m.status === 'finished' && m.homeScore !== null && m.awayScore !== null && ((m.isHome && m.homeScore > m.awayScore) || (!m.isHome && m.awayScore > m.homeScore))).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 100;
  const totalGoals = matches.reduce((acc: number, m: any) => acc + (m.isHome ? (m.homeScore || 0) : (m.awayScore || 0)), 0);

  return (
    <div className="space-y-10 sm:space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-blue-500/20 px-3">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-45 scale-105 transform duration-1000"
          style={{ backgroundImage: `url('/players.jpeg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-[#060b14]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060b14] via-transparent to-[#060b14]" />

        {/* Floating Blue Spotlight Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-2 text-center space-y-4 sm:space-y-6 pt-8 sm:pt-12">
          
          {/* Badge Top */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full glass-panel-blue text-sky-300 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Klub Sepak Bola • Musim 2025/2026</span>
          </div>

          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-white leading-tight sm:leading-none">
            BERJUANG DENGAN KEHORMATAN, <br />
            <span className="blue-gradient-text">MERAIH KEJAYAAN</span>
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-lg text-slate-200 font-medium leading-relaxed">
            Selamat datang di rumah resmi <strong className="text-sky-300">Mariners SC</strong>. Saksikan aksi terbaik pilar pertahanan dan gol-gol spektakuler laskar Samudra.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
            <Link
              href="/players"
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs sm:text-sm"
            >
              Lihat Skuad Tim
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </Link>
            <Link
              href="/matches"
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold uppercase text-white glass-panel border border-slate-700 hover:border-sky-400 hover:text-sky-300 transition-all text-xs sm:text-sm"
            >
              Jadwal Pertandingan
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
            </Link>
          </div>

        </div>
      </section>

      {/* MATCH SCORECARD FEATURED */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-20">
        <div className="glass-panel p-4 sm:p-8 rounded-2xl border border-sky-400/30 shadow-2xl shadow-slate-950">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
                {nextMatch?.status === 'scheduled' ? 'Laga Mendatang' : 'Hasil Pertandingan Terakhir'}
              </h3>
            </div>
            <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
              {nextMatch?.competition || 'BRI Liga 1'}
            </span>
          </div>

          {nextMatch ? (
            <div className="grid grid-cols-3 gap-2 sm:gap-6 items-center text-center">
              
              {/* Mariners SC (Home/Away) - NO BOX */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1.5 sm:gap-4">
                <div className="order-2 sm:order-1 text-center sm:text-right">
                  <h4 className="text-xs sm:text-xl font-black text-white uppercase">MARINERS SC</h4>
                  <p className="text-[9px] sm:text-xs text-sky-400 font-bold">Tuan Rumah</p>
                </div>
                <div className="order-1 sm:order-2 flex items-center justify-center">
                  <img
                    src="/marinerssc.png"
                    alt="Mariners SC Logo"
                    className="w-10 h-10 sm:w-16 sm:h-16 object-contain drop-shadow-xl"
                  />
                </div>
              </div>

              {/* Score / VS Badge */}
              <div className="space-y-1 sm:space-y-2">
                {nextMatch.status === 'finished' ? (
                  <div className="text-2xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                    {nextMatch.homeScore} : {nextMatch.awayScore}
                  </div>
                ) : (
                  <div className="inline-block px-3 sm:px-5 py-1 sm:py-2 rounded-xl bg-blue-600/30 text-sky-300 font-black text-sm sm:text-2xl border border-sky-400/50">
                    VS
                  </div>
                )}
                <p className="text-[10px] sm:text-xs text-slate-300 font-medium">
                  {new Date(nextMatch.matchDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[9px] sm:text-[11px] text-slate-400 truncate max-w-xs mx-auto">{nextMatch.venue}</p>
              </div>

              {/* Opponent - NO BOX */}
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-4">
                <div className="flex items-center justify-center">
                  <img
                    src={nextMatch.opponentLogo}
                    alt={nextMatch.opponentName}
                    className="w-10 h-10 sm:w-16 sm:h-16 object-contain drop-shadow-xl"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h4 className="text-xs sm:text-xl font-black text-white uppercase">{nextMatch.opponentName}</h4>
                  <p className="text-[9px] sm:text-xs text-slate-400 font-semibold">Lawan</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              Menghubungkan data pertandingan Mariners SC...
            </div>
          )}

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800 flex justify-center">
            <Link
              href={nextMatch ? `/matches/${nextMatch.id}` : '/matches'}
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              Lihat Detail & Taktik Lapangan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* FEATURED PLAYERS GRID - 2 COLUMNS ON MOBILE */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        <div className="flex items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Pilar Skuad</span>
            <h2 className="text-lg sm:text-3xl font-black uppercase text-white mt-0.5 sm:mt-1">
              Pemain Bintang
            </h2>
          </div>
          <Link
            href="/players"
            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-1"
          >
            Semua Pemain ({featuredPlayers.length}+) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 2 COLUMNS ON MOBILE: grid-cols-2 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {featuredPlayers.map((player: any) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="group glass-panel rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
            >
              {/* Photo & Number Badge */}
              <div className="relative h-36 sm:h-64 overflow-hidden bg-slate-900">
                <img
                  src={player.photoUrl || '/playertemplate.jpeg'}
                  alt={player.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060b14] via-transparent to-transparent" />
                
                {/* Number Badge */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl blue-gradient-bg text-white font-black text-xs sm:text-lg flex items-center justify-center shadow-lg border border-white/20">
                  #{player.number}
                </div>

                {player.isCaptain && (
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded bg-white text-blue-950 font-black text-[8px] sm:text-[10px] uppercase tracking-wider shadow">
                    KAPTEN
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-sky-400 mb-0.5">
                    <span>{player.position}</span>
                    <span className="text-slate-400 truncate max-w-[70px]">{player.nationality}</span>
                  </div>
                  <h3 className="text-xs sm:text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase truncate">
                    {player.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5">{player.bio}</p>
                </div>

                {/* Mini Stats Bar */}
                <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2 border-t border-slate-800 text-center text-[10px] sm:text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px] sm:text-[10px]">Gol</span>
                    <span className="font-bold text-sky-300">{player.goals}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] sm:text-[10px]">Assist</span>
                    <span className="font-bold text-slate-200">{player.assists}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] sm:text-[10px]">Main</span>
                    <span className="font-bold text-slate-200">{player.appearances}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEASON STATS OVERVIEW */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 sm:p-8 rounded-2xl border border-sky-400/20 bg-gradient-to-r from-blue-950/60 via-[#060b14] to-blue-950/60">
          <div className="text-center max-w-xl mx-auto mb-4 sm:mb-8 space-y-1">
            <h2 className="text-lg sm:text-2xl font-black uppercase text-white">Statistik Musim 2025/2026</h2>
            <p className="text-[10px] sm:text-xs text-slate-300">Performa klub Mariners SC di BRI Liga 1</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 text-center">
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xl sm:text-3xl font-black font-mono blue-gradient-text block">{winRate}%</span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-0.5 block">Win Rate</span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xl sm:text-3xl font-black font-mono text-white block">{totalGoals}</span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-0.5 block">Total Gol</span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xl sm:text-3xl font-black font-mono text-emerald-400 block">3</span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-0.5 block">Kemenangan</span>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-xl sm:text-3xl font-black font-mono text-sky-400 block">#1</span>
              <span className="text-[10px] sm:text-xs font-semibold uppercase text-slate-400 mt-0.5 block">Papan Atas</span>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST NEWS GRID */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        <div className="flex items-end justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Kabar Terbaru</span>
            <h2 className="text-lg sm:text-3xl font-black uppercase text-white mt-0.5">
              Berita Klub
            </h2>
          </div>
          <Link
            href="/articles"
            className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-1"
          >
            Semua Berita <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group glass-panel rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
            >
              <div className="relative h-40 sm:h-48 overflow-hidden bg-slate-900">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white text-blue-950 font-black text-[10px] uppercase tracking-wider shadow">
                  {article.category}
                </div>
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                <div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1">
                    {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <h3 className="text-xs sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-sky-400 flex items-center gap-1 pt-1">
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
