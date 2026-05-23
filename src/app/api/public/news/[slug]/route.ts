import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const news = await db.news.findUnique({
      where: { slug, isPublished: true },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
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

    // Increment view count
    await db.news.update({
      where: { id: news.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ data: news });
  } catch (error) {
    console.error('Get public news detail error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
