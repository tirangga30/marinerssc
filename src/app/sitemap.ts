import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://marinerssc.vercel.app';

  // Halaman Utama & Halaman Statis
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  // Halaman Profil Pemain Dinamis
  let playerRoutes: MetadataRoute.Sitemap = [];
  try {
    const players = await prisma.player.findMany({
      select: { slug: true, updatedAt: true },
    });
    playerRoutes = players.map((p) => ({
      url: `${baseUrl}/players/${p.slug}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Error generating player sitemap:', err);
  }

  // Halaman Berita / Artikel Dinamis
  let articleRoutes: MetadataRoute.Sitemap = [];
  try {
    const articles = await prisma.article.findMany({
      where: { isHidden: false },
      select: { slug: true, updatedAt: true },
    });
    articleRoutes = articles.map((a) => ({
      url: `${baseUrl}/articles/${a.slug}`,
      lastModified: a.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (err) {
    console.error('Error generating article sitemap:', err);
  }

  // Halaman Pertandingan Dinamis
  let matchRoutes: MetadataRoute.Sitemap = [];
  try {
    const matches = await prisma.footballMatch.findMany({
      select: { id: true, updatedAt: true },
    });
    matchRoutes = matches.map((m) => ({
      url: `${baseUrl}/matches/${m.id}`,
      lastModified: m.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (err) {
    console.error('Error generating match sitemap:', err);
  }

  return [...staticRoutes, ...playerRoutes, ...articleRoutes, ...matchRoutes];
}
