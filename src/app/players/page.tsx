import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { Shield, ArrowRight, Sparkles, Users } from 'lucide-react';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const positionOrder = ['GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD'];
const positionLabels: Record<string, string> = {
  GOALKEEPER: 'GOALKEEPER',
  DEFENDER: 'DEFENDER',
  MIDFIELDER: 'MIDFIELDER',
  FORWARD: 'FORWARD',
};

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

  // 1. If complete full name fits in card box (<= 18 chars), display full name
  if (fullName.length <= 18) return fullName;

  // 2. If middle/second name exists and first 2 words fit (<= 18 chars), display first + middle name
  if (parts.length >= 2) {
    const firstTwo = `${parts[0]} ${parts[1]}`;
    if (firstTwo.length <= 18) {
      return firstTwo;
    }
  }

  // 3. Otherwise fallback to first name
  return parts[0];
}

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; pos?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieSeason = cookieStore.get('public_season')?.value;
  const cookieAdminSeason = cookieStore.get('admin_season')?.value;

  // Direct dynamic database query for fresh live squad data
  let seasons: any[] = [];
  let allPlayers: any[] = [];
  let playerCardBg = '/bgprofil2.webp';
  let playerDefaultPhoto = '/playertemplate.webp';

  try {
    const [seasonsData, playersData, settingData] = await Promise.all([
      prisma.season.findMany({
        orderBy: { year: 'desc' },
        select: { id: true, name: true, year: true, isCurrent: true },
      }).catch(() => []),
      prisma.player.findMany({
        where: {
          isGuest: false,
          OR: [
            { member: null },
            { member: { isPermanent: true } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          number: true,
          position: true,
          photoUrl: true,
          hidePhoto: true,
          isCaptain: true,
          seasonData: true,
          member: { select: { id: true } },
          seasons: { select: { id: true, name: true } },
        },
        orderBy: { number: 'asc' },
      }).catch(async () => {
        // Safe fallback without member join if member relation throws
        return prisma.player.findMany({
          where: { isGuest: false },
          select: {
            id: true,
            name: true,
            slug: true,
            number: true,
            position: true,
            photoUrl: true,
            hidePhoto: true,
            isCaptain: true,
            seasonData: true,
            seasons: { select: { id: true, name: true } },
          },
          orderBy: { number: 'asc' },
        }).catch(() => []);
      }),
      (prisma as any).systemSetting.findUnique({
        where: { id: 'default' },
        select: { playerCardBg: true, playerDefaultPhoto: true },
      }).catch(() => null),
    ]);

    seasons = seasonsData || [];
    allPlayers = playersData || [];
    if (settingData?.playerCardBg) playerCardBg = settingData.playerCardBg;
    if (settingData?.playerDefaultPhoto) playerDefaultPhoto = settingData.playerDefaultPhoto;
  } catch (err) {
    console.warn('Error fetching players page data:', err);
  }

  const validNames = new Set(seasons.map((s) => s.name));
  const currentDbSeason = seasons.find((s) => Boolean(s.isCurrent))?.name;
  const defaultSeason = currentDbSeason || (seasons.length > 0 ? seasons[0].name : '');

  let selectedSeason = defaultSeason;
  if (params.season && validNames.has(params.season)) {
    selectedSeason = params.season;
  } else if (cookieSeason && validNames.has(cookieSeason)) {
    selectedSeason = cookieSeason;
  } else if (cookieAdminSeason && validNames.has(cookieAdminSeason)) {
    selectedSeason = cookieAdminSeason;
  } else if (currentDbSeason && validNames.has(currentDbSeason)) {
    selectedSeason = currentDbSeason;
  } else if (seasons.length > 0) {
    selectedSeason = seasons[0].name;
  }

  const posFilter = (params.pos || 'all').toLowerCase();

  // Filter players for selected season:
  let seasonFiltered = allPlayers;

  if (selectedSeason) {
    const matched = allPlayers.filter((p: any) => {
      // 1. Explicitly enrolled in this season
      if (Array.isArray(p.seasons) && p.seasons.length > 0) {
        return p.seasons.some((s: any) => s.name === selectedSeason);
      }
      // 2. Unassigned players: if they haven't been enrolled in any specific season,
      // include them in the default active season so they are not lost!
      return selectedSeason === defaultSeason;
    });

    if (matched.length > 0) {
      seasonFiltered = matched;
    } else if (allPlayers.length > 0) {
      // Fallback: if no players matched this season filter, but club has players,
      // display all players so the squad portal is never empty!
      seasonFiltered = allPlayers;
    }
  }

  const players = seasonFiltered.map((p) => resolvePlayerForSeason(p, selectedSeason));

  const posTabs = [
    { key: 'all', label: 'SEMUA', count: players.length },
    { key: 'goalkeeper', label: 'GOALKEEPER', count: players.filter((p) => normalizePos(p.position) === 'GOALKEEPER').length },
    { key: 'defender', label: 'DEFENDER', count: players.filter((p) => normalizePos(p.position) === 'DEFENDER').length },
    { key: 'midfield', label: 'MIDFIELD', count: players.filter((p) => normalizePos(p.position) === 'MIDFIELDER').length },
    { key: 'forward', label: 'FORWARD', count: players.filter((p) => normalizePos(p.position) === 'FORWARD').length },
  ];

  const displayedPositions = positionOrder.filter((pos) => {
    if (posFilter === 'all') return true;
    if (posFilter === 'goalkeeper' && pos === 'GOALKEEPER') return true;
    if (posFilter === 'defender' && pos === 'DEFENDER') return true;
    if ((posFilter === 'midfield' || posFilter === 'midfielder') && pos === 'MIDFIELDER') return true;
    if (posFilter === 'forward' && pos === 'FORWARD') return true;
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Position Filter Tabs (Navbar Underline Style) */}
      <div className="flex items-center justify-start gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {posTabs.map((tab) => {
          const isActive = posFilter === tab.key;
          const seasonParam = selectedSeason && selectedSeason !== 'all' ? `&season=${encodeURIComponent(selectedSeason)}` : '';
          return (
            <Link
              key={tab.key}
              href={`/players?pos=${tab.key}${seasonParam}`}
              className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
                isActive
                  ? 'text-blue-600 border-blue-600 font-black'
                  : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </div>

      {players.length === 0 && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-200 bg-white text-center space-y-3 shadow-sm">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-500">
            {selectedSeason
              ? `Belum ada pemain yang terdaftar di skuad Musim ${selectedSeason}.`
              : 'Belum ada pemain yang terdaftar di skuad.'}
          </p>
        </div>
      )}

      {/* Grouped by Position */}
      {displayedPositions.map((pos) => {
        const group = players.filter((p) => normalizePos(p.position) === pos);
        if (group.length === 0) return null;

        return (
          <div key={pos} className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-2.5">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <h2 className="text-base sm:text-xl font-black uppercase text-slate-900 tracking-wide">
                {positionLabels[pos]}
              </h2>
            </div>

            {/* 2 COLUMNS ON MOBILE: grid-cols-2 */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {group.map((player) => (
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

                  {/* Full Photo (Transparent PNG cutout on clean box) */}
                  <img
                    src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                    alt={player.name}
                    className="absolute inset-0 w-full h-full object-contain object-bottom group-hover:scale-105 transition-transform duration-500 z-10"
                  />

                  {/* Top-Right MEMBER tag if player is a member */}
                  {player.member && (
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-20">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[8px] sm:text-[9px] uppercase tracking-wider shadow-md border border-amber-300">
                        <Sparkles className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                        MEMBER
                      </span>
                    </div>
                  )}
                  
                  {/* Deep & Silky-Smooth Easing Scrim at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-[38%] sm:h-[34%] player-card-scrim pointer-events-none z-10" />

                  {/* Bottom Info: Number alongside Name & Position (Compact box font size) */}
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
          </div>
        );
      })}

    </div>
  );
}
