'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';
import { getClientPublicSeason } from '@/lib/publicSeason';
import { useSystemSetting } from '@/context/SystemSettingContext';

interface LineupPlayer {
  id: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
  x?: number | null;
  y?: number | null;
  player: {
    id: string;
    name: string;
    slug: string;
    number: number;
    position: string;
    photoUrl: string;
    seasonData?: any;
  };
}

interface TacticalPitchProps {
  lineups: LineupPlayer[];
  formation?: string;
  season?: string;
  events?: Array<{
    id?: string;
    playerId: string;
    type: string;
    assistPlayerId?: string | null;
    minute?: number;
    player?: { id: string; name?: string; slug?: string; photoUrl?: string; number?: number; seasonData?: any } | null;
    assistPlayer?: { id: string; name?: string; slug?: string; photoUrl?: string; number?: number; seasonData?: any } | null;
  }>;
}

// Preset coordinates on pitch percentage (top %, left %)
const positionCoordinates: Record<string, { top: number; left: number }> = {
  GK: { top: 86, left: 50 },
  LB: { top: 68, left: 16 },
  CB1: { top: 72, left: 37 },
  CB2: { top: 72, left: 63 },
  RB: { top: 68, left: 84 },
  CM1: { top: 50, left: 32 },
  CM2: { top: 50, left: 68 },
  CAM: { top: 34, left: 50 },
  LW: { top: 16, left: 18 },
  ST: { top: 12, left: 50 },
  RW: { top: 16, left: 82 },

  // Alternatives / subs / 4-2-3-1
  CDM1: { top: 56, left: 36 },
  CDM2: { top: 56, left: 64 },
  LM: { top: 34, left: 18 },
  RM: { top: 34, left: 82 },
  CF: { top: 14, left: 50 },
};


