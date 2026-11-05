import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { convertToIco } from '@/lib/favicon';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format');
  const isIco = format === 'ico';

  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });

    const logo = setting?.teamLogo;
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/webp';

    // 1. Base64 data URI
    if (logo && logo.startsWith('data:')) {
      const match = logo.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      }
    }

    // 2. Local public file path (e.g. /marinerssc.webp, /uploads/...)
    if (!imageBuffer && logo && logo.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', logo.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        imageBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        if (ext === '.svg') mimeType = 'image/svg+xml';
        if (ext === '.ico') mimeType = 'image/x-icon';
      }
    }

    // 3. Fallback to marinerssc.webp or defaultteam.webp
    if (!imageBuffer) {
      const candidates = ['marinerssc.webp', 'defaultteam.webp'];
      for (const cand of candidates) {
        const fallbackPath = path.join(process.cwd(), 'public', cand);
        if (fs.existsSync(fallbackPath)) {
          imageBuffer = fs.readFileSync(fallbackPath);
          mimeType = 'image/webp';
          break;
        }
      }
    }

    if (imageBuffer) {
      // Dynamic on-the-fly conversion to real ICO container
      if (isIco) {
        try {
          const icoBuffer = await convertToIco(imageBuffer);
          return new NextResponse(new Uint8Array(icoBuffer), {
            headers: {
              'Content-Type': 'image/x-icon',
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
          });
        } catch (icoErr) {
          console.warn('Error converting to ICO in team-logo route, fallback to raw buffer:', icoErr);
        }
      }

      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }
  } catch (err) {
    console.warn('Error serving dynamic team logo / favicon:', err);
  }

  return new NextResponse(null, { status: 404 });
}
