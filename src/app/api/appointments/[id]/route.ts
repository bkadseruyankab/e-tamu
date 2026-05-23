import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendAppointmentEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendAppointmentWhatsApp } from '@/lib/whatsapp';

// GET /api/appointments/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointment = await db.appointment.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: 'Janji temu tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data janji temu' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      status,
      rejectionReason,
    } = body;

    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Janji temu tidak ditemukan' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (visitorName !== undefined) updateData.visitorName = visitorName.trim();
    if (visitorNip !== undefined) updateData.visitorNip = visitorNip?.trim() || null;
    if (visitorPosition !== undefined) updateData.visitorPosition = visitorPosition?.trim() || null;
    if (institution !== undefined) updateData.institution = institution.trim();
    if (institutionAddr !== undefined) updateData.institutionAddr = institutionAddr?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (visitPurpose !== undefined) updateData.visitPurpose = visitPurpose.trim();
    if (visitDate !== undefined) updateData.visitDate = new Date(visitDate);
    if (visitTime !== undefined) updateData.visitTime = visitTime?.trim() || null;
    if (numberOfPeople !== undefined) updateData.numberOfPeople = numberOfPeople;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (employeeId !== undefined) updateData.employeeId = employeeId || null;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'ditolak' && rejectionReason) {
        updateData.rejectionReason = rejectionReason.trim();
      }
    }

    const appointment = await db.appointment.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    // Auto-complete linked dispositions when appointment status changes to 'selesai'
    if (status === 'selesai') {
      const linkedDispositions = await db.disposition.findMany({
        where: {
          appointmentId: id,
          status: { not: 'selesai' }, // Only update non-completed dispositions
        },
        include: {
          fromUser: { select: { id: true, name: true, email: true, phone: true } },
          toUser: { select: { id: true, name: true, email: true, phone: true } },
          guest: { select: { name: true, id: true } },
        },
      })

      for (const disp of linkedDispositions) {
        await db.disposition.update({
          where: { id: disp.id },
          data: { status: 'selesai' },
        })

        // Notify the fromUser that disposition is auto-completed
        await db.notification.create({
          data: {
            userId: disp.fromUserId,
            title: 'Disposisi Selesai Otomatis',
            message: `Disposisi untuk tamu ${appointment.visitorName} (Janji Temu) otomatis diselesaikan karena janji temu telah selesai`,
            type: 'success',
            link: '/dispositions',
          },
        })

        // Also notify the toUser
        if (disp.toUserId) {
          await db.notification.create({
            data: {
              userId: disp.toUserId,
              title: 'Disposisi Selesai Otomatis',
              message: `Disposisi untuk tamu ${appointment.visitorName} (Janji Temu) otomatis diselesaikan karena janji temu telah selesai`,
              type: 'success',
              link: '/dispositions',
            },
          })
        }

        // Create guest log
        await db.guestLog.create({
          data: {
            guestId: disp.guestId,
            action: 'disposisi',
            notes: `Disposisi otomatis selesai (janji temu selesai)`,
          },
        })

        console.log(`[Appointment] Auto-completed disposition ${disp.id} (appointment ${id} → selesai)`)
      }
    }

    // Send Email & WhatsApp notification on appointment status change to correct recipients
    if (status && (status === 'dikonfirmasi' || status === 'ditolak' || status === 'selesai')) {
      // Look up assigned employee's contact info
      let assignedEmployeeEmail: string | null = null
      let assignedEmployeePhone: string | null = null
      if (appointment.employeeId) {
        const empRecord = await db.employee.findUnique({
          where: { id: appointment.employeeId },
          select: { email: true, phone: true },
        })
        assignedEmployeeEmail = empRecord?.email || null
        assignedEmployeePhone = empRecord?.phone || null
      }

      try {
        const { enabled, settings } = await isEmailEventEnabled('email_on_appointment_status')
        if (enabled) {
          const dateStr = new Date(appointment.visitDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          // Send to assigned employee's email (primary target)
          if (assignedEmployeeEmail) {
            sendAppointmentEmail({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              recipientEmail: assignedEmployeeEmail,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail email notification */ })
          }

          // Send to admin contact (if different from employee)
          if (settings.contact_email && settings.contact_email !== assignedEmployeeEmail) {
            sendAppointmentEmail({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              recipientEmail: settings.contact_email,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail email notification */ })
          }

          // Also send to the visitor if they have an email (for confirm/reject)
          if (existing.email && (status === 'dikonfirmasi' || status === 'ditolak')) {
            sendAppointmentEmail({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              recipientEmail: existing.email,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail email notification */ })
          }
        }
      } catch {
        /* silently fail email notification */
      }

      // Send WhatsApp notification to correct recipients
      try {
        const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_appointment_status')
        if (waEnabled) {
          const dateStr = new Date(appointment.visitDate).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })

          // Send to assigned employee's WhatsApp (primary target)
          if (assignedEmployeePhone) {
            sendAppointmentWhatsApp({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              targetPhone: assignedEmployeePhone,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }

          // Send to admin WhatsApp (if different from employee)
          if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== assignedEmployeePhone) {
            sendAppointmentWhatsApp({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              targetPhone: waSettings.contact_whatsapp,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }

          // Also send to the visitor if they have a phone number (for confirm/reject)
          if (existing.phone && (status === 'dikonfirmasi' || status === 'ditolak')) {
            sendAppointmentWhatsApp({
              visitorName: appointment.visitorName,
              institution: appointment.institution,
              visitPurpose: appointment.visitPurpose,
              visitDate: dateStr,
              visitTime: appointment.visitTime,
              department: appointment.department?.name || null,
              employee: appointment.employee?.name || null,
              numberOfPeople: appointment.numberOfPeople,
              targetPhone: existing.phone,
              isUpdate: true,
              status,
              rejectionReason: status === 'ditolak' ? rejectionReason : undefined,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
        }
      } catch {
        /* silently fail WhatsApp notification */
      }
    }

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate janji temu' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.appointment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Janji temu tidak ditemukan' },
        { status: 404 }
      );
    }

    await db.appointment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Janji temu berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus janji temu' },
      { status: 500 }
    );
  }
}
