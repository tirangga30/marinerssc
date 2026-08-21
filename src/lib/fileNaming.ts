import fs from 'fs';
import path from 'path';

export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/*?:"<>|]/g, '').trim();
}

export function getPosShort(position?: string | null): string {
  const p = (position || '').trim().toUpperCase();
  if (p === 'GK' || p === 'GOALKEEPER') return 'GK';
  if (p === 'DF' || p === 'DEFENDER' || p.includes('CB') || p.includes('LB') || p.includes('RB')) return 'DF';
  if (p === 'MF' || p === 'MIDFIELDER' || p.includes('CM') || p.includes('CAM') || p.includes('CDM')) return 'MF';
  return 'FW';
}

/**
 * Automatically renames player's photo file when position, number, or name changes.
 */
export function renamePlayerPhotoFile(
  currentPhotoUrl: string | null | undefined,
  newPosition: string,
  newNumber: number | string,
  newPlayerName: string
): string | null {
  if (!currentPhotoUrl || !currentPhotoUrl.startsWith('/uploads/players/') || process.env.VERCEL) {
    return currentPhotoUrl || null;
  }

  try {
    const ext = path.extname(currentPhotoUrl) || '.jpg';
    const pos = getPosShort(newPosition);
    const num = String(newNumber).trim();
    const cleanName = sanitizeFilename(newPlayerName);
    const newFileName = `${pos}_${num}_${cleanName}${ext}`;

    const oldDiskPath = path.join(process.cwd(), 'public', currentPhotoUrl.replace(/^\//, '').replace(/\//g, path.sep));
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'players');
    const newDiskPath = path.join(targetDir, newFileName);

    if (fs.existsSync(oldDiskPath) && path.resolve(oldDiskPath) !== path.resolve(newDiskPath)) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.renameSync(oldDiskPath, newDiskPath);
      console.log(`Renamed player photo: ${oldDiskPath} -> ${newDiskPath}`);
    }

    return `/uploads/players/${newFileName}`;
  } catch (err) {
    console.warn('Could not rename player photo file on disk (likely read-only environment):', err);
    return currentPhotoUrl;
  }
}

/**
 * Automatically renames match opponent logo file when opponent name changes.
 */
export function renameMatchLogoFile(
  currentLogoUrl: string | null | undefined,
  newOpponentName: string
): string | null {
  if (!currentLogoUrl || !currentLogoUrl.startsWith('/uploads/matches/') || process.env.VERCEL) {
    return currentLogoUrl || null;
  }

  try {
    const ext = path.extname(currentLogoUrl) || '.png';
    const cleanOpponent = sanitizeFilename(newOpponentName);
    const newFileName = `${cleanOpponent}${ext}`;

    const oldDiskPath = path.join(process.cwd(), 'public', currentLogoUrl.replace(/^\//, '').replace(/\//g, path.sep));
    const targetDir = path.join(process.cwd(), 'public', 'uploads', 'matches');
    const newDiskPath = path.join(targetDir, newFileName);

    if (fs.existsSync(oldDiskPath) && path.resolve(oldDiskPath) !== path.resolve(newDiskPath)) {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.renameSync(oldDiskPath, newDiskPath);
      console.log(`Renamed match logo: ${oldDiskPath} -> ${newDiskPath}`);
    }

    return `/uploads/matches/${newFileName}`;
  } catch (err) {
    console.warn('Could not rename match logo file on disk:', err);
    return currentLogoUrl;
  }
}

/**
 * Automatically renames article subfolder when article slug/title changes.
 */
export function renameArticleFolder(
  oldSlug: string,
  newSlug: string,
  currentThumbnail: string | null | undefined,
  currentImages: string[] | null | undefined
): { newThumbnail: string; newImages: string[] } {
  if (!process.env.VERCEL) {
    const oldFolder = path.join(process.cwd(), 'public', 'uploads', 'articles', oldSlug);
    const newFolder = path.join(process.cwd(), 'public', 'uploads', 'articles', newSlug);

    if (oldSlug !== newSlug && fs.existsSync(oldFolder)) {
      try {
        if (!fs.existsSync(newFolder)) {
          fs.renameSync(oldFolder, newFolder);
          console.log(`Renamed article folder: ${oldFolder} -> ${newFolder}`);
        } else {
          // Move files from old to new folder
          const files = fs.readdirSync(oldFolder);
          for (const file of files) {
            const src = path.join(oldFolder, file);
            const dest = path.join(newFolder, file);
            fs.renameSync(src, dest);
          }
          try { fs.rmdirSync(oldFolder); } catch {}
        }
      } catch (err) {
        console.warn('Could not rename article folder on disk:', err);
      }
    }
  }

  // Update thumbnail & images URLs
  const updateUrl = (url: string) => {
    if (url && url.includes(`/uploads/articles/${oldSlug}/`)) {
      return url.replace(`/uploads/articles/${oldSlug}/`, `/uploads/articles/${newSlug}/`);
    }
    return url;
  };

  let newThumbnail = currentThumbnail || '/LOGIN.jpeg';
  if (newThumbnail.includes('|||')) {
    newThumbnail = newThumbnail.split('|||').map(updateUrl).join('|||');
  } else {
    newThumbnail = updateUrl(newThumbnail);
  }

  let newImages: string[] = [];
  if (Array.isArray(currentImages)) {
    newImages = currentImages.map(updateUrl);
  }

  return { newThumbnail, newImages };
}
