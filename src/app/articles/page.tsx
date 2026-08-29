import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ArrowRight, Calendar } from 'lucide-react';
import { getMainThumbnail } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'all';
  const query = params.search || '';

  const articles = await prisma.article.findMany({
    where: { isHidden: false },
    orderBy: { publishedAt: 'desc' },
  });

  const filteredArticles = articles.filter((article) => {
    const matchCategory = category === 'all' || article.category === category;
    const matchSearch =
      !query ||
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.content.toLowerCase().includes(query.toLowerCase());
    return matchCategory && matchSearch;
  });

  const categories = ['Laporan Pertandingan', 'Kabar Tim', 'Klub'];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-5 sm:p-8 rounded-2xl border border-sky-400/20 text-center space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-sky-400">Pemberitaan Resmi Klub</span>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-white blue-gradient-text">
          Kabar & Berita Mariners SC
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Informasi terkini laporan laga, kabar kebugaran pemain, pengumuman klub, dan aktivitas tim.
        </p>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        <Link
          href="/articles?category=all"
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
            category === 'all'
              ? 'white-blue-btn'
              : 'glass-panel text-slate-300 hover:text-sky-300'
          }`}
        >
          Semua
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/articles?category=${encodeURIComponent(cat)}`}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
              category === cat
                ? 'white-blue-btn'
                : 'glass-panel text-slate-300 hover:text-sky-300'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {/* Articles Grid - 3 COLUMNS SIDE-BY-SIDE ON MOBILE */}
      <div className="grid grid-cols-3 md:grid-cols-3 gap-2 sm:gap-6">
        {filteredArticles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group glass-panel rounded-lg sm:rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col justify-between"
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

            <div className="p-2 sm:p-5 space-y-1 sm:space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[8px] sm:text-[11px] text-slate-400 flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-sky-400" />
                  {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <h3 className="text-[10px] sm:text-base font-bold text-white group-hover:text-sky-300 transition-colors line-clamp-2 leading-tight sm:leading-normal">
                  {article.title}
                </h3>
              </div>

              <div className="pt-1 sm:pt-3 border-t border-slate-800 hidden sm:flex items-center justify-between text-xs font-bold text-sky-400">
                <span>Baca Selengkapnya</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
