'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Calendar, Users, Newspaper, BarChart3, Lock, Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Beranda', href: '/', icon: Shield },
    { name: 'Jadwal & Hasil', href: '/matches', icon: Calendar },
    { name: 'Skuad Tim', href: '/players', icon: Users },
    { name: 'Berita', href: '/articles', icon: Newspaper },
    { name: 'Statistik', href: '/stats', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-blue-500/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-sky-400 shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform duration-300 border border-white/20">
              <Shield className="w-7 h-7 text-white fill-sky-200" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider uppercase blue-gradient-text block leading-none">
                MARINERS FC
              </span>
              <span className="text-[10px] tracking-widest uppercase text-sky-200/80 font-semibold block mt-1">
                Website Resmi Klub
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
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

          {/* Admin Login CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="flex items-center gap-2 px-4 py-2 text-xs font-extrabold uppercase tracking-wider white-blue-btn rounded-lg"
            >
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Portal Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-200 hover:text-sky-300 hover:bg-slate-800/60 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-blue-500/20 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-bold ${
                  isActive
                    ? 'bg-blue-600/30 text-sky-300 border border-sky-400/40'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-sky-300'
                }`}
              >
                <Icon className="w-5 h-5 text-sky-400" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-extrabold uppercase tracking-wider white-blue-btn rounded-lg"
            >
              <Lock className="w-4 h-4 text-blue-600" />
              Portal Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
