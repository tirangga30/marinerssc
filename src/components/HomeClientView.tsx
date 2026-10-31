'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar, ArrowRight, Flame, Sparkles, Shield, Users,
  Trophy, Award, Activity, MapPin, CheckCircle2, UserCheck, Star, ChevronDown, ExternalLink,
  TrendingUp, Minus, XCircle, ShieldAlert
} from 'lucide-react';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { getMainThumbnail } from '@/lib/articles';
import CommunityRegistrationModal from '@/components/CommunityRegistrationModal';
import CommunityLoginModal from '@/components/CommunityLoginModal';
import { useClubMode } from '@/context/ClubModeContext';
import { useSystemSetting } from '@/context/SystemSettingContext';
import { getClientPublicSeason, setClientPublicSeason } from '@/lib/publicSeason';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';

const normalizePos = (pos: string) => {
  const p = pos?.toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GOALKEEPER';
  if (p === 'DF' || p === 'DEFENDER') return 'DEFENDER';
  if (p === 'MF' || p === 'MIDFIELDER') return 'MIDFIELDER';
  if (p === 'FW' || p === 'FORWARD') return 'FORWARD';
  return p || 'FORWARD';
};

function formatBoxDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  if (fullName.length <= 18) return fullName;
  if (parts.length >= 2) {
    const firstTwo = `${parts[0]} ${parts[1]}`;
    if (firstTwo.length <= 18) return firstTwo;
  }
  return parts[0];
}

interface HomeClientViewProps {
  mainSquadData: {
    nextMatch: any;
    featuredStatus: string;
    finishedMatches: any[];
    winRate: number;
    totalFinished: number;
    wins: number;
    draws: number;
    losses: number;
    totalGoals: number;
    concededGoals: number;
    featuredPlayers: any[];
    articles: any[];
    seasons?: any[];
    allMatches?: any[];
    allPlayers?: any[];
    defaultSelectedSeason?: string;
  };
  communityData: {
    nextFunMatch: any;
    recentFunMatches: any[];
    communityMembers: any[];
    totalMembers: number;
    totalFunMatches: number;
    totalCommunityGoals: number;
    topScorerName: string;
    topScorerGoals: number;
  };
  heroPosters?: any[];
  systemSetting?: any;
}

