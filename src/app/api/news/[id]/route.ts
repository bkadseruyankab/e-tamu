import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET single news
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const news = await db.news.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!news) {
      return NextResponse.json(
        { error: 'Berita tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// PUT update news
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
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

    // Check if news exists
    const existingNews = await db.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'Berita tidak ditemukan' },
        { status: 404 }
      );
    }

    // Generate new slug if title changed
    let slug = existingNews.slug;
    if (data.title && data.title !== existingNews.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);

      const slugExists = await db.news.findFirst({
        where: { slug, id: { not: id } },
      });

      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const news = await db.news.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        image: data.image,
        categoryId: data.categoryId || null,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        publishedAt: data.isPublished && !existingNews.isPublished 
          ? new Date() 
          : existingNews.publishedAt,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// DELETE news
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
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

    // Check if news exists
    const existingNews = await db.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: 'Berita tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.news.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
