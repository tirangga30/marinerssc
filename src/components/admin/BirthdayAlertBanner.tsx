'use client';

import React, { useState } from 'react';
import { Cake, Share2, Copy, Check, Sparkles } from 'lucide-react';

interface BirthdayPlayer {
  id: string;
  name: string;
  number: number;
  position?: string;
  birthDate: string | Date;
  photoUrl?: string;
  phone?: string | null;
}

interface BirthdayAlertBannerProps {
  birthdayPlayers: BirthdayPlayer[];
  upcomingPlayers?: Array<BirthdayPlayer & { daysUntil: number; formattedDate: string }>;
  teamName: string;
}

export default function BirthdayAlertBanner({
  birthdayPlayers,
  upcomingPlayers = [],
  teamName,
}: BirthdayAlertBannerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (birthdayPlayers.length === 0 && upcomingPlayers.length === 0) {
    return null;
  }

  const calculateAge = (birthDate: string | Date) => {
    const b = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) {
      age--;
    }
    return age > 0 ? age : '';
  };

  const getBirthdayMessage = (p: BirthdayPlayer) => {
    const age = calculateAge(p.birthDate);
    const ageText = age ? `Genap berusia ${age} tahun! 🥳🔥` : `merayakan hari ulang tahunnya! 🥳🔥`;
    const club = teamName || 'MARS';

    return `🎂 HBD *${p.name}* 🎉⚽\n\nHari ini, ${p.name} ${ageText}\n\nSemoga panjang umur, sehat selalu, murah rezeki, makin gacor di lapangan, dan terus membawa kemenangan bagi tim! \n\nYuk beri ucapan dan doa terbaik buat ${p.name} di grup ini! 👏🎂\n\n*${club}*`;
  };

  const handleCopy = (p: BirthdayPlayer) => {
    const text = getBirthdayMessage(p);
    navigator.clipboard.writeText(text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-3">
      {/* ── Hari Ini Ulang Tahun ── */}
      {birthdayPlayers.map((p) => {
        const age = calculateAge(p.birthDate);
        const waText = encodeURIComponent(getBirthdayMessage(p));
        const waUrl = `https://api.whatsapp.com/send?text=${waText}`;

        return (
          <div
            key={p.id}
            className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-blue-500/10 shadow-md backdrop-blur-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border-2 border-amber-400 shadow-sm">
                    <img
                      src={p.photoUrl || '/playertemplate.webp'}
                      alt={p.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                    🎂
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Ulang Tahun Hari Ini!
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>{p.name}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                      #{p.number}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-600 font-medium">
                    {p.position && <span className="uppercase font-bold text-slate-700">{p.position} · </span>}
                    {age ? `Genap berusia ${age} tahun hari ini.` : 'Semoga semakin sukses dan berprestasi bersama tim!'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(p)}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  title="Salin ucapan untuk WhatsApp"
                >
                  {copiedId === p.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Teks</span>
                    </>
                  )}
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wide transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Kirim ke Grup WA</span>
                </a>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Pengingat Ulang Tahun Mendatang (Jika tidak ada yang ultah hari ini) ── */}
      {birthdayPlayers.length === 0 && upcomingPlayers.length > 0 && (
        <div className="rounded-xl px-4 py-2.5 bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Cake className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong>Ulang tahun terdekat:</strong>{' '}
              {upcomingPlayers.slice(0, 2).map((u, i) => (
                <span key={u.id}>
                  {i > 0 && ', '}
                  <strong>{u.name}</strong> (#{u.number}) pada {u.formattedDate} ({u.daysUntil === 1 ? 'Besok' : `${u.daysUntil} hari lagi`})
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

