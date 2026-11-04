import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { Trophy, Award, Flame, Shield, Activity, Users, BarChart3 } from 'lucide-react';
import { resolvePlayerForSeason } from '@/lib/seasonPlayer';
import SeasonSubNav from '@/components/SeasonSubNav';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const getCachedStatsData = unstable_cache(
  async () => {
    try {
      const [seasons, allMatches, allPlayersRaw, systemSetting] = await Promise.all([
        prisma.season.findMany({
          orderBy: { year: 'desc' },
          select: { id: true, name: true, year: true, isCurrent: true },
        }),
        prisma.footballMatch.findMany({
          orderBy: { matchDate: 'asc' },
          include: {
            lineups: {
              select: { playerId: true, isStarter: true },
            },
            events: {
              select: { id: true, matchId: true, type: true, minute: true, playerId: true, assistPlayerId: true },
            },
          },
        }),
        prisma.player.findMany({
          where: {
            isGuest: false,
            member: null,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            number: true,
            position: true,
            photoUrl: true,
            seasonData: true,
            goals: true,
            assists: true,
            appearances: true,
            yellowCards: true,
            redCards: true,
            seasons: { select: { id: true, name: true, year: true } },
            events: {
              select: { id: true, matchId: true, type: true, minute: true, playerId: true, assistPlayerId: true },
            },
            assistedEvents: {
              select: { id: true, matchId: true, type: true, minute: true, playerId: true, assistPlayerId: true },
            },
            lineups: {
              select: {
                matchId: true,
                isStarter: true,
              },
            },
          },
        }),
        (prisma as any).systemSetting.findUnique({ where: { id: 'default' } }).catch(() => null),
      ]);
      return {
        seasons: seasons || [],
        allMatches: allMatches || [],
        allPlayersRaw: allPlayersRaw || [],
        playerDefaultPhoto: systemSetting?.playerDefaultPhoto || '/playertemplate.webp',
      };
    } catch (e) {
      console.warn('Database unreachable in getCachedStatsData, fallback to empty arrays:', e);
      return { seasons: [], allMatches: [], allPlayersRaw: [], playerDefaultPhoto: '/playertemplate.webp' };
    }
  },
  ['mariners-stats-page-cache'],
  { revalidate: 3600, tags: ['stats', 'matches', 'players', 'seasons'] }
);

