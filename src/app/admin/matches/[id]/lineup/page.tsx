'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Plus, Edit, Trash2, CheckCircle2, Activity,
  Clock, Zap, Shield, Star, AlertCircle, GripVertical, X,
  UserCheck, Upload, Loader2, Play
} from 'lucide-react';
import { formatWibDate, formatWibTime } from '@/lib/date';

interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string;
  isGuest: boolean;
  guestMatchId?: string | null;
}

interface MatchLineupInput {
  playerId: string;
  isStarter: boolean;
  pitchPosition: string;
  positionName: string;
  x?: number;
  y?: number;
}

interface PitchPlayer {
  playerId: string;
  x: number;
  y: number;
  positionName: string;
  pitchPosition: string;
}

interface MatchEventInput {
  playerId: string;
  assistPlayerId?: string;
  type: string;
  minute: number;
  description: string;
  createdAt?: string | Date;
}

const PITCH_POSITIONS = [
  { key: 'GK', fullLabel: 'Goalkeeper', x: 50, y: 88 },
  { key: 'LB', fullLabel: 'Left Back', x: 15, y: 70 },
  { key: 'CB1', fullLabel: 'Center Back 1', x: 36, y: 72 },
  { key: 'CB2', fullLabel: 'Center Back 2', x: 64, y: 72 },
  { key: 'RB', fullLabel: 'Right Back', x: 85, y: 70 },
  { key: 'CM1', fullLabel: 'Central Mid 1', x: 25, y: 50 },
  { key: 'CM2', fullLabel: 'Central Mid 2', x: 50, y: 48 },
  { key: 'CAM', fullLabel: 'Attacking Mid', x: 75, y: 50 },
  { key: 'LW', fullLabel: 'Left Winger', x: 15, y: 22 },
  { key: 'ST', fullLabel: 'Striker', x: 50, y: 14 },
  { key: 'RW', fullLabel: 'Right Winger', x: 85, y: 22 },
];

const isMatchTimeEvent = (type: string) => ['kickoff_2', 'halftime', 'fulltime'].includes(type);

const EVENT_TYPES = [
  { value: 'goal',        label: 'Gol',                 color: '#22c55e' },
  { value: 'yellow_card', label: 'Kartu Kuning',        color: '#eab308' },
  { value: 'red_card',    label: 'Kartu Merah',         color: '#ef4444' },
  { value: 'sub',         label: 'Pergantian',          color: '#38bdf8' },
  { value: 'own_goal',    label: 'Gol Bunuh Diri',      color: '#f97316' },
  { value: 'penalty',     label: 'Penalti',             color: '#a855f7' },
  { value: 'halftime',    label: 'Halftime',            color: '#38bdf8' },
  { value: 'kickoff_2',   label: 'Kickoff Babak 2',     color: '#06b6d4' },
  { value: 'fulltime',    label: 'Fulltime',            color: '#38bdf8' },
];

const EventIcon = ({ type }: { type: string }) => {
  if (type === 'kickoff_1' || type === 'kickoff_2') {
    return <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0 inline-block align-middle fill-cyan-400" />;
  }
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
  if (type === 'halftime' || type === 'fulltime') {
    return <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0 inline-block align-middle" />;
  }
  return null;
};

