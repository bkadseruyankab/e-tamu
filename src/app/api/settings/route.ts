import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const settings = await db.setting.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value object
    const settingsObj: Record<string, string> = {};
    settings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body as { settings: Record<string, string> };

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Upsert each setting
    const operations = Object.entries(settings).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await Promise.all(operations);

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Settings',
        details: `Settings updated: ${Object.keys(settings).join(', ')}`,
      },
    });

    // Return updated settings
    const updatedSettings = await db.setting.findMany({ orderBy: { key: 'asc' } });
    const settingsObj: Record<string, string> = {};
    updatedSettings.forEach((s) => {
      settingsObj[s.key] = s.value;
    });

    return NextResponse.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