export default function HomeClientView({ mainSquadData, communityData, heroPosters, systemSetting }: HomeClientViewProps) {
  const { clubMode, setClubMode } = useClubMode();
  const {
    teamName: liveTeamName,
    teamLogo: liveTeamLogo,
    isCommunityEnabled: liveCommunityEnabled,
    playerCardBg: livePlayerCardBg,
    showHeroOverlay: liveShowHeroOverlay,
    heroTagline: liveHeroTagline,
    heroSubtitle: liveHeroSubtitle,
    heroCtaText: liveHeroCtaText,
    clubType: liveClubType,
    playerDefaultPhoto: livePlayerDefaultPhoto,
  } = useSystemSetting();

  const currentTeamName = liveTeamName || systemSetting?.teamName || 'TEAM';
  const currentTeamLogo = liveTeamLogo || systemSetting?.teamLogo || '/defaultteam.webp';
  const playerCardBg = livePlayerCardBg || systemSetting?.playerCardBg || '/bgprofil2.webp';
  const clubType = liveClubType || systemSetting?.clubType || 'SOCCER CLUB';
  const playerDefaultPhoto = livePlayerDefaultPhoto || systemSetting?.playerDefaultPhoto || '/playertemplate.webp';
  const isCommunityEnabled = liveCommunityEnabled !== undefined
    ? liveCommunityEnabled
    : (systemSetting?.isCommunityEnabled !== undefined ? Boolean(systemSetting.isCommunityEnabled) : true);
  const showHeroOverlay = liveShowHeroOverlay !== undefined
    ? liveShowHeroOverlay
    : (systemSetting?.showHeroOverlay !== undefined ? Boolean(systemSetting.showHeroOverlay) : false);
  const heroTagline = liveHeroTagline || systemSetting?.heroTagline || clubType || 'SOCCER CLUB';
  const heroSubtitle = liveHeroSubtitle || systemSetting?.heroSubtitle || 'Lebih dari sekadar sepak bola.';
  const heroCtaText = liveHeroCtaText || systemSetting?.heroCtaText || 'LIHAT TIM';

  React.useEffect(() => {
    if (!isCommunityEnabled && clubMode === 'community') {
      setClubMode('main');
    }
  }, [isCommunityEnabled, clubMode, setClubMode]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const seasons = mainSquadData.seasons && mainSquadData.seasons.length > 0
    ? mainSquadData.seasons
    : [{ id: '2026', name: '2026', year: 2026, isCurrent: true }];
  const allMatches = mainSquadData.allMatches || [];
  const allPlayers = mainSquadData.allPlayers || mainSquadData.featuredPlayers || [];

  const defaultActiveSeason =
    seasons.find((s: any) => Boolean(s.isCurrent))?.name ||
    seasons[0]?.name ||
    '2026';

  const initialSeason =
    (mainSquadData.defaultSelectedSeason && seasons.some((s: any) => s.name === mainSquadData.defaultSelectedSeason)
      ? mainSquadData.defaultSelectedSeason
      : null) ||
    defaultActiveSeason;
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  // Live Posters state with real-time sync
  const [livePosters, setLivePosters] = useState<any[]>(heroPosters || []);

  React.useEffect(() => {
    if (heroPosters && heroPosters.length > 0) {
      setLivePosters(heroPosters);
    }
  }, [heroPosters]);

  React.useEffect(() => {
    const fetchLivePosters = async () => {
      try {
        const res = await fetch('/api/admin/posters', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.posters && Array.isArray(data.posters)) {
            const active = data.posters.filter((p: any) => p.isActive && p.imageUrl);
            if (active.length > 0) {
              setLivePosters(active);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live posters:', err);
      }
    };

    fetchLivePosters();
    window.addEventListener('posters_updated', fetchLivePosters);
    window.addEventListener('system_settings_updated', fetchLivePosters);
    return () => {
      window.removeEventListener('posters_updated', fetchLivePosters);
      window.removeEventListener('system_settings_updated', fetchLivePosters);
    };
  }, []);

  // Active Hero Posters with automatic rotation
  const activePosters = React.useMemo(() => {
    if (livePosters && livePosters.length > 0) {
      return livePosters;
    }
    return [{ id: 'default', imageUrl: '/NYCOMP.webp' }];
  }, [livePosters]);

  const [currentPosterIndex, setCurrentPosterIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = React.useRef(0);
  const touchStartY = React.useRef(0);
  const isSwiping = React.useRef(false);
  const hasSwiped = React.useRef(false);

  React.useEffect(() => {
    if (activePosters.length <= 1) return;
    const intervalSec = Math.max(3, Math.min(10, Number(systemSetting?.posterInterval) || 5));
    const interval = setInterval(() => {
      setCurrentPosterIndex((prev) => (prev + 1) % activePosters.length);
    }, intervalSec * 1000);
    return () => clearInterval(interval);
  }, [activePosters.length, systemSetting?.posterInterval, currentPosterIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activePosters.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = true;
    hasSwiped.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping.current || activePosters.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = currentY - touchStartY.current;

    // Track horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > 8) {
        hasSwiped.current = true;
      }
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    setIsDragging(false);

    const threshold = 40;
    if (dragOffset < -threshold) {
      // Swiped left -> next poster
      setCurrentPosterIndex((prev) => (prev + 1) % activePosters.length);
    } else if (dragOffset > threshold) {
      // Swiped right -> previous poster
      setCurrentPosterIndex((prev) => (prev - 1 + activePosters.length) % activePosters.length);
    }
    setDragOffset(0);

    setTimeout(() => {
      hasSwiped.current = false;
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activePosters.length <= 1) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    isSwiping.current = true;
    hasSwiped.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSwiping.current || activePosters.length <= 1) return;
    const deltaX = e.clientX - touchStartX.current;
    if (Math.abs(deltaX) > 8) {
      hasSwiped.current = true;
    }
    setDragOffset(deltaX);
  };

  const handleMouseUp = () => {
    handleTouchEnd();
  };

  const handleMouseLeave = () => {
    if (isSwiping.current) {
      handleTouchEnd();
    }
  };

  const handlePosterClick = (poster: any) => {
    if (hasSwiped.current || Math.abs(dragOffset) > 8) return;
    const rawLink = poster?.linkUrl?.trim();
    if (!rawLink) return;
    const isExternal = rawLink.startsWith('http://') || rawLink.startsWith('https://');
    if (isExternal) {
      window.open(rawLink, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = rawLink;
    }
  };

  const getSlideStyle = (idx: number) => {
    if (activePosters.length <= 1) {
      return { transform: 'translateX(0%)' };
    }
    const total = activePosters.length;
    let diff = idx - currentPosterIndex;
    if (total > 2) {
      while (diff < -Math.floor(total / 2)) diff += total;
      while (diff > Math.floor((total - 1) / 2)) diff -= total;
    }
    const isCurrent = idx === currentPosterIndex;
    return {
      transform: `translateX(calc(${diff * 100}% + ${dragOffset}px))`,
      transition: isDragging ? 'none' : 'transform 450ms cubic-bezier(0.25, 1, 0.5, 1)',
      zIndex: isCurrent ? 10 : 5,
    };
  };

  React.useEffect(() => {
    const saved = getClientPublicSeason();
    if (saved && seasons.some((s: any) => s.name === saved)) {
      setSelectedSeason(saved);
    } else {
      const active = seasons.find((s: any) => Boolean(s.isCurrent))?.name;
      if (active) setSelectedSeason(active);
    }
    const handleSeasonChange = (e: any) => {
      if (e.detail?.season) {
        setSelectedSeason(e.detail.season);
      }
    };
    window.addEventListener('public_season_changed', handleSeasonChange);
    return () => window.removeEventListener('public_season_changed', handleSeasonChange);
  }, [seasons]);

  // Dynamic calculations for selectedSeason
  const seasonMatches = allMatches.filter((m: any) => (m.seasonName || '2026') === selectedSeason);

  const liveMatch = seasonMatches.find((m: any) => m.computedStatus === 'live');
  const upcomingMatch = seasonMatches
    .filter((m: any) => m.computedStatus === 'scheduled')
    .sort((a: any, b: any) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];
  const lastFinishedMatch = seasonMatches
    .filter((m: any) => m.computedStatus === 'finished' || m.computedStatus === 'score_pending')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0];

  // Strictly use match belonging to the selected season only - never fallback to another season's match
  const currentNextMatch = liveMatch || upcomingMatch || lastFinishedMatch || seasonMatches[0] || null;
  const currentFeaturedStatus = currentNextMatch ? (currentNextMatch.computedStatus || 'scheduled') : 'scheduled';

  const currentFinishedMatches = seasonMatches
    .filter((m: any) => m.computedStatus === 'finished')
    .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());

  let currentWins = 0;
  let currentDraws = 0;
  let currentLosses = 0;
  let currentTotalGoals = 0;
  let currentConcededGoals = 0;

  currentFinishedMatches.forEach((m: any) => {
    const marinersScore = m.isHome ? m.homeScore : m.awayScore;
    const opponentScore = m.isHome ? m.awayScore : m.homeScore;
    if (marinersScore !== null && opponentScore !== null) {
      currentTotalGoals += marinersScore;
      currentConcededGoals += opponentScore;
      if (marinersScore > opponentScore) currentWins++;
      else if (marinersScore === opponentScore) currentDraws++;
      else currentLosses++;
    }
  });

  const currentTotalFinished = currentFinishedMatches.length;
  const currentWinRate = currentTotalFinished > 0 ? Math.round((currentWins / currentTotalFinished) * 100) : 0;

  // Filter squad players for selectedSeason
  const seasonPlayers = allPlayers
    .filter((p: any) => Array.isArray(p.seasons) && p.seasons.some((s: any) => s.name === selectedSeason || s.id === selectedSeason))
    .map((p: any) => resolvePlayerForSeason(p, selectedSeason));

  const currentSeasonObj = seasons.find((s: any) => s.name === selectedSeason || s.id === selectedSeason);
  const rawFeaturedIds = currentSeasonObj?.featuredPlayerIds;
  const featuredIds: string[] = Array.isArray(rawFeaturedIds)
    ? rawFeaturedIds
    : (typeof rawFeaturedIds === 'string' ? (() => { try { return JSON.parse(rawFeaturedIds); } catch { return []; } })() : []);

  let currentFeaturedPlayers = seasonPlayers.filter((p: any) => featuredIds.includes(p.id));
  if (currentFeaturedPlayers.length === 0) {
    currentFeaturedPlayers = seasonPlayers.filter((p: any) => p.isFeatured);
  }
  if (currentFeaturedPlayers.length === 0) {
    currentFeaturedPlayers = seasonPlayers.slice(0, 6);
  } else {
    currentFeaturedPlayers = currentFeaturedPlayers.slice(0, 6);
  }

  // Calculate Top Performers for selectedSeason
  const performancePlayers = React.useMemo(() => {
    return seasonPlayers
      .map((player: any) => {
        let goals = player.goals || 0;
        let assists = player.assists || 0;
        let appearances = player.appearances || 0;
        let yellowCards = player.yellowCards || 0;
        let redCards = player.redCards || 0;

        // If detailed events/lineups are available, calculate specifically for selectedSeason
        if (Array.isArray(player.events) || Array.isArray(player.lineups)) {
          const seasonLineups = (player.lineups || []).filter((l: any) => {
            if (!l.match || l.match.status !== 'finished') return false;
            if (l.match.seasonName && l.match.seasonName !== selectedSeason) return false;
            if (l.isStarter) return true;
            const matchEvents = l.match.events || [];
            return matchEvents.some((e: any) => e.type === 'sub' && e.playerId === player.id);
          });

          const seasonGoalEvents = (player.events || []).filter((e: any) => {
            if (e.type !== 'goal' && e.type !== 'penalty') return false;
            if (e.match?.status && e.match.status !== 'finished') return false;
            if (e.match?.seasonName && e.match.seasonName !== selectedSeason) return false;
            return true;
          });

          const seasonDirectAssistEvents = (player.events || []).filter((e: any) => {
            if (e.type !== 'assist') return false;
            if (e.match?.status && e.match.status !== 'finished') return false;
            if (e.match?.seasonName && e.match.seasonName !== selectedSeason) return false;
            return true;
          });

          const seasonAssistedCountEvents = (player.assistedEvents || []).filter((e: any) => {
            if (e.type === 'sub') return false;
            if (e.match?.status && e.match.status !== 'finished') return false;
            if (e.match?.seasonName && e.match.seasonName !== selectedSeason) return false;
            return true;
          });

          const seasonYellowEvents = (player.events || []).filter((e: any) => {
            if (e.type !== 'yellow_card') return false;
            if (e.match?.status && e.match.status !== 'finished') return false;
            if (e.match?.seasonName && e.match.seasonName !== selectedSeason) return false;
            return true;
          });

          const seasonRedEvents = (player.events || []).filter((e: any) => {
            if (e.type !== 'red_card' && e.type !== 'second_yellow') return false;
            if (e.match?.status && e.match.status !== 'finished') return false;
            if (e.match?.seasonName && e.match.seasonName !== selectedSeason) return false;
            return true;
          });

          if ((player.lineups && player.lineups.length > 0) || (player.events && player.events.length > 0)) {
            appearances = seasonLineups.length;
            goals = seasonGoalEvents.length;
            assists = seasonDirectAssistEvents.length + seasonAssistedCountEvents.length;
            yellowCards = seasonYellowEvents.length;
            redCards = seasonRedEvents.length;
          }
        }

        const points = (goals * 5) + (assists * 3) + (appearances * 1) - (yellowCards * 1) - (redCards * 3);
        return {
          ...player,
          goals,
          assists,
          appearances,
          yellowCards,
          redCards,
          points,
        };
      })
      .sort((a: any, b: any) => (b.points - a.points) || (b.goals - a.goals) || (b.assists - a.assists))
      .slice(0, 5);
  }, [seasonPlayers, selectedSeason]);

  const articles = mainSquadData.articles;

  const {
    nextFunMatch,
    recentFunMatches,
    communityMembers,
    totalMembers,
    totalFunMatches,
    totalCommunityGoals,
    topScorerName,
    topScorerGoals,
  } = communityData;

  return (
    <div className="space-y-8 sm:space-y-16 pb-12">

      {/* Global Alert Notification */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between gap-3 shadow-xl">
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          HERO SECTION (FULL GAMBAR POSTER 16:9, TANPA GRADASI PUTIH)
         ═════════════════════════════════════════════════════════════ */}
      <section
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950 border-b border-slate-200 select-none touch-pan-y cursor-grab active:cursor-grabbing group"
      >
        {/* Dynamic Carousel Slides (Full Gambar 16:9) */}
        {activePosters.map((poster: any, idx: number) => {
          const rawLink = poster.linkUrl?.trim();
          const hasLink = Boolean(rawLink);

          return (
            <div
              key={poster.id || idx}
              onClick={() => handlePosterClick(poster)}
              style={getSlideStyle(idx)}
              className={`absolute inset-0 ${hasLink ? 'cursor-pointer' : ''}`}
            >
              <img
                src={poster.imageUrl}
                alt={poster.title || "Hero Poster"}
                className="w-full h-full object-cover object-center select-none"
                draggable={false}
              />
            </div>
          );
        })}

        {/* Content Container (Hanya ditampilkan di Slide 1, Mulai Slide 2 dan seterusnya murni gambar aja) */}
        <div
          className={`relative z-20 max-w-7xl mx-auto px-3.5 sm:px-8 lg:px-12 w-full h-full flex flex-col justify-between py-2.5 sm:py-6 lg:py-10 transition-opacity duration-300 ${
            currentPosterIndex === 0 ? 'opacity-100 pointer-events-none' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top Row: Interactive Season Selector Dropdown */}
          <div className="flex items-center justify-between">
            {clubMode === 'main' && seasons && seasons.length > 0 ? (
              <div className={`relative inline-block z-30 ${currentPosterIndex === 0 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    if (currentPosterIndex !== 0) return;
                    e.stopPropagation();
                    setShowSeasonDropdown((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/95 hover:bg-white text-blue-700 border border-blue-300/80 shadow-md text-[9px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                  <span className="text-blue-700 font-black">Musim {selectedSeason}</span>
                  <ChevronDown
                    className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-blue-600 transition-transform duration-200 shrink-0 ${
                      showSeasonDropdown ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showSeasonDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-48 rounded-2xl bg-white border border-slate-200 shadow-2xl p-1.5 z-50 animate-fade-in text-left">
                    <div className="px-3 py-1.5 text-[9px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100">
                      Pilih Musim Tim Utama
                    </div>
                    <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                      {seasons.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setSelectedSeason(s.name);
                            setClientPublicSeason(s.name);
                            setShowSeasonDropdown(false);
                            window.location.reload();
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-between transition-colors cursor-pointer ${
                            selectedSeason === s.name
                              ? 'bg-blue-50 text-blue-600 border border-blue-200'
                              : 'text-slate-800 hover:text-blue-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>Musim {s.name}</span>
                          {s.isCurrent && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 font-black">
                              Aktif
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/95 border border-amber-300/80 text-amber-700 text-[9px] sm:text-xs font-black uppercase tracking-wider shadow-md">
                <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                <span className="text-amber-700 font-black">Soccer Community</span>
              </div>
            )}
          </div>

          {/* Center Left: Main Typography & Buttons (Controlled by showHeroOverlay, default NONAKTIF) */}
          {showHeroOverlay && (
            <div className="max-w-xs sm:max-w-xl space-y-0.5 sm:space-y-2 lg:space-y-3 my-auto pt-0.5 sm:pt-2">
              <p className="text-[7px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-slate-700 leading-none drop-shadow-xs">
                {heroTagline}
              </p>
              <h1 className="text-base sm:text-4xl lg:text-5xl xl:text-6xl font-black text-slate-900 tracking-tight leading-none drop-shadow-xs">
                {currentTeamName}
              </h1>
              <p className="text-[10px] sm:text-base lg:text-xl font-bold text-slate-900 leading-tight drop-shadow-xs">
                {heroSubtitle}
              </p>
              {isCommunityEnabled && (
                <p className="text-[8px] sm:text-sm text-slate-700 font-medium max-w-xs sm:max-w-md leading-relaxed line-clamp-1 sm:line-clamp-none drop-shadow-xs">
                  Join with us! Click COMMUNITY.
                </p>
              )}

              {/* Action Buttons: Lihat Tim -> and Community */}
              <div className={`flex flex-wrap items-center gap-1.5 sm:gap-3.5 pt-0.5 sm:pt-2 ${currentPosterIndex === 0 ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    if (currentPosterIndex !== 0) return;
                    e.stopPropagation();
                    setClubMode('main');
                    const el = document.getElementById('main-matches-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-6 py-1 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[9px] sm:text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer active:scale-95 ${
                    clubMode === 'main'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 scale-[1.02]'
                      : 'bg-blue-600/90 hover:bg-blue-600 text-white'
                  }`}
                >
                  <span>{heroCtaText}</span>
                  <ArrowRight className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                </button>

                {isCommunityEnabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      if (currentPosterIndex !== 0) return;
                      e.stopPropagation();
                      setClubMode('community');
                    }}
                    className={`inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-6 py-1 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[9px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                      clubMode === 'community'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/25 border border-transparent scale-[1.02]'
                        : 'bg-white hover:bg-slate-50 text-slate-800 hover:text-blue-600 border border-slate-300 shadow-xs'
                    }`}
                  >
                    <Users className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-blue-600" />
                    <span>Community</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom Row: Right Tagline Only (Slide Indicators diposisikan global) */}
          {showHeroOverlay && (
            <div className="flex items-end justify-end pt-0.5 sm:pt-2">
              {/* Motto on the right side */}
              <div className="hidden md:flex flex-col items-start gap-0.5 text-slate-900 select-none drop-shadow-sm">
                <span className="w-6 h-0.5 bg-blue-600 rounded-full mb-1" />
                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-tight">Satu Tim</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight">Satu Tujuan</span>
                <span className="text-xs sm:text-sm font-black text-blue-600 leading-tight">{currentTeamName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Global Carousel Slide Indicators on Bottom Left (Selalu Aktif di Semua Slide) */}
        {activePosters.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-4 left-3.5 sm:left-8 z-30 flex items-center gap-1 sm:gap-2 pointer-events-auto">
            {activePosters.map((_: any, idx: number) => {
              const isCurrent = idx === currentPosterIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentPosterIndex(idx);
                  }}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'w-4 sm:w-8 bg-blue-600 shadow-sm'
                      : 'w-2 sm:w-3.5 bg-white/70 hover:bg-white drop-shadow-xs'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: MARINERS SC (TIM UTAMA)
         ═════════════════════════════════════════════════════════════ */}
      {clubMode === 'main' && (
        <div className="space-y-8 sm:space-y-16 animate-fadeIn">

          {/* MATCH SCORECARD FEATURED */}
          <section id="main-matches-section" className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative z-20">
            <div className="mb-2.5 sm:mb-3.5 flex items-center gap-2">
              <span className="w-1.5 h-4 sm:h-5 rounded-full bg-blue-600 inline-block" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                {currentFeaturedStatus === 'live' ? 'LIVE' : currentFeaturedStatus === 'scheduled' ? 'UPCOMING' : 'LASTEST'}
              </h2>
            </div>
            <Link
              href={currentNextMatch ? `/matches/${currentNextMatch.id}` : '/matches'}
              className="relative block group overflow-hidden p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-blue-400/60 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
            >
              {/* Stadium Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                style={{ backgroundImage: `url('/stadium.webp')` }}
              />
              {/* Subtle light overlay to ensure flawless contrast */}
              <div className="absolute inset-0 bg-white/20 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-slate-400/80 pb-2 sm:pb-4 mb-3 sm:mb-6">
                  {currentFeaturedStatus === 'live' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-50/90 text-red-600 border border-red-200 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 backdrop-blur-xs">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> LIVE
                    </span>
                  ) : (
                    <h3 className="text-[10px] sm:text-sm uppercase tracking-widest transition-colors flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                        {currentNextMatch?.competition || 'FRIENDLY'}
                      </span>
                      <span className="font-bold text-slate-500">
                        {currentNextMatch?.seasonName || selectedSeason || '2026'}
                      </span>
                    </h3>
                  )}
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    {currentNextMatch && (
                      <span className="text-[9px] sm:text-xs font-medium text-slate-600">
                        {formatWibDate(currentNextMatch.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {currentNextMatch && (
                      <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-50/90 text-blue-600 border border-blue-200 backdrop-blur-xs">
                        {currentNextMatch?.stage || ((currentNextMatch?.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY' ? `Matchday ${currentNextMatch?.matchday || 1}` : (currentNextMatch?.competition || 'FRIENDLY'))}
                      </span>
                    )}
                  </span>
                </div>

                {currentNextMatch ? (
                  <>
                    <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">

                      {/* Home Team (Nama di sisi luar kiri, Logo di tengah mendekat ke skor) */}
                      <div className="flex items-center justify-end gap-1.5 sm:gap-3.5 min-w-0">
                        <div className="text-right min-w-0 flex-1">
                          <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors drop-shadow-xs truncate">
                            {(currentNextMatch.isHome ? currentTeamName : currentNextMatch.opponentName).toUpperCase()}
                          </h4>
                        </div>
                        <div className="shrink-0 flex items-center justify-center">
                          <img
                            src={currentNextMatch.isHome ? currentTeamLogo : (currentNextMatch.opponentLogo || '/defaultteam.webp')}
                            alt={currentNextMatch.isHome ? currentTeamName : currentNextMatch.opponentName}
                            className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>

                      {/* Score / VS Badge — Sejajar dengan Logo & Nama */}
                      <div className="flex flex-col items-center justify-center min-w-0 px-1 py-0.5">
                        {currentFeaturedStatus === 'live' ? (
                          <LiveScoreDisplay
                            targetDate={currentNextMatch.matchDate}
                            duration={currentNextMatch.duration}
                            homeScore={currentNextMatch.homeScore ?? 0}
                            awayScore={currentNextMatch.awayScore ?? 0}
                            isLiveEnabled={currentNextMatch.isLiveEnabled !== false}
                            events={currentNextMatch.events}
                            status={currentFeaturedStatus}
                          />
                        ) : currentFeaturedStatus === 'score_pending' ? (
                          <>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                              <span className="text-[9px] sm:text-[11px] font-bold uppercase text-slate-500">
                                FULL TIME
                              </span>
                            </div>
                            <div className="flex items-center justify-center my-0.5 sm:my-1">
                              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50/90 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200 backdrop-blur-xs">
                                VS
                              </div>
                            </div>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                              <p className="text-[8px] sm:text-[10px] text-slate-600 font-medium truncate text-center drop-shadow-xs">
                                {currentNextMatch.venue || '—'}
                              </p>
                            </div>
                          </>
                        ) : currentFeaturedStatus === 'finished' ? (
                          <>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                              <span className="text-[9px] sm:text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                                FULL TIME
                              </span>
                            </div>
                            <div className="text-2xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest drop-shadow-xs flex items-center justify-center leading-none my-0.5 sm:my-1">
                              {currentNextMatch.homeScore ?? 0} : {currentNextMatch.awayScore ?? 0}
                            </div>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                              <p className="text-[8px] sm:text-[10px] text-slate-600 font-medium truncate text-center drop-shadow-xs">
                                {currentNextMatch.venue || '—'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                              <span className="text-[9px] sm:text-[11px] text-slate-600 font-bold">
                                {formatWibTime(currentNextMatch.matchDate)}
                              </span>
                            </div>
                            <div className="flex items-center justify-center my-0.5 sm:my-1">
                              <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50/90 text-blue-600 font-black text-xs sm:text-2xl border border-blue-200 backdrop-blur-xs shadow-xs">
                                VS
                              </div>
                            </div>
                            <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                              <p className="text-[8px] sm:text-[10px] text-slate-600 font-medium truncate text-center drop-shadow-xs">
                                {currentNextMatch.venue || '—'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Away Team (Logo di tengah mendekat ke skor, Nama di sisi luar kanan) */}
                      <div className="flex items-center justify-start gap-1.5 sm:gap-3.5 min-w-0">
                        <div className="shrink-0 flex items-center justify-center">
                          <img
                            src={!currentNextMatch.isHome ? currentTeamLogo : (currentNextMatch.opponentLogo || '/defaultteam.webp')}
                            alt={!currentNextMatch.isHome ? currentTeamName : currentNextMatch.opponentName}
                            className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="text-left min-w-0 flex-1">
                          <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors drop-shadow-xs truncate">
                            {(!currentNextMatch.isHome ? currentTeamName : currentNextMatch.opponentName).toUpperCase()}
                          </h4>
                        </div>
                      </div>

                    </div>

                    <MatchTimer targetDate={currentNextMatch.matchDate} status={currentFeaturedStatus} duration={currentNextMatch.duration} isLiveEnabled={currentNextMatch.isLiveEnabled !== false} />
                  </>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    Belum ada jadwal pertandingan di Musim {selectedSeason}.
                  </div>
                )}
              </div>

            </Link>
          </section>

          {/* 3 PERTANDINGAN TERAKHIR */}
          {currentFinishedMatches.length > 0 && (() => {
            const last3 = [...currentFinishedMatches]
              .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
              .slice(0, 3);
            return (
              <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="mb-3 sm:mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-blue-600 inline-block" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">3 Pertandingan Terakhir</h2>
                </div>
                <div className="space-y-2">
                  {last3.map((m: any) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-blue-400/60 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white"
                    >
                      {(() => {
                        const our = m.isHome ? m.homeScore : m.awayScore;
                        const their = m.isHome ? m.awayScore : m.homeScore;
                        const result = our > their ? 'WIN' : our < their ? 'LOSE' : 'DRAW';
                        const resultColor = result === 'WIN' ? '#16a34a' : result === 'LOSE' ? '#dc2626' : '#d97706';
                        const resultBg = result === 'WIN' ? 'rgba(22,163,74,0.1)' : result === 'LOSE' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)';
                        return (
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-4 mb-3 sm:mb-6">
                            <span
                              className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border font-mono"
                              style={{ color: resultColor, background: resultBg, borderColor: `${resultColor}40` }}
                            >
                              {result}
                            </span>
                            <span className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-[9px] sm:text-xs font-medium text-slate-500">
                                {formatWibDate(m.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                {m.stage || ((m.competition || 'FRIENDLY').toUpperCase() === 'FRIENDLY' ? `Matchday ${m.matchday || 1}` : m.competition)}
                              </span>
                            </span>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                        {/* Home Team (Nama di sisi luar kiri, Logo di tengah mendekat ke skor) */}
                        <div className="flex items-center justify-end gap-1.5 sm:gap-3.5 min-w-0">
                          <div className="text-right min-w-0 flex-1">
                            <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {(m.isHome ? currentTeamName : m.opponentName).toUpperCase()}
                            </h4>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                            <img
                              src={m.isHome ? currentTeamLogo : (m.opponentLogo || '/defaultteam.webp')}
                              alt={m.isHome ? currentTeamName : m.opponentName}
                              className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>

                        {/* Score / VS Badge — Sejajar dengan Logo & Nama */}
                        <div className="flex flex-col items-center justify-center min-w-0 px-1 py-0.5">
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0">
                            <span className="text-[9px] sm:text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                              FULL TIME
                            </span>
                          </div>
                          <div className="text-2xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest leading-none my-0.5 sm:my-1 flex items-center justify-center">
                            {m.homeScore} : {m.awayScore}
                          </div>
                          <div className="h-4 sm:h-5 flex items-center justify-center shrink-0 max-w-[130px] sm:max-w-xs">
                            <p className="text-[8px] sm:text-[10px] text-slate-500 font-medium truncate text-center">
                              {m.venue || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Away Team (Logo di tengah mendekat ke skor, Nama di sisi luar kanan) */}
                        <div className="flex items-center justify-start gap-1.5 sm:gap-3.5 min-w-0">
                          <div className="shrink-0 flex items-center justify-center">
                            <img
                              src={!m.isHome ? currentTeamLogo : (m.opponentLogo || '/defaultteam.webp')}
                              alt={!m.isHome ? currentTeamName : m.opponentName}
                              className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="text-left min-w-0 flex-1">
                            <h4 className="text-sm sm:text-lg md:text-xl font-black uppercase text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {(!m.isHome ? currentTeamName : m.opponentName).toUpperCase()}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* SEASON STATS OVERVIEW */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-2.5 sm:mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  Statistik Tim
                </h2>
              </div>
              <Link
                href="/stats"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                Semua Statistik <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* DESKTOP BANNER (Player di Kanan, Background stattimnew.webp) */}
            <div className="hidden md:block relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0d6dca] shadow-xl shadow-blue-900/15 border border-blue-400/30">
              {/* Background Image: stattimnew.webp */}
              <img
                src="/stattimnew.webp"
                alt={`Statistik Tim ${currentTeamName}`}
                className="absolute inset-0 w-full h-full object-cover object-right select-none pointer-events-none"
              />

              {/* Main Content Layout (Desktop: Konten di Kiri, Ruang Pemain di Kanan) */}
              <div className="relative z-10 flex flex-col justify-center p-5 lg:p-7 md:pr-[28%] lg:pr-[30%] xl:pr-[32%] min-h-[200px] lg:min-h-[225px]">
                {/* Header Title & Subtitle */}
                <div className="space-y-1 mb-3 lg:mb-4">
                  <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
                    STATISTIK MUSIM {selectedSeason}
                  </h2>
                  <p className="text-xs lg:text-sm text-blue-100 font-medium drop-shadow-sm">
                    Performa tim di semua kompetisi.
                  </p>
                </div>

                {/* 7 White Cards */}
                <div className="grid grid-cols-7 gap-2 lg:gap-3">
                  {[
                    { label: 'WIN RATE', value: `${currentWinRate}%` },
                    { label: 'MAIN', value: currentTotalFinished },
                    { label: 'MENANG', value: currentWins },
                    { label: 'SERI', value: currentDraws },
                    { label: 'KALAH', value: currentLosses },
                    { label: 'GOL', value: currentTotalGoals },
                    { label: 'KEBOBOLAN', value: currentConcededGoals },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-[#f1f8fe]/95 backdrop-blur-xs rounded-2xl py-3.5 px-2 flex flex-col items-center justify-center text-center shadow-md shadow-blue-950/20 border border-white/90 transition-transform duration-200 hover:scale-[1.03]"
                    >
                      <span className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none font-sans">
                        {s.value}
                      </span>
                      <span className="text-[9px] lg:text-[10px] font-extrabold uppercase tracking-wider text-slate-600 mt-1.5 leading-tight truncate w-full text-center">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MOBILE BANNER (Khusus Mobile: Background statnew.webp) */}
            <div className="md:hidden relative overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200/80 aspect-[2.77/1] min-h-[135px]">
              {/* Background Image: statnew.webp */}
              <img
                src="/statnew.webp"
                alt={`Statistik Tim ${currentTeamName}`}
                className="absolute inset-0 w-full h-full object-cover object-left select-none pointer-events-none"
              />

              {/* Pojok Kiri Atas: Judul & Subtitle */}
              <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3.5 z-20 max-w-[40%] space-y-0.5 pointer-events-none">
                <h2 className="text-[11px] sm:text-[13px] font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  STATISTIK<br />MUSIM {selectedSeason}
                </h2>
                <p className="text-[6.5px] sm:text-[8px] text-blue-100 font-medium leading-tight drop-shadow-xs">
                  Performa tim di seluruh kompetisi.
                </p>
              </div>

              {/* Sisi Kanan: Card Statistik (Digeser ke Kanan agar Orang TIDAK Tertimpa & Tanpa Icon) */}
              <div className="absolute top-2 bottom-2 right-2 left-[47%] z-20 flex items-center justify-center">
                <div className="w-full h-full bg-white/95 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 shadow-md border border-slate-100/90 flex flex-col justify-center gap-1.5 sm:gap-2">

                  {/* Row 1: 3 Items (Win Rate, Main, Menang) - Tanpa Icon */}
                  <div className="grid grid-cols-3 gap-1 text-center items-center">
                    {/* Win Rate */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentWinRate}%
                      </span>
                      <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold capitalize mt-0.5">
                        Win Rate
                      </span>
                    </div>

                    {/* Main */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentTotalFinished}
                      </span>
                      <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold capitalize mt-0.5">
                        Main
                      </span>
                    </div>

                    {/* Menang */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentWins}
                      </span>
                      <span className="text-[7px] sm:text-[9px] text-slate-500 font-bold capitalize mt-0.5">
                        Menang
                      </span>
                    </div>
                  </div>

                  {/* Garis pemisah tipis */}
                  <div className="w-full h-[1px] bg-slate-100/90" />

                  {/* Row 2: 4 Items (Seri, Kalah, Gol, Kebobolan) - Tanpa Icon */}
                  <div className="grid grid-cols-4 gap-0.5 text-center items-center">
                    {/* Seri */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentDraws}
                      </span>
                      <span className="text-[6.5px] sm:text-[8px] text-slate-500 font-bold capitalize mt-0.5 truncate max-w-full">
                        Seri
                      </span>
                    </div>

                    {/* Kalah */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentLosses}
                      </span>
                      <span className="text-[6.5px] sm:text-[8px] text-slate-500 font-bold capitalize mt-0.5 truncate max-w-full">
                        Kalah
                      </span>
                    </div>

                    {/* Gol */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentTotalGoals}
                      </span>
                      <span className="text-[6.5px] sm:text-[8px] text-slate-500 font-bold capitalize mt-0.5 truncate max-w-full">
                        Gol
                      </span>
                    </div>

                    {/* Kebobolan */}
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[11px] sm:text-base font-black text-slate-900 leading-tight">
                        {currentConcededGoals}
                      </span>
                      <span className="text-[6.5px] sm:text-[8px] text-slate-500 font-bold capitalize mt-0.5 truncate max-w-full">
                        Kebobolan
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </section>

          {/* PLAYERS GRID */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-2.5 sm:mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  {currentTeamName} Players ({selectedSeason})
                </h2>
              </div>
              <Link
                href="/players"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                Semua Pemain <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {currentFeaturedPlayers.map((player: any) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-end bg-slate-950"
                >
                  {/* Latar Box Pemain (Customizable via Team Management, default bgprofil2.jpeg) */}
                  <img
                    src={playerCardBg}
                    alt="Player Card Background"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

                  <img
                    src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                    alt={player.name}
                    className="absolute inset-0 w-full h-full object-contain object-bottom group-hover:scale-105 transition-transform duration-500 z-10"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[38%] sm:h-[34%] player-card-scrim pointer-events-none z-10" />

                  <div className="relative z-20 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-sky-400 leading-none shrink-0 drop-shadow-md">
                      {player.number}
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white group-hover:text-sky-300 transition-colors uppercase leading-tight">
                        {formatBoxDisplayName(player.name)}
                      </h3>
                      <p className="text-[7px] sm:text-[8px] md:text-[9px] text-sky-400/90 font-bold uppercase tracking-widest leading-none">
                        {normalizePos(player.position)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* TOP PERFORM SECTION */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-2.5 sm:mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  TOP PERFORM ({selectedSeason})
                </h2>
              </div>
              <Link
                href={`/stats?tab=performance${selectedSeason ? `&season=${encodeURIComponent(selectedSeason)}` : ''}`}
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                Lihat Statistik <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="space-y-2">
                {performancePlayers.map((player: any, rank: number) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.slug}`}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                          rank === 0
                            ? 'bg-blue-600 text-white shadow-xs'
                            : rank === 1
                            ? 'bg-slate-300 text-slate-800'
                            : rank === 2
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {rank + 1}
                      </span>
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                          alt={player.name}
                          className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5 truncate">
                          <span className="text-blue-600 font-mono font-black">{player.number}</span>
                          <span className="truncate group-hover:text-blue-600 transition-colors">
                            {formatBoxDisplayName(player.name)}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                            {normalizePos(player.position)}
                          </span>
                          <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium truncate">
                            • {player.goals} Gol • {player.assists} Ast • {player.appearances} Main
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span className="text-base sm:text-xl font-black font-mono text-blue-600 leading-none">
                        {player.points}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 block font-bold leading-none mt-0.5">
                        POIN
                      </span>
                    </div>
                  </Link>
                ))}

                {performancePlayers.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada data performa pemain untuk Musim {selectedSeason}.
                  </div>
                )}
              </div>

              <div className="pt-2 text-[9px] sm:text-[10px] text-slate-500 text-left font-medium border-t border-slate-100">
                * Poin = Gol (+5), Assist (+3), Tampil (+1), Kartu Kuning (-1), Kartu Merah (-3)
              </div>
            </div>
          </section>

          {/* LATEST NEWS GRID */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-2.5 sm:mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-blue-600 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  Berita Klub
                </h2>
              </div>
              <Link
                href="/articles"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                Semua Berita <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6">
              {articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-end bg-slate-900"
                >
                  {/* Article Thumbnail Image */}
                  <img
                    src={getMainThumbnail(article.thumbnail)}
                    alt={article.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Black Gradient Overlay from Bottom - Compact & Smooth Easing */}
                  <div className="absolute inset-x-0 bottom-0 h-[42%] sm:h-[38%] player-card-scrim pointer-events-none" />

                  {/* Title & Date Inside the Image Box */}
                  <div className="relative z-10 p-2 sm:p-4 space-y-0.5 sm:space-y-1">
                    <span className="text-[7px] sm:text-[10px] text-sky-300 font-bold block leading-none drop-shadow-xs">
                      {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <h3 className="text-[9px] sm:text-sm md:text-base font-black text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-tight drop-shadow-md">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          TAB 2: SOCCER COMMUNITY (KHUSUS MEMBER KOMUNITAS)
         ═════════════════════════════════════════════════════════════ */}
      {isCommunityEnabled && clubMode === 'community' && (
        <div className="space-y-8 sm:space-y-16 animate-fadeIn">

          {/* FEATURED FUN MATCH SCORECARD */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 relative z-20">
            {nextFunMatch && (
              <div className="mb-2.5 sm:mb-3.5 flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-amber-500 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  {nextFunMatch.status === 'live' ? 'LIVE' : nextFunMatch.status === 'scheduled' ? 'UPCOMING' : 'LASTEST'}
                </h2>
              </div>
            )}
            {nextFunMatch ? (
              <Link
                href={`/community/matches/${nextFunMatch.id}`}
                className="relative block group overflow-hidden p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200/90 hover:border-amber-400/60 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
              >
                {/* Stadium Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  style={{ backgroundImage: `url('/stadium.webp')` }}
                />
                {/* Subtle light overlay to ensure flawless contrast */}
                <div className="absolute inset-0 bg-white/20 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between border-b border-slate-400/80 pb-2 sm:pb-4 mb-3 sm:mb-6">
                    {nextFunMatch.status === 'live' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-50/90 text-red-600 border border-red-200 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 backdrop-blur-xs">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> LIVE FUN MATCH
                      </span>
                    ) : (
                      <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-900 group-hover:text-amber-600 transition-colors">
                        FUN MATCH
                      </h3>
                    )}
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-[9px] sm:text-xs font-medium text-slate-600">
                        {formatWibDate(nextFunMatch.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-amber-50/90 text-amber-700 border border-amber-200 backdrop-blur-xs">
                        Matchday {nextFunMatch.matchday || 1}
                      </span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">

                    {/* Team A */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                      <div className="order-2 sm:order-1 text-center sm:text-right">
                        <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-amber-600 transition-colors drop-shadow-xs">
                          {nextFunMatch.teamAName}
                        </h4>
                      </div>
                      <div className="order-1 sm:order-2 w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-blue-50/90 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-sm sm:text-2xl shadow-sm backdrop-blur-xs">
                        A
                      </div>
                    </div>

                    {/* Score / VS */}
                    <div className="space-y-0.5 sm:space-y-2">
                      {nextFunMatch.status === 'finished' || (nextFunMatch.teamAScore !== null && nextFunMatch.teamBScore !== null) ? (
                        <>
                          <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium uppercase">
                            {nextFunMatch.status === 'finished' ? 'FULL TIME' : nextFunMatch.status === 'live' ? 'LIVE' : 'SKOR'}
                          </p>
                          <div className="text-xl sm:text-5xl font-black font-mono text-amber-600 tracking-widest drop-shadow-xs">
                            {nextFunMatch.teamAScore ?? 0} : {nextFunMatch.teamBScore ?? 0}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] sm:text-[11px] text-slate-600 font-bold">
                            {formatWibTime(nextFunMatch.matchDate)}
                          </p>
                          <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-50/90 text-amber-700 font-black text-xs sm:text-2xl border border-amber-200 backdrop-blur-xs shadow-xs">
                            VS
                          </div>
                        </>
                      )}
                      <p className="text-[8px] sm:text-[10px] text-slate-600 font-medium truncate max-w-xs mx-auto drop-shadow-xs">{nextFunMatch.venue}</p>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                      <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-center text-amber-600 font-black text-sm sm:text-2xl shadow-sm backdrop-blur-xs">
                        B
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-amber-600 transition-colors drop-shadow-xs">
                          {nextFunMatch.teamBName}
                        </h4>
                      </div>
                    </div>

                  </div>

                  <MatchTimer
                    targetDate={nextFunMatch.matchDate}
                    status={nextFunMatch.status}
                    duration={nextFunMatch.duration || 60}
                    isLiveEnabled={true}
                  />
                </div>
              </Link>
            ) : (
              <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto animate-pulse" />
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900">Jadwal Fun Match Segera Dirilis</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Fun match mingguan Soccer Community {currentTeamName} akan segera dijadwalkan oleh admin.
                </p>
              </div>
            )}
          </section>

          {/* 3 PERTANDINGAN FUN MATCH TERAKHIR */}
          {recentFunMatches.length > 0 && (
            <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
              <div className="mb-3 sm:mb-5 flex items-center gap-2">
                <span className="w-1.5 h-5 rounded-full bg-amber-500 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  3 Pertandingan Terakhir
                </h2>
              </div>
              <div className="space-y-2">
                {recentFunMatches.map((fm: any) => (
                  <Link
                    key={fm.id}
                    href={`/community/matches/${fm.id}`}
                    className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-amber-400/60 shadow-md shadow-slate-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 sm:pb-4 mb-3 sm:mb-6">
                      <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200">
                        SELESAI
                      </span>
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] sm:text-xs font-medium text-slate-500">
                          {formatWibDate(fm.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Matchday {fm.matchday || 1}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                      {/* Team A */}
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                        <div className="order-2 sm:order-1 text-center sm:text-right">
                          <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-amber-600 transition-colors">
                            {fm.teamAName}
                          </h4>
                        </div>
                        <div className="order-1 sm:order-2 w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-black text-sm sm:text-2xl shadow-sm">
                          A
                        </div>
                      </div>

                      {/* Score */}
                      <div className="space-y-0.5 sm:space-y-2">
                        <p className="text-[9px] sm:text-[11px] text-slate-500 font-medium">FULL TIME</p>
                        <div className="text-xl sm:text-5xl font-black font-mono text-amber-600 tracking-widest">
                          {fm.teamAScore ?? 0} : {fm.teamBScore ?? 0}
                        </div>
                        <p className="text-[8px] sm:text-[10px] text-slate-500 truncate max-w-xs mx-auto">{fm.venue}</p>
                      </div>

                      {/* Team B */}
                      <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                        <div className="w-8 h-8 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-black text-sm sm:text-2xl shadow-sm">
                          B
                        </div>
                        <div className="text-center sm:text-left">
                          <h4 className="text-[10px] sm:text-xl font-black text-slate-900 uppercase group-hover:text-amber-600 transition-colors">
                            {fm.teamBName}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}



          {/* SOCCER COMMUNITY MEMBERS SQUAD GRID - 4:5 EXACT LAYOUT */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="mb-2.5 sm:mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 sm:h-5 rounded-full bg-amber-500 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-900">
                  Skuad Member Aktif
                </h2>
              </div>
              <Link
                href="/community"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-800 flex items-center gap-0.5"
              >
                Buka Portal Member <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {communityMembers.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">Belum ada member komunitas terdaftar.</p>
                <button
                  onClick={() => setShowRegModal(true)}
                  className="px-5 py-2 rounded-xl font-extrabold uppercase white-blue-btn text-xs"
                >
                  Daftar Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
                {communityMembers.map((member: any) => (
                  <Link
                    key={member.id}
                    href={`/community/players/${member.id}`}
                    className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 hover:border-amber-400 shadow-md card-glow-hover flex flex-col justify-end bg-slate-100"
                  >
                    {/* Member Photo */}
                    <img
                      src={(member.photoUrl && member.photoUrl !== '/playertemplate.webp') ? member.photoUrl : playerDefaultPhoto}
                      alt={member.fullName}
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-[38%] sm:h-[34%] player-card-scrim pointer-events-none z-10" />

                    {/* Bottom Info: Jersey Number & Name & Position */}
                    <div className="relative z-10 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
                      <span className="text-3xl sm:text-5xl md:text-6xl font-black font-mono text-amber-400 leading-none shrink-0 drop-shadow-md">
                        {member.jerseyNumber}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-sm sm:text-xl md:text-2xl font-black text-white group-hover:text-amber-300 transition-colors uppercase leading-tight">
                          {formatBoxDisplayName(member.nickname || member.fullName)}
                        </h3>
                        <p className="text-[7px] sm:text-[8px] md:text-[9px] text-amber-400/90 font-bold uppercase tracking-widest leading-none">
                          {normalizePos(member.position)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* JOIN COMMUNITY & LOGIN CTA SECTION */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50/70 via-white to-blue-50/70 text-center space-y-6 shadow-md">
              <div className="space-y-2 max-w-xl mx-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                  GABUNG SOCCER COMMUNITY
                </span>
                <h3 className="text-xl sm:text-3xl font-black uppercase text-slate-900">
                  Ingin Bergabung Bermain Bersama Kami?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Dapatkan pengalaman fun match mingguan, statistik resmi web, nomor punggung eksklusif, dan kesempatan ditarik bermain di Skuad Utama {currentTeamName}!
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="px-6 py-3 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-md shadow-blue-500/20"
                >
                  Daftar Jadi Member Sekarang
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 rounded-xl font-bold uppercase text-slate-800 bg-white border border-slate-300 hover:border-amber-500 hover:text-amber-600 transition-all text-xs shadow-xs"
                >
                  Login Portal Member
                </button>
                <Link
                  href="/community"
                  className="px-6 py-3 rounded-xl font-bold uppercase text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 text-xs"
                >
                  Lihat Detail Paket & Biaya →
                </Link>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* REGISTRATION & LOGIN MODALS */}
      {isCommunityEnabled && (
        <>
          <CommunityRegistrationModal
            isOpen={showRegModal}
            onClose={() => setShowRegModal(false)}
            onOpenLogin={() => {
              setShowRegModal(false);
              setShowLoginModal(true);
            }}
            onSuccess={() => {
              setShowRegModal(false);
              setMessage({
                type: 'success',
                text: 'Pendaftaran berhasil terkirim! Bukti pembayaran Anda sedang diverifikasi oleh admin (maksimal 1x24 jam). Akun & kata sandi akan dikonfirmasi via WhatsApp.',
              });
            }}
          />
          <CommunityLoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onOpenRegister={() => {
              setShowLoginModal(false);
              setShowRegModal(true);
            }}
            onSuccess={() => {
              setShowLoginModal(false);
              window.location.reload();
            }}
          />
        </>
      )}

    </div>
  );
}
