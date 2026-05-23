import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Find gallery entry by imageUrl
    const gallery = await db.gallery.findFirst({
      where: { imageUrl: `/api/gallery/file/${filename}` }
    });

    // Read file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'gallery', filename);
    const fileBuffer = await readFile(filePath);

    // Determine content type
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const contentType = contentTypes[ext] || 'image/jpeg';

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Get gallery file error:', error);
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
  }
}
