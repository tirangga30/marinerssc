'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';

interface MatchShareButtonProps {
  match: {
    id: string;
    opponentName: string;
    opponentLogo?: string;
    matchDate: string | Date;
    competition?: string;
    stage?: string;
    venue?: string;
    isHome?: boolean;
    status?: string;
    homeScore?: number | null;
    awayScore?: number | null;
    events?: any[];
  };
  teamName?: string;
}

export default function MatchShareButton({ match, teamName = 'TEAM' }: MatchShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const homeTeam = match.isHome ? teamName : match.opponentName;
    const awayTeam = match.isHome ? match.opponentName : teamName;
    const hasScore =
      match.homeScore !== null &&
      match.awayScore !== null &&
      match.homeScore !== undefined &&
      match.awayScore !== undefined;
    const isFinished =
      match.status === 'finished' ||
      (Array.isArray(match.events) && match.events.some((ev: any) => ev.type === 'fulltime'));
    const isLive = match.status === 'live';

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/matches/${match.id}`;

    let title = '';
    let textLines: string[] = [];

    if (isFinished && hasScore) {
      title = `Hasil Pertandingan: ${homeTeam} ${match.homeScore} - ${match.awayScore} ${awayTeam}`;
      textLines = [
        `⚽ HASIL PERTANDINGAN`,
        `🔥 ${homeTeam.toUpperCase()} ${match.homeScore} - ${match.awayScore} ${awayTeam.toUpperCase()}`,
        `🏆 ${match.stage || match.competition || 'Friendly Match'}`,
        `📅 ${formatWibDate(match.matchDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
        `📍 ${match.venue || '—'}`,
        ``,
        `Lihat detail pertandingan dan statistik selengkapnya:`,
        shareUrl,
      ];
    } else if (isLive) {
      title = `LIVE: ${homeTeam} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${awayTeam}`;
      textLines = [
        `🔴 PERTANDINGAN SEDANG BERLANGSUNG`,
        `🔥 ${homeTeam.toUpperCase()} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${awayTeam.toUpperCase()}`,
        `🏆 ${match.stage || match.competition || 'Friendly Match'}`,
        `📅 ${formatWibDate(match.matchDate)}`,
        `📍 ${match.venue || '—'}`,
        ``,
        `Pantau jalannya pertandingan & live timeline:`,
        shareUrl,
      ];
    } else {
      title = `Jadwal Pertandingan: ${homeTeam} vs ${awayTeam}`;
      textLines = [
        `⚽ JADWAL PERTANDINGAN`,
        `🔥 ${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}`,
        `🏆 ${match.stage || match.competition || 'Friendly Match'}`,
        `📅 ${formatWibDate(match.matchDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
        `⏰ ${formatWibTime(match.matchDate)}`,
        `📍 ${match.venue || '—'}`,
        ``,
        `Lihat detail pertandingan dan susunan pemain:`,
        shareUrl,
      ];
    }

    const shareText = textLines.join('\n');

    // 1. Native Web Share API (ideal for mobile WhatsApp / social share)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // 2. Fallback: Copy to Clipboard
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (clipErr) {
      console.warn('Clipboard write failed:', clipErr);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Bagikan Pertandingan"
        title="Bagikan Pertandingan / Hasil Pertandingan"
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
          copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-600 scale-105'
            : 'bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border-slate-200 hover:border-blue-300 shadow-2xs'
        }`}
      >
        {copied ? (
          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 stroke-[2.5]" />
        ) : (
          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2]" />
        )}
      </button>

      {/* Floating Copied Badge */}
      {copied && (
        <div className="absolute right-0 -bottom-7 z-30 pointer-events-none animate-fadeIn">
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold whitespace-nowrap shadow-md">
            Disalin!
          </span>
        </div>
      )}
    </div>
  );
}

