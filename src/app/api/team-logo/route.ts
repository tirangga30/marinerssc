import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const logo = setting?.teamLogo;

    // 1. Base64 data URI
    if (logo && logo.startsWith('data:')) {
      const match = logo.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      }
    }

    // 2. Local public file path (e.g. /marinerssc.webp, /uploads/...)
    if (logo && logo.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', logo.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        let mime = 'image/webp';
        if (ext === '.png') mime = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mime = 'image/jpeg';
        if (ext === '.svg') mime = 'image/svg+xml';
        if (ext === '.ico') mime = 'image/x-icon';

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mime,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
      }
    }
  } catch (err) {
    console.warn('Error serving team logo:', err);
  }

  // 3. Fallback to default marinerssc.webp
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'marinerssc.webp');
    if (fs.existsSync(fallbackPath)) {
      const buffer = fs.readFileSync(fallbackPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch {}

  return new NextResponse(null, { status: 404 });
}

