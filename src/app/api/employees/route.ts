import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nip: { contains: search } },
        { position: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
        },
      }),
      db.employee.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Employees list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nip, position, phone, email, departmentId, isActive, notifyEmail, notifyWhatsApp } = body;

    if (!name || !departmentId) {
      return NextResponse.json(
        { success: false, error: 'Name and department are required' },
        { status: 400 }
      );
    }

    // Verify department exists
    const department = await db.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    const employee = await db.employee.create({
      data: {
        name,
        nip,
        position,
        phone,
        email,
        departmentId,
        isActive: isActive ?? true,
        notifyEmail: notifyEmail ?? true,
        notifyWhatsApp: notifyWhatsApp ?? true,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Employee',
        entityId: employee.id,
        details: `Employee ${name} created in ${department.name}`,
      },
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    );
  }
}
