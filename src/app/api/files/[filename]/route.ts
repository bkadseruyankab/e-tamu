import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, resolve } from 'path';

// ─── Resolve upload directory (same logic as upload route) ──────────────────
function getUploadDir(): string {
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) return envDir;

  const cwd = process.cwd();
  if (cwd.includes('.next/standalone') || cwd.includes('.next\\standalone')) {
    return resolve(cwd, '..', '..', 'data', 'uploads');
  }

  return resolve(cwd, 'data', 'uploads');
}

// ─── MIME type map ──────────────────────────────────────────────────────────
const mimeMap: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  bmp: 'image/bmp',
};

// ─── GET /api/files/[filename] ─────────────────────────────────────────────
// Serves uploaded files from data/uploads directory.
// This works in both dev and standalone production builds.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    const filePath = join(uploadDir, filename);

    // Ensure the resolved path is within the upload directory
    const resolvedPath = resolve(filePath);
    if (!resolvedPath.startsWith(resolve(uploadDir))) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    // Check if file exists
    let fileStat;
    try {
      fileStat = await stat(filePath);
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (!fileStat.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 400 });
    }

    // Read file
    const buffer = await readFile(filePath);

    // Determine content type from extension
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const contentType = mimeMap[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('File serve error:', error);
    return NextResponse.json(
      { error: 'Gagal membaca file' },
      { status: 500 }
    );
  }
}
