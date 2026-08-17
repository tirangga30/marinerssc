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

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        category: data.category,
        thumbnail: data.thumbnail || (Array.isArray(data.images) && data.images[0]) || '/stadium_hero.png',
        images: Array.isArray(data.images) ? JSON.stringify(data.images) : (typeof data.images === 'string' ? data.images : null),
        content: data.content,
        publishedAt: data.publishedAt ? parseWibDate(data.publishedAt) : new Date(),
      },
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
