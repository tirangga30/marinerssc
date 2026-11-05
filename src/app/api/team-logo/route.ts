import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '@/lib/db';
import { convertToIco } from '@/lib/favicon';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    let mimeType = 'image/png';

    // 1. Base64 data URI
    if (logo && logo.startsWith('data:')) {
      const match = logo.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        imageBuffer = Buffer.from(match[2], 'base64');
      }
    }

    // 2. Remote URL (Vercel Blob, Cloudinary, etc.)
    if (!imageBuffer && logo && (logo.startsWith('http://') || logo.startsWith('https://'))) {
      try {
        const resp = await fetch(logo);
        if (resp.ok) {
          const arrBuf = await resp.arrayBuffer();
          imageBuffer = Buffer.from(arrBuf);
          const ct = resp.headers.get('content-type');
          if (ct) mimeType = ct;
        }
      } catch (fErr) {
        console.warn('Failed to fetch remote teamLogo:', fErr);
      }
    }

    // 3. Local public file path (e.g. /uploads/..., /marinerssc.webp, etc.)
    if (!imageBuffer && logo && logo.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', logo.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        imageBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        if (ext === '.svg') mimeType = 'image/svg+xml';
        if (ext === '.webp') mimeType = 'image/webp';
        if (ext === '.ico') mimeType = 'image/x-icon';
      }
    }

    // 4. Fallback to default team crests
    if (!imageBuffer) {
      const candidates = ['defaultteam.webp', 'marinerssc.webp'];
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
      // If ICO requested: convert to real 32x32 ICO container
      if (isIco) {
        try {
          const icoBuffer = await convertToIco(imageBuffer);
          return new NextResponse(new Uint8Array(icoBuffer), {
            headers: {
              'Content-Type': 'image/x-icon',
              'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
            },
          });
        } catch (icoErr) {
          console.warn('Error converting to ICO in team-logo route:', icoErr);
        }
      }

      // If PNG / standard icon requested: ensure square PNG
      try {
        const squarePng = await sharp(imageBuffer)
          .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        return new NextResponse(new Uint8Array(squarePng), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          },
        });
      } catch {
        // Fallback to original buffer
        return new NextResponse(new Uint8Array(imageBuffer), {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          },
        });
      }
    }
  } catch (err) {
    console.warn('Error serving dynamic team logo / favicon:', err);
  }

  return new NextResponse(null, { status: 404 });
}
