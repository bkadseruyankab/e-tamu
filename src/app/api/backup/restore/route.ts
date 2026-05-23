import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'db', 'custom.db');
const BACKUPS_DIR = join(process.cwd(), 'backups');

interface BackupData {
  exportedAt: string;
  version: string;
  data: {
    users?: Record<string, unknown>[];
    departments?: Record<string, unknown>[];
    employees?: Record<string, unknown>[];
    guests?: Record<string, unknown>[];
    dispositions?: Record<string, unknown>[];
    followUps?: Record<string, unknown>[];
    guestLogs?: Record<string, unknown>[];
    notifications?: Record<string, unknown>[];
    settings?: Record<string, unknown>[];
    auditLogs?: Record<string, unknown>[];
    backupRecords?: Record<string, unknown>[];
  };
}

// POST /api/backup/restore - Restore from a backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backupId, type = 'json', confirm = false } = body;

    // Validate required fields
    if (!backupId) {
      return NextResponse.json(
        { success: false, error: 'backupId is required' },
        { status: 400 }
      );
    }

    // Require explicit confirmation for this dangerous operation
    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          error: 'This is a destructive operation. You must set confirm: true in the request body to proceed.',
          warning: 'Restoring a backup will overwrite all current data. This action cannot be undone.',
        },
        { status: 400 }
      );
    }

    // Validate type
    if (!['db', 'json'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be "db" or "json"' },
        { status: 400 }
      );
    }

    // Find the backup record
    const record = await db.backupRecord.findUnique({
      where: { id: backupId },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Backup record not found' },
        { status: 404 }
      );
    }

    if (type === 'db') {
      // --- Restore from SQLite DB file ---
      return await restoreFromDbFile(record);
    } else {
      // --- Restore from JSON export ---
      return await restoreFromJsonFile(record);
    }
  } catch (error) {
    console.error('Backup restore error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore backup' },
      { status: 500 }
    );
  }
}

async function restoreFromDbFile(record: Record<string, unknown>) {
  // Determine the .db filename
  let dbFilename: string;
  if ((record.filename as string).endsWith('.db')) {
    dbFilename = record.filename as string;
  } else {
    dbFilename = (record.filename as string).replace('.json', '.db');
  }

  const dbBackupPath = join(BACKUPS_DIR, dbFilename);

  if (!existsSync(dbBackupPath)) {
    return NextResponse.json(
      { success: false, error: `SQLite backup file not found on disk: ${dbFilename}` },
      { status: 404 }
    );
  }

  // Copy the backup DB file to replace the current database
  try {
    copyFileSync(dbBackupPath, DB_PATH);
  } catch (copyError) {
    console.error('Failed to restore SQLite file:', copyError);
    return NextResponse.json(
      { success: false, error: 'Failed to restore SQLite database file' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      restoredFrom: dbFilename,
      type: 'db',
      message: 'Database file restored successfully. You may need to restart the application for changes to take effect.',
    },
  });
}

