'use client';

import React, { useState } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { generateLineupCanvas } from '@/lib/generateLineupCanvas';

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
  const [copyBadgeText, setCopyBadgeText] = useState('Disalin!');
  const [loading, setLoading] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

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
    let currentTab = '';
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      currentTab = sp.get('tab') || '';
    }
    const tabParam = currentTab ? `?tab=${currentTab}` : '';
    const shareUrl = `${origin}/matches/${match.id}${tabParam}`;

    let title = '';
    let textLines: string[] = [];

    const stageLabel = (match.stage || match.competition || '').trim();
    const stageHeader = stageLabel ? ` ${stageLabel}` : '';
    const dateStr = formatWibDate(match.matchDate, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = formatWibTime(match.matchDate);
    const venueStr = match.venue || 'Menyusul';

    if (currentTab === 'lineup') {
      title = `Susunan Pemain (Line Up): ${homeTeam} vs ${awayTeam}`;
      textLines = [
        `*SUSUNAN PEMAIN (LINE UP)*${stageHeader}`,
        hasScore && isFinished
          ? `*${homeTeam.toUpperCase()} ${match.homeScore} - ${match.awayScore} ${awayTeam.toUpperCase()}*`
          : `*${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr} (Kickoff ${timeStr} WIB)`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Cek susunan pemain (line up) dan formasi pertandingan di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    } else if (currentTab === 'squad') {
      title = `Daftar Skuad (Squad List): ${homeTeam} vs ${awayTeam}`;
      textLines = [
        `*DAFTAR SKUAD (SQUAD LIST)*${stageHeader}`,
        `*${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr} (Kickoff ${timeStr} WIB)`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Cek daftar pemain dan info skuad di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    } else if (currentTab === 'h2h') {
      title = `Head to Head (H2H): ${homeTeam} vs ${awayTeam}`;
      textLines = [
        `*HEAD TO HEAD (H2H)*${stageHeader}`,
        `*${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr} (Kickoff ${timeStr} WIB)`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Cek riwayat pertemuan kedua tim di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    } else if (isFinished && hasScore) {
      title = `Hasil Pertandingan: ${homeTeam} ${match.homeScore} - ${match.awayScore} ${awayTeam}`;
      textLines = [
        `*HASIL PERTANDINGAN*${stageHeader}`,
        `*${homeTeam.toUpperCase()} ${match.homeScore} - ${match.awayScore} ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr}`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Cek ringkasan gol, assist, statistik dan lainnya di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    } else if (isLive) {
      title = `LIVE: ${homeTeam} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${awayTeam}`;
      textLines = [
        `*PERTANDINGAN SEDANG BERLANGSUNG*${stageHeader}`,
        `*${homeTeam.toUpperCase()} ${match.homeScore ?? 0} - ${match.awayScore ?? 0} ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr}`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Pantau live score, jalannya pertandingan dan lainnya di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    } else {
      title = `Jadwal Pertandingan: ${homeTeam} vs ${awayTeam}`;
      textLines = [
        `*JADWAL PERTANDINGAN*${stageHeader}`,
        `*${homeTeam.toUpperCase()} VS ${awayTeam.toUpperCase()}*`,
        ``,
        `*Waktu*: ${dateStr} (Kickoff ${timeStr} WIB)`,
        `*Tempat*: ${venueStr}`,
        ``,
        `Cek info laga, susunan pemain dan lainnya di sini:`,
        shareUrl,
        ``,
        `*MARS*`,
      ];
    }

    const shareText = textLines.join('\n');
    const isLineupShare = currentTab === 'lineup';

    // Jika tab lineup (khusus sebelum atau saat melihat lineup), bagikan gambar langsung
    if (isLineupShare) {
      setLoading(true);
      try {
        let lineupsData = (match as any).lineups;
        let attendancesData = (match as any).attendances;
        let formationData = (match as any).formation || '4-3-3';

        // Jika belum ada lineups di prop, fetch JSON match data
        if (!lineupsData) {
          try {
            const jsonRes = await fetch(`/api/matches/${match.id}`);
            if (jsonRes.ok) {
              const fullMatch = await jsonRes.json();
              lineupsData = fullMatch.lineups || [];
              attendancesData = fullMatch.attendances || [];
              formationData = fullMatch.formation || formationData;
            }
          } catch {}
        }

        let blob: Blob | null = null;
        if (lineupsData && lineupsData.length > 0) {
          const isPlayerLoan = (p: any) => {
            if (!p) return false;
            if (p.isGuest) return true;
            if (p.playerType === 'LOAN' || p.playerType === 'GUEST') return true;
            if (typeof p.status === 'string' && p.status.toUpperCase() === 'LOAN') return true;
            const att = (attendancesData || []).find((a: any) => a.playerId === p.id || a.player?.id === p.id);
            if (att && (att.playerType === 'LOAN' || att.playerType === 'GUEST')) return true;
            return false;
          };

          const starters = (lineupsData || [])
            .filter((l: any) => l.isStarter && l.player)
            .map((s: any) => ({
              id: s.id,
              name: s.player.name,
              number: s.player.number,
              photoUrl: s.player.photoUrl,
              x: s.x != null && !isNaN(Number(s.x)) ? Number(s.x) : 50,
              y: s.y != null && !isNaN(Number(s.y)) ? Number(s.y) : 50,
              isStarter: true,
              isGuest: isPlayerLoan(s.player),
            }));

          const starterPlayerIds = new Set<string>();
          for (const s of (lineupsData || []).filter((l: any) => l.isStarter)) {
            if (s.player?.id) starterPlayerIds.add(s.player.id);
            if (s.playerId) starterPlayerIds.add(s.playerId);
            if (s.id) starterPlayerIds.add(s.id);
          }

          const benchMap = new Map<string, any>();
          for (const b of (lineupsData || []).filter((l: any) => !l.isStarter && l.player)) {
            const pId = b.player?.id || b.playerId;
            if (pId && !starterPlayerIds.has(pId) && !starterPlayerIds.has(b.id)) {
              benchMap.set(pId, {
                id: b.id,
                name: b.player.name,
                number: b.player.number,
                photoUrl: b.player.photoUrl,
                isStarter: false,
                isGuest: isPlayerLoan(b.player),
              });
            }
          }
          for (const att of attendancesData || []) {
            const pId = att.player?.id || att.playerId;
            if (att.status === 'CONFIRMED' && pId && !starterPlayerIds.has(pId) && !benchMap.has(pId)) {
              benchMap.set(pId, {
                id: att.id,
                name: att.player?.name || att.playerName || 'Pemain',
                number: att.player?.number ?? 0,
                photoUrl: att.player?.photoUrl || '',
                isStarter: false,
                isGuest: att.playerType === 'LOAN' || att.playerType === 'GUEST' || Boolean(att.player?.isGuest),
              });
            }
          }
          const bench = Array.from(benchMap.values());

          try {
            blob = await generateLineupCanvas({
              match: {
                id: match.id,
                competition: match.competition,
                stage: match.stage,
                matchDate: match.matchDate,
                venue: match.venue,
                isHome: match.isHome,
                opponentName: match.opponentName,
              },
              teamName,
              formation: formationData,
              starters,
              bench,
            });
          } catch (canvasErr) {
            console.warn('Canvas share fallback:', canvasErr);
          }
        }

        // Fallback ke server jika canvas tidak menghasilkan blob
        if (!blob) {
          const imgRes = await fetch(`/api/matches/${match.id}/lineup-image?v=${Date.now()}`);
          if (imgRes.ok) {
            blob = await imgRes.blob();
          }
        }

        if (blob) {
          const cleanTitle = `${homeTeam}-vs-${awayTeam}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const fileName = `lineup-${cleanTitle}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

          // Coba Web Share API dengan attachment file gambar
          if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title,
              text: shareText,
              files: [file],
            });
            setCopyBadgeText('Gambar Terbagikan!');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            return;
          }

          // Fallback di browser desktop / browser tanpa share file: download gambar otomatis
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
          setCopyBadgeText('Gambar Tersimpan!');
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.warn('Error sharing lineup image:', err);
      } finally {
        setLoading(false);
      }
    }

    // 1. Native Web Share API (ideal for mobile WhatsApp / social share)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
        setCopyBadgeText('Disalin!');
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
      setCopyBadgeText('Disalin!');
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
        disabled={loading}
        aria-label="Bagikan Pertandingan"
        title={loading ? 'Menyiapkan gambar...' : 'Bagikan Pertandingan / Hasil Pertandingan'}
        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
          copied
            ? 'bg-emerald-50 border-emerald-300 text-emerald-600 scale-105'
            : 'bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border-slate-200 hover:border-blue-300 shadow-2xs'
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 animate-spin" />
        ) : copied ? (
          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 stroke-[2.5]" />
        ) : (
          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2]" />
        )}
      </button>

      {/* Floating Copied Badge */}
      {copied && (
        <div className="absolute right-0 -bottom-7 z-30 pointer-events-none animate-fadeIn">
          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] sm:text-[10px] font-bold whitespace-nowrap shadow-md">
            {copyBadgeText}
          </span>
        </div>
      )}
    </div>
  );
}

