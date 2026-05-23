import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const departments = await db.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true, guests: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: departments });
  } catch (error) {
    console.error('Departments list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, headName, description, isActive } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existing = await db.department.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Department code already exists' },
        { status: 409 }
      );
    }

    const department = await db.department.create({
      data: {
        name,
        code,
        headName,
        description,
        isActive: isActive ?? true,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Department',
        entityId: department.id,
        details: `Department ${name} created`,
      },
    });

    return NextResponse.json({ success: true, data: department }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create department' },
      { status: 500 }
    );
  }
}
