'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Edit, Trash2, ArrowLeft, X, Save, Settings2, Upload, Loader2 } from 'lucide-react';
import { formatDateForInput, WIB_TIMEZONE } from '@/lib/date';

interface FootballMatch {
  id: string;
  opponentName: string;
  opponentLogo: string;
  matchDate: string;
  competition: string;
  venue: string;
  isHome: boolean;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  formation: string;
  summary: string | null;
}

function getDynamicMatchStatus(m: any): 'scheduled' | 'live' | 'finished' | 'score_pending' {
  if (!m) return 'scheduled';

  const hasScore = m.homeScore !== null && m.awayScore !== null && m.homeScore !== undefined && m.awayScore !== undefined;
  const hasFulltime = Array.isArray(m.events) && m.events.some((e: any) => e.type === 'fulltime');
  const isExplicitlyFinished = m.status === 'finished' || hasFulltime;

  const now = new Date();
  const start = new Date(m.matchDate);
  if (isNaN(start.getTime())) return 'scheduled';

  let isTimeFinished = false;
  if (m.isLiveEnabled !== false) {
    isTimeFinished = isExplicitlyFinished;
  } else {
    const durationMinutes = m.duration || 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    isTimeFinished = isExplicitlyFinished || now >= end;
  }

  if (isTimeFinished) {
    if (!hasScore) return 'score_pending';
    return 'finished';
  }

  if (now >= start) return 'live';
  return 'scheduled';
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<FootballMatch | null>(null);
  const [uploading, setUploading] = useState(false);

  const getDefaultMatchDate = () => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    opponentName: '',
    opponentLogo: '/defaultteam.png',
    matchDate: getDefaultMatchDate(),
    competition: 'Matchday 1',
    venue: '',
    isHome: true,
    summary: '',
  });

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/matches');
      const data = await res.json();
      setMatches(data);
    } catch {
      console.error('Gagal mengambil pertandingan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const openAddModal = () => {
    setEditingMatch(null);
    setFormData({
      opponentName: '',
      opponentLogo: '/defaultteam.png',
      matchDate: getDefaultMatchDate(),
      competition: 'Matchday 1',
      venue: '',
      isHome: true,
      summary: '',
    });
    setShowModal(true);
  };

  const openEditModal = (m: FootballMatch) => {
    setEditingMatch(m);
    setFormData({
      opponentName: m.opponentName,
      opponentLogo: m.opponentLogo,
      matchDate: formatDateForInput(m.matchDate),
      competition: m.competition,
      venue: m.venue || '',
      isHome: m.isHome,
      summary: m.summary || '',
    });
    setShowModal(true);
  };

  // Direct Opponent Logo Upload Handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'matches');
    body.append('opponentName', formData.opponentName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, opponentLogo: data.url }));
      } else {
        alert(data.error || 'Gagal mengunggah logo lawan');
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah logo lawan');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pertandingan ini?')) return;
    try {
      await fetch(`/api/matches/${id}`, { method: 'DELETE' });
      fetchMatches();
    } catch {
      alert('Gagal menghapus pertandingan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingMatch ? `/api/matches/${editingMatch.id}` : '/api/matches';
      const method = editingMatch ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        status: editingMatch ? editingMatch.status : 'scheduled',
        formation: editingMatch ? editingMatch.formation : '4-3-3',
        homeScore: editingMatch ? editingMatch.homeScore : null,
        awayScore: editingMatch ? editingMatch.awayScore : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        fetchMatches();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menyimpan data pertandingan');
      }
    } catch {
      alert('Terjadi kesalahan');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-300 hover:text-sky-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard Admin
        </Link>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl white-blue-btn font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4 text-blue-600" /> Tambah Pertandingan Baru
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-sky-400/30 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase text-white blue-gradient-text">
            Manajemen Pertandingan ({matches.length})
          </h1>
        </div>

        {/* Matches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-sky-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal Laga</th>
                <th className="p-3">Lawan & Logo (Tanpa Box)</th>
                <th className="p-3 text-center">Status / Skor</th>
                <th className="p-3">Stadion / Lapangan</th>
                <th className="p-3">Tuan Rumah</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {matches.map((m) => {
                const dynamicStatus = getDynamicMatchStatus(m);
                return (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">
                      {new Date(m.matchDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: WIB_TIMEZONE })}
                    </td>
                    <td className="p-3 flex items-center gap-3">
                      <img src={m.opponentLogo} alt={m.opponentName} className="w-9 h-9 object-contain drop-shadow" />
                      <span className="font-bold text-white uppercase">{m.opponentName}</span>
                    </td>
                    <td className="p-3 text-center">
                      {dynamicStatus === 'live' ? (
                        <span className="px-2.5 py-1 rounded bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] font-black uppercase tracking-wider animate-pulse inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
                        </span>
                      ) : dynamicStatus === 'score_pending' ? (
                        <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider inline-block">
                          SKOR BELUM DIINPUT
                        </span>
                      ) : dynamicStatus === 'finished' ? (
                        <span className="font-mono font-black text-sky-400 text-sm">
                          {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : '—'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase">
                          Mendatang
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{m.venue || '—'}</td>
                    <td className="p-3">{m.isHome ? 'Kandang (Home)' : 'Tandang (Away)'}</td>
                    <td className="p-3 text-right space-x-2">
                      <Link
                        href={`/admin/matches/${m.id}/lineup`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-sky-300 border border-sky-400/40 hover:bg-blue-600 hover:text-white transition-colors font-bold uppercase text-[10px] inline-flex items-center gap-1"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> Match Options
                      </Link>
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Match */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-sky-400">
                {editingMatch ? 'Edit Pertandingan' : 'Tambah Pertandingan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              {/* DIRECT OPPONENT LOGO UPLOAD SECTION */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <label className="font-bold text-sky-300 uppercase block">Logo Tim Lawan (Direct Upload)</label>
                <div className="flex items-center gap-4">
                  {/* NO BOX around preview logo */}
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    <img
                      src={formData.opponentLogo || '/defaultteam.png'}
                      alt="Logo Lawan"
                      className="w-14 h-14 object-contain drop-shadow-xl"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-2 text-xs transition-colors">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Mengunggah...' : 'Upload Logo Lawan'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Unggah file logo lawan (.png/.jpg).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Nama Tim Lawan</label>
                  <input
                    type="text"
                    required
                    value={formData.opponentName}
                    onChange={(e) => setFormData({ ...formData, opponentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                    placeholder="Masukan Tim Lawan"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Waktu Pertandingan</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.matchDate}
                    onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1">Lapangan / Stadion (Venue)</label>
                <input
                  type="text"
                  required
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  placeholder="Masukkan lokasi / nama stadion..."
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sky-400">
                  <input
                    type="checkbox"
                    checked={formData.isHome}
                    onChange={(e) => setFormData({ ...formData, isHome: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Mariners SC Tuan Rumah (Home Match)</span>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1">Ringkasan Singkat Pertandingan</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold uppercase"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 rounded-xl white-blue-btn font-extrabold uppercase flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4 text-blue-600" /> Simpan Pertandingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
