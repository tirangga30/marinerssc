'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Check, Plus, Calendar, Users, Layers, X, Loader2 } from 'lucide-react';
import { setClientAdminSeason } from '@/lib/adminSeason';

interface SeasonData {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  _count?: {
    matches: number;
    players: number;
    competitions: number;
  };
}

interface Props {
  seasons: SeasonData[];
  selectedSeason: string;
}

export default function DashboardSeasonSelector({ seasons, selectedSeason }: Props) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear() + 1,
    isCurrent: false,
    copyFromSeasonId: '',
  });

  const handleSelectSeason = (seasonName: string) => {
    setClientAdminSeason(seasonName);
    router.push(`/admin/dashboard?season=${encodeURIComponent(seasonName)}`);
    router.refresh();
  };

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Gagal menambahkan musim baru');
        return;
      }

      setShowAddModal(false);
      setClientAdminSeason(form.name.trim());
      router.push(`/admin/dashboard?season=${encodeURIComponent(form.name.trim())}`);
      router.refresh();
    } catch {
      alert('Terjadi kesalahan jaringan saat membuat musim');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-sky-400/40 shadow-xl space-y-4 bg-sky-950/20 relative overflow-hidden">
        {/* Background soft glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Trophy className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Pilih Musim Aktif Panel Admin
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              Musim yang dipilih di sini akan menentukan data pertandingan, skuad pemain, dan statistik di seluruh halaman admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextYear = (seasons[0]?.year || new Date().getFullYear()) + 1;
              setForm({
                name: String(nextYear),
                year: nextYear,
                isCurrent: false,
                copyFromSeasonId: seasons[0]?.id || '',
              });
              setShowAddModal(true);
            }}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-sky-500 hover:text-slate-950 text-sky-300 border border-slate-700 text-xs font-bold uppercase transition-all cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Musim Baru
          </button>
        </div>

        {/* Season Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
          {seasons.map((s) => {
            const isSelected = s.name === selectedSeason;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSeason(s.name)}
                className={`p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10 ring-2 ring-sky-400/30'
                    : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black ${isSelected ? 'text-sky-300' : 'text-white'}`}>
                      Musim {s.name}
                    </span>
                    {s.isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        Aktif Utama
                      </span>
                    )}
                  </div>

                  {isSelected ? (
                    <span className="w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-semibold">Pilih</span>
                  )}
                </div>

                {/* Counts Breakdown */}
                <div className="flex items-center gap-3 text-[11px] text-slate-300 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-sky-400" />
                    <b>{s._count?.players ?? 0}</b> Skuad
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <b>{s._count?.matches ?? 0}</b> Laga
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-400" />
                    <b>{s._count?.competitions ?? 0}</b> Komp.
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah Musim Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-sky-400/40 shadow-2xl space-y-4 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Tambah Musim Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Nama Musim *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2027 atau 2026/2027"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold uppercase focus:border-sky-400 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Tahun Kalender
                </label>
                <input
                  type="number"
                  required
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || 2026 })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-sky-400 outline-none text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                  Salin Skuad Pemain dari Musim:
                </label>
                <select
                  value={form.copyFromSeasonId}
                  onChange={(e) => setForm({ ...form, copyFromSeasonId: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold focus:border-sky-400 outline-none text-xs cursor-pointer"
                >
                  <option value="">Jangan salin (Mulai dengan skuad kosong)</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      Musim {s.name} ({s._count?.players ?? 0} pemain)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Pemain dari musim yang dipilih akan otomatis dimasukkan ke skuad musim baru ini.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isCurrentSeason"
                  checked={form.isCurrent}
                  onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="isCurrentSeason" className="text-xs font-bold text-slate-300 cursor-pointer">
                  Jadikan musim aktif utama klub
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Buat Musim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
