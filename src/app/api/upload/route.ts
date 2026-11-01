import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { sanitizeFilename, getPosShort } from '@/lib/fileNaming';
import { uploadToCloud, getActiveCloudProvider } from '@/lib/cloudStorage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const validFolders = ['players', 'matches', 'articles', 'members', 'general', 'team', 'posters', 'wallpapers'];
    const targetFolder = requestedFolder && validFolders.includes(requestedFolder.toLowerCase())
      ? requestedFolder.toLowerCase()
      : 'general';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert raster images to modern, optimized WebP format
    let finalBuffer = buffer;
    let finalExt = '.webp';
    let mimeType = 'image/webp';

    const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
    if (isSvg) {
      finalExt = '.svg';
      mimeType = 'image/svg+xml';
    } else {
      try {
        let sharpPipeline = sharp(buffer).rotate(); // auto-orient based on EXIF

        // Smart max-dimensions based on use case to prevent megabyte-scale bloat
        if (targetFolder === 'matches' || targetFolder === 'team') {
          // Team & opponent logos: max 400x400
          sharpPipeline = sharpPipeline.resize(400, 400, { fit: 'inside', withoutEnlargement: true });
        } else if (targetFolder === 'players' || targetFolder === 'members') {
          // Player & member profile cards: max 800x1000
          sharpPipeline = sharpPipeline.resize(800, 1000, { fit: 'inside', withoutEnlargement: true });
        } else if (targetFolder === 'posters' || targetFolder === 'wallpapers') {
          // Hero posters: max 1600x900
          sharpPipeline = sharpPipeline.resize(1600, 900, { fit: 'inside', withoutEnlargement: true });
        } else {
          // Articles & general: max 1200x800
          sharpPipeline = sharpPipeline.resize(1200, 800, { fit: 'inside', withoutEnlargement: true });
        }

        finalBuffer = await sharpPipeline
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
      } catch (convErr) {
        console.warn('Sharp webp conversion fallback:', convErr);
        const originalExt = path.extname(file.name) || '.jpg';
        finalExt = originalExt.toLowerCase();
        mimeType = file.type || 'image/jpeg';
      }
    }

    let targetDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    let fileName = '';
    let publicUrl = '';
    let cloudPath = '';

    if (targetFolder === 'players') {
      const position = formData.get('position') as string | null;
      const number = formData.get('number') as string | null;
      const playerName = formData.get('playerName') as string | null;
      const customName = formData.get('customName') as string | null;

      const pos = getPosShort(position);
      const num = number ? String(number).trim() : '0';
      const name = playerName ? sanitizeFilename(playerName) : (customName ? sanitizeFilename(customName) : `Player_${Date.now()}`);

      fileName = `${pos}_${num}_${name}${finalExt}`;
      publicUrl = `/uploads/players/${fileName}`;
      cloudPath = `players/${fileName}`;
    } else if (targetFolder === 'members') {
      const position = formData.get('position') as string | null;
      const number = formData.get('number') as string | null;
      const playerName = formData.get('playerName') as string | null;
      const customName = formData.get('customName') as string | null;

      const pos = getPosShort(position);
      const num = number ? String(number).trim() : '';
      const name = playerName ? sanitizeFilename(playerName) : (customName ? sanitizeFilename(customName) : `Member_${Date.now()}`);

      fileName = num ? `M_${pos}_${num}_${name}_${Date.now()}${finalExt}` : `M_${name}_${Date.now()}${finalExt}`;
      publicUrl = `/uploads/members/${fileName}`;
      cloudPath = `members/${fileName}`;
    } else if (targetFolder === 'matches') {
      const opponentName = formData.get('opponentName') as string | null;
      const customName = formData.get('customName') as string | null;

      const opp = opponentName ? sanitizeFilename(opponentName) : (customName ? sanitizeFilename(customName) : `Opponent_${Date.now()}`);
      fileName = `${opp}${finalExt}`;
      publicUrl = `/uploads/matches/${fileName}`;
      cloudPath = `matches/${fileName}`;
    } else if (targetFolder === 'articles') {
      const articleSlug = formData.get('articleSlug') as string | null;
      const articleTitle = formData.get('articleTitle') as string | null;
      const slotIndex = formData.get('slotIndex') as string | null;

      let slug = articleSlug;
      if (!slug && articleTitle) {
        slug = articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      if (!slug) {
        slug = `article-${Date.now()}`;
      }
      slug = slug.toLowerCase().replace(/[^a-z0-9_-]+/g, '');

      targetDir = path.join(process.cwd(), 'public', 'uploads', 'articles', slug);
      const slotNum = slotIndex !== null && slotIndex !== undefined && slotIndex !== '' ? parseInt(slotIndex) + 1 : 1;
      fileName = `foto_${slotNum}_${Date.now()}${finalExt}`;
      publicUrl = `/uploads/articles/${slug}/${fileName}`;
      cloudPath = `articles/${slug}/${fileName}`;
    } else {
      const baseNameWithoutExt = path.parse(file.name).name;
      const cleanFileName = sanitizeFilename(baseNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_'));
      fileName = `${Date.now()}-${cleanFileName}${finalExt}`;
      publicUrl = `/uploads/${targetFolder}/${fileName}`;
      cloudPath = `${targetFolder}/${fileName}`;
    }

    // 1. Try uploading to Cloud Storage (Vercel Blob or Cloudinary)
    const activeProvider = getActiveCloudProvider();
    if (activeProvider !== 'none') {
      const cloudUrl = await uploadToCloud({
        buffer: finalBuffer,
        pathname: cloudPath,
        mimeType,
      });

      if (cloudUrl) {
        return NextResponse.json({ url: cloudUrl, provider: activeProvider, success: true });
      }
    }

    // 2. On local server / development, write to public/uploads
    if (!process.env.VERCEL) {
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const filePath = path.join(targetDir, fileName);
        await fs.promises.writeFile(filePath, finalBuffer);
        return NextResponse.json({ url: publicUrl, provider: 'local', success: true });
      } catch (fsErr) {
        console.warn('Local fs write failed, checking fallback:', fsErr);
      }
    }

    // 3. Fallback on Vercel if cloud credentials are not yet configured:
    // Compress heavily into a compact Data URL (< 30 KB) so it NEVER damages Neon DB quota.
    let compactBuffer = finalBuffer;
    if (!isSvg) {
      try {
        compactBuffer = await sharp(finalBuffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 60, effort: 4 })
          .toBuffer();
      } catch {}
    }
    const safeDataUrl = `data:${mimeType};base64,${compactBuffer.toString('base64')}`;

    console.warn(
      '[Upload] Running on Vercel without BLOB_READ_WRITE_TOKEN or Cloudinary keys. ' +
      'Please configure Vercel Blob or Cloudinary in your Vercel Environment Variables.'
    );

    return NextResponse.json({
      url: safeDataUrl,
      provider: 'compact-base64-fallback',
      warning: 'Connect Vercel Blob or Cloudinary for optimal storage.',
      success: true,
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengunggah foto' },
      { status: 500 }
    );
  }
}
