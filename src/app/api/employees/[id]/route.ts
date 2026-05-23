import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const employee = await db.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { guests: true } },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
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

    const existing = await db.employee.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify department if changing
    if (body.departmentId) {
      const department = await db.department.findUnique({ where: { id: body.departmentId } });
      if (!department) {
        return NextResponse.json(
          { success: false, error: 'Department not found' },
          { status: 404 }
        );
      }
    }

    const employee = await db.employee.update({
      where: { id },
      data: {
        name: body.name,
        nip: body.nip,
        position: body.position,
        phone: body.phone,
        email: body.email,
        departmentId: body.departmentId,
        isActive: body.isActive,
        notifyEmail: body.notifyEmail,
        notifyWhatsApp: body.notifyWhatsApp,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Employee',
        entityId: id,
        details: `Employee ${employee.name} updated`,
      },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
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

    const existing = await db.employee.findUnique({
      where: { id },
      include: { _count: { select: { guests: true } } },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (existing._count.guests > 0) {
      // Soft delete - just deactivate
      await db.employee.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Employee deactivated (has associated guests)',
      });
    }

    await db.employee.delete({ where: { id } });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Employee',
        entityId: id,
        details: `Employee ${existing.name} deleted`,
      },
    });

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
