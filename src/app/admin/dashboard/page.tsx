import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { Users, Calendar, Newspaper, Activity, LogOut, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  let playerCount = 16;
  let matchCount = 4;
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
      (m: any) => m.homeScore !== null && m.awayScore !== null && ((m.isHome && m.homeScore > m.awayScore) || (!m.isHome && m.awayScore > m.homeScore))
    ).length;

    winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 75;
  } catch (e) {
    console.error('Error fetching admin dashboard stats:', e);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Dashboard Top Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-sky-400/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Panel Admin</span>
          <h1 className="text-3xl font-black uppercase text-white blue-gradient-text">
            Selamat Datang, {session.email}
          </h1>
          <p className="text-xs text-slate-300">© 2026 Mariners Soccer Club. All Rights Reserved.</p>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-200 hover:text-red-400 border border-slate-700 text-xs font-bold uppercase flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </form>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Users className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600/20 text-sky-300 rounded">Skuad</span>
          </div>
          <p className="text-3xl font-black font-mono text-white">{playerCount}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Pemain Terdaftar</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600/20 text-sky-300 rounded">Laga</span>
          </div>
          <p className="text-3xl font-black font-mono text-white">{matchCount}</p>
          <p className="text-xs text-slate-400 font-semibold">Total Pertandingan</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Newspaper className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600/20 text-sky-300 rounded">Berita</span>
          </div>
          <p className="text-3xl font-black font-mono text-white">{articleCount}</p>
          <p className="text-xs text-slate-400 font-semibold">Artikel Berita</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-sky-400">
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-600/20 text-sky-300 rounded">Performa</span>
          </div>
          <p className="text-3xl font-black font-mono blue-gradient-text">{winRate}%</p>
          <p className="text-xs text-slate-400 font-semibold">Rasio Kemenangan</p>
        </div>
      </div>

      {/* Action Shortcut Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 1: Players */}
        <Link
          href="/admin/players"
          className="group glass-panel p-6 rounded-2xl border border-slate-800 card-glow-hover space-y-4"
        >
          <div className="w-12 h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Manajemen Pemain
            </h3>
            <p className="text-xs text-slate-300 mt-1">Tambah, edit foto bio, dan update statistik gol/assist pemain skuad.</p>
          </div>
          <div className="pt-3 border-t border-slate-800 text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Pemain <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Module 2: Matches & Lineup */}
        <Link
          href="/admin/matches"
          className="group glass-panel p-6 rounded-2xl border border-slate-800 card-glow-hover space-y-4"
        >
          <div className="w-12 h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Manajemen Pertandingan & Taktik
            </h3>
            <p className="text-xs text-slate-300 mt-1">Kelola skor laga & akses 2D Lineup Builder untuk susunan starter 4-3-3.</p>
          </div>
          <div className="pt-3 border-t border-slate-800 text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Pertandingan <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Module 3: Articles */}
        <Link
          href="/admin/articles"
          className="group glass-panel p-6 rounded-2xl border border-slate-800 card-glow-hover space-y-4"
        >
          <div className="w-12 h-12 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white group-hover:text-sky-300 transition-colors uppercase">
              Manajemen Artikel Berita
            </h3>
            <p className="text-xs text-slate-300 mt-1">Tulis dan terbitkan berita terbaru seputar laporan laga dan kabar tim.</p>
          </div>
          <div className="pt-3 border-t border-slate-800 text-xs font-bold text-sky-400 flex items-center gap-1">
            Buka Kelola Artikel <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

      </div>

    </div>
  );
}
