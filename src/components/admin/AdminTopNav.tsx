'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  Calendar,
  Sparkles,
  Newspaper,
  LayoutDashboard,
  ExternalLink,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { getClientAdminSeason, setClientAdminSeason } from '@/lib/adminSeason';

interface SeasonItem {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
}

export default function AdminTopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [activeSeason, setActiveSeason] = useState<string>('2026');

  // Do not render on login page
  if (pathname === '/admin/login') return null;

  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/admin/seasons');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSeasons(data);
        const saved = getClientAdminSeason();
        if (saved && data.some((s) => s.name === saved)) {
          setActiveSeason(saved);
        } else {
          const current = data.find((s) => s.isCurrent) || data[0];
          if (current) {
            setActiveSeason(current.name);
            setClientAdminSeason(current.name);
          }
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchSeasons();

    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setActiveSeason(e.detail.season);
      }
    };
    window.addEventListener('admin_season_changed', handleSeasonChange);
    return () => window.removeEventListener('admin_season_changed', handleSeasonChange);
  }, []);

  const handleSelectSeason = (seasonName: string) => {
    setActiveSeason(seasonName);
    setClientAdminSeason(seasonName);
    // Refresh current route to apply new season filter
    router.refresh();
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Laga', href: '/admin/matches', icon: Calendar },
    { label: 'Skuad', href: '/admin/players', icon: Users },
    { label: 'Kompetisi', href: '/admin/competitions', icon: Trophy },
    { label: 'Member', href: '/admin/members', icon: Sparkles },
    { label: 'Berita', href: '/admin/articles', icon: Newspaper },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-sky-400/20 px-3 sm:px-6 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Active Season Dropdown */}
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
            <img src="/marinerssc.webp" alt="Mariners SC" className="w-7 h-7 object-contain drop-shadow" />
            <div className="hidden sm:block">
              <span className="text-xs font-black text-white tracking-wider uppercase block">MARINERS SC</span>
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest block -mt-1">ADMIN PANEL</span>
            </div>
          </Link>

          {/* GLOBAL SEASON SWITCHER */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-950/60 border border-sky-400/40 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-300 hidden md:inline">Musim:</span>
            <div className="relative inline-block">
              <select
                value={activeSeason}
                onChange={(e) => handleSelectSeason(e.target.value)}
                className="bg-transparent text-xs font-black text-sky-300 focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.name} className="bg-slate-900 text-white font-bold">
                    {s.name} {s.isCurrent ? '(Aktif)' : ''}
                  </option>
                ))}
                {seasons.length === 0 && (
                  <option value="2026" className="bg-slate-900 text-white">2026</option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-sky-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Center: Navigation Links (hidden on small mobile, scrollable on tablet) */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Quick Web Link & Logout */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-sky-300 border border-slate-800 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors"
            title="Buka Website Utama"
          >
            <span className="hidden sm:inline">Lihat Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
