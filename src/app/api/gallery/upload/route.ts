import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// POST upload gallery image
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
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const isPublished = formData.get('isPublished') === 'true';

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File diperlukan' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Judul diperlukan' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipe file tidak diizinkan. Gunakan JPG, PNG, GIF, atau WebP' 
      }, { status: 400 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomStr}.${ext}`;

    // Save file
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create gallery entry
    const gallery = await db.gallery.create({
      data: {
        title,
        description: description || null,
        imageUrl: `/api/gallery/file/${fileName}`,
        category: category || null,
        isPublished,
      },
    });

    return NextResponse.json({ data: gallery });
  } catch (error) {
    console.error('Upload gallery error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
