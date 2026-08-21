import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { parseWibDate } from '@/lib/date';
import { cleanupUnusedUploads } from '@/lib/cleanup';

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
    });
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil artikel' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const data = await req.json();
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) slug = `article-${Date.now()}`;

    const existingWithSlug = await prisma.article.findUnique({
      where: { slug },
    });
    if (existingWithSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    let validPhotos: string[] = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      validPhotos = data.images.filter(Boolean);
    } else if (data.thumbnail) {
      validPhotos = [data.thumbnail];
    }

    const thumbnailValue = validPhotos.length > 0 ? validPhotos.join('|||') : '/LOGIN.jpeg';

    const articleData: any = {
      title: data.title,
      slug,
      category: data.category || 'Kabar Tim',
      thumbnail: thumbnailValue,
      content: data.content,
      publishedAt: data.publishedAt ? parseWibDate(data.publishedAt) : new Date(),
    };

    const article = await prisma.article.create({
      data: articleData,
    });

    await cleanupUnusedUploads();

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: error?.message || 'Gagal menambah artikel' }, { status: 500 });
  }
}
