import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedFolder = formData.get('folder') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });
    }

    // Allowed subfolders: players, matches, articles, general
    const validFolders = ['players', 'matches', 'articles', 'general'];
    const targetFolder = requestedFolder && validFolders.includes(requestedFolder.toLowerCase())
      ? requestedFolder.toLowerCase()
      : 'general';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory public/uploads/{folder} if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', targetFolder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${targetFolder}/${fileName}`;

    return NextResponse.json({ url: publicUrl, success: true });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal mengunggah foto' },
      { status: 500 }
    );
  }
}
