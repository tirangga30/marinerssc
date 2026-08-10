import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Shield, Calendar, Trophy, ArrowRight, Star, Flame, Sparkles, Award, PlayCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Dynamic rendering for latest data

export default async function HomePage() {
  // Fetch latest/next match
  const matches = await prisma.footballMatch.findMany({
    orderBy: { matchDate: 'asc' },
  });

  const nextMatch = matches.find((m: any) => m.status === 'scheduled') || matches[matches.length - 1];
  const lastFinishedMatch = [...matches].reverse().find((m: any) => m.status === 'finished');

  // Fetch 3 latest articles
  const articles = await prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  // Fetch featured players
  const featuredPlayers = await prisma.player.findMany({
    where: {
      slug: {
        in: ['jay-idzes', 'thom-haye', 'marselino-ferdinan', 'rafael-struick', 'maarten-paes', 'ramadhan-sananta'],
      },
    },
    take: 6,
  });

  // Stats calculation
  const totalMatches = matches.filter((m: any) => m.status === 'finished').length;
  const wins = matches.filter((m: any) => m.status === 'finished' && m.homeScore !== null && m.awayScore !== null && ((m.isHome && m.homeScore > m.awayScore) || (!m.isHome && m.awayScore > m.homeScore))).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 100;
  const totalGoals = matches.reduce((acc: number, m: any) => acc + (m.isHome ? (m.homeScore || 0) : (m.awayScore || 0)), 0);

  return (
    <div className="space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-amber-500/20">
        {/* Stadium Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat filter brightness-40 scale-105 transform duration-1000"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1920&auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090d16] via-transparent to-[#090d16]" />

        {/* Floating Spotlight Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-6 pt-12">
          
          {/* Badge Top */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel-gold text-amber-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Klub Sepak Bola Profesional • Musim 2025/2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-slate-100 leading-none">
            BERJUANG DENGAN KEHORMATAN, <br />
            <span className="gold-gradient-text">MERAIH KEJAYAAN</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
            Selamat datang di rumah resmi <strong className="text-amber-400">Mariners FC</strong>. Saksikan aksi terbaik pilar pertahanan, keajaiban lini tengah, dan gol-gol spektakuler laskar Samudra.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <Link
              href="/players"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-extrabold uppercase text-slate-950 gold-gradient-bg shadow-lg shadow-amber-500/25 hover:scale-105 transition-all text-sm"
            >
              Lihat Skuad Tim
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/matches"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold uppercase text-slate-200 glass-panel border border-slate-700 hover:border-amber-500/50 hover:text-amber-400 transition-all text-sm"
            >
              Jadwal Pertandingan
              <Calendar className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

        </div>
      </section>

      {/* MATCH SCORECARD FEATURED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-500/30 shadow-2xl shadow-slate-950">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">
                {nextMatch?.status === 'scheduled' ? 'Laga Mendatang' : 'Hasil Pertandingan Terakhir'}
              </h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-amber-500/20">
              {nextMatch?.competition || 'BRI Liga 1'}
            </span>
          </div>

          {nextMatch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
              
              {/* Mariners FC (Home/Away) */}
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-end gap-4">
                <div className="order-2 md:order-1 text-center md:text-right">
                  <h4 className="text-xl font-black text-slate-100 uppercase">MARINERS FC</h4>
                  <p className="text-xs text-amber-400 font-semibold">Tuan Rumah</p>
                </div>
                <div className="order-1 md:order-2 w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Shield className="w-9 h-9 text-amber-400" />
                </div>
              </div>

              {/* Score / VS Badge */}
              <div className="space-y-2">
                {nextMatch.status === 'finished' ? (
                  <div className="text-4xl sm:text-5xl font-black font-mono gold-gradient-text tracking-widest">
                    {nextMatch.homeScore} : {nextMatch.awayScore}
                  </div>
                ) : (
                  <div className="inline-block px-5 py-2 rounded-xl bg-amber-500/20 text-amber-400 font-black text-2xl border border-amber-500/40">
                    VS
                  </div>
                )}
                <p className="text-xs text-slate-400 font-medium">
                  {new Date(nextMatch.matchDate).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-xs mx-auto">{nextMatch.venue}</p>
              </div>

              {/* Opponent */}
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-lg">
                  <img src={nextMatch.opponentLogo} alt={nextMatch.opponentName} className="w-12 h-12 object-contain" />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-black text-slate-100 uppercase">{nextMatch.opponentName}</h4>
                  <p className="text-xs text-slate-400 font-semibold">Lawan</p>
                </div>
              </div>

            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-center">
            <Link
              href={nextMatch ? `/matches/${nextMatch.id}` : '/matches'}
              className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              Lihat Detail & Taktik Lapangan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>

      {/* FEATURED PLAYERS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Pilar Utama Skuad</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-100 mt-1">
              Pemain Bintang Mariners FC
            </h2>
          </div>
          <Link
            href="/players"
            className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Lihat Semua Pemain ({featuredPlayers.length}+) <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPlayers.map((player: any) => (
            <Link
              key={player.id}
              href={`/players/${player.slug}`}
              className="group glass-panel rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
            >
              {/* Photo & Number Badge */}
              <div className="relative h-64 overflow-hidden bg-slate-900">
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent" />
                
                {/* Number Badge */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-xl gold-gradient-bg text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
                  #{player.number}
                </div>

                {player.isCaptain && (
                  <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                    KAPTEN
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                    <span>{player.position}</span>
                    <span className="text-slate-400">{player.nationality}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-100 group-hover:text-amber-400 transition-colors uppercase">
                    {player.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{player.bio}</p>
                </div>

                {/* Mini Stats Bar */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gol</span>
                    <span className="font-bold text-amber-400">{player.goals}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Assist</span>
                    <span className="font-bold text-slate-200">{player.assists}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Main</span>
                    <span className="font-bold text-slate-200">{player.appearances}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SEASON STATS OVERVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-[#090d16] to-slate-900/90">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <h2 className="text-2xl font-black uppercase text-slate-100">Statistik Musim 2025/2026</h2>
            <p className="text-xs text-slate-400">Ringkasan performa klub Mariners FC sejauh ini di kompetisi BRI Liga 1</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-3xl font-black font-mono gold-gradient-text block">{winRate}%</span>
              <span className="text-xs font-semibold uppercase text-slate-400 mt-1 block">Win Rate</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-3xl font-black font-mono text-slate-100 block">{totalGoals}</span>
              <span className="text-xs font-semibold uppercase text-slate-400 mt-1 block">Total Gol</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-3xl font-black font-mono text-emerald-400 block">3</span>
              <span className="text-xs font-semibold uppercase text-slate-400 mt-1 block">Kemenangan</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-3xl font-black font-mono text-amber-400 block">#1</span>
              <span className="text-xs font-semibold uppercase text-slate-400 mt-1 block">Papan Atas</span>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST NEWS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Kabar Terbaru</span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-slate-100 mt-1">
              Berita Seputar Klub
            </h2>
          </div>
          <Link
            href="/articles"
            className="text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            Lihat Semua Berita <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article: any) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group glass-panel rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
            >
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={article.thumbnail}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                  {article.category}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">
                    {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1 pt-2">
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
