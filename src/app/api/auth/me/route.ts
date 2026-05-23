import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    // Get session from database
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
    
    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      await db.setting.delete({
        where: { key: `session_${sessionToken}` },
      });
      return NextResponse.json(
        { error: 'Sesi telah berakhir' },
        { status: 401 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: sessionData.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
