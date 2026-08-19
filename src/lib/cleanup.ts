import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

/**
 * Utility to sweep public/uploads and delete files that are not referenced
 * anywhere in the database (Player photoUrl, FootballMatch opponentLogo, Article thumbnail & images).
 */
export async function cleanupUnusedUploads(): Promise<{
  deletedCount: number;
  freedBytes: number;
  deletedFiles: string[];
}> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    return { deletedCount: 0, freedBytes: 0, deletedFiles: [] };
  }

  // 1. Gather all referenced image URLs in the database
  const referenced = new Set<string>();

  try {
    const players = await prisma.player.findMany({ select: { photoUrl: true } });
    players.forEach((p) => {
      if (p.photoUrl) referenced.add(p.photoUrl.trim());
    });

    const matches = await prisma.footballMatch.findMany({ select: { opponentLogo: true } });
    matches.forEach((m) => {
      if (m.opponentLogo) referenced.add(m.opponentLogo.trim());
    });

    const articles = await prisma.article.findMany({ select: { thumbnail: true, images: true } });
    articles.forEach((a) => {
      if (a.thumbnail) {
        a.thumbnail.split('|||').forEach((t) => referenced.add(t.trim()));
      }
      if (a.images) {
        try {
          const arr = JSON.parse(a.images);
          if (Array.isArray(arr)) {
            arr.forEach((img: string) => {
              if (typeof img === 'string') referenced.add(img.trim());
            });
          }
        } catch {}
      }
    });
  } catch (error) {
    console.error('Error fetching referenced images from DB:', error);
  }

  // 2. Read files in public/uploads
  let deletedCount = 0;
  let freedBytes = 0;
  const deletedFiles: string[] = [];

  try {
    const files = fs.readdirSync(uploadsDir);
    for (const filename of files) {
      const fullPath = path.join(uploadsDir, filename);
      const relUrl = `/uploads/${filename}`;

      // If file is not referenced in database, remove it
      if (!referenced.has(relUrl)) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            freedBytes += stat.size;
            fs.unlinkSync(fullPath);
            deletedCount++;
            deletedFiles.push(filename);
          }
        } catch (err) {
          console.error(`Gagal menghapus file ${filename}:`, err);
        }
      }
    }
  } catch (err) {
    console.error('Error reading uploads directory:', err);
  }

  return { deletedCount, freedBytes, deletedFiles };
}
