import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST upload logo
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const session = await db.setting.findUnique({
      where: { key: `session_${sessionToken}` },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'logo'; // logo, favicon, or headerImage

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File diperlukan' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, GIF, WebP, atau ICO' 
      }, { status: 400 });
    }

    // Check file size (max 10MB for logos)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 10MB` 
      }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'settings');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Delete old file if exists
    const existingSetting = await db.setting.findUnique({
      where: { key: type },
    });
    
    if (existingSetting?.value && existingSetting.value.startsWith('/api/settings/file/')) {
      const oldFileName = existingSetting.value.split('/').pop();
      if (oldFileName) {
        const oldFilePath = path.join(uploadDir, oldFileName);
        try {
          await unlink(oldFilePath);
        } catch (e) {
          console.error('Error deleting old file:', e);
        }
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${type}-${timestamp}-${randomStr}.${ext}`;

    // Save file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save URL to settings
    const fileUrl = `/api/settings/file/${fileName}`;
    await db.setting.upsert({
      where: { key: type },
      update: { value: fileUrl, type: 'setting' },
      create: { key: type, value: fileUrl, type: 'setting' },
    });

    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      message: `${type === 'logo' ? 'Logo' : type === 'favicon' ? 'Favicon' : 'Gambar'} berhasil diupload` 
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
}

// DELETE logo
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }

    const session = await db.setting.findUnique({
      where: { key: `session_${sessionToken}` },
    });

    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak valid' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'logo';

    const existingSetting = await db.setting.findUnique({
      where: { key: type },
    });

    if (existingSetting?.value && existingSetting.value.startsWith('/api/settings/file/')) {
      const fileName = existingSetting.value.split('/').pop();
      if (fileName) {
        const filePath = path.join(process.cwd(), 'uploads', 'settings', fileName);
        try {
          await unlink(filePath);
        } catch (e) {
          console.error('Error deleting file:', e);
        }
      }
    }

    // Clear setting
    await db.setting.delete({
      where: { key: type },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete logo error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
