'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Plus, Trash2, Users, Activity,
  CheckCircle2, Clock, MapPin, Shield, Trophy, Loader2,
  AlertCircle, ChevronRight, UserCheck, Play, Sparkles,
  Edit, X
} from 'lucide-react';
import { formatWibDate, formatWibTime, formatDateForInput } from '@/lib/date';

interface AttendanceItem {
  id: string;
  memberId: string | null;
  playerId: string | null;
  playerType: string;
  playerName: string;
  status: string;
  assignedTeam: string | null;
  member?: {
    id: string;
    fullName: string;
    nickname: string | null;
    photoUrl: string | null;
    jerseyNumber: number;
    position: string;
  };
}

interface EventItem {
  id: string;
  team: string;
  type: string;
  minute: number;
  description: string | null;
  memberId: string | null;
  playerName: string | null;
  member?: {
    fullName: string;
    jerseyNumber: number;
  };
}

interface FunMatch {
  id: string;
  title: string;
  matchDate: string;
  venue: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number | null;
  teamBScore: number | null;
  status: string;
  duration: number;
  summary: string | null;
  attendances: AttendanceItem[];
  events: EventItem[];
}

export default function AdminFunMatchOptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [funMatch, setFunMatch] = useState<FunMatch | null>(null);
  const [allActiveMembers, setAllActiveMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);

  // Score Box Form
  const [teamAScore, setTeamAScore] = useState<string>('');
  const [teamBScore, setTeamBScore] = useState<string>('');
  const [status, setStatus] = useState<string>('scheduled');
  const [duration, setDuration] = useState<number>(60);
  const [summary, setSummary] = useState<string>('');

  // Edit Match Info Modal State
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editTeamAName, setEditTeamAName] = useState('');
  const [editTeamBName, setEditTeamBName] = useState('');
  const [editDuration, setEditDuration] = useState(60);
  const [editStatus, setEditStatus] = useState('scheduled');
  const [savingInfo, setSavingInfo] = useState(false);

  // Add Member to Match Manual
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState<string>('');
  const [assignTeamToAdd, setAssignTeamToAdd] = useState<string>('');

  // Add Event Form
  const [eventTeam, setEventTeam] = useState<'TEAM_A' | 'TEAM_B'>('TEAM_A');
  const [eventType, setEventType] = useState<'goal' | 'assist' | 'yellow_card' | 'red_card'>('goal');
  const [eventMinute, setEventMinute] = useState<number>(10);
  const [eventMemberId, setEventMemberId] = useState<string>('');
  const [eventDesc, setEventDesc] = useState<string>('');
  const [addingEvent, setAddingEvent] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMatch, resMembers] = await Promise.all([
        fetch(`/api/admin/fun-matches/${id}`),
        fetch('/api/admin/members?status=ACTIVE'),
      ]);

      const dataMatch = await resMatch.json();
      const dataMembers = await resMembers.json();

      if (dataMatch.funMatch) {
        const m = dataMatch.funMatch;
        setFunMatch(m);
        setTeamAScore(m.teamAScore !== null ? String(m.teamAScore) : '');
        setTeamBScore(m.teamBScore !== null ? String(m.teamBScore) : '');
        setStatus(m.status || 'scheduled');
        setDuration(m.duration || 60);
        setSummary(m.summary || '');
      }

      if (dataMembers.members) {
        setAllActiveMembers(dataMembers.members);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Info Modal
  const openEditInfoModal = () => {
    if (!funMatch) return;
    setEditTitle(funMatch.title);
    setEditMatchDate(formatDateForInput(funMatch.matchDate));
    setEditVenue(funMatch.venue);
    setEditTeamAName(funMatch.teamAName);
    setEditTeamBName(funMatch.teamBName);
    setEditDuration(funMatch.duration || 60);
    setEditStatus(funMatch.status || 'scheduled');
    setEditInfoModalOpen(true);
  };

  // Save Edit Info
  const handleSaveMatchInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !editMatchDate) return;
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          matchDate: editMatchDate,
          venue: editVenue,
          teamAName: editTeamAName,
          teamBName: editTeamBName,
          duration: editDuration,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah info pertandingan');
      setAlertMsg({ type: 'success', text: 'Informasi pertandingan berhasil diperbarui!' });
      setEditInfoModalOpen(false);
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingInfo(false);
    }
  };

  // Delete Match
  const handleDeleteFunMatch = async () => {
    if (!funMatch) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus pertandingan "${funMatch.title}"? Data lineup dan event statistik pertandingan ini akan dihapus permanen.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pertandingan');
      router.push('/admin/members');
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus' });
    }
  };

  // 1. Save Scores & Info
  const handleSaveScoreAndInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingScore(true);
    setAlertMsg(null);

    try {
      const res = await fetch(`/api/admin/fun-matches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamAScore: teamAScore !== '' ? parseInt(teamAScore) : null,
          teamBScore: teamBScore !== '' ? parseInt(teamBScore) : null,
          status,
          duration,
          summary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan skor');

      setAlertMsg({ type: 'success', text: 'Skor dan status pertandingan berhasil disimpan!' });
      loadData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingScore(false);
    }
  };

  // 2. Assign Player to Team A / Team B / Pool
  const handleAssignTeam = async (attendanceId: string, targetTeam: 'TEAM_A' | 'TEAM_B' | null) => {
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_TEAM',
          attendanceId,
          assignedTeam: targetTeam,
        }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Add Member Manual
  const handleAddMemberToMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberToAdd) return;

    try {
      const res = await fetch(`/api/admin/fun-matches/${id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_MEMBER_TO_MATCH',
          memberId: selectedMemberToAdd,
          assignedTeam: assignTeamToAdd || null,
        }),
      });
      if (res.ok) {
        setSelectedMemberToAdd('');
        setAssignTeamToAdd('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Remove Attendance
  const handleRemoveAttendance = async (attendanceId: string) => {
    if (!confirm('Hapus pemain ini dari pertandingan?')) return;
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REMOVE_ATTENDANCE',
          attendanceId,
        }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Add Event (Goal, Assist, Card)
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingEvent(true);
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_EVENT',
          team: eventTeam,
          type: eventType,
          minute: eventMinute,
          memberId: eventMemberId || null,
          description: eventDesc,
        }),
      });
      if (res.ok) {
        setEventDesc('');
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingEvent(false);
    }
  };

  // 6. Delete Event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_EVENT',
          eventId,
        }),
      });
      if (res.ok) loadData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !funMatch) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
        Memuat data match option fun match...
      </div>
    );
  }

  const confirmedAttendees = funMatch.attendances.filter((a) => a.status === 'CONFIRMED');
  const teamAPlayers = confirmedAttendees.filter((a) => a.assignedTeam === 'TEAM_A');
  const teamBPlayers = confirmedAttendees.filter((a) => a.assignedTeam === 'TEAM_B');
  const poolPlayers = confirmedAttendees.filter((a) => !a.assignedTeam);

  const teamAEvents = funMatch.events.filter((e) => e.team === 'TEAM_A');
  const teamBEvents = funMatch.events.filter((e) => e.team === 'TEAM_B');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/members"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Kelola Member
        </Link>
        <Link
          href={`/community/matches/${funMatch.id}`}
          target="_blank"
          className="text-xs font-bold text-sky-400 hover:underline"
        >
          Lihat Halaman Publik ↗
        </Link>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{alertMsg.text}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BOX 1: MATCHDAY INFO & INPUT SKOR (TIM A vs TIM B)
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
              BOX 1: MATCH OPTION & SKOR
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-0.5">
              {funMatch.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatWibDate(funMatch.matchDate)} • {formatWibTime(funMatch.matchDate)} • 📍 {funMatch.venue} • Durasi {funMatch.duration || 60} Menit
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
              status === 'finished'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : status === 'live'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
            }`}>
              Status: {status}
            </span>
            <button
              type="button"
              onClick={openEditInfoModal}
              className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Info Laga</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteFunMatch}
              className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Laga</span>
            </button>
          </div>
        </div>

        {/* Score Form */}
        <form onSubmit={handleSaveScoreAndInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-950/80 p-4 sm:p-6 rounded-2xl border border-slate-800">
            
            {/* Team A Score */}
            <div className="text-center space-y-2">
              <label className="block text-xs font-black uppercase text-sky-300">
                Skor {funMatch.teamAName}
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                className="w-24 mx-auto py-2 text-2xl font-black text-center rounded-xl bg-slate-900 border border-sky-500/50 text-white focus:outline-hidden focus:border-sky-400"
              />
            </div>

            {/* Center Status & Duration */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                  Status Pertandingan
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-center focus:outline-hidden focus:border-sky-400"
                >
                  <option value="scheduled">Jadwal Mendatang (Scheduled)</option>
                  <option value="live">Sedang Berlangsung (LIVE)</option>
                  <option value="finished">Pertandingan Selesai (Full Time)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 text-center">
                  Durasi Pertandingan (Menit)
                </label>
                <input
                  type="number"
                  min="30"
                  max="120"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-1.5 text-xs text-center rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                />
              </div>
            </div>

            {/* Team B Score */}
            <div className="text-center space-y-2">
              <label className="block text-xs font-black uppercase text-amber-300">
                Skor {funMatch.teamBName}
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                className="w-24 mx-auto py-2 text-2xl font-black text-center rounded-xl bg-slate-900 border border-amber-500/50 text-white focus:outline-hidden focus:border-amber-400"
              />
            </div>

          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingScore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-blue-600" />
              {savingScore ? 'Menyimpan Skor...' : 'Simpan Skor & Status'}
            </button>
          </div>
        </form>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOX 2: DAFTAR PEMAIN YANG IKUT (CONFIRMED DARI WEB PORTAL)
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
              BOX 2: POOL PEMAIN IKUT
            </span>
            <h2 className="text-base sm:text-lg font-black uppercase text-white">
              Daftar Pemain Konfirmasi Ikut ({confirmedAttendees.length} Pemain)
            </h2>
            <p className="text-xs text-slate-400">
              Pemain yang telah klik &quot;IKUT&quot; di portal web member. Geser pemain ke Tim A atau Tim B.
            </p>
          </div>

          {/* Form Tambah Manual oleh Admin */}
          <form onSubmit={handleAddMemberToMatch} className="flex items-center gap-2">
            <select
              value={selectedMemberToAdd}
              onChange={(e) => setSelectedMemberToAdd(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
            >
              <option value="">+ Tambah Member Manual...</option>
              {allActiveMembers
                .filter((m) => !confirmedAttendees.some((a) => a.memberId === m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} (#{m.jerseyNumber} - {m.position})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={!selectedMemberToAdd}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold disabled:opacity-40"
            >
              Tambah
            </button>
          </form>
        </div>

        {/* Pool List */}
        {confirmedAttendees.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4 text-center">
            Belum ada member yang konfirmasi hadir di pertandingan ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {confirmedAttendees.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={p.member?.photoUrl || '/defaultplayer.png'}
                    alt={p.playerName}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate block">
                        {p.member?.nickname || p.playerName}
                      </span>
                      <span className="text-[10px] font-black text-amber-400">
                        #{p.member?.jerseyNumber || 30}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-slate-800 text-sky-300">
                      {p.member?.position || 'MF'}
                    </span>
                  </div>
                </div>

                {/* Team Placement Actions */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                  <button
                    onClick={() => handleAssignTeam(p.id, 'TEAM_A')}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                      p.assignedTeam === 'TEAM_A'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-900 text-sky-300 hover:bg-blue-950'
                    }`}
                  >
                    Tim A
                  </button>
                  <button
                    onClick={() => handleAssignTeam(p.id, 'TEAM_B')}
                    className={`flex-1 py-1 rounded-lg font-bold transition-all ${
                      p.assignedTeam === 'TEAM_B'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-900 text-amber-300 hover:bg-amber-950'
                    }`}
                  >
                    Tim B
                  </button>
                  <button
                    onClick={() => handleRemoveAttendance(p.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400"
                    title="Keluarkan dari match"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOX 3 & 4 (2 BOX LINEUP): LINEUP TIM A & LINEUP TIM B
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 3: Lineup Tim A */}
        <div className="glass-panel p-6 rounded-3xl border border-blue-500/30 bg-blue-950/10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                BOX 3: LINEUP TIM A
              </span>
              <h3 className="text-base font-black uppercase text-white">
                {funMatch.teamAName} ({teamAPlayers.length} Pemain)
              </h3>
            </div>
            <span className="w-8 h-8 rounded-xl bg-blue-900/80 border border-sky-400/40 flex items-center justify-center font-black text-sky-300 text-xs">
              A
            </span>
          </div>

          {teamAPlayers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Belum ada pemain di Tim A. Klik tombol &quot;Tim A&quot; pada daftar pemain ikut di atas.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {teamAPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}</span>
                    <img
                      src={p.member?.photoUrl || '/defaultplayer.png'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {p.member?.fullName || p.playerName}
                      </span>
                      <span className="text-[9px] text-sky-400 font-bold uppercase">
                        #{p.member?.jerseyNumber || 30} • {p.member?.position || 'MF'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignTeam(p.id, null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-400 px-2 py-1 rounded-md bg-slate-900"
                  >
                    Lepas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 4: Lineup Tim B */}
        <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                BOX 4: LINEUP TIM B
              </span>
              <h3 className="text-base font-black uppercase text-white">
                {funMatch.teamBName} ({teamBPlayers.length} Pemain)
              </h3>
            </div>
            <span className="w-8 h-8 rounded-xl bg-amber-900/80 border border-amber-400/40 flex items-center justify-center font-black text-amber-300 text-xs">
              B
            </span>
          </div>

          {teamBPlayers.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              Belum ada pemain di Tim B. Klik tombol &quot;Tim B&quot; pada daftar pemain ikut di atas.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {teamBPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 font-mono text-xs w-4">{idx + 1}</span>
                    <img
                      src={p.member?.photoUrl || '/defaultplayer.png'}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-slate-900 border border-slate-700"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {p.member?.fullName || p.playerName}
                      </span>
                      <span className="text-[9px] text-amber-400 font-bold uppercase">
                        #{p.member?.jerseyNumber || 30} • {p.member?.position || 'MF'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignTeam(p.id, null)}
                    className="text-[10px] font-bold text-slate-400 hover:text-red-400 px-2 py-1 rounded-md bg-slate-900"
                  >
                    Lepas
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOX 5 & 6 (2 BOX EVENT SUMMARY): EVENT TIM A & EVENT TIM B
         ───────────────────────────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-sky-400">
            BOX 5 & 6: EVENT SUMMARY PERTANDINGAN
          </span>
          <h2 className="text-base sm:text-lg font-black uppercase text-white mt-0.5">
            Catatan Event (Gol, Assist, Kartu)
          </h2>
          <p className="text-xs text-slate-400">
            Input gol atau kartu untuk masing-masing tim. Statistik otomatis masuk ke profil member.
          </p>
        </div>

        {/* Quick Add Event Form */}
        <form onSubmit={handleAddEvent} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Pilih Tim</label>
            <select
              value={eventTeam}
              onChange={(e) => setEventTeam(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
            >
              <option value="TEAM_A">Tim A ({funMatch.teamAName})</option>
              <option value="TEAM_B">Tim B ({funMatch.teamBName})</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Jenis Event</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
            >
              <option value="goal">⚽ Gol</option>
              <option value="assist">👟 Assist</option>
              <option value="yellow_card">🟨 Kartu Kuning</option>
              <option value="red_card">🟥 Kartu Merah</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Menit Ke</label>
            <input
              type="number"
              min="1"
              max="120"
              value={eventMinute}
              onChange={(e) => setEventMinute(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-bold"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Pemain Terkait</label>
            <select
              value={eventMemberId}
              onChange={(e) => setEventMemberId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
            >
              <option value="">-- Pilih Pemain --</option>
              {(eventTeam === 'TEAM_A' ? teamAPlayers : teamBPlayers).map((p) => (
                <option key={p.id} value={p.memberId || ''}>
                  {p.member?.fullName || p.playerName} (#{p.member?.jerseyNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="self-end pt-4">
            <button
              type="submit"
              disabled={addingEvent}
              className="px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md"
            >
              {addingEvent ? 'Menyimpan...' : '+ Tambah Event'}
            </button>
          </div>
        </form>

        {/* 2 Event List Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Event Tim A Box */}
          <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-sky-400">
              Event {funMatch.teamAName} ({teamAEvents.length})
            </h4>
            {teamAEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Belum ada catatan event.</p>
            ) : (
              <div className="space-y-2">
                {teamAEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky-400 font-bold">{e.minute}&apos;</span>
                      <span className="font-bold text-white">
                        {e.type === 'goal' && '⚽ Gol:'}
                        {e.type === 'assist' && '👟 Assist:'}
                        {e.type === 'yellow_card' && '🟨 Kartu Kuning:'}
                        {e.type === 'red_card' && '🟥 Kartu Merah:'}
                      </span>
                      <span className="text-slate-300">{e.member?.fullName || e.playerName || 'Pemain'}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Tim B Box */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-black uppercase text-amber-400">
              Event {funMatch.teamBName} ({teamBEvents.length})
            </h4>
            {teamBEvents.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">Belum ada catatan event.</p>
            ) : (
              <div className="space-y-2">
                {teamBEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-bold">{e.minute}&apos;</span>
                      <span className="font-bold text-white">
                        {e.type === 'goal' && '⚽ Gol:'}
                        {e.type === 'assist' && '👟 Assist:'}
                        {e.type === 'yellow_card' && '🟨 Kartu Kuning:'}
                        {e.type === 'red_card' && '🟥 Kartu Merah:'}
                      </span>
                      <span className="text-slate-300">{e.member?.fullName || e.playerName || 'Pemain'}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      className="text-slate-500 hover:text-red-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ─── MODAL: EDIT INFO PERTANDINGAN FUN MATCH ─── */}
      {editInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white">
                Edit Informasi Fun Match
              </h3>
              <button
                onClick={() => setEditInfoModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMatchInfo} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Judul Laga *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Tanggal &amp; Waktu (WIB) *</label>
                <input
                  type="datetime-local"
                  required
                  value={editMatchDate}
                  onChange={(e) => setEditMatchDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Lokasi / Venue *</label>
                <input
                  type="text"
                  required
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Tim A</label>
                  <input
                    type="text"
                    value={editTeamAName}
                    onChange={(e) => setEditTeamAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Tim B</label>
                  <input
                    type="text"
                    value={editTeamBName}
                    onChange={(e) => setEditTeamBName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Durasi Pertandingan (Menit)</label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Pertandingan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="scheduled">Terjadwal (Scheduled)</option>
                    <option value="live">Sedang Berlangsung (Live)</option>
                    <option value="finished">Selesai (Finished)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditInfoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="px-6 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black uppercase shadow disabled:opacity-50 cursor-pointer"
                >
                  {savingInfo ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
