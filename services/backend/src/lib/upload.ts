import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, extname } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_BANNER_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface ProcessedImage {
  fileName: string;
  path: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function processImage(
  buffer: Buffer,
  mimeType: string,
  type: 'avatar' | 'banner' | 'attachment',
  originalName: string
): Promise<ProcessedImage> {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
  }

  const maxSize = type === 'avatar' ? MAX_AVATAR_SIZE : type === 'banner' ? MAX_BANNER_SIZE : MAX_ATTACHMENT_SIZE;
  if (buffer.length > maxSize) {
    throw new Error(`File too large. Max: ${maxSize / 1024 / 1024}MB`);
  }

  // Strip EXIF and convert to WebP
  let sharpInstance = sharp(buffer).rotate(); // auto-rotate based on EXIF then strip
  
  const dimensions = type === 'avatar' 
    ? { width: 256, height: 256 } 
    : type === 'banner' 
      ? { width: 1200, height: 400 } 
      : { width: 1920, height: 1080 };

  sharpInstance = sharpInstance.resize(dimensions.width, dimensions.height, {
    fit: 'cover',
    withoutEnlargement: true,
  });

  const processed = await sharpInstance
    .webp({ quality: 85, effort: 4 })
    .toBuffer();

  const fileName = `${randomUUID()}.webp`;
  const subDir = join(UPLOAD_DIR, type + 's');
  const filePath = join(subDir, fileName);
  const url = `/uploads/${type}s/${fileName}`;

  await mkdir(subDir, { recursive: true });
  await writeFile(filePath, processed);

  return {
    fileName,
    path: filePath,
    url,
    size: processed.length,
    mimeType: 'image/webp',
  };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // File may not exist
  }
}

export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_TYPES.includes(mimeType);
}
