'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';

interface MemberDurationCountdownProps {
  expiresAt?: string | Date | null;
  joinedAt?: string | Date | null;
  isPermanent?: boolean;
  compact?: boolean;
}

export default function MemberDurationCountdown({
  expiresAt,
  joinedAt,
  isPermanent = false,
  compact = false,
}: MemberDurationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  useEffect(() => {
    if (isPermanent || !expiresAt) return;

    const targetDate = new Date(expiresAt).getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, isPermanent]);

  const formattedJoinedAt = joinedAt
    ? new Date(joinedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const formattedExpiresAt = expiresAt
    ? new Date(expiresAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  if (isPermanent) {
    return (
      <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-extrabold uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Masa Aktif: Permanen (Lifetime)</span>
        </div>
        {formattedJoinedAt && (
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">Tanggal Gabung:</span>
            <strong className="text-slate-300">{formattedJoinedAt}</strong>
          </div>
        )}
      </div>
    );
  }

  if (!expiresAt) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-slate-300 text-[10px] font-bold">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Masa Aktif: Reguler</span>
        </div>
        {formattedJoinedAt && (
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
            <span className="text-slate-500">Tanggal Gabung:</span>
            <strong className="text-slate-300">{formattedJoinedAt}</strong>
          </div>
        )}
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="text-[10px] text-slate-500 font-mono">
        Menghitung masa aktif...
      </div>
    );
  }

  if (timeLeft.isExpired) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-red-500/40 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-red-400 text-[10px] font-extrabold uppercase animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Masa Aktif Telah Berakhir (Expired)</span>
        </div>
        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
          <span className="text-slate-500">Gabung: <strong className="text-slate-300">{formattedJoinedAt || '-'}</strong></span>
          <span className="text-slate-500">s.d <strong className="text-red-400">{formattedExpiresAt || '-'}</strong></span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-sky-300">
        <Clock className="w-3 h-3 text-sky-400" />
        <span>{timeLeft.days}h {timeLeft.hours}j {timeLeft.minutes}m</span>
      </div>
    );
  }

  return (
    <div className="p-2.5 sm:p-3 rounded-xl bg-slate-950/90 border border-sky-400/30 space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1 text-sky-300">
          <Clock className="w-3 h-3 text-sky-400 animate-spin" />
          <span>Sisa Masa Aktif Membership:</span>
        </span>
        <span className="text-emerald-400">Aktif</span>
      </div>

      {/* 4 Box Countdown Hari Jam Menit Detik */}
      <div className="grid grid-cols-4 gap-1.5 text-center font-mono font-black">
        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
          <span className="block text-sm sm:text-base text-white">{timeLeft.days}</span>
          <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Hari</span>
        </div>
        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
          <span className="block text-sm sm:text-base text-white">{timeLeft.hours}</span>
          <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Jam</span>
        </div>
        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
          <span className="block text-sm sm:text-base text-white">{timeLeft.minutes}</span>
          <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Menit</span>
        </div>
        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
          <span className="block text-sm sm:text-base text-sky-400">{timeLeft.seconds}</span>
          <span className="block text-[8px] font-sans font-bold text-slate-400 uppercase">Detik</span>
        </div>
      </div>

      {/* Tanggal Gabung dan s.d */}
      <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/80 font-medium">
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-slate-500">Gabung:</span>
          <strong className="text-slate-300">{formattedJoinedAt || '-'}</strong>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-slate-500">s.d</span>
          <strong className="text-amber-300">{formattedExpiresAt || 'Selamanya'}</strong>
        </div>
      </div>
    </div>
  );
}
