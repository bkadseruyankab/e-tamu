import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Configure for large uploads
export const runtime = 'nodejs';
export const maxDuration = 300;

// GET single gallery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const gallery = await db.gallery.findUnique({
      where: { id },
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: gallery });
  } catch (error) {
    console.error('Get gallery error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// PUT update gallery with optional file upload
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await db.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const imageUrl = formData.get('imageUrl') as string;

    let finalImageUrl = existing.imageUrl;

    // If new file is uploaded
    if (file && file.size > 0) {
      console.log('Updating with new file:', file.name, 'Size:', file.size);
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, GIF, atau WebP' 
        }, { status: 400 });
      }

      // Check file size (512MB max)
      const maxSize = 512 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 512MB` 
        }, { status: 400 });
      }

      // Delete old file if it's a local file
      if (existing.imageUrl.startsWith('/api/gallery/file/')) {
        const oldFileName = existing.imageUrl.split('/').pop();
        if (oldFileName) {
          const oldFilePath = path.join(process.cwd(), 'uploads', 'gallery', oldFileName);
          try {
            await unlink(oldFilePath);
            console.log('Deleted old file:', oldFilePath);
          } catch (e) {
            console.error('Error deleting old file:', e);
          }
        }
      }

      // Save new file
      const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${timestamp}-${randomStr}.${ext}`;

      const filePath = path.join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      finalImageUrl = `/api/gallery/file/${fileName}`;
    } else if (imageUrl) {
      // Use provided URL
      finalImageUrl = imageUrl;
    }

    const gallery = await db.gallery.update({
      where: { id },
      data: {
        title: title || existing.title,
        description: description !== null ? description || null : existing.description,
        imageUrl: finalImageUrl,
        category: category !== null ? category || null : existing.category,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
      },
    });

    return NextResponse.json({ data: gallery });
  } catch (error) {
    console.error('Update gallery error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
}

// DELETE gallery
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const existing = await db.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
    }

    // Delete file if it's a local file
    if (existing.imageUrl.startsWith('/api/gallery/file/')) {
      const fileName = existing.imageUrl.split('/').pop();
      if (fileName) {
        const filePath = path.join(process.cwd(), 'uploads', 'gallery', fileName);
        try {
          await unlink(filePath);
          console.log('Deleted file:', filePath);
        } catch (e) {
          console.error('Error deleting file:', e);
        }
      }
    }

    await db.gallery.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete gallery error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
