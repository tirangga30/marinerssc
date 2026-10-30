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
} from 'lucide-react';

interface PlayerInvite {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string;
  phone: string | null;
  cleanPhone: string;
  status: string; // 'INVITED' | 'CONFIRMED' | 'DECLINED'
  declineReason?: string | null;
  inviteUrl: string;
  message: string;
  waUrl: string | null;
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
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'INVITED' | 'DECLINED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/broadcast-invite`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengambil data');
      setData(json);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAutoDispatchAll = async () => {
    if (!confirm('Kirim pesan undangan WhatsApp otomatis ke seluruh nomor pemain sekarang?')) return;
    setDispatching(true);
    setAlertMsg(null);
    try {
      const res = await fetch(`/api/admin/matches/${matchId}/broadcast-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSendWhatsApp: true }),
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

  const players: PlayerInvite[] = data?.players || [];
  const filteredPlayers = players.filter((p) => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.phone && p.phone.includes(q));
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-5 shadow-2xl my-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <i className="fa-brands fa-whatsapp text-lg" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Undangan WhatsApp Pemain
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {data?.match
                  ? `vs ${data.match.opponentName} • ${data.match.competition} (${data.match.isHome ? 'Home' : 'Away'})`
                  : 'Memuat data pertandingan...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
            <p className="text-xs font-bold">Menyiapkan daftar undangan pemain...</p>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Skuad</span>
                <span className="text-lg font-black font-mono text-white">{data?.totalPlayers || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Konfirmasi Ikut</span>
                <span className="text-lg font-black font-mono text-emerald-300">{data?.confirmedCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Menunggu Respon</span>
                <span className="text-lg font-black font-mono text-amber-300">{data?.invitedCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase block">Tidak Bisa</span>
                <span className="text-lg font-black font-mono text-rose-300">{data?.declinedCount || 0}</span>
              </div>
            </div>

            {/* Alert */}
            {alertMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  alertMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-500/60 text-rose-200'
                }`}
              >
                {alertMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{alertMsg.text}</span>
              </div>
            )}

            {/* Gateway Action / Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {data?.hasWhatsAppToken ? 'WhatsApp Gateway Terhubung' : 'Kirim Langsung / Manual 1-Klik'}
                </span>
                <p className="text-[11px] text-slate-400">
                  {data?.hasWhatsAppToken
                    ? 'Token WhatsApp terdeteksi. Anda dapat mengirim otomatis ke semua nomor pemain sekaligus atau klik tombol WA per pemain.'
                    : 'Klik tombol WA di samping setiap pemain untuk langsung membuka chat WhatsApp dengan pesan undangan & link siap kirim.'}
                </p>
              </div>

              {data?.hasWhatsAppToken && (
                <button
                  type="button"
                  disabled={dispatching}
                  onClick={handleAutoDispatchAll}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  {dispatching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {dispatching ? 'Mengirim...' : 'Kirim Otomatis ke Semua'}
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-sky-400"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(['ALL', 'CONFIRMED', 'INVITED', 'DECLINED'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors shrink-0 ${
                      filter === st
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'ALL'
                      ? 'Semua'
                      : st === 'CONFIRMED'
                      ? 'Ikut'
                      : st === 'INVITED'
                      ? 'Menunggu'
                      : 'Tidak Bisa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Players Table / List */}
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 divide-y divide-slate-800/80">
              {filteredPlayers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Tidak ada pemain yang cocok dengan filter.
                </div>
              ) : (
                filteredPlayers.map((p) => {
                  const isConfirmed = p.status === 'CONFIRMED';
                  const isDeclined = p.status === 'DECLINED';
                  const isCopied = copiedId === p.id;

                  return (
                    <div
                      key={p.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Player Avatar & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-700 shrink-0 bg-slate-800">
                          <img
                            src={p.photoUrl || '/playertemplate.webp'}
                            alt={p.name}
                            className="w-full h-full object-cover object-top scale-[1.3] origin-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs sm:text-sm uppercase truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-sky-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              #{p.number}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">
                              {p.position}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            {p.phone ? (
                              <span className="font-mono text-emerald-400 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {p.phone}
                              </span>
                            ) : (
                              <span className="text-rose-400 italic">No HP belum diisi</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Status Badge */}
                        <div className="mr-1">
                          {isConfirmed ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ikut
                            </span>
                          ) : isDeclined ? (
                            <span
                              className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase flex items-center gap-1"
                              title={p.declineReason ? `Alasan: ${p.declineReason}` : undefined}
                            >
                              <XCircle className="w-3 h-3" /> Tidak
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Menunggu
                            </span>
                          )}
                        </div>

                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(p.inviteUrl, p.id)}
                          title="Salin tautan konfirmasi pemain"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-600/30"
                          >
                            <i className="fa-brands fa-whatsapp text-sm" />
                            <span>Kirim WA</span>
                          </a>
                        ) : (
                          <span
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-600 font-bold text-xs uppercase cursor-not-allowed"
                            title="Nomor WhatsApp pemain belum diisi"
                          >
                            No WA Kosong
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">
            Tautan konfirmasi otomatis memperbarui daftar <strong>SQUAD LIST</strong> di halaman pertandingan.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

