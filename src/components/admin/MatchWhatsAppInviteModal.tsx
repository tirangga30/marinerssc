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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Total Skuad</span>
                <span className="text-lg font-black font-mono text-slate-900">{data?.totalPlayers || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Konfirmasi Ikut</span>
                <span className="text-lg font-black font-mono text-emerald-800">{data?.confirmedCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Menunggu Respon</span>
                <span className="text-lg font-black font-mono text-amber-800">{data?.invitedCount || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase block">Tidak Bisa</span>
                <span className="text-lg font-black font-mono text-rose-800">{data?.declinedCount || 0}</span>
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
                  {data?.hasWhatsAppToken ? 'WhatsApp Gateway Terhubung' : 'Kirim Langsung / Manual 1-Klik'}
                </span>
                <p className="text-[11px] text-slate-600">
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs outline-none focus:border-blue-500"
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
                      : 'Tidak Bisa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Players Table / List */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white divide-y divide-slate-100 shadow-xs">
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
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      {/* Player Avatar & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                          <img
                            src={p.photoUrl || '/playertemplate.webp'}
                            alt={p.name}
                            className="w-full h-full object-cover object-top scale-[1.3] origin-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm uppercase truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              #{p.number}
                            </span>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">
                              {p.position}
                            </span>
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
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-300 text-[10px] font-bold uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Menunggu
                            </span>
                          )}
                        </div>

                        {/* Copy Link Button */}
                        <button
                          type="button"
                          onClick={() => handleCopy(p.inviteUrl, p.id)}
                          title="Salin tautan konfirmasi pemain"
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
                })
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

