import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const totalNews = await db.news.count({
      where: { isPublished: true },
    });

    const totalPublications = await db.publication.count({
      where: { isPublished: true },
    });

    const totalGallery = await db.gallery.count({
      where: { isPublished: true },
    });

    const totalViews = await db.news.aggregate({
      where: { isPublished: true },
      _sum: { viewCount: true },
    });

    const totalVisitors = await db.visitor.count();

    return NextResponse.json({
      data: {
        totalNews,
        totalPublications,
        totalGallery,
        totalViews: totalViews._sum.viewCount || 0,
        totalVisitors,
      },
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
