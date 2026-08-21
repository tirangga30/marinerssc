import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

/**
 * Recursively gets all files in a directory.
 */
function getAllFilesRecursive(dir: string): string[] {
  let results: string[] = [];
  try {
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir);
    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getAllFilesRecursive(filePath));
      } else {
        results.push(filePath);
      }
    }
  } catch {}
  return results;
}

/**
 * Removes empty directories recursively.
 */
function removeEmptyDirsRecursive(dir: string, baseDir: string) {
  try {
    if (!fs.existsSync(dir) || dir === baseDir) return;

    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      fs.rmdirSync(dir);
      removeEmptyDirsRecursive(path.dirname(dir), baseDir);
    }
  } catch {}
}

/**
 * Utility to sweep public/uploads (and all subfolders recursively)
 * and delete files that are not referenced anywhere in the database.
 */
export async function cleanupUnusedUploads(): Promise<{
  deletedCount: number;
  freedBytes: number;
  deletedFiles: string[];
}> {
  // Skip on Vercel read-only filesystem
  if (process.env.VERCEL) {
    return { deletedCount: 0, freedBytes: 0, deletedFiles: [] };
  }

  const uploadsBaseDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsBaseDir)) {
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

  // 2. Read all files recursively in public/uploads
  let deletedCount = 0;
  let freedBytes = 0;
  const deletedFiles: string[] = [];

  const allFiles = getAllFilesRecursive(uploadsBaseDir);

  for (const fullPath of allFiles) {
    const relativeToPublic = path.relative(path.join(process.cwd(), 'public'), fullPath);
    const relUrl = '/' + relativeToPublic.replace(/\\/g, '/');

    if (!referenced.has(relUrl)) {
      try {
        const stat = fs.statSync(fullPath);
        freedBytes += stat.size;
        fs.unlinkSync(fullPath);
        deletedCount++;
        deletedFiles.push(relUrl);

        removeEmptyDirsRecursive(path.dirname(fullPath), uploadsBaseDir);
      } catch (err) {
        console.warn(`Could not delete file ${relUrl}:`, err);
      }
    }
  }

  return { deletedCount, freedBytes, deletedFiles };
}
