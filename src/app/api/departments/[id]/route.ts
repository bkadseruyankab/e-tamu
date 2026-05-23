import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const department = await db.department.findUnique({
      where: { id },
      include: {
        employees: { orderBy: { name: 'asc' } },
        _count: { select: { employees: true, guests: true } },
      },
    });

    if (!department) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error('Get department error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    // Check code uniqueness if changing
    if (body.code && body.code !== existing.code) {
      const codeExists = await db.department.findUnique({ where: { code: body.code } });
      if (codeExists) {
        return NextResponse.json(
          { success: false, error: 'Department code already exists' },
          { status: 409 }
        );
      }
    }

    const department = await db.department.update({
      where: { id },
      data: {
        name: body.name,
        code: body.code,
        headName: body.headName,
        description: body.description,
        isActive: body.isActive,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Department',
        entityId: id,
        details: `Department ${department.name} updated`,
      },
    });

    return NextResponse.json({ success: true, data: department });
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update department' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, guests: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Department not found' },
        { status: 404 }
      );
    }

    if (existing._count.employees > 0 || existing._count.guests > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete department with associated employees or guests' },
        { status: 400 }
      );
    }

    await db.department.delete({ where: { id } });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Department',
        entityId: id,
        details: `Department ${existing.name} deleted`,
      },
    });

    return NextResponse.json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete department' },
      { status: 500 }
    );
  }
}
