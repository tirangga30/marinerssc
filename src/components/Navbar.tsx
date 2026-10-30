'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, Calendar, Users, Newspaper, BarChart3, Menu, X,
  LayoutDashboard, ExternalLink, LogOut, Sparkles, Trophy,
  Award, UserCheck, Flame
} from 'lucide-react';
import { useClubMode } from '@/context/ClubModeContext';
import { useSystemSetting } from '@/context/SystemSettingContext';
import { getClientPublicSeason } from '@/lib/publicSeason';

interface CurrentMember {
  id: string;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  tier?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clubMode, setClubMode } = useClubMode();
  const { teamName, teamLogo, isCommunityEnabled } = useSystemSetting();
  const [publicSeason, setPublicSeason] = useState<string | null>(null);
  const [currentMember, setCurrentMember] = useState<CurrentMember | null>(null);

  useEffect(() => {
    if (isCommunityEnabled === false && clubMode === 'community') {
      setClubMode('main');
    }
  }, [isCommunityEnabled, clubMode, setClubMode]);

  useEffect(() => {
    setPublicSeason(getClientPublicSeason());
    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setPublicSeason(e.detail.season);
      }
    };
    window.addEventListener('public_season_changed', handleSeasonChange);
    return () => window.removeEventListener('public_season_changed', handleSeasonChange);
  }, []);

  // Check logged-in community member
  useEffect(() => {
    let isMounted = true;
    const checkMember = async () => {
      try {
        const res = await fetch('/api/community/auth/me', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.member) {
            setCurrentMember(data.member);
            return;
          }
        }
        if (isMounted) setCurrentMember(null);
      } catch {
        if (isMounted) setCurrentMember(null);
      }
    };

    checkMember();

    const handleAuthChange = () => {
      checkMember();
    };

    window.addEventListener('member_auth_changed', handleAuthChange);
    window.addEventListener('focus', handleAuthChange);

    return () => {
      isMounted = false;
      window.removeEventListener('member_auth_changed', handleAuthChange);
      window.removeEventListener('focus', handleAuthChange);
    };
  }, [pathname]);

  const isAdminRoute = pathname.startsWith('/admin');
  const isCommunityPortal = pathname === '/community' || pathname === '/community/';

  // Tim Utama Nav Links with season query param
  const seasonQuery = publicSeason ? `?season=${encodeURIComponent(publicSeason)}` : '';
  const mainNavLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal & Hasil', href: `/matches${seasonQuery}`, icon: Calendar },
    { name: 'Pemain', href: `/players${seasonQuery}`, icon: Users },
    { name: 'Berita', href: '/articles', icon: Newspaper },
    { name: 'Statistik', href: `/stats${seasonQuery}`, icon: BarChart3 },
  ];

  // Soccer Community Nav Links
  const communityNavLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal & Hasil', href: '/community/matches', icon: Calendar },
    { name: 'Pemain', href: '/community/players', icon: Users },
    { name: 'Statistik', href: '/community/stats', icon: BarChart3 },
    { name: 'Member', href: '/community', icon: Sparkles },
  ];

  const adminNavLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Kelola Pemain', href: '/admin/players', icon: Users },
    { name: 'Kelola Laga', href: '/admin/matches', icon: Calendar },
    { name: 'Kelola Kompetisi', href: '/admin/competitions', icon: Trophy },
    { name: 'Kelola Berita', href: '/admin/articles', icon: Newspaper },
    ...(isCommunityEnabled !== false ? [{ name: 'Kelola Member', href: '/admin/members', icon: Sparkles }] : []),
  ];

  // Active public nav links based on clubMode
  const activeNavLinks = (isCommunityEnabled !== false && clubMode === 'community') ? communityNavLinks : mainNavLinks;

  const toggleClubMode = (targetMode: 'main' | 'community') => {
    setClubMode(targetMode);
    setMobileMenuOpen(false);
    if (pathname === '/') {
      // Stay on homepage which will reactively re-render
    } else {
      if (targetMode === 'community') {
        router.push('/community');
      } else {
        router.push('/');
      }
    }
  };

  // ADMIN NAVBAR VIEW
  if (isAdminRoute) {
    return (
      <header className="sticky top-0 z-50 bg-white/95 border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo Admin */}
            <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src={teamLogo || "/defaultteam.webp"}
                alt={`${teamName || "TEAM"} Logo`}
                className="h-8 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
              />
              <div>
                <span className="text-base sm:text-xl font-black uppercase tracking-wider blue-gradient-text block leading-none">
                  {(teamName || 'TEAM').toUpperCase()}
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-blue-600 font-extrabold block mt-0.5">
                  PANEL ADMIN KELOLA
                </span>
              </div>
            </Link>

            {/* Desktop Admin Navigation */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {adminNavLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-bold transition-colors duration-200 rounded-lg ${
                      isActive
                        ? 'text-blue-600 bg-blue-50/80 font-extrabold'
                        : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 text-slate-600 hover:text-slate-900 transition-colors focus:outline-hidden cursor-pointer"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Admin Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 border-b border-slate-200 px-4 pt-2 pb-6 space-y-1 shadow-md">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 font-extrabold'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // PUBLIC NAVBAR VIEW (SEPERTI FOOTER DENGAN BATAS BAWAH LURUS)
  // ═════════════════════════════════════════════════════════════
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#004bb8] via-[#003893] to-[#002d73] text-white border-b border-blue-900/50 shadow-md relative overflow-hidden">
      {/* Decorative Wave Accent (Terkunci di dalam navbar, batas bawah tetap 100% lurus) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none opacity-20">
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,25 C320,55 600,10 900,35 C1200,60 1340,15 1440,30 L1440,80 L0,80 Z"
            fill="rgba(56, 189, 248, 0.4)"
          />
          <path
            d="M0,45 C350,15 650,55 950,25 C1220,-5 1350,30 1440,15 L1440,80 L0,80 Z"
            fill="rgba(255, 255, 255, 0.2)"
          />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* SISI KIRI: Tombol Garis 3 (Mobile) & Logo Mariners SC (Tanpa Teks, Sedikit Diperbesar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Garis 3 Mobile di Sebelah Kiri Logo */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 -ml-1 text-white hover:text-blue-200 active:scale-95 transition-all focus:outline-hidden cursor-pointer rounded-lg hover:bg-white/10 flex items-center justify-center"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo Saja (Teks Dihapus, Logo Diperbesar Lebih Lanjut) */}
            <Link href="/" className="flex items-center group py-0.5" title={`${teamName || "TEAM"} - Beranda`}>
              <img
                src={teamLogo || "/defaultteam.webp"}
                alt={`${teamName || "TEAM"} Logo`}
                className="h-12 sm:h-16 md:h-[68px] w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              />
            </Link>
          </div>

          {/* SISI TENGAH: Desktop Navigation Links (Underlined style seperti footer) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            {activeNavLinks.map((link) => {
              const isActive = pathname === link.href.split('?')[0];
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3 py-1.5 text-xs lg:text-sm font-bold transition-all duration-200 border-b-2 ${
                    isActive
                      ? clubMode === 'community'
                        ? 'text-amber-300 border-amber-400 font-extrabold'
                        : 'text-white border-white font-extrabold'
                      : 'text-blue-100/90 border-transparent hover:text-white hover:border-white/60'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* SISI KANAN: JOIN WITH US / FOTO MEMBER (Box Ujung Melingkar / rounded-full) */}
          {/* Sembunyikan jika community dinonaktifkan atau di halaman portal community (/community) */}
          {isCommunityEnabled !== false && !isCommunityPortal && (
            <div className="flex items-center gap-2 sm:gap-3">
              {currentMember ? (
                /* Sudah Menjadi Member: Tampilkan Foto Member dengan Box Ujung Melingkar & Outline Putih */
                <Link
                  href="/community"
                  className="flex items-center gap-2 p-1 sm:pr-3.5 rounded-full bg-transparent hover:bg-white/10 border border-white text-white shadow-xs transition-all active:scale-95 group"
                  title={`Portal Community - ${currentMember.fullName}`}
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-white shrink-0 bg-white/20 flex items-center justify-center">
                    {currentMember.photoUrl ? (
                      <img
                        src={currentMember.photoUrl}
                        alt={currentMember.fullName}
                        className="w-full h-full object-cover object-top scale-[1.25] origin-top"
                      />
                    ) : (
                      <span className="text-xs font-black text-white uppercase font-mono">
                        {(currentMember.nickname || currentMember.fullName).slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-tight pr-1">
                    <span className="text-[11px] font-black text-white transition-colors truncate max-w-[110px]">
                      {currentMember.nickname || currentMember.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[8px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {currentMember.tier || 'MEMBER'}
                    </span>
                  </div>
                </Link>
              ) : (
                /* Belum Menjadi Member: JOIN WITH US Outline Putih Tanpa Latar (Box Ujung Melingkar) */
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center px-4 sm:px-5 py-1.5 sm:py-2 rounded-full font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all duration-200 bg-transparent hover:bg-white/10 active:scale-95 border border-white text-white cursor-pointer shadow-xs"
                  title="Gabung Soccer Community"
                >
                  <span>JOIN WITH US</span>
                </Link>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Mobile Nav Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="relative z-20 md:hidden bg-[#003893] border-b border-blue-900 px-4 pt-3 pb-6 space-y-1 animate-fadeIn shadow-2xl">
          {/* Links */}
          <div className="space-y-1">
            {activeNavLinks.map((link) => {
              const isActive = pathname === link.href.split('?')[0];
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-b ${
                    isActive
                      ? clubMode === 'community'
                        ? 'text-amber-300 bg-white/15 border-amber-400 font-extrabold'
                        : 'text-white bg-white/15 border-white font-extrabold'
                      : 'text-blue-100 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/40'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
