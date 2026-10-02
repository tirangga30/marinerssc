import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { Users, Calendar, Newspaper, Activity, LogOut, ArrowRight, Shield, Sparkles, Trophy, Lock, Layers } from 'lucide-react';
import DashboardSeasonSelector from '@/components/admin/DashboardSeasonSelector';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const cookieStore = await cookies();
  const cookieSeason = cookieStore.get('admin_season')?.value;
  const params = await searchParams;
  const requestedSeason = params.season || cookieSeason;

  // Fetch all seasons with their counts
  const seasons = await prisma.season.findMany({
    orderBy: { year: 'desc' },
    include: {
      _count: {
        select: {
          players: true,
          matches: true,
          competitions: true,
        },
      },
    },
  });

  const activeSeason =
    seasons.find((s) => s.name === requestedSeason || s.id === requestedSeason) ||
    seasons.find((s) => s.isCurrent) ||
    seasons[0];

  const activeSeasonName = activeSeason?.name || '2026';

  let seasonPlayerCount = 0;
  let seasonMatchCount = 0;
  let totalAllPlayers = 0;
  let memberCount = 0;
  let funMatchCount = 0;
  let articleCount = 0;
  let winRate = 75;

  try {
    totalAllPlayers = await prisma.player.count({ where: { isGuest: false } });
    memberCount = await prisma.member.count({ where: { status: 'ACTIVE' } });
    funMatchCount = await prisma.funMatch.count();
    articleCount = await prisma.article.count();

    if (activeSeason) {
      seasonPlayerCount = activeSeason._count.players;
      seasonMatchCount = await prisma.footballMatch.count({
        where: { seasonName: activeSeason.name },
      });

      const finishedMatches = await prisma.footballMatch.findMany({
        where: { seasonName: activeSeason.name, status: 'finished' },
      });

      const wins = finishedMatches.filter(
        (m: any) =>
          m.homeScore !== null &&
          m.awayScore !== null &&
          ((m.isHome && m.homeScore > m.awayScore) || (!m.isHome && m.awayScore > m.homeScore))
      ).length;

      winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 0;
    }
  } catch (e) {
    console.error('Error fetching admin dashboard stats:', e);
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8">
      
      {/* Dashboard Top Banner */}
      <div className="glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <Shield className="w-3 h-3 text-sky-400" />
            Panel Pengelola Klub
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white blue-gradient-text tracking-tight">
            Selamat Datang, {session.email.split('@')[0]}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Mariners SC · Pengelolaan Musim Aktif: <b className="text-sky-300">Musim {activeSeasonName}</b>
          </p>
        </div>

        <form action="/api/auth/logout" method="POST" className="w-full sm:w-auto">
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800/90 hover:bg-red-500/20 text-slate-200 hover:text-red-400 border border-slate-700 text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </form>
      </div>

      {/* ── PROMINENT SEASON SELECTOR ON DASHBOARD ── */}
      <DashboardSeasonSelector seasons={seasons} selectedSeason={activeSeasonName} />

      {/* Stats Overview Grid for the Selected Season */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 sm:gap-4">
        <div className="glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-400/30 space-y-1 bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-400">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">
              Musim {activeSeasonName}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{seasonPlayerCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">
            Skuad Terdaftar ({totalAllPlayers} di klub)
          </p>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-400/30 space-y-1 bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-400">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">
              Musim {activeSeasonName}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{seasonMatchCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">Laga Utama Musim Ini</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-400/30 space-y-1 bg-sky-950/10">
          <div className="flex items-center justify-between text-sky-400">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">
              Musim {activeSeasonName}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono blue-gradient-text">{winRate}%</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">Rasio Menang</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-amber-600/20 text-amber-300 rounded">Komunitas</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300">{memberCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">Member Aktif ({funMatchCount} Fun Match)</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-sky-400">
            <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">Berita</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{articleCount}</p>
          <p className="text-[10px] text-slate-400 font-semibold truncate">Artikel Berita</p>
        </div>
      </div>

      {/* Action Shortcut Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        
        {/* Module 1: Kelola Kompetisi */}
        <Link
          href="/admin/competitions"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-400/40 card-glow-hover space-y-3 bg-sky-950/20"
        >
          <div className="w-10 h-10 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Trophy className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Kompetisi
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">Kelola daftar turnamen, liga, dan friendly match klub untuk setiap musim.</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-sky-400 flex items-center gap-1">
            Buka Kompetisi <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 2: Players */}
        <Link
          href="/admin/players"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3"
        >
          <div className="w-10 h-10 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Skuad Utama
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">Bio, foto 4:5, posisi, nomor, dan statistik pemain utama.</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-sky-400 flex items-center gap-1">
            Buka Skuad <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 3: Matches & Lineup */}
        <Link
          href="/admin/matches"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3"
        >
          <div className="w-10 h-10 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Pertandingan
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">Jadwal laga, live skor, dan susunan pemain di 2D Lineup Builder.</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-sky-400 flex items-center gap-1">
            Buka Laga <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 4: Members & Community */}
        <Link
          href="/admin/members"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-500/30 card-glow-hover space-y-3 bg-amber-950/10"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-lg border border-white/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors uppercase">
              Kelola Member &amp; Fun Match
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">Data member, ID login, tarik ke skuad utama, dan jadwal fun match.</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-amber-400 flex items-center gap-1">
            Buka Member <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 5: Articles */}
        <Link
          href="/admin/articles"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3"
        >
          <div className="w-10 h-10 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Berita &amp; Artikel
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">Tulis dan terbitkan berita terbaru seputar klub dan laporan laga.</p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-sky-400 flex items-center gap-1">
            Buka Artikel <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 6: Team Management (Portal Khusus PIN) */}
        <Link
          href="/admin/team-management"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-amber-500/40 card-glow-hover space-y-3 bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-950/80 relative overflow-hidden"
        >
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Lock className="w-2.5 h-2.5 text-amber-400" /> TERKUNCI PIN
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg border border-white/20">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors uppercase">
              Team Management
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Logo klub, nama tim, wallpaper login &amp; panel admin, kelola user &amp; PIN keamanan.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-amber-400 flex items-center gap-1">
            Buka Portal (PIN) <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 7: Main Poster (Hero Beranda Slide) */}
        <Link
          href="/admin/main-poster"
          className="group glass-panel p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-sky-400/40 card-glow-hover space-y-3 bg-gradient-to-br from-sky-950/20 via-slate-900/60 to-slate-950/80 relative overflow-hidden"
        >
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 text-sky-300" /> SLIDE 5 DETIK
          </div>
          <div className="w-10 h-10 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Layers className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h3 className="text-base font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Main Poster
            </h3>
            <p className="text-[11px] text-slate-300 mt-1">
              Unggah hingga 5 poster beranda yang berputar bergantian secara otomatis tiap 5 detik.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] font-bold text-sky-400 flex items-center gap-1">
            Kelola Poster <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

      </div>

    </div>
  );
}
