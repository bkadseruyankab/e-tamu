import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendDispositionEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendDispositionWhatsApp } from '@/lib/whatsapp';
import { isEmailEventEnabled as isEmailEventEnabledAppt, sendAppointmentEmail } from '@/lib/email';
import { isWhatsAppEventEnabled as isWhatsAppEventEnabledAppt, sendAppointmentWhatsApp } from '@/lib/whatsapp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const disposition = await db.disposition.findUnique({
      where: { id },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            institution: true,
            visitPurpose: true,
            status: true,
            phone: true,
          },
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
    });

    if (!disposition) {
      return NextResponse.json(
        { success: false, error: 'Disposition not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: disposition });
  } catch (error) {
    console.error('Get disposition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disposition' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, followUpDescription, userId } = body;

    const existing = await db.disposition.findUnique({
      where: { id },
      include: {
        guest: { select: { name: true, id: true } },
        appointment: {
          select: {
            id: true,
            visitorName: true,
            status: true,
            visitDate: true,
            visitTime: true,
            department: { select: { id: true, name: true, code: true } },
            employee: { select: { id: true, name: true, position: true } },
          },
        },
        fromUser: { select: { id: true, name: true, email: true, phone: true, role: true } },
        toUser: { select: { id: true, name: true, email: true, phone: true, role: true } },
      },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Disposition not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const disposition = await db.disposition.update({
      where: { id },
      data: updateData,
      include: {
        guest: { select: { id: true, name: true, institution: true } },
        appointment: {
          select: {
            id: true,
            visitorName: true,
            institution: true,
            visitPurpose: true,
          },
        },
        fromUser: { select: { id: true, name: true, role: true } },
        toUser: { select: { id: true, name: true, role: true } },
        followUps: { orderBy: { createdAt: 'desc' } },
      },
    });

    // Add follow-up if provided
    if (followUpDescription) {
      await db.followUp.create({
        data: {
          dispositionId: id,
          description: followUpDescription,
          createdBy: userId || 'system',
        },
      });
    }

    // Auto-confirm linked appointment when disposition status changes to 'diproses'
    if (status === 'diproses' && existing.appointmentId && existing.appointment) {
      if (existing.appointment.status === 'menunggu') {
        await db.appointment.update({
          where: { id: existing.appointmentId },
          data: { status: 'dikonfirmasi' },
        })
        console.log(`[Disposition] Auto-confirmed appointment ${existing.appointmentId} (disposition ${id} → diproses)`)
      }
    }

    // Notify relevant users about status change
    if (status) {
      const displayName = existing.appointment ? existing.appointment.visitorName : existing.guest.name;

      // Determine who should receive the notification
      // If the current user is the toUser, notify the fromUser (creator)
      // If the current user is the fromUser, notify the toUser (target)
      const updaterId = userId || 'system'
      const isToUserUpdating = updaterId === existing.toUserId
      const isFromUserUpdating = updaterId === existing.fromUserId

      // Always notify the fromUser (creator) about status changes
      await db.notification.create({
        data: {
          userId: existing.fromUserId,
          title: 'Update Disposisi',
          message: `Disposisi untuk tamu ${displayName}${existing.appointmentId ? ' (Janji Temu)' : ''} diupdate ke status: ${status}`,
          type: status === 'selesai' ? 'success' : status === 'ditolak' ? 'error' : 'info',
          link: '/dispositions',
        },
      });

      // Also notify the toUser if someone else (fromUser/admin) is updating
      if (existing.toUserId && isFromUserUpdating) {
        await db.notification.create({
          data: {
            userId: existing.toUserId,
            title: 'Update Disposisi',
            message: `Disposisi untuk tamu ${displayName}${existing.appointmentId ? ' (Janji Temu)' : ''} diupdate ke status: ${status}`,
            type: status === 'selesai' ? 'success' : status === 'ditolak' ? 'error' : 'info',
            link: '/dispositions',
          },
        });
      }

      // Create guest log
      await db.guestLog.create({
        data: {
          guestId: existing.guestId,
          action: 'disposisi',
          notes: `Disposisi status berubah ke ${status}`,
        },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: userId,
        action: 'UPDATE',
        entity: 'Disposition',
        entityId: id,
        details: `Disposition status updated to ${status || 'updated'}`,
      },
    });

    // Send Email & WhatsApp notification on disposition status change to the correct recipients
    if (status) {
      const displayName = existing.appointment ? existing.appointment.visitorName : existing.guest.name
      const updaterId = userId || 'system'
      const isToUserUpdating = updaterId === existing.toUserId
      const isFromUserUpdating = updaterId === existing.fromUserId

      // Determine who to notify: the OPPOSITE party of who is updating
      const notifyUser = isToUserUpdating ? existing.fromUser : (isFromUserUpdating ? existing.toUser : existing.toUser)
      const notifyEmail = notifyUser?.email || null
      const notifyPhone = notifyUser?.phone || null

      // Send Email notification to the relevant user (not always admin)
      try {
        const { enabled, settings } = await isEmailEventEnabled('email_on_disposition_status')
        if (enabled) {
          // Send to the relevant user's email
          if (notifyEmail) {
            sendDispositionEmail({
              fromUserName: existing.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: existing.appointment?.department?.name || null,
              recipientEmail: notifyEmail,
              isUpdate: true,
              status,
            }).catch(() => { /* silently fail email notification */ })
          }
          // Also notify admin contact if different
          if (settings.contact_email && settings.contact_email !== notifyEmail) {
            sendDispositionEmail({
              fromUserName: existing.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: existing.appointment?.department?.name || null,
              recipientEmail: settings.contact_email,
              isUpdate: true,
              status,
            }).catch(() => { /* silently fail email notification */ })
          }
        }
      } catch {
        /* silently fail email notification */
      }

      // Send WhatsApp notification to the relevant user (not always admin)
      try {
        const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_disposition_status')
        if (waEnabled) {
          // Send to the relevant user's WhatsApp
          if (notifyPhone) {
            sendDispositionWhatsApp({
              fromUserName: existing.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: existing.appointment?.department?.name || null,
              targetPhone: notifyPhone,
              isUpdate: true,
              status,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
          // Also notify admin contact WhatsApp if different
          if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== notifyPhone) {
            sendDispositionWhatsApp({
              fromUserName: existing.fromUser.name,
              guestName: displayName,
              notes: notes || null,
              department: existing.appointment?.department?.name || null,
              targetPhone: waSettings.contact_whatsapp,
              isUpdate: true,
              status,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
        }
      } catch {
        /* silently fail WhatsApp notification */
      }

      // Send appointment notification if auto-confirmed
      if (status === 'diproses' && existing.appointmentId && existing.appointment && existing.appointment.status === 'menunggu') {
        try {
          const { enabled: emailApptEnabled, settings: emailApptSettings } = await isEmailEventEnabledAppt('email_on_appointment_status')
          if (emailApptEnabled) {
            const dateStr = new Date(existing.appointment.visitDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
            // Notify the visitor about confirmation
            const apptWithEmail = await db.appointment.findUnique({ where: { id: existing.appointmentId }, select: { email: true, phone: true } })
            if (apptWithEmail?.email) {
              sendAppointmentEmail({
                visitorName: existing.appointment.visitorName,
                institution: '',
                visitPurpose: '',
                visitDate: dateStr,
                visitTime: existing.appointment.visitTime,
                department: existing.appointment.department?.name || null,
                employee: existing.appointment.employee?.name || null,
                numberOfPeople: 1,
                recipientEmail: apptWithEmail.email,
                isUpdate: true,
                status: 'dikonfirmasi',
              }).catch(() => { /* silently fail */ })
            }
          }
        } catch {
          /* silently fail */
        }
      }
    }

    return NextResponse.json({ success: true, data: disposition });
  } catch (error) {
    console.error('Patch disposition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update disposition' },
      { status: 500 }
    );
  }
}
