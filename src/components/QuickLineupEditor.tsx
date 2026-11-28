'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, Shield, Users, Loader2 } from 'lucide-react';

interface PlayerInfo {
  id: string;
  name: string;
  number: number;
  position: string;
  photoUrl: string;
  isGuest?: boolean;
}

interface StarterItem {
  id: string;
  playerId: string;
  x: number;
  y: number;
  pitchPosition?: string;
  positionName?: string;
  player: PlayerInfo;
}

interface BenchItem {
  id: string;
  playerId: string;
  player: PlayerInfo;
}

interface QuickLineupEditorProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
  initialFormation: string;
  initialLineups: Array<{
    id: string;
    isStarter: boolean;
    x?: number | null;
    y?: number | null;
    pitchPosition?: string;
    positionName?: string;
    player: PlayerInfo;
  }>;
  attendances?: Array<{
    id: string;
    playerId: string;
    status: string;
    player?: PlayerInfo;
  }>;
  pin: string;
  onSaved?: (newLineups: any[], newFormation: string) => void;
}

export default function QuickLineupEditor({
  isOpen,
  onClose,
  matchId,
  initialFormation,
  initialLineups,
  attendances = [],
  pin,
  onSaved,
}: QuickLineupEditorProps) {
  const router = useRouter();
  const [formation, setFormation] = useState(initialFormation || '4-3-3');
  const [starters, setStarters] = useState<StarterItem[]>([]);
  const [bench, setBench] = useState<BenchItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Drag state
  const [draggingPlayer, setDraggingPlayer] = useState<{
    player: PlayerInfo;
    source: 'pitch' | 'bench';
    sourceStarterId?: string;
    currentX: number;
    currentY: number;
  } | null>(null);

  const pitchRef = useRef<HTMLDivElement>(null);
  const benchRef = useRef<HTMLDivElement>(null);

  // Initialize rosters when opened
  useEffect(() => {
    if (!isOpen) return;

    setFormation(initialFormation || '4-3-3');
    setErrorMessage('');
    setSaveSuccess(false);

    // Initial Starters
    const initStarters: StarterItem[] = [];
    const initBench: BenchItem[] = [];
    const addedPlayerIds = new Set<string>();

    // 1. Process starters first
    for (const l of initialLineups || []) {
      const pId = l.player?.id || (l as any).playerId;
      if (!pId || !l.isStarter || addedPlayerIds.has(pId)) continue;
      initStarters.push({
        id: l.id || `starter-${pId}`,
        playerId: pId,
        x: l.x != null && !isNaN(Number(l.x)) ? Number(l.x) : 50,
        y: l.y != null && !isNaN(Number(l.y)) ? Number(l.y) : 50,
        pitchPosition: l.pitchPosition || 'PITCH',
        positionName: l.positionName || 'Starter',
        player: l.player,
      });
      addedPlayerIds.add(pId);
    }

    // 2. Process bench lineups (hanya jika BELUM ada di starters)
    for (const l of initialLineups || []) {
      const pId = l.player?.id || (l as any).playerId;
      if (!pId || l.isStarter || addedPlayerIds.has(pId)) continue;
      initBench.push({
        id: l.id || `bench-${pId}`,
        playerId: pId,
        player: l.player,
      });
      addedPlayerIds.add(pId);
    }

    // 3. Add confirmed attendances not yet in lineup (hanya jika BELUM ada di starters maupun bench)
    for (const att of attendances || []) {
      const pId = att.player?.id || att.playerId;
      if (!pId || addedPlayerIds.has(pId)) continue;
      if (att.status === 'CONFIRMED') {
        initBench.push({
          id: `att-${pId}`,
          playerId: pId,
          player: (att.player as any) || {
            id: pId,
            name: (att as any).playerName || 'Pemain',
            number: 0,
            position: '',
            photoUrl: '',
          },
        });
        addedPlayerIds.add(pId);
      }
    }

    setStarters(initStarters);
    setBench(initBench);
  }, [isOpen, initialLineups, initialFormation, attendances]);

  // Lock whole page scroll & prevent mobile auto-zoom (terkunci 1 layar)
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    const origTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    let metaViewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    const origViewport = metaViewport?.content;
    if (metaViewport) {
      metaViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    return () => {
      document.body.style.overflow = origOverflow;
      document.body.style.touchAction = origTouchAction;
      if (metaViewport && origViewport) {
        metaViewport.content = origViewport;
      }
    };
  }, [isOpen]);

  // Global Pointer Listeners for silky-smooth drag without scroll
  useEffect(() => {
    if (!draggingPlayer) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      setDraggingPlayer((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
            }
          : null
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      const currentDrag = draggingPlayer;
      if (!currentDrag) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      const pitchRect = pitchRef.current?.getBoundingClientRect();
      const benchRect = benchRef.current?.getBoundingClientRect();

      // Check if dropped inside pitch
      if (
        pitchRect &&
        clientX >= pitchRect.left &&
        clientX <= pitchRect.right &&
        clientY >= pitchRect.top &&
        clientY <= pitchRect.bottom
      ) {
        const pctX = Math.round(
          Math.max(6, Math.min(94, ((clientX - pitchRect.left) / pitchRect.width) * 100))
        );
        const pctY = Math.round(
          Math.max(8, Math.min(92, ((clientY - pitchRect.top) / pitchRect.height) * 100))
        );

        // Check if dropped directly on an existing starter (distance < 9%)
        const nearbyStarterIdx = starters.findIndex((s) => {
          if (currentDrag.source === 'pitch' && s.playerId === currentDrag.player.id) {
            return false;
          }
          const dx = s.x - pctX;
          const dy = s.y - pctY;
          return Math.sqrt(dx * dx + dy * dy) < 9;
        });

        if (currentDrag.source === 'pitch') {
          if (nearbyStarterIdx !== -1) {
            // Swap positions of the two starters
            setStarters((prev) => {
              const clone = [...prev];
              const sourceIdx = clone.findIndex((s) => s.playerId === currentDrag.player.id);
              if (sourceIdx !== -1) {
                const tempX = clone[sourceIdx].x;
                const tempY = clone[sourceIdx].y;
                clone[sourceIdx].x = clone[nearbyStarterIdx].x;
                clone[sourceIdx].y = clone[nearbyStarterIdx].y;
                clone[nearbyStarterIdx].x = tempX;
                clone[nearbyStarterIdx].y = tempY;
              }
              return clone;
            });
          } else {
            // Update position of starter
            setStarters((prev) =>
              prev.map((s) =>
                s.playerId === currentDrag.player.id ? { ...s, x: pctX, y: pctY } : s
              )
            );
          }
        } else {
          // Source is BENCH
          if (nearbyStarterIdx !== -1) {
            // Swap bench player with that starter
            const replacedStarter = starters[nearbyStarterIdx];
            setStarters((prev) => {
              const clone = [...prev];
              clone[nearbyStarterIdx] = {
                id: `starter-${currentDrag.player.id}`,
                playerId: currentDrag.player.id,
                x: replacedStarter.x,
                y: replacedStarter.y,
                pitchPosition: replacedStarter.pitchPosition || 'PITCH',
                positionName: replacedStarter.positionName || 'Starter',
                player: currentDrag.player,
              };
              return clone;
            });
            setBench((prev) => [
              ...prev.filter((b) => b.playerId !== currentDrag.player.id),
              {
                id: `bench-${replacedStarter.player.id}`,
                playerId: replacedStarter.player.id,
                player: replacedStarter.player,
              },
            ]);
          } else {
            // Add bench player to pitch
            if (starters.length < 11) {
              setStarters((prev) => [
                ...prev,
                {
                  id: `starter-${currentDrag.player.id}`,
                  playerId: currentDrag.player.id,
                  x: pctX,
                  y: pctY,
                  pitchPosition: 'PITCH',
                  positionName: 'Starter',
                  player: currentDrag.player,
                },
              ]);
              setBench((prev) => prev.filter((b) => b.playerId !== currentDrag.player.id));
            } else {
              // Pitch is full (11 starters) -> replace the closest starter
              let closestIdx = 0;
              let minDistance = Infinity;
              starters.forEach((s, idx) => {
                const dx = s.x - pctX;
                const dy = s.y - pctY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestIdx = idx;
                }
              });

              const replaced = starters[closestIdx];
              setStarters((prev) => {
                const clone = [...prev];
                clone[closestIdx] = {
                  id: `starter-${currentDrag.player.id}`,
                  playerId: currentDrag.player.id,
                  x: pctX,
                  y: pctY,
                  pitchPosition: replaced.pitchPosition || 'PITCH',
                  positionName: replaced.positionName || 'Starter',
                  player: currentDrag.player,
                };
                return clone;
              });
              setBench((prev) => [
                ...prev.filter((b) => b.playerId !== currentDrag.player.id),
                {
                  id: `bench-${replaced.player.id}`,
                  playerId: replaced.player.id,
                  player: replaced.player,
                },
              ]);
            }
          }
        }
      } else if (
        benchRect &&
        clientX >= benchRect.left &&
        clientX <= benchRect.right &&
        clientY >= benchRect.top &&
        clientY <= benchRect.bottom
      ) {
        // Dropped inside bench area
        if (currentDrag.source === 'pitch') {
          // Remove from starters and add to bench
          setStarters((prev) => prev.filter((s) => s.playerId !== currentDrag.player.id));
          setBench((prev) => [
            ...prev.filter((b) => b.playerId !== currentDrag.player.id),
            {
              id: `bench-${currentDrag.player.id}`,
              playerId: currentDrag.player.id,
              player: currentDrag.player,
            },
          ]);
        }
      } else {
        // Dropped outside pitch downwards: if from pitch, treat as bench
        if (pitchRect && clientY > pitchRect.bottom && currentDrag.source === 'pitch') {
          setStarters((prev) => prev.filter((s) => s.playerId !== currentDrag.player.id));
          setBench((prev) => [
            ...prev.filter((b) => b.playerId !== currentDrag.player.id),
            {
              id: `bench-${currentDrag.player.id}`,
              playerId: currentDrag.player.id,
              player: currentDrag.player,
            },
          ]);
        }
      }

      setDraggingPlayer(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [draggingPlayer, starters]);

  // Start drag handler (instant touch response, no delay)
  const handleStartDrag = (
    e: React.PointerEvent,
    player: PlayerInfo,
    source: 'pitch' | 'bench',
    sourceStarterId?: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDraggingPlayer({
      player,
      source,
      sourceStarterId,
      currentX: e.clientX,
      currentY: e.clientY,
    });
  };

  // Find lowest player (auto-detected Goalkeeper)
  let maxTopY = -Infinity;
  let detectedGkPlayerId: string | null = null;
  for (const s of starters) {
    if (s.y > maxTopY) {
      maxTopY = s.y;
      detectedGkPlayerId = s.player.id;
    }
  }

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    setErrorMessage('');

    try {
      const starterIdSet = new Set(starters.map((s) => s.playerId));
      const cleanBench = bench.filter((b) => !starterIdSet.has(b.playerId));

      const newLineups = [
        ...starters.map((s) => ({
          playerId: s.playerId,
          isStarter: true,
          x: s.x,
          y: s.y,
          pitchPosition: s.pitchPosition || 'PITCH',
          positionName: s.positionName || 'Starter',
        })),
        ...cleanBench.map((b) => ({
          playerId: b.playerId,
          isStarter: false,
          pitchPosition: 'SUB',
          positionName: 'Cadangan',
        })),
      ];

      const res = await fetch(`/api/matches/${matchId}/lineup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineups: newLineups,
          formation: formation.trim() || '4-3-3',
          pin,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan posisi formasi');
      }

      setSaveSuccess(true);
      if (onSaved) {
        onSaved(newLineups, formation.trim() || '4-3-3');
      }
      setTimeout(() => {
        router.refresh();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden select-none text-white overscroll-none touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* ═══ TOP BAR (HEADER) ═══ */}
      <div className="shrink-0 h-14 bg-slate-900 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between gap-2 z-20">
        {/* Left: Input Angka Formasi */}
        <div className="flex items-center gap-1.5 bg-slate-850 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700/80">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400">Formasi:</span>
          <input
            type="text"
            value={formation}
            onChange={(e) => setFormation(e.target.value)}
            onBlur={() => {
              if (typeof window !== 'undefined') {
                window.scrollTo(0, 0);
              }
            }}
            placeholder="4-3-3"
            className="w-16 sm:w-20 bg-slate-900 text-center text-[16px] sm:text-sm font-mono font-black text-blue-400 border border-slate-700 rounded px-1 py-0.5 outline-none focus:border-blue-500 uppercase"
            title="Ubah format formasi (misal: 4-3-3, 2-3-2)"
          />
        </div>

        {/* Center: Starter Count */}
        <div
          className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase font-mono border transition-all ${
            starters.length === 11
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-xs'
              : 'bg-blue-950/80 border-blue-500 text-blue-400'
          }`}
        >
          {starters.length}/11 Lapangan
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveSuccess}
            className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : null}
            <span>{saveSuccess ? 'Tersimpan' : 'Simpan'}</span>
          </button>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="bg-red-950/90 border-b border-red-800 px-3 py-1.5 text-center text-xs font-bold text-red-300">
          {errorMessage}
        </div>
      )}

      {/* ═══ MIDDLE: TACTICAL PITCH AREA (UKURAN SAMA DI SEMUA DEVICE: 340px x 417px) ═══ */}
      <div className="shrink-0 flex items-center justify-center p-2 relative select-none">
        {/* Tactical Pitch Board - Ukuran Lapangan Konsisten di Semua Device */}
        <div
          ref={pitchRef}
          className="relative w-[340px] h-[417px] max-w-[calc(100vw-16px)] rounded-2xl overflow-hidden border border-emerald-600/40 shadow-2xl bg-emerald-950/60 flex items-center justify-center select-none"
          style={{
            touchAction: 'none',
          }}
        >
          {/* Pitch Lines Background */}
          <img
            src="/pitch.webp"
            alt="Pitch"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-40 mix-blend-screen"
          />

          {/* Empty pitch hint if no starters */}
          {starters.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 text-center">
              <span className="text-xs text-emerald-400/80 font-bold bg-slate-900/80 px-3 py-1.5 rounded-full border border-emerald-500/30">
                Tarik pemain dari cadangan ke lapangan
              </span>
            </div>
          )}

          {/* Starter Player Tokens on Pitch */}
          {starters.map((item) => {
            const isGk = item.player.id === detectedGkPlayerId;
            const isBeingDragged =
              draggingPlayer?.source === 'pitch' &&
              draggingPlayer?.player.id === item.player.id;

            return (
              <div
                key={item.playerId}
                onPointerDown={(e) => handleStartDrag(e, item.player, 'pitch', item.id)}
                className={`absolute flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-transform ${
                  isBeingDragged ? 'opacity-30 scale-95' : 'hover:scale-110 active:scale-105'
                }`}
                style={{
                  top: `${item.y}%`,
                  left: `${item.x}%`,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none',
                }}
              >
                {/* Token Circle */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-mono font-black text-xs sm:text-sm flex items-center justify-center shadow-lg ring-2 ring-black/50">
                  {item.player.number}
                </div>

                {/* Player Name Pill - GELAP */}
                <div className="mt-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-300 text-[9px] sm:text-[10px] font-black text-slate-900 flex items-center gap-1 shadow-md whitespace-nowrap max-w-[85px] sm:max-w-[100px] truncate">
                  <span className="truncate text-slate-900 font-black">{item.player.name.split(' ')[0]}</span>
                  {isGk && (
                    <img
                      src="/gk_gloves.png"
                      alt="GK"
                      className="w-3.5 h-3.5 object-contain inline-block shrink-0"
                      title="Kiper"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ BOTTOM: BENCH / CADANGAN AREA (MENYESUAIKAN SISA TINGGI DEVICE) ═══ */}
      <div
        ref={benchRef}
        className="flex-1 min-h-0 bg-slate-900/95 border-t border-slate-800 p-2.5 sm:p-3 flex flex-col z-20 overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Header Cadangan */}
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] sm:text-xs font-black uppercase text-slate-300 tracking-wider">
              Cadangan ({bench.length})
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Geser pemain langsung ke lapang
          </span>
        </div>

        {/* Bench Players Adaptive Grid / Scroll Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto flex flex-wrap content-start items-center gap-2 pb-1 scrollbar-thin">
          {bench.length === 0 ? (
            <div className="w-full text-center text-xs text-slate-500 font-bold py-2">
              Tidak ada pemain di cadangan. Geser pemain dari lapang ke sini untuk mencadangkan.
            </div>
          ) : (
            bench.map((b) => {
              const isBeingDragged =
                draggingPlayer?.source === 'bench' &&
                draggingPlayer?.player.id === b.player.id;

              return (
                <div
                  key={b.playerId}
                  onPointerDown={(e) => handleStartDrag(e, b.player, 'bench')}
                  className={`shrink-0 flex items-center gap-2 bg-slate-100 hover:bg-white active:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-300 cursor-grab active:cursor-grabbing transition-all ${
                    isBeingDragged ? 'opacity-30 scale-95' : 'hover:scale-102 shadow-xs'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  <span className="w-5 text-center text-xs font-black text-blue-600 font-mono">
                    {b.player.number}
                  </span>
                  <div className="flex flex-col min-w-0 max-w-[80px]">
                    <span className="text-xs font-black text-slate-900 truncate">
                      {b.player.name.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold uppercase truncate">
                      {b.player.position || 'Cadangan'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ FLOATING GHOST ELEMENT WHEN DRAGGING ═══ */}
      {draggingPlayer && (
        <div
          className="fixed pointer-events-none z-50 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-2xl"
          style={{
            left: `${draggingPlayer.currentX}px`,
            top: `${draggingPlayer.currentY}px`,
          }}
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-mono font-black text-sm flex items-center justify-center border-2 border-white shadow-2xl ring-4 ring-blue-500/40">
            {draggingPlayer.player.number}
          </div>
          <div className="mt-1 px-2 py-0.5 rounded-md bg-white text-slate-900 text-[10px] font-black border border-slate-300 shadow-2xl whitespace-nowrap">
            {draggingPlayer.player.name.split(' ')[0]}
          </div>
        </div>
      )}
    </div>
  );
}
