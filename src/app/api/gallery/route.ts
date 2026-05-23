import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Configure body size limit for this API route
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large uploads

// GET all gallery
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || '';
    const admin = searchParams.get('admin') === 'true';

    const where: Record<string, unknown> = admin ? {} : { isPublished: true };
    
    if (category) {
      where.category = category;
    }

    const total = await db.gallery.count({ where });
    
    const gallery = await db.gallery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: gallery,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST create gallery with file upload
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const imageUrl = formData.get('imageUrl') as string;

    if (!title) {
      return NextResponse.json({ error: 'Judul diperlukan' }, { status: 400 });
    }

    let finalImageUrl = imageUrl || '';

    // If file is provided, upload it
    if (file && file.size > 0) {
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: `Tipe file tidak diizinkan: ${file.type}. Gunakan JPG, PNG, GIF, atau WebP` 
        }, { status: 400 });
      }

      // Check file size (512MB max)
      const maxSize = 512 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `Ukuran file terlalu besar: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maksimal 512MB` 
        }, { status: 400 });
      }

      // Create upload directory
      const uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
      console.log('Upload directory:', uploadDir);
      
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
      
      console.log('File saved to:', filePath);
      finalImageUrl = `/api/gallery/file/${fileName}`;
    }

    if (!finalImageUrl) {
      return NextResponse.json({ error: 'File atau URL gambar diperlukan' }, { status: 400 });
    }

    const gallery = await db.gallery.create({
      data: {
        title,
        description: description || null,
        imageUrl: finalImageUrl,
        category: category || null,
        isPublished,
      },
    });

    console.log('Gallery created:', gallery.id);
    return NextResponse.json({ data: gallery });
  } catch (error) {
    console.error('Create gallery error:', error);
    return NextResponse.json({ 
      error: 'Terjadi kesalahan server: ' + (error instanceof Error ? error.message : String(error)) 
    }, { status: 500 });
  }
}
