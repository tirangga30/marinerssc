'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Copy,
  ExternalLink,
  Users,
  Loader2,
  Sparkles,
  Search,
  RotateCcw,
} from 'lucide-react';

interface PlayerInvite {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string;
  phone: string | null;
  cleanPhone: string;
  status: string; // 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'NOT_INVITED'
  isInvited?: boolean;
  invitedAt?: string | Date | null;
  declineReason?: string | null;
  inviteUrl: string;
  message: string;
  waUrl: string | null;
  isGuest?: boolean;
  playerType?: string;
}

interface MatchWhatsAppInviteModalProps {
  matchId: string;
  onClose: () => void;
}

export default function MatchWhatsAppInviteModal({
  matchId,
  onClose,
}: MatchWhatsAppInviteModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dispatching, setDispatching] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'INVITED' | 'DECLINED' | 'NOT_INVITED'>('ALL');
  const [category, setCategory] = useState<'ALL' | 'SQUAD' | 'LOAN'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/broadcast-invite`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengambil data');
      setData(json);
      // Inisialisasi pilihan: default pilih pemain yang memiliki nomor HP
      const validPhoneIds = (json.players || [])
        .filter((p: any) => p.phone && p.phone.trim() !== '')
        .map((p: any) => p.id);
      setSelectedIds(new Set(validPhoneIds));
    } catch (err: any) {
      console.error(err);
      setAlertMsg({ type: 'error', text: err.message || 'Gagal memuat data undangan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const markPlayerAsInvited = async (id: string) => {
    // Update local state optimistically
    setData((prev: any) => {
      if (!prev) return prev;
      const updatedPlayers = (prev.players || []).map((p: any) => {
        if (p.id === id && p.status === 'NOT_INVITED') {
          return { ...p, status: 'INVITED', isInvited: true };
        }
        return p;
      });
      const wasNotInvited = prev.players?.some((p: any) => p.id === id && p.status === 'NOT_INVITED');
      return {
        ...prev,
        players: updatedPlayers,
        invitedCount: wasNotInvited ? (prev.invitedCount || 0) + 1 : prev.invitedCount,
        notInvitedCount: wasNotInvited ? Math.max(0, (prev.notInvitedCount || 0) - 1) : prev.notInvitedCount,
      };
    });

    try {
      await fetch(`/api/admin/matches/${matchId}/broadcast-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markPlayerId: id }),
      });
    } catch (e) {
      console.warn('Gagal menandai invite pemain:', e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    markPlayerAsInvited(id);
  };

  const toggleSelectPlayer = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAutoDispatchSelected = async () => {
    if (selectedIds.size === 0) {
      alert('Pilih minimal 1 pemain untuk mengirim pesan undangan.');
      return;
    }
    if (!confirm(`Kirim pesan undangan WhatsApp otomatis ke ${selectedIds.size} pemain terpilih sekarang?`)) return;
    setDispatching(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/broadcast-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoSendWhatsApp: true,
          playerIds: Array.from(selectedIds),
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal mengirim otomatis');

      setAlertMsg({
        type: 'success',
        text: `Berhasil diproses! ${resJson.gatewaySentCount || 0} pesan terkirim via Gateway WA.`,
      });
      fetchData();
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Terjadi kesalahan saat dispatch' });
    } finally {
      setDispatching(false);
    }
  };

  const handleResetInvites = async () => {
    if (!confirm('Yakin ingin mereset status semua pemain yang "Menunggu" kembali ke "Belum Di-invite"?\n\nIni akan melindungi pemain yang belum dikirimi invite dari pengurangan poin.')) return;
    setResetting(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/broadcast-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_ALL' }),
      });
      if (res.ok) {
        setAlertMsg({ type: 'success', text: 'Semua status Menunggu berhasil dikembalikan ke Belum Di-invite!' });
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal mereset status invite');
      }
    } catch (e: any) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'Terjadi kesalahan jaringan saat mereset status invite' });
    } finally {
      setResetting(false);
    }
  };

  const isUnknown = (p: { id?: string; name?: string }) =>
    p.id === 'unknown-player' ||
    Boolean(p.name && p.name.trim().toLowerCase() === 'tidak diketahui');

  const players: PlayerInvite[] = (data?.players || []).filter((p: any) => !isUnknown(p));
  const filteredPlayers = players.filter((p) => {
    if (category === 'SQUAD' && p.isGuest) return false;
    if (category === 'LOAN' && !p.isGuest) return false;
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
    }
    return true;
  });

  const displayedSquadPlayers = filteredPlayers.filter((p) => !p.isGuest);
  const displayedLoanPlayers = filteredPlayers.filter((p) => p.isGuest);

  const isAllFilteredSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every((p) => selectedIds.has(p.id));

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredPlayers.forEach((p) => next.delete(p.id));
      } else {
        filteredPlayers.forEach((p) => next.add(p.id));
      }
      return next;
    });
  };

  const renderPlayerRow = (p: PlayerInvite) => {
    const isConfirmed = p.status === 'CONFIRMED';
    const isDeclined = p.status === 'DECLINED';
    const isCopied = copiedId === p.id;
    const isSelected = selectedIds.has(p.id);

    return (
      <div
        key={p.id}
        className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isSelected ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50'
        }`}
      >
        {/* Checkbox + Player Avatar & Details */}
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectPlayer(p.id)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 shrink-0 cursor-pointer"
          />
          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
            <img
              src={p.photoUrl || '/playertemplate.webp'}
              alt={p.name}
              className="w-full h-full object-cover object-top scale-[1.3] origin-top"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-900 text-xs sm:text-sm uppercase truncate">
                {p.name}
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                #{p.number}
              </span>
              <span className="text-[9px] font-bold text-slate-600 uppercase">
                {p.position}
              </span>
              {p.isGuest && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  LOAN
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-600">
              {p.phone ? (
                <span className="font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                  <Phone className="w-2.5 h-2.5" /> {p.phone}
                </span>
              ) : (
                <span className="text-rose-600 italic">No HP belum diisi</span>
              )}
            </div>
          </div>
        </div>

        {/* Status & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {/* Status Badge */}
          <div className="mr-1">
            {isConfirmed ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ikut
              </span>
            ) : isDeclined ? (
              <span
                className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-300 text-[10px] font-black uppercase flex items-center gap-1"
                title={p.declineReason ? `Alasan: ${p.declineReason}` : undefined}
              >
                <XCircle className="w-3 h-3" /> Tidak
              </span>
            ) : p.status === 'INVITED' ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold uppercase flex items-center gap-1">
                <Clock className="w-3 h-3" /> Menunggu
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase flex items-center gap-1">
                Belum Di-invite
              </span>
            )}
          </div>

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={() => handleCopy(p.inviteUrl, p.id)}
            title="Salin tautan konfirmasi pemain & tandai telah di-invite"
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isCopied ? 'Tersalin!' : 'Link'}</span>
          </button>

          {/* Direct WhatsApp Button */}
          {p.waUrl ? (
            <a
              href={p.waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markPlayerAsInvited(p.id)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
            >
              <i className="fa-brands fa-whatsapp text-sm" />
              <span>Kirim WA</span>
            </a>
          ) : (
            <span
              className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs uppercase cursor-not-allowed border border-slate-200"
              title="Nomor WhatsApp pemain belum diisi"
            >
              No WA Kosong
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl glass-panel bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 space-y-4 sm:space-y-5 shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <i className="fa-brands fa-whatsapp text-lg" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wide">
                Undangan WhatsApp Pemain
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                {data?.match
                  ? `vs ${data.match.opponentName} • ${data.match.competition} (${data.match.isHome ? 'Home' : 'Away'})`
                  : 'Memuat data pertandingan...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-white hover:bg-red-500 transition-colors cursor-pointer border border-slate-200"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-bold text-slate-700">Menyiapkan daftar undangan pemain...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Pemain</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-900">{data?.totalPlayers || 0}</span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                  {data?.squadCount ?? 0} Skuad • {data?.loanCount ?? 0} Loan
                </span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Ikut</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-800">{data?.confirmedCount || 0}</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Menunggu</span>
                <span className="text-base sm:text-lg font-black font-mono text-amber-800">{data?.invitedCount || 0}</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Belum Di-invite</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-700">{data?.notInvitedCount || 0}</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Tidak Bisa</span>
                <span className="text-base sm:text-lg font-black font-mono text-rose-800">{data?.declinedCount || 0}</span>
              </div>
            </div>

            {/* Alert */}
            {alertMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  alertMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}
              >
                {alertMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{alertMsg.text}</span>
              </div>
            )}

            {/* Gateway Action / Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-blue-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {data?.whatsappMode === 'scan' && data?.hasWhatsAppToken
                    ? 'WhatsApp Gateway (Scan QR) Terhubung'
                    : 'Mode Tanpa WA / Manual'}
                </span>
                <p className="text-[11px] text-slate-600">
                  {data?.whatsappMode === 'scan' && data?.hasWhatsAppToken
                    ? 'Token WhatsApp aktif. Anda dapat mengirim otomatis ke semua pemain sekaligus atau klik tombol WA per pemain.'
                    : 'Kirim link konfirmasi per pemain via WhatsApp web manual dengan mengeklik tombol WA di samping setiap nama.'}
                </p>
              </div>

              {data?.whatsappMode === 'scan' && data?.hasWhatsAppToken && (
                <button
                  type="button"
                  disabled={dispatching || selectedIds.size === 0}
                  onClick={handleAutoDispatchSelected}
                  className={`px-4 py-2 rounded-xl font-black uppercase text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-lg transition-all ${
                    selectedIds.size === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {dispatching ? 'Mengirim...' : `Kirim ke ${selectedIds.size} Pemain Terpilih`}
                </button>
              )}
            </div>

            {/* Category Filter Pills (Skuad vs Loan) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Kategori:</span>
              <button
                type="button"
                onClick={() => setCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer ${
                  category === 'ALL'
                    ? 'bg-slate-900 text-white font-black shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Semua ({players.length})
              </button>
              <button
                type="button"
                onClick={() => setCategory('SQUAD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  category === 'SQUAD'
                    ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/20'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Skuad Utama ({players.filter((p) => !p.isGuest).length})
              </button>
              <button
                type="button"
                onClick={() => setCategory('LOAN')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  category === 'LOAN'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pemain Loan ({players.filter((p) => p.isGuest).length})
              </button>

              {data?.invitedCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetInvites}
                  disabled={resetting}
                  className="ml-auto px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold uppercase text-[10px] flex items-center gap-1.5 border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shrink-0"
                  title="Kembalikan semua status 'Menunggu' menjadi 'Belum Di-invite'"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{resetting ? 'Mereset...' : 'Reset ke Belum Di-invite'}</span>
                </button>
              )}
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama pemain / nomor HP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'CONFIRMED', 'INVITED', 'NOT_INVITED', 'DECLINED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors shrink-0 ${
                      filter === st
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Semua'
                      : st === 'CONFIRMED'
                      ? 'Ikut'
                      : st === 'INVITED'
                      ? 'Menunggu'
                      : st === 'NOT_INVITED'
                      ? 'Belum Di-invite'
                      : 'Tidak Bisa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Selection Toolbar */}
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span>Pilih Semua ({filteredPlayers.length} pemain tampil)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedIds.size} dipilih
                </span>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds(new Set())}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Batal Pilih
                  </button>
                )}
              </div>
            </div>

            {/* Players Table / List with Separated Skuad & Loan Groups */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              {filteredPlayers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Tidak ada pemain yang cocok dengan filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {/* Skuad Utama Section */}
                  {displayedSquadPlayers.length > 0 && (category === 'ALL' || category === 'SQUAD') && (
                    <div>
                      <div className="px-3.5 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                          <span className="text-xs font-black uppercase text-blue-950 tracking-wider">
                            Skuad Utama ({displayedSquadPlayers.length})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                          Resmi
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {displayedSquadPlayers.map(renderPlayerRow)}
                      </div>
                    </div>
                  )}

                  {/* Pemain Loan Section */}
                  {displayedLoanPlayers.length > 0 && (category === 'ALL' || category === 'LOAN') && (
                    <div>
                      <div className="px-3.5 py-2 bg-amber-50/90 border-t border-b border-amber-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span className="text-xs font-black uppercase text-amber-950 tracking-wider">
                            Pemain Loan ({displayedLoanPlayers.length})
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                          Pinjaman / Tamu
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {displayedLoanPlayers.map(renderPlayerRow)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-slate-600 text-[11px]">
            Tautan konfirmasi otomatis memperbarui daftar <strong>SQUAD LIST</strong> di halaman pertandingan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase transition-colors cursor-pointer border border-slate-200"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

