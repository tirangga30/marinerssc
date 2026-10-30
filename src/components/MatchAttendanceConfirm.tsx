'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, Sparkles, MapPin, Calendar } from 'lucide-react';
import { useSystemSetting } from '@/context/SystemSettingContext';

interface AttendanceItem {
  id: string;
  playerId: string;
  playerName?: string | null;
  status: string; // 'INVITED' | 'CONFIRMED' | 'DECLINED'
  declineReason?: string | null;
  player?: {
    id: string;
    name: string;
    number: number;
    position: string;
    photoUrl?: string | null;
  };
}

interface MatchAttendanceConfirmProps {
  matchId: string;
  opponentName: string;
  matchDateText: string;
  venueText: string;
  initialAttendances: AttendanceItem[];
}

export default function MatchAttendanceConfirm({
  matchId,
  opponentName,
  matchDateText,
  venueText,
  initialAttendances,
}: MatchAttendanceConfirmProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const playerId = searchParams.get('p') || searchParams.get('player');

  const { playerDefaultPhoto } = useSystemSetting();
  const defaultPhoto = playerDefaultPhoto || '/playertemplate.webp';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [status, setStatus] = useState<'INVITED' | 'CONFIRMED' | 'DECLINED' | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize or fetch player attendance when ?p= is present
  useEffect(() => {
    if (!playerId) return;

    // Check if player is in initialAttendances
    const existing = initialAttendances.find((a) => a.playerId === playerId || a.player?.id === playerId);
    if (existing && existing.player) {
      setPlayerData(existing.player);
      setStatus(existing.status as any);
      if (existing.declineReason) setDeclineReason(existing.declineReason);
    } else {
      // Fetch player info & attendance from API
      setLoading(true);
      fetch(`/api/matches/${matchId}/attendance?playerId=${playerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.attendance?.player) {
            setPlayerData(data.attendance.player);
            setStatus(data.attendance.status);
            if (data.attendance.declineReason) setDeclineReason(data.attendance.declineReason);
          } else {
            // Fetch direct player detail
            fetch(`/api/players/${playerId}`)
              .then((pRes) => pRes.json())
              .then((pData) => {
                if (pData?.id) {
                  setPlayerData(pData);
                  setStatus('INVITED');
                }
              })
              .catch(() => {});
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setLoading(false));
    }
  }, [playerId, matchId, initialAttendances]);

  if (!playerId) {
    return null;
  }

  const handleConfirmAttendance = async (newStatus: 'CONFIRMED' | 'DECLINED', reason = '') => {
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          status: newStatus,
          declineReason: newStatus === 'DECLINED' ? reason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan konfirmasi');

      setStatus(newStatus);
      setShowDeclineInput(false);

      if (newStatus === 'CONFIRMED') {
        setFeedbackMsg({
          type: 'success',
          text: 'Terima kasih! Anda terkonfirmasi IKUT BERTANDING. Nama Anda kini tercatat di Squad List.',
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: 'Konfirmasi tersimpan: Anda tidak dapat ikut bertanding pada laga ini.',
        });
      }

      // Trigger custom event so MatchTabs or other components re-render immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('player_attendance_updated', {
          detail: { playerId, status: newStatus },
        }));
      }

      router.refresh();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menyimpan konfirmasi',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-blue-200 shadow-sm flex items-center justify-center gap-2 text-xs font-bold text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" /> Memuat data panggilan pemain...
      </div>
    );
  }

  if (!playerData) {
    return null;
  }

  const isConfirmed = status === 'CONFIRMED';
  const isDeclined = status === 'DECLINED';

  return (
    <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-sky-400/40 shadow-xl space-y-4 relative overflow-hidden animate-fadeIn">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Tag */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-700/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Konfirmasi Kehadiran Pertandingan
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-sky-400" /> {matchDateText}
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400" /> {venueText}
          </span>
        </div>
      </div>

      {/* Player Greeting Profile & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Player Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-sky-400 shrink-0 bg-slate-800 shadow-md">
            <img
              src={playerData.photoUrl || defaultPhoto}
              alt={playerData.name}
              className="w-full h-full object-cover object-top scale-[1.3] origin-top"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white uppercase tracking-wide">
                {playerData.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-600/80 text-white font-mono font-black text-xs">
                #{playerData.number}
              </span>
              <span className="text-[10px] font-bold text-sky-300 uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {playerData.position}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Anda dipanggil untuk laga melawan <strong className="text-white uppercase">{opponentName}</strong>.
            </p>
          </div>
        </div>

        {/* Current Status Pill */}
        <div className="shrink-0">
          {isConfirmed ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black uppercase flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> IKUT BERTANDING
            </div>
          ) : isDeclined ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-300 text-xs font-black uppercase flex items-center gap-2 shadow-sm">
              <XCircle className="w-4 h-4 text-rose-400" /> TIDAK BISA IKUT
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase flex items-center gap-2 shadow-sm animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" /> MENUNGGU KONFIRMASI
            </div>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border border-rose-500/50 text-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Decline Note Input (If user is choosing Decline) */}
      {showDeclineInput && (
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-700 space-y-2.5 animate-fadeIn">
          <label className="text-xs font-bold text-slate-300 block">
            Alasan berhalangan (opsional):
          </label>
          <input
            type="text"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Contoh: Cedera ringan, tugas dinas, luar kota..."
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-rose-400"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeclineInput(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:text-white"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmAttendance('DECLINED', declineReason)}
              className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Kirim: Tidak Bisa Ikut
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showDeclineInput && (
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            disabled={saving || isConfirmed}
            onClick={() => handleConfirmAttendance('CONFIRMED')}
            className={`w-full sm:w-auto flex-1 py-3 px-5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-lg ${
              isConfirmed
                ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-400/40 cursor-default'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 active:scale-95'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            <span>{isConfirmed ? '✓ Sudah Konfirmasi: Ikut Bertanding' : '✅ Ya, Saya Ikut Bertanding'}</span>
          </button>

          <button
            type="button"
            disabled={saving || isDeclined}
            onClick={() => setShowDeclineInput(true)}
            className={`w-full sm:w-auto py-3 px-5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              isDeclined
                ? 'bg-rose-600/30 text-rose-300 border border-rose-400/40 cursor-default'
                : 'bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/50'
            }`}
          >
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>{isDeclined ? 'Status: Tidak Bisa Ikut' : '❌ Tidak Bisa Ikut'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
