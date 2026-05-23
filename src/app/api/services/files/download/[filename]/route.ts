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

    // Find file in database
    const file = await db.serviceFile.findFirst({
      where: { name: filename }
    });

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Read file from disk
    const filePath = path.join(process.cwd(), 'uploads', 'services', file.serviceId, filename);
    const fileBuffer = await readFile(filePath);

    // Increment download count
    await db.serviceFile.update({
      where: { id: file.id },
      data: { downloadCount: { increment: 1 } }
    });

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': file.size.toString(),
      },
    });
  } catch (error) {
    console.error('Download file error:', error);
    return NextResponse.json({ error: 'Gagal mengunduh file' }, { status: 500 });
  }
}
