import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { unstable_cache } from 'next/cache';
import { ArrowRight, Calendar } from 'lucide-react';
import { getMainThumbnail } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

const getCachedArticles = unstable_cache(
  async () => {
    try {
      return await prisma.article.findMany({
        where: { isHidden: false },
        orderBy: { publishedAt: 'desc' },
      });
    } catch (e) {
      console.warn('Database unreachable in getCachedArticles, fallback to empty array:', e);
      return [];
    }
  },
  ['mariners-articles-page-cache'],
  { revalidate: 3600, tags: ['articles'] }
);

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const category = params.category || 'all';
  const query = params.search || '';

  const articles = await getCachedArticles();

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
      

      {/* Category Filter Bar (Navbar Underline Style) */}
      <div className="flex items-center justify-start gap-4 sm:gap-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <Link
          href="/articles?category=all"
          className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
            category === 'all'
              ? 'text-blue-600 border-blue-600 font-black'
              : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Semua
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/articles?category=${encodeURIComponent(cat)}`}
            className={`pb-2.5 sm:pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 shrink-0 ${
              category === cat
                ? 'text-blue-600 border-blue-600 font-black'
                : 'text-slate-500 border-transparent hover:text-slate-900 hover:border-slate-300'
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

    </div>
  );
}
