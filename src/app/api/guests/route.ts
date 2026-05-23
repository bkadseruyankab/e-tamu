import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendGuestArrivalEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendGuestArrivalWhatsApp } from '@/lib/whatsapp';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { institution: { contains: search } },
        { phone: { contains: search } },
        { visitPurpose: { contains: search } },
        { nik: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (dateFrom || dateTo) {
      where.visitDate = {};
      if (dateFrom) {
        (where.visitDate as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setDate(to.getDate() + 1);
        (where.visitDate as Record<string, unknown>).lt = to;
      }
    }

    const [guests, total] = await Promise.all([
      db.guest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true, code: true } },
          employee: { select: { id: true, name: true, position: true } },
        },
      }),
      db.guest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: guests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Guests list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nik, institution, address, phone, email, visitPurpose, departmentId, employeeId, need, photo } = body;

    if (!name || !visitPurpose) {
      return NextResponse.json(
        { success: false, error: 'Name and visit purpose are required' },
        { status: 400 }
      );
    }

    const guest = await db.guest.create({
      data: {
        name,
        nik,
        institution,
        address,
        phone,
        email,
        visitPurpose,
        departmentId,
        employeeId,
        need,
        photo,
        status: 'menunggu',
        visitDate: new Date(),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Guest',
        entityId: guest.id,
        details: `Guest ${name} registered`,
      },
    });

    // Create notification for admin
    const admins = await db.user.findMany({
      where: { role: { in: ['super_admin', 'admin', 'resepsionis'] }, isActive: true },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        db.notification.create({
          data: {
            userId: admin.id,
            title: 'Tamu Baru',
            message: `${name} telah mendaftar sebagai tamu`,
            type: 'info',
            link: '/guests',
          },
        })
      )
    );

    // Also notify the assigned employee if guest is assigned to a specific employee
    if (employeeId) {
      const assignedEmployee = await db.employee.findUnique({
        where: { id: employeeId },
        select: { email: true, phone: true, name: true },
      })
      // Find user account linked to this employee by email
      if (assignedEmployee?.email) {
        const linkedUsers = await db.user.findMany({
          where: { email: assignedEmployee.email, isActive: true },
          select: { id: true },
        })
        for (const u of linkedUsers) {
          await db.notification.create({
            data: {
              userId: u.id,
              title: 'Tamu Ditugaskan',
              message: `${name} ditugaskan kepada Anda - ${visitPurpose}`,
              type: 'info',
              link: '/guests',
            },
          })
        }
      }
    }

    // Look up assigned employee contact info for direct notification
    let assignedEmpEmail: string | null = null
    let assignedEmpPhone: string | null = null
    if (employeeId) {
      const empRecord = await db.employee.findUnique({
        where: { id: employeeId },
        select: { email: true, phone: true },
      })
      assignedEmpEmail = empRecord?.email || null
      assignedEmpPhone = empRecord?.phone || null
    }

    // Send WhatsApp notification if enabled - to assigned employee AND admin
    try {
      const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_guest_arrival')
      if (waEnabled) {
        const timeStr = new Date().toLocaleString('id-ID')
        // Send to assigned employee's WhatsApp (primary)
        if (assignedEmpPhone) {
          sendGuestArrivalWhatsApp({
            guestName: name,
            institution: institution || null,
            visitPurpose,
            department: guest.department?.name || null,
            time: timeStr,
            targetPhone: assignedEmpPhone,
          }).catch(() => { /* silently fail WhatsApp notification */ })
        }
        // Also send to admin contact if different
        if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== assignedEmpPhone) {
          sendGuestArrivalWhatsApp({
            guestName: name,
            institution: institution || null,
            visitPurpose,
            department: guest.department?.name || null,
            time: timeStr,
            targetPhone: waSettings.contact_whatsapp,
          }).catch(() => { /* silently fail WhatsApp notification */ })
        }
      }
    } catch {
      /* silently fail WhatsApp notification */
    }

    // Send Email notification if enabled - to assigned employee AND admin
    try {
      const { enabled, settings } = await isEmailEventEnabled('email_on_guest_arrival')
      if (enabled) {
        const timeStr = new Date().toLocaleString('id-ID')
        // Send to assigned employee's email (primary)
        if (assignedEmpEmail) {
          sendGuestArrivalEmail({
            guestName: name,
            institution: institution || null,
            visitPurpose,
            department: guest.department?.name || null,
            time: timeStr,
            recipientEmail: assignedEmpEmail,
          }).catch(() => { /* silently fail email notification */ })
        }
        // Also send to admin contact if different
        if (settings.contact_email && settings.contact_email !== assignedEmpEmail) {
          sendGuestArrivalEmail({
            guestName: name,
            institution: institution || null,
            visitPurpose,
            department: guest.department?.name || null,
            time: timeStr,
            recipientEmail: settings.contact_email,
          }).catch(() => { /* silently fail email notification */ })
        }
      }
    } catch {
      /* silently fail email notification */
    }

    return NextResponse.json({ success: true, data: guest }, { status: 201 });
  } catch (error) {
    console.error('Create guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create guest' },
      { status: 500 }
    );
  }
}
