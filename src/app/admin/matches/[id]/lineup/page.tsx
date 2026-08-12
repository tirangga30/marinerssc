'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Plus, Trash2, CheckCircle2, Activity,
  Clock, Zap, Shield, Star, AlertCircle, GripVertical, X
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string;
}

interface MatchLineupInput {
  playerId: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
}

interface MatchEventInput {
  playerId: string;
  assistPlayerId?: string;
  type: string;
  minute: number;
  description: string;
}

const PITCH_POSITIONS = [
  { key: 'GK',  fullLabel: 'Goalkeeper',      x: 50, y: 88 },
  { key: 'LB',  fullLabel: 'Left Back',        x: 15, y: 70 },
  { key: 'CB1', fullLabel: 'Center Back 1',    x: 36, y: 72 },
  { key: 'CB2', fullLabel: 'Center Back 2',    x: 64, y: 72 },
  { key: 'RB',  fullLabel: 'Right Back',       x: 85, y: 70 },
  { key: 'CM1', fullLabel: 'Central Mid 1',    x: 25, y: 50 },
  { key: 'CM2', fullLabel: 'Central Mid 2',    x: 50, y: 48 },
  { key: 'CAM', fullLabel: 'Attacking Mid',    x: 75, y: 50 },
  { key: 'LW',  fullLabel: 'Left Winger',      x: 15, y: 22 },
  { key: 'ST',  fullLabel: 'Striker',          x: 50, y: 14 },
  { key: 'RW',  fullLabel: 'Right Winger',     x: 85, y: 22 },
];

const EVENT_TYPES = [
  { value: 'goal',        label: 'Gol',                 color: '#22c55e' },
  { value: 'yellow_card', label: 'Kartu Kuning',        color: '#eab308' },
  { value: 'red_card',    label: 'Kartu Merah',         color: '#ef4444' },
  { value: 'sub',         label: 'Pergantian',          color: '#38bdf8' },
  { value: 'own_goal',    label: 'Gol Bunuh Diri',      color: '#f97316' },
  { value: 'penalty',     label: 'Penalti',             color: '#a855f7' },
];

const EventIcon = ({ type }: { type: string }) => {
  if (type === 'goal') {
    return <i className="fa-regular fa-futbol text-amber-400 shrink-0 inline-block align-middle" />;
  }
  if (type === 'own_goal') {
    return <i className="fa-regular fa-futbol text-red-500 shrink-0 inline-block align-middle" />;
  }
  if (type === 'penalty') {
    return (
      <span className="relative inline-flex items-center shrink-0 align-middle mr-1">
        <i className="fa-regular fa-futbol text-amber-400 text-xs" />
        <span className="absolute -top-1.5 -right-2 w-3 h-3 rounded-full bg-amber-400 text-slate-950 font-black text-[7px] flex items-center justify-center leading-none shadow-xs">
          P
        </span>
      </span>
    );
  }
  if (type === 'sub') {
    return <i className="fa-solid fa-right-left text-sky-400 shrink-0 inline-block align-middle" />;
  }
  if (type === 'yellow_card') {
    return <span className="w-2.5 h-3.5 bg-amber-400 rounded-[1px] inline-block shrink-0 align-middle shadow-xs border border-amber-300/40" title="Kartu Kuning" />;
  }
  if (type === 'second_yellow') {
    return (
      <span className="relative inline-flex items-center shrink-0 align-middle ml-1" title="Kartu Kuning 2x (Kartu Merah)">
        {/* Darker yellow card behind */}
        <span className="w-2.5 h-3.5 bg-amber-500 rounded-[1px] border border-amber-600/50 shadow-xs" style={{ transform: 'translate(-2px, -1px)' }} />
        {/* Red card in front */}
        <span className="w-2.5 h-3.5 bg-red-600 rounded-[1px] border border-red-400/40 shadow-xs absolute top-0 left-0" />
      </span>
    );
  }
  if (type === 'red_card') {
    return <span className="w-2.5 h-3.5 bg-red-600 rounded-[1px] inline-block shrink-0 align-middle shadow-xs border border-red-400/40" title="Kartu Merah" />;
  }
  return null;
};

