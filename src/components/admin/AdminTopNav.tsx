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
  Shield,
} from 'lucide-react';
import { getClientAdminSeason, setClientAdminSeason } from '@/lib/adminSeason';
import { useSystemSetting } from '@/context/SystemSettingContext';

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

  const { teamName, teamLogo, isCommunityEnabled } = useSystemSetting();

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

  const allNavItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Laga', href: '/admin/matches', icon: Calendar },
    { label: 'Skuad', href: '/admin/players', icon: Users },
    { label: 'Kompetisi', href: '/admin/competitions', icon: Trophy },
    { label: 'Member', href: '/admin/members', icon: Sparkles },
    { label: 'Berita', href: '/admin/articles', icon: Newspaper },
    { label: 'Identitas Tim', href: '/admin/team-management', icon: Shield },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.href === '/admin/members' && isCommunityEnabled === false) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Active Season Dropdown */}
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0">
            <img src={teamLogo || "/defaultteam.webp"} alt={teamName || "TEAM"} className="w-7 h-7 object-contain drop-shadow-sm" />
            <div className="hidden sm:block">
              <span className="text-xs font-black text-slate-900 tracking-wider uppercase block">{teamName || "TEAM"}</span>
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block -mt-1">ADMIN PANEL</span>
            </div>
          </Link>

          {/* GLOBAL SEASON SWITCHER */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="text-[10px] font-bold text-slate-600 hidden md:inline">Musim:</span>
            <div className="relative inline-block">
              <select
                value={activeSeason}
                onChange={(e) => handleSelectSeason(e.target.value)}
                className="bg-transparent text-xs font-black text-blue-600 focus:outline-none cursor-pointer pr-4 appearance-none"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.name} className="bg-white text-slate-900 font-bold">
                    {s.name} {s.isCurrent ? '(Aktif)' : ''}
                  </option>
                ))}
                {seasons.length === 0 && (
                  <option value="2026" className="bg-white text-slate-900">2026</option>
                )}
              </select>
              <ChevronDown className="w-3 h-3 text-blue-600 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
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
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-blue-600 border border-slate-200 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors"
            title="Buka Website Utama"
          >
            <span className="hidden sm:inline">Lihat Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
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
