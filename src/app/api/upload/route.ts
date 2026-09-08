import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { sanitizeFilename, getPosShort } from '@/lib/fileNaming';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    const validFolders = ['players', 'matches', 'articles', 'members', 'general'];
    const targetFolder = requestedFolder && validFolders.includes(requestedFolder.toLowerCase())
      ? requestedFolder.toLowerCase()
      : 'general';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert raster images to modern WebP format
    let finalBuffer = buffer;
    let finalExt = '.webp';
    let mimeType = 'image/webp';

    const isSvg = file.type === 'image/svg+xml' || file.name?.toLowerCase().endsWith('.svg');
    if (isSvg) {
      finalExt = '.svg';
      mimeType = 'image/svg+xml';
    } else {
      try {
        finalBuffer = await sharp(buffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
      } catch (convErr) {
        console.warn('Sharp webp conversion fallback:', convErr);
        const originalExt = path.extname(file.name) || '.jpg';
        finalExt = originalExt.toLowerCase();
        mimeType = file.type || 'image/jpeg';
      }
    }

    const base64DataUrl = `data:${mimeType};base64,${finalBuffer.toString('base64')}`;

    let targetDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    let fileName = '';
    let publicUrl = '';

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
    } else if (targetFolder === 'matches') {
      const opponentName = formData.get('opponentName') as string | null;
      const customName = formData.get('customName') as string | null;

      const opp = opponentName ? sanitizeFilename(opponentName) : (customName ? sanitizeFilename(customName) : `Opponent_${Date.now()}`);
      fileName = `${opp}${finalExt}`;
      publicUrl = `/uploads/matches/${fileName}`;
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

      // Articles have their own subfolder per article title/slug
      targetDir = path.join(process.cwd(), 'public', 'uploads', 'articles', slug);
      const slotNum = slotIndex !== null && slotIndex !== undefined && slotIndex !== '' ? parseInt(slotIndex) + 1 : 1;
      fileName = `foto_${slotNum}_${Date.now()}${finalExt}`;
      publicUrl = `/uploads/articles/${slug}/${fileName}`;
    } else {
      const baseNameWithoutExt = path.parse(file.name).name;
      const cleanFileName = sanitizeFilename(baseNameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_'));
      fileName = `${Date.now()}-${cleanFileName}${finalExt}`;
      publicUrl = `/uploads/general/${fileName}`;
    }

    // If running in Vercel / serverless with read-only filesystem, return Data URL
    if (process.env.VERCEL) {
      return NextResponse.json({ url: base64DataUrl, success: true });
    }

    // On local environment, write to public/uploads
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      const filePath = path.join(targetDir, fileName);
      await fs.promises.writeFile(filePath, finalBuffer);
      return NextResponse.json({ url: publicUrl, success: true });
    } catch (fsErr) {
      console.warn('Local fs write failed, falling back to base64:', fsErr);
      return NextResponse.json({ url: base64DataUrl, success: true });
    }
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengunggah foto' },
      { status: 500 }
    );
  }
}
