import React from 'react';
import Link from 'next/link';
import { Trophy, MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-panel border-t border-blue-500/20 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col - NO BOX around logo */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <img
                src="/marinerssc.png"
                alt="Mariners SC Logo"
                className="h-10 w-auto object-contain drop-shadow-md"
              />
              <span className="text-xl font-black uppercase tracking-wider blue-gradient-text">
                MARINERS SC
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Klub Sepak Bola Profesional kebanggaan Samudra. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-sky-400/30 pb-2 inline-block">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-sky-300 transition-colors">Beranda Utama</Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-sky-300 transition-colors">Jadwal & Hasil Pertandingan</Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-sky-300 transition-colors">Skuad Tim Utama</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-sky-300 transition-colors">Kabar & Artikel Berita</Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-sky-300 transition-colors">Statistik Tim & Pemain</Link>
              </li>
            </ul>
          </div>

          {/* Stadion & Home base */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-sky-400/30 pb-2 inline-block">
              Stadion Utama
            </h4>
            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Stadion Gelora Samudra, Jln. Samudra Raya No. 19, Jakarta</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>contact@marinerssc.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>+62 (021) 555-MARINERS</span>
              </div>
            </div>
          </div>

          {/* Sponsor & Badge */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-sky-400/30 pb-2 inline-block">
              Kejuaraan
            </h4>
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-center space-y-2">
              <Trophy className="w-8 h-8 text-sky-400 mx-auto animate-bounce" />
              <p className="text-xs font-black text-white uppercase">Juara BRI Liga 1</p>
              <p className="text-[11px] text-sky-300 font-semibold">Musim 2024/2025</p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Mariners Soccer Club. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            Built for Mariners SC Fans with <Heart className="w-3.5 h-3.5 text-blue-500 fill-blue-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
