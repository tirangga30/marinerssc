'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Save,
  Upload,
  Loader2,
  Star,
  Crop,
  Trophy,
  Users,
  UserPlus,
  UserMinus,
  Check,
  Search,
} from 'lucide-react';
import ImageCropperModal from '@/components/ImageCropperModal';
import { getClientAdminSeason, setClientAdminSeason } from '@/lib/adminSeason';

interface SeasonRef {
  id: string;
  name: string;
  year: number;
}

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
  seasons?: SeasonRef[];
}

interface Season {
  id: string;
  name: string;
  year: number;
  isCurrent: boolean;
  featuredPlayerIds?: string[];
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [guestPlayers, setGuestPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string>('2026');
  const [activeTab, setActiveTab] = useState<'season_squad' | 'guests'>('season_squad');

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [uploading, setUploading] = useState(false);

  // Pull Player Modal State
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullSearch, setPullSearch] = useState('');
  const [pulling, setPulling] = useState(false);
  const [selectedPlayerIdsForPull, setSelectedPlayerIdsForPull] = useState<string[]>([]);

  // Player Photo Cropper Modal State
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Form State - Default Photo Template is /playertemplate.webp
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: 'FORWARD',
    nationality: 'Indonesia',
    birthDate: '',
    heightCm: '',
    weightKg: '',
    photoUrl: '/playertemplate.webp',
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
      if (Array.isArray(data)) {
        setPlayers(sortPlayersByPos(data));
      }

