'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Calendar, Users, Newspaper, BarChart3, Menu, X, LayoutDashboard, ExternalLink, LogOut } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin');

  const publicNavLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal & Hasil', href: '/matches', icon: Calendar },
    { name: 'Pemain', href: '/players', icon: Users },
    { name: 'Berita', href: '/articles', icon: Newspaper },
    { name: 'Statistik', href: '/stats', icon: BarChart3 },
  ];

  const adminNavLinks = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Kelola Pemain', href: '/admin/players', icon: Users },
    { name: 'Kelola Laga', href: '/admin/matches', icon: Calendar },
    { name: 'Kelola Berita', href: '/admin/articles', icon: Newspaper },
  ];

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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold uppercase transition-colors"
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
                className="p-1.5 rounded-lg text-slate-200 hover:text-sky-300 hover:bg-slate-800/60 focus:outline-none"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Dropdown for Admin */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-t border-sky-400/20 px-3 pt-2 pb-4 space-y-1">
            {adminNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold ${
                    isActive
                      ? 'bg-blue-600/40 text-white border border-sky-400/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-sky-300'
                  }`}
                >
                  <Icon className="w-4 h-4 text-sky-400" />
                  {link.name}
                </Link>
              );
            })}
            {pathname === '/admin/dashboard' && (
              <div className="pt-2 flex items-center gap-2">
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-sky-300 text-xs font-bold uppercase border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Web Publik
                </Link>
                <form action="/api/auth/logout" method="POST" className="flex-1">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold uppercase border border-red-500/30"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Keluar
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </header>
    );
  }

  // PUBLIC NAVBAR VIEW
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-blue-500/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand - NO BOX around logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <img
              src="/marinerssc.png"
              alt="Mariners SC Logo"
              className="h-9 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-md"
            />
            <div>
              <span className="text-lg sm:text-2xl font-black tracking-wider uppercase blue-gradient-text block leading-none">
                MARINERS SC
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-sky-200/80 font-semibold block mt-0.5 sm:mt-1">
                Official Soccer Club
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {publicNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40 shadow-sm shadow-blue-500/20'
                      : 'text-slate-200 hover:text-sky-300 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-200 hover:text-sky-300 hover:bg-slate-800/60 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-blue-500/20 px-3 pt-2 pb-4 space-y-1">
          {publicNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold ${
                  isActive
                    ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-sky-300'
                }`}
              >
                <Icon className="w-4 h-4 text-sky-400" />
                {link.name}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
