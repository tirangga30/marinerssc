import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { parseWibDate } from '@/lib/date';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    let slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) slug = `article-${Date.now()}`;

    const existingWithSlug = await prisma.article.findFirst({
      where: { slug, NOT: { id } },
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

    const thumbnailValue = validPhotos.length > 0 ? validPhotos.join('|||') : '/stadium_hero.png';

    const articleData: any = {
      title: data.title,
      slug,
      category: data.category,
      thumbnail: thumbnailValue,
      content: data.content,
      publishedAt: data.publishedAt ? parseWibDate(data.publishedAt) : new Date(),
    };

    const article = await prisma.article.update({
      where: { id },
      data: articleData,
    });

    return NextResponse.json(article);
  } catch (error: any) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: error?.message || 'Gagal memperbarui artikel' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.article.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghapus artikel' }, { status: 500 });
  }
}
