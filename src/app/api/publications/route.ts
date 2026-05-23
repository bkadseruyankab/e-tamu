import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET all publications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const year = searchParams.get('year') || '';

    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }
    
    if (category) {
      where.category = category;
    }
    
    if (year) {
      where.year = parseInt(year);
    }

    const total = await db.publication.count({ where });
    
    const publications = await db.publication.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      data: publications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get publications error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST create publication
export async function POST(request: NextRequest) {
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

    const sessionData = JSON.parse(session.value);
    const userId = sessionData.userId;

    const data = await request.json();
    
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const existingPub = await db.publication.findUnique({
      where: { slug },
    });

    const finalSlug = existingPub ? `${slug}-${Date.now()}` : slug;

    const publication = await db.publication.create({
      data: {
        title: data.title,
        slug: finalSlug,
        description: data.description,
        fileUrl: data.fileUrl,
        coverImage: data.coverImage,
        category: data.category,
        year: data.year || new Date().getFullYear(),
        authorId: userId,
        isPublished: data.isPublished || false,
        publishedAt: data.isPublished ? new Date() : null,
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
    console.error('Create publication error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
