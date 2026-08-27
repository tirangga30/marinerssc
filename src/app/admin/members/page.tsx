'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Filter, Shield, Award, Flame,
  Edit, Trash2, CheckCircle2, XCircle, AlertCircle,
  Crown, Shuffle, Key, Eye, EyeOff, Loader2, ArrowRight,
  Calendar, Clock, MapPin, Check, ChevronRight, UserPlus,
  MessageCircle, FileText, ExternalLink, Image as ImageIcon,
  Sparkles, X
} from 'lucide-react';
import { formatWibDate, formatWibTime, formatDateForInput } from '@/lib/date';

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
  status: string; // ACTIVE, INACTIVE, PENDING
  paymentProof: string | null;
  paymentStatus: string; // PENDING, VERIFIED, REJECTED
  isPermanent: boolean;
  expiresAt: string | null;
  joinedAt?: string;
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

  // Payment Proof Modal State
  const [previewProof, setPreviewProof] = useState<{ url: string; memberName: string } | null>(null);

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
  const [formPaymentStatus, setFormPaymentStatus] = useState('VERIFIED');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // Promote to Squad Modal State
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [promotingMember, setPromotingMember] = useState<Member | null>(null);
  const [promoteJerseyNumber, setPromoteJerseyNumber] = useState<number>(30);
  const [promotingLoading, setPromotingLoading] = useState(false);

  // Fun Match Modal State
  const [funMatchModalOpen, setFunMatchModalOpen] = useState(false);
  const [editingFunMatch, setEditingFunMatch] = useState<FunMatch | null>(null);
  const [matchTitle, setMatchTitle] = useState('Fun Match Weekly');
  const [matchDate, setMatchDate] = useState('');
  const [matchVenue, setMatchVenue] = useState('Stadion Gelora Samudra, Jakarta');
  const [teamAName, setTeamAName] = useState('TIM A (NAVY)');
  const [teamBName, setTeamBName] = useState('TIM B (GOLD)');
  const [matchDuration, setMatchDuration] = useState(60);
  const [matchStatus, setMatchStatus] = useState<'scheduled' | 'live' | 'finished'>('scheduled');
  const [savingFunMatch, setSavingFunMatch] = useState(false);

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [statusFilter, tierFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
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

  // Toggle Member Status (ACTIVE / INACTIVE) without deleting
  const handleToggleStatus = async (member: Member) => {
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Status ${member.fullName} berhasil diubah menjadi ${nextStatus}`,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Confirm Payment & Activate Member
  const handleConfirmPaymentAndActivate = async (member: Member) => {
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          paymentStatus: 'VERIFIED',
        }),
      });
      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Pembayaran ${member.fullName} telah disetujui & akun berhasil diaktifkan!`,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reject Payment
  const handleRejectPayment = async (member: Member) => {
    if (!confirm(`Tolak bukti pembayaran ${member.fullName}?`)) return;
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING',
          paymentStatus: 'REJECTED',
        }),
      });
      if (res.ok) {
        setAlertMsg({
          type: 'error',
          text: `Pembayaran ${member.fullName} ditandai ditolak.`,
        });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFullPositionName = (pos: string) => {
    switch (pos?.toUpperCase()) {
      case 'GK': return 'Goalkeeper (Kiper)';
      case 'DF': return 'Defender (Bek)';
      case 'MF': return 'Midfielder (Gelandang)';
      case 'FW': return 'Forward (Penyerang)';
      default: return pos || 'Pemain';
    }
  };

  // Send Account via WhatsApp
  const handleSendWhatsAppAccount = (m: Member) => {
    let cleanPhone = m.phone ? m.phone.replace(/[^0-9]/g, '') : '';
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const fullPos = getFullPositionName(m.position);
    const altPos = m.altPosition ? ` / ${getFullPositionName(m.altPosition)}` : '';
    const expiryText = m.isPermanent
      ? 'Permanen (Lifetime)'
      : m.expiresAt
      ? new Date(m.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Aktif';

    const message = `Halo *${m.fullName}*,

Berikut detail akun login Member *${m.tier}* Anda di *Mariners SC Soccer Community*:

🆔 *ID Member / Username*: \`${m.memberCode}\`
🔑 *Kata Sandi*: \`${m.password}\`
🔢 *Nomor Punggung*: \`#${m.jerseyNumber}\`
📍 *Posisi*: ${fullPos}${altPos}
⏳ *Masa Aktif*: ${expiryText}

Silakan login ke portal resmi Mariners SC untuk konfirmasi jadwal fun match mingguan:
🌐 https://marinerssc.com/community

Selamat bergabung bersama keluarga besar Mariners SC! 🔥⚽`;

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Open Edit Member Modal
  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setFormFullName(member.fullName);
    setFormNickname(member.nickname || '');
    setFormOrigin(member.origin);
    setFormPhone(member.phone);
    setFormPhotoUrl(member.photoUrl || '');
    setFormPosition(member.position);
    setFormAltPosition(member.altPosition || '');
    setFormJerseyNumber(member.jerseyNumber);
    setFormTier(member.tier);
    setFormStatus(member.status);
    setFormPaymentStatus(member.paymentStatus || 'VERIFIED');
    setFormPassword(member.password);
    setMemberModalOpen(true);
  };

  // Open Add Member Modal
  const openAddModal = () => {
    setEditingMember(null);
    setFormFullName('');
    setFormNickname('');
    setFormOrigin('');
    setFormPhone('');
    setFormPhotoUrl('');
    setFormPosition('MF');
    setFormAltPosition('');
    setFormJerseyNumber(Math.floor(Math.random() * (99 - 30 + 1)) + 30);
    setFormTier('FAN');
    setFormStatus('ACTIVE');
    setFormPaymentStatus('VERIFIED');
    setFormPassword('');
    setMemberModalOpen(true);
  };

  const handleAdminPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'members');
      formData.append('playerName', formFullName || 'Member');
      formData.append('position', formPosition || 'MF');
      formData.append('number', String(formJerseyNumber || 30));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal upload foto');
      setFormPhotoUrl(data.url);
    } catch (err: any) {
      alert(err.message || 'Gagal upload foto pemain');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Save Member (Create / Update)
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formOrigin.trim() || !formPhone.trim()) {
      alert('Nama lengkap, asal domisili, dan nomor WhatsApp wajib diisi.');
      return;
    }

    setSavingMember(true);
    try {
      const payload = {
        fullName: formFullName,
        nickname: formNickname,
        origin: formOrigin,
        phone: formPhone,
        photoUrl: formPhotoUrl || null,
        position: formPosition,
        altPosition: formAltPosition,
        jerseyNumber: formJerseyNumber,
        tier: formTier,
        status: formStatus,
        paymentStatus: formPaymentStatus,
        password: formPassword,
      };

      const url = editingMember ? `/api/admin/members/${editingMember.id}` : '/api/admin/members';
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');

      setAlertMsg({ type: 'success', text: 'Data member berhasil disimpan!' });
      setMemberModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingMember(false);
    }
  };

  // Open Promote Modal
  const openPromoteModal = (member: Member) => {
    setPromotingMember(member);
    setPromoteJerseyNumber(member.jerseyNumber);
    setPromoteModalOpen(true);
  };

  // Execute Promote to Main Squad
  const handlePromoteToSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promotingMember) return;

    setPromotingLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${promotingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedNumber: promoteJerseyNumber }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mempromosikan member');

      setAlertMsg({
        type: 'success',
        text: `Berhasil! ${promotingMember.fullName} kini resmi menjadi pemain tetap Skuad Utama Mariners SC (#${data.player?.number || promoteJerseyNumber}).`,
      });
      setPromoteModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal mempromosikan pemain' });
    } finally {
      setPromotingLoading(false);
    }
  };

  // Open Create Fun Match Modal
  const openCreateFunMatchModal = () => {
    setEditingFunMatch(null);
    setMatchTitle('Fun Match Weekly');
    setMatchDate(formatDateForInput(new Date()));
    setMatchVenue('Stadion Gelora Samudra, Jakarta');
    setTeamAName('TIM A (NAVY)');
    setTeamBName('TIM B (GOLD)');
    setMatchDuration(60);
    setMatchStatus('scheduled');
    setFunMatchModalOpen(true);
  };

  // Open Edit Fun Match Modal
  const openEditFunMatchModal = (fm: FunMatch) => {
    setEditingFunMatch(fm);
    setMatchTitle(fm.title);
    setMatchDate(formatDateForInput(fm.matchDate));
    setMatchVenue(fm.venue);
    setTeamAName(fm.teamAName);
    setTeamBName(fm.teamBName);
    setMatchDuration(fm.duration || 60);
    setMatchStatus((fm.status as any) || 'scheduled');
    setFunMatchModalOpen(true);
  };

  // Delete Fun Match
  const handleDeleteFunMatch = async (id: string, title: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus jadwal fun match "${title}"? Data kehadiran dan statistik pada laga ini juga akan terhapus.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/fun-matches/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus fun match');
      setAlertMsg({ type: 'success', text: `Jadwal fun match "${title}" berhasil dihapus!` });
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Gagal menghapus' });
    }
  };

  // Save / Update Fun Match (Informasi Laga Only)
  const handleSaveFunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTitle.trim() || !matchDate) {
      alert('Judul dan tanggal pertandingan wajib diisi.');
      return;
    }

    setSavingFunMatch(true);
    try {
      const url = editingFunMatch
        ? `/api/admin/fun-matches/${editingFunMatch.id}`
        : '/api/admin/fun-matches';
      const method = editingFunMatch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: matchTitle,
          matchDate,
          venue: matchVenue,
          teamAName,
          teamBName,
          duration: matchDuration,
          status: matchStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan fun match');

      setAlertMsg({
        type: 'success',
        text: editingFunMatch
          ? 'Perubahan data fun match berhasil disimpan!'
          : 'Pertandingan fun match berhasil dijadwalkan!',
      });
      setFunMatchModalOpen(false);
      setEditingFunMatch(null);
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan' });
    } finally {
      setSavingFunMatch(false);
    }
  };

  const pendingMembersCount = members.filter((m) => m.status === 'PENDING' || m.paymentStatus === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Panel Soccer Community & Member
          </div>
          <h1 className="text-xl sm:text-3xl font-black uppercase text-white tracking-tight">
            Kelola Member & Fun Match
          </h1>
          <p className="text-xs text-slate-300">
            Database keanggotaan, verifikasi pembayaran, ID login member, dan jadwal fun match komunitas.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
          >
            <UserPlus className="w-4 h-4 text-blue-600" />
            + Tambah Member Manual
          </button>
          <button
            onClick={() => setFunMatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold uppercase bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs shadow-lg shadow-amber-500/20"
          >
            <Calendar className="w-4 h-4" />
            + Jadwal Fun Match
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{alertMsg.text}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Tabs (Data Member vs Fun Match) */}
      <div className="flex gap-2 p-1.5 glass-panel rounded-2xl max-w-md border border-slate-800">
        <button
          onClick={() => setActiveTab('MEMBERS')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === 'MEMBERS'
              ? 'blue-gradient-bg text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Data Member ({members.length})</span>
          {pendingMembersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-black flex items-center justify-center animate-pulse">
              {pendingMembersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('FUN_MATCHES')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === 'FUN_MATCHES'
              ? 'blue-gradient-bg text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Fun Matches ({funMatches.length})</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: DATA MEMBER KOMUNITAS
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'MEMBERS' && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Filters & Search */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, ID, WA, asal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-hidden focus:border-sky-400"
              />
            </form>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-hidden"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">⏳ Perlu Verifikasi Pembayaran ({pendingMembersCount})</option>
                <option value="ACTIVE">✓ Member Aktif</option>
                <option value="INACTIVE">Non-Aktif (Arsip)</option>
              </select>

              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-bold focus:outline-hidden"
              >
                <option value="ALL">Semua Paket</option>
                <option value="FAN">Paket FAN</option>
                <option value="PRO">Paket PRO</option>
                <option value="ELITE">Paket ELITE</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                Memuat data member komunitas...
              </div>
            ) : members.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <p>Tidak ada data member yang sesuai filter.</p>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                >
                  Tambah Member Pertama
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <tr>
                      <th className="p-3 sm:p-4">Member & Profil</th>
                      <th className="p-3 sm:p-4">ID & Kata Sandi Login</th>
                      <th className="p-3 sm:p-4">Paket & Bayar</th>
                      <th className="p-3 sm:p-4">Durasi Masa Aktif</th>
                      <th className="p-3 sm:p-4">Kontak WA & Asal</th>
                      <th className="p-3 sm:p-4">Status Akun</th>
                      <th className="p-3 sm:p-4 text-right">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => {
                      const isPendingPayment = m.status === 'PENDING' || m.paymentStatus === 'PENDING';
                      return (
                        <tr
                          key={m.id}
                          className={`hover:bg-slate-800/30 transition-colors ${
                            isPendingPayment ? 'bg-amber-950/20' : ''
                          }`}
                        >
                          
                          {/* Member Photo & Biodata */}
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.photoUrl || '/playertemplate.png'}
                                alt={m.fullName}
                                className="w-10 h-10 rounded-full object-cover bg-slate-950 border border-slate-700 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono font-black text-xs">
                                    #{m.jerseyNumber}
                                  </span>
                                  <span className="font-black text-white text-xs sm:text-sm">
                                    {m.fullName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-bold text-sky-400">
                                    {getFullPositionName(m.position)}
                                  </span>
                                  {m.nickname && <span>• &ldquo;{m.nickname}&rdquo;</span>}
                                  {m.playerId && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[8px]">
                                      Skuad Utama
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ID & Password Login Member + WhatsApp Send Icon */}
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 font-mono font-bold text-sky-300">
                                  <Key className="w-3 h-3 text-sky-400" />
                                  <span>{m.memberCode}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {showPassword[m.id] ? m.password : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPassword((prev) => ({ ...prev, [m.id]: !prev[m.id] }))
                                    }
                                    className="text-slate-400 hover:text-white p-1"
                                    title="Lihat / Sembunyikan Password"
                                  >
                                    {showPassword[m.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              {/* Ikon Kirim WA */}
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppAccount(m)}
                                className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 hover:border-emerald-400 transition-all flex items-center gap-1 text-[10px] font-bold shrink-0 shadow-sm"
                                title="Kirim ID & Password ke WhatsApp Member"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span className="hidden xl:inline">Kirim WA</span>
                              </button>
                            </div>
                          </td>

                          {/* Tier & Payment Proof */}
                          <td className="p-3 sm:p-4">
                            <div className="space-y-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                m.tier === 'ELITE'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : m.tier === 'PRO'
                                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                  : 'bg-slate-800 text-slate-300'
                              }`}>
                                {m.tier}
                              </span>

                              {/* Bukti Bayar Button */}
                              {m.paymentProof ? (
                                <div>
                                  <button
                                    onClick={() => setPreviewProof({ url: m.paymentProof!, memberName: m.fullName })}
                                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-[10px] font-bold"
                                  >
                                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                                    <span>Lihat Bukti Bayar</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 block italic">Tanpa bukti</span>
                              )}
                            </div>
                          </td>

                          {/* Durasi / Masa Aktif & Tanggal Gabung */}
                          <td className="p-3 sm:p-4">
                            <div className="space-y-1">
                              {m.isPermanent ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-[10px] whitespace-nowrap inline-block">
                                  Permanen
                                </span>
                              ) : m.expiresAt ? (
                                (() => {
                                  const diff = new Date(m.expiresAt).getTime() - Date.now();
                                  if (diff <= 0) {
                                    return (
                                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-bold text-[10px] whitespace-nowrap flex items-center gap-1 w-fit">
                                        <Clock className="w-3 h-3" /> Expired
                                      </span>
                                    );
                                  }
                                  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                  return (
                                    <div className="space-y-0.5">
                                      <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] whitespace-nowrap flex items-center gap-1 w-fit ${
                                        days > 7 ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                      }`}>
                                        <Clock className="w-3 h-3 text-sky-400" />
                                        <span>{days}h {hours}j lagi</span>
                                      </span>
                                      <span className="text-[9px] text-slate-400 block">
                                        s.d {new Date(m.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </span>
                                    </div>
                                  );
                                })()
                              ) : (
                                <span className="text-[10px] text-slate-500">-</span>
                              )}

                              {/* Tanggal Bergabung */}
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                                <span className="text-slate-500">Gabung:</span>
                                <span className="font-semibold text-slate-300">
                                  {new Date(m.joinedAt || m.createdAt).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact & Origin */}
                          <td className="p-3 sm:p-4 text-slate-300">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-white">{m.phone}</p>
                              <p className="text-[10px] text-slate-400">📍 {m.origin}</p>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 sm:p-4">
                            {isPendingPayment ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold uppercase text-[10px] flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 animate-spin" /> Verifikasi Bayar
                              </span>
                            ) : m.status === 'ACTIVE' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold uppercase text-[10px] flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" /> Aktif
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-extrabold uppercase text-[10px] flex items-center gap-1 w-fit">
                                <XCircle className="w-3 h-3" /> Nonaktif
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 sm:p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              
                              {/* 1. Quick Confirm / Reject if Pending */}
                              {isPendingPayment && (
                                <>
                                  <button
                                    onClick={() => handleConfirmPaymentAndActivate(m)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase shadow flex items-center gap-1"
                                    title="Konfirmasi Pembayaran & Aktifkan Member"
                                  >
                                    <Check className="w-3 h-3" /> Setujui
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(m)}
                                    className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 font-bold text-[10px] uppercase border border-red-500/30"
                                    title="Tolak Bukti Pembayaran"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {/* 2. Send WA Login Account */}
                              <button
                                onClick={() => handleSendWhatsAppAccount(m)}
                                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                                title="Kirim ID & Password ke WhatsApp Member"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              {/* 3. Tarik ke Skuad Utama */}
                              {!m.playerId && (
                                <button
                                  onClick={() => openPromoteModal(m)}
                                  className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                                  title="Tarik menjadi Pemain Tetap Skuad Utama"
                                >
                                  <Crown className="w-4 h-4" />
                                </button>
                              )}

                              {/* 4. Edit Data */}
                              <button
                                onClick={() => openEditModal(m)}
                                className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 transition-colors"
                                title="Edit Biodata & Password"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* 5. Toggle Active/Inactive (Do NOT Delete) */}
                              <button
                                onClick={() => handleToggleStatus(m)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  m.status === 'ACTIVE'
                                    ? 'bg-slate-800 text-slate-400 hover:text-red-400 border-slate-700'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                                title={m.status === 'ACTIVE' ? 'Nonaktifkan Member (Data Tetap Tersimpan)' : 'Aktifkan Kembali'}
                              >
                                {m.status === 'ACTIVE' ? <XCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </button>
                            </div>
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

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: JADWAL & MATCH OPTION FUN MATCH
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'FUN_MATCHES' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-black uppercase text-white">
                Daftar Pertandingan Fun Match Komunitas ({funMatches.length})
              </h2>
              <p className="text-xs text-slate-400">
                Kelola jadwal, edit informasi laga, atur pembagian tim A/B, serta input skor & pencetak gol.
              </p>
            </div>
            <button
              onClick={openCreateFunMatchModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>+ Buat Jadwal Baru</span>
            </button>
          </div>

          {funMatches.length === 0 ? (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <h3 className="text-sm font-bold text-white uppercase">Belum ada pertandingan fun match</h3>
              <button
                onClick={openCreateFunMatchModal}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Buat Jadwal Fun Match Baru
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {funMatches.map((fm) => (
                <div
                  key={fm.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-sky-500/40 transition-all space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3 gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                        FUN MATCH KOMUNITAS
                      </span>
                      <h3 className="text-base font-black uppercase text-white mt-0.5">
                        {fm.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        fm.status === 'finished'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : fm.status === 'live'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                      }`}>
                        {fm.status}
                      </span>
                      <button
                        onClick={() => openEditFunMatchModal(fm)}
                        title="Edit Data Pertandingan"
                        className="p-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/30 text-sky-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteFunMatch(fm.id, fm.title)}
                        title="Hapus Pertandingan"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-center py-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-sky-300">{fm.teamAName}</span>
                    </div>
                    <div className="px-4 py-1 rounded-lg bg-slate-900 font-mono font-black text-base text-white border border-slate-700">
                      {fm.teamAScore ?? 0} : {fm.teamBScore ?? 0}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-amber-300">{fm.teamBName}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      <span>{formatWibDate(fm.matchDate)} • {formatWibTime(fm.matchDate)}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{fm.venue}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/community/matches/${fm.id}`}
                        target="_blank"
                        className="text-xs font-bold text-slate-400 hover:text-white"
                      >
                        Lihat Publik ↗
                      </Link>
                      <button
                        onClick={() => openEditFunMatchModal(fm)}
                        className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" /> Edit Data
                      </button>
                    </div>
                    <Link
                      href={`/admin/members/fun-match/${fm.id}`}
                      className="px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <span>Match Option (Lineup & Skor)</span>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL 1: PREVIEW BUKTI BAYAR ─── */}
      {previewProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white">
                Bukti Pembayaran: {previewProof.memberName}
              </h3>
              <button onClick={() => setPreviewProof(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={previewProof.url}
                alt="Bukti Transfer"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex justify-end gap-2">
              <a
                href={previewProof.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Buka Ukuran Penuh
              </a>
              <button
                onClick={() => setPreviewProof(null)}
                className="px-5 py-2 rounded-xl font-bold uppercase white-blue-btn text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADD / EDIT MEMBER ─── */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-xl bg-slate-900 border border-sky-400/40 rounded-3xl shadow-2xl p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white">
                {editingMember ? `Edit Member: ${editingMember.fullName}` : 'Tambah Member Baru'}
              </h3>
              <button onClick={() => setMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              
              {/* Foto Profil Member Upload */}
              <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <img
                  src={formPhotoUrl || '/defaultplayer.png'}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-sky-400/60 bg-slate-900 shrink-0"
                />
                <div className="space-y-1.5 flex-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Foto Profil Member
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-bold cursor-pointer transition-colors">
                    {uploadingPhoto ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingPhoto ? 'Mengunggah...' : formPhotoUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingPhoto}
                      onChange={handleAdminPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {formPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormPhotoUrl('')}
                      className="text-[10px] text-red-400 hover:text-red-300 ml-2"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nomor WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Asal Domisili *</label>
                  <input
                    type="text"
                    required
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Posisi Utama</label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="GK">Goalkeeper (Kiper)</option>
                    <option value="DF">Defender (Bek)</option>
                    <option value="MF">Midfielder (Gelandang)</option>
                    <option value="FW">Forward (Penyerang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Posisi Alternatif</label>
                  <select
                    value={formAltPosition}
                    onChange={(e) => setFormAltPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="">Tidak Ada / Fleksibel</option>
                    <option value="GK">Goalkeeper (Kiper)</option>
                    <option value="DF">Defender (Bek)</option>
                    <option value="MF">Midfielder (Gelandang)</option>
                    <option value="FW">Forward (Penyerang)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nomor Punggung (1-99)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formJerseyNumber}
                    onChange={(e) => setFormJerseyNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-center"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Paket Membership</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="FAN">FAN (Rp 15k / match)</option>
                    <option value="PRO">PRO (Rp 49k / bulan)</option>
                    <option value="ELITE">ELITE (Rp 399k / 6 bulan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Keanggotaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="PENDING">Menunggu Verifikasi (PENDING)</option>
                    <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 text-xs">Kata Sandi Login Member</label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk otomatis mariners1234"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="px-6 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs disabled:opacity-50"
                >
                  {savingMember ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: TARIK KE SKUAD UTAMA ─── */}
      {promoteModalOpen && promotingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-400/40 rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black uppercase text-white">
                  Tarik ke Skuad Utama
                </h3>
              </div>
              <button onClick={() => setPromoteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-2">
              <p className="text-slate-200">
                Pemain <strong className="text-amber-300">{promotingMember.fullName}</strong> akan dipromosikan menjadi pemain resmi <strong>Skuad Utama Mariners SC</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Anda dapat menyesuaikan nomor punggung skuad utama berikut:
              </p>
            </div>

            <form onSubmit={handlePromoteToSquad} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Nomor Punggung Skuad Utama
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={promoteJerseyNumber}
                  onChange={(e) => setPromoteJerseyNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-400/50 text-amber-400 font-mono font-black text-center text-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={promotingLoading}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {promotingLoading ? 'Memproses...' : 'Konfirmasi Tarik Pemain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: JADWAL FUN MATCH ─── */}
      {funMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-400/40 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white">
                {editingFunMatch ? 'Edit Data Fun Match Komunitas' : 'Buat Jadwal Fun Match Komunitas'}
              </h3>
              <button
                onClick={() => {
                  setFunMatchModalOpen(false);
                  setEditingFunMatch(null);
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFunMatch} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Judul Laga *</label>
                <input
                  type="text"
                  required
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Tanggal &amp; Waktu (WIB) *</label>
                <input
                  type="datetime-local"
                  required
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Lokasi / Venue *</label>
                <input
                  type="text"
                  required
                  value={matchVenue}
                  onChange={(e) => setMatchVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Tim A</label>
                  <input
                    type="text"
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sky-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Tim B</label>
                  <input
                    type="text"
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
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
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Pertandingan</label>
                  <select
                    value={matchStatus}
                    onChange={(e) => setMatchStatus(e.target.value as any)}
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
                  onClick={() => {
                    setFunMatchModalOpen(false);
                    setEditingFunMatch(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFunMatch}
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase shadow disabled:opacity-50 cursor-pointer"
                >
                  {savingFunMatch ? 'Menyimpan...' : editingFunMatch ? 'Simpan Perubahan' : 'Jadwalkan Fun Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
