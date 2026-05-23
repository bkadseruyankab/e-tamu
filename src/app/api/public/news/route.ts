import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categorySlug = searchParams.get('category') || '';
    const featured = searchParams.get('featured');

    const where: Record<string, unknown> = { isPublished: true };
    
    if (categorySlug) {
      const category = await db.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }
    
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const total = await db.news.count({ where });
    
    const news = await db.news.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get public news error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
