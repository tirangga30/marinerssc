import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Calendar, ArrowLeft, Share2, Tag } from 'lucide-react';

export const revalidate = 0;

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      


      <article className="glass-panel p-6 sm:p-10 rounded-3xl border border-sky-400/30 space-y-8">
        
        {/* Category & Meta */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md bg-sky-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow">
              {article.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase text-slate-100 blue-gradient-text leading-tight">
            {article.title}
          </h1>
        </div>

        {/* Thumbnail Image */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
          <img
            src={article.thumbnail}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
          {article.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl font-bold uppercase text-sky-400 pt-4 border-b border-slate-800 pb-2">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={idx} className="text-lg font-bold text-slate-200 pt-2">
                  {paragraph.replace('#### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('> ')) {
              return (
                <blockquote key={idx} className="p-4 rounded-xl glass-panel border-l-4 border-sky-500 text-sky-300 italic">
                  {paragraph.replace('> ', '')}
                </blockquote>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

      </article>

    </div>
  );
}
