import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all public services with files
export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        files: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({ data: services });
  } catch (error) {
    console.error('Get public services error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
