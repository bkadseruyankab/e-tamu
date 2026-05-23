import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendDispositionEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendDispositionWhatsApp } from '@/lib/whatsapp';

// Type for appointment with relations used in disposition creation
type AppointmentWithRelations = Awaited<ReturnType<typeof db.appointment.findUnique<{ include: { department: { select: { id: true; name: true } }; employee: { select: { id: true } } } }>>>

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const guestId = searchParams.get('guestId') || '';
    const userId = searchParams.get('userId') || '';
    const userRole = searchParams.get('userRole') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (guestId) {
      where.guestId = guestId;
    }

    // Role-based filtering: pegawai and pimpinan only see dispositions assigned to them
    if (userId && (userRole === 'pegawai' || userRole === 'pimpinan')) {
      where.OR = [
        { toUserId: userId },
        { fromUserId: userId },
      ]
    }

    const [dispositions, total] = await Promise.all([
      db.disposition.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          guest: {
            select: { id: true, name: true, institution: true, visitPurpose: true, status: true, phone: true },
          },
          appointment: {
            select: {
              id: true,
              visitorName: true,
              visitorNip: true,
              visitorPosition: true,
              institution: true,
              phone: true,
              visitPurpose: true,
              visitDate: true,
              visitTime: true,
              numberOfPeople: true,
              status: true,
              department: { select: { id: true, name: true, code: true } },
              employee: { select: { id: true, name: true, position: true } },
            },
          },
          fromUser: { select: { id: true, name: true, role: true } },
          toUser: { select: { id: true, name: true, role: true } },
          followUps: { orderBy: { createdAt: 'desc' } },
        },
      }),
      db.disposition.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: dispositions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Dispositions list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dispositions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, appointmentId, fromUserId, toUserId, toDepartmentId, notes } = body;

    if (!fromUserId) {
      return NextResponse.json(
        { success: false, error: 'From user ID is required' },
        { status: 400 }
      );
    }

    // Verify appointment exists if provided
    let appointment: AppointmentWithRelations = null;
    if (appointmentId) {
      appointment = await db.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          department: { select: { id: true, name: true } },
          employee: { select: { id: true } },
        },
      });
      if (!appointment) {
        return NextResponse.json(
          { success: false, error: 'Appointment not found' },
          { status: 404 }
        );
      }
    }

    // If no guestId provided but appointmentId exists, auto-create Guest from appointment
    let effectiveGuestId = guestId;
    let autoCreatedGuest = false;

    if (!effectiveGuestId && appointment) {
      // Auto-create a Guest record from appointment data
      const newGuest = await db.guest.create({
        data: {
          name: appointment.visitorName,
          institution: appointment.institution,
          phone: appointment.phone,
          email: appointment.email,
          visitPurpose: appointment.visitPurpose,
          departmentId: appointment.departmentId || appointment.department?.id || null,
          employeeId: appointment.employeeId || appointment.employee?.id || null,
          status: 'check_in',
          checkInTime: new Date(),
          visitDate: new Date(appointment.visitDate),
        },
      });
      effectiveGuestId = newGuest.id;
      autoCreatedGuest = true;
    }

    if (!effectiveGuestId) {
      return NextResponse.json(
        { success: false, error: 'Guest ID or Appointment ID is required' },
        { status: 400 }
      );
    }

    // Verify guest exists (include department for email/WhatsApp notification)
    const guest = await db.guest.findUnique({
      where: { id: effectiveGuestId },
      include: { department: { select: { name: true } } },
    });
    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    const disposition = await db.disposition.create({
      data: {
        guestId: effectiveGuestId,
        appointmentId: appointmentId || null,
        fromUserId,
        toUserId,
        toDepartmentId,
        notes,
        status: 'menunggu',
      },
      include: {
        guest: { select: { id: true, name: true, institution: true, visitPurpose: true, status: true, phone: true } },
        appointment: {
          select: {
            id: true,
            visitorName: true,
            visitorNip: true,
            visitorPosition: true,
            institution: true,
            phone: true,
            visitPurpose: true,
            visitDate: true,
            visitTime: true,
            numberOfPeople: true,
            status: true,
            department: { select: { id: true, name: true, code: true } },
            employee: { select: { id: true, name: true, position: true } },
          },
        },
        fromUser: { select: { id: true, name: true, role: true } },
        toUser: { select: { id: true, name: true, role: true } },
      },
    });

    // Create notification for toUser
    if (toUserId) {
      const displayName = appointment ? appointment.visitorName : guest.name;
      await db.notification.create({
        data: {
          userId: toUserId,
          title: 'Disposisi Baru',
          message: `Anda menerima disposisi dari ${disposition.fromUser.name} untuk tamu ${displayName}${appointment ? ' (Janji Temu)' : ''}`,
          type: 'info',
          link: '/dispositions',
        },
      });
    }

    // Create guest log
    await db.guestLog.create({
      data: {
        guestId: effectiveGuestId,
        action: 'disposisi',
        notes: `Disposisi dibuat oleh ${disposition.fromUser.name}${autoCreatedGuest ? ' (dari Janji Temu)' : ''}`,
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: fromUserId,
        action: 'CREATE',
        entity: 'Disposition',
        entityId: disposition.id,
        details: `Disposition created for guest ${guest.name}${appointment ? ` from appointment ${appointment.visitorName}` : ''}`,
      },
    });

    // Send Email & WhatsApp notification to toUser if enabled
    if (toUserId) {
      // Look up the target user's contact info
      const toUserRecord = await db.user.findUnique({
        where: { id: toUserId },
        select: { id: true, email: true, phone: true, name: true },
      })

      const displayName = appointment ? appointment.visitorName : guest.name
      const deptName = appointment?.department?.name || guest.department?.name || null

      // Send Email notification to the target user (not admin)
      try {
        const { enabled, settings } = await isEmailEventEnabled('email_on_disposition')
        if (enabled) {
          // Send to the target user's email
          if (toUserRecord?.email) {
            sendDispositionEmail({
              fromUserName: disposition.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: deptName,
              recipientEmail: toUserRecord.email,
            }).catch(() => { /* silently fail email notification */ })
          }
          // Also notify admin contact as CC
          if (settings.contact_email && settings.contact_email !== toUserRecord?.email) {
            sendDispositionEmail({
              fromUserName: disposition.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: deptName,
              recipientEmail: settings.contact_email,
            }).catch(() => { /* silently fail email notification */ })
          }
        }
      } catch {
        /* silently fail email notification */
      }

      // Send WhatsApp notification to the target user (not admin)
      try {
        const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_disposition')
        if (waEnabled) {
          // Send to the target user's WhatsApp
          if (toUserRecord?.phone) {
            sendDispositionWhatsApp({
              fromUserName: disposition.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: deptName,
              targetPhone: toUserRecord.phone,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
          // Also notify admin contact WhatsApp
          if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== toUserRecord?.phone) {
            sendDispositionWhatsApp({
              fromUserName: disposition.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: deptName,
              targetPhone: waSettings.contact_whatsapp,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
        }
      } catch {
        /* silently fail WhatsApp notification */
      }
    }

    return NextResponse.json({ success: true, data: disposition }, { status: 201 });
  } catch (error) {
    console.error('Create disposition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create disposition' },
      { status: 500 }
    );
  }
}
