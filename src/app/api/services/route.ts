import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const admin = searchParams.get('admin') === 'true';
    
    const services = await db.service.findMany({
      where: admin ? undefined : { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        files: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ data: services });
  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

// POST create service
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

    const data = await request.json();
    
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    const service = await db.service.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        icon: data.icon,
        url: data.url,
        content: data.content,
        requirements: data.requirements,
        procedures: data.procedures,
        order: data.order || 0,
        isActive: data.isActive ?? true,
      },
      include: {
        files: true
      }
    });

    return NextResponse.json({ data: service });
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
