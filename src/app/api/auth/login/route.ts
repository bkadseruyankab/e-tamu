import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 403 }
      );
    }

    // Verify password (stored as hashed_{password})
    const expectedPassword = `hashed_${password}`;
    if (user.password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    // Create audit log for login
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'Auth',
        entityId: user.id,
        details: `User ${user.name} logged in`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Return user data (without password)
    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
