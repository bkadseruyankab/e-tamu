import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// ─── Resolve upload directory (works in dev & standalone production) ────────
function getUploadDir(): string {
  // Allow override via UPLOAD_DIR env var (for aaPanel / Docker deployments)
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) return envDir;

  // Default: <project_root>/data/uploads
  // In standalone mode, process.cwd() points to the .next/standalone directory
  // but we want to store outside the build output so files persist across deploys
  const cwd = process.cwd();

  // If running from .next/standalone, go up to project root
  if (cwd.includes('.next/standalone') || cwd.includes('.next\\standalone')) {
    return path.resolve(cwd, '..', '..', 'data', 'uploads');
  }

  return path.resolve(cwd, 'data', 'uploads');
}

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'general';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Format file tidak didukung. Gunakan PNG, JPG, WebP, GIF, atau PDF.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split('/')[1]}`;
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueName = `${type}-${baseName}-${Date.now()}${ext}`;

    // Ensure uploads directory exists
    const uploadDir = getUploadDir();
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Write file to data/uploads
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // Return the public URL (served via /api/files/...)
    const publicUrl = `/api/files/${uniqueName}`;

    console.log(`[Upload] File saved: ${uniqueName} (${file.size} bytes, ${file.type}) → ${filePath}`);

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: uniqueName,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupload file. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}