async function restoreFromJsonFile(record: Record<string, unknown>) {
  // Determine the .json filename
  let jsonFilename: string;
  if ((record.filename as string).endsWith('.json')) {
    jsonFilename = record.filename as string;
  } else {
    jsonFilename = (record.filename as string).replace('.db', '.json');
  }

  const jsonBackupPath = join(BACKUPS_DIR, jsonFilename);

  if (!existsSync(jsonBackupPath)) {
    return NextResponse.json(
      { success: false, error: `JSON backup file not found on disk: ${jsonFilename}` },
      { status: 404 }
    );
  }

  // Read and parse the JSON backup
  let backupData: BackupData;
  try {
    const fileContent = readFileSync(jsonBackupPath, 'utf-8');
    backupData = JSON.parse(fileContent) as BackupData;
  } catch (parseError) {
    console.error('Failed to parse JSON backup:', parseError);
    return NextResponse.json(
      { success: false, error: 'Failed to read or parse JSON backup file' },
      { status: 500 }
    );
  }

  if (!backupData.data) {
    return NextResponse.json(
      { success: false, error: 'Invalid backup format: missing data field' },
      { status: 400 }
    );
  }

  // Delete existing data in reverse dependency order to respect foreign keys
  try {
    await db.followUp.deleteMany();
    await db.disposition.deleteMany();
    await db.guestLog.deleteMany();
    await db.notification.deleteMany();
    await db.auditLog.deleteMany();
    await db.guest.deleteMany();
    await db.employee.deleteMany();
    await db.guest.deleteMany(); // Ensure all guests are deleted before departments
    await db.department.deleteMany();
    await db.setting.deleteMany();
    await db.backupRecord.deleteMany();
    await db.user.deleteMany();
  } catch (deleteError) {
    console.error('Failed to clear existing data:', deleteError);
    return NextResponse.json(
      { success: false, error: 'Failed to clear existing data before restore. Database may be in an inconsistent state.' },
      { status: 500 }
    );
  }

  // Restore data in dependency order (parents first)
  const stats = {
    users: 0,
    departments: 0,
    employees: 0,
    guests: 0,
    dispositions: 0,
    followUps: 0,
    guestLogs: 0,
    notifications: 0,
    settings: 0,
    auditLogs: 0,
    backupRecords: 0,
  };

  try {
    // Users (no FK dependencies)
    if (backupData.data.users?.length) {
      for (const user of backupData.data.users) {
        await db.user.create({ data: user as never });
        stats.users++;
      }
    }

    // Departments (no FK dependencies)
    if (backupData.data.departments?.length) {
      for (const dept of backupData.data.departments) {
        await db.department.create({ data: dept as never });
        stats.departments++;
      }
    }

    // Settings (no FK dependencies)
    if (backupData.data.settings?.length) {
      for (const setting of backupData.data.settings) {
        await db.setting.create({ data: setting as never });
        stats.settings++;
      }
    }

    // Employees (depends on Department)
    if (backupData.data.employees?.length) {
      for (const emp of backupData.data.employees) {
        await db.employee.create({ data: emp as never });
        stats.employees++;
      }
    }

    // Guests (depends on Department, Employee)
    if (backupData.data.guests?.length) {
      for (const guest of backupData.data.guests) {
        await db.guest.create({ data: guest as never });
        stats.guests++;
      }
    }

    // Dispositions (depends on Guest, User)
    if (backupData.data.dispositions?.length) {
      for (const disp of backupData.data.dispositions) {
        await db.disposition.create({ data: disp as never });
        stats.dispositions++;
      }
    }

    // FollowUps (depends on Disposition)
    if (backupData.data.followUps?.length) {
      for (const followUp of backupData.data.followUps) {
        await db.followUp.create({ data: followUp as never });
        stats.followUps++;
      }
    }

    // GuestLogs (depends on Guest)
    if (backupData.data.guestLogs?.length) {
      for (const log of backupData.data.guestLogs) {
        await db.guestLog.create({ data: log as never });
        stats.guestLogs++;
      }
    }

    // Notifications (depends on User)
    if (backupData.data.notifications?.length) {
      for (const notif of backupData.data.notifications) {
        await db.notification.create({ data: notif as never });
        stats.notifications++;
      }
    }

    // AuditLogs (depends on User)
    if (backupData.data.auditLogs?.length) {
      for (const log of backupData.data.auditLogs) {
        await db.auditLog.create({ data: log as never });
        stats.auditLogs++;
      }
    }

    // BackupRecords (no FK dependencies)
    if (backupData.data.backupRecords?.length) {
      for (const rec of backupData.data.backupRecords) {
        await db.backupRecord.create({ data: rec as never });
        stats.backupRecords++;
      }
    }
  } catch (insertError) {
    console.error('Failed to restore some data:', insertError);
    return NextResponse.json({
      success: false,
      error: 'Failed to restore some data. Database may be in an inconsistent state.',
      stats,
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      restoredFrom: jsonFilename,
      type: 'json',
      stats,
      exportedAt: backupData.exportedAt,
      version: backupData.version,
    },
  });
}