export default function MatchLineupBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [startersMap, setStartersMap] = useState<Record<string, string>>({});
  const [benchPlayerIds, setBenchPlayerIds] = useState<string[]>([]);
  const [eventsList, setEventsList] = useState<MatchEventInput[]>([]);

  // Drag state
  const [dragPlayerId, setDragPlayerId] = useState<string | null>(null);
  const [dragFromPos, setDragFromPos] = useState<string | null>(null); // source pitch position key
  const [dragOverPos, setDragOverPos] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    playerId: '', assistPlayerId: '', type: 'goal', minute: '15', description: '',
  });

  const [activeTab, setActiveTab] = useState<'lineup' | 'events'>('lineup');

  useEffect(() => {
    async function loadData() {
      try {
        const [playersRes, matchRes] = await Promise.all([
          fetch('/api/players'),
          fetch(`/api/matches/${matchId}`),
        ]);
        if (!playersRes.ok || !matchRes.ok) throw new Error('Gagal fetch data');

        const playersData = await playersRes.json();
        const matchInfo = await matchRes.json();

        setPlayers(playersData);
        setMatchData(matchInfo);

        if (matchInfo.lineups?.length > 0) {
          const sMap: Record<string, string> = {};
          const bIds: string[] = [];
          matchInfo.lineups.forEach((l: any) => {
            if (l.isStarter) sMap[l.pitchPosition] = l.playerId;
            else bIds.push(l.playerId);
          });
          setStartersMap(sMap);
          setBenchPlayerIds(bIds);
        }

        if (matchInfo.events?.length > 0) {
          setEventsList(
            matchInfo.events.map((e: any) => ({
              playerId: e.playerId,
              assistPlayerId: e.assistPlayerId || '',
              type: e.type,
              minute: e.minute,
              description: e.description || '',
            }))
          );
        }
      } catch (err) {
        console.error('Gagal memuat data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  /* ─── Drag helpers ─── */
  const handleDragStart = (playerId: string, fromPosKey: string | null) => {
    setDragPlayerId(playerId);
    setDragFromPos(fromPosKey);
  };

  const handleDropOnPosition = (toPosKey: string) => {
    if (!dragPlayerId) return;
    setStartersMap((prev) => {
      const updated = { ...prev };
      // Remove player from previous pitch position
      if (dragFromPos) delete updated[dragFromPos];
      // If target slot has someone, swap them back to bench or source pos
      const displaced = updated[toPosKey];
      if (displaced) {
        if (dragFromPos) updated[dragFromPos] = displaced;
        // else: displaced player goes back to available (not on pitch)
        else delete updated[toPosKey];
      }
      updated[toPosKey] = dragPlayerId;
      return updated;
    });
    // Remove from bench if coming from bench
    if (!dragFromPos) {
      setBenchPlayerIds((prev) => prev.filter((id) => id !== dragPlayerId));
    }
    setDragPlayerId(null);
    setDragFromPos(null);
    setDragOverPos(null);
  };

  const handleDropOnBench = () => {
    if (!dragPlayerId) return;
    // If from pitch pos, remove from pitch
    if (dragFromPos) {
      setStartersMap((prev) => {
        const updated = { ...prev };
        delete updated[dragFromPos];
        return updated;
      });
    }
    // Add to bench if not already there
    setBenchPlayerIds((prev) =>
      prev.includes(dragPlayerId) ? prev : [...prev, dragPlayerId]
    );
    setDragPlayerId(null);
    setDragFromPos(null);
    setDragOverPos(null);
  };

  const clearPosition = (posKey: string) => {
    setStartersMap((prev) => {
      const updated = { ...prev };
      delete updated[posKey];
      return updated;
    });
  };

  const removeBenchPlayer = (playerId: string) => {
    setBenchPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  const addEvent = () => {
    if (!newEvent.playerId) { alert('Pilih pemain untuk event ini'); return; }

    let finalType = newEvent.type;

    // Otomatis ubah menjadi second_yellow (Kartu Kuning 2x / Merah) jika pemain sudah memiliki kartu kuning
    if (newEvent.type === 'yellow_card') {
      const existingYellow = eventsList.some(
        (e) => e.playerId === newEvent.playerId && (e.type === 'yellow_card' || e.type === 'second_yellow')
      );
      if (existingYellow) {
        finalType = 'second_yellow';
      }
    }

    setEventsList((prev) => [
      ...prev,
      {
        playerId: newEvent.playerId,
        assistPlayerId: newEvent.assistPlayerId || undefined,
        type: finalType,
        minute: parseInt(newEvent.minute) || 0,
        description: newEvent.description,
      },
    ]);
    setNewEvent({ playerId: '', assistPlayerId: '', type: 'goal', minute: '15', description: '' });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const lineupsPayload: MatchLineupInput[] = [];
    PITCH_POSITIONS.forEach((pos) => {
      const pId = startersMap[pos.key];
      if (pId) lineupsPayload.push({ playerId: pId, isStarter: true, pitchPosition: pos.key, positionName: pos.fullLabel });
    });
    benchPlayerIds.forEach((pId) => {
      lineupsPayload.push({ playerId: pId, isStarter: false, pitchPosition: 'SUB', positionName: 'Cadangan' });
    });

    try {
      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineups: lineupsPayload, events: eventsList }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => { router.push('/admin/matches'); router.refresh(); }, 1200);
      } else { alert('Gagal menyimpan lineup'); }
    } catch { alert('Terjadi kesalahan jaringan'); }
    finally { setSaving(false); }
  };

  const getPlayerById = (id: string) => players.find((p) => p.id === id);
  const starterCount = Object.values(startersMap).filter(Boolean).length;
  const pitchedIds = new Set(Object.values(startersMap).filter(Boolean));
  const benchSet = new Set(benchPlayerIds);
  const availablePlayers = players.filter((p) => !pitchedIds.has(p.id) && !benchSet.has(p.id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin mx-auto" />
          <p className="text-sky-400 font-bold uppercase tracking-widest text-sm">Memuat Lineup Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* ═══ TOP STICKY HEADER ═══ */}
      <div className="sticky top-0 z-40 border-b border-slate-800/80 backdrop-blur-xl bg-slate-950/85">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/admin/matches"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400 hover:text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Manajemen Pertandingan</span>
            <span className="sm:hidden">Kembali</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-colors ${
              starterCount === 11
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
            }`}>
              {starterCount}/11 Starter
            </div>

            <button
              onClick={handleSaveAll}
              disabled={saving || saveSuccess}
              className={`px-5 py-2 rounded-xl font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-70 ${
                saveSuccess
                  ? 'bg-green-500 text-white shadow-green-500/25'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25 hover:shadow-sky-500/35'
              }`}
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan Lineup & Events'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ═══ MATCH BANNER ═══ */}
        <div className="relative rounded-2xl overflow-hidden border border-sky-500/20 p-5"
          style={{ background: 'linear-gradient(135deg, rgba(2,12,27,0.97) 0%, rgba(14,50,100,0.5) 100%)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.07),transparent_60%)]" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-500/70 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Match Lineup & Events Builder
              </span>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-white mt-0.5">
                Mariners FC <span className="text-sky-400">vs</span> {matchData?.opponentName || '—'}
              </h1>
              {matchData?.competition && (
                <p className="text-[11px] text-slate-400 mt-0.5">{matchData.competition}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-900/80 border border-sky-500/20">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Formasi</p>
                <p className="text-lg font-black font-mono text-sky-400">{matchData?.formation || '4-3-3'}</p>
              </div>
              {matchData?.status === 'finished' && matchData?.homeScore !== null && (
                <div className="text-center px-3 py-1.5 rounded-xl bg-slate-900/80 border border-green-500/20">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Skor</p>
                  <p className="text-lg font-black font-mono text-green-400">{matchData.homeScore} – {matchData.awayScore}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ MOBILE TABS ═══ */}
        <div className="flex lg:hidden gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {(['lineup', 'events'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {tab === 'lineup' ? <><Shield className="w-3 h-3 inline mr-1" />Susunan Pemain</> : <><Zap className="w-3 h-3 inline mr-1" />Event ({eventsList.length})</>}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ═══════════════════════════════════
              LEFT COLUMN: PITCH + BENCH
          ════════════════════════════════════ */}
          <div className={`lg:col-span-7 space-y-4 ${activeTab === 'events' ? 'hidden lg:block' : ''}`}>

            {/* ─── DRAG HINT ─── */}
            <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
              <GripVertical className="w-3 h-3" />
              Seret pemain dari daftar ke posisi di lapangan • Seret antar posisi untuk menukar • Lepas ke area bench untuk keluarkan
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* ── FOOTBALL PITCH (smaller, fixed height) ── */}
              <div className="rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl shadow-black/30">
                {/* Pitch Header */}
                <div className="bg-slate-900/70 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-black uppercase text-slate-200">Lapangan — {matchData?.formation || '4-3-3'}</span>
                  <span className="ml-auto text-[9px] text-slate-500 font-mono">
                    {starterCount < 11 ? `${11 - starterCount} kosong` : '✓ Penuh'}
                  </span>
                </div>

                {/* Pitch area — fixed smaller height */}
                <div
                  className="relative w-full select-none"
                  style={{
                    paddingBottom: '115%',
                    background: 'linear-gradient(180deg, #15803d 0%, #14532d 20%, #166534 40%, #15803d 60%, #14532d 80%, #166534 100%)',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* SVG Pitch Lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" preserveAspectRatio="none">
                    <rect x="2" y="2" width="96" height="111" rx="0.5" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.5" />
                    <line x1="2" y1="57.5" x2="98" y2="57.5" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <circle cx="50" cy="57.5" r="10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <circle cx="50" cy="57.5" r="0.7" fill="rgba(255,255,255,0.5)" />
                    {/* Top penalty area */}
                    <rect x="22" y="2" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <rect x="35" y="2" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <circle cx="50" cy="13" r="0.6" fill="rgba(255,255,255,0.5)" />
                    {/* Bottom penalty area */}
                    <rect x="22" y="95" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <rect x="35" y="106" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    <circle cx="50" cy="102" r="0.6" fill="rgba(255,255,255,0.5)" />
                    {/* Alternating grass stripes */}
                    {[0,1,2,3,4].map(i => (
                      <rect key={i} x="2" y={2 + i * 22} width="96" height="11" fill="rgba(0,0,0,0.035)" />
                    ))}
                  </svg>

                  {/* Attack Arrow */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none">
                    <svg width="12" height="14" viewBox="0 0 12 14">
                      <path d="M6 0L12 8H8v6H4V8H0Z" fill="white"/>
                    </svg>
                  </div>

                  {/* Player Tokens */}
                  {PITCH_POSITIONS.map((pos) => {
                    const pId = startersMap[pos.key];
                    const player = pId ? getPlayerById(pId) : undefined;
                    const isDragTarget = dragOverPos === pos.key;

                    return (
                      <div
                        key={pos.key}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        onDragOver={(e) => { e.preventDefault(); setDragOverPos(pos.key); }}
                        onDragLeave={() => setDragOverPos(null)}
                        onDrop={() => handleDropOnPosition(pos.key)}
                      >
                        {/* Token circle */}
                        <div
                          draggable={!!player}
                          onDragStart={() => player && handleDragStart(player.id, pos.key)}
                          onDragEnd={() => { setDragPlayerId(null); setDragFromPos(null); setDragOverPos(null); }}
                          className={`w-9 h-9 rounded-full border-2 flex items-center justify-center font-black text-[10px] transition-all cursor-${player ? 'grab' : 'default'} ${
                            isDragTarget
                              ? 'border-sky-300 bg-sky-500/30 scale-125 shadow-lg shadow-sky-500/40'
                              : player
                              ? 'bg-sky-600 border-sky-300 text-white shadow-lg shadow-sky-600/40 hover:scale-110'
                              : 'bg-slate-800/80 border-dashed border-slate-600 text-slate-500'
                          }`}
                        >
                          {player ? player.number : <span className="text-slate-600 text-[8px]">+</span>}
                        </div>
                        {/* Name chip */}
                        <div className={`px-1 py-px rounded text-[7px] font-black uppercase leading-none whitespace-nowrap max-w-[48px] truncate ${
                          player
                            ? 'bg-slate-950/90 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-950/60 text-slate-600 border border-slate-700'
                        }`}>
                          {player ? player.name.split(' ')[0] : pos.key}
                        </div>
                        {/* Clear X button when filled */}
                        {player && (
                          <button
                            onClick={() => clearPosition(pos.key)}
                            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity z-20"
                            style={{ fontSize: '7px' }}
                            title="Keluarkan dari posisi"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PLAYER ROSTER (drag source) ── */}
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-3 py-2.5 border-b border-slate-800 flex items-center gap-2 shrink-0">
                  <Star className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-black uppercase text-slate-200">Roster Pemain</span>
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    {availablePlayers.length} tersedia
                  </span>
                </div>
                <div className="p-2 space-y-1 overflow-y-auto flex-1 max-h-[calc(115%+32px)]">
                  {availablePlayers.length === 0 ? (
                    <p className="text-[10px] text-slate-600 text-center py-6">Semua pemain sudah ditempatkan</p>
                  ) : (
                    availablePlayers.map((p) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(p.id, null)}
                        onDragEnd={() => { setDragPlayerId(null); setDragFromPos(null); }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${
                          dragPlayerId === p.id
                            ? 'opacity-40 scale-95'
                            : 'bg-slate-800/60 border-slate-700 hover:border-sky-500/50 hover:bg-slate-800'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="w-6 h-6 rounded-full bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-[9px] font-black text-sky-400 shrink-0">
                          {p.number}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[10px] font-bold text-slate-200 truncate">{p.name}</span>
                          <span className="text-[8px] text-slate-500">{p.position}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── BENCH ZONE (drop target) ── */}
            <div
              className={`rounded-2xl border-2 border-dashed overflow-hidden transition-all ${
                dragPlayerId ? 'border-sky-500/60 bg-sky-500/5' : 'border-slate-700/60 bg-slate-900/40'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropOnBench}
            >
              <div className="px-3 py-2 border-b border-slate-800/60 flex items-center gap-2">
                <span className="text-xs font-black uppercase text-slate-300">Pemain Cadangan (Bench)</span>
                <span className="text-[9px] text-slate-500 font-medium">— Seret pemain ke sini untuk jadikan cadangan</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                  {benchPlayerIds.length}
                </span>
              </div>
              <div className="p-2 flex flex-wrap gap-1.5 min-h-[48px]">
                {benchPlayerIds.length === 0 ? (
                  <p className="text-[10px] text-slate-600 w-full text-center py-2">
                    {dragPlayerId ? '📥 Lepas di sini untuk jadi cadangan' : 'Belum ada pemain cadangan'}
                  </p>
                ) : (
                  benchPlayerIds.map((pId) => {
                    const p = getPlayerById(pId);
                    if (!p) return null;
                    return (
                      <div
                        key={pId}
                        draggable
                        onDragStart={() => handleDragStart(p.id, null)}
                        onDragEnd={() => { setDragPlayerId(null); setDragFromPos(null); }}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-sky-500/25 text-[10px] font-bold text-sky-300 cursor-grab active:cursor-grabbing select-none"
                      >
                        <span className="text-[9px] text-sky-400/70">#{p.number}</span>
                        <span className="truncate max-w-[70px]">{p.name}</span>
                        <button
                          onClick={() => removeBenchPlayer(p.id)}
                          className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* ═══════════════════════════════════
              RIGHT COLUMN: EVENT LOGGER
          ════════════════════════════════════ */}
          <div className={`lg:col-span-5 space-y-4 ${activeTab === 'lineup' ? 'hidden lg:block' : ''}`}>

            {/* ── EVENT FORM ── */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-black uppercase text-slate-100">Catat Event Laga</h2>
              </div>

              <div className="p-4 space-y-3">
                {/* Event type grid */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Tipe Event</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, type: et.value })}
                        className={`px-2 py-2 rounded-xl text-[9px] font-bold border transition-all text-left leading-tight flex items-center gap-1.5 ${
                          newEvent.type === et.value
                            ? 'bg-sky-600/20 border-sky-400/60 text-sky-300'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <EventIcon type={et.value} />
                        <span>{et.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player selectors */}
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Pemain Utama *</label>
                  <select
                    value={newEvent.playerId}
                    onChange={(e) => setNewEvent({ ...newEvent, playerId: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                  >
                    <option value="">-- Pilih Pemain --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>#{p.number} {p.name} ({p.position})</option>
                    ))}
                  </select>
                </div>

                {newEvent.type === 'goal' && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Assist (Opsional)</label>
                    <select
                      value={newEvent.assistPlayerId}
                      onChange={(e) => setNewEvent({ ...newEvent, assistPlayerId: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                    >
                      <option value="">-- Tidak ada assist --</option>
                      {players.filter(p => p.id !== newEvent.playerId).map((p) => (
                        <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {newEvent.type === 'sub' && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Pemain yang Digantikan *</label>
                    <select
                      value={newEvent.assistPlayerId}
                      onChange={(e) => setNewEvent({ ...newEvent, assistPlayerId: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                    >
                      <option value="">-- Pilih Pemain Keluar --</option>
                      {players.filter(p => p.id !== newEvent.playerId).map((p) => (
                        <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Menit</label>
                    <input
                      type="number" min="1" max="120" value={newEvent.minute}
                      onChange={(e) => setNewEvent({ ...newEvent, minute: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none text-center font-mono font-bold"
                    />
                  </div>
                  {newEvent.type !== 'sub' && (
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Deskripsi</label>
                      <input
                        type="text" placeholder="Tendangan roket..."
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button" onClick={addEvent}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/20"
                >
                  <Plus className="w-4 h-4" /> Tambahkan Event
                </button>
              </div>
            </div>

            {/* ── EVENTS LIST ── */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-black uppercase text-slate-100">
                  Daftar Event ({eventsList.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
                {eventsList.length === 0 ? (
                  <div className="p-6 text-center">
                    <AlertCircle className="w-7 h-7 text-slate-700 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-600">Belum ada event dicatat</p>
                  </div>
                ) : (
                  [...eventsList].sort((a, b) => a.minute - b.minute).map((ev, idx) => {
                    const playerObj = getPlayerById(ev.playerId);
                    const assistObj = ev.assistPlayerId ? getPlayerById(ev.assistPlayerId) : null;
                    const evType = EVENT_TYPES.find(et => et.value === ev.type);
                    return (
                      <div key={idx} className="px-4 py-2.5 flex items-start gap-3 hover:bg-slate-800/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-black font-mono text-sky-400">{ev.minute}'</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <EventIcon type={ev.type} />
                            <span className="text-xs font-black text-slate-100 uppercase">{playerObj?.name || '—'}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded font-bold uppercase"
                              style={{ background: `${evType?.color}20`, color: evType?.color, border: `1px solid ${evType?.color}40` }}>
                              {evType?.label || ev.type}
                            </span>
                          </div>
                          {ev.type === 'sub' && assistObj && (
                            <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span className="text-green-400 font-bold">{getPlayerById(ev.playerId)?.name}</span>
                              <i className="fa-solid fa-right-left text-sky-400 text-[8px]" />
                              <span className="text-red-400 font-bold">{assistObj.name}</span>
                            </p>
                          )}
                          {ev.type !== 'sub' && assistObj && <p className="text-[9px] text-slate-500 mt-0.5">Assist: {assistObj.name}</p>}
                          {ev.description && <p className="text-[9px] text-slate-500 italic truncate">{ev.description}</p>}
                        </div>
                        <button
                          onClick={() => setEventsList((prev) => prev.filter((_, i) => i !== eventsList.indexOf(ev)))}
                          className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
