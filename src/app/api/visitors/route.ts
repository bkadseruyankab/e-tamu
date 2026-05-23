import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const ip = data.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const page = data.page || '';

    await db.visitor.create({
      data: {
        ip: ip.toString().split(',')[0].trim(),
        userAgent,
        page,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track visitor error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
