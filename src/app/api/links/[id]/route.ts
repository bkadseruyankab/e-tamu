import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const link = await db.link.findUnique({ where: { id } });

    if (!link) {
      return NextResponse.json({ error: 'Link tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ data: link });
  } catch (error) {
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

    const link = await db.link.update({
      where: { id },
      data: {
        title: data.title,
        url: data.url,
        logo: data.logo,
        category: data.category,
        order: data.order,
        isActive: data.isActive,
      },
    });

    return NextResponse.json({ data: link });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}

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
    await db.link.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
