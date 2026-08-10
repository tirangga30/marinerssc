import React from 'react';
import Link from 'next/link';
import { Shield, Trophy, MapPin, Mail, Phone, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-panel border-t border-slate-800 text-slate-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20">
                <Shield className="w-6 h-6 text-slate-950 fill-amber-300" />
              </div>
              <span className="text-xl font-black uppercase tracking-wider gold-gradient-text">
                MARINERS FC
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Klub Sepak Bola Profesional kebanggaan Samudra. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-4 border-b border-amber-500/30 pb-2 inline-block">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-400 transition-colors">Beranda Utama</Link>
              </li>
              <li>
                <Link href="/matches" className="hover:text-amber-400 transition-colors">Jadwal & Hasil Pertandingan</Link>
              </li>
              <li>
                <Link href="/players" className="hover:text-amber-400 transition-colors">Skuad Tim Utama</Link>
              </li>
              <li>
                <Link href="/articles" className="hover:text-amber-400 transition-colors">Kabar & Artikel Berita</Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-amber-400 transition-colors">Statistik Tim & Pemain</Link>
              </li>
            </ul>
          </div>

          {/* Stadion & Home base */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-4 border-b border-amber-500/30 pb-2 inline-block">
              Stadion Utama
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Stadion Gelora Samudra, Jln. Samudra Raya No. 19, Jakarta</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span>contact@marinersfc.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>+62 (021) 555-MARINERS</span>
              </div>
            </div>
          </div>

          {/* Sponsor & Badge */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-200 mb-4 border-b border-amber-500/30 pb-2 inline-block">
              Kejuaraan
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Trophy className="w-8 h-8 text-amber-400 mx-auto animate-bounce" />
              <p className="text-xs font-bold text-slate-200 uppercase">Juara BRI Liga 1</p>
              <p className="text-[11px] text-amber-400/90 font-semibold">Musim 2024/2025</p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Mariners Football Club. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            Built for Mariners FC Fans with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </p>
        </div>
      </div>
    </footer>
  );
}
