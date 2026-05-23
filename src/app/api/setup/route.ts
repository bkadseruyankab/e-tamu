import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/setup - Check if setup is complete
export async function GET() {
  try {
    const setupSetting = await db.setting.findUnique({
      where: { key: 'setup_complete' },
    });

    const setupComplete = setupSetting?.value === 'true';

    // If setup_complete is not explicitly true, check if admin users exist
    // This handles the case where the setup_complete key was lost from DB
    let hasNoUsers = false;
    if (!setupComplete) {
      const adminCount = await db.user.count({
        where: { role: { in: ['super_admin', 'admin'] }, isActive: true },
      });
      hasNoUsers = adminCount === 0;

      // If admin users exist but setup_complete is missing, auto-repair the DB
      if (adminCount > 0) {
        await db.setting.upsert({
          where: { key: 'setup_complete' },
          update: { value: 'true' },
          create: { key: 'setup_complete', value: 'true' },
        });
        return NextResponse.json({
          success: true,
          setupComplete: true,
          hasNoUsers: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      setupComplete,
      hasNoUsers,
    });
  } catch (error) {
    console.error('Check setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check setup status' },
      { status: 500 }
    );
  }
}

// POST /api/setup - Run initial setup
export async function POST(request: NextRequest) {
  try {
    // Check if already set up
    const existingSetup = await db.setting.findUnique({
      where: { key: 'setup_complete' },
    });

    if (existingSetup?.value === 'true') {
      return NextResponse.json(
        { success: false, error: 'Setup sudah pernah dilakukan' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { admin, organization, departments } = body as {
      admin: {
        name: string;
        email: string;
        password: string;
      };
      organization: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
        serviceStart: string;
        serviceEnd: string;
        runningText?: string;
      };
      departments: { name: string; code: string }[];
    };

    // Validate required fields
    if (!admin?.name || !admin?.email || !admin?.password) {
      return NextResponse.json(
        { success: false, error: 'Data admin tidak lengkap' },
        { status: 400 }
      );
    }

    if (!organization?.name) {
      return NextResponse.json(
        { success: false, error: 'Nama organisasi wajib diisi' },
        { status: 400 }
      );
    }

    // Check if email already taken
    const existingUser = await db.user.findUnique({
      where: { email: admin.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email sudah digunakan' },
        { status: 400 }
      );
    }

    // 1. Create super admin user
    const user = await db.user.create({
      data: {
        name: admin.name,
        email: admin.email,
        password: `hashed_${admin.password}`,
        role: 'super_admin',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // 2. Create organization settings
    const settingsToCreate: Record<string, string> = {
      app_name: 'E-Tamu BKAD',
      app_title: organization.name,
      running_text:
        organization.runningText ||
        `Selamat datang di ${organization.name} — Jam Pelayanan: ${organization.serviceStart} - ${organization.serviceEnd} WIB`,
      contact_email: organization.email || '',
      contact_whatsapp: organization.phone || '',
      service_start: organization.serviceStart,
      service_end: organization.serviceEnd,
      organization_name: organization.name,
      organization_address: organization.address || '',
      setup_complete: 'true',
    };

    const settingsOps = Object.entries(settingsToCreate).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await Promise.all(settingsOps);

    // 3. Create departments
    if (departments && departments.length > 0) {
      const deptOps = departments.map((dept) =>
        db.department.create({
          data: {
            name: dept.name,
            code: dept.code,
            isActive: true,
          },
        })
      );
      await Promise.all(deptOps);
    }

    // 4. Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'SETUP',
        entity: 'System',
        details: 'Initial setup completed',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menyelesaikan setup' },
      { status: 500 }
    );
  }
}
