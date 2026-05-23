import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendAppointmentEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendAppointmentWhatsApp } from '@/lib/whatsapp';

// GET /api/appointments - List all appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId') || '';
    const userRole = searchParams.get('userRole') || '';

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { visitorName: { contains: search } },
        { institution: { contains: search } },
        { visitorPosition: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Role-based filtering: pegawai and pimpinan only see appointments assigned to them
    if (userId && (userRole === 'pegawai' || userRole === 'pimpinan')) {
      // Find the employee record linked to this user (by matching email)
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { email: true },
      })
      if (user?.email) {
        const employee = await db.employee.findFirst({
          where: { email: user.email },
          select: { id: true },
        })
        if (employee) {
          // Only show appointments assigned to this employee
          where.employeeId = employee.id
        } else {
          // No employee record linked - only show appointments with no specific employee
          // Or appointments where they are the visitor (their own email matches)
          where.OR = [
            { email: user.email },
          ]
        }
      }
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        include: {
          department: { select: { id: true, name: true, code: true } },
          employee: { select: { id: true, name: true, position: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data janji temu' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      visitorName,
      visitorNip,
      visitorPosition,
      institution,
      institutionAddr,
      phone,
      email,
      visitPurpose,
      visitDate,
      visitTime,
      numberOfPeople,
      departmentId,
      employeeId,
      notes,
    } = body;

    // Validation
    if (!visitorName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama pengunjung wajib diisi' },
        { status: 400 }
      );
    }

    if (!institution?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nama instansi wajib diisi' },
        { status: 400 }
      );
    }

    if (!visitPurpose?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tujuan kunjungan wajib diisi' },
        { status: 400 }
      );
    }

    if (!visitDate) {
      return NextResponse.json(
        { success: false, error: 'Tanggal kunjungan wajib diisi' },
        { status: 400 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        visitorName: visitorName.trim(),
        visitorNip: visitorNip?.trim() || null,
        visitorPosition: visitorPosition?.trim() || null,
        institution: institution.trim(),
        institutionAddr: institutionAddr?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        visitPurpose: visitPurpose.trim(),
        visitDate: new Date(visitDate),
        visitTime: visitTime?.trim() || null,
        numberOfPeople: numberOfPeople || 1,
        departmentId: departmentId || null,
        employeeId: employeeId || null,
        notes: notes?.trim() || null,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    // Look up the assigned employee's contact info for direct notification
    let employeeEmail: string | null = null
    let employeePhone: string | null = null
    if (employeeId) {
      const employeeRecord = await db.employee.findUnique({
        where: { id: employeeId },
        select: { email: true, phone: true, name: true },
      })
      employeeEmail = employeeRecord?.email || null
      employeePhone = employeeRecord?.phone || null
    }

    // Also look up any users with pimpinan/pegawai role in the assigned department
    let deptUserEmails: Array<{ email: string; phone: string | null; id: string }> = []
    if (departmentId) {
      deptUserEmails = await db.user.findMany({
        where: {
          role: { in: ['pimpinan', 'pegawai'] },
          isActive: true,
        },
        select: { id: true, email: true, phone: true },
      })
    }

    // Create in-app notifications for assigned employee/users
    if (employeeId) {
      // Find user accounts linked to this employee (by matching email)
      const linkedUsers = await db.user.findMany({
        where: {
          email: employeeEmail || undefined,
          isActive: true,
        },
        select: { id: true },
      })
      for (const u of linkedUsers) {
        await db.notification.create({
          data: {
            userId: u.id,
            title: 'Janji Temu Baru',
            message: `Janji temu baru dari ${visitorName.trim()} (${institution.trim()}) - ${visitPurpose.trim()}`,
            type: 'info',
            link: '/appointments',
          },
        })
      }
    }

    // Send Email notification - to assigned employee AND admin
    try {
      const { enabled, settings } = await isEmailEventEnabled('email_on_appointment')
      if (enabled) {
        const dateStr = new Date(visitDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        // Send to assigned employee's email
        if (employeeEmail) {
          sendAppointmentEmail({
            visitorName: visitorName.trim(),
            institution: institution.trim(),
            visitPurpose: visitPurpose.trim(),
            visitDate: dateStr,
            visitTime: visitTime?.trim() || null,
            department: appointment.department?.name || null,
            employee: appointment.employee?.name || null,
            numberOfPeople: numberOfPeople || 1,
            recipientEmail: employeeEmail,
          }).catch(() => { /* silently fail email notification */ })
        }

        // Also send to department users
        for (const du of deptUserEmails) {
          if (du.email && du.email !== employeeEmail) {
            sendAppointmentEmail({
              visitorName: visitorName.trim(),
              institution: institution.trim(),
              visitPurpose: visitPurpose.trim(),
              visitDate: dateStr,
              visitTime: visitTime?.trim() || null,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: numberOfPeople || 1,
              recipientEmail: du.email,
            }).catch(() => { /* silently fail email notification */ })
          }
        }

        // Also send to admin contact
        if (settings.contact_email && settings.contact_email !== employeeEmail) {
          sendAppointmentEmail({
            visitorName: visitorName.trim(),
            institution: institution.trim(),
            visitPurpose: visitPurpose.trim(),
            visitDate: dateStr,
            visitTime: visitTime?.trim() || null,
            department: appointment.department?.name || null,
            employee: appointment.employee?.name || null,
            numberOfPeople: numberOfPeople || 1,
            recipientEmail: settings.contact_email,
          }).catch(() => { /* silently fail email notification */ })
        }
      }
    } catch {
      /* silently fail email notification */
    }

    // Send WhatsApp notification - to assigned employee AND admin
    try {
      const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_appointment')
      if (waEnabled) {
        const dateStr = new Date(visitDate).toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        // Send to assigned employee's WhatsApp
        if (employeePhone) {
          sendAppointmentWhatsApp({
            visitorName: visitorName.trim(),
            institution: institution.trim(),
            visitPurpose: visitPurpose.trim(),
            visitDate: dateStr,
            visitTime: visitTime?.trim() || null,
            department: appointment.department?.name || null,
            employee: appointment.employee?.name || null,
            numberOfPeople: numberOfPeople || 1,
            targetPhone: employeePhone,
          }).catch(() => { /* silently fail WhatsApp notification */ })
        }

        // Also send to department users
        for (const du of deptUserEmails) {
          if (du.phone && du.phone !== employeePhone) {
            sendAppointmentWhatsApp({
              visitorName: visitorName.trim(),
              institution: institution.trim(),
              visitPurpose: visitPurpose.trim(),
              visitDate: dateStr,
              visitTime: visitTime?.trim() || null,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: numberOfPeople || 1,
              targetPhone: du.phone,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
        }

        // Also send to admin contact WhatsApp
        if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== employeePhone) {
          sendAppointmentWhatsApp({
            visitorName: visitorName.trim(),
            institution: institution.trim(),
            visitPurpose: visitPurpose.trim(),
            visitDate: dateStr,
            visitTime: visitTime?.trim() || null,
            department: appointment.department?.name || null,
            employee: appointment.employee?.name || null,
            numberOfPeople: numberOfPeople || 1,
            targetPhone: waSettings.contact_whatsapp,
          }).catch(() => { /* silently fail WhatsApp notification */ })
        }
      }
    } catch {
      /* silently fail WhatsApp notification */
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal membuat janji temu' },
      { status: 500 }
    );
  }
}
