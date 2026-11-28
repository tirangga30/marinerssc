'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Check } from 'lucide-react';
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

export interface StatusJourneyItem {
  name: string;
  completed: boolean;
}

const DEFAULT_STATUS_JOURNEY: StatusJourneyItem[] = [
  { name: 'PENJARINGAN', completed: false },
  { name: 'LAWAN', completed: false },
  { name: 'FIX', completed: false },
];

function parseStatusJourney(input: any): StatusJourneyItem[] {
  if (!input) return DEFAULT_STATUS_JOURNEY;
  try {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item: any) => ({
        name: typeof item === 'string' ? item : (item.name || ''),
        completed: typeof item === 'object' ? Boolean(item.completed) : false,
      }));
    }
  } catch {
    // fallback
  }
  return DEFAULT_STATUS_JOURNEY;
}

interface MatchAttendanceConfirmProps {
  matchId: string;
  opponentName?: string;
  matchDateText?: string;
  venueText?: string;
  matchDate?: Date | string;
  matchStatus?: string;
  initialAttendances: AttendanceItem[];
  inviteNotes?: string | null;
  statusJourney?: string | null | StatusJourneyItem[];
}

export default function MatchAttendanceConfirm({
  matchId,
  matchDate,
  matchStatus,
  initialAttendances,
  inviteNotes,
  statusJourney,
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
  const [currentInviteNotes, setCurrentInviteNotes] = useState(inviteNotes || '');
  const [currentStatusJourney, setCurrentStatusJourney] = useState<any>(statusJourney || null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (inviteNotes !== undefined) {
      setCurrentInviteNotes(inviteNotes || '');
    }
  }, [inviteNotes]);

  useEffect(() => {
    if (statusJourney !== undefined) {
      setCurrentStatusJourney(statusJourney);
    }
  }, [statusJourney]);

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
          if (data.inviteNotes !== undefined && data.inviteNotes !== null) {
            setCurrentInviteNotes(data.inviteNotes);
          }
          if (data.statusJourney !== undefined && data.statusJourney !== null) {
            setCurrentStatusJourney(data.statusJourney);
          }
          if (data.attendance?.player) {
            setPlayerData(data.attendance.player);
            setStatus(data.attendance.status);
            if (data.attendance.declineReason) setDeclineReason(data.attendance.declineReason);
          } else if (data.player) {
            setPlayerData(data.player);
            setStatus('INVITED');
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

  const matchDateMs = matchDate ? new Date(matchDate).getTime() : 0;
  const nowMs = Date.now();
  const isWithin1Hour =
    matchDateMs > 0 && matchDateMs - nowMs <= 3600 * 1000 && nowMs < matchDateMs;

  const handleConfirmAttendance = async (newStatus: 'CONFIRMED' | 'DECLINED', reason = '') => {
    if (newStatus === 'DECLINED' && isWithin1Hour) {
      const confirmed = window.confirm(
        '⚠️ Peringatan Penalti Disiplin:\n\nPertandingan akan dimulai dalam waktu kurang dari 1 jam. Membatalkan kehadiran saat ini akan dikenakan penalti -1 poin performa setelah kickoff.\n\nApakah Anda yakin ingin membatalkan kehadiran?'
      );
      if (!confirmed) return;
    }

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
          isLateDecline: newStatus === 'DECLINED' && isWithin1Hour,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan konfirmasi');

      setStatus(newStatus);
      setShowDeclineInput(false);

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

  const journeyItems = parseStatusJourney(currentStatusJourney);

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
            <span className="text-xs font-black font-mono text-blue-600">
              #{playerData.number}
            </span>
            <span className="text-sm font-black text-slate-900 uppercase">
              {playerData.name}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-100">
              {playerData.position}
            </span>
          </div>
        </div>

        {/* Status indicator */}
        <div className="shrink-0 w-full sm:w-auto">
          {isConfirmed ? (
            <span className="w-full sm:w-auto text-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase inline-block">
              Status: Ikut Bertanding
            </span>
          ) : isDeclined ? (
            <span className="w-full sm:w-auto text-center px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold uppercase inline-block">
              Status: Tidak Bisa Ikut
            </span>
          ) : (
            <span className="w-full sm:w-auto text-center px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold uppercase inline-block">
              Status: Menunggu Konfirmasi
            </span>
          )}
        </div>
      </div>

      {/* Perjalanan Status Pertandingan: Garis kesamping, bulatan di atas nama status, hijau jika sudah diceklis, abu jika belum */}
      {journeyItems.length > 0 && (
        <div className="py-2.5 px-2 sm:px-3 bg-slate-50/70 rounded-2xl border border-slate-100/90 my-1">
          <div className="flex items-start justify-between w-full">
            {journeyItems.map((step, idx) => {
              const isCompleted = step.completed;
              const isLast = idx === journeyItems.length - 1;

              return (
                <React.Fragment key={idx}>
                  {/* Step item */}
                  <div className="flex flex-col items-center flex-1 min-w-0 text-center">
                    {/* Bulatan di atas nama status */}
                    <div
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 z-10 shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs ring-4 ring-emerald-100/80'
                          : 'bg-slate-200 border-2 border-slate-300 text-transparent ring-4 ring-white'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>

                    {/* Nama status di bawah bulatan */}
                    <span
                      className={`text-[9px] sm:text-[11px] font-black uppercase tracking-wider mt-1.5 px-0.5 break-words leading-tight transition-colors duration-200 ${
                        isCompleted ? 'text-emerald-700' : 'text-slate-400'
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>

                  {/* Garis ke samping menuju status berikutnya */}
                  {!isLast && (
                    <div
                      className={`flex-1 -mx-2 sm:-mx-3 mt-3 sm:mt-3.5 h-1 rounded-full transition-colors duration-300 self-start z-0 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Catatan pertandingan di bawah STATUS (tanpa box & tanpa tulisan label catatan) */}
      {currentInviteNotes && (
        <p className="text-xs sm:text-sm text-slate-600 font-medium whitespace-pre-line leading-relaxed px-0.5">
          {currentInviteNotes}
        </p>
      )}

      {/* Feedback alert (hanya tampil jika error) */}
      {feedbackMsg && feedbackMsg.type === 'error' && (
        <div className="p-2.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-800">
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
          {isWithin1Hour && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              ⚠️ Peringatan: Kickoff kurang dari 1 jam. Pembatalan sekarang akan dikenakan penalti disiplin -1 poin performa (EXP) setelah kickoff.
            </div>
          )}
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
            disabled={saving}
            onClick={() => handleConfirmAttendance('CONFIRMED')}
            className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            IKUT BERTANDING
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => setShowDeclineInput(true)}
            className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
          >
            TIDAK BISA IKUT
          </button>
        </div>
      )}
    </div>
  );
}
