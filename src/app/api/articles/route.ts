import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

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
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug,
        category: data.category || 'Kabar Tim',
        thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        content: data.content,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah artikel' }, { status: 500 });
  }
}
