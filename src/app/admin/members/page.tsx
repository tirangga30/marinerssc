'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Plus, Search, Filter, Shield, Award, Flame,
  Edit, Trash2, CheckCircle2, XCircle, AlertCircle,
  Crown, Shuffle, Key, Eye, EyeOff, Loader2, ArrowRight,
  Calendar, Clock, MapPin, Check, ChevronRight, UserPlus,
  MessageCircle, ExternalLink, Receipt, Sparkles, X
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
  status: string; // PENDING, ACTIVE, INACTIVE
  paymentProof: string | null;
  paymentStatus: string; // PENDING, VERIFIED, REJECTED
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

  // Payment Proof Preview Modal
  const [previewMember, setPreviewMember] = useState<Member | null>(null);

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
  const [formPaymentStatus, setFormPaymentStatus] = useState('VERIFIED');
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

  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string; memberToSend?: Member } | null>(null);

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

  // WhatsApp Sender Helper
  const handleSendWhatsAppCredentials = (m: Member) => {
    let cleanPhone = m.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const host = typeof window !== 'undefined' ? window.location.origin : 'https://marinerssc.com';
    const message = 
`Halo *${m.fullName}*! 👋
Terima kasih telah mendaftar di *Soccer Community Mariners SC* (Paket *${m.tier}*).

Pembayaran pendaftaran Anda telah *DIVERIFIKASI* oleh Admin. Berikut adalah data akun resmi Anda untuk login:

👤 *ID Member (Username):* \`${m.memberCode}\`
🔑 *Kata Sandi:* \`${m.password}\`
👕 *Nomor Punggung:* #${m.jerseyNumber}
📍 *Posisi:* ${m.position}

Silakan login ke portal member resmi kami untuk konfirmasi kehadiran fun match:
👉 ${host}/community

Sampai jumpa di jadwal pertandingan berikutnya dan salam Mariners SC! ⚓⚽`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Verify Payment & Activate Member
  const handleVerifyMemberPayment = async (m: Member) => {
    try {
      const res = await fetch(`/api/admin/members/${m.id}`, {
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
          text: `Pembayaran ${m.fullName} berhasil diverifikasi! Member telah AKTIF. Klik tombol di bawah untuk kirimkan ID & Password via WA.`,
          memberToSend: m,
        });
        if (previewMember?.id === m.id) setPreviewMember(null);
        fetchData();
      } else {
        const data = await res.json();
        setAlertMsg({ type: 'error', text: data.error || 'Gagal memverifikasi' });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message || 'Terjadi kesalahan' });
    }
  };

  // Reject Payment
  const handleRejectMemberPayment = async (m: Member) => {
    if (!confirm(`Tolak bukti pembayaran ${m.fullName}?`)) return;
    try {
      const res = await fetch(`/api/admin/members/${m.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'INACTIVE',
          paymentStatus: 'REJECTED',
        }),
      });

      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: `Pembayaran ${m.fullName} telah ditandai DITOLAK.`,
        });
        if (previewMember?.id === m.id) setPreviewMember(null);
        fetchData();
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message || 'Terjadi kesalahan' });
    }
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
    setFormPaymentStatus('VERIFIED');
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
    setFormPaymentStatus(m.paymentStatus || 'VERIFIED');
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
          paymentStatus: formPaymentStatus,
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

  const pendingCount = members.filter((m) => m.status === 'PENDING' || m.paymentStatus === 'PENDING').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-400/30">
              Admin Community Panel
            </span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                {pendingCount} Verifikasi Pending
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight mt-1">
            Manajemen Member & Fun Match
          </h1>
          <p className="text-xs text-slate-400">
            Verifikasi bukti pembayaran, kirim akun login via WA, dan jadwalkan fun match komunitas.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
              activeTab === 'MEMBERS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Member ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('FUN_MATCHES')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${
              activeTab === 'FUN_MATCHES'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal Fun Match ({funMatches.length})</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMsg && (
        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-bold border ${
          alertMsg.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {alertMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{alertMsg.text}</span>
          </div>
          {alertMsg.memberToSend && (
            <button
              onClick={() => handleSendWhatsAppCredentials(alertMsg.memberToSend!)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase text-[10px] flex items-center gap-1.5 shrink-0 shadow-md"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Kirim ID & Password via WA Sekarang
            </button>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DATA MEMBER (DENGAN VERIFIKASI BUKTI TRANSFER & WA)
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
                  placeholder="Cari nama, ID, no WA, domisili..."
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
                <option value="PENDING">🟡 Menunggu Verifikasi ({pendingCount})</option>
                <option value="ACTIVE">🟢 Aktif</option>
                <option value="INACTIVE">⚪ Non-Aktif (Arsip)</option>
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
                      <th className="p-3.5">Bukti Bayar</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi & Kirim Akun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {members.map((m) => {
                      const isPwdVisible = showPassword[m.id];
                      const isPending = m.status === 'PENDING' || m.paymentStatus === 'PENDING';

                      return (
                        <tr key={m.id} className={`transition-colors ${isPending ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-slate-900/40'}`}>
                          
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
                                  <Link
                                    href={`/community/players/${m.id}`}
                                    target="_blank"
                                    className="font-bold text-white text-xs hover:text-sky-300 transition-colors"
                                  >
                                    {m.fullName}
                                  </Link>
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

                          {/* Bukti Bayar */}
                          <td className="p-3.5">
                            {m.paymentProof ? (
                              <button
                                onClick={() => setPreviewMember(m)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-400 text-sky-300 text-[10px] font-bold transition-colors"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                Lihat Struk
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Tanpa Struk</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="p-3.5">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max animate-pulse">
                                <Clock className="w-3 h-3" /> Menunggu Verifikasi
                              </span>
                            ) : (
                              <button
                                onClick={() => toggleMemberStatus(m)}
                                title="Klik untuk ubah status aktif/non-aktif"
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                  m.status === 'ACTIVE'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {m.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                              </button>
                            )}
                          </td>

                          {/* Actions & WhatsApp */}
                          <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                            
                            {/* Tombol Verifikasi Cepat jika status PENDING */}
                            {isPending && (
                              <button
                                onClick={() => handleVerifyMemberPayment(m)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] uppercase shadow-sm transition-all inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Verifikasi
                              </button>
                            )}

                            {/* Tombol Kirim Akun via WhatsApp */}
                            <button
                              onClick={() => handleSendWhatsAppCredentials(m)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-extrabold text-[10px] uppercase shadow-sm transition-all inline-flex items-center gap-1"
                              title="Kirimkan username dan password member via WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" /> Kirim WA
                            </button>

                            {/* Tarik ke Skuad Utama */}
                            {!m.isPermanent && (
                              <button
                                onClick={() => openPromoteModal(m)}
                                className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase transition-all"
                              >
                                Tarik ke Skuad
                              </button>
                            )}

                            {/* Edit Member */}
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
          TAB 2: JADWAL FUN MATCH (MATCHMAKING KOMUNITAS)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'FUN_MATCHES' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between glass-panel p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-base font-black uppercase text-white">Daftar Pertandingan Fun Match</h2>
              <p className="text-xs text-slate-400">Atur skor, line up, dan event summary untuk masing-masing tim.</p>
            </div>
            <button
              onClick={() => setFunMatchModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md shadow-sky-500/10"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              Buat Fun Match Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {funMatches.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-500 text-xs glass-panel rounded-2xl border border-slate-800">
                Belum ada jadwal Fun Match. Klik &quot;Buat Fun Match Baru&quot; untuk membuat jadwal.
              </div>
            ) : (
              funMatches.map((fm) => (
                <div
                  key={fm.id}
                  className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4 hover:border-amber-400/40 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      {fm.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      fm.status === 'finished' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      {fm.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 text-center">
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-sky-300 block">{fm.teamAName}</span>
                      <span className="text-[10px] text-slate-400">Tim A</span>
                    </div>
                    <div className="px-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-black text-lg text-white">
                      {fm.teamAScore !== null ? `${fm.teamAScore} : ${fm.teamBScore}` : 'VS'}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-black uppercase text-amber-300 block">{fm.teamBName}</span>
                      <span className="text-[10px] text-slate-400">Tim B</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/80">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      {formatWibDate(fm.matchDate)} • {formatWibTime(fm.matchDate)} WIB ({fm.duration} Menit)
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      {fm.venue}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
                    <Link
                      href={`/admin/members/fun-match/${fm.id}`}
                      className="flex-1 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/10"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      Match Option (Atur Tim & Skor)
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PREVIEW BUKTI PEMBAYARAN & KONFIRMASI ADMIN
         ───────────────────────────────────────────────────────────── */}
      {previewMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-400/40 rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  VERIFIKASI BUKTI PEMBAYARAN
                </span>
                <h3 className="text-base font-black uppercase text-white">
                  {previewMember.fullName} ({previewMember.memberCode})
                </h3>
              </div>
              <button
                onClick={() => setPreviewMember(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Member Details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">Paket Membership:</span>
                <strong className="text-amber-300 font-bold">{previewMember.tier}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Nomor WhatsApp:</span>
                <strong className="text-white font-mono">{previewMember.phone}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Nomor Jersey:</span>
                <strong className="text-sky-300 font-mono">#{previewMember.jerseyNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Status Saat Ini:</span>
                <strong className={previewMember.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                  {previewMember.status}
                </strong>
              </div>
            </div>

            {/* Receipt Image */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Foto Bukti Transfer:</span>
              {previewMember.paymentProof ? (
                <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-h-80 flex items-center justify-center">
                  <img
                    src={previewMember.paymentProof}
                    alt="Bukti Transfer"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  Tidak ada file bukti pembayaran yang diunggah.
                </p>
              )}
            </div>

            {/* Verification Actions */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => handleRejectMemberPayment(previewMember)}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold text-xs"
              >
                Tolak Pembayaran
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVerifyMemberPayment(previewMember)}
                  className="px-5 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md shadow-sky-500/20"
                >
                  ✓ Verifikasi & Aktifkan Member
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TAMBAH / EDIT MEMBER MANUAL
         ───────────────────────────────────────────────────────────── */}
      {memberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-3xl shadow-2xl overflow-hidden my-auto p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white">
                {editingMember ? 'Edit Data Member' : 'Tambah Member Manual'}
              </h3>
              <button onClick={() => setMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Panggilan</label>
                  <input
                    type="text"
                    value={formNickname}
                    onChange={(e) => setFormNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Asal / Domisili</label>
                  <input
                    type="text"
                    required
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">No WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kata Sandi Login</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Posisi</label>
                  <select
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="GK">Goalkeeper</option>
                    <option value="DF">Defender</option>
                    <option value="MF">Midfielder</option>
                    <option value="FW">Forward</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">No Punggung</label>
                  <input
                    type="number"
                    min="30"
                    max="99"
                    value={formJerseyNumber}
                    onChange={(e) => setFormJerseyNumber(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tier Paket</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="FAN">FAN</option>
                    <option value="PRO">PRO</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Keanggotaan</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="ACTIVE">Aktif (ACTIVE)</option>
                    <option value="PENDING">Menunggu Konfirmasi (PENDING)</option>
                    <option value="INACTIVE">Non-Aktif (INACTIVE)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Status Pembayaran</label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="VERIFIED">Terverifikasi (VERIFIED)</option>
                    <option value="PENDING">Menunggu (PENDING)</option>
                    <option value="REJECTED">Ditolak (REJECTED)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  className="px-5 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md"
                >
                  {savingMember ? 'Menyimpan...' : 'Simpan Member'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TARIK KE SKUAD UTAMA
         ───────────────────────────────────────────────────────────── */}
      {promoteModalOpen && promotingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black uppercase text-white">Tarik ke Skuad Utama</h3>
              <p className="text-xs text-slate-400">
                Pilih nomor punggung resmi untuk <strong className="text-white">{promotingMember.fullName}</strong> di Skuad Utama.
              </p>
            </div>

            <form onSubmit={handlePromoteToSquad} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Nomor Punggung Skuad Utama</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={promoteJerseyNumber}
                  onChange={(e) => setPromoteJerseyNumber(parseInt(e.target.value) || 1)}
                  className="w-full py-2.5 text-center text-2xl font-mono font-black rounded-xl bg-slate-950 border border-amber-500/50 text-amber-400"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromoteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={promotingLoading}
                  className="flex-1 py-2.5 rounded-xl font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20"
                >
                  {promotingLoading ? 'Menyimpan...' : 'Jadikan Pemain Tetap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: BUAT FUN MATCH BARU
         ───────────────────────────────────────────────────────────── */}
      {funMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-sky-400/40 rounded-3xl shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white">Buat Jadwal Fun Match Baru</h3>
              <button onClick={() => setFunMatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFunMatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Judul Laga</label>
                <input
                  type="text"
                  required
                  value={matchTitle}
                  onChange={(e) => setMatchTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Tanggal & Waktu (WIB)</label>
                  <input
                    type="datetime-local"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Durasi Laga (Menit)</label>
                  <input
                    type="number"
                    min="30"
                    max="120"
                    value={matchDuration}
                    onChange={(e) => setMatchDuration(parseInt(e.target.value) || 60)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Lokasi / Venue</label>
                <input
                  type="text"
                  required
                  value={matchVenue}
                  onChange={(e) => setMatchVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sky-400 font-bold mb-1">Nama Tim A</label>
                  <input
                    type="text"
                    required
                    value={teamAName}
                    onChange={(e) => setTeamAName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-amber-400 font-bold mb-1">Nama Tim B</label>
                  <input
                    type="text"
                    required
                    value={teamBName}
                    onChange={(e) => setTeamBName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  className="px-5 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md"
                >
                  {savingFunMatch ? 'Menyimpan...' : 'Terbitkan Fun Match'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
