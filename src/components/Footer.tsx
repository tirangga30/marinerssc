"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Mail, Phone } from 'lucide-react';
import { useSystemSetting } from '@/context/SystemSettingContext';

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { teamName, teamLogo, clubType } = useSystemSetting();
  const displayTeamName = teamName || 'TEAM';
  const displayTeamLogo = teamLogo || '/defaultteam.webp';

  return (
    <footer className="relative w-full mt-auto overflow-hidden">
      {/* ── TOP ORGANIC WAVE SVG (TRANSISI DARI PUTIH KE BIRU ROYAL MARINERS) ── */}
      <div className="w-full overflow-hidden leading-none select-none pointer-events-none">
        <svg
          className={`relative block w-full -mb-1 ${
            isHome ? 'h-12 sm:h-20 lg:h-28' : 'h-6 sm:h-10 md:h-12'
          }`}
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="footer-wave-main" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#004bb8" />
              <stop offset="50%" stopColor="#003d99" />
              <stop offset="100%" stopColor="#002d73" />
            </linearGradient>
            <linearGradient id="footer-wave-secondary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.75" />
            </linearGradient>
          </defs>

          {/* Layer 2: Subtle translucent accent wave on upper right */}
          <path
            d="M0,70 C300,95 550,40 850,55 C1150,70 1320,15 1440,5 L1440,120 L0,120 Z"
            fill="url(#footer-wave-secondary)"
          />

          {/* Layer 1: Main organic deep royal blue wave */}
          <path
            d="M0,50 C320,85 580,25 880,45 C1140,65 1300,20 1440,35 L1440,120 L0,120 Z"
            fill="url(#footer-wave-main)"
          />
        </svg>
      </div>

      {/* ── FOOTER BODY (DEEP ROYAL BLUE GRADIENT) ── */}
      <div className="bg-gradient-to-b from-[#004bb8] via-[#003893] to-[#002266] text-white">
        
        {/* ═══════════════════════════════════════════════════════════
            MODE BERANDA (isHome): INFORMASI LENGKAP LALU BAR BAWAH
           ═══════════════════════════════════════════════════════════ */}
        {isHome ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pt-2 sm:pt-4 pb-8 sm:pb-10 border-b border-white/15">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Brand & Mission Col */}
                <div className="space-y-4 md:col-span-1">
                  <div className="flex items-center gap-3">
                    <img
                      src={displayTeamLogo}
                      alt={`${displayTeamName} Logo`}
                      className="h-11 w-auto object-contain drop-shadow-md"
                    />
                    <div>
                      <span className="text-xl font-black uppercase tracking-wider text-white block leading-none">
                        {displayTeamName.toUpperCase()}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-blue-200 block mt-0.5">
                        {clubType || 'SOCCER CLUB'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-100/90 leading-relaxed">
                    Klub Sepak Bola Profesional. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.
                  </p>

                  {/* Developer Partners - Desktop Only */}
                  <div className="pt-3 hidden md:block">
                    <div className="flex items-center gap-3">
                      <img src={displayTeamLogo} alt={displayTeamName} className="h-6 w-auto object-contain drop-shadow" />
                      <span className="text-white/40">|</span>
                      <img src="/NYCOMPLOGO.png" alt="NY Company" className="h-6 w-auto object-contain drop-shadow" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-300 mt-2">
                      Official Developer Partners
                    </p>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b-2 border-sky-400 pb-2 inline-block">
                    Navigasi
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-blue-100/90">
                    <li><Link href="/" className="hover:text-white hover:underline transition-all">Beranda Utama</Link></li>
                    <li><Link href="/matches" className="hover:text-white hover:underline transition-all">Jadwal &amp; Hasil Pertandingan</Link></li>
                    <li><Link href="/players" className="hover:text-white hover:underline transition-all">Skuad Tim Utama</Link></li>
                    <li><Link href="/articles" className="hover:text-white hover:underline transition-all">Kabar &amp; Artikel Berita</Link></li>
                    <li><Link href="/stats" className="hover:text-white hover:underline transition-all">Statistik Tim &amp; Pemain</Link></li>
                    <li><Link href="/community" className="hover:text-white hover:underline transition-all">Soccer Community</Link></li>
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b-2 border-sky-400 pb-2 inline-block">
                    Kontak
                  </h4>
                  <div className="space-y-3 text-xs font-medium text-blue-100/90">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-sky-300 shrink-0 mt-0.5" />
                      <span>Rajapolah</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-sky-300 shrink-0" />
                      <span>tiranggakamalbaskara@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-sky-300 shrink-0" />
                      <span>+62 852 2333 7028</span>
                    </div>

                    {/* Developer Partners - Mobile Only */}
                    <div className="pt-3 md:hidden">
                      <div className="flex items-center gap-3">
                        <img src={displayTeamLogo} alt={displayTeamName} className="h-6 w-auto object-contain drop-shadow" />
                        <span className="text-white/40">|</span>
                        <img src="/NYCOMPLOGO.png" alt="NY Company" className="h-6 w-auto object-contain drop-shadow" />
                      </div>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-sky-300 mt-2">
                        Official Developer Partners
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Bar di Beranda: Hanya Sosmed & Copyright (tanpa duplikasi Logo & Navigasi) */}
            <div className="py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Social Media Buttons */}
              <div className="flex items-center gap-2.5">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                >
                  <i className="fa-brands fa-instagram text-sm" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                >
                  <i className="fa-brands fa-facebook-f text-sm" />
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                >
                  <i className="fa-brands fa-x-twitter text-sm" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-sm"
                >
                  <i className="fa-brands fa-youtube text-sm" />
                </a>
              </div>

              {/* Copyright & Versi Aplikasi */}
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-right">
                <span className="text-[10px] sm:text-xs text-blue-200/90 font-medium">
                  v 2.0.0
                </span>
                <span className="hidden sm:inline text-blue-300/40">|</span>
                <p className="text-[11px] sm:text-xs text-blue-200/90 font-medium tracking-wide">
                  NY Company © 2026 All rights reserved.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════
             MODE SELAIN BERANDA: UKURAN DIPAKSAKAN PERSIS GAMBAR CONTOH
             (Sleek, Horisontal 2 Sisi, Proporsi Banner Ramping 4:1)
             ═══════════════════════════════════════════════════════════ */
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-3 sm:pb-5 pt-0.5">
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-6">
              
              {/* Sisi Kiri: Logo + Title di atas, 4 Icon Sosmed di bawahnya */}
              <div className="flex flex-col items-start gap-1 sm:gap-2 shrink-0">
                <Link href="/" className="flex items-center gap-1.5 sm:gap-3 group">
                  <img
                    src={displayTeamLogo}
                    alt={`${displayTeamName} Logo`}
                    className="h-7 sm:h-10 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="leading-tight">
                    <span className="text-[11px] sm:text-base font-black uppercase tracking-wider text-white block">
                      {displayTeamName.toUpperCase()}
                    </span>
                    <span className="text-[6px] sm:text-[8px] uppercase tracking-[0.25em] font-extrabold text-blue-200 block">
                      {clubType || 'SOCCER CLUB'}
                    </span>
                  </div>
                </Link>

                {/* 4 Social Icons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xs"
                  >
                    <i className="fa-brands fa-instagram text-[8.5px] sm:text-xs" />
                  </a>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xs"
                  >
                    <i className="fa-brands fa-facebook-f text-[8.5px] sm:text-xs" />
                  </a>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="X"
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xs"
                  >
                    <i className="fa-brands fa-x-twitter text-[8.5px] sm:text-xs" />
                  </a>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-xs border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-2xs"
                  >
                    <i className="fa-brands fa-youtube text-[8.5px] sm:text-xs" />
                  </a>
                </div>
              </div>

              {/* Sisi Kanan: Nav Links bergaris bawah di atas, Copyright di bawahnya */}
              <div className="flex flex-col items-end gap-1 sm:gap-2 text-right">
                <div className="flex items-center gap-1.5 sm:gap-4 md:gap-6">
                  <Link
                    href="/"
                    className="text-[8px] sm:text-xs md:text-sm font-bold text-white hover:text-sky-200 border-b border-white/60 hover:border-white pb-0.5 transition-all whitespace-nowrap"
                  >
                    Beranda
                  </Link>
                  <Link
                    href="/players"
                    className="text-[8px] sm:text-xs md:text-sm font-bold text-white hover:text-sky-200 border-b border-white/60 hover:border-white pb-0.5 transition-all whitespace-nowrap"
                  >
                    Tim
                  </Link>
                  <Link
                    href="/matches"
                    className="text-[8px] sm:text-xs md:text-sm font-bold text-white hover:text-sky-200 border-b border-white/60 hover:border-white pb-0.5 transition-all whitespace-nowrap"
                  >
                    Pertandingan
                  </Link>
                  <Link
                    href="/articles"
                    className="text-[8px] sm:text-xs md:text-sm font-bold text-white hover:text-sky-200 border-b border-white/60 hover:border-white pb-0.5 transition-all whitespace-nowrap"
                  >
                    Artikel
                  </Link>
                  <Link
                    href="/stats"
                    className="text-[8px] sm:text-xs md:text-sm font-bold text-white hover:text-sky-200 border-b border-white/60 hover:border-white pb-0.5 transition-all whitespace-nowrap"
                  >
                    Statistik
                  </Link>
                </div>

                <p className="text-[7.5px] sm:text-[10px] md:text-xs text-blue-200/90 font-medium tracking-wide whitespace-nowrap">
                  NY Company © 2026 All rights reserved.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </footer>
  );
}
