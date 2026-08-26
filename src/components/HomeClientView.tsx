'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar, ArrowRight, Flame, Sparkles, Shield, Users,
  Trophy, Award, Activity, MapPin, CheckCircle2, UserCheck, Star
} from 'lucide-react';
import MatchTimer from '@/components/MatchTimer';
import LiveScoreDisplay from '@/components/LiveScoreDisplay';
import { formatWibDate, formatWibTime } from '@/lib/date';
import { getMainThumbnail } from '@/lib/articles';
import CommunityRegistrationModal from '@/components/CommunityRegistrationModal';
import CommunityLoginModal from '@/components/CommunityLoginModal';

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
}

export default function HomeClientView({ mainSquadData, communityData }: HomeClientViewProps) {
  const [clubMode, setClubMode] = useState<'main' | 'community'>('main');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const {
    nextMatch,
    featuredStatus,
    finishedMatches,
    winRate,
    totalFinished,
    wins,
    draws,
    losses,
    totalGoals,
    concededGoals,
    featuredPlayers,
    articles,
  } = mainSquadData;

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
      
      {/* ═════════════════════════════════════════════════════════════
          HERO SECTION DENGAN SLIDE TOGGLE SWITCHER
         ═════════════════════════════════════════════════════════════ */}
      <section className="relative aspect-[16/9] sm:aspect-auto sm:min-h-[85vh] w-full flex items-end justify-center overflow-hidden border-b border-blue-500/20 px-2 sm:px-3">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
          style={{ backgroundImage: `url('/LOGIN.jpeg')` }}
        />
        {/* Subtle bottom gradient */}
        <div className="absolute bottom-0 inset-x-0 h-32 sm:h-56 bg-gradient-to-t from-[#060b14] via-[#060b14]/70 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-2 text-center space-y-2 sm:space-y-5 pb-3 sm:pb-6">
          
          {/* Badge Top */}
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full glass-panel-blue text-sky-300 text-[9px] sm:text-xs font-extrabold uppercase tracking-widest animate-pulse drop-shadow-md">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400" />
            <span>Musim 2026/2027</span>
          </div>

          <p className="max-w-2xl mx-auto text-[11px] sm:text-lg text-white font-semibold leading-normal sm:leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Selamat datang di website resmi <strong className="text-sky-300">Mariners SC</strong>.
          </p>

          {/* ─── SLIDE TOGGLE SWITCHER (SEPERTI TOMBOL LINEUP/SUMMARY) ─── */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 p-1.5 glass-panel rounded-2xl max-w-xs sm:max-w-md mx-auto border border-sky-400/40 shadow-2xl shadow-slate-950">
            <button
              onClick={() => setClubMode('main')}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                clubMode === 'main'
                  ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-sky-300" />
              <span>MARINERS SC</span>
            </button>

            <button
              onClick={() => setClubMode('community')}
              className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 ${
                clubMode === 'community'
                  ? 'blue-gradient-bg text-white shadow-lg shadow-sky-500/40 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-sky-300" />
              <span>SOCCER COMMUNITY</span>
            </button>
          </div>

        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════
          TAB 1: MARINERS SC (TIM UTAMA)
         ═════════════════════════════════════════════════════════════ */}
      {clubMode === 'main' && (
        <div className="space-y-8 sm:space-y-16 animate-fadeIn">
          
          {/* MATCH SCORECARD FEATURED */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 -mt-6 sm:-mt-20 relative z-20">
            <Link
              href={nextMatch ? `/matches/${nextMatch.id}` : '/matches'}
              className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
            >
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
                {featuredStatus === 'live' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE
                  </span>
                ) : featuredStatus === 'scheduled' ? (
                  <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-sky-300 transition-colors">
                    Laga Mendatang Tim Utama
                  </h3>
                ) : (
                  <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-sky-300 transition-colors">
                    Hasil Pertandingan Terakhir
                  </h3>
                )}
                <span className="flex items-center gap-1.5 sm:gap-2">
                  {nextMatch && (
                    <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                      {formatWibDate(nextMatch.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                    Matchday {nextMatch?.matchday || 1}
                  </span>
                </span>
              </div>

              {nextMatch ? (
                <>
                  <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                    
                    {/* Home Team */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                      <div className="order-2 sm:order-1 text-center sm:text-right">
                        <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                          {nextMatch.isHome ? 'MARINERS SC' : nextMatch.opponentName}
                        </h4>
                      </div>
                      <div className="order-1 sm:order-2 flex items-center justify-center">
                        <img
                          src={nextMatch.isHome ? '/marinerssc.png' : (nextMatch.opponentLogo || '/defaultteam.png')}
                          alt={nextMatch.isHome ? 'Mariners SC' : nextMatch.opponentName}
                          className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    </div>

                    {/* Score / VS Badge */}
                    <div className="space-y-0.5 sm:space-y-2">
                      {featuredStatus === 'live' ? (
                        <LiveScoreDisplay
                          targetDate={nextMatch.matchDate}
                          duration={nextMatch.duration}
                          homeScore={nextMatch.homeScore ?? 0}
                          awayScore={nextMatch.awayScore ?? 0}
                          isLiveEnabled={nextMatch.isLiveEnabled !== false}
                          events={nextMatch.events}
                          status={featuredStatus}
                        />
                      ) : featuredStatus === 'score_pending' ? (
                        <>
                          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                          <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                            VS
                          </div>
                        </>
                      ) : featuredStatus === 'finished' ? (
                        <>
                          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                          <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                            {nextMatch.homeScore ?? 0} : {nextMatch.awayScore ?? 0}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                            {formatWibTime(nextMatch.matchDate)}
                          </p>
                          <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-600/30 text-sky-300 font-black text-xs sm:text-2xl border border-sky-400/50">
                            VS
                          </div>
                        </>
                      )}
                      <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">{nextMatch.venue}</p>
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                      <div className="flex items-center justify-center">
                        <img
                          src={!nextMatch.isHome ? '/marinerssc.png' : (nextMatch.opponentLogo || '/defaultteam.png')}
                          alt={!nextMatch.isHome ? 'Mariners SC' : nextMatch.opponentName}
                          className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                          {!nextMatch.isHome ? 'MARINERS SC' : nextMatch.opponentName}
                        </h4>
                      </div>
                    </div>

                  </div>

                  <MatchTimer targetDate={nextMatch.matchDate} status={featuredStatus} duration={nextMatch.duration} isLiveEnabled={nextMatch.isLiveEnabled !== false} />
                </>
              ) : (
                <div className="text-center py-3 text-xs text-slate-400">
                  Menghubungkan data pertandingan Mariners SC...
                </div>
              )}

            </Link>
          </section>

          {/* 3 PERTANDINGAN TERAKHIR */}
          {finishedMatches.length > 0 && (() => {
            const last3 = [...finishedMatches]
              .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
              .slice(0, 3);
            return (
              <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="mb-3 sm:mb-5 flex items-center gap-2">
                  <span className="w-1 h-5 rounded-full bg-sky-400 inline-block" />
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">3 Pertandingan Terakhir</h2>
                </div>
                <div className="space-y-2">
                  {last3.map((m: any) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-sky-400/30 hover:border-sky-400/60 shadow-2xl shadow-slate-950 hover:shadow-sky-500/10 transition-all duration-300 cursor-pointer"
                    >
                      {(() => {
                        const our = m.isHome ? m.homeScore : m.awayScore;
                        const their = m.isHome ? m.awayScore : m.homeScore;
                        const result = our > their ? 'WIN' : our < their ? 'LOSE' : 'DRAW';
                        const resultColor = result === 'WIN' ? '#16a34a' : result === 'LOSE' ? '#dc2626' : '#d97706';
                        const resultBg = result === 'WIN' ? 'rgba(22,163,74,0.15)' : result === 'LOSE' ? 'rgba(220,38,38,0.15)' : 'rgba(217,119,6,0.15)';
                        return (
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
                            <span
                              className="text-[10px] sm:text-sm font-black uppercase tracking-widest px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg border"
                              style={{ color: resultColor, background: resultBg, borderColor: `${resultColor}40` }}
                            >
                              {result}
                            </span>
                            <span className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                                {formatWibDate(m.matchDate, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-blue-950/80 text-sky-300 border border-sky-400/30">
                                Matchday {m.matchday}
                              </span>
                            </span>
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                          <div className="order-2 sm:order-1 text-center sm:text-right">
                            <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                              {m.isHome ? 'MARINERS SC' : m.opponentName}
                            </h4>
                          </div>
                          <div className="order-1 sm:order-2 flex items-center justify-center">
                            <img
                              src={m.isHome ? '/marinerssc.png' : (m.opponentLogo || '/defaultteam.png')}
                              alt={m.isHome ? 'Mariners SC' : m.opponentName}
                              className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        </div>

                        <div className="space-y-0.5 sm:space-y-2">
                          <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                          <div className="text-xl sm:text-5xl font-black font-mono blue-gradient-text tracking-widest">
                            {m.homeScore} : {m.awayScore}
                          </div>
                          <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">{m.venue}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                          <div className="flex items-center justify-center">
                            <img
                              src={!m.isHome ? '/marinerssc.png' : (m.opponentLogo || '/defaultteam.png')}
                              alt={!m.isHome ? 'Mariners SC' : m.opponentName}
                              className="w-8 h-8 sm:w-16 sm:h-16 object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="text-center sm:text-left">
                            <h4 className="text-[10px] sm:text-xl font-black text-white uppercase group-hover:text-sky-200 transition-colors">
                              {!m.isHome ? 'MARINERS SC' : m.opponentName}
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
            <div className="glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-sky-400/20 bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526]">
              <div className="text-center max-w-xl mx-auto mb-3 sm:mb-6 space-y-0.5">
                <h2 className="text-base sm:text-2xl font-black uppercase text-white">Statistik Musim 2026/2027</h2>
                <p className="text-[9px] sm:text-xs text-slate-300">Performa resmi klub Mariners SC di musim ini</p>
              </div>

              <div className="grid grid-cols-7 divide-x divide-slate-800/80 bg-gradient-to-b from-[#09111e] via-[#060b14] to-[#0a1526] rounded-2xl sm:rounded-3xl border border-sky-400/20 shadow-2xl overflow-hidden py-3 sm:py-5">
                {[
                  { label: 'WIN RATE', value: `${winRate}%` },
                  { label: 'MAIN', value: totalFinished },
                  { label: 'MENANG', value: wins },
                  { label: 'SERI', value: draws },
                  { label: 'KALAH', value: losses },
                  { label: 'GOL', value: totalGoals },
                  { label: 'KEMASUKAN', value: concededGoals },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center justify-center px-1 sm:px-3 text-center">
                    <span className="text-sm sm:text-3xl md:text-4xl font-black font-mono text-white tracking-tight">
                      {s.value}
                    </span>
                    <span className="text-[8px] sm:text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mt-1 truncate max-w-full">
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* PLAYERS GRID */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
            <div className="flex items-end justify-between border-b border-slate-800 pb-2">
              <div>
                <h2 className="text-base sm:text-3xl font-black uppercase text-white">
                  Mariners SC Players
                </h2>
              </div>
              <Link
                href="/players"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-0.5"
              >
                Semua Pemain <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
              {featuredPlayers.map((player: any) => (
                <Link
                  key={player.id}
                  href={`/players/${player.slug}`}
                  className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-sky-400/20 hover:border-sky-400/60 shadow-xl card-glow-hover flex flex-col justify-end"
                >
                  <img
                    src={player.photoUrl || '/playertemplate.png'}
                    alt={player.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/60 to-transparent pointer-events-none" />

                  <div className="relative z-10 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
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

          {/* LATEST NEWS GRID */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
            <div className="flex items-end justify-between border-b border-slate-800 pb-2">
              <div>
                <h2 className="text-base sm:text-3xl font-black uppercase text-white">
                  Berita Klub
                </h2>
              </div>
              <Link
                href="/articles"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-sky-400 hover:text-white flex items-center gap-0.5"
              >
                Semua Berita <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6">
              {articles.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group glass-panel rounded-lg sm:rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-900">
                    <img
                      src={getMainThumbnail(article.thumbnail)}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1 sm:top-3 left-1 sm:left-3 px-1 sm:px-2.5 py-0.5 rounded bg-white text-blue-950 font-black text-[7px] sm:text-[10px] uppercase tracking-wider shadow">
                      {article.category}
                    </div>
                  </div>
                  <div className="p-2 sm:p-5 flex-1 flex flex-col justify-between space-y-1 sm:space-y-3">
                    <div>
                      <span className="text-[8px] sm:text-[11px] text-slate-400 block mb-0.5">
                        {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <h3 className="text-[10px] sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-tight sm:leading-normal">
                        {article.title}
                      </h3>
                    </div>
                    <span className="text-[8px] sm:text-xs font-bold text-sky-400 hidden sm:flex items-center gap-1 pt-1">
                      Baca Selengkapnya <ArrowRight className="w-3.5 h-3.5" />
                    </span>
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
      {clubMode === 'community' && (
        <div className="space-y-8 sm:space-y-16 animate-fadeIn">
          
          {/* FEATURED FUN MATCH SCORECARD */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 -mt-6 sm:-mt-20 relative z-20">
            {nextFunMatch ? (
              <Link
                href={`/community/matches/${nextFunMatch.id}`}
                className="block group glass-panel p-3 sm:p-8 rounded-xl sm:rounded-2xl border border-amber-400/30 hover:border-amber-400/60 shadow-2xl shadow-slate-950 hover:shadow-amber-500/10 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-4 mb-3 sm:mb-6">
                  {nextFunMatch.status === 'live' ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/50 text-[10px] sm:text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> LIVE FUN MATCH
                    </span>
                  ) : nextFunMatch.status === 'finished' ? (
                    <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-white group-hover:text-amber-300 transition-colors">
                      Hasil Fun Match Terakhir
                    </h3>
                  ) : (
                    <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-amber-400 group-hover:text-white transition-colors">
                      Jadwal Fun Match Komunitas
                    </h3>
                  )}
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[9px] sm:text-xs font-medium text-slate-400">
                      {formatWibDate(nextFunMatch.matchDate)} • {formatWibTime(nextFunMatch.matchDate)} WIB
                    </span>
                    <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-400/30">
                      SOCCER COMMUNITY
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 sm:gap-6 items-center text-center">
                  
                  {/* Team A */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-1 sm:gap-4">
                    <div className="order-2 sm:order-1 text-center sm:text-right">
                      <h4 className="text-[10px] sm:text-xl font-black text-sky-300 uppercase group-hover:text-sky-200 transition-colors">
                        {nextFunMatch.teamAName}
                      </h4>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Tim A</span>
                    </div>
                    <div className="order-1 sm:order-2 w-10 sm:w-16 h-10 sm:h-16 rounded-2xl bg-blue-950/80 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-lg sm:text-2xl shadow-lg">
                      A
                    </div>
                  </div>

                  {/* Score */}
                  <div className="space-y-0.5 sm:space-y-2">
                    {nextFunMatch.status === 'finished' ? (
                      <>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">FULL TIME</p>
                        <div className="text-xl sm:text-5xl font-black font-mono text-amber-400 tracking-widest">
                          {nextFunMatch.teamAScore ?? 0} : {nextFunMatch.teamBScore ?? 0}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[9px] sm:text-[11px] text-slate-400 font-medium">
                          {formatWibTime(nextFunMatch.matchDate)} WIB
                        </p>
                        <div className="inline-block px-2.5 sm:px-5 py-0.5 sm:py-2 rounded-lg sm:rounded-xl bg-amber-600/30 text-amber-300 font-black text-xs sm:text-2xl border border-amber-400/50">
                          VS
                        </div>
                      </>
                    )}
                    <p className="text-[8px] sm:text-[10px] text-slate-400 truncate max-w-xs mx-auto">📍 {nextFunMatch.venue}</p>
                  </div>

                  {/* Team B */}
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1 sm:gap-4">
                    <div className="w-10 sm:w-16 h-10 sm:h-16 rounded-2xl bg-amber-950/80 border border-amber-400/40 flex items-center justify-center text-amber-400 font-black text-lg sm:text-2xl shadow-lg">
                      B
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-[10px] sm:text-xl font-black text-amber-300 uppercase group-hover:text-amber-200 transition-colors">
                        {nextFunMatch.teamBName}
                      </h4>
                      <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase">Tim B</span>
                    </div>
                  </div>

                </div>
              </Link>
            ) : (
              <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-amber-500/30 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
                <h3 className="text-base sm:text-lg font-black uppercase text-white">Jadwal Fun Match Segera Dirilis</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Fun match mingguan Soccer Community Mariners SC akan segera dijadwalkan oleh admin.
                </p>
              </div>
            )}
          </section>

          {/* 3 PERTANDINGAN FUN MATCH TERAKHIR */}
          {recentFunMatches.length > 0 && (
            <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-amber-400 inline-block" />
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white">
                  Hasil Fun Match Terakhir
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentFunMatches.map((fm: any) => (
                  <Link
                    key={fm.id}
                    href={`/community/matches/${fm.id}`}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 transition-all block group space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold border-b border-slate-900 pb-2">
                      <span>{formatWibDate(fm.matchDate)}</span>
                      <span className="text-amber-400 group-hover:underline">Lihat Detail ↗</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-extrabold text-xs text-sky-300 uppercase">{fm.teamAName}</span>
                      <span className="px-3 py-1 rounded-xl bg-slate-900 font-mono font-black text-sm text-white border border-slate-700">
                        {fm.teamAScore ?? 0} : {fm.teamBScore ?? 0}
                      </span>
                      <span className="font-extrabold text-xs text-amber-300 uppercase">{fm.teamBName}</span>
                    </div>
                    <p className="text-[9px] text-slate-500 truncate">📍 {fm.venue}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* COMMUNITY STATS OVERVIEW */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="glass-panel p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-amber-400/20 bg-gradient-to-b from-[#131109] via-[#0b0c14] to-[#060b14]">
              <div className="text-center max-w-xl mx-auto mb-3 sm:mb-6 space-y-0.5">
                <h2 className="text-base sm:text-2xl font-black uppercase text-amber-300">Statistik Soccer Community</h2>
                <p className="text-[9px] sm:text-xs text-slate-300">Aktivitas dan pencapaian seluruh member komunitas</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-amber-500/20 text-center">
                <div>
                  <span className="text-2xl sm:text-4xl font-black font-mono text-amber-300">{totalMembers}</span>
                  <span className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-400 mt-1">Total Member</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-4xl font-black font-mono text-white">{totalFunMatches}</span>
                  <span className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-400 mt-1">Fun Match Dimainkan</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-4xl font-black font-mono text-sky-400">{totalCommunityGoals}</span>
                  <span className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-400 mt-1">Total Gol Komunitas</span>
                </div>
                <div>
                  <span className="text-base sm:text-xl font-black text-amber-400 truncate block">{topScorerName}</span>
                  <span className="block text-[9px] sm:text-[11px] font-bold uppercase text-slate-400 mt-1">Top Scorer ({topScorerGoals} Gol)</span>
                </div>
              </div>
            </div>
          </section>

          {/* SOCCER COMMUNITY MEMBERS SQUAD GRID - 4:5 EXACT LAYOUT */}
          <section className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 space-y-3 sm:space-y-8">
            <div className="flex items-end justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  SOCCER COMMUNITY ROSTER
                </span>
                <h2 className="text-base sm:text-3xl font-black uppercase text-white mt-0.5">
                  Skuad Member Komunitas
                </h2>
              </div>
              <Link
                href="/community"
                className="text-[9px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-white flex items-center gap-0.5"
              >
                Buka Portal Member <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {communityMembers.length === 0 ? (
              <div className="text-center py-12 glass-panel rounded-2xl border border-slate-800 space-y-3">
                <Users className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400">Belum ada member komunitas terdaftar.</p>
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
                    className="group relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden border border-amber-400/20 hover:border-amber-400/60 shadow-xl card-glow-hover flex flex-col justify-end"
                  >
                    {/* Member Photo */}
                    <img
                      src={member.photoUrl || '/playertemplate.png'}
                      alt={member.fullName}
                      className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Tier Pill Top Left */}
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 font-extrabold uppercase text-[8px] sm:text-[9px] tracking-wider shadow">
                      {member.tier}
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#060b14]/95 via-[#060b14]/60 to-transparent pointer-events-none" />

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
            <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-950/30 via-slate-950 to-blue-950/30 text-center space-y-6 shadow-2xl">
              <div className="space-y-2 max-w-xl mx-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  GABUNG SOCCER COMMUNITY
                </span>
                <h3 className="text-xl sm:text-3xl font-black uppercase text-white">
                  Ingin Bergabung Bermain Bersama Kami?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  Dapatkan pengalaman fun match mingguan, statistik resmi web, nomor punggung eksklusif, dan kesempatan ditarik bermain di Skuad Utama Mariners SC!
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowRegModal(true)}
                  className="px-6 py-3 rounded-xl font-extrabold uppercase white-blue-btn text-xs shadow-lg shadow-sky-500/20"
                >
                  Daftar Jadi Member Sekarang
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-6 py-3 rounded-xl font-bold uppercase text-white glass-panel border border-slate-700 hover:border-amber-400 hover:text-amber-300 transition-all text-xs"
                >
                  Login Portal Member
                </button>
                <Link
                  href="/community"
                  className="px-6 py-3 rounded-xl font-bold uppercase text-slate-400 hover:text-white bg-slate-900 border border-slate-800 text-xs"
                >
                  Lihat Detail Paket & Biaya →
                </Link>
              </div>
            </div>
          </section>

        </div>
      )}

      {/* REGISTRATION & LOGIN MODALS */}
      <CommunityRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onOpenLogin={() => {
          setShowRegModal(false);
          setShowLoginModal(true);
        }}
        onSuccess={() => {
          setShowRegModal(false);
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

    </div>
  );
}
