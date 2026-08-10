'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Trophy, Users, Calendar, Newspaper, BarChart3, Lock, Menu, X } from 'lucide-react';

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
    <header className="sticky top-0 z-50 glass-panel border-b border-amber-500/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
              <Shield className="w-7 h-7 text-slate-950 fill-amber-300" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-wider uppercase gold-gradient-text block leading-none">
                MARINERS FC
              </span>
              <span className="text-[10px] tracking-widest uppercase text-slate-400 font-semibold block mt-1">
                Official Club Website
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Admin Login CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/admin/login"
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-950 gold-gradient-bg rounded-lg shadow-md shadow-amber-500/20 hover:brightness-110 hover:scale-105 transition-all duration-200"
            >
              <Lock className="w-3.5 h-3.5" />
              Portal Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-800 px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-semibold ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-amber-400'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-400" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-950 gold-gradient-bg rounded-lg shadow-md"
            >
              <Lock className="w-4 h-4" />
              Portal Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
