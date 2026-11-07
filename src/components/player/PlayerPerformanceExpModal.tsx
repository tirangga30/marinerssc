'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  PlayerPerformanceResult,
  PerformanceActivity,
} from '@/lib/performancePoints';

interface PlayerPerformanceExpModalProps {
  playerName: string;
  seasonName: string;
  performance: PlayerPerformanceResult;
}

export default function PlayerPerformanceExpModal({
  playerName,
  seasonName,
  performance,
}: PlayerPerformanceExpModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { totalPoints, isIndiscipline, status, badgeColor, activities } = performance;

  const displaySeason =
    seasonName === 'SEMUA' || seasonName === 'all'
      ? 'Semua Musim'
      : `Musim ${seasonName}`;

  const formatPoints = (pts: number) => {
    if (pts > 0) return `+${pts}`;
    return `${pts}`;
  };

  const formatDate = (d: Date | string) => {
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* ── EXP Circular Badge Trigger ── */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="Klik untuk melihat rincian riwayat poin performa (EXP)"
        className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 ${badgeColor.border} ${badgeColor.bg} backdrop-blur-md flex flex-col items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer select-none`}
      >
        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/90 leading-none">
          EXP
        </span>
        <span className="text-xs sm:text-sm font-black font-mono text-white leading-none mt-0.5">
          {formatPoints(totalPoints)}
        </span>
      </button>

      {/* ── Blur Backdrop Modal Dialog (Portaled to document.body) ── */}
      {isOpen && mounted && createPortal(
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Light Frosted Glass Dialog Box ("box tetap terang, latar buram") */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white/85 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/80 shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-4 sm:p-6 max-h-[88vh] flex flex-col space-y-4 text-slate-900 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-wide">
                    Riwayat Poin Performa
                  </h3>
                  {isIndiscipline && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase border border-rose-300">
                      INDISCIPLINE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {playerName} • {displaySeason}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total EXP Summary Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 backdrop-blur-sm border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Total Poin EXP
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                    totalPoints >= 1
                      ? 'text-emerald-600'
                      : totalPoints >= -14
                      ? 'text-amber-500'
                      : totalPoints >= -29
                      ? 'text-orange-600'
                      : 'text-rose-600'
                  }`}
                >
                  {formatPoints(totalPoints)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  Performa Laga: <strong className="text-slate-800">{formatPoints(performance.matchPoints || 0)}</strong> • Disiplin: <strong className="text-slate-800">{formatPoints(performance.disciplinePoints || 0)}</strong>
                </span>
              </div>

              <div className="text-right self-start sm:self-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Status Skuad
                </span>
                <span
                  className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg inline-block mt-0.5 border ${
                    isIndiscipline
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }`}
                >
                  {status}
                </span>
              </div>
            </div>

            {/* Info Legend Note */}
            <div className="text-[10px] text-slate-600 bg-slate-50/70 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/70 space-y-0.5">
              <div>
                <strong className="text-slate-800">Aturan Poin:</strong> Gol (+5), Assist (+3), Tampil (+1), Tampil Tanpa Konfirmasi (0), Kartu Kuning (-1), Kartu Merah (-3)
              </div>
              <div>
                <strong className="text-slate-800">Disiplin Invite:</strong> Abaikan (-3), Batal &lt;1 Jam (-1), Tanpa Kabar (-4), Tolak (0)
              </div>
            </div>

            {/* Activity History List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[380px]">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  Belum ada aktivitas poin tercatat untuk {displaySeason}.
                </div>
              ) : (
                activities.map((act) => {
                  const isPositive = act.points > 0;
                  const isNegative = act.points < 0;
                  const dateStr = formatDate(act.matchDate);

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl bg-white/80 hover:bg-white backdrop-blur-xs border border-slate-200/80 flex items-start justify-between gap-3 shadow-2xs transition-colors"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {act.title}
                          </span>
                          {act.minute && (
                            <span className="text-[10px] font-mono text-blue-600 font-bold">
                              {act.minute}&apos;
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {act.reason}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          vs {act.opponentName} {dateStr ? `• ${dateStr}` : ''}
                        </p>
                      </div>

                      <div className="shrink-0 self-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono border ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : isNegative
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {formatPoints(act.points)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
