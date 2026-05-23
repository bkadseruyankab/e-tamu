import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    const filePath = path.join(process.cwd(), 'uploads', 'settings', filename);
    const fileBuffer = await readFile(filePath);

    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'ico': 'image/x-icon',
      'svg': 'image/svg+xml',
    };
    const contentType = contentTypes[ext] || 'image/png';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Get settings file error:', error);
    return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
  }
}
