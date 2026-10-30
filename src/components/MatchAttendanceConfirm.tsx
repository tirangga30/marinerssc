'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
  opponentName?: string;
  matchDateText?: string;
  venueText?: string;
  matchDate?: Date | string;
  matchStatus?: string;
  initialAttendances: AttendanceItem[];
}

export default function MatchAttendanceConfirm({
  matchId,
  matchDate,
  matchStatus,
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

  useEffect(() => {
    if (!playerId) return;

    const existing = initialAttendances.find((a) => a.playerId === playerId || a.player?.id === playerId);
    if (existing && existing.player) {
      setPlayerData(existing.player);
      setStatus(existing.status as any);
      if (existing.declineReason) setDeclineReason(existing.declineReason);
    } else {
      setLoading(true);
      fetch(`/api/matches/${matchId}/attendance?playerId=${playerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.attendance?.player) {
            setPlayerData(data.attendance.player);
            setStatus(data.attendance.status);
            if (data.attendance.declineReason) setDeclineReason(data.attendance.declineReason);
          } else {
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
          text: 'Konfirmasi tersimpan: Anda tercatat hadir untuk pertandingan ini.',
        });
      } else {
        setFeedbackMsg({
          type: 'success',
          text: 'Konfirmasi tersimpan: Anda tercatat tidak bisa hadir pada pertandingan ini.',
        });
      }

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
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Memuat data pemain...
      </div>
    );
  }

  if (!playerData) {
    return null;
  }

  const isConfirmed = status === 'CONFIRMED';
  const isDeclined = status === 'DECLINED';
  const isExpired = Boolean(
    (matchDate && !isNaN(new Date(matchDate).getTime()) && new Date(matchDate).getTime() <= Date.now()) ||
    matchStatus === 'finished' ||
    matchStatus === 'live'
  );

  // Jika waktu pertandingan telah tiba / kickoff, jangan tampilkan box invite sama sekali
  if (isExpired) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <span className="text-xs font-black uppercase tracking-wider text-slate-900">
          Konfirmasi Kehadiran Pemain
        </span>
        {isExpired && (
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Undangan Ditutup
          </span>
        )}
      </div>

      {/* Player info & current status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <img
              src={playerData.photoUrl || defaultPhoto}
              alt={playerData.name}
              className="w-full h-full object-cover object-top scale-[1.35] origin-top"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black text-slate-900 uppercase">
              {playerData.name}
            </span>
            <span className="text-xs font-black font-mono text-blue-600">
              #{playerData.number}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
              {playerData.position}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0">
          {isConfirmed ? (
            <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase inline-block">
              Status: Ikut Bertanding
            </span>
          ) : isDeclined ? (
            <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase inline-block">
              Status: Tidak Bisa Ikut
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase inline-block">
              Status: Menunggu Konfirmasi
            </span>
          )}
        </div>
      </div>

      {/* Feedback alert */}
      {feedbackMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs font-semibold ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Expired State or Action buttons */}
      {isExpired ? (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">⏳</span>
            <span>Waktu pertandingan telah tiba. Undangan konfirmasi kehadiran sudah ditutup.</span>
          </div>
          {status && (
            <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 shrink-0 self-start sm:self-auto shadow-xs">
              Status Anda: {isConfirmed ? 'Ikut Bertanding' : isDeclined ? 'Tidak Bisa Ikut' : 'Belum Konfirmasi'}
            </span>
          )}
        </div>
      ) : showDeclineInput ? (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Alasan berhalangan (opsional):
          </label>
          <input
            type="text"
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Contoh: Cedera, dinas luar kota, urusan mendadak..."
            className="w-full p-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:border-blue-500"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeclineInput(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:text-slate-900"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => handleConfirmAttendance('DECLINED', declineReason)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Kirim: Tidak Bisa Ikut'}
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
          <button
            type="button"
            disabled={saving || isConfirmed}
            onClick={() => handleConfirmAttendance('CONFIRMED')}
            className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isConfirmed
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
            }`}
          >
            {saving ? 'Menyimpan...' : isConfirmed ? 'Sudah Konfirmasi: Ikut' : 'Ikut Bertanding'}
          </button>

          <button
            type="button"
            disabled={saving || isDeclined}
            onClick={() => setShowDeclineInput(true)}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              isDeclined
                ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-default'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            {isDeclined ? 'Status: Tidak Bisa' : 'Tidak Bisa Ikut'}
          </button>
        </div>
      )}
    </div>
  );
}
