import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { Users, Calendar, Newspaper, Activity, LogOut, ArrowRight, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  let playerCount = 19;
  let matchCount = 6;
  let articleCount = 4;
  let winRate = 75;

  try {
    playerCount = await prisma.player.count();
    matchCount = await prisma.footballMatch.count();
    articleCount = await prisma.article.count();

    const finishedMatches = await prisma.footballMatch.findMany({
      where: { status: 'finished' },
    });

    const wins = finishedMatches.filter(
      (m: any) =>
        m.homeScore !== null &&
        m.awayScore !== null &&
        ((m.isHome && m.homeScore > m.awayScore) || (!m.isHome && m.awayScore > m.homeScore))
    ).length;

    winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 75;
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
          <p className="text-[11px] sm:text-xs text-slate-300">Mariners SC · Akses Kontrol Resmi</p>
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

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6">
        <div className="glass-panel p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">Skuad</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{playerCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">Pemain Terdaftar</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">Laga</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{matchCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">Pertandingan</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Newspaper className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">Berita</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-white">{articleCount}</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">Artikel Berita</p>
        </div>

        <div className="glass-panel p-3.5 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Activity className="w-4 h-4 sm:w-6 sm:h-6" />
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-600/20 text-sky-300 rounded">Performa</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono blue-gradient-text">{winRate}%</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-semibold truncate">Rasio Menang</p>
        </div>
      </div>

      {/* Action Shortcut Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
        
        {/* Module 1: Players */}
        <Link
          href="/admin/players"
          className="group glass-panel p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3 sm:space-y-4"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Pemain
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">Tambah, edit foto 4:5, bio, posisi, dan statistik gol/assist skuad.</p>
          </div>
          <div className="pt-2 sm:pt-3 border-t border-slate-800 text-[11px] sm:text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Pemain <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 2: Matches & Lineup */}
        <Link
          href="/admin/matches"
          className="group glass-panel p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3 sm:space-y-4"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Pertandingan & Taktik
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">Jadwal laga, live skor, dan susunan pemain starter di 2D Lineup Builder.</p>
          </div>
          <div className="pt-2 sm:pt-3 border-t border-slate-800 text-[11px] sm:text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Pertandingan <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Module 3: Articles */}
        <Link
          href="/admin/articles"
          className="group glass-panel p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-800 card-glow-hover space-y-3 sm:space-y-4 sm:col-span-2 md:col-span-1"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Newspaper className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Kelola Berita & Artikel
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">Tulis dan terbitkan berita terbaru seputar laporan laga dan kabar tim.</p>
          </div>
          <div className="pt-2 sm:pt-3 border-t border-slate-800 text-[11px] sm:text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Artikel <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

      </div>

    </div>
  );
}