      const guestRes = await fetch('/api/players?guestsOnly=true');
      const guestData = await guestRes.json();
      if (Array.isArray(guestData)) {
        setGuestPlayers(sortPlayersByPos(guestData));
      }
    } catch {
      console.error('Gagal mengambil pemain');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const res = await fetch('/api/admin/seasons');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSeasons(data);
        const activeGlobal = getClientAdminSeason();
        if (activeGlobal && data.some((s) => s.name === activeGlobal)) {
          setSelectedSeason(activeGlobal);
        } else if (data.length > 0) {
          const current = data.find((s) => s.isCurrent) || data[0];
          setSelectedSeason(current.name);
        }
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
    }
  };

  useEffect(() => {
    fetchPlayers();
    fetchSeasons();

    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setSelectedSeason(e.detail.season);
      }
    };
    window.addEventListener('admin_season_changed', handleSeasonChange);
    return () => window.removeEventListener('admin_season_changed', handleSeasonChange);
  }, []);

  const currentSeasonObj = seasons.find((s) => s.name === selectedSeason) || seasons[0];

  const isPlayerFeaturedInSeason = (player: Player) => {
    if (currentSeasonObj && Array.isArray(currentSeasonObj.featuredPlayerIds)) {
      return currentSeasonObj.featuredPlayerIds.includes(player.id);
    }
    return Boolean(player.isFeatured);
  };

  const seasonSquadPlayers = players.filter((p) =>
    p.seasons?.some((s) => s.name === selectedSeason || s.id === currentSeasonObj?.id)
  );

  const availableToPullPlayers = players.filter(
    (p) => !p.seasons?.some((s) => s.name === selectedSeason || s.id === currentSeasonObj?.id)
  );

  const displayedList =
    activeTab === 'season_squad'
      ? seasonSquadPlayers
      : guestPlayers;

  // Single Player Pull to Season
  const handlePullPlayer = async (playerId: string) => {
    if (!currentSeasonObj) return;
    setPulling(true);
    try {
      const currentEnrolled = seasonSquadPlayers.map((p) => p.id);
      if (currentEnrolled.includes(playerId)) return;
      const updated = [...currentEnrolled, playerId];

      const res = await fetch(`/api/admin/seasons/${currentSeasonObj.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: updated }),
      });

      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === playerId) {
              const prevSeasons = p.seasons || [];
              return {
                ...p,
                seasons: [
                  ...prevSeasons,
                  { id: currentSeasonObj.id, name: currentSeasonObj.name, year: currentSeasonObj.year },
                ],
              };
            }
            return p;
          })
        );
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal menarik pemain ke musim ini');
      }
    } catch {
      alert('Terjadi kesalahan saat menarik pemain');
    } finally {
      setPulling(false);
    }
  };

  // Release player from season
  const handleReleasePlayer = async (player: Player) => {
    if (!currentSeasonObj) return;
    if (
      !confirm(
        `Lepas ${player.name} dari skuad Musim ${selectedSeason}?\n\nCatatan: Profil dan statistik pemain tetap tersimpan di database klub.`
      )
    ) {
      return;
    }
    try {
      const updated = seasonSquadPlayers.filter((p) => p.id !== player.id).map((p) => p.id);
      const res = await fetch(`/api/admin/seasons/${currentSeasonObj.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: updated }),
      });

      if (res.ok) {
        if (currentSeasonObj?.featuredPlayerIds?.includes(player.id)) {
          const newFeatured = currentSeasonObj.featuredPlayerIds.filter((id) => id !== player.id);
          fetch(`/api/admin/seasons/${currentSeasonObj.id}/featured`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featuredPlayerIds: newFeatured }),
          }).catch(console.error);
          setSeasons((prev) =>
            prev.map((s) => (s.id === currentSeasonObj.id ? { ...s, featuredPlayerIds: newFeatured } : s))
          );
        }
        setPlayers((prev) =>
          prev.map((p) => {
            if (p.id === player.id) {
              return {
                ...p,
                seasons: (p.seasons || []).filter(
                  (s) => s.name !== selectedSeason && s.id !== currentSeasonObj.id
                ),
              };
            }
            return p;
          })
        );
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal melepas pemain dari musim');
      }
    } catch {
      alert('Terjadi kesalahan saat melepas pemain');
    }
  };

  // Batch pull from modal
  const handleBatchPull = async () => {
    if (!currentSeasonObj || selectedPlayerIdsForPull.length === 0) return;
    setPulling(true);
    try {
      const currentEnrolled = seasonSquadPlayers.map((p) => p.id);
      const newEnrolled = Array.from(new Set([...currentEnrolled, ...selectedPlayerIdsForPull]));

      const res = await fetch(`/api/admin/seasons/${currentSeasonObj.id}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: newEnrolled }),
      });

      if (res.ok) {
        setPlayers((prev) =>
          prev.map((p) => {
            if (selectedPlayerIdsForPull.includes(p.id)) {
              const prevSeasons = p.seasons || [];
              if (!prevSeasons.some((s) => s.name === selectedSeason)) {
                return {
                  ...p,
                  seasons: [
                    ...prevSeasons,
                    { id: currentSeasonObj.id, name: currentSeasonObj.name, year: currentSeasonObj.year },
                  ],
                };
              }
            }
            return p;
          })
        );
        setShowPullModal(false);
        setSelectedPlayerIdsForPull([]);
      } else {
        const d = await res.json();
        alert(d.error || 'Gagal menarik pemain terpilih');
      }
    } catch {
      alert('Terjadi kesalahan saat menarik pemain terpilih');
    } finally {
      setPulling(false);
    }
  };

  // Toggle Star (Pemain Bintang / Favorit Beranda)
  const toggleStar = async (player: Player) => {
    try {
      const isCurrentlyFeatured = isPlayerFeaturedInSeason(player);
      const newFeaturedState = !isCurrentlyFeatured;

      // Limit maximum 6 featured players on homepage for the selected season
      if (newFeaturedState) {
        const currentSeasonFeaturedCount = seasonSquadPlayers.filter(isPlayerFeaturedInSeason).length;
        if (currentSeasonFeaturedCount >= 6) {
          alert(`Maksimal 6 pemain yang dapat ditambahkan ke Beranda Utama untuk Musim ${selectedSeason}.`);
          return;
        }
      }

      if (currentSeasonObj?.id) {
        const res = await fetch(`/api/admin/seasons/${currentSeasonObj.id}/featured`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId: player.id,
            isFeatured: newFeaturedState,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setSeasons((prev) =>
            prev.map((s) =>
              s.id === currentSeasonObj.id
                ? { ...s, featuredPlayerIds: data.featuredPlayerIds }
                : s
            )
          );
          setPlayers((prev) =>
            prev.map((p) => (p.id === player.id ? { ...p, isFeatured: newFeaturedState } : p))
          );
        } else {
          const errData = await res.json();
          alert(errData.error || 'Gagal mengubah status pemain bintang');
        }
      } else {
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
      photoUrl: '/playertemplate.webp',
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
        photoUrl: guest.photoUrl || '/playertemplate.webp',
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
      photoUrl: player.photoUrl || '/playertemplate.webp',
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

  // ── Photo Cropper Handlers ──
  const handleSelectFileForCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCropperImageSrc(event.target.result as string);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleOpenCropperForExisting = async () => {
    if (!formData.photoUrl || formData.photoUrl === '/playertemplate.webp') return;

    if (formData.photoUrl.startsWith('data:')) {
      setCropperImageSrc(formData.photoUrl);
      setCropperOpen(true);
      return;
    }

    try {
      const res = await fetch(formData.photoUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCropperImageSrc(event.target.result as string);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      setCropperImageSrc(formData.photoUrl);
      setCropperOpen(true);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true);
    const body = new FormData();
    body.append('file', croppedBlob, 'player_photo.jpg');
    body.append('folder', 'players');
    body.append('position', formData.position);
    body.append('number', formData.number);
    body.append('playerName', formData.name);

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
      setCropperImageSrc(null);
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
        body: JSON.stringify({
          ...formData,
          seasonName: selectedSeason,
        }),
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

  const featuredCount = seasonSquadPlayers.filter(isPlayerFeaturedInSeason).length;
  const isLimitReached = featuredCount >= 6;

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
            href="/admin/seasons"
            className="inline-flex items-center gap-1 text-xs font-bold uppercase text-amber-400 hover:text-amber-300 transition-colors"
          >
            <Trophy className="w-3.5 h-3.5" /> Master Musim &amp; Kompetisi
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'season_squad' && (
            <button
              onClick={() => {
                setPullSearch('');
                setSelectedPlayerIdsForPull([]);
                setShowPullModal(true);
              }}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500 hover:text-slate-950 font-extrabold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Tarik Pemain
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl white-blue-btn font-extrabold uppercase text-[11px] sm:text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" /> Tambah Pemain Baru
          </button>
        </div>
      </div>

      <div className="glass-panel p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('season_squad')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'season_squad'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-sky-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Skuad Musim {selectedSeason} ({seasonSquadPlayers.length})
            </button>

            <button
              onClick={() => setActiveTab('guests')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guests'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-1 ring-sky-300'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Pemain Loan ({guestPlayers.length})
            </button>
          </div>

          {/* Beranda Count */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-400/30">
              ★ Beranda: {featuredCount}/6
            </span>
          </div>
        </div>

        {/* ── MOBILE PLAYER CARDS ── */}
        <div className="block md:hidden space-y-2.5">
          {displayedList.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-slate-400">
                {activeTab === 'season_squad'
                  ? `Belum ada pemain di skuad Musim ${selectedSeason}.`
                  : 'Belum ada pemain terdaftar.'}
              </p>
              {activeTab === 'season_squad' && (
                <button
                  onClick={() => {
                    setPullSearch('');
                    setSelectedPlayerIdsForPull([]);
                    setShowPullModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-bold uppercase cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 inline mr-1" /> Tarik Pemain Sekarang
                </button>
              )}
            </div>
          ) : (
            displayedList.map((player) => {
              const isEnrolledInActiveSeason = player.seasons?.some(
                (s) => s.name === selectedSeason || s.id === currentSeasonObj?.id
              );

              return (
                <div
                  key={player.id}
                  className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5 shadow-sm"
                >
                  {/* 4:5 Photo Avatar */}
                  <div className="relative w-11 aspect-[4/5] rounded-lg overflow-hidden bg-slate-950 border border-sky-400/30 shrink-0 shadow">
                    <img
                      src={player.photoUrl || '/playertemplate.webp'}
                      alt={player.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-black text-sky-400 text-xs">#{player.number}</span>
                      <span className="font-bold text-white text-xs truncate max-w-[120px]">{player.name}</span>
                      {player.isCaptain && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase">
                          👑
                        </span>
                      )}
                      {player.isGuest && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] uppercase">
                          Loan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
                      <span className="font-bold text-sky-300">{normalizePos(player.position)}</span>
                      <span>•</span>
                      <span>
                        {player.goals}G {player.assists}A
                      </span>
                      <span>•</span>
                      <span>{player.appearances} Laga</span>
                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Pull/Release Button */}
                    {activeTab === 'season_squad' && (
                      <button
                        onClick={() => handleReleasePlayer(player)}
                        title={`Lepas dari Skuad Musim ${selectedSeason}`}
                        className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {activeTab === 'season_squad' && (
                      <button
                        onClick={() => toggleStar(player)}
                        disabled={isLimitReached && !isPlayerFeaturedInSeason(player)}
                        title={isPlayerFeaturedInSeason(player) ? 'Hapus dari Beranda' : 'Tampilkan di Beranda'}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isPlayerFeaturedInSeason(player)
                            ? 'bg-amber-500/20 border-amber-400/60 text-amber-400'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isPlayerFeaturedInSeason(player) ? 'fill-amber-400' : ''}`} />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(player)}
                      className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors cursor-pointer"
                      title="Edit Pemain"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                      title="Hapus Pemain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── DESKTOP PLAYERS TABLE ── */}
        <div className="hidden md:block overflow-x-auto">
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
              {displayedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    {activeTab === 'season_squad'
                      ? `Belum ada pemain di skuad Musim ${selectedSeason}. Klik "Tarik Pemain" untuk memasukkan pemain.`
                      : 'Belum ada data pemain.'}
                  </td>
                </tr>
              ) : (
                displayedList.map((player) => {
                  return (
                    <tr key={player.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-sky-400">#{player.number}</td>
                      <td className="p-3 flex items-center gap-3">
                        <img
                          src={player.photoUrl || '/playertemplate.webp'}
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
                        {player.isGuest && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] uppercase tracking-wider border border-amber-500/30">
                            Loan
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {player.goals} Gol / {player.assists} Assist
                      </td>
                      <td className="p-3">{player.appearances}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            player.status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {player.status}
                        </span>
                      </td>

                      {/* TOMBOL BINTANG BERANDA */}
                      <td className="p-3 text-center">
                        {activeTab === 'season_squad' ? (
                          <button
                            onClick={() => toggleStar(player)}
                            disabled={isLimitReached && !isPlayerFeaturedInSeason(player)}
                            title={
                              isPlayerFeaturedInSeason(player)
                                ? 'Hapus dari Pemain Beranda'
                                : isLimitReached
                                ? `Maksimal 6 Pemain Beranda Musim ${selectedSeason} Tercapai`
                                : 'Tampilkan di Pemain Beranda'
                            }
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isPlayerFeaturedInSeason(player)
                                ? 'bg-amber-500/20 border-amber-400/60 text-amber-400 shadow-md shadow-amber-500/20 scale-110'
                                : isLimitReached
                                ? 'bg-slate-900/40 border-slate-800/40 text-slate-700 cursor-not-allowed opacity-40'
                                : 'bg-slate-900/80 border-slate-800 text-slate-500 hover:text-amber-400 hover:border-amber-400/40'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${isPlayerFeaturedInSeason(player) ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>

                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        {/* LEPAS PEMAIN DARI MUSIM INI */}
                        {activeTab === 'season_squad' && (
                          <button
                            onClick={() => handleReleasePlayer(player)}
                            className="p-1.5 rounded-lg bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-slate-950 transition-colors border border-amber-500/30 cursor-pointer"
                            title={`Lepas dari Skuad Musim ${selectedSeason}`}
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}

                        {player.isGuest && (
                          <button
                            onClick={async () => {
                              if (confirm('Promosikan ' + player.name + ' ke skuad utama?')) {
                                await fetch('/api/players/' + player.id, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ isGuest: false }),
                                });
                                fetchPlayers();
                              }
                            }}
                            title="Promosikan ke Skuad Utama"
                            className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-400 hover:text-slate-950 transition-colors border border-amber-500/30 cursor-pointer"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(player)}
                          className="p-1.5 rounded-lg bg-slate-800 text-sky-400 hover:bg-sky-400 hover:text-slate-950 transition-colors cursor-pointer"
                          title="Edit Pemain"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(player.id)}
                          className="p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                          title="Hapus Pemain"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL TARIK PEMAIN KE SKUAD MUSIM ── */}
      {showPullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-xl glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-sky-400/40 space-y-4 shadow-2xl bg-slate-950 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Tarik Pemain ke Skuad Musim {selectedSeason}
                </h2>
                <p className="text-[11px] text-slate-300">
                  Pilih pemain dari database klub untuk dimasukkan ke skuad Musim {selectedSeason}.
                </p>
              </div>
              <button
                onClick={() => setShowPullModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pullSearch}
                onChange={(e) => setPullSearch(e.target.value)}
                placeholder="Cari pemain berdasarkan nama atau nomor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:border-sky-400 outline-none"
              />
            </div>

            {/* Available Players List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px] max-h-[360px]">
              {availableToPullPlayers
                .filter(
                  (p) =>
                    p.name.toLowerCase().includes(pullSearch.toLowerCase()) ||
                    p.number.toString().includes(pullSearch) ||
                    p.position.toLowerCase().includes(pullSearch.toLowerCase())
                )
                .map((p) => {
                  const isChecked = selectedPlayerIdsForPull.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                        isChecked
                          ? 'bg-sky-500/15 border-sky-400 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPlayerIdsForPull((prev) => [...prev, p.id]);
                            } else {
                              setSelectedPlayerIdsForPull((prev) => prev.filter((id) => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                        <img
                          src={p.photoUrl || '/playertemplate.webp'}
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-sky-400 text-xs">#{p.number}</span>
                          <span className="font-bold text-white text-xs">{p.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({normalizePos(p.position)})
                          </span>
                          {p.seasons && p.seasons.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-sky-300 font-bold border border-sky-400/20">
                              Musim {p.seasons.map((s) => s.name).join(', ')}
                            </span>
                          )}
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => handlePullPlayer(p.id)}
                        disabled={pulling}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px] uppercase transition-all cursor-pointer shrink-0"
                      >
                        + Tarik
                      </button>
                    </div>
                  );
                })}
              {availableToPullPlayers.length === 0 && (
                <p className="text-center text-xs text-slate-500 py-8">
                  Semua pemain klub sudah terdaftar di skuad Musim {selectedSeason}.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-400">
                Terpilih: <b className="text-white">{selectedPlayerIdsForPull.length}</b> pemain
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPullModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedPlayerIdsForPull.length === 0 || pulling}
                  onClick={handleBatchPull}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-black uppercase transition-all shadow cursor-pointer flex items-center gap-1.5"
                >
                  {pulling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tarik ke Skuad Musim {selectedSeason}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Player */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl glass-panel p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-sky-400/30 space-y-4 sm:space-y-6 shadow-2xl my-4 sm:my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base sm:text-xl font-black uppercase text-white tracking-wide">
                {editingPlayer ? 'Edit Pemain' : 'Tambah Pemain Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-red-500 transition-colors cursor-pointer">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {!editingPlayer && availableToPullPlayers.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-300">Pemain pernah terdaftar di musim sebelumnya?</p>
                    <p className="text-[11px] text-amber-200/70">
                      Tarik data pemain dari musim lain secara otomatis tanpa perlu input manual ulang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setPullSearch('');
                      setSelectedPlayerIdsForPull([]);
                      setShowPullModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1.5 shadow"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Tarik Pemain ({availableToPullPlayers.length})
                  </button>
                </div>
              )}
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
                {/* Photo Upload Section with Cropper */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-sky-300 uppercase block text-xs">Foto Pemain (Rasio 4:5)</label>
                    <span className="text-[10px] text-slate-400">Dapat di-crop dan digeser sebelum simpan</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-20 aspect-[4/5] rounded-xl overflow-hidden bg-slate-950 border-2 border-sky-400/40 shrink-0 shadow-lg">
                      <img
                        src={formData.photoUrl || '/playertemplate.webp'}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-2 text-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading ? 'Mengunggah...' : 'Pilih & Crop Foto'}
                        </button>

                        {formData.photoUrl && formData.photoUrl !== '/playertemplate.webp' && (
                          <button
                            type="button"
                            onClick={handleOpenCropperForExisting}
                            disabled={uploading}
                            className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold flex items-center gap-1.5 text-xs transition-colors border border-sky-400/30 cursor-pointer"
                          >
                            <Crop className="w-3.5 h-3.5" />
                            Crop Ulang
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, photoUrl: '/playertemplate.webp' }))}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          Reset Template
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSelectFileForCrop}
                          disabled={uploading}
                          className="hidden"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Pilih foto (.jpg, .png, .webp) untuk membuka alat crop 4:5 otomatis.
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
                  <label className="font-bold text-slate-200 uppercase block mb-1">
                    Nomor Punggung{' '}
                    {selectedSeason && (
                      <span className="text-xs text-sky-400 font-semibold normal-case">
                        (Musim {selectedSeason})
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nomor punggung dipisah per musim. Nomor yang sama dapat digunakan di musim berbeda.
                  </p>
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

      {/* Image Cropper Modal (4:5 Aspect Ratio) */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={cropperImageSrc}
        aspectRatio={4 / 5}
        title="Sesuaikan & Crop Foto Pemain (Rasio 4:5)"
        onCropComplete={handleCropComplete}
        onClose={() => {
          setCropperOpen(false);
          setCropperImageSrc(null);
        }}
      />

    </div>
  );
}
