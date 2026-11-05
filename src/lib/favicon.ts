import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Packs a 32x32 PNG buffer into standard ICO container format.
 */
export function createIcoFromPng(pngBuffer: Buffer, size = 32): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size === 256 ? 0 : size, 0);
  dirEntry.writeUInt8(size === 256 ? 0 : size, 1);
  dirEntry.writeUInt8(0, 2); // palette
  dirEntry.writeUInt8(0, 3); // reserved
  dirEntry.writeUInt16LE(1, 4); // color planes
  dirEntry.writeUInt16LE(32, 6); // 32 bits per pixel
  dirEntry.writeUInt32LE(pngBuffer.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12); // image offset

  return Buffer.concat([header, dirEntry, pngBuffer]);
}

/**
 * Converts any image buffer (PNG, WebP, JPG, SVG, etc.) into a 32x32 transparent square ICO buffer.
 */
export async function convertToIco(inputBuffer: Buffer): Promise<Buffer> {
  const png32 = await sharp(inputBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return createIcoFromPng(png32, 32);
}

/**
 * Regenerates all physical favicon files in public/ and src/app/ from a source image buffer.
 * Safely ignores write errors if the filesystem is read-only (e.g. serverless Vercel).
 */
export async function syncFaviconFiles(sourceBuffer: Buffer, rootDir = process.cwd()): Promise<void> {
  try {
    const icoBuf = await convertToIco(sourceBuffer);

    // 1. Write public/favicon.ico
    const publicIco = path.join(rootDir, 'public', 'favicon.ico');
    fs.writeFileSync(publicIco, icoBuf);

    // 2. Write src/app/favicon.ico if directory exists
    const appIco = path.join(rootDir, 'src', 'app', 'favicon.ico');
    if (fs.existsSync(path.dirname(appIco))) {
      fs.writeFileSync(appIco, icoBuf);
    }

    // 3. Write src/app/icon.png (512x512)
    const png512 = await sharp(sourceBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const appIconPng = path.join(rootDir, 'src', 'app', 'icon.png');
    if (fs.existsSync(path.dirname(appIconPng))) {
      fs.writeFileSync(appIconPng, png512);
    }

    // 4. Write src/app/apple-icon.png (180x180)
    const png180 = await sharp(sourceBuffer)
      .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const appAppleIcon = path.join(rootDir, 'src', 'app', 'apple-icon.png');
    if (fs.existsSync(path.dirname(appAppleIcon))) {
      fs.writeFileSync(appAppleIcon, png180);
    }
  } catch (err) {
    console.warn('syncFaviconFiles failed (expected in read-only environments):', err);
  }
}