export default function MatchLineupBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: matchId } = use(params);
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [matchData, setMatchData] = useState<any>(null);
  const [matchDetails, setMatchDetails] = useState({
    status: 'scheduled',
    formation: 'Belum Tersedia',
    homeScore: '',
    awayScore: '',
    duration: 60,
    extraTime: 0,
    isLiveEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [starters, setStarters] = useState<PitchPlayer[]>([]);
  const [benchPlayerIds, setBenchPlayerIds] = useState<string[]>([]);
  const [eventsList, setEventsList] = useState<MatchEventInput[]>([]);

  // Drag state
  const [dragPlayerId, setDragPlayerId] = useState<string | null>(null);
  const [dragFromPitch, setDragFromPitch] = useState<boolean>(false);

  const [newEvent, setNewEvent] = useState({
    playerId: '', assistPlayerId: '', type: 'goal', minute: '1', description: '',
  });

  const getCurrentMatchMinute = () => {
    const ftEvent = eventsList.find((e) => e.type === 'fulltime');
    if (ftEvent) {
      return ftEvent.minute;
    }
    if (matchDetails.status === 'finished') {
      return matchDetails.duration || 60;
    }

    const htEvent = eventsList.find((e) => e.type === 'halftime');
    const k2Event = eventsList.find((e) => e.type === 'kickoff_2');

    if (htEvent && !k2Event) {
      return htEvent.minute;
    }

    const now = new Date().getTime();
    const matchStartMs = matchData?.matchDate ? new Date(matchData.matchDate).getTime() : now;

    if (k2Event) {
      const k2Time = k2Event.createdAt ? new Date(k2Event.createdAt).getTime() : now;
      const elapsedMin = Math.floor((now - k2Time) / 60000);
      const halfDur = Math.floor((matchDetails.duration || 60) / 2);
      const startMin = k2Event.minute || (halfDur + 1);
      return startMin + elapsedMin;
    }

    if (now < matchStartMs) return 1;
    let elapsed = Math.floor((now - matchStartMs) / 60000) + 1;
    return elapsed;
  };

  // Real-time Scoreboard live timer state for Admin Lineup Builder
  const [liveTimerDisplay, setLiveTimerDisplay] = useState<{
    phase: string;
    text: string;
    boxText: string | null;
  }>({ phase: 'BELUM KICKOFF', text: '00:00', boxText: null });

  useEffect(() => {
    if (!matchDetails.isLiveEnabled) return;

    const updateAdminTimer = () => {
      const ht = eventsList.find((e) => e.type === 'halftime');
      const k2 = eventsList.find((e) => e.type === 'kickoff_2');
      const ft = eventsList.find((e) => e.type === 'fulltime');

      if (ft || matchDetails.status === 'finished') {
        setLiveTimerDisplay({ phase: 'FULL TIME', text: '00:00', boxText: 'FULLTIME' });
        return;
      }
      if (ht && !k2) {
        setLiveTimerDisplay({ phase: 'HALFTIME', text: '00:00', boxText: 'HALFTIME' });
        return;
      }

      const nowMs = new Date().getTime();
      const matchStartMs = matchData?.matchDate ? new Date(matchData.matchDate).getTime() : nowMs;

      if (nowMs < matchStartMs) {
        setLiveTimerDisplay({ phase: 'BELUM KICKOFF', text: '00:00', boxText: null });
        return;
      }

      let totalSec = 0;
      let phaseLabel = 'BABAK 1';

      if (k2) {
        phaseLabel = 'BABAK 2';
        const k2Time = k2.createdAt ? new Date(k2.createdAt).getTime() : nowMs;
        const elapsedSec = Math.max(0, Math.floor((nowMs - k2Time) / 1000));
        const halfDur = Math.floor((matchDetails.duration || 60) / 2);
        const k2BaseSec = ((k2.minute || (halfDur + 1)) - 1) * 60;
        totalSec = k2BaseSec + elapsedSec;
      } else {
        phaseLabel = 'BABAK 1';
        totalSec = Math.max(0, Math.floor((nowMs - matchStartMs) / 1000));
      }

      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      setLiveTimerDisplay({
        phase: phaseLabel,
        text: formatted,
        boxText: null,
      });
    };

    updateAdminTimer();
    const timer = setInterval(updateAdminTimer, 1000);
    return () => clearInterval(timer);
  }, [matchDetails.isLiveEnabled, matchDetails.duration, matchDetails.status, matchData?.matchDate, eventsList]);

  const [activeTab, setActiveTab] = useState<'lineup' | 'events'>('lineup');
  const [rosterTab, setRosterTab] = useState<'main' | 'guests'>('main');

  const [editingGuestPlayer, setEditingGuestPlayer] = useState<Player | null>(null);

  const openAddGuestModal = () => {
    setEditingGuestPlayer(null);
    setGuestFormData({ name: '', number: '', position: 'FORWARD', photoUrl: '/playertemplate.png' });
    setShowGuestModal(true);
  };

  const openEditGuestModal = (player: Player) => {
    setEditingGuestPlayer(player);
    setGuestFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      photoUrl: player.photoUrl || '/playertemplate.png',
    });
    setShowGuestModal(true);
  };

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [guestFormData, setGuestFormData] = useState({
    name: '',
    number: '',
    position: 'FORWARD',
    photoUrl: '/playertemplate.png',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        setGuestFormData({ ...guestFormData, photoUrl: data.url });
      } else {
        alert('Gagal mengunggah gambar');
      }
    } catch {
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGuest = async (playerId: string, playerName: string) => {
    if (!confirm(`Hapus pemain loan ${playerName}?`)) return;
    try {
      const res = await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      if (res.ok) {
        setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        // Remove from pitch or bench if they were there
        setStarters((prev) => prev.filter((p) => p.playerId !== playerId));
        setBenchPlayerIds((prev) => prev.filter((id) => id !== playerId));
      } else {
        alert('Gagal menghapus pemain');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const posNameMap: Record<string, string> = {
    'GK': 'Goalkeeper',
    'DF': 'Defender',
    'MF': 'Midfielder',
    'FW': 'Forward',
    'GOALKEEPER': 'Goalkeeper',
    'DEFENDER': 'Defender',
    'MIDFIELDER': 'Midfielder',
    'FORWARD': 'Forward',
  };

  const formatPosition = (pos: string) => {
    if (!pos) return '';
    const upper = pos.toUpperCase();
    if (posNameMap[upper]) return posNameMap[upper];
    if (posNameMap[pos]) return posNameMap[pos];
    return pos.charAt(0).toUpperCase() + pos.slice(1).toLowerCase();
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFormData.name.trim() || !guestFormData.number) return;
    setAddingGuest(true);
    try {
      const url = editingGuestPlayer ? `/api/players/${editingGuestPlayer.id}` : '/api/players';
      const method = editingGuestPlayer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guestFormData,
          isGuest: true,
          guestMatchId: matchId, // Bind this guest to this match only
        })
      });
      if (res.ok) {
        const savedPlayer = await res.json();
        if (editingGuestPlayer) {
          setPlayers((prev) => prev.map((p) => (p.id === savedPlayer.id ? savedPlayer : p)));
        } else {
          setPlayers((prev) => [...prev, savedPlayer]);
        }
        setShowGuestModal(false);
        setEditingGuestPlayer(null);
        setGuestFormData({ name: '', number: '', position: 'FORWARD', photoUrl: '/playertemplate.png' });
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan pemain loan');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setAddingGuest(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [playersRes, matchRes] = await Promise.all([
          fetch('/api/players?matchId=' + matchId),
          fetch(`/api/matches/${matchId}`),
        ]);
        if (!playersRes.ok || !matchRes.ok) throw new Error('Gagal fetch data');

        const playersData = await playersRes.json();
        const matchInfo = await matchRes.json();

        setPlayers(playersData);
        setMatchData(matchInfo);
        setMatchDetails({
          status: matchInfo.status || 'scheduled',
          formation: matchInfo.formation || 'Belum Tersedia',
          homeScore: matchInfo.homeScore !== null ? matchInfo.homeScore.toString() : '',
          awayScore: matchInfo.awayScore !== null ? matchInfo.awayScore.toString() : '',
          duration: matchInfo.duration || 60,
          extraTime: matchInfo.extraTime || 0,
          isLiveEnabled: Boolean(matchInfo.isLiveEnabled),
        });

        if (matchInfo.lineups?.length > 0) {
          const sArr: PitchPlayer[] = [];
          const bIds: string[] = [];
          matchInfo.lineups.forEach((l: any) => {
            if (l.isStarter) {
              let cx = l.x, cy = l.y;
              if (cx == null || cy == null) {
                const preset = PITCH_POSITIONS.find(p => p.key === l.pitchPosition);
                if (preset) { cx = preset.x; cy = preset.y; }
                else { cx = 50; cy = 50; }
              }
              sArr.push({ playerId: l.playerId, x: cx, y: cy, pitchPosition: l.pitchPosition, positionName: l.positionName });
            }
            else bIds.push(l.playerId);
          });
          setStarters(sArr);
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
              createdAt: e.createdAt ? new Date(e.createdAt) : undefined,
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
  const handleDragStart = (playerId: string, fromPitch: boolean, e?: React.DragEvent) => {
    setDragPlayerId(playerId);
    setDragFromPitch(fromPitch);
    if (e?.dataTransfer) {
      e.dataTransfer.setData('text/plain', playerId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDropOnPitch = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pId = dragPlayerId || e.dataTransfer?.getData('text/plain');
    if (!pId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!dragFromPitch && starters.length >= 11) {
      alert('Gagal! Maksimal hanya boleh ada 11 pemain (starter) di lapangan.');
      setDragPlayerId(null);
      setDragFromPitch(false);
      return;
    }

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setStarters((prev) => {
      const filtered = prev.filter((p) => p.playerId !== pId);

      let posName = 'Midfielder';
      let pKey = 'CM';
      if (y > 70) { posName = 'Defender'; pKey = 'CB'; }
      else if (y > 85) { posName = 'Goalkeeper'; pKey = 'GK'; }
      else if (y < 30) { posName = 'Attacker'; pKey = 'ST'; }

      const existing = prev.find((p) => p.playerId === pId);
      if (existing) {
        posName = existing.positionName;
        pKey = existing.pitchPosition;
      }

      return [...filtered, { playerId: pId, x, y, positionName: posName, pitchPosition: pKey }];
    });

    if (!dragFromPitch) {
      setBenchPlayerIds((prev) => prev.filter((id) => id !== pId));
    }
    setDragPlayerId(null);
    setDragFromPitch(false);
  };

  const handleDropOnBench = (e?: React.DragEvent) => {
    const pId = dragPlayerId || e?.dataTransfer?.getData('text/plain');
    if (!pId) return;
    if (dragFromPitch) {
      setStarters((prev) => prev.filter((p) => p.playerId !== pId));
    }
    setBenchPlayerIds((prev) =>
      prev.includes(pId) ? prev : [...prev, pId]
    );
    setDragPlayerId(null);
    setDragFromPitch(false);
  };

  const handleDropOnRoster = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const pId = dragPlayerId || e.dataTransfer?.getData('text/plain');
    if (!pId) return;
    setStarters((prev) => prev.filter((p) => p.playerId !== pId));
    setBenchPlayerIds((prev) => prev.filter((id) => id !== pId));
    setDragPlayerId(null);
    setDragFromPitch(false);
  };

  const removeStarter = (playerId: string) => {
    setStarters((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  const removeBenchPlayer = (playerId: string) => {
    setBenchPlayerIds((prev) => prev.filter((id) => id !== playerId));
  };

  const handleScoreChange = (type: 'home' | 'away', val: string) => {
    setMatchDetails(prev => {
      let parsedVal = val;
      if (val !== '' && parseInt(val) < 0) parsedVal = '0';
      return {
        ...prev,
        [type === 'home' ? 'homeScore' : 'awayScore']: parsedVal,
      };
    });
  };

  const addEvent = () => {
    const isTimeEv = isMatchTimeEvent(newEvent.type);
    if (!isTimeEv && !newEvent.playerId) {
      alert('Pilih pemain untuk event ini');
      return;
    }

    let targetPlayerId = newEvent.playerId;
    if (!targetPlayerId && isTimeEv) {
      targetPlayerId = players[0]?.id || '';
    }

    let finalType = newEvent.type;

    // Otomatis ubah menjadi second_yellow (Kartu Kuning 2x / Merah) jika pemain sudah memiliki kartu kuning
    if (newEvent.type === 'yellow_card') {
      const existingYellow = eventsList.some(
        (e) => e.playerId === targetPlayerId && (e.type === 'yellow_card' || e.type === 'second_yellow')
      );
      if (existingYellow) {
        finalType = 'second_yellow';
      }
    }

    if (newEvent.type === 'red_card' || finalType === 'second_yellow') {
      const existingRed = eventsList.some(
        (e) => e.playerId === targetPlayerId && (e.type === 'red_card' || e.type === 'second_yellow')
      );
      if (existingRed) {
        alert('Gagal! Pemain ini sudah menerima kartu merah.');
        return;
      }
    }

    if (newEvent.type === 'goal' || newEvent.type === 'penalty' || newEvent.type === 'own_goal') {
      const isHome = matchData?.isHome;
      const marinersScoreStr = isHome ? matchDetails.homeScore : matchDetails.awayScore;
      const opponentScoreStr = isHome ? matchDetails.awayScore : matchDetails.homeScore;
      const marinersScore = parseInt(marinersScoreStr) || 0;
      const opponentScore = parseInt(opponentScoreStr) || 0;

      if (newEvent.type === 'goal' || newEvent.type === 'penalty') {
        const currentMarinersGoals = eventsList.filter(e => e.type === 'goal' || e.type === 'penalty').length;
        if (currentMarinersGoals >= marinersScore) {
          alert('Gagal! Jumlah gol Mariners melebihi skor yang diinputkan.');
          return;
        }
      }

      if (newEvent.type === 'own_goal') {
        const currentOwnGoals = eventsList.filter(e => e.type === 'own_goal').length;
        if (currentOwnGoals >= opponentScore) {
          alert('Gagal! Jumlah gol bunuh diri melebihi skor lawan yang diinputkan.');
          return;
        }
      }
    }

    if (finalType === 'fulltime') {
      setMatchDetails((prev) => ({ ...prev, status: 'finished' }));
    }

    setEventsList((prev) => [
      ...prev,
      {
        playerId: targetPlayerId,
        assistPlayerId: newEvent.assistPlayerId || undefined,
        type: finalType,
        minute: parseInt(newEvent.minute) || 0,
        description: newEvent.description,
        createdAt: new Date(),
      },
    ]);
    const defaultNextMin = matchDetails.isLiveEnabled ? String(getCurrentMatchMinute()) : '1';
    setNewEvent({ playerId: '', assistPlayerId: '', type: 'goal', minute: defaultNextMin, description: '' });
  };

  const handleDeleteEvent = (indexToDelete: number) => {
    const evToDelete = eventsList[indexToDelete];
    const updatedEvents = eventsList.filter((_, i) => i !== indexToDelete);
    setEventsList(updatedEvents);

    if (evToDelete?.type === 'fulltime') {
      const hasRemainingFT = updatedEvents.some((e) => e.type === 'fulltime');
      if (!hasRemainingFT) {
        const start = matchData?.matchDate ? new Date(matchData.matchDate).getTime() : 0;
        const now = new Date().getTime();
        const durationMs = (matchDetails.duration || 60) * 60 * 1000;
        const end = start + durationMs;

        if (matchDetails.isLiveEnabled !== false) {
          setMatchDetails((prev) => ({ ...prev, status: now >= start ? 'live' : 'scheduled' }));
        } else {
          setMatchDetails((prev) => ({
            ...prev,
            status: (now >= start && now <= end) ? 'live' : (now > end ? 'finished' : 'scheduled'),
          }));
        }
      }
    }
  };

  const getEffectiveStatus = () => {
    const hasFulltime = eventsList.some((e) => e.type === 'fulltime');
    if (hasFulltime) return 'finished';
    if (!matchData?.matchDate) return 'scheduled';

    const start = new Date(matchData.matchDate).getTime();
    if (isNaN(start)) return 'scheduled';
    const now = new Date().getTime();

    if (now < start) return 'scheduled';

    if (matchDetails.isLiveEnabled !== false) {
      return 'live';
    } else {
      const durationMs = (matchDetails.duration || 60) * 60 * 1000;
      const end = start + durationMs;
      if (now >= end) return 'finished';
      return 'live';
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const lineupsPayload: MatchLineupInput[] = [];
    starters.forEach((s) => {
      lineupsPayload.push({
        playerId: s.playerId,
        isStarter: true,
        pitchPosition: s.pitchPosition,
        positionName: s.positionName,
        x: s.x,
        y: s.y
      });
    });
    benchPlayerIds.forEach((pId) => {
      lineupsPayload.push({ playerId: pId, isStarter: false, pitchPosition: 'SUB', positionName: 'Cadangan' });
    });

    const effectiveStatus = getEffectiveStatus();

    try {
      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineups: lineupsPayload,
          events: eventsList,
          status: effectiveStatus,
          formation: matchDetails.formation,
          homeScore: matchDetails.homeScore,
          awayScore: matchDetails.awayScore,
          duration: matchDetails.duration,
          isLiveEnabled: matchDetails.isLiveEnabled
        }),
      });
      if (res.ok) {
        setMatchDetails((prev) => ({ ...prev, status: effectiveStatus }));
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          router.refresh();
        }, 2000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(`Gagal menyimpan lineup: ${errJson.error || res.statusText}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan jaringan: ${err?.message || err}`);
    }
    finally { setSaving(false); }
  };

  const getPlayerById = (id: string) => players.find((p) => p.id === id);
  const starterCount = starters.length;
  const pitchedIds = new Set(starters.map((s) => s.playerId));
  const benchSet = new Set(benchPlayerIds);
  const availablePlayers = players.filter((p) => !pitchedIds.has(p.id) && !benchSet.has(p.id));

  const getPosWeight = (pos: string): number => {
    const p = (pos || '').toUpperCase();
    if (p === 'GK' || p === 'GOALKEEPER') return 1;
    if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 2;
    if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 3;
    if (p === 'FW' || p === 'FORWARD' || p.includes('ST') || p.includes('LW') || p.includes('RW')) return 4;
    return 5;
  };

  const sortRosterList = (list: Player[]) => {
    return [...list].sort((a, b) => {
      const wA = getPosWeight(a.position);
      const wB = getPosWeight(b.position);
      if (wA !== wB) return wA - wB;
      return a.number - b.number;
    });
  };

  const mainSquadAvailable = sortRosterList(availablePlayers.filter((p) => !p.isGuest));
  const guestPlayersAvailable = sortRosterList(availablePlayers.filter((p) => p.isGuest));

  const activeMatchPlayerIds = new Set([...pitchedIds, ...benchSet]);
  const matchPlayers = players.filter((p) => activeMatchPlayerIds.has(p.id));

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
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-colors ${starterCount === 11
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
              }`}>
              {starterCount}/11 Starter
            </div>

            <button
              onClick={handleSaveAll}
              disabled={saving || saveSuccess}
              className={`px-5 py-2 rounded-xl font-extrabold uppercase text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-70 ${saveSuccess
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
              {saveSuccess ? 'Tersimpan!' : saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 space-y-5">

        {/* ═══ SCOREBOARD ═══ */}
        <div className="bg-slate-900/80 p-4 sm:p-6 rounded-2xl border border-sky-500/20 flex flex-col items-center justify-center gap-4 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50" />
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center flex flex-col items-center gap-1.5">
            <span className="text-slate-300 font-black tracking-wider text-xs">{matchData?.competition ? matchData.competition : 'Pertandingan'}</span>
            {matchData?.matchDate && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-400/30 shadow-inner my-0.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                {formatWibDate(matchData.matchDate, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })} • {formatWibTime(matchData.matchDate)}
              </span>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <label className="flex items-center gap-1.5 cursor-pointer">
                Waktu Laga:
                <select
                  value={matchDetails.duration}
                  onChange={e => setMatchDetails(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  className="bg-slate-900 border border-slate-700 text-sky-400 rounded px-2 py-0.5 text-center outline-none focus:border-sky-500 text-xs"
                  title="Waktu Laga (menit)"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(val => (
                    <option key={val} value={val}>{val} menit</option>
                  ))}
                </select>
              </label>

              <span className="text-slate-600 hidden sm:inline">|</span>

              <label className="flex items-center gap-1.5 cursor-pointer">
                Mode Pertandingan:
                <select
                  value={matchDetails.isLiveEnabled ? 'true' : 'false'}
                  onChange={e => setMatchDetails(prev => ({ ...prev, isLiveEnabled: e.target.value === 'true' }))}
                  className="bg-slate-900 border border-slate-700 text-sky-400 rounded px-2 py-0.5 text-center outline-none focus:border-sky-500 text-xs"
                  title="Pilih Mode Pertandingan Live"
                >
                  <option value="true">Live Score (DEMO)</option>
                  <option value="false">Non Live Score</option>
                </select>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6 justify-center w-full max-w-3xl">
            {/* Home Team */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-4 text-center sm:text-right">
              <span className="font-bold text-white uppercase text-xs sm:text-lg line-clamp-2 sm:line-clamp-1 order-2 sm:order-1">{matchData?.isHome ? 'Mariners FC' : matchData?.opponentName}</span>
              <img src={matchData?.isHome ? '/marinerssc.png' : (matchData?.opponentLogo || '/defaultteam.png')} alt="Home" className="w-12 sm:w-16 h-12 sm:h-16 object-contain drop-shadow-md order-1 sm:order-2" />
            </div>

            {/* Score Inputs */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-950 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-700 shadow-inner shrink-0 relative group">
              {matchData?.matchDate && new Date() < new Date(matchData.matchDate) && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-amber-500/90 text-slate-950 text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                  Skor belum bisa diisi (Laga Belum Dimulai)
                </div>
              )}
              <input
                type="number"
                min="0"
                placeholder="-"
                value={matchDetails.homeScore}
                onChange={(e) => handleScoreChange('home', e.target.value)}
                disabled={matchData?.matchDate && new Date() < new Date(matchData.matchDate)}
                className="w-10 sm:w-14 bg-transparent text-white text-2xl sm:text-4xl font-black font-mono text-center outline-none focus:text-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={matchData?.matchDate && new Date() < new Date(matchData.matchDate) ? "Skor baru bisa diisi setelah jam laga terlewati" : "Skor Kandang"}
              />
              <span className="text-slate-500 font-bold text-xl sm:text-2xl">-</span>
              <input
                type="number"
                min="0"
                placeholder="-"
                value={matchDetails.awayScore}
                onChange={(e) => handleScoreChange('away', e.target.value)}
                disabled={matchData?.matchDate && new Date() < new Date(matchData.matchDate)}
                className="w-10 sm:w-14 bg-transparent text-white text-2xl sm:text-4xl font-black font-mono text-center outline-none focus:text-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={matchData?.matchDate && new Date() < new Date(matchData.matchDate) ? "Skor baru bisa diisi setelah jam laga terlewati" : "Skor Tamu"}
              />
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-start gap-2 sm:gap-4 text-center sm:text-left">
              <img src={!matchData?.isHome ? '/marinerssc.png' : (matchData?.opponentLogo || '/defaultteam.png')} alt="Away" className="w-12 sm:w-16 h-12 sm:h-16 object-contain drop-shadow-md order-1" />
              <span className="font-bold text-white uppercase text-xs sm:text-lg line-clamp-2 sm:line-clamp-1 order-2">{!matchData?.isHome ? 'Mariners FC' : matchData?.opponentName}</span>
            </div>
          </div>

          {/* Realtime Timer display for Live Score mode */}
          {matchDetails.isLiveEnabled && (
            <div className="flex flex-col items-center justify-center gap-1 mt-1">
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-3 py-1 rounded-full border border-slate-800 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">{liveTimerDisplay.phase}</span>
                <span className="text-slate-600">|</span>
                {liveTimerDisplay.boxText ? (
                  <span className="text-xs font-black font-mono text-amber-400 animate-pulse">{liveTimerDisplay.boxText}</span>
                ) : (
                  <span className="text-xs font-black font-mono text-red-400">{liveTimerDisplay.text}</span>
                )}
              </div>
            </div>
          )}

          <p className="text-[9px] font-bold px-2.5 py-1 rounded mt-0.5 bg-sky-500/10 text-sky-400">
            {(() => {
              const st = getEffectiveStatus();
              if (st === 'finished') {
                if (matchDetails.homeScore === '' || matchDetails.awayScore === '' || matchDetails.homeScore === null || matchDetails.awayScore === null) {
                  return 'SKOR BELUM DIINPUT';
                }
                return 'Laga Selesai (Full Time)';
              }
              if (st === 'live') return 'Laga Sedang Berlangsung';
              return 'Laga Belum Dimulai';
            })()}
          </p>
        </div>

        {/* ═══ MOBILE TABS ═══ */}
        <div className="flex lg:hidden gap-1 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {(['lineup', 'events'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
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

              {/* ── FOOTBALL PITCH (Direct White Lines - No Outer Box) ── */}
              <div>
                {/* Pitch Header Controls */}
                <div className="py-1 px-1 flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-xs font-black uppercase text-slate-200">Lapangan</span>
                  <input
                    type="text"
                    placeholder="Formasi (2-3-2)"
                    value={matchDetails.formation}
                    onChange={(e) => setMatchDetails({ ...matchDetails, formation: e.target.value })}
                    className="w-16 sm:w-20 bg-slate-950 border border-slate-700 text-sky-400 text-[10px] font-mono font-bold text-center rounded px-1 py-0.5 outline-none focus:border-sky-500 transition-colors ml-2"
                  />
                </div>

                {/* Pitch area — direct lines without box fill */}
                <div
                  className="relative w-full select-none"
                  style={{
                    paddingBottom: '115%',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropOnPitch}
                >
                  {/* SVG Pitch Lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 115" preserveAspectRatio="none">
                    <rect x="2" y="2" width="96" height="111" rx="0.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                    <line x1="2" y1="57.5" x2="98" y2="57.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                    <circle cx="50" cy="57.5" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                    <circle cx="50" cy="57.5" r="0.7" fill="rgba(255,255,255,0.5)" />
                    {/* Top penalty area */}
                    <rect x="22" y="2" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                    <rect x="35" y="2" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                    {/* Bottom penalty area */}
                    <rect x="22" y="95" width="56" height="18" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                    <rect x="35" y="106" width="30" height="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
                  </svg>

                  {/* Attack Arrow */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-30 pointer-events-none">
                    <svg width="12" height="14" viewBox="0 0 12 14">
                      <path d="M6 0L12 8H8v6H4V8H0Z" fill="white" />
                    </svg>
                  </div>

                  {/* Player Tokens */}
                  {starters.map((starter) => {
                    const player = getPlayerById(starter.playerId);
                    if (!player) return null;

                    return (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={(e) => handleDragStart(player.id, true, e)}
                        onDragEnd={() => { setDragPlayerId(null); setDragFromPitch(false); }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-10 cursor-grab active:cursor-grabbing group"
                        style={{ left: `${starter.x}%`, top: `${starter.y}%` }}
                      >
                        {/* Token circle */}
                        <div
                          className="w-10 h-10 rounded-full border-2 border-sky-400 bg-slate-900 shadow-lg shadow-sky-600/40 hover:scale-110 flex items-center justify-center transition-all overflow-hidden"
                        >
                          <img src={player.photoUrl || '/playertemplate.png'} alt={player.name} className="w-full h-full object-cover object-top scale-[1.35] origin-top" />
                        </div>
                        {/* Name chip with squad number on the left */}
                        <div className="mt-0.5 z-10 px-1 py-px rounded text-[7px] font-black leading-none whitespace-nowrap max-w-[64px] truncate bg-slate-950/90 text-sky-300 border border-sky-500/30 flex items-center gap-0.5">
                          <span className="text-sky-400 font-mono">{player.number}</span>
                          <span className="truncate">{player.name.split(' ')[0]}</span>
                        </div>
                        {/* Clear X button when filled */}
                        <button
                          onClick={() => removeStarter(player.id)}
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity z-20"
                          style={{ fontSize: '7px' }}
                          title="Keluarkan dari posisi"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── PLAYER ROSTER (drag source & drop target with tabs) ── */}
              <div
                className={`rounded-2xl bg-slate-900/60 border overflow-hidden flex flex-col transition-all ${
                  dragPlayerId ? 'border-sky-500/80 bg-sky-500/10 ring-2 ring-sky-500/30' : 'border-slate-800'
                }`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={handleDropOnRoster}
              >
                {/* Roster Header Tabs */}
                <div className="px-2 py-2 border-b border-slate-800 bg-slate-950/60 flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRosterTab('main')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${rosterTab === 'main'
                        ? 'bg-sky-600/30 text-sky-300 border border-sky-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                  >
                    <Star className="w-3 h-3 text-sky-400" />
                    Skuad Utama ({mainSquadAvailable.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setRosterTab('guests')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-[10px] font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${rosterTab === 'guests'
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                  >
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    Pemain Loan ({guestPlayersAvailable.length})
                  </button>
                </div>

                <div
                  className="p-2 space-y-1.5 overflow-y-auto flex-1 max-h-[calc(115%+32px)]"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDragEnter={(e) => e.preventDefault()}
                  onDrop={handleDropOnRoster}
                >
                  {/* TAB 1: SKUAD UTAMA */}
                  {rosterTab === 'main' && (
                    <>
                      {mainSquadAvailable.length === 0 ? (
                        <p className="text-[10px] text-slate-500 text-center py-6">
                          {dragPlayerId ? '📥 Lepas pemain di sini untuk kembalikan ke skuad utama' : 'Semua pemain skuad utama sudah ditempatkan.'}
                        </p>
                      ) : (
                        mainSquadAvailable.map((p) => (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(p.id, false, e)}
                            onDragEnd={() => { setDragPlayerId(null); setDragFromPitch(false); }}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${dragPlayerId === p.id
                                ? 'opacity-40 scale-95'
                                : 'bg-slate-800/60 border-slate-700 hover:border-sky-500/50 hover:bg-slate-800'
                              }`}
                          >
                            <GripVertical className="w-3 h-3 text-slate-600 shrink-0" />
                            {/* Foto Pemain */}
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-sky-400/40 shrink-0 bg-slate-900">
                              <img src={p.photoUrl || '/playertemplate.png'} alt={p.name} className="w-full h-full object-cover object-top" />
                            </div>
                            <span className="font-mono font-black text-[11px] text-sky-400 shrink-0 min-w-[18px] text-center">
                              {p.number}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[10px] font-bold text-slate-200 truncate">{p.name}</span>
                              <span className="text-[8px] text-slate-500">{formatPosition(p.position)}</span>
                            </span>
                          </div>
                        ))
                      )}
                    </>
                  )}

                  {/* TAB 2: PEMAIN LOAN (DIGABUNGKAN) */}
                  {rosterTab === 'guests' && (
                    <>
                      {guestPlayersAvailable.length === 0 ? (
                        <div className="text-center py-5 space-y-2">
                          <p className="text-[10px] text-slate-500">Belum ada pemain loan.</p>
                        </div>
                      ) : (
                        guestPlayersAvailable.map((p) => {
                          const isThisMatch = p.guestMatchId === matchId;
                          return (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={(e) => handleDragStart(p.id, false, e)}
                              onDragEnd={() => { setDragPlayerId(null); setDragFromPitch(false); }}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all select-none ${dragPlayerId === p.id
                                  ? 'opacity-40 scale-95'
                                  : isThisMatch
                                    ? 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-400/50'
                                    : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50'
                                }`}
                            >
                              <GripVertical className={`w-3 h-3 shrink-0 ${isThisMatch ? 'text-emerald-500/60' : 'text-amber-500/60'}`} />
                              {/* Foto Pemain */}
                              <div className={`w-7 h-7 rounded-full overflow-hidden border shrink-0 bg-slate-900 ${isThisMatch ? 'border-emerald-400/40' : 'border-amber-400/40'}`}>
                                <img src={p.photoUrl || '/playertemplate.png'} alt={p.name} className="w-full h-full object-cover object-top" />
                              </div>
                              <span className={`font-mono font-black text-[11px] shrink-0 min-w-[18px] text-center ${isThisMatch ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {p.number}
                              </span>
                              <span className="flex-1 min-w-0 flex items-center justify-between gap-1">
                                <span className="block min-w-0">
                                  <span className={`block text-[10px] font-bold truncate ${isThisMatch ? 'text-emerald-200' : 'text-amber-200'}`}>{p.name}</span>
                                  <span className={`text-[8px] ${isThisMatch ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
                                    {formatPosition(p.position)} • {isThisMatch ? 'Loan Match Ini' : ''}
                                  </span>
                                </span>
                                {isThisMatch ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); openEditGuestModal(p); }}
                                      className="p-1 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-colors"
                                      title="Edit Pemain Loan"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteGuest(p.id, p.name); }}
                                      className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                      title="Hapus Pemain Loan"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBenchPlayerIds((prev) => [...prev, p.id]);
                                      }}
                                      className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-400 hover:text-slate-950 transition-colors text-[9px] font-bold uppercase flex items-center gap-1 border border-amber-500/40"
                                      title="Masukkan ke Cadangan Match Ini"
                                    >
                                      
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleDeleteGuest(p.id, p.name); }}
                                      className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors border border-red-500/20"
                                      title="Hapus Pemain Loan"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {/* Guest Player Add Button */}
                      <div className="mt-3 pt-3 border-t border-slate-800">
                        <button
                          onClick={openAddGuestModal}
                          className="w-full bg-emerald-950/40 border border-emerald-500/40 hover:bg-emerald-900/50 text-emerald-300 rounded-xl px-2 py-2 text-[10px] font-extrabold uppercase transition-colors flex items-center justify-center gap-1.5 shadow"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Tambah Pemain Loan Baru
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── BENCH ZONE (drop target) ── */}
            <div
              className={`rounded-2xl border-2 border-dashed overflow-hidden transition-all ${dragPlayerId ? 'border-sky-500/60 bg-sky-500/5' : 'border-slate-700/60 bg-slate-900/40'
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
                        onDragStart={(e) => handleDragStart(p.id, false, e)}
                        onDragEnd={() => { setDragPlayerId(null); setDragFromPitch(false); }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800/90 border border-sky-500/30 text-sky-300 cursor-grab active:cursor-grabbing select-none shadow-sm hover:border-sky-400/50 transition-all"
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-sky-400/40 shrink-0 bg-slate-900">
                          <img src={p.photoUrl || '/playertemplate.png'} alt={p.name} className="w-full h-full object-cover object-top" />
                        </div>
                        <span className="font-mono font-black text-xs text-sky-400 shrink-0 min-w-[16px] text-center">{p.number}</span>
                        <div className="flex flex-col min-w-0 pr-1">
                          <span className="text-[10px] font-bold text-slate-100 truncate max-w-[80px] leading-tight">{p.name.split(' ')[0]}</span>
                          <span className="text-[8.5px] font-semibold text-sky-400/80 leading-none mt-0.5">
                            {formatPosition(p.position)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeBenchPlayer(p.id)}
                          className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors shrink-0"
                          title="Keluarkan dari cadangan"
                        >
                          <X className="w-3 h-3" />
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
                        className={`px-2 py-2 rounded-xl text-[9px] font-bold border transition-all text-left leading-tight flex items-center gap-1.5 ${newEvent.type === et.value
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
                {!isMatchTimeEvent(newEvent.type) && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">
                      {newEvent.type === 'own_goal' ? 'Pemain yang Melakukan Gol Bunuh Diri *' : 'Pemain Utama *'}
                    </label>
                    <select
                      value={newEvent.playerId}
                      onChange={(e) => setNewEvent({ ...newEvent, playerId: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                    >
                      <option value="">-- Pilih Pemain --</option>
                      {matchPlayers.map((p) => (
                        <option key={p.id} value={p.id}>{p.number}. {p.name} ({p.position})</option>
                      ))}
                    </select>
                  </div>
                )}

                {newEvent.type === 'goal' && (
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Assist (Opsional)</label>
                    <select
                      value={newEvent.assistPlayerId}
                      onChange={(e) => setNewEvent({ ...newEvent, assistPlayerId: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-sky-500 outline-none"
                    >
                      <option value="">-- Tidak ada assist --</option>
                      {matchPlayers.filter(p => p.id !== newEvent.playerId).map((p) => (
                        <option key={p.id} value={p.id}>{p.number}. {p.name}</option>
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
                      {matchPlayers.filter(p => p.id !== newEvent.playerId).map((p) => (
                        <option key={p.id} value={p.id}>{p.number}. {p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Menit</label>
                    <input
                      type="number" min="1" max="999" value={newEvent.minute}
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
                  type="button"
                  onClick={addEvent}
                  disabled={matchData?.matchDate && new Date() < new Date(matchData.matchDate)}
                  className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" /> Tambahkan Event
                </button>
              </div>
            </div>

            {/* ── EVENTS LIST ── */}
            <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden relative">
              {matchData?.matchDate && new Date() < new Date(matchData.matchDate) && (
                <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
                  <div className="space-y-2 max-w-[200px]">
                    <Clock className="w-8 h-8 text-sky-400 mx-auto opacity-50" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase leading-relaxed">Pencatatan Event Belum Tersedia</p>
                  </div>
                </div>
              )}
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
                            {!isMatchTimeEvent(ev.type) && (
                              <span className="text-xs font-black text-slate-100 uppercase">{playerObj?.name || '—'}</span>
                            )}
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
                          onClick={() => handleDeleteEvent(eventsList.indexOf(ev))}
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

      {/* ═══ MODAL PEMAIN LOAN ═══ */}
      {showGuestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-950 border border-sky-500/30 rounded-3xl w-full max-w-lg shadow-2xl shadow-sky-900/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-sky-400" />
                {editingGuestPlayer ? 'Edit Pemain Loan' : 'Tambah Pemain Loan'}
              </h2>
              <button onClick={() => setShowGuestModal(false)} className="p-2 bg-slate-800/80 rounded-full text-slate-400 hover:text-white hover:bg-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-sky-400/40 shrink-0">
                    <img src={guestFormData.photoUrl || '/playertemplate.png'} alt="Preview" className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center gap-2 text-xs transition-colors">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Mengunggah...' : 'Upload Foto'}
                        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                      </label>

                      <button type="button" onClick={() => setGuestFormData((prev) => ({ ...prev, photoUrl: '/playertemplate.png' }))} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">
                        Reset
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">Pilih file gambar.</p>
                  </div>
                </div>
              </div>

              <form id="guestForm" onSubmit={handleAddGuest} className="space-y-4">
                <div>
                  <label className="font-bold text-slate-200 uppercase block mb-1 text-xs">Nama Lengkap</label>
                  <input type="text" required value={guestFormData.name} onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-200 uppercase block mb-1 text-xs">Nomor Punggung</label>
                    <input type="number" required value={guestFormData.number} onChange={(e) => setGuestFormData({ ...guestFormData, number: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-200 uppercase block mb-1 text-xs">Posisi</label>
                    <select value={guestFormData.position} onChange={(e) => setGuestFormData({ ...guestFormData, position: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-sky-400 outline-none text-sm">
                      <option value="GOALKEEPER">GOALKEEPER</option>
                      <option value="DEFENDER">DEFENDER</option>
                      <option value="MIDFIELDER">MIDFIELDER</option>
                      <option value="FORWARD">FORWARD</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setShowGuestModal(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors">
                Batal
              </button>
              <button form="guestForm" type="submit" disabled={addingGuest || uploading} className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {addingGuest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {addingGuest ? 'Menyimpan...' : 'Simpan Pemain Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
