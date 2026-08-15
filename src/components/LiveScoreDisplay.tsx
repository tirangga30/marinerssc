'use client';

import React, { useState, useEffect } from 'react';

interface LiveScoreDisplayProps {
  targetDate: string | Date;
  duration?: number;
  homeScore: number;
  awayScore: number;
  isLiveEnabled?: boolean;
  events?: Array<{ type: string; minute: number; createdAt?: string | Date }>;
  status?: string;
}

export default function LiveScoreDisplay({
  targetDate,
  duration = 60,
  homeScore,
  awayScore,
  isLiveEnabled = true,
  events = [],
  status,
}: LiveScoreDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [timeState, setTimeState] = useState<{
    babak: string;
    timeString: string;
  }>({ babak: 'BABAK 1', timeString: '00:00' });

  useEffect(() => {
    setMounted(true);
  }, []);

  const eventsKey = JSON.stringify(events || []);

  useEffect(() => {
    const parsedEvents: Array<{ type: string; minute: number; createdAt?: string | Date }> = eventsKey ? JSON.parse(eventsKey) : [];

    const updateTime = () => {
      const ft = parsedEvents.find((e) => e.type === 'fulltime');
      const ht = parsedEvents.find((e) => e.type === 'halftime');
      const k2 = parsedEvents.find((e) => e.type === 'kickoff_2');

      if (ft || status === 'finished') {
        setTimeState({ babak: 'FULL TIME', timeString: 'FULLTIME' });
        return;
      }

      if (ht && !k2) {
        setTimeState({ babak: 'HALFTIME', timeString: 'HALFTIME' });
        return;
      }

      const start = new Date(targetDate).getTime();
      const now = new Date().getTime();

      let totalSec = 0;
      let babakLabel = 'BABAK 1';

      if (k2) {
        babakLabel = 'BABAK 2';
        const k2Time = k2.createdAt ? new Date(k2.createdAt).getTime() : now;
        const elapsedSec = Math.max(0, Math.floor((now - k2Time) / 1000));
        const halfDur = Math.floor((duration || 60) / 2);
        const k2BaseSec = ((k2.minute || (halfDur + 1)) - 1) * 60;
        totalSec = k2BaseSec + elapsedSec;
      } else {
        babakLabel = 'BABAK 1';
        totalSec = Math.max(0, Math.floor((now - start) / 1000));
      }

      const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
      const secs = String(totalSec % 60).padStart(2, '0');

      setTimeState({
        babak: babakLabel,
        timeString: `${mins}:${secs}`,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, duration, eventsKey, status]);

  if (!mounted) {
    return (
      <div className="space-y-1">
        <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-widest">BABAK 1</p>
        {isLiveEnabled ? (
          <>
            <div className="text-xl sm:text-5xl font-black font-mono text-red-400 tracking-widest animate-pulse">
              {homeScore} : {awayScore}
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-widest font-mono">00:00</p>
          </>
        ) : (
          <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/80 text-slate-300 font-black text-xs sm:text-2xl border border-slate-700/60">
            VS
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium uppercase tracking-widest">{timeState.babak}</p>
      {isLiveEnabled ? (
        <>
          <div className="text-xl sm:text-5xl font-black font-mono text-red-400 tracking-widest animate-pulse">
            {homeScore} : {awayScore}
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-red-400 uppercase tracking-widest font-mono">{timeState.timeString}</p>
        </>
      ) : (
        <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-800/80 text-slate-300 font-black text-xs sm:text-2xl border border-slate-700/60">
          VS
        </div>
      )}
    </div>
  );
}