export default function TacticalPitch({
  lineups,
  formation = 'Belum Tersedia',
  events = [],
  season,
}: TacticalPitchProps) {
  const { playerDefaultPhoto } = useSystemSetting();
  const defaultPlayerTemplate = playerDefaultPhoto || '/playertemplate.webp';
  const activeSeason = season || getClientPublicSeason() || '2026';

  const getPosWeight = (pos: string, pitchPos?: string): number => {
    const p = (pos || '').toUpperCase();
    const pitchP = (pitchPos || '').toUpperCase();

    if (p === 'GK' || p === 'GOALKEEPER' || pitchP === 'GK') return 1;
    if (p === 'DF' || p === 'DEFENDER' || ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DF'].includes(pitchP)) return 2;
    if (p === 'MF' || p === 'MIDFIELDER' || ['CM', 'CAM', 'CDM', 'LM', 'RM', 'MF'].includes(pitchP)) return 3;
    if (p === 'FW' || p === 'FORWARD' || ['ST', 'CF', 'LW', 'RW', 'FW'].includes(pitchP)) return 4;
    return 5;
  };

  const sortLineupsByPos = (list: LineupPlayer[]) => {
    return [...list].sort((a, b) => {
      const wA = getPosWeight(a.player?.position || a.positionName, a.pitchPosition);
      const wB = getPosWeight(b.player?.position || b.positionName, b.pitchPosition);
      if (wA !== wB) return wA - wB;
      return (a.player?.number || 0) - (b.player?.number || 0);
    });
  };

  const starters = sortLineupsByPos(lineups.filter((l) => l.isStarter));
  const bench = sortLineupsByPos(lineups.filter((l) => !l.isStarter));

  const subEvents = (events || [])
    .filter((e) => e.type === 'sub')
    .map((e, idx) => {
      // Dapatkan referensi kedua pemain dalam event pergantian
      // Prioritaskan player yang sudah ada di lineups karena lineups sudah ter-resolve untuk musim pertandingan
      const p1Lineup = lineups.find((l) => l.player?.id === (e.player?.id || e.playerId));
      const p2Lineup = lineups.find((l) => l.player?.id === (e.assistPlayer?.id || e.assistPlayerId));

      let p1: any = p1Lineup?.player || e.player;
      let p2: any = p2Lineup?.player || e.assistPlayer;

      if (p1) p1 = resolvePlayerForSeason(p1, activeSeason);
      if (p2) p2 = resolvePlayerForSeason(p2, activeSeason);

      // User requirement:
      // Pemain CADANGAN yang di ATAS (termasuk fotonya) -> benchPlayer
      // Pemain di LAPANG yang di BAWAH (di sebelah ikon putar) -> pitchPlayer
      let benchPlayer: any;
      let pitchPlayer: any;

      if (!p1Lineup?.isStarter && p2Lineup?.isStarter) {
        benchPlayer = p1;
        pitchPlayer = p2;
      } else if (!p2Lineup?.isStarter && p1Lineup?.isStarter) {
        benchPlayer = p2;
        pitchPlayer = p1;
      } else {
        // Fallback jika status starter sama: p1 adalah cadangan (atas), p2 adalah pemain di lapang (bawah)
        benchPlayer = p1;
        pitchPlayer = p2;
      }

      // Pastikan foto dan nomor benchPlayer & pitchPlayer selalu ter-resolve untuk activeSeason
      if (benchPlayer) benchPlayer = resolvePlayerForSeason(benchPlayer, activeSeason);
      if (pitchPlayer) pitchPlayer = resolvePlayerForSeason(pitchPlayer, activeSeason);

      const benchNumber =
        benchPlayer?.number ??
        (benchPlayer?.id === p1?.id ? p1Lineup?.player?.number : p2Lineup?.player?.number);
      const pitchNumber =
        pitchPlayer?.number ??
        (pitchPlayer?.id === p1?.id ? p1Lineup?.player?.number : p2Lineup?.player?.number);

      return {
        id: e.id || `sub-${idx}`,
        minute: e.minute || 0,
        benchPlayer,
        pitchPlayer,
        benchNumber,
        pitchNumber,
      };
    })
    .filter((item) => Boolean(item.benchPlayer || item.pitchPlayer))
    .sort((a, b) => a.minute - b.minute);

  return (
    <div className="bg-[#eff3f7] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs space-y-4 max-w-4xl mx-auto">
      {/* 1. Header (Luar Garis Lapang Atas): Tulisan Formasi di Kiri, Formasi di Kanan */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300/60">
        <span className="text-sm sm:text-base font-bold text-slate-800">
          Formasi
        </span>
        <span className="text-xs sm:text-sm font-black font-mono text-blue-600 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
          {formation || 'Belum Tersedia'}
        </span>
      </div>

      {/* 2. Tactical Pitch (Gambar /pitch.png & Marker Pemain) */}
      <div
        className="relative w-full max-w-xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden select-none"
        style={{ aspectRatio: '1132 / 1389' }}
      >
        {/* Background Gambar Lapangan (Garis dibuat transparan dan lembut) */}
        <img
          src="/pitch.webp"
          alt="Tactical Pitch"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none mix-blend-multiply opacity-25"
        />

        {/* Starter Markers on Pitch */}
        {starters.map((lineup) => {
          let coords = { top: 50, left: 50 };
          if (lineup.x != null && lineup.y != null) {
            coords = { top: lineup.y, left: lineup.x };
          } else {
            coords = positionCoordinates[lineup.pitchPosition] || { top: 50, left: 50 };
          }
          const rawEvts = events.filter((e) => e.playerId === lineup.player.id);
          const assistEvts = events.filter((e) => e.assistPlayerId === lineup.player.id && e.type !== 'sub');

          const chronEvents = (events || [])
            .filter((e) => {
              const isPlayer = e.player?.id === lineup.player.id || e.playerId === lineup.player.id;
              const isAssist = e.assistPlayer?.id === lineup.player.id || e.assistPlayerId === lineup.player.id;
              return isPlayer || isAssist;
            })
            .flatMap((e, idx) => {
              const isPlayer = e.player?.id === lineup.player.id || e.playerId === lineup.player.id;
              const isAssist = e.assistPlayer?.id === lineup.player.id || e.assistPlayerId === lineup.player.id;
              const evts: Array<{ id: string; type: string; minute: number }> = [];

              const m = e.minute || 0;
              if (e.type === 'sub') {
                if (lineup.isStarter) {
                  evts.push({ id: e.id || `subout-${idx}`, type: 'sub_out', minute: m });
                } else {
                  evts.push({ id: e.id || `subin-${idx}`, type: 'sub_in', minute: m });
                }
              } else if (e.type === 'goal' || e.type === 'own_goal' || e.type === 'penalty') {
                if (isPlayer) evts.push({ id: e.id || `evt-${idx}`, type: e.type, minute: m });
                if (isAssist) evts.push({ id: e.id || `ast-${idx}`, type: 'assist', minute: m });
              } else if (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card') {
                if (isPlayer) evts.push({ id: e.id || `evt-${idx}`, type: e.type, minute: m });
              }
              return evts;
            })
            .sort((a, b) => a.minute - b.minute);

          const subEvents = chronEvents.filter((e) => e.type === 'sub_in' || e.type === 'sub_out');
          const matchEvts = chronEvents.filter((e) => e.type !== 'sub_in' && e.type !== 'sub_out');

          const isGuest = (lineup.player as any)?.isGuest;
          const TokenContent = (
            <>
              {/* Player Avatar Circle with Blue Gradient Border */}
              <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#003893] via-[#004bb8] to-sky-400 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                  <img
                    src={(lineup.player.photoUrl && lineup.player.photoUrl !== '/playertemplate.webp') ? lineup.player.photoUrl : defaultPlayerTemplate}
                    alt={lineup.player.name}
                    className="w-full h-full object-cover object-top scale-[1.35] origin-top rounded-full"
                  />
                </div>

                {/* Match Event Badges Overlay on Top-Right Corner */}
                {matchEvts.length > 0 && (
                  <div className="absolute -top-2.5 -right-1 flex items-center gap-0.5 z-30 pointer-events-none bg-slate-950/80 backdrop-blur-xs px-1 py-0.5 rounded-full border border-white/20 shadow-md">
                    {matchEvts.map((e) => (
                      <span key={e.id} className="inline-flex items-center justify-center">
                        {e.type === 'goal' && <i className="fa-regular fa-futbol text-amber-400 text-[8px] sm:text-[9.5px]" />}
                        {e.type === 'own_goal' && <i className="fa-regular fa-futbol text-red-500 text-[8px] sm:text-[9.5px]" />}
                        {e.type === 'penalty' && (
                          <span className="relative inline-flex items-center">
                            <i className="fa-regular fa-futbol text-amber-400 text-[8px] sm:text-[9.5px]" />
                            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-amber-400 text-slate-950 font-black text-[5px] flex items-center justify-center leading-none">
                              P
                            </span>
                          </span>
                        )}
                        {e.type === 'assist' && (
                          <span className="text-amber-400 font-black text-[7.5px] sm:text-[9px] leading-none">A</span>
                        )}
                        {e.type === 'yellow_card' && (
                          <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-amber-400 rounded-[1px] inline-block border border-amber-300/40" />
                        )}
                        {e.type === 'second_yellow' && (
                          <span className="relative inline-flex items-center ml-0.5 shrink-0">
                            <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-amber-500 rounded-[1px] border border-amber-600/50" style={{ transform: 'translate(-1.5px, -0.5px)' }} />
                            <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-red-600 rounded-[1px] border border-red-400/40 absolute top-0 left-0" />
                          </span>
                        )}
                        {e.type === 'red_card' && (
                          <span className="w-1.5 h-2.5 sm:w-2 sm:h-2.5 bg-red-600 rounded-[1px] inline-block border border-red-400/40" />
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {/* Substitution Event Badge Overlay on Bottom-Right Corner of Photo */}
                {subEvents.length > 0 && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 z-30 pointer-events-none bg-slate-950/90 backdrop-blur-xs px-1 py-0.5 rounded-full border border-white/20 shadow-md">
                    {subEvents.map((e) => (
                      <span key={e.id} className="inline-flex items-center justify-center">
                        {e.type === 'sub_in' && (
                          <i className="fa-solid fa-right-left text-emerald-400 text-[7px] sm:text-[9px] shrink-0" title="Masuk sebagai Pengganti" />
                        )}
                        {e.type === 'sub_out' && (
                          <i className="fa-solid fa-right-left text-red-500 text-[7px] sm:text-[9px] shrink-0" title="Digantikan" />
                        )}
                      </span>
                    ))}
                  </div>
                )}

              </div>

              {/* Player Name Tag with squad number on the left in blue and clear dark name text */}
              <div className="mt-1 z-10 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-xs font-bold whitespace-nowrap bg-white/95 text-slate-900 group-hover:bg-blue-50 group-hover:border-blue-400 transition-colors border border-slate-300/80 flex items-center gap-1 shadow-sm backdrop-blur-xs">
                <span className="text-blue-600 font-black font-mono">
                  {lineup.player.number}
                </span>
                <span className="text-slate-900 font-black">
                  {lineup.player.name.split(' ')[0]}
                </span>
              </div>
            </>
          );

          return isGuest ? (
            <div
              key={lineup.id}
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center cursor-default select-none"
            >
              {TokenContent}
            </div>
          ) : (
            <Link
              key={lineup.id}
              href={`/players/${lineup.player.slug}`}
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110 hover:z-30"
            >
              {TokenContent}
            </Link>
          );
        })}
      </div>

      {/* 3. Footer: Pemain yang digantikan (Luar Garis Lapang Bawah, Masih di Dalam Box #eff3f7) */}
      {subEvents.length > 0 && (
        <div className="pt-4 border-t border-slate-300/60 space-y-4">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Pemain yang digantikan
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {subEvents.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="flex items-center gap-3.5 p-1 rounded-xl hover:bg-slate-200/50 transition-colors"
              >
                {/* Photo avatar pemain cadangan (di atas) */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-slate-300 shrink-0 bg-white flex items-center justify-center">
                  <img
                    src={(sub.benchPlayer?.photoUrl && sub.benchPlayer.photoUrl !== '/playertemplate.webp') ? sub.benchPlayer.photoUrl : defaultPlayerTemplate}
                    alt={sub.benchPlayer?.name || 'Pemain Cadangan'}
                    className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                  />
                </div>

                {/* Nama & Info Pergantian */}
                <div className="min-w-0 flex-1">
                  {/* Baris Atas: Pemain Cadangan Masuk (Nomor Punggung Biru di Kiri Nama) */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sub.benchNumber != null && (
                      <span className="text-blue-600 font-black font-mono text-xs sm:text-sm shrink-0">
                        {sub.benchNumber}
                      </span>
                    )}
                    {sub.benchPlayer?.slug ? (
                      <Link
                        href={`/players/${sub.benchPlayer.slug}`}
                        className="text-sm sm:text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate"
                      >
                        {sub.benchPlayer.name}
                      </Link>
                    ) : (
                      <span className="text-sm sm:text-base font-semibold text-slate-900 block truncate">
                        {sub.benchPlayer?.name || 'Pemain'}
                      </span>
                    )}
                  </div>

                  {/* Baris Bawah: Menit di Ujung Kiri sebelum Icon, Nomor Punggung Pemain Digantikan Abu-Abu di Kiri Nama */}
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium mt-0.5 min-w-0">
                    {Boolean(sub.minute) && (
                      <span className="text-slate-500 font-bold font-mono text-[11px] sm:text-xs shrink-0">
                        {sub.minute}'
                      </span>
                    )}
                    <i className="fa-solid fa-arrows-rotate text-slate-400 text-[10px] sm:text-xs shrink-0" />
                    {sub.pitchNumber != null && (
                      <span className="text-slate-400 font-bold font-mono text-[11px] sm:text-xs shrink-0">
                        {sub.pitchNumber}
                      </span>
                    )}
                    {sub.pitchPlayer?.slug ? (
                      <Link
                        href={`/players/${sub.pitchPlayer.slug}`}
                        className="hover:text-blue-600 transition-colors truncate block"
                      >
                        {sub.pitchPlayer.name}
                      </Link>
                    ) : (
                      <span className="truncate block">
                        {sub.pitchPlayer?.name || 'Pemain'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
