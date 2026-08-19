'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, ArrowLeft, X, Save, Upload, Loader2, Star } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  nationality: string;
  birthDate?: string | Date | null;
  heightCm: number | null;
  weightKg: number | null;
  photoUrl: string;
  bio: string;
  isCaptain: boolean;
  isFeatured: boolean;
  status: string;
  isGuest: boolean;
  goals: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [uploading, setUploading] = useState(false);

  const formatDateForInput = (d?: string | Date | null) => {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const normalizePos = (pos: string) => {
    const p = pos?.toUpperCase();
    if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
    if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
    if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
    if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
    return p || 'FORWARD';
  };

  // Form State - Default Photo Template is /playertemplate.png
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'FORWARD',
    nationality: 'Indonesia',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    photoUrl: '/playertemplate.png',
    bio: '',
    isCaptain: false,
    status: 'Active',
    isGuest: false,
    goals: '0',
    assists: '0',
    appearances: '0',
    yellowCards: '0',
    redCards: '0',
  });

  const getPosWeight = (pos: string): number => {
    const p = (pos || '').toUpperCase();
    if (p === 'GK' || p === 'GOALKEEPER') return 1;
    if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 2;
    if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 3;
    if (p === 'FW' || p === 'FORWARD' || p.includes('ST') || p.includes('LW') || p.includes('RW')) return 4;
    return 5;
  };

  const sortPlayersByPos = (list: Player[]) => {
    return [...list].sort((a, b) => {
      const wA = getPosWeight(a.position);
      const wB = getPosWeight(b.position);
      if (wA !== wB) return wA - wB;
      return a.number - b.number;
    });
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players');
      const data = await res.json();
      setPlayers(sortPlayersByPos(data));

      const guestRes = await fetch('/api/players?guestsOnly=true');
      const guestData = await guestRes.json();
      setGuestPlayers(sortPlayersByPos(guestData));
    } catch {
      console.error('Gagal mengambil pemain');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // Toggle Star (Pemain Bintang / Favorit Beranda)
  const toggleStar = async (player: Player) => {
    try {
      const newFeaturedState = !player.isFeatured;

      // Limit maximum 6 featured players on homepage
      if (newFeaturedState) {
        const currentFeaturedCount = players.filter((p) => p.isFeatured).length;
        if (currentFeaturedCount >= 6) {
          alert('Maksimal 6 pemain yang dapat ditambahkan ke Beranda Utama.');
          return;
        }
      }

      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFeatured: newFeaturedState,
        }),
      });

      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) => (p.id === player.id ? { ...p, isFeatured: newFeaturedState } : p))
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Gagal mengubah status pemain bintang');
      }
    } catch {
      alert('Terjadi kesalahan saat mengubah status pemain bintang');
    }
  };

  const openAddModal = () => {
    setEditingPlayer(null);
    setFormData({
      name: '',
      number: '',
      position: 'FW',
      nationality: 'Indonesia',
      birthDate: '',
      heightCm: '',
      weightKg: '',
      photoUrl: '/playertemplate.png',
      bio: '',
      isCaptain: false,
      status: 'Active',
      isGuest: false,
      goals: '0',
      assists: '0',
      appearances: '0',
      yellowCards: '0',
      redCards: '0',
    });
    setShowModal(true);
  };

  const handleSelectGuest = (guestId: string) => {
    const guest = guestPlayers.find(g => g.id === guestId);
    if (guest) {
      setEditingPlayer(guest);
      setFormData({
        name: guest.name,
        number: guest.number.toString(),
        position: guest.position,
        nationality: guest.nationality || 'Indonesia',
        birthDate: formatDateForInput(guest.birthDate),
        heightCm: guest.heightCm?.toString() || '',
        weightKg: guest.weightKg?.toString() || '',
        photoUrl: guest.photoUrl || '/playertemplate.png',
        bio: guest.bio || '',
        isCaptain: guest.isCaptain || false,
        status: guest.status || 'Active',
        isGuest: false,
        goals: guest.goals.toString(),
        assists: guest.assists.toString(),
        appearances: guest.appearances.toString(),
        yellowCards: guest.yellowCards.toString(),
        redCards: guest.redCards.toString(),
      });
    } else {
      openAddModal(); // Reset form if empty string is selected
    }
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      nationality: player.nationality,
      birthDate: formatDateForInput(player.birthDate),
      heightCm: player.heightCm?.toString() || '',
      weightKg: player.weightKg?.toString() || '',
      photoUrl: player.photoUrl || '/playertemplate.png',
      bio: player.bio,
      isCaptain: player.isCaptain,
      status: player.status,
      isGuest: false,
      goals: player.goals.toString(),
      assists: player.assists.toString(),
      appearances: player.appearances.toString(),
      yellowCards: player.yellowCards.toString(),
      redCards: player.redCards.toString(),
    });
    setShowModal(true);
  };

  // Direct File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    body.append('folder', 'players');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData((prev) => ({ ...prev, photoUrl: data.url }));
      } else {
        alert(data.error || 'Gagal mengunggah foto');
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah foto');
    } finally {
      setUploading(false);
    }
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
        const errorData = await res.json();
        alert(errorData.error || 'Gagal menyimpan data pemain');
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
          <Plus className="w-4 h-4 text-blue-600" /> Tambah Pemain Baru
        </button>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-sky-400/30 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h1 className="text-xl font-black uppercase text-white blue-gradient-text">
            Daftar Pemain Skuad Mariners SC ({players.length})
          </h1>
        </div>

        {/* Players Table */}
        <div className="overflow-x-auto">
          {(() => {
            const featuredCount = players.filter((p) => p.isFeatured).length;
            const isLimitReached = featuredCount >= 6;
            return (
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-900/90 text-sky-400 font-bold uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">Pemain</th>
                    <th className="p-3">Posisi</th>
                    <th className="p-3">Gol / Assist</th>
                    <th className="p-3">Laga</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Beranda ({featuredCount}/6)</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {players.map((player) => (
                    <tr key={player.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-sky-400">#{player.number}</td>
                      <td className="p-3 flex items-center gap-3">
                        <img
                          src={player.photoUrl || '/playertemplate.png'}
                          alt={player.name}
                          className="w-10 h-10 rounded-xl object-cover border border-sky-400/40 shadow-sm"
                        />
                        <div>
                          <span className="font-bold text-white">{player.name}</span>
                          {player.isCaptain && (
                            <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase">
                              👑 Kapten
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-sky-300">
                        {normalizePos(player.position)}
                        {player.isGuest && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] uppercase tracking-wider border border-amber-500/30">Loan</span>}
                      </td>
                      <td className="p-3">{player.goals} Gol / {player.assists} Assist</td>
                      <td className="p-3">{player.appearances}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${player.status === 'Active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                          {player.status}
                        </span>
                      </td>

                      {/* TOMBOL BINTANG (FAVORIT BERANDA - MAX 6) */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleStar(player)}
                          disabled={isLimitReached && !player.isFeatured}
                          title={
                            player.isFeatured
                              ? 'Hapus dari Pemain Beranda'
                              : isLimitReached
                              ? 'Maksimal 6 Pemain Beranda Tercapai'
                              : 'Tampilkan di Pemain Beranda'
                          }
                          className={`p-2 rounded-xl border transition-all ${
                            player.isFeatured
                              ? 'bg-amber-500/20 border-amber-400/60 text-amber-400 shadow-md shadow-amber-500/20 scale-110'
                              : isLimitReached
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-700 cursor-not-allowed opacity-40'
                              : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-400/40'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${player.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </td>

                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    {player.isGuest && (
                      <button
                        onClick={async () => {
                          if (confirm('Promosikan ' + player.name + ' ke skuad utama?')) {
                            await fetch('/api/players/' + player.id, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isGuest: false })
                            });
                            fetchPlayers();
                          }
                        }}
                        title="Promosikan ke Skuad Utama"
                        className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-400 hover:text-slate-950 transition-colors border border-amber-500/30"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(player)}
                      className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors"
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
        );
      })()}
        </div>
      </div>

      {/* Modal Add / Edit Player */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-6 sm:p-8 rounded-3xl border border-sky-400/30 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xl font-black uppercase text-white tracking-wide">
                {editingPlayer ? 'Edit Pemain' : 'Tambah Pemain Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
              {!editingPlayer && guestPlayers.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <label className="font-bold text-amber-400 uppercase text-xs">Pilih dari Pemain Loan (Opsional)</label>
                  <p className="text-xs text-amber-200/60 mb-2">Pilih pemain loan untuk dipromosikan ke skuad utama secara permanen.</p>
                  <select 
                    onChange={(e) => handleSelectGuest(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-amber-400 outline-none text-sm"
                  >
                    <option value="">-- Buat Baru (Bukan dari Loan) --</option>
                    {guestPlayers.map(g => (
                      <option key={g.id} value={g.id}>{g.name} (#{g.number})</option>
                    ))}
                  </select>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Photo Upload Section */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <label className="font-bold text-sky-300 uppercase block">Foto Pemain (Direct Upload)</label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-400/40 shrink-0">
                    <img
                      src={formData.photoUrl || '/playertemplate.png'}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 text-xs transition-colors">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Mengunggah...' : 'Upload Foto'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '/playertemplate.png' }))}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                      >
                        Reset Template
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Pilih file gambar (.jpg, .png, .webp)<strong>/playertemplate.png</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Nomor Punggung</label>
                  <input
                    type="number"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Posisi Utama</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  >
                    <option value="GOALKEEPER">GOALKEEPER</option>
                    <option value="DEFENDER">DEFENDER</option>
                    <option value="MIDFIELDER">MIDFIELDER</option>
                    <option value="FORWARD">FORWARD</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Kewarganegaraan</label>
                  <input
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1">Berat (kg)</label>
                  <input
                    type="number"
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-400">
                  <input
                    type="checkbox"
                    checked={formData.isCaptain}
                    onChange={(e) => setFormData({ ...formData, isCaptain: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span>Kapten Tim</span>
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
                  disabled={uploading}
                  className="px-6 py-2 rounded-xl white-blue-btn font-extrabold uppercase flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4 text-blue-600" /> Simpan Pemain
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
