import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isEmailEventEnabled, sendGuestStatusEmail } from '@/lib/email';
import { isWhatsAppEventEnabled, sendGuestStatusWhatsApp } from '@/lib/whatsapp';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guest = await db.guest.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
        dispositions: {
          include: {
            fromUser: { select: { id: true, name: true, role: true } },
            toUser: { select: { id: true, name: true, role: true } },
            followUps: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        guestLogs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!guest) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error('Get guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guest' },
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

    const existing = await db.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    const guest = await db.guest.update({
      where: { id },
      data: {
        name: body.name,
        nik: body.nik,
        institution: body.institution,
        address: body.address,
        phone: body.phone,
        email: body.email,
        visitPurpose: body.visitPurpose,
        departmentId: body.departmentId,
        employeeId: body.employeeId,
        need: body.need,
        photo: body.photo,
        document: body.document,
        signature: body.signature,
        qrCode: body.qrCode,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Guest',
        entityId: id,
        details: `Guest ${guest.name} updated`,
      },
    });

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error('Update guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guest' },
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
    const { status, notes } = body;

    const existing = await db.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    let logAction = '';

    if (status) {
      updateData.status = status;

      switch (status) {
        case 'check_in':
          updateData.checkInTime = new Date();
          logAction = 'check_in';
          break;
        case 'selesai':
          updateData.checkOutTime = new Date();
          logAction = 'selesai';
          break;
        case 'dilayani':
          logAction = 'dilayani';
          break;
        case 'ditolak':
          logAction = 'ditolak';
          break;
        case 'check_out':
          updateData.checkOutTime = new Date();
          updateData.status = 'selesai';
          logAction = 'check_out';
          break;
      }
    }

    const guest = await db.guest.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true, code: true } },
        employee: { select: { id: true, name: true, position: true } },
      },
    });

    // Create guest log
    if (logAction) {
      await db.guestLog.create({
        data: {
          guestId: id,
          action: logAction,
          notes: notes || `Status changed to ${status}`,
        },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'STATUS_CHANGE',
        entity: 'Guest',
        entityId: id,
        details: `Guest ${guest.name} status changed to ${status || 'updated'}`,
      },
    });

    // Send Email & WhatsApp notification on status change to correct recipients
    if (status && (status === 'check_in' || status === 'dilayani' || status === 'selesai' || status === 'check_out' || status === 'ditolak')) {
      // Look up assigned employee contact info
      let assignedEmpEmail: string | null = null
      let assignedEmpPhone: string | null = null
      if (guest.employeeId) {
        const empRecord = await db.employee.findUnique({
          where: { id: guest.employeeId },
          select: { email: true, phone: true },
        })
        assignedEmpEmail = empRecord?.email || null
        assignedEmpPhone = empRecord?.phone || null
      }

      try {
        const { enabled, settings } = await isEmailEventEnabled('email_on_guest_status')
        if (enabled) {
          const timeStr = new Date().toLocaleString('id-ID')
          // Send to assigned employee's email (primary)
          if (assignedEmpEmail) {
            sendGuestStatusEmail({
              guestName: guest.name,
              status,
              time: timeStr,
              recipientEmail: assignedEmpEmail,
              notes,
            }).catch(() => { /* silently fail email notification */ })
          }
          // Also send to admin contact if different
          if (settings.contact_email && settings.contact_email !== assignedEmpEmail) {
            sendGuestStatusEmail({
              guestName: guest.name,
              status,
              time: timeStr,
              recipientEmail: settings.contact_email,
              notes,
            }).catch(() => { /* silently fail email notification */ })
          }
        }
      } catch {
        /* silently fail email notification */
      }

      // Send WhatsApp notification
      try {
        const { enabled: waEnabled, settings: waSettings } = await isWhatsAppEventEnabled('whatsapp_on_guest_status')
        if (waEnabled) {
          const timeStr = new Date().toLocaleString('id-ID')
          // Send to assigned employee's WhatsApp (primary)
          if (assignedEmpPhone) {
            sendGuestStatusWhatsApp({
              guestName: guest.name,
              status,
              time: timeStr,
              targetPhone: assignedEmpPhone,
              notes,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
          // Also send to admin contact if different
          if (waSettings.contact_whatsapp && waSettings.contact_whatsapp !== assignedEmpPhone) {
            sendGuestStatusWhatsApp({
              guestName: guest.name,
              status,
              time: timeStr,
              targetPhone: waSettings.contact_whatsapp,
              notes,
            }).catch(() => { /* silently fail WhatsApp notification */ })
          }
        }
      } catch {
        /* silently fail WhatsApp notification */
      }
    }

    return NextResponse.json({ success: true, data: guest });
  } catch (error) {
    console.error('Patch guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guest status' },
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

    const existing = await db.guest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Guest not found' },
        { status: 404 }
      );
    }

    // Delete related records first
    await db.guestLog.deleteMany({ where: { guestId: id } });
    await db.followUp.deleteMany({
      where: { disposition: { guestId: id } },
    });
    await db.disposition.deleteMany({ where: { guestId: id } });

    await db.guest.delete({ where: { id } });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Guest',
        entityId: id,
        details: `Guest ${existing.name} deleted`,
      },
    });

    return NextResponse.json({ success: true, message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Delete guest error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete guest' },
      { status: 500 }
    );
  }
}
