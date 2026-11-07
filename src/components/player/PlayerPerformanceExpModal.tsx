'use client';

import React, { useState } from 'react';
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

      {/* ── Blur Backdrop Modal Dialog ── */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl p-4 sm:p-6 max-h-[88vh] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
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
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Total EXP Summary Banner */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                  Total Poin EXP
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                    totalPoints >= 0 ? 'text-blue-600' : 'text-rose-600'
                  }`}
                >
                  {formatPoints(totalPoints)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-1">
                  Performa Laga: <strong>{formatPoints(performance.matchPoints || 0)}</strong> • Disiplin: <strong>{formatPoints(performance.disciplinePoints || 0)}</strong>
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
            <div className="text-[10px] text-slate-500 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 space-y-0.5">
              <div>
                <strong>Aturan Poin:</strong> Gol (+5), Assist (+3), Tampil (+1), Tampil Tanpa Konfirmasi (0), Kartu Kuning (-1), Kartu Merah (-3)
              </div>
              <div>
                <strong>Disiplin Invite:</strong> Abaikan (-3), Batal &lt;1 Jam (-1), Tanpa Kabar (-4), Tolak (0)
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
                      className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {act.title}
                          </span>
                          {act.minute && (
                            <span className="text-[10px] font-mono text-slate-500">
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
        </div>
      )}
    </>
  );
}

