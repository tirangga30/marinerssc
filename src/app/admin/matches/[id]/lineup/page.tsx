'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, Save, Plus, Trash2, CheckCircle2, Activity, UserPlus, Clock } from 'lucide-react';

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

const defaultPitchPositions = [
  { position: 'GK', label: 'Goalkeeper (GK)' },
  { position: 'LB', label: 'Left Back (LB)' },
  { position: 'CB1', label: 'Center Back 1 (CB1)' },
  { position: 'CB2', label: 'Center Back 2 (CB2)' },
  { position: 'RB', label: 'Right Back (RB)' },
  { position: 'CM1', label: 'Central Midfield 1 (CM1)' },
  { position: 'CM2', label: 'Central Midfield 2 (CM2)' },
  { position: 'CAM', label: 'Attacking Midfield (CAM)' },
  { position: 'LW', label: 'Left Winger (LW)' },
  { position: 'ST', label: 'Striker (ST)' },
  { position: 'RW', label: 'Right Winger (RW)' },
];

export default function MatchLineupBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lineup state (Map pitchPosition -> playerId)
  const [startersMap, setStartersMap] = useState<Record<string, string>>({});
  const [benchPlayerIds, setBenchPlayerIds] = useState<string[]>([]);
  const [eventsList, setEventsList] = useState<MatchEventInput[]>([]);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    playerId: '',
    assistPlayerId: '',
    type: 'goal',
    minute: '15',
    description: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [playersRes, matchRes] = await Promise.all([
          fetch('/api/players'),
          fetch(`/api/matches/${matchId}`),
        ]);

        const playersData = await playersRes.json();
        const matchInfo = await matchRes.json();

        setPlayers(playersData);
        setMatchData(matchInfo);

        // Populate existing lineups
        if (matchInfo.lineups && matchInfo.lineups.length > 0) {
          const sMap: Record<string, string> = {};
          const bIds: string[] = [];

          matchInfo.lineups.forEach((l: any) => {
            if (l.isStarter) {
              sMap[l.pitchPosition] = l.playerId;
            } else {
              bIds.push(l.playerId);
            }
          });

          setStartersMap(sMap);
          setBenchPlayerIds(bIds);
        }

        // Populate existing events
        if (matchInfo.events && matchInfo.events.length > 0) {
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
        console.error('Gagal memuat data taktik:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [matchId]);

  const handleStarterChange = (positionKey: string, playerId: string) => {
    setStartersMap((prev) => ({ ...prev, [positionKey]: playerId }));
  };

  const toggleBenchPlayer = (playerId: string) => {
    setBenchPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const addEvent = () => {
    if (!newEvent.playerId) {
      alert('Pilih pemain untuk event ini');
      return;
    }

    setEventsList((prev) => [
      ...prev,
      {
        playerId: newEvent.playerId,
        assistPlayerId: newEvent.assistPlayerId || undefined,
        type: newEvent.type,
        minute: parseInt(newEvent.minute) || 0,
        description: newEvent.description,
      },
    ]);

    setNewEvent({ playerId: '', assistPlayerId: '', type: 'goal', minute: '15', description: '' });
  };

  const removeEvent = (index: number) => {
    setEventsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    const lineupsPayload: MatchLineupInput[] = [];

    // Starters
    defaultPitchPositions.forEach((pos) => {
      const pId = startersMap[pos.position];
      if (pId) {
        lineupsPayload.push({
          playerId: pId,
          isStarter: true,
          pitchPosition: pos.position,
          positionName: pos.label,
        });
      }
    });

    // Bench
    benchPlayerIds.forEach((pId) => {
      lineupsPayload.push({
        playerId: pId,
        isStarter: false,
        pitchPosition: 'SUB',
        positionName: 'Cadangan',
      });
    });

    try {
      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineups: lineupsPayload,
          events: eventsList,
        }),
      });

      if (res.ok) {
        alert('Taktik lineup & event pertandingan berhasil disimpan!');
        router.push('/admin/matches');
        router.refresh();
      } else {
        alert('Gagal menyimpan taktik');
      }
    } catch {
      alert('Terjadi kesalahan jaringan');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-amber-400 font-bold">Memuat Lineup Builder...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase text-slate-400 hover:text-amber-400"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Manajemen Pertandingan
        </Link>
        <button
          onClick={handleSaveAll}
          className="px-6 py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110"
        >
          <Save className="w-4 h-4" /> Simpan Semua Lineup & Events
        </button>
      </div>

      {/* Match Title Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase">Match Lineup & Events Builder</span>
          <h1 className="text-2xl font-black uppercase text-slate-100 gold-gradient-text">
            Mariners FC vs {matchData?.opponentName}
          </h1>
        </div>
        <div className="text-xs font-mono font-bold px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          Formasi: {matchData?.formation || '4-3-3'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: 11 Starters Selection */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Susunan 11 Pemain Starter (4-3-3)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {defaultPitchPositions.map((pos) => (
              <div key={pos.position} className="space-y-1">
                <label className="text-[11px] font-extrabold uppercase text-amber-400 flex items-center gap-1">
                  <span>{pos.label}</span>
                </label>
                <select
                  value={startersMap[pos.position] || ''}
                  onChange={(e) => handleStarterChange(pos.position, e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 font-medium focus:border-amber-500 outline-none"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.number} {p.name} ({p.position})
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Bench Selection */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase text-amber-400">Pemain Cadangan (Bench)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((p) => {
                const isSelectedAsStarter = Object.values(startersMap).includes(p.id);
                if (isSelectedAsStarter) return null;
                const isBench = benchPlayerIds.includes(p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleBenchPlayer(p.id)}
                    className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                      isBench
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate">#{p.number} {p.name}</span>
                    {isBench && <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Match Event Logger */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase text-slate-100">Catat Event Laga (Gol/Kartu)</h2>
          </div>

          {/* Form Add Event */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300 uppercase block mb-1">Tipe Event</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
              >
                <option value="goal">⚽ Gol</option>
                <option value="yellow_card">🟨 Kartu Kuning</option>
                <option value="red_card">🟥 Kartu Merah</option>
                <option value="sub">🔄 Pergantian Pemain</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">Pemain Utama</label>
                <select
                  value={newEvent.playerId}
                  onChange={(e) => setNewEvent({ ...newEvent, playerId: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="">-- Pilih Pemain --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">Pemberi Assist (Opsional)</label>
                <select
                  value={newEvent.assistPlayerId}
                  onChange={(e) => setNewEvent({ ...newEvent, assistPlayerId: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                >
                  <option value="">-- Tidak ada --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="font-bold text-slate-300 uppercase block mb-1">Menit Ke-</label>
                <input
                  type="number"
                  value={newEvent.minute}
                  onChange={(e) => setNewEvent({ ...newEvent, minute: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
              <div className="col-span-2">
                <label className="font-bold text-slate-300 uppercase block mb-1">Keterangan / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Tendangan roket luar penalti"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addEvent}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold uppercase text-xs flex items-center justify-center gap-1 hover:bg-amber-500 hover:text-slate-950 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambahkan Event
            </button>
          </div>

          {/* List Added Events */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-slate-400">Daftar Event Tercatat ({eventsList.length})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {eventsList.map((ev, idx) => {
                const playerObj = players.find((p) => p.id === ev.playerId);
                const assistObj = players.find((p) => p.id === ev.assistPlayerId);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-amber-400 mr-2">{ev.minute}'</span>
                      <span className="font-bold text-slate-100 uppercase">{playerObj?.name || 'Pemain'}</span>
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
                        {ev.type}
                      </span>
                      {assistObj && <p className="text-[10px] text-amber-400/80">Assist: {assistObj.name}</p>}
                    </div>
                    <button onClick={() => removeEvent(idx)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
