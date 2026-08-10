'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Edit, Trash2, ArrowLeft, X, Save, CheckCircle2 } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  heightCm: number | null;
  weightKg: number | null;
  photoUrl: string;
  bio: string;
  isCaptain: boolean;
  status: string;
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'FW',
    nationality: 'Indonesia',
    heightCm: '',
    weightKg: '',
    photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
    bio: '',
    isCaptain: false,
    status: 'Active',
    goals: '0',
    assists: '0',
    appearances: '0',
    yellowCards: '0',
    redCards: '0',
  });

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players');
      const data = await res.json();
      setPlayers(data);
    } catch {
      console.error('Gagal mengambil pemain');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const openAddModal = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      number: '',
      position: 'FW',
      nationality: 'Indonesia',
      heightCm: '',
      weightKg: '',
      photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
      bio: '',
      isCaptain: false,
      status: 'Active',
      goals: '0',
      assists: '0',
      appearances: '0',
      yellowCards: '0',
      redCards: '0',
    });
    setShowModal(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      nationality: player.nationality,
      heightCm: player.heightCm?.toString() || '',
      weightKg: player.weightKg?.toString() || '',
      photoUrl: player.photoUrl,
      bio: player.bio,
      isCaptain: player.isCaptain,
      status: player.status,
      goals: player.goals.toString(),
      assists: player.assists.toString(),
      appearances: player.appearances.toString(),
      yellowCards: player.yellowCards.toString(),
      redCards: player.redCards.toString(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus pemain ini?')) return;
    try {
      await fetch(`/api/players/${id}`, { method: 'DELETE' });
      fetchPlayers();
    } catch {
      alert('Gagal menghapus pemain');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlayer ? `/api/players/${editingPlayer.id}` : '/api/players';
      const method = editingPlayer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        fetchPlayers();
      } else {
        alert('Gagal menyimpan data pemain');
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
          <Plus className="w-4 h-4" /> Tambah Pemain Baru
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase text-slate-100 gold-gradient-text">
            Daftar Pemain Skuad ({players.length})
          </h1>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-amber-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Pemain</th>
                <th className="p-3">Posisi</th>
                <th className="p-3">Gol / Assist</th>
                <th className="p-3">Laga</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-amber-400">#{player.number}</td>
                  <td className="p-3 flex items-center gap-3">
                    <img src={player.photoUrl} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-amber-500/40" />
                    <div>
                      <span className="font-bold text-slate-100 uppercase">{player.name}</span>
                      {player.isCaptain && <span className="ml-2 text-[10px] text-amber-400 font-extrabold">(C)</span>}
                    </div>
                  </td>
                  <td className="p-3 font-bold text-amber-400/90">{player.position}</td>
                  <td className="p-3">{player.goals} Gol / {player.assists} Assist</td>
                  <td className="p-3">{player.appearances}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${player.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {player.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(player)}
                      className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
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

      {/* Modal Add / Edit Player */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black uppercase text-amber-400">
                {editingPlayer ? 'Edit Data Pemain' : 'Tambah Pemain Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Nomor Punggung</label>
                  <input
                    type="number"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Posisi Utama</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  >
                    <option value="GK">Penjaga Gawang (GK)</option>
                    <option value="DF">Bek / Defender (DF)</option>
                    <option value="MF">Gelandang / Midfielder (MF)</option>
                    <option value="FW">Penyerang / Forward (FW)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Kewarganegaraan</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Berat (kg)</label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">URL Foto Pemain</label>
                <input
                  type="url"
                  required
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">Biografi Singkat</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Gol</label>
                  <input
                    type="number"
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Assist</label>
                  <input
                    type="number"
                    value={formData.assists}
                    onChange={(e) => setFormData({ ...formData, assists: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Laga</label>
                  <input
                    type="number"
                    value={formData.appearances}
                    onChange={(e) => setFormData({ ...formData, appearances: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Kartu Kuning</label>
                  <input
                    type="number"
                    value={formData.yellowCards}
                    onChange={(e) => setFormData({ ...formData, yellowCards: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 uppercase block mb-1">Kartu Merah</label>
                  <input
                    type="number"
                    value={formData.redCards}
                    onChange={(e) => setFormData({ ...formData, redCards: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-400">
                  <input
                    type="checkbox"
                    checked={formData.isCaptain}
                    onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span>Kapten Utama</span>
                </label>
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
                  <Save className="w-4 h-4" /> Simpan Pemain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
