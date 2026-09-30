'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Trophy,
  Plus,
  ArrowLeft,
  Check,
  Edit,
  Trash2,
  Users,
  Star,
  Layers,
  Sparkles,
  Shield,
  Loader2,
  AlertCircle,
  X,
  Search,
} from 'lucide-react';

interface Season {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  createdAt: string;
  _count?: {
    matches: number;
    competitions: number;
    players: number;
  };
}

interface Competition {
  id: string;
  name: string;
  slug: string;
  season: string;
  seasonId?: string | null;
  type: string;
  isPrimary: boolean;
  _count?: {
    matches: number;
  };
  seasonRef?: {
    id: string;
    name: string;
    year: number;
  };
}

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string | null;
}

export default function AdminSeasonsPage() {
  const [activeTab, setActiveTab] = useState<'seasons' | 'competitions'>('seasons');

  // Seasons state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    isCurrent: false,
    copyFromSeasonId: '',
  });

  // Squad management modal
  const [squadModalSeason, setSquadModalSeason] = useState<Season | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [savingSquad, setSavingSquad] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');

  // Competitions state
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);
  const [showCompModal, setShowCompModal] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [compFilterSeason, setCompFilterSeason] = useState<string>('all');
  const [compForm, setCompForm] = useState({
    name: '',
    seasonName: '',
    seasonId: '',
    type: 'Turnamen',
    isPrimary: false,
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Fetch Seasons
  const fetchSeasons = async () => {
    setLoadingSeasons(true);
    try {
      const res = await fetch('/api/admin/seasons');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSeasons(data);
      }
    } catch {
      showNotification('error', 'Gagal memuat data musim');
    } finally {
      setLoadingSeasons(false);
    }
  };

  // Fetch Competitions
  const fetchCompetitions = async () => {
    setLoadingCompetitions(true);
    try {
      const res = await fetch('/api/admin/competitions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCompetitions(data);
      }
    } catch {
      showNotification('error', 'Gagal memuat data kompetisi');
    } finally {
      setLoadingCompetitions(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
    fetchCompetitions();
  }, []);

  // Open Create/Edit Season Modal
  const openSeasonModal = (season?: Season) => {
    if (season) {
      setEditingSeason(season);
      setSeasonForm({
        name: season.name,
        year: season.year,
        isCurrent: season.isCurrent,
        copyFromSeasonId: '',
      });
    } else {
      setEditingSeason(null);
      const nextYear = new Date().getFullYear();
      setSeasonForm({
        name: `${nextYear}`,
        year: nextYear,
        isCurrent: seasons.length === 0,
        copyFromSeasonId: seasons[0]?.id || '',
      });
    }
    setShowSeasonModal(true);
  };

  // Save Season
  const handleSaveSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seasonForm.name.trim()) return;

    setSaving(true);
    try {
      const method = editingSeason ? 'PUT' : 'POST';
      const body: any = {
        ...seasonForm,
        ...(editingSeason ? { id: editingSeason.id } : {}),
      };

      const res = await fetch('/api/admin/seasons', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan musim');
      }

      showNotification('success', editingSeason ? 'Musim berhasil diperbarui' : 'Musim baru berhasil ditambahkan');
      setShowSeasonModal(false);
      fetchSeasons();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Set Active Season
  const handleSetActiveSeason = async (season: Season) => {
    if (season.isCurrent) return;
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: season.id, isCurrent: true }),
      });
      if (!res.ok) throw new Error('Gagal mengaktifkan musim');
      showNotification('success', `Musim ${season.name} sekarang aktif`);
      fetchSeasons();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Delete Season
  const handleDeleteSeason = async (season: Season) => {
    if (!confirm(`Hapus musim ${season.name}? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      const res = await fetch(`/api/admin/seasons?id=${season.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus musim');

      showNotification('success', `Musim ${season.name} berhasil dihapus`);
      fetchSeasons();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Open Squad Management Modal
  const openSquadModal = async (season: Season) => {
    setSquadModalSeason(season);
    setLoadingSquad(true);
    setPlayerSearch('');
    try {
      const res = await fetch(`/api/admin/seasons/${season.id}/players`);
      const data = await res.json();
      if (res.ok) {
        setAllPlayers(data.allPlayers || []);
        setSelectedPlayerIds(data.enrolledPlayerIds || []);
      } else {
        throw new Error(data.error || 'Gagal memuat skuad');
      }
    } catch (err: any) {
      showNotification('error', err.message);
      setSquadModalSeason(null);
    } finally {
      setLoadingSquad(false);
    }
  };

  // Save Squad Selection
  const handleSaveSquad = async () => {
    if (!squadModalSeason) return;
    setSavingSquad(true);
    try {
      const res = await fetch(`/api/admin/seasons/${squadModalSeason.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan skuad');

      showNotification('success', `Skuad musim ${squadModalSeason.name} diperbarui (${data.playerCount} pemain)`);
      setSquadModalSeason(null);
      fetchSeasons();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSavingSquad(false);
    }
  };

  // Toggle player selection
  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  // Select all or deselect all
  const selectAllPlayers = () => {
    setSelectedPlayerIds(allPlayers.map((p) => p.id));
  };
  const deselectAllPlayers = () => {
    setSelectedPlayerIds([]);
  };

  // Open Competition Modal
  const openCompModal = (comp?: Competition) => {
    if (comp) {
      setEditingComp(comp);
      setCompForm({
        name: comp.name,
        seasonName: comp.season,
        seasonId: comp.seasonId || '',
        type: comp.type,
        isPrimary: comp.isPrimary,
      });
    } else {
      setEditingComp(null);
      const defaultSeason = seasons.find((s) => s.isCurrent) || seasons[0];
      setCompForm({
        name: '',
        seasonName: defaultSeason?.name || '2026',
        seasonId: defaultSeason?.id || '',
        type: 'Turnamen',
        isPrimary: false,
      });
    }
    setShowCompModal(true);
  };

  // Save Competition
  const handleSaveComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name.trim()) return;

    setSaving(true);
    try {
      const method = editingComp ? 'PUT' : 'POST';
      const body: any = {
        ...compForm,
        ...(editingComp ? { id: editingComp.id } : {}),
      };

      const res = await fetch('/api/admin/competitions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kompetisi');

      showNotification('success', editingComp ? 'Kompetisi berhasil diperbarui' : 'Kompetisi baru berhasil dibuat');
      setShowCompModal(false);
      fetchCompetitions();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete Competition
  const handleDeleteComp = async (comp: Competition) => {
    if (!confirm(`Hapus kompetisi "${comp.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/competitions?id=${comp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kompetisi');

      showNotification('success', `Kompetisi ${comp.name} berhasil dihapus`);
      fetchCompetitions();
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const filteredCompetitions = competitions.filter((c) => {
    if (compFilterSeason === 'all') return true;
    return c.season === compFilterSeason || c.seasonId === compFilterSeason;
  });

  const filteredPlayers = allPlayers.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
    String(p.number).includes(playerSearch) ||
    p.position.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border text-xs sm:text-sm font-bold backdrop-blur-md animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-red-950/90 border-red-500/50 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 sm:p-6 rounded-2xl border border-sky-400/30">
        <div className="space-y-1">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl blue-gradient-bg text-white flex items-center justify-center shadow-lg border border-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                Master Musim &amp; Kompetisi
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Atur kalender musim resmi klub, kategori kompetisi (Liga, Turnamen, Friendly), dan skuad pemain.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 p-1.5 glass-panel rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('seasons')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'seasons'
                ? 'blue-gradient-bg text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Musim ({seasons.length})
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTab === 'competitions'
                ? 'blue-gradient-bg text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Kompetisi ({competitions.length})
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: MASTER MUSIM
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'seasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-sky-400 inline-block" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Daftar Musim Resmi
              </h2>
            </div>
            <button
              onClick={() => openSeasonModal()}
              className="px-3.5 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" /> Tambah Musim
            </button>
          </div>

          {loadingSeasons ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Memuat data musim...</p>
            </div>
          ) : seasons.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">Belum ada musim terdaftar.</p>
              <button
                onClick={() => openSeasonModal()}
                className="px-4 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase"
              >
                Buat Musim Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasons.map((s) => (
                <div
                  key={s.id}
                  className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    s.isCurrent
                      ? 'border-sky-400/60 shadow-xl shadow-sky-500/10 bg-sky-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header Card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black uppercase text-white font-mono">
                            Musim {s.name}
                          </h3>
                          {s.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                          Tahun Kalender: {s.year}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openSeasonModal(s)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Musim"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!s.isCurrent && (s._count?.matches || 0) === 0 && (
                          <button
                            onClick={() => handleDeleteSeason(s)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                            title="Hapus Musim"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/60 text-center">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-400 block text-[10px]">Laga</span>
                        <span className="text-sm font-black font-mono text-white">
                          {s._count?.matches ?? 0}
                        </span>
                      </div>
                      <div className="space-y-0.5 border-x border-slate-800/60">
                        <span className="text-xs font-bold text-slate-400 block text-[10px]">Kompetisi</span>
                        <span className="text-sm font-black font-mono text-sky-400">
                          {s._count?.competitions ?? 0}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-400 block text-[10px]">Skuad</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {s._count?.players ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-4 flex items-center gap-2">
                    <button
                      onClick={() => openSquadModal(s)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Users className="w-3.5 h-3.5" /> Kelola Skuad
                    </button>

                    {!s.isCurrent ? (
                      <button
                        onClick={() => handleSetActiveSeason(s)}
                        className="py-2 px-3 rounded-xl blue-gradient-bg text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:scale-102 transition-all shadow-md"
                        title="Jadikan musim yang aktif di website"
                      >
                        <Check className="w-3.5 h-3.5" /> Aktifkan
                      </button>
                    ) : (
                      <span className="py-2 px-3 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-sky-400 fill-sky-400" /> Utama
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: MASTER KOMPETISI
         ═════════════════════════════════════════════════════════════ */}
      {activeTab === 'competitions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-5 rounded-full bg-sky-400 inline-block" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Daftar Kompetisi Resmi
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Season filter */}
              <select
                value={compFilterSeason}
                onChange={(e) => setCompFilterSeason(e.target.value)}
                className="px-3 py-2 rounded-xl glass-panel border border-slate-800 text-xs font-bold text-white bg-slate-900/90 focus:border-sky-400 focus:outline-none"
              >
                <option value="all">Semua Musim</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.name}>
                    Musim {s.name} {s.isCurrent ? '(Aktif)' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => openCompModal()}
                className="px-3.5 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:scale-105 transition-all shadow-lg shadow-sky-500/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Tambah Kompetisi
              </button>
            </div>
          </div>

          {loadingCompetitions ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Memuat data kompetisi...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-3">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-400">Belum ada kompetisi di musim ini.</p>
              <button
                onClick={() => openCompModal()}
                className="px-4 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase"
              >
                Tambah Kompetisi Baru
              </button>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Kompetisi</th>
                      <th className="py-3 px-4">Musim</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4 text-center">Jumlah Laga</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredCompetitions.map((comp) => (
                      <tr key={comp.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-white uppercase flex items-center gap-2">
                          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{comp.name}</span>
                          {comp.isPrimary && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black">
                              UTAMA
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sky-300 font-mono font-bold">
                          Musim {comp.season}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              comp.type === 'Friendly'
                                ? 'bg-blue-600/20 text-sky-300 border border-blue-500/30'
                                : comp.type === 'Liga'
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                            }`}
                          >
                            {comp.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                          {comp._count?.matches ?? 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openCompModal(comp)}
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Edit Kompetisi"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {(comp._count?.matches || 0) === 0 && (
                              <button
                                onClick={() => handleDeleteComp(comp)}
                                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                title="Hapus Kompetisi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: TAMBAH / EDIT MUSIM
         ═════════════════════════════════════════════════════════════ */}
      {showSeasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-sky-400/40 w-full max-w-md space-y-4 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                {editingSeason ? 'Edit Musim' : 'Tambah Musim Baru'}
              </h3>
              <button
                onClick={() => setShowSeasonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Nama Musim
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 atau 2026/2027"
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Tahun Kalender
                </label>
                <input
                  type="number"
                  required
                  value={seasonForm.year}
                  onChange={(e) => setSeasonForm({ ...seasonForm, year: parseInt(e.target.value) || 2026 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-sky-400 focus:outline-none"
                />
              </div>

              {!editingSeason && seasons.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                    Salin Skuad Pemain Dari
                  </label>
                  <select
                    value={seasonForm.copyFromSeasonId}
                    onChange={(e) => setSeasonForm({ ...seasonForm, copyFromSeasonId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">-- Jangan Salin (Mulai dari Kosong) --</option>
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        Musim {s.name} ({s._count?.players ?? 0} pemain)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Otomatis mendaftarkan pemain dari musim terpilih ke musim baru ini.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrent"
                  checked={seasonForm.isCurrent}
                  onChange={(e) => setSeasonForm({ ...seasonForm, isCurrent: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="isCurrent" className="text-xs text-white font-semibold cursor-pointer">
                  Jadikan sebagai Musim Aktif di Website
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSeasonModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg shadow-sky-500/30"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingSeason ? 'Perbarui' : 'Simpan Musim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: KELOLA SKUAD MUSIM
         ═════════════════════════════════════════════════════════════ */}
      {squadModalSeason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-sky-400/40 w-full max-w-2xl space-y-4 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Kelola Skuad Musim {squadModalSeason.name}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pilih pemain yang terdaftar dalam skuad utama musim ini ({selectedPlayerIds.length} terpilih)
                </p>
              </div>
              <button
                onClick={() => setSquadModalSeason(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nomor / nama / posisi..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={selectAllPlayers}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-bold uppercase tracking-wider"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={deselectAllPlayers}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-wider"
                >
                  Batalkan Semua
                </button>
              </div>
            </div>

            {/* Player List */}
            <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
              {loadingSquad ? (
                <div className="py-12 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Memuat pemain...</p>
                </div>
              ) : filteredPlayers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Tidak ada pemain yang sesuai pencarian.
                </div>
              ) : (
                filteredPlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-400/50 text-white'
                          : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div onClick
                          className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 pointer-events-none"
                        />
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-slate-700 flex items-center justify-center">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">
                              #{player.number}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">
                              {player.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-blue-900/60 text-sky-300 font-mono text-[9px] font-bold">
                              #{player.number}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {player.position}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-400/30">
                          Masuk Skuad
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
              <span className="text-xs text-slate-400">
                Total Skuad Terpilih: <strong className="text-white">{selectedPlayerIds.length}</strong> pemain
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSquadModalSeason(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingSquad}
                  onClick={handleSaveSquad}
                  className="px-4 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg shadow-sky-500/30"
                >
                  {savingSquad && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Simpan Skuad
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: TAMBAH / EDIT KOMPETISI
         ═════════════════════════════════════════════════════════════ */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 sm:p-7 rounded-2xl border border-sky-400/40 w-full max-w-md space-y-4 shadow-2xl bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                {editingComp ? 'Edit Kompetisi' : 'Tambah Kompetisi Baru'}
              </h3>
              <button
                onClick={() => setShowCompModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveComp} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Nama Kompetisi
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BANDUNG CUP, FRIENDLY, LIGA SAMUDRA"
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold uppercase focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Musim
                </label>
                <select
                  value={compForm.seasonId || compForm.seasonName}
                  onChange={(e) => {
                    const sel = seasons.find((s) => s.id === e.target.value || s.name === e.target.value);
                    setCompForm({
                      ...compForm,
                      seasonId: sel?.id || '',
                      seasonName: sel?.name || e.target.value,
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-sky-400 focus:outline-none"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      Musim {s.name} {s.isCurrent ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1">
                  Tipe Kompetisi
                </label>
                <select
                  value={compForm.type}
                  onChange={(e) => setCompForm({ ...compForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-bold focus:border-sky-400 focus:outline-none"
                >
                  <option value="Turnamen">Turnamen (Knockout / Cup)</option>
                  <option value="Liga">Liga (Klasemen / Round Robin)</option>
                  <option value="Friendly">Friendly Match (Uji Coba)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={compForm.isPrimary}
                  onChange={(e) => setCompForm({ ...compForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0"
                />
                <label htmlFor="isPrimary" className="text-xs text-white font-semibold cursor-pointer">
                  Jadikan Kompetisi Utama di Musim Ini
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl blue-gradient-bg text-white text-xs font-bold uppercase flex items-center gap-1.5 shadow-lg shadow-sky-500/30"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingComp ? 'Perbarui' : 'Simpan Kompetisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
