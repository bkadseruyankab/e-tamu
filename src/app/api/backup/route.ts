import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync, copyFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'db', 'custom.db');
const BACKUPS_DIR = join(process.cwd(), 'backups');

function ensureBackupsDir() {
  if (!existsSync(BACKUPS_DIR)) {
    mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

async function exportAllDataAsJson() {
  const [
    users,
    departments,
    employees,
    guests,
    dispositions,
    followUps,
    guestLogs,
    notifications,
    settings,
    auditLogs,
    backupRecords,
  ] = await Promise.all([
    db.user.findMany(),
    db.department.findMany(),
    db.employee.findMany(),
    db.guest.findMany(),
    db.disposition.findMany(),
    db.followUp.findMany(),
    db.guestLog.findMany(),
    db.notification.findMany(),
    db.setting.findMany(),
    db.auditLog.findMany(),
    db.backupRecord.findMany(),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    data: {
      users,
      departments,
      employees,
      guests,
      dispositions,
      followUps,
      guestLogs,
      notifications,
      settings,
      auditLogs,
      backupRecords,
    },
  };
}

// GET /api/backup - List all backup records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const databaseType = searchParams.get('databaseType') || '';
    const backupType = searchParams.get('backupType') || '';
    const status = searchParams.get('status') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (databaseType) {
      where.databaseType = databaseType;
    }

    if (backupType) {
      where.backupType = backupType;
    }

    if (status) {
      where.status = status;
    }

    const [records, total] = await Promise.all([
      db.backupRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.backupRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Backup list error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch backup records' },
      { status: 500 }
    );
  }
}

// POST /api/backup - Create a new backup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      databaseType = 'sqlite',
      storageType = 'local',
      backupType = 'manual',
      notes = '',
    } = body;

    // Validate databaseType
    if (!['sqlite', 'mysql', 'postgresql'].includes(databaseType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid databaseType. Must be sqlite, mysql, or postgresql' },
        { status: 400 }
      );
    }

    // Validate storageType
    if (!['local', 'blob'].includes(storageType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid storageType. Must be local or blob' },
        { status: 400 }
      );
    }

    // Validate backupType
    if (!['manual', 'auto'].includes(backupType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid backupType. Must be manual or auto' },
        { status: 400 }
      );
    }

    ensureBackupsDir();

    const timestamp = formatTimestamp(new Date());
    const dbFilename = `backup_${databaseType}_${timestamp}.db`;
    const jsonFilename = `backup_${databaseType}_${timestamp}.json`;
    const dbFilePath = join(BACKUPS_DIR, dbFilename);
    const jsonFilePath = join(BACKUPS_DIR, jsonFilename);

    let dbFileSize = 0;
    let jsonFileSize = 0;
    let blobUrl: string | null = null;
    let backupStatus = 'completed';
    const warnings: string[] = [];

    // --- SQLite file backup ---
    if (databaseType === 'sqlite') {
      if (existsSync(DB_PATH)) {
        try {
          copyFileSync(DB_PATH, dbFilePath);
          dbFileSize = statSync(dbFilePath).size;
        } catch (copyError) {
          console.error('SQLite file copy error:', copyError);
          warnings.push('Failed to copy SQLite database file');
        }
      } else {
        warnings.push('SQLite database file not found at expected path');
      }
    } else {
      // MySQL / PostgreSQL - future feature
      warnings.push(`${databaseType} native backup is not yet configured. Only JSON export will be created.`);
    }

    // --- JSON export (for all database types) ---
    const allData = await exportAllDataAsJson();
    writeFileSync(jsonFilePath, JSON.stringify(allData, null, 2), 'utf-8');
    jsonFileSize = statSync(jsonFilePath).size;

    // --- Blob storage upload ---
    if (storageType === 'blob') {
      try {
        // Attempt to use @vercel/blob if available
        const { put } = await import('@vercel/blob');
        const dbBlob = await put(`backups/${dbFilename}`, JSON.stringify(allData), {
          access: 'public',
        });
        blobUrl = dbBlob.url;
      } catch {
        // @vercel/blob not available, simulate with placeholder
        blobUrl = `https://blob.storage.example.com/backups/${jsonFilename}`;
        warnings.push('Vercel Blob storage is not configured. Backup saved locally only. Blob URL is a placeholder.');
        backupStatus = 'completed';
      }
    }

    // --- Create backup record in database ---
    const totalSize = dbFileSize + jsonFileSize;
    const backupRecord = await db.backupRecord.create({
      data: {
        filename: databaseType === 'sqlite' ? dbFilename : jsonFilename,
        fileSize: totalSize,
        databaseType,
        backupType,
        storageType,
        status: backupStatus,
        blobUrl,
        notes: notes || (warnings.length > 0 ? warnings.join('; ') : null),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        record: backupRecord,
        files: {
          db: databaseType === 'sqlite' && dbFileSize > 0 ? dbFilename : null,
          json: jsonFilename,
        },
        size: {
          db: dbFileSize,
          json: jsonFileSize,
          total: totalSize,
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Backup creation error:', error);

    // Attempt to record the failed backup
    try {
      await db.backupRecord.create({
        data: {
          filename: `backup_failed_${formatTimestamp(new Date())}`,
          fileSize: 0,
          databaseType: 'sqlite',
          backupType: 'manual',
          storageType: 'local',
          status: 'failed',
          notes: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      });
    } catch {
      // Ignore - we don't want to mask the original error
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
