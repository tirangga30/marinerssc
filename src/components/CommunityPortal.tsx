'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, Users, Trophy, Award, Flame, Calendar, MapPin,
  CheckCircle2, XCircle, AlertCircle, LogOut, ArrowRight,
  Sparkles, Check, UserCheck, Star, Activity, Clock, Crown,
  Camera, Upload, Loader2
} from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';
import CommunityRegistrationModal from '@/components/CommunityRegistrationModal';
import CommunityLoginModal from '@/components/CommunityLoginModal';
import MemberDurationCountdown from '@/components/MemberDurationCountdown';

interface CommunityPortalProps {
  initialMember: any | null;
  upcomingFunMatch: any | null;
  upcomingMainSquadInvitation: any | null;
  upcomingMainSquadMatch?: any | null;
  declinedInvitations: any[];
  allConfirmedFunMatchPlayers: any[];
  recentFunMatches: any[];
  totalMembersCount: number;
}

export default function CommunityPortal({
  initialMember,
  upcomingFunMatch,
  upcomingMainSquadInvitation,
  upcomingMainSquadMatch,
  declinedInvitations = [],
  allConfirmedFunMatchPlayers = [],
  recentFunMatches = [],
  totalMembersCount = 0,
}: CommunityPortalProps) {
  const router = useRouter();
  const [member, setMember] = useState<any | null>(initialMember);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'FAN' | 'PRO' | 'ELITE'>('PRO');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [mainSquadRsvpLoading, setMainSquadRsvpLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if member already confirmed for the upcoming fun match
  const myFunMatchAttendance = upcomingFunMatch && member
    ? allConfirmedFunMatchPlayers.find((p) => p.memberId === member.id)
    : null;

  const isPlayingInMainSquad = upcomingMainSquadInvitation?.status === 'CONFIRMED';

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    setUploadingPhoto(true);
    setMessage(null);

    try {
      // 1. Upload photo file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'members');
      formData.append('playerName', member.fullName || 'Member');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Gagal mengunggah foto');

      const newPhotoUrl = uploadData.url;

      // 2. Update member photo in database
      const updateRes = await fetch('/api/community/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: newPhotoUrl }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || 'Gagal menyimpan foto profil baru');

      setMember((prev: any) => ({ ...prev, photoUrl: newPhotoUrl }));
      setMessage({ type: 'success', text: 'Foto profil Anda berhasil diubah!' });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal mengubah foto profil' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/community/auth/logout', { method: 'POST' });
      setMember(null);
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleFunMatchRsvp = async (action: 'JOIN' | 'DECLINE') => {
    if (!upcomingFunMatch || !member) return;
    setRsvpLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/community/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funMatchId: upcomingFunMatch.id,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status');

      setMessage({
        type: 'success',
        text: action === 'JOIN'
          ? isPlayingInMainSquad
            ? 'Luar biasa! Anda resmi terdaftar di Fun Match (Bermain 2x bersama Skuad Utama).'
            : 'Anda berhasil terdaftar di Fun Match! Nama Anda sudah masuk ke daftar pemain ikut.'
          : 'Status kehadiran Fun Match Anda dibatalkan.',
      });
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleMainSquadRsvp = async (action: 'JOIN' | 'DECLINE') => {
    if (!upcomingMainSquadInvitation || !member) return;
    setMainSquadRsvpLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/community/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: upcomingMainSquadInvitation.footballMatch.id,
          action,
          reason: action === 'DECLINE' ? 'Menolak panggilan squad utama' : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal merespons undangan');

      if (action === 'JOIN') {
        setMessage({
          type: 'success',
          text: 'Luar biasa! Anda resmi bergabung di Tim Utama. Jadwal Fun Match otomatis disesuaikan (klik Tetap Ikut di Fun Match jika ingin bermain 2x).',
        });
      } else {
        setMessage({
          type: 'success',
          text: 'Panggilan Tim Utama ditolak. Anda tetap dapat mengikuti Fun Match komunitas.',
        });
      }
      router.refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setMainSquadRsvpLoading(false);
    }
  };

  const openRegisterWithTier = (tier: 'FAN' | 'PRO' | 'ELITE') => {
    setSelectedTier(tier);
    setRegisterModalOpen(true);
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-12">

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER / LOGGED-IN PROFILE HERO
         ───────────────────────────────────────────────────────────── */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-sky-400/30 p-4 sm:p-8 bg-gradient-to-b from-slate-900/90 via-blue-950/40 to-slate-900/90 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">

          {/* Left / Info */}
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>MARINERS Sc COMMUNITY</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white leading-tight">
              {member ? (
                <>Selamat Datang, <span className="blue-gradient-text">{member.nickname || member.fullName}</span></>
              ) : (
                <>Komunitas Mini Soccer <span className="blue-gradient-text">Mariners SC</span></>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {member
                ? 'Pantau jadwal fun match mingguan, konfirmasi kehadiran Anda, dan terima kesempatan terpilih bermain bersama Skuad Utama Mariners SC!'
                : 'Wadah resmi komunitas Mini Soccer Mariners SC. Ikuti fun match rutin tiap minggu, rasakan atmosfer kompetitif yang sehat, dan raih peluang promosi ke Skuad Utama!'}
            </p>
          </div>

          {/* Right: Member Badge or Guest Actions */}
          {member ? (
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
              <div className="relative group">
                <img
                  src={member.photoUrl || '/defaultplayer.png'}
                  alt={member.fullName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-sky-400/60 bg-slate-900 shadow-lg"
                />

                {/* Ganti Foto Profil Overlay */}
                <label
                  className={`absolute inset-0 rounded-2xl bg-slate-950/80 border border-sky-400 flex flex-col items-center justify-center cursor-pointer transition-opacity backdrop-blur-xs ${uploadingPhoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  title="Klik untuk ganti foto profil"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300 drop-shadow" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase text-white tracking-wider mt-0.5">
                        Ubah Foto
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPhoto}
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm pointer-events-none">
                  #{member.jerseyNumber}
                </span>
              </div>
              <div className="space-y-1.5 text-center sm:text-left min-w-[220px]">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-sm font-black text-white">{member.fullName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${member.tier === 'ELITE'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : member.tier === 'PRO'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                    }`}>
                    {member.tier}
                  </span>
                </div>
                <p className="text-xs text-sky-400 font-mono font-bold">{member.memberCode}</p>
                <p className="text-[11px] text-slate-400">
                  Posisi: <strong className="text-white">{member.position}</strong> • {member.origin}
                </p>

                {/* Live Countdown Timer Durasi Pemain & Masa Aktif */}
                <div className="pt-1">
                  <MemberDurationCountdown
                    expiresAt={member.expiresAt}
                    joinedAt={member.joinedAt || member.createdAt}
                    isPermanent={member.isPermanent}
                  />
                </div>

                <div className="pt-1.5">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider"
                  >
                    <LogOut className="w-3 h-3" /> Keluar Akun
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-6 py-3 rounded-xl border border-sky-400/40 bg-slate-900/80 hover:bg-slate-800 text-sky-300 text-xs font-extrabold uppercase tracking-wider transition-all shadow-lg shadow-sky-950"
              >
                Login Member
              </button>
            </div>
          )}

        </div>
      </section>

      {/* Global Alert Message */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border ${message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. LOGGED-IN MEMBER PORTAL CONTENT
         ───────────────────────────────────────────────────────────── */}
      {member && (
        <div className="space-y-8">

          {/* PERSONAL STATS OVERVIEW (IDENTIK DENGAN AKUMULASI STATISTIK TIM UTAMA) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400">
                Akumulasi Statistik Individu
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Fun Match Komunitas
              </span>
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-800/80 bg-gradient-to-b from-[#18130a] via-[#090b14] to-[#060b14] rounded-2xl sm:rounded-3xl border border-amber-400/20 shadow-2xl overflow-hidden py-4 sm:py-5">
              {[
                { label: 'GOL', value: member.totalGoals ?? member.goals ?? 0 },
                { label: 'ASSIST', value: member.totalAssists ?? member.assists ?? 0 },
                { label: 'MAIN', value: member.totalAppearances ?? member.funAppearances ?? 0 },
                { label: 'KUNING', value: member.totalYellowCards ?? member.yellowCards ?? 0 },
                { label: 'MERAH', value: member.totalRedCards ?? member.redCards ?? 0 },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                  <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-tight">
                    {s.value}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN SQUAD INVITATION CARD (IF INVITED BY ADMIN) */}
          {upcomingMainSquadInvitation && (
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                  <Crown className="w-4 h-4 animate-bounce" />
                  <span>Panggilan Pertandingan Skuad Utama Mariners SC!</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Undangan Khusus
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-amber-400/20">
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase text-white">
                    Mariners SC vs {upcomingMainSquadInvitation.footballMatch.opponentName}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {formatWibDate(upcomingMainSquadInvitation.footballMatch.matchDate, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })} • {formatWibTime(upcomingMainSquadInvitation.footballMatch.matchDate)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Lokasi: {upcomingMainSquadInvitation.footballMatch.venue} • {upcomingMainSquadInvitation.footballMatch.competition}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                  {upcomingMainSquadInvitation.status === 'CONFIRMED' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Anda Terkonfirmasi Ikut Skuad Utama
                      </span>
                      <button
                        onClick={() => handleMainSquadRsvp('DECLINE')}
                        disabled={mainSquadRsvpLoading}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  ) : upcomingMainSquadInvitation.status === 'DECLINED' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-400" /> Anda Tidak Bisa Ikut
                      </span>
                      <button
                        onClick={() => handleMainSquadRsvp('JOIN')}
                        disabled={mainSquadRsvpLoading}
                        className="px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Ubah: Ikut Skuad Utama
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleMainSquadRsvp('DECLINE')}
                        disabled={mainSquadRsvpLoading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-red-950 hover:text-red-400 hover:border-red-500/50 border border-slate-700 text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        Tidak Bisa
                      </button>
                      <button
                        onClick={() => handleMainSquadRsvp('JOIN')}
                        disabled={mainSquadRsvpLoading}
                        className="px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Ikut Skuad Utama
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* UPCOMING FUN MATCH & RSVP SECTION */}
          {upcomingFunMatch ? (
            <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-sky-400/40 shadow-2xl space-y-6">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      Fun Match Mendatang
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatWibDate(upcomingFunMatch.matchDate, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })} • {formatWibTime(upcomingFunMatch.matchDate)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                    {upcomingFunMatch.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {upcomingFunMatch.venue} • Durasi {upcomingFunMatch.duration || 60} Menit
                  </p>
                </div>

                {/* RSVP Action Buttons */}
                <div className="flex items-center gap-2">
                  {myFunMatchAttendance?.status === 'CONFIRMED' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        {isPlayingInMainSquad ? 'Anda Terdaftar Ikut (Bermain 2x)' : 'Anda Terdaftar Ikut'}
                      </span>
                      <button
                        onClick={() => handleFunMatchRsvp('DECLINE')}
                        disabled={rsvpLoading}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  ) : isPlayingInMainSquad ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Fokus Skuad Utama (Tidak Ikut)</span>
                      </span>
                      <button
                        onClick={() => handleFunMatchRsvp('JOIN')}
                        disabled={rsvpLoading}
                        className="px-4 py-2 rounded-xl font-extrabold uppercase bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                        title="Tetap ikut Fun Match agar bermain 2x"
                      >
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        Tetap Ikut (Bermain 2x)
                      </button>
                    </div>
                  ) : myFunMatchAttendance?.status === 'DECLINED' ? (
                    <div className="flex items-center gap-2">
                      <span className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-red-400" /> Anda Tidak Bisa Ikut
                      </span>
                      <button
                        onClick={() => handleFunMatchRsvp('JOIN')}
                        disabled={rsvpLoading}
                        className="px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Ubah: Ikut Pertandingan
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFunMatchRsvp('DECLINE')}
                        disabled={rsvpLoading}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-bold transition-all"
                      >
                        Tidak Bisa
                      </button>
                      <button
                        onClick={() => handleFunMatchRsvp('JOIN')}
                        disabled={rsvpLoading}
                        className="px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Ikut Pertandingan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Match Card Preview (TIM A vs TIM B) with Live / Finished Score */}
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-3 items-center text-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-sky-400/40 flex items-center justify-center text-sky-300 font-black text-sm">
                    A
                  </div>
                  <span className="text-xs font-black uppercase text-white">{upcomingFunMatch.teamAName}</span>
                </div>

                {upcomingFunMatch.teamAScore !== null && upcomingFunMatch.teamBScore !== null ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
                        {upcomingFunMatch.teamAScore}
                      </span>
                      <span className="text-sm font-bold text-slate-500">:</span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                        {upcomingFunMatch.teamBScore}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${upcomingFunMatch.status === 'finished'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : upcomingFunMatch.status === 'live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                      {upcomingFunMatch.status === 'finished' ? 'Full Time' : upcomingFunMatch.status === 'live' ? 'Live' : 'Skor'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-black text-sky-400 tracking-wider">VS</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Fun Match Internal</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-sm">
                    B
                  </div>
                  <span className="text-xs font-black uppercase text-white">{upcomingFunMatch.teamBName}</span>
                </div>
              </div>

              {/* DAFTAR PEMAIN YANG IKUT (CONFIRMED ATTENDANCE LIST) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    Daftar Pemain Ikut ({allConfirmedFunMatchPlayers.filter(p => p.status === 'CONFIRMED').length} Pemain)
                  </h3>
                  <span className="text-[11px] text-slate-400">Konfirmasi langsung oleh member</span>
                </div>

                {allConfirmedFunMatchPlayers.filter(p => p.status === 'CONFIRMED').length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
                    Belum ada member yang mengonfirmasi kehadiran. Jadilah yang pertama!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {allConfirmedFunMatchPlayers
                      .filter((p) => p.status === 'CONFIRMED')
                      .map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90"
                        >
                          <img
                            src={p.member?.photoUrl || '/defaultplayer.png'}
                            alt={p.playerName}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate block">
                                {p.member?.nickname || p.playerName}
                              </span>
                              <span className="text-[10px] font-black text-amber-400 shrink-0">
                                #{p.member?.jerseyNumber || 30}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-slate-800 text-sky-300">
                                {p.member?.position || 'MF'}
                              </span>
                              {p.assignedTeam && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${p.assignedTeam === 'TEAM_A' ? 'bg-blue-900/60 text-sky-300' : 'bg-amber-900/60 text-amber-300'
                                  }`}>
                                  {p.assignedTeam === 'TEAM_A' ? 'Tim A' : 'Tim B'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-2">
              <Calendar className="w-8 h-8 text-sky-400 mx-auto" />
              <h3 className="text-base font-bold text-white uppercase">Belum Ada Jadwal Fun Match Baru</h3>
              <p className="text-xs text-slate-400">Admin akan segera menjadwalkan fun match berikutnya. Pantau terus halaman ini!</p>
            </div>
          )}

          {/* RIWAYAT PENOLAKAN UNDANGAN TIM UTAMA (JIKA ADA) */}
          {declinedInvitations.length > 0 && (
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-red-500/30 bg-red-950/10 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Riwayat Penolakan Undangan Pertandingan Tim Utama
              </h3>
              <div className="space-y-2">
                {declinedInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">
                        Laga vs {inv.footballMatch?.opponentName || 'Lawan'}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {inv.footballMatch?.matchDate ? formatWibDate(inv.footballMatch.matchDate) : ''} • Alasan: {inv.declineReason || 'Tidak bersedia hadir'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      Ditolak
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. PUBLIC / NON-MEMBER PRICING & BENEFIT CARDS
         ───────────────────────────────────────────────────────────── */}
      {!member && (
        <div className="space-y-8">



          {/* UPCOMING FUN MATCH PREVIEW FOR VISITORS */}
          {upcomingFunMatch && (
            <div className="glass-panel p-4 sm:p-8 rounded-3xl border border-sky-400/40 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      Fun Match Mendatang
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatWibDate(upcomingFunMatch.matchDate, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })} • {formatWibTime(upcomingFunMatch.matchDate)}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                    {upcomingFunMatch.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    📍 {upcomingFunMatch.venue} • Durasi {upcomingFunMatch.duration || 60} Menit
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openRegisterWithTier('PRO')}
                    className="px-5 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Daftar Member untuk Ikut
                  </button>
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    Login
                  </button>
                </div>
              </div>

              {/* Match Card Preview (TIM A vs TIM B) */}
              <div className="p-4 sm:p-6 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-3 items-center text-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-sky-400/40 flex items-center justify-center text-sky-300 font-black text-sm">
                    A
                  </div>
                  <span className="text-xs font-black uppercase text-white">{upcomingFunMatch.teamAName}</span>
                </div>

                {upcomingFunMatch.teamAScore !== null && upcomingFunMatch.teamBScore !== null ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
                        {upcomingFunMatch.teamAScore}
                      </span>
                      <span className="text-sm font-bold text-slate-500">:</span>
                      <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                        {upcomingFunMatch.teamBScore}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 ${upcomingFunMatch.status === 'finished'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : upcomingFunMatch.status === 'live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                      {upcomingFunMatch.status === 'finished' ? 'Full Time' : upcomingFunMatch.status === 'live' ? 'Live' : 'Skor'}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-xl sm:text-2xl font-black text-sky-400 tracking-wider">VS</span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Fun Match Internal</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-400/40 flex items-center justify-center text-amber-300 font-black text-sm">
                    B
                  </div>
                  <span className="text-xs font-black uppercase text-white">{upcomingFunMatch.teamBName}</span>
                </div>
              </div>

              {/* DAFTAR PEMAIN YANG IKUT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" />
                    Daftar Pemain Ikut ({allConfirmedFunMatchPlayers.filter(p => p.status === 'CONFIRMED').length} Pemain)
                  </h3>
                  <span className="text-[11px] text-slate-400">Konfirmasi langsung oleh member</span>
                </div>

                {allConfirmedFunMatchPlayers.filter(p => p.status === 'CONFIRMED').length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
                    Belum ada member yang mengonfirmasi kehadiran.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {allConfirmedFunMatchPlayers
                      .filter((p) => p.status === 'CONFIRMED')
                      .map((p, idx) => (
                        <div
                          key={p.id || idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90"
                        >
                          <img
                            src={p.member?.photoUrl || '/defaultplayer.png'}
                            alt={p.playerName}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold text-white truncate block">
                                {p.member?.nickname || p.playerName}
                              </span>
                              <span className="text-[10px] font-black text-amber-400 shrink-0">
                                #{p.member?.jerseyNumber || 30}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-slate-800 text-sky-300">
                                {p.member?.position || 'MF'}
                              </span>
                              {p.assignedTeam && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${p.assignedTeam === 'TEAM_A' ? 'bg-blue-900/60 text-sky-300' : 'bg-amber-900/60 text-amber-300'
                                  }`}>
                                  {p.assignedTeam === 'TEAM_A' ? 'Tim A' : 'Tim B'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-sky-400">
              PILIHAN PAKET KEANGGOTAAN
            </span>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white">
              Pilih Paket Membership Komunitas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Dapatkan akses fun match rutin mingguan, nomor punggung eksklusif, serta peluang promosi ke Skuad Utama Mariners SC.
            </p>
          </div>

          {/* 3 PRICING CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

            {/* 1. FAN TIER */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider">
                    FAN PASS
                  </span>
                  <Award className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">FAN MEMBER</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">Rp 15.000</span>
                    <span className="text-xs text-slate-400">/ pertandingan</span>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Ikut 1x pertandingan Fun Match di hari Minggu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Akses masuk Grup WhatsApp resmi komunitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Profil & nomor punggung masuk web member</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mendapatkan catatan statistik pribadi member</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openRegisterWithTier('FAN')}
                className="mt-6 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold uppercase text-xs transition-all"
              >
                Pilih Paket FAN
              </button>
            </div>

            {/* 2. PRO TIER (RECOMMENDED) */}
            <div className="glass-panel p-6 rounded-3xl border-2 border-sky-400/70 bg-gradient-to-b from-blue-950/50 to-slate-900 flex flex-col justify-between shadow-2xl shadow-sky-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 text-slate-950 font-black text-[9px] uppercase tracking-widest shadow-md">
                PALING POPULER
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider">
                    PRO PASS
                  </span>
                  <Flame className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">PRO MEMBER</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-sky-300">Rp 49.000</span>
                    <span className="text-xs text-slate-400">/ bulan (30 hari)</span>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-200 pt-3 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Ikut pertandingan Fun Match tiap minggu selama 1 bulan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span><strong>Bisa terpilih ikut uji tanding Skuad Utama</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Akses masuk Grup WhatsApp resmi komunitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Profil & nomor punggung masuk web member</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>Mendapatkan statistik lengkap member</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openRegisterWithTier('PRO')}
                className="mt-6 w-full py-3.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
              >
                Pilih Paket PRO
              </button>
            </div>

            {/* 3. ELITE TIER */}
            <div className="glass-panel p-6 rounded-3xl border border-amber-400/50 bg-gradient-to-b from-amber-950/20 to-slate-900 flex flex-col justify-between hover:border-amber-400 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                    ELITE PASS (6 BULAN)
                  </span>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase text-white">ELITE MEMBER</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl sm:text-3xl font-black text-amber-300">Rp 399.000</span>
                    <span className="text-xs text-slate-400">/ 6 bulan</span>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Ikut pertandingan Fun Match tiap minggu selama 6 bulan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Bonus 1 Set Jersey Komunitas + Stiker Eksklusif</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Prioritas terpilih masuk Skuad Aktif Utama</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Akses Grup WhatsApp Skuad Utama (jika terpilih)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>Profil masuk web Skuad Utama & statistik pribadi</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => openRegisterWithTier('ELITE')}
                className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Pilih Paket ELITE
              </button>
            </div>

          </div>

        </div>
      )}



      {/* MODALS */}
      <CommunityRegistrationModal
        isOpen={registerModalOpen}
        initialTier={selectedTier}
        onClose={() => setRegisterModalOpen(false)}
        onOpenLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
        onSuccess={(submittedMember) => {
          setRegisterModalOpen(false);
          setMessage({
            type: 'success',
            text: `Pendaftaran berhasil terkirim! Bukti pembayaran Anda sedang diverifikasi oleh admin (maksimal 1x24 jam). Akun & kata sandi akan dikonfirmasi via WhatsApp.`,
          });
          router.refresh();
        }}
      />

      <CommunityLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(loggedInMember) => {
          setMember(loggedInMember);
          setMessage({
            type: 'success',
            text: `Selamat datang kembali, ${loggedInMember.fullName}!`,
          });
          router.refresh();
        }}
        onOpenRegister={() => openRegisterWithTier('PRO')}
      />

    </div>
  );
}
