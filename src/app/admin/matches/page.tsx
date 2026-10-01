'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Save,
  Settings2,
  Upload,
  Loader2,
  Trophy,
  Filter,
  Shield,
  Plane,
} from 'lucide-react';
import { formatDateForInput, WIB_TIMEZONE } from '@/lib/date';
import { getClientAdminSeason, setClientAdminSeason } from '@/lib/adminSeason';

interface FootballMatch {
  id: string;
  opponentName: string;
  opponentLogo: string;
  matchDate: string;
  competition: string;
  competitionId?: string | null;
  stage?: string | null;
  seasonName?: string;
  seasonId?: string | null;
  venue: string;
  isHome: boolean;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  formation: string;
  summary: string | null;
}

interface Season {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
}

interface Competition {
  id: string;
  name: string;
  season: string;
  seasonId?: string | null;
  type: string;
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
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
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
    opponentLogo: '/defaultteam.webp',
    matchDate: getDefaultMatchDate(),
    seasonName: '2026',
    seasonId: '',
    competition: 'FRIENDLY',
    competitionId: '',
    stage: 'Matchday 1',
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

  const fetchMeta = async () => {
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
        // Sync with global active season
        const activeGlobalSeason = getClientAdminSeason();
        if (activeGlobalSeason && seasonsData.some((s) => s.name === activeGlobalSeason)) {
          setSelectedSeason(activeGlobalSeason);
        } else if (seasonsData.length > 0) {
          const current = seasonsData.find((s) => s.isCurrent) || seasonsData[0];
          setSelectedSeason(current.name);
        }
      }
      if (Array.isArray(compsData)) setCompetitions(compsData);
    } catch (err) {
      console.error('Failed to load seasons or competitions:', err);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchMeta();

    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setSelectedSeason(e.detail.season);
      }
    };
    window.addEventListener('admin_season_changed', handleSeasonChange);
    return () => window.removeEventListener('admin_season_changed', handleSeasonChange);
  }, []);

  const getNextMatchdayNumber = (seasonName: string) => {
    const seasonMatches = matches.filter(
      (m) =>
        (m.seasonName || '2026') === seasonName &&
        ((m.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY' ||
          m.stage?.toLowerCase().includes('matchday'))
    );
    let max = 0;
    for (const m of seasonMatches) {
      const match = m.stage?.match(/matchday\s*(\d+)/i);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > max) max = val;
      }
    }
    return max > 0 ? max + 1 : seasonMatches.length + 1;
  };

  const openAddModal = () => {
    setEditingMatch(null);
    const activeSeason =
      seasons.find((s) => s.name === selectedSeason) ||
      seasons.find((s) => s.isCurrent) ||
      seasons[0];
    const defaultSeasonName = activeSeason?.name || '2026';
    const defaultSeasonId = activeSeason?.id || '';

    // Find friendly competition for this season or default
    const defaultComp = competitions.find(
      (c) => (c.season === defaultSeasonName || c.seasonId === defaultSeasonId) && c.name === 'FRIENDLY'
    ) || competitions[0];

    // Compute next matchday automatically
    const nextMatchdayNum = getNextMatchdayNumber(defaultSeasonName);
    const nextMatchday = `Matchday ${nextMatchdayNum}`;

    setFormData({
      opponentName: '',
      opponentLogo: '/defaultteam.webp',
      matchDate: getDefaultMatchDate(),
      seasonName: defaultSeasonName,
      seasonId: defaultSeasonId,
      competition: defaultComp ? defaultComp.name : 'FRIENDLY',
      competitionId: defaultComp ? defaultComp.id : '',
      stage: nextMatchday,
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
      seasonName: m.seasonName || '2026',
      seasonId: m.seasonId || '',
      competition: m.competition || 'FRIENDLY',
      competitionId: m.competitionId || '',
      stage: m.stage || 'Matchday 1',
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

  // Filter matches by active season
  const currentSeasonObj = seasons.find((s) => s.name === selectedSeason) || seasons[0];
  const filteredMatches = matches.filter((m) => {
    return (m.seasonName || '2026') === selectedSeason || m.seasonId === currentSeasonObj?.id;
  });

  // Competitions available for selected form season
  const formCompetitions = competitions.filter(
    (c) => !c.season || c.season === formData.seasonName || c.seasonId === formData.seasonId
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-10 space-y-4 sm:space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-300 hover:text-sky-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Dashboard Admin</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
          <span className="text-slate-600">/</span>
          <Link
            href="/admin/competitions"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" /> Kelola Kompetisi
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Season Badge (controlled from Dashboard) */}
          <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sky-300 text-xs font-bold uppercase font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Musim {selectedSeason}
          </span>

          <button
            onClick={openAddModal}
            className="px-3 sm:px-4 py-2 rounded-xl white-blue-btn font-extrabold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Tambah Pertandingan
          </button>
        </div>
      </div>

      <div className="glass-panel p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4">
          <h1 className="text-base sm:text-xl font-black uppercase text-white blue-gradient-text">
            Manajemen Pertandingan ({filteredMatches.length} Laga)
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase font-mono">
            Musim {selectedSeason}
          </span>
        </div>

        {/* ── MOBILE MATCH CARDS ── */}
        <div className="block md:hidden space-y-3">
          {filteredMatches.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada pertandingan terdaftar.</p>
          ) : (
            filteredMatches.map((m) => {
              const dynamicStatus = getDynamicMatchStatus(m);
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 shadow-md"
                >
                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-300">
                        {new Date(m.matchDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: WIB_TIMEZONE,
                        })}
                      </span>
                      <span className="px-2 py-0.2 rounded-full bg-blue-950 text-sky-300 border border-sky-400/30 font-bold uppercase text-[9px]">
                        {m.competition || 'FRIENDLY'} {m.stage ? `• ${m.stage}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold uppercase text-[9px]">
                        {m.isHome ? 'Home' : 'Away'}
                      </span>
                      {dynamicStatus === 'live' ? (
                        <span className="px-2 py-0.5 rounded-md bg-red-600/30 text-red-400 border border-red-500/50 text-[9px] font-black uppercase tracking-wider animate-pulse flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> LIVE
                        </span>
                      ) : dynamicStatus === 'score_pending' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-black uppercase">
                          Skor Pending
                        </span>
                      ) : dynamicStatus === 'finished' ? (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 font-mono font-black text-[11px]">
                          {m.homeScore !== null && m.awayScore !== null ? `${m.homeScore} - ${m.awayScore}` : 'Selesai'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-300 text-[9px] font-bold uppercase">
                          Mendatang
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Opponent Info Row */}
                  <div className="flex items-center gap-3">
                    <img src={m.opponentLogo} alt={m.opponentName} className="w-10 h-10 object-contain drop-shadow" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-white uppercase truncate">{m.opponentName}</h3>
                      <p className="text-[11px] text-slate-400 truncate">{m.venue || 'Stadion Gelora Samudra, Jakarta'}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/admin/matches/${m.id}/lineup`}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 text-sky-300 border border-sky-400/40 hover:bg-blue-600 hover:text-white transition-colors font-bold uppercase text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> Match Options
                    </Link>
                    <button
                      onClick={() => openEditModal(m)}
                      className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                      title="Edit Pertandingan"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="p-2 rounded-xl bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                      title="Hapus Pertandingan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP MATCHES TABLE ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900/90 text-sky-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Tanggal Laga</th>
                <th className="p-3">Musim / Kompetisi</th>
                <th className="p-3">Lawan &amp; Logo</th>
                <th className="p-3 text-center">Status / Skor</th>
                <th className="p-3">Stadion / Lapangan</th>
                <th className="p-3">Tuan Rumah</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredMatches.map((m) => {
                const dynamicStatus = getDynamicMatchStatus(m);
                return (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white whitespace-nowrap">
                      {new Date(m.matchDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: WIB_TIMEZONE,
                      })}
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[10px] text-slate-400">
                            {m.seasonName || '2026'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-950/80 text-sky-300 border border-sky-400/30 text-[10px] font-black uppercase">
                            {m.competition || 'FRIENDLY'}
                          </span>
                        </div>
                        {m.stage && (
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {m.stage}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 flex items-center gap-3">
                      <img src={m.opponentLogo} alt={m.opponentName} className="w-9 h-9 object-contain drop-shadow" />
                      <span className="font-bold text-white uppercase">{m.opponentName}</span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
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
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/matches/${m.id}/lineup`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-sky-300 border border-sky-400/40 hover:bg-blue-600 hover:text-white transition-colors font-bold uppercase text-[10px] inline-flex items-center gap-1"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> Match Options
                      </Link>
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors"
                        title="Edit Pertandingan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                        title="Hapus Pertandingan"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-black uppercase text-sky-400">
                {editingMatch ? 'Edit Pertandingan' : 'Tambah Pertandingan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* DIRECT OPPONENT LOGO UPLOAD SECTION */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <label className="font-bold text-sky-300 uppercase block">Logo Tim Lawan (Direct Upload)</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 flex items-center justify-center shrink-0">
                    <img
                      src={formData.opponentLogo || '/defaultteam.webp'}
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

              {/* Opponent & Match Date */}
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

              {/* KOMPETISI SELECTOR */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-amber-300 uppercase block">
                    Kompetisi
                  </label>
                  <Link
                    href="/admin/competitions"
                    target="_blank"
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    + Atur Kompetisi
                  </Link>
                </div>
                <select
                  value={formData.competition}
                  onChange={(e) => {
                    const newComp = e.target.value;
                    const sel = competitions.find((c) => c.name === newComp);
                    const isFriendly = newComp === 'FRIENDLY';
                    setFormData({
                      ...formData,
                      competition: newComp,
                      competitionId: sel?.id || '',
                      stage: isFriendly
                        ? `Matchday ${getNextMatchdayNumber(formData.seasonName)}`
                        : (formData.stage?.toLowerCase().startsWith('matchday') ? 'Group Stage' : formData.stage),
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold uppercase focus:border-sky-400 outline-none"
                >
                  {formCompetitions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                  {formCompetitions.length === 0 && (
                    <option value="FRIENDLY">FRIENDLY (Friendly)</option>
                  )}
                </select>
              </div>

              {/* STAGE / BABAK / MATCHDAY INPUT WITH SUGGESTIONS */}
              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1">
                  Stage / Babak / Matchday
                </label>
                <input
                  type="text"
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  placeholder="Contoh: Matchday 20, Group Stage, PlayOff, Final"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none font-semibold"
                />
                {/* Fast chips */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-slate-400">Pilihan cepat:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const num = getNextMatchdayNumber(formData.seasonName);
                      setFormData({ ...formData, stage: `Matchday ${num}` });
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                      formData.stage?.toLowerCase().startsWith('matchday')
                        ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    Matchday
                  </button>
                  {['Group Stage', 'PlayOff', 'Babak 16 Besar', 'Perempat Final', 'Semifinal', 'Final'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormData({ ...formData, stage: chip })}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                        formData.stage === chip
                          ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
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

              {/* HOME / AWAY TOGGLE SWITCHER (SEPERTI NAVIGASI SUMMARY & LINEUP) */}
              <div>
                <label className="font-bold text-slate-200 uppercase block mb-1.5 text-xs">
                  Status Pertandingan
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: true })}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      formData.isHome
                        ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-sky-300" />
                    <span>Home (Tuan Rumah)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isHome: false })}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      !formData.isHome
                        ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/30 scale-[1.02]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <Plane className="w-4 h-4 text-sky-300" />
                    <span>Away (Tandang)</span>
                  </button>
                </div>
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
