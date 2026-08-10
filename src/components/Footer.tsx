import React from 'react';
import Link from 'next/link';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="glass-panel border-t border-blue-500/20 text-slate-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand Col */}
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
              Klub Sepak Bola Profesional. Berkomitmen menjunjung tinggi keunggulan, sportivitas, dan meraih kejayaan di setiap kompetisi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-sky-400/30 pb-2 inline-block">
              Navigasi
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/" className="hover:text-sky-300 transition-colors">Beranda Utama</Link></li>
              <li><Link href="/matches" className="hover:text-sky-300 transition-colors">Jadwal &amp; Hasil Pertandingan</Link></li>
              <li><Link href="/players" className="hover:text-sky-300 transition-colors">Skuad Tim Utama</Link></li>
              <li><Link href="/articles" className="hover:text-sky-300 transition-colors">Kabar &amp; Artikel Berita</Link></li>
              <li><Link href="/stats" className="hover:text-sky-300 transition-colors">Statistik Tim &amp; Pemain</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-white mb-4 border-b border-sky-400/30 pb-2 inline-block">
              Kontak
            </h4>
            <div className="space-y-3 text-xs font-medium">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Rajapolah</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <span>tiranggakamalbaskara@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                <span>+62 852 2333 7028</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>© 2026 Mariners Soccer Club. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
