import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET single publication
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const publication = await db.publication.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!publication) {
      return NextResponse.json(
        { error: 'Publikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: publication });
  } catch (error) {
    console.error('Get publication error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT update publication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const session = await db.setting.findUnique({
      where: { key: `session_${sessionToken}` },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const data = await request.json();

    const existingPub = await db.publication.findUnique({
      where: { id },
    });

    if (!existingPub) {
      return NextResponse.json(
        { error: 'Publikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    let slug = existingPub.slug;
    if (data.title && data.title !== existingPub.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      const slugExists = await db.publication.findFirst({
        where: { slug, id: { not: id } },
      });

      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const publication = await db.publication.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        fileUrl: data.fileUrl,
        coverImage: data.coverImage,
        category: data.category,
        year: data.year,
        isPublished: data.isPublished,
        publishedAt: data.isPublished && !existingPub.isPublished 
          ? new Date() 
          : existingPub.publishedAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: publication });
  } catch (error) {
    console.error('Update publication error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE publication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const session = await db.setting.findUnique({
      where: { key: `session_${sessionToken}` },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existingPub = await db.publication.findUnique({
      where: { id },
    });

    if (!existingPub) {
      return NextResponse.json(
        { error: 'Publikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.publication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete publication error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
