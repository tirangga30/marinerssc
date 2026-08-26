'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type ClubMode = 'main' | 'community';

interface ClubModeContextType {
  clubMode: ClubMode;
  setClubMode: (mode: ClubMode) => void;
}

const ClubModeContext = createContext<ClubModeContextType>({
  clubMode: 'main',
  setClubMode: () => {},
});

export function ClubModeProvider({ children }: { children: React.ReactNode }) {
  const [clubMode, setClubModeState] = useState<ClubMode>('main');
  const pathname = usePathname();

  // Initialize from localStorage or URL pathname
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (pathname.startsWith('/community')) {
        setClubModeState('community');
        localStorage.setItem('mariners_club_mode', 'community');
      } else if (
        pathname.startsWith('/players') ||
        pathname.startsWith('/matches') ||
        pathname.startsWith('/stats') ||
        pathname.startsWith('/articles')
      ) {
        setClubModeState('main');
        localStorage.setItem('mariners_club_mode', 'main');
      } else {
        const saved = localStorage.getItem('mariners_club_mode');
        if (saved === 'community' || saved === 'main') {
          setClubModeState(saved);
        }
      }
    }
  }, [pathname]);

  const setClubMode = (mode: ClubMode) => {
    setClubModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mariners_club_mode', mode);
    }
  };

  return (
    <ClubModeContext.Provider value={{ clubMode, setClubMode }}>
      {children}
    </ClubModeContext.Provider>
  );
}

export function useClubMode() {
  return useContext(ClubModeContext);
}
