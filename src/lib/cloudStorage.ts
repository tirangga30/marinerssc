import { put } from '@vercel/blob';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL ||
  (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
);

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface CloudUploadOptions {
  buffer: Buffer;
  pathname: string;
  mimeType: string;
}

/**
 * Uploads an image buffer to the active cloud storage provider:
 * 1. Vercel Blob (if BLOB_READ_WRITE_TOKEN is configured)
 * 2. Cloudinary (if CLOUDINARY_URL or keys are configured)
 * Returns the public CDN URL or null if no provider is configured.
 */
export async function uploadToCloud({
  buffer,
  pathname,
  mimeType,
}: CloudUploadOptions): Promise<string | null> {
  // Option 1: Vercel Blob
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      // Normalize pathname to prevent leading slashes
      const cleanPath = pathname.replace(/^\/+/, '');
      const blob = await put(cleanPath, buffer, {
        access: 'public',
        contentType: mimeType,
      });
      return blob.url;
    } catch (err) {
      console.error('[CloudStorage] Vercel Blob upload failed:', err);
    }
  }

  // Option 2: Cloudinary
  if (isCloudinaryConfigured) {
    try {
      const base64Str = `data:${mimeType};base64,${buffer.toString('base64')}`;
      const folderParts = pathname.split('/');
      const filename = folderParts.pop() || 'image';
      const folder = folderParts.join('/') || 'uploads';
      const publicId = filename.replace(/\.[^/.]+$/, '');

      const result = await cloudinary.uploader.upload(base64Str, {
        folder: `marinerssc/${folder}`,
        public_id: publicId,
        overwrite: true,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (err) {
      console.error('[CloudStorage] Cloudinary upload failed:', err);
    }
  }

  return null;
}

export function getActiveCloudProvider(): 'vercel-blob' | 'cloudinary' | 'none' {
  if (process.env.BLOB_READ_WRITE_TOKEN) return 'vercel-blob';
  if (isCloudinaryConfigured) return 'cloudinary';
  return 'none';
}