const formatPosition = (pos: string) => {
  const p = (pos || '').toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'Goalkeeper';
  if (p === 'DF' || p === 'DEFENDER') return 'Defender';
  if (p === 'MF' || p === 'MIDFIELDER') return 'Midfielder';
  if (p === 'FW' || p === 'FORWARD') return 'Forward';
  return pos;
};

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const cookieSeason = cookieStore.get('public_season')?.value;

  const { seasons, allMatches, allPlayersRaw, playerDefaultPhoto } = await getCachedStatsData();

  const mainSeason = seasons.find((s) => Boolean(s.isCurrent))?.name || (seasons.length > 0 ? seasons[0].name : '2027');
  const defaultSeason = mainSeason;
  // Khusus statistik: ketika awal dibuka tetap menampilkan musim utama
  const selectedSeason = params.season || (cookieSeason && cookieSeason !== 'all' && seasons.some((s) => s.name === cookieSeason) ? cookieSeason : defaultSeason);
  const activeTab = (params.tab || 'all').toLowerCase();

  const isAll = selectedSeason === 'all';

  // 1. Filter Season Matches for Stats Calculation
  const seasonMatches = isAll
    ? allMatches
    : allMatches.filter((m: any) => {
        const s = (m.seasonName || '').trim().toLowerCase();
        const yr =
          m.seasonName?.match(/\d{4}/)?.[0] ||
          (m.matchDate ? new Date(m.matchDate).getFullYear().toString() : '');
        const target = selectedSeason.trim().toLowerCase();
        return s === target || s.includes(target) || yr === target;
      });

  const seasonMatchIds = new Set(seasonMatches.map((m: any) => m.id));

  // Team Stats Calculation
  const finishedMatches = seasonMatches.filter((m: any) => {
    if (m.status === 'finished') return true;
    if (m.homeScore !== null && m.awayScore !== null) return true;
    return false;
  });

  let totalWins = 0;
  let totalDraws = 0;
  let totalLosses = 0;
  let totalGoals = 0;
  let totalConceded = 0;
  let cleanSheets = 0;

  finishedMatches.forEach((m: any) => {
    const marinersScore = m.isHome ? m.homeScore : m.awayScore;
    const opponentScore = m.isHome ? m.awayScore : m.homeScore;
    if (marinersScore !== null && opponentScore !== null) {
      totalGoals += marinersScore;
      totalConceded += opponentScore;
      if (opponentScore === 0) cleanSheets++;
      if (marinersScore > opponentScore) totalWins++;
      else if (marinersScore === opponentScore) totalDraws++;
      else totalLosses++;
    }
  });

  const totalPlayed = finishedMatches.length;
  const winRate = totalPlayed > 0 ? Math.round((totalWins / totalPlayed) * 100) : 0;
  const goalDiff = totalGoals - totalConceded;
  const totalPoints = (totalWins * 3) + (totalDraws * 1);

  // 2. Filter Players for Season:
  // Hanya sertakan pemain yang terdaftar di musim ini, atau yang pernah masuk lineup di musim ini
  const rawPlayers = isAll
    ? allPlayersRaw
    : allPlayersRaw.filter((p: any) => {
        const isEnrolled = Array.isArray(p.seasons) && p.seasons.some((s: any) => {
          const sName = (s.name || '').trim().toLowerCase();
          const sYr = s.year?.toString() || sName.match(/\d{4}/)?.[0];
          const target = selectedSeason.trim().toLowerCase();
          return sName === target || sYr === target;
        });
        if (isEnrolled) return true;

        const hasLineupInSeason = (p.lineups || []).some((l: any) => seasonMatchIds.has(l.matchId));
        return hasLineupInSeason;
      });

  // Calculate individual stats strictly adapted to the selected season!
  const allPlayers = rawPlayers.map((rawP: any) => {
    // Resolve player photo & number for target season, falling back to main season (isCurrent)
    const p = resolvePlayerForSeason(
      resolvePlayerForSeason(rawP, mainSeason),
      !isAll ? selectedSeason : mainSeason
    );

    // Penampilan di musim ini: Starter maupun Cadangan yang masuk skuad laga musim ini
    const calcAppearances = seasonMatches.filter((m: any) => {
      return (m.lineups || []).some((l: any) => l.playerId === p.id);
    }).length;

    // Gol di musim ini
    const calcGoals = (p.events || []).filter((e: any) => {
      if (!seasonMatchIds.has(e.matchId)) return false;
      return e.type === 'goal' || e.type === 'penalty';
    }).length;

    // Assist di musim ini
    const calcAssists =
      (p.events || []).filter((e: any) => {
        if (!seasonMatchIds.has(e.matchId)) return false;
        return e.type === 'assist';
      }).length +
      (p.assistedEvents || []).filter((e: any) => {
        if (!seasonMatchIds.has(e.matchId)) return false;
        return e.type !== 'sub';
      }).length;

    // Kartu kuning di musim ini
    const calcYellow = (p.events || []).filter((e: any) => {
      if (!seasonMatchIds.has(e.matchId)) return false;
      return e.type === 'yellow_card';
    }).length;

    // Kartu merah di musim ini
    const calcRed = (p.events || []).filter((e: any) => {
      if (!seasonMatchIds.has(e.matchId)) return false;
      return e.type === 'red_card' || e.type === 'second_yellow';
    }).length;

    // Mode SEMUA MUSIM vs Musim Spesifik
    const appearances = isAll ? Math.max(p.appearances || 0, calcAppearances) : calcAppearances;
    const goals = isAll ? Math.max(p.goals || 0, calcGoals) : calcGoals;
    const assists = isAll ? Math.max(p.assists || 0, calcAssists) : calcAssists;
    const yellowCards = isAll ? Math.max(p.yellowCards || 0, calcYellow) : calcYellow;
    const redCards = isAll ? Math.max(p.redCards || 0, calcRed) : calcRed;

    // Points system: Goal(5), Assist(3), Appearance(1), YellowCard(-1), RedCard(-3)
    const points = (goals * 5) + (assists * 3) + (appearances * 1) - (yellowCards * 1) - (redCards * 3);

    return {
      ...p,
      goals,
      assists,
      appearances,
      yellowCards,
      redCards,
      points,
    };
  });

  // Calculate sorted rankings for Performance, Scorers, Assists, Appearances
  const performancePlayers = [...allPlayers]
    .sort((a, b) => b.points - a.points || b.goals - a.goals || b.assists - a.assists || b.appearances - a.appearances)
    .slice(0, 5);

  const topScorers = [...allPlayers]
    .sort((a, b) => b.goals - a.goals || b.points - a.points)
    .slice(0, 5);

  const topAssists = [...allPlayers]
    .sort((a, b) => b.assists - a.assists || b.points - a.points)
    .slice(0, 5);

  const topAppearances = [...allPlayers]
    .sort((a, b) => b.appearances - a.appearances || b.points - a.points)
    .slice(0, 5);

  const statTabs = [
    { key: 'all', label: 'SEMUA' },
    { key: 'team', label: 'STATISTIK TIM' },
    { key: 'performance', label: 'TOP PERFORMA' },
    { key: 'scorers', label: 'TOP SKORER' },
    { key: 'assists', label: 'TOP ASSIST' },
    { key: 'appearances', label: 'TOP PENAMPILAN' },
  ];

  const seasonParam = selectedSeason && selectedSeason !== 'all' ? `&season=${encodeURIComponent(selectedSeason)}` : '';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Navigation Filter Tabs (Navbar Underline Style) */}
      <div className="flex items-center justify-start gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        {statTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={`/stats?tab=${tab.key}${seasonParam}`}
              className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
                isActive
                  ? 'text-blue-600 border-blue-600 font-black'
                  : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Navigasi Musim (Di Bawah Navigasi Halaman, Latar Sama Persis) */}
      <SeasonSubNav
        seasons={seasons}
        selectedSeason={selectedSeason}
        basePath="/stats"
        searchParams={params}
        showAllOption={true}
      />

      {allPlayers.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-sm">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-500">
            Belum ada data statistik pemain di {selectedSeason === 'all' ? 'Semua Musim' : `Musim ${selectedSeason}` }.
          </p>
        </div>
      )}

      {/* ── 1. TABEL STATISTIK TIM (Tampil di "SEMUA" di atas Performa & di tab "STATISTIK TIM") ── */}
      {(activeTab === 'all' || activeTab === 'team') && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">
                Statistik Tim
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {selectedSeason === 'all' ? 'Semua Musim' : `Musim ${selectedSeason}`}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 sm:gap-3">
            {[
              { label: 'WIN RATE', value: `${winRate}%`, color: 'text-blue-600' },
              { label: 'MAIN', value: totalPlayed, color: 'text-slate-900' },
              { label: 'MENANG', value: totalWins, color: 'text-emerald-600' },
              { label: 'SERI', value: totalDraws, color: 'text-amber-500' },
              { label: 'KALAH', value: totalLosses, color: 'text-red-500' },
              { label: 'GOL', value: totalGoals, color: 'text-blue-600' },
              { label: 'KEBOBOLAN', value: totalConceded, color: 'text-slate-700' },
              { label: 'SELISIH GOL', value: goalDiff > 0 ? `+${goalDiff}` : goalDiff, color: goalDiff >= 0 ? 'text-blue-600' : 'text-red-500' },
              { label: 'NIRBOBOL', value: cleanSheets, color: 'text-emerald-600' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center text-center hover:bg-blue-50/60 hover:border-blue-300 transition-colors"
              >
                <span className={`text-lg sm:text-xl font-black font-mono leading-none ${stat.color}`}>
                  {stat.value}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 leading-tight">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-2 text-[10px] text-slate-500 text-left font-medium">
            Dihitung dari {totalPlayed} laga resmi di {selectedSeason === 'all' ? 'Semua Musim' : `Musim ${selectedSeason}` }
          </div>
        </div>
      )}

      {/* ── 2. TOP PERFORMA (Tampil di "SEMUA" di bawah Tim & di tab "TOP PERFORMA") ── */}
      {(activeTab === 'all' || activeTab === 'performance') && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Performa</h2>
          </div>

          <div className="space-y-2.5">
            {performancePlayers.map((player, rank) => (
              <Link
                key={player.id}
                href={`/players/${player.slug}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                    {rank + 1}
                  </span>
                  {/* Photo avatar sama dengan ukuran di line up: w-8 h-8 */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                    <img
                      src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                      alt={player.name}
                      className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                    />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-blue-600 font-mono font-black">{player.number}</span>
                      <span>{player.name}</span>
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(player.position)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-xl font-black font-mono text-blue-600">{player.points}</span>
                  <span className="text-[10px] text-slate-500 block font-bold">POIN</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="pt-2 text-[10px] text-slate-500 text-left font-medium">
            Poin = Gol (5), Assist (3), Tampil (1), Kartu Kuning (-1), Kartu Merah (-3)
          </div>
        </div>
      )}

      {/* ── 3. GRID TABLES (TOP SKORER, TOP ASSIST, TOP PENAMPILAN) ── */}
      {(activeTab === 'all' || activeTab === 'scorers' || activeTab === 'assists' || activeTab === 'appearances') && (
        <div className={activeTab === 'all' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8" : "max-w-2xl"}>
          
          {/* Table 1: Top Scorers */}
          {(activeTab === 'all' || activeTab === 'scorers') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Flame className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Skorer</h2>
              </div>

              <div className="space-y-2.5">
                {topScorers.map((player, rank) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        {rank + 1}
                      </span>
                      {/* Photo avatar sama dengan ukuran di line up: w-8 h-8 */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                          alt={player.name}
                          className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                        />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-blue-600 font-mono font-black">{player.number}</span>
                          <span>{player.name}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(player.position)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black font-mono text-blue-600">{player.goals}</span>
                      <span className="text-[10px] text-slate-500 block font-bold">GOL</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Table 2: Top Assists */}
          {(activeTab === 'all' || activeTab === 'assists') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Assist</h2>
              </div>

              <div className="space-y-2.5">
                {topAssists.map((player, rank) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        {rank + 1}
                      </span>
                      {/* Photo avatar sama dengan ukuran di line up: w-8 h-8 */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                          alt={player.name}
                          className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                        />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-blue-600 font-mono font-black">{player.number}</span>
                          <span>{player.name}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(player.position)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black font-mono text-blue-600">{player.assists}</span>
                      <span className="text-[10px] text-slate-500 block font-bold">ASSIST</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Table 3: Appearances */}
          {(activeTab === 'all' || activeTab === 'appearances') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <h2 className="text-base sm:text-lg font-black uppercase text-slate-900">Top Penampilan</h2>
              </div>

              <div className="space-y-2.5">
                {topAppearances.map((player, rank) => (
                  <Link
                    key={player.id}
                    href={`/players/${player.slug}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full font-mono text-xs font-black flex items-center justify-center shrink-0 ${rank === 0 ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        {rank + 1}
                      </span>
                      {/* Photo avatar sama dengan ukuran di line up: w-8 h-8 */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                        <img
                          src={(player.photoUrl && player.photoUrl !== '/playertemplate.webp') ? player.photoUrl : playerDefaultPhoto}
                          alt={player.name}
                          className="w-full h-full object-cover object-top scale-[1.35] origin-top"
                        />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-blue-600 font-mono font-black">{player.number}</span>
                          <span>{player.name}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5">{formatPosition(player.position)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black font-mono text-blue-600">{player.appearances}</span>
                      <span className="text-[10px] text-slate-500 block font-bold">MAIN</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
