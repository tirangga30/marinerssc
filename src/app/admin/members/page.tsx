'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Filter, Shield, Award, Flame,
  Edit, Trash2, CheckCircle2, XCircle, AlertCircle,
  Crown, Shuffle, Key, Eye, EyeOff, Loader2, ArrowRight,
  Calendar, Clock, MapPin, Check, ChevronRight, UserPlus
} from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';

interface Member {
  id: string;
  memberCode: string;
  password: string;
  fullName: string;
  nickname: string | null;
  origin: string;
  phone: string;
  photoUrl: string | null;
  position: string;
  altPosition: string | null;
  jerseyNumber: number;
  tier: string;
  status: string;
  isPermanent: boolean;
  playerId: string | null;
  createdAt: string;
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
  attendances?: any[];
}

export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'FUN_MATCHES'>('MEMBERS');
  const [members, setMembers] = useState<Member[]>([]);
  const [funMatches, setFunMatches] = useState<FunMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Password visibility map
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Member Modal State
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPosition, setFormPosition] = useState('MF');
  const [formAltPosition, setFormAltPosition] = useState('');
  const [formJerseyNumber, setFormJerseyNumber] = useState<number>(30);
  const [formTier, setFormTier] = useState('FAN');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formPassword, setFormPassword] = useState('');
  const [savingMember, setSavingMember] = useState(false);

  // Promote to Squad Modal State
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promotingMember, setPromotingMember] = useState<Member | null>(null);
  const [promoteJerseyNumber, setPromoteJerseyNumber] = useState<number>(30);
  const [promotingLoading, setPromotingLoading] = useState(false);

  // Fun Match Modal State
  const [funMatchModalOpen, setFunMatchModalOpen] = useState(false);
  const [matchTitle, setMatchTitle] = useState('Fun Match Weekly');
  const [matchDate, setMatchDate] = useState('');
  const [matchVenue, setMatchVenue] = useState('Stadion Gelora Samudra, Jakarta');
  const [teamAName, setTeamAName] = useState('TIM A (NAVY)');
  const [teamBName, setTeamBName] = useState('TIM B (GOLD)');
  const [matchDuration, setMatchDuration] = useState(60);
  const [savingFunMatch, setSavingFunMatch] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, tierFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch members
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.set('status', statusFilter);
      if (tierFilter !== 'ALL') query.set('tier', tierFilter);
      if (search) query.set('search', search);

      const [resMembers, resFunMatches] = await Promise.all([
        fetch(`/api/admin/members?${query.toString()}`),
        fetch('/api/admin/fun-matches'),
      ]);

      const dataMembers = await resMembers.json();
      const dataFunMatches = await resFunMatches.json();

      if (dataMembers.members) setMembers(dataMembers.members);
      if (dataFunMatches.funMatches) setFunMatches(dataFunMatches.funMatches);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const openAddMemberModal = () => {
    setEditingMember(null);
    setFormFullName('');
    setFormNickname('');
    setFormOrigin('');
    setFormPhone('');
    setFormPosition('MF');
    setFormAltPosition('');
    const random = Math.floor(Math.random() * (99 - 30 + 1)) + 30;
    setFormJerseyNumber(random);
    setFormTier('FAN');
    setFormStatus('ACTIVE');
    setFormPassword('mariners2026');
    setMemberModalOpen(true);
  };

  const openEditMemberModal = (m: Member) => {
    setEditingMember(m);
    setFormFullName(m.fullName);
    setFormNickname(m.nickname || '');
    setFormOrigin(m.origin);
    setFormPhone(m.phone);
    setFormPosition(m.position);
    setFormAltPosition(m.altPosition || '');
    setFormJerseyNumber(m.jerseyNumber);
    setFormTier(m.tier);
    setFormStatus(m.status);
    setFormPassword(m.password);
    setMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMember(true);
    setAlertMsg(null);

    try {
      const url = editingMember ? `/api/admin/members/${editingMember.id}` : '/api/admin/members';
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formFullName,
          nickname: formNickname,
          origin: formOrigin,
          phone: formPhone,
          position: formPosition,
          altPosition: formAltPosition,
          jerseyNumber: formJerseyNumber,
          tier: formTier,
          status: formStatus,
          password: formPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan member');

      setAlertMsg({
        type: 'success',
        text: editingMember ? 'Data member berhasil diperbarui' : 'Member baru berhasil ditambahkan',
      });
      setMemberModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingMember(false);
    }
  };

  const toggleMemberStatus = async (m: Member) => {
    const newStatus = m.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/members/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Status member ${m.fullName} diubah menjadi ${newStatus}. (Data tetap tersimpan rapi sebagai arsip)`,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openPromoteModal = (m: Member) => {
    setPromotingMember(m);
    setPromoteJerseyNumber(m.jerseyNumber);
    setPromoteModalOpen(true);
  };

  const handlePromoteToSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingMember) return;
    setPromotingLoading(true);
    setAlertMsg(null);

    try {
      const res = await fetch(`/api/admin/members/${promotingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedNumber: promoteJerseyNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menarik ke skuad utama');

      setAlertMsg({
        type: 'success',
        text: data.message || 'Berhasil ditarik ke Skuad Utama!',
      });
      setPromoteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setPromotingLoading(false);
    }
  };

  const handleCreateFunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingFunMatch(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/admin/fun-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: matchTitle,
          matchDate,
          venue: matchVenue,
          teamAName,
          teamBName,
          duration: matchDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat fun match');

      setAlertMsg({
        type: 'success',
        text: 'Jadwal Fun Match baru berhasil dibuat! Member sekarang bisa RSVP ikut di portal web.',
      });
      setFunMatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingFunMatch(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30">
              Admin Community Panel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
            Kelola Member & Soccer Community
          </h1>
          <p className="text-xs text-slate-400">
            Kelola database member, akun login, penarikan ke skuad utama, serta jadwal Fun Match komunitas.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'MEMBERS'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Data Member ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('FUN_MATCHES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'FUN_MATCHES'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Fun Matches ({funMatches.length})
          </button>
        </div>
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
          TAB 1: DATA MEMBER KOMUNITAS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 glass-panel p-4 rounded-2xl border border-slate-800">
            
            {/* Search & Filters */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, ID, asal..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Non-Aktif (Arsip)</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
              >
                <option value="ALL">Semua Tier</option>
                <option value="FAN">FAN</option>
                <option value="PRO">PRO</option>
                <option value="ELITE">ELITE</option>
              </select>

              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                Cari
              </button>
            </form>

            {/* Add Member Button */}
            <button
              onClick={openAddMemberModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md shadow-sky-500/10 w-full md:w-auto justify-center"
            >
              <UserPlus className="w-4 h-4 text-blue-600" />
              Tambah Member Manual
            </button>
          </div>

          {/* Members Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                Memuat data member...
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Tidak ada data member yang sesuai filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">ID & Password</th>
                      <th className="p-3.5">No & Posisi</th>
                      <th className="p-3.5">Tier</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => {
                      const isPwdVisible = showPassword[m.id];
                      return (
                        <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                          
                          {/* Member Photo & Name */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.photoUrl || '/defaultplayer.png'}
                                alt={m.fullName}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">{m.fullName}</span>
                                  {m.isPermanent && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                                      Skuad Utama
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400">
                                  {m.phone} • {m.origin}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* ID & Password */}
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-sky-400 block">{m.memberCode}</span>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span>{isPwdVisible ? m.password : '••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => setShowPassword(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                {isPwdVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* No & Posisi */}
                          <td className="p-3.5">
                            <span className="font-black text-amber-400 text-sm block">#{m.jerseyNumber}</span>
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-800 text-sky-300 inline-block mt-0.5">
                              {m.position} {m.altPosition ? `/${m.altPosition}` : ''}
                            </span>
                          </td>

                          {/* Tier */}
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              m.tier === 'ELITE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : m.tier === 'PRO'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                            }`}>
                              {m.tier}
                            </span>
                          </td>

                          {/* Status & Non-aktif toggle */}
                          <td className="p-3.5">
                            <button
                              onClick={() => toggleMemberStatus(m)}
                              title="Klik untuk ubah status aktif/non-aktif (data tidak dihapus)"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                m.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {m.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif (Arsip)'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right space-x-1.5">
                            {!m.isPermanent ? (
                              <button
                                onClick={() => openPromoteModal(m)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-sm transition-all"
                              >
                                Tarik ke Skuad Utama
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-bold px-2 py-1">
                                ✓ Skuad Utama
                              </span>
                            )}

                            <button
                              onClick={() => openEditMemberModal(m)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors inline-block align-middle"
                              title="Edit data member"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: KELOLA FUN MATCH KOMUNITAS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'FUN_MATCHES' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase text-white">Jadwal Fun Match Soccer Community</h3>
              <p className="text-[11px] text-slate-400">Buat jadwal baru dan atur skor serta lineup 2 tim (Tim A vs Tim B).</p>
            </div>
            <button
              onClick={() => {
                setMatchDate('');
                setFunMatchModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md shadow-sky-500/10"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              Buat Fun Match Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funMatches.length === 0 ? (
              <div className="col-span-2 glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400 text-xs space-y-2">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
                <p>Belum ada jadwal fun match. Klik tombol di atas untuk membuat yang pertama!</p>
              </div>
            ) : (
              funMatches.map((fm) => (
                <div
                  key={fm.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-400/40 transition-all space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs">
                    <span className="font-bold text-white uppercase">{fm.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      fm.status === 'finished' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    }`}>
                      {fm.status === 'finished' ? 'Selesai' : 'Mendatang'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 items-center text-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="text-xs font-black text-white">{fm.teamAName}</div>
                    <div className="text-lg font-black text-amber-400">
                      {fm.teamAScore !== null && fm.teamBScore !== null ? `${fm.teamAScore} - ${fm.teamBScore}` : 'VS'}
                    </div>
                    <div className="text-xs font-black text-white">{fm.teamBName}</div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <p>📅 {formatWibDate(fm.matchDate)} • {formatWibTime(fm.matchDate)} WIB</p>
                    <p>📍 {fm.venue} ({fm.duration} Menit)</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/community/matches/${fm.id}`}
                      target="_blank"
                      className="text-[11px] text-slate-400 hover:text-sky-300 font-bold"
                    >
                      Lihat Halaman Publik ↗
                    </Link>
                    <Link
                      href={`/admin/members/fun-match/${fm.id}`}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase transition-all shadow-md shadow-sky-500/20"
                    >
                      Atur Match Option & Lineup
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT MEMBER
         ───────────────────────────────────────────────────────────── */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-sky-400/40 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <h3 className="text-base font-black uppercase text-white">
              {editingMember ? 'Edit Data Member' : 'Tambah Member Komunitas Manual'}
            </h3>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Asal / Domisili *</label>
                  <input
                    type="text"
                    required
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">No WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Posisi Utama</label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  >
                    <option value="FW">Forward (FW)</option>
                    <option value="MF">Midfielder (MF)</option>
                    <option value="DF">Defender (DF)</option>
                    <option value="GK">Goalkeeper (GK)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">No Punggung (30-99)</label>
                  <input
                    type="number"
                    min="30"
                    max="99"
                    value={formJerseyNumber}
                    onChange={(e) => setFormJerseyNumber(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tier Membership</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  >
                    <option value="FAN">FAN</option>
                    <option value="PRO">PRO</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Kata Sandi Login Member *</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Status Member</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Non-Aktif (Arsip)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="px-5 py-2 rounded-xl white-blue-btn font-extrabold uppercase disabled:opacity-50"
                >
                  {savingMember ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PROMOTE TO SQUAD UTAMA
         ───────────────────────────────────────────────────────────── */}
      {promoteModalOpen && promotingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white">Tarik ke Skuad Utama</h3>
                <p className="text-xs text-amber-300">{promotingMember.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Member ini akan dipromosikan menjadi pemain resmi di <strong>Skuad Utama Mariners SC</strong>. Profilnya akan muncul di halaman Skuad Tim utama dan dapat dimainkan di seluruh pertandingan resmi.
            </p>

            <form onSubmit={handlePromoteToSquad} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Sesuaikan Nomor Punggung di Skuad Utama:
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={promoteJerseyNumber}
                  onChange={(e) => setPromoteJerseyNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-sm focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={promotingLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black uppercase disabled:opacity-50"
                >
                  {promotingLoading ? 'Memproses...' : 'Konfirmasi Promosi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CREATE FUN MATCH
         ───────────────────────────────────────────────────────────── */}
      {funMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-black uppercase text-white">Buat Jadwal Fun Match Baru</h3>

            <form onSubmit={handleCreateFunMatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Judul Pertandingan *</label>
                <input
                  type="text"
                  required
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  placeholder="Contoh: Weekly Fun Match #12"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Tanggal & Waktu WIB *</label>
                  <input
                    type="datetime-local"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Durasi (Menit)</label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lokasi / Venue *</label>
                <input
                  type="text"
                  required
                  value={matchVenue}
                  onChange={(e) => setMatchVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Tim A</label>
                  <input
                    type="text"
                    required
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Tim B</label>
                  <input
                    type="text"
                    required
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFunMatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFunMatch}
                  className="px-5 py-2 rounded-xl white-blue-btn font-extrabold uppercase disabled:opacity-50"
                >
                  {savingFunMatch ? 'Membuat...' : 'Buat Fun Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
