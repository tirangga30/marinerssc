'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  ArrowLeft,
  Check,
  Edit,
  Trash2,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { getClientAdminSeason } from '@/lib/adminSeason';

interface Season {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
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

export default function AdminCompetitionsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');

  const [showModal, setShowModal] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [compForm, setCompForm] = useState({
    name: '',
    seasonName: '',
    seasonId: '',
    type: 'Turnamen',
    isPrimary: false,
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const fetchMeta = async () => {
    setLoading(true);
    try {
      const [resSeasons, resComps] = await Promise.all([
        fetch('/api/admin/seasons'),
        fetch('/api/admin/competitions'),
      ]);
      const [seasonsData, compsData] = await Promise.all([
        resSeasons.json(),
        resComps.json(),
      ]);

      if (Array.isArray(seasonsData)) {
        setSeasons(seasonsData);
        const activeGlobal = getClientAdminSeason();
        if (activeGlobal && seasonsData.some((s) => s.name === activeGlobal)) {
          setSelectedSeason(activeGlobal);
        } else if (seasonsData.length > 0) {
          const current = seasonsData.find((s) => s.isCurrent) || seasonsData[0];
          setSelectedSeason(current.name);
        }
      }

      if (Array.isArray(compsData)) {
        setCompetitions(compsData);
      }
    } catch (err) {
      console.error('Failed to load competitions data:', err);
      showNotification('error', 'Gagal memuat data kompetisi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeta();

    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setSelectedSeason(e.detail.season);
      }
    };
    window.addEventListener('admin_season_changed', handleSeasonChange);
    return () => window.removeEventListener('admin_season_changed', handleSeasonChange);
  }, []);

  const openAddModal = () => {
    setEditingComp(null);
    const activeSeasonObj = seasons.find((s) => s.name === selectedSeason) || seasons[0];
    setCompForm({
      name: '',
      seasonName: activeSeasonObj ? activeSeasonObj.name : '2026',
      seasonId: activeSeasonObj ? activeSeasonObj.id : '',
      type: 'Turnamen',
      isPrimary: false,
    });
    setShowModal(true);
  };

  const openEditModal = (comp: Competition) => {
    setEditingComp(comp);
    setCompForm({
      name: comp.name,
      seasonName: comp.season || '',
      seasonId: comp.seasonId || '',
      type: comp.type || 'Turnamen',
      isPrimary: comp.isPrimary || false,
    });
    setShowModal(true);
  };

  const handleSaveComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name.trim()) {
      showNotification('error', 'Nama kompetisi harus diisi');
      return;
    }

    setSaving(true);
    try {
      const url = editingComp
        ? `/api/admin/competitions?id=${editingComp.id}`
        : '/api/admin/competitions';
      const method = editingComp ? 'PUT' : 'POST';

      const body = {
        id: editingComp ? editingComp.id : undefined,
        name: compForm.name.trim(),
        seasonName: compForm.seasonName,
        seasonId: compForm.seasonId || null,
        type: compForm.type,
        isPrimary: compForm.isPrimary,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kompetisi');

      showNotification('success', editingComp ? 'Kompetisi berhasil diperbarui' : 'Kompetisi baru berhasil dibuat');
      setShowModal(false);
      
      // Refresh competitions
      const resComps = await fetch('/api/admin/competitions');
      const compsData = await resComps.json();
      if (Array.isArray(compsData)) setCompetitions(compsData);
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComp = async (comp: Competition) => {
    if (!confirm(`Hapus kompetisi "${comp.name}"?\n\nPerhatian: Pastikan tidak ada pertandingan penting yang bergantung pada kompetisi ini.`)) return;

    try {
      const res = await fetch(`/api/admin/competitions?id=${comp.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kompetisi');

      showNotification('success', `Kompetisi ${comp.name} berhasil dihapus`);
      const resComps = await fetch('/api/admin/competitions');
      const compsData = await resComps.json();
      if (Array.isArray(compsData)) setCompetitions(compsData);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const filteredCompetitions = competitions.filter((c) => {
    return c.season === selectedSeason || c.seasonId === selectedSeason;
  });

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
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight">
                Kelola Kompetisi
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Atur daftar turnamen, liga resmi, dan friendly match klub untuk setiap musim.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Active Season Badge (controlled from Dashboard) */}
          <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sky-300 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Musim {selectedSeason}
          </span>

          <button
            onClick={openAddModal}
            className="px-3 sm:px-4 py-2 rounded-xl white-blue-btn font-extrabold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Tambah Kompetisi
          </button>
        </div>
      </div>

      {/* Competitions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black uppercase text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            Daftar Kompetisi Musim {selectedSeason} ({filteredCompetitions.length})
          </h2>
        </div>

        {loading ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span className="text-xs font-bold">Memuat kompetisi...</span>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-400">
              Belum ada kompetisi terdaftar untuk Musim {selectedSeason}.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl blue-gradient-bg text-white font-bold text-xs uppercase"
            >
              + Buat Kompetisi Pertama
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetitions.map((comp) => {
              const matchCount = comp._count?.matches ?? 0;
              const typeBadgeColor =
                comp.type === 'Turnamen'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : comp.type === 'Liga'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';

              return (
                <div
                  key={comp.id}
                  className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 hover:border-sky-400/40 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 text-sky-400 flex items-center justify-center font-bold">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                            {comp.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Musim: <b className="text-slate-200">{comp.season || comp.seasonRef?.name || 'Semua Musim'}</b>
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${typeBadgeColor}`}>
                        {comp.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>{matchCount} Pertandingan Terdaftar</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => openEditModal(comp)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComp(comp)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Add/Edit Competition */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-sky-400/40 shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                {editingComp ? 'Edit Kompetisi' : 'Tambah Kompetisi Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveComp} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Nama Kompetisi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BANDUNG CUP, LIGA 3, FRIENDLY"
                  value={compForm.name}
                  onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold uppercase focus:border-sky-400 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Jenis Kompetisi
                </label>
                <select
                  value={compForm.type}
                  onChange={(e) => setCompForm({ ...compForm, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-sky-400 outline-none text-xs cursor-pointer"
                >
                  <option value="Turnamen">Turnamen (Knockout / Group + Playoff)</option>
                  <option value="Liga">Liga (Regular League)</option>
                  <option value="Friendly">Friendly Match (Persahabatan / Matchday)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Musim Terkait
                </label>
                <select
                  value={compForm.seasonName}
                  onChange={(e) => {
                    const sName = e.target.value;
                    const sObj = seasons.find((s) => s.name === sName);
                    setCompForm({
                      ...compForm,
                      seasonName: sName,
                      seasonId: sObj?.id || '',
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-sky-400 outline-none text-xs cursor-pointer"
                >
                  {seasons.map((s) => (
                    <option key={s.id} value={s.name}>
                      Musim {s.name} {s.isCurrent ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={compForm.isPrimary}
                  onChange={(e) => setCompForm({ ...compForm, isPrimary: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isPrimary" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Kompetisi Utama Musim Ini
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl white-blue-btn font-extrabold uppercase text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingComp ? 'Simpan Perubahan' : 'Buat Kompetisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
