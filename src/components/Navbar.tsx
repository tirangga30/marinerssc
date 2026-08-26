'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield, Calendar, Users, Newspaper, BarChart3, Menu, X,
  LayoutDashboard, ExternalLink, LogOut, Sparkles, Trophy,
  Award, UserCheck, Flame
} from 'lucide-react';
import { useClubMode } from '@/context/ClubModeContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clubMode, setClubMode } = useClubMode();

  const isAdminRoute = pathname.startsWith('/admin');

  // Tim Utama Nav Links
  const mainNavLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal & Hasil', href: '/matches', icon: Calendar },
    { name: 'Pemain', href: '/players', icon: Users },
    { name: 'Berita', href: '/articles', icon: Newspaper },
    { name: 'Statistik', href: '/stats', icon: BarChart3 },
  ];

  // Soccer Community Nav Links
  const communityNavLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal Fun Match', href: '/community/matches', icon: Calendar },
    { name: 'Squad Member', href: '/community/players', icon: Users },
    { name: 'Statistik Member', href: '/community/stats', icon: BarChart3 },
    { name: 'Portal Member', href: '/community', icon: Sparkles },
  ];

  const adminNavLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Kelola Pemain', href: '/admin/players', icon: Users },
    { name: 'Kelola Laga', href: '/admin/matches', icon: Calendar },
    { name: 'Kelola Member', href: '/admin/members', icon: Sparkles },
    { name: 'Kelola Berita', href: '/admin/articles', icon: Newspaper },
  ];

  // Active public nav links based on clubMode
  const activeNavLinks = clubMode === 'community' ? communityNavLinks : mainNavLinks;

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
      <header className="sticky top-0 z-50 glass-panel border-b border-sky-400/30 backdrop-blur-md bg-slate-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo Admin */}
            <Link href="/admin/dashboard" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src="/marinerssc.png"
                alt="Mariners SC Logo"
                className="h-8 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
              />
              <div>
                <span className="text-base sm:text-xl font-black tracking-wider uppercase blue-gradient-text block leading-none">
                  MARINERS SC
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-sky-400 font-extrabold block mt-0.5">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/40 text-white border border-sky-400/50 shadow-sm shadow-blue-500/20'
                        : 'text-slate-300 hover:text-sky-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Buttons */}
            {pathname === '/admin/dashboard' && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold uppercase transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lihat Web Publik
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar
                  </button>
                </form>
              </div>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Admin Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-sky-400/20 bg-slate-950/95 px-4 pt-2 pb-6 space-y-2">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold ${
                    isActive
                      ? 'bg-blue-600/40 text-white border border-sky-400/50'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 text-sky-400" />
                  {link.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    );
  }

  // ═════════════════════════════════════════════════════════════
  // PUBLIC NAVBAR VIEW (DYNAMIC TIM UTAMA VS SOCCER COMMUNITY)
  // ═════════════════════════════════════════════════════════════
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-sky-400/30 backdrop-blur-md bg-slate-950/90">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Dynamic Brand Title */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <img
              src="/marinerssc.png"
              alt="Mariners SC Logo"
              className="h-8 sm:h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
            <div>
              <span className="text-base sm:text-xl font-black tracking-wider uppercase blue-gradient-text block leading-none">
                MARINERS SC
              </span>
              <span className={`text-[8px] sm:text-[9px] tracking-widest uppercase font-extrabold block mt-0.5 ${
                clubMode === 'community' ? 'text-amber-400' : 'text-sky-400'
              }`}>
                {clubMode === 'community' ? 'SOCCER COMMUNITY' : 'OFFICIAL CLUB'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {activeNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? clubMode === 'community'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'bg-blue-600/40 text-white border border-sky-400/50 shadow-sm shadow-blue-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    isActive
                      ? clubMode === 'community' ? 'text-amber-400' : 'text-sky-400'
                      : 'text-slate-400'
                  }`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mode Switcher Pill on Navbar */}
          <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => toggleClubMode('main')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                clubMode === 'main'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3 h-3" /> Tim Utama
            </button>
            <button
              onClick={() => toggleClubMode('community')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 ${
                clubMode === 'community'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" /> Community
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-sky-400/20 bg-slate-950/95 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          {/* Mobile Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => toggleClubMode('main')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                clubMode === 'main'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Skuad Utama
            </button>
            <button
              onClick={() => toggleClubMode('community')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                clubMode === 'community'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Soccer Community
            </button>
          </div>

          {/* Links */}
          <div className="space-y-1">
            {activeNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? clubMode === 'community'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-600/40 text-white border border-sky-400/50'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    clubMode === 'community' ? 'text-amber-400' : 'text-sky-400'
                  }`} />
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
