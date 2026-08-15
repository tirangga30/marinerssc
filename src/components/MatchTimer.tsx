'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface MatchTimerProps {
  targetDate: string | Date;
  status: string;
  duration?: number;
  isLiveEnabled?: boolean;
}

export default function MatchTimer({ targetDate, status, duration = 90, isLiveEnabled = true }: MatchTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
    isLive: boolean;
    elapsedMinute: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, isLive: false, elapsedMinute: 0 });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calculateTimeLeft = () => {
      const start = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const durationMs = (duration || 90) * 60 * 1000;
      const end = start + durationMs;

      if (now >= end) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, isLive: false, elapsedMinute: duration });
        return;
      }

      const isLive = now >= start && now < end;
      // If live, we show 00:00:00:00. Otherwise, count down to start time.
      const difference = isLive ? 0 : Math.max(0, start - now);

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isPast: false,
        isLive,
        elapsedMinute: isLive ? Math.min(duration, Math.floor((now - start) / 60000) + 1) : 0,
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDate, duration]);

  if (!mounted) {
    return null;
  }

  if (status === 'finished' || timeLeft.isPast) {
    return (
      <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Pertandingan Selesai (Full Time)
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/80 text-center">
      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
        {/* Days */}
        <div className="flex flex-col items-center">
          <div className="w-12 sm:w-20 h-10 sm:h-16 rounded-xl bg-slate-900/90 border border-sky-400/30 flex items-center justify-center shadow-inner">
            <span className="text-base sm:text-3xl font-black font-mono text-white">
              {String(timeLeft.days).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 mt-1">Hari</span>
        </div>

        <span className="text-sky-400 font-bold text-base sm:text-3xl mb-3 sm:mb-4">:</span>

        {/* Hours */}
        <div className="flex flex-col items-center">
          <div className="w-12 sm:w-20 h-10 sm:h-16 rounded-xl bg-slate-900/90 border border-sky-400/30 flex items-center justify-center shadow-inner">
            <span className="text-base sm:text-3xl font-black font-mono text-white">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 mt-1">Jam</span>
        </div>

        <span className="text-sky-400 font-bold text-base sm:text-3xl mb-3 sm:mb-4">:</span>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <div className="w-12 sm:w-20 h-10 sm:h-16 rounded-xl bg-slate-900/90 border border-sky-400/30 flex items-center justify-center shadow-inner">
            <span className="text-base sm:text-3xl font-black font-mono text-white">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 mt-1">Menit</span>
        </div>

        <span className="text-sky-400 font-bold text-base sm:text-3xl mb-3 sm:mb-4">:</span>

        {/* Seconds */}
        <div className="flex flex-col items-center">
          <div className="w-12 sm:w-20 h-10 sm:h-16 rounded-xl bg-slate-900/90 border border-sky-400/30 flex items-center justify-center shadow-inner">
            <span className="text-base sm:text-3xl font-black font-mono blue-gradient-text">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold uppercase text-slate-400 mt-1">Detik</span>
        </div>
      </div>
    </div>
  );
}
