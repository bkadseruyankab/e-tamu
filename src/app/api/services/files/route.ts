import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET files for a service
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID diperlukan' }, { status: 400 });
    }

    const files = await db.serviceFile.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ data: files });
  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST upload file
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
    const serviceId = formData.get('serviceId') as string;
    const description = formData.get('description') as string;
    const files = formData.getAll('files') as File[];

    if (!serviceId || files.length === 0) {
      return NextResponse.json({ error: 'Service ID dan file diperlukan' }, { status: 400 });
    }

    // Check if service exists
    const service = await db.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Layanan tidak ditemukan' }, { status: 404 });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'uploads', 'services', serviceId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file || file.size === 0) continue;

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split('.').pop() || 'bin';
      const fileName = `${timestamp}-${randomStr}.${ext}`;

      // Save file
      const filePath = path.join(uploadDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Save to database
      const savedFile = await db.serviceFile.create({
        data: {
          serviceId,
          name: fileName,
          originalName: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          path: `/api/services/files/download/${fileName}`,
          description,
        }
      });

      uploadedFiles.push(savedFile);
    }

    return NextResponse.json({ data: uploadedFiles });
  } catch (error) {
    console.error('Upload file error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
