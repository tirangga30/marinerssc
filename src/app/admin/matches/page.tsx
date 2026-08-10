'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Plus, Edit, Trash2, ArrowLeft, X, Save, Shield, Settings2 } from 'lucide-react';

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

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<FootballMatch | null>(null);

  const [formData, setFormData] = useState({
    opponentName: '',
    opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
    matchDate: new Date().toISOString().slice(0, 16),
    competition: 'BRI Liga 1',
    venue: 'Stadion Gelora Samudra, Jakarta',
    isHome: true,
    status: 'scheduled',
    homeScore: '',
    awayScore: '',
    formation: '4-3-3',
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
      opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
      matchDate: new Date().toISOString().slice(0, 16),
      competition: 'BRI Liga 1',
      venue: 'Stadion Gelora Samudra, Jakarta',
      isHome: true,
      status: 'scheduled',
      homeScore: '',
      awayScore: '',
      formation: '4-3-3',
      summary: '',
    });
    setShowModal(true);
  };

  const openEditModal = (m: FootballMatch) => {
    setEditingMatch(m);
    setFormData({
      opponentName: m.opponentName,
      opponentLogo: m.opponentLogo,
      matchDate: new Date(m.matchDate).toISOString().slice(0, 16),
      competition: m.competition,
      venue: m.venue,
      isHome: m.isHome,
      status: m.status,
      homeScore: m.homeScore !== null ? m.homeScore.toString() : '',
      awayScore: m.awayScore !== null ? m.awayScore.toString() : '',
      formation: m.formation,
      summary: m.summary || '',
    });
    setShowModal(true);
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchMatches();
      } else {
        alert('Gagal menyimpan data pertandingan');
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
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-amber-400"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard Admin
        </Link>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Tambah Pertandingan Baru
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase text-slate-100 gold-gradient-text">
            Manajemen Pertandingan ({matches.length})
          </h1>
        </div>

        {/* Matches Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-amber-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal Laga</th>
                <th className="p-3">Lawan & Logo</th>
                <th className="p-3">Status / Skor</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3">Formasi Taktis</th>
                <th className="p-3 text-right">Aksi & Lineup Builder</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-200">
                    {new Date(m.matchDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 flex items-center gap-3">
                    <img src={m.opponentLogo} alt={m.opponentName} className="w-7 h-7 object-contain" />
                    <span className="font-bold text-slate-100 uppercase">{m.opponentName}</span>
                  </td>
                  <td className="p-3">
                    {m.status === 'finished' ? (
                      <span className="font-mono font-black text-amber-400 text-sm">
                        {m.homeScore} - {m.awayScore}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase">
                        Mendatang
                      </span>
                    )}
                  </td>
                  <td className="p-3">{m.isHome ? 'Kandang' : 'Tandang'}</td>
                  <td className="p-3 font-mono font-bold text-slate-200">{m.formation}</td>
                  <td className="p-3 text-right space-x-2">
                    <Link
                      href={`/admin/matches/${m.id}/lineup`}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition-colors font-bold uppercase text-[10px] inline-flex items-center gap-1"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> Lineup Builder
                    </Link>
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Match */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-amber-400">
                {editingMatch ? 'Edit Pertandingan' : 'Tambah Pertandingan Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Nama Tim Lawan</label>
                  <input
                    type="text"
                    required
                    value={formData.opponentName}
                    onChange={(e) => setFormData({ ...formData, opponentName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                    placeholder="Persija Jakarta"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">URL Logo Lawan</label>
                  <input
                    type="url"
                    required
                    value={formData.opponentLogo}
                    onChange={(e) => setFormData({ ...formData, opponentLogo: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Waktu Pertandingan</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.matchDate}
                    onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Status Laga</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="scheduled">Mendatang (Scheduled)</option>
                    <option value="finished">Selesai (Finished)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Skor Tuan Rumah (Home)</label>
                  <input
                    type="number"
                    value={formData.homeScore}
                    onChange={(e) => setFormData({ ...formData, homeScore: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Skor Tamu (Away)</label>
                  <input
                    type="number"
                    value={formData.awayScore}
                    onChange={(e) => setFormData({ ...formData, awayScore: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Formasi Utama</label>
                  <input
                    type="text"
                    value={formData.formation}
                    onChange={(e) => setFormData({ ...formData, formation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                    placeholder="4-3-3"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-400">
                    <input
                      type="checkbox"
                      checked={formData.isHome}
                      onChange={(e) => setFormData({ ...formData, isHome: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span>Mariners FC Tuan Rumah</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">Ringkasan Singkat Pertandingan</label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
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
                  className="px-6 py-2 rounded-xl gold-gradient-bg text-slate-950 font-extrabold uppercase flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" /> Simpan Pertandingan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
