import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';

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

    // Find file
    const file = await db.serviceFile.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'uploads', 'services', file.serviceId, file.name);
      await unlink(filePath);
    } catch (e) {
      console.error('Error deleting file from disk:', e);
      // Continue to delete from database even if file doesn't exist
    }

    // Delete from database
    await db.serviceFile.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

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
    const data = await request.json();

    const file = await db.serviceFile.update({
      where: { id },
      data: {
        description: data.description,
      }
    });

    return NextResponse.json({ data: file });
  } catch (error) {
    console.error('Update file error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
