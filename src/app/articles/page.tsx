import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Newspaper, Search, ArrowRight, Calendar } from 'lucide-react';

export const revalidate = 0;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'all';
  const query = params.search || '';

  const articles = await prisma.article.findMany({
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-2xl border border-amber-500/20 text-center space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Pemberitaan Resmi Klub</span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-slate-100 gold-gradient-text">
          Kabar & Berita Mariners FC
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Informasi terkini laporan laga, kabar kebugaran pemain, pengumuman klub, dan aktivitas tim.
        </p>
      </div>

      {/* Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/articles?category=all"
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              category === 'all'
                ? 'gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20'
                : 'glass-panel text-slate-300 hover:text-amber-400'
            }`}
          >
            Semua Berita
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/articles?category=${encodeURIComponent(cat)}`}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                category === cat
                  ? 'gold-gradient-bg text-slate-950 shadow-md shadow-amber-500/20'
                  : 'glass-panel text-slate-300 hover:text-amber-400'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${article.slug}`}
            className="group glass-panel rounded-2xl overflow-hidden border border-slate-800 card-glow-hover flex flex-col justify-between"
          >
            <div className="relative h-52 overflow-hidden bg-slate-900">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                {article.category}
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-amber-400">
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
