import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const BACKUPS_DIR = join(process.cwd(), 'backups');

// GET /api/backup/[id] - Download a specific backup file
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'json'; // "db" or "json"

    const record = await db.backupRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Backup record not found' },
        { status: 404 }
      );
    }

    // Determine which file to serve
    let filename: string;
    let contentType: string;

    if (type === 'db') {
      // For DB file, derive from the record's filename or timestamp
      // The record filename might be the .db file or .json file
      if (record.filename.endsWith('.db')) {
        filename = record.filename;
      } else {
        // Try to find the .db counterpart by replacing .json with .db
        filename = record.filename.replace('.json', '.db');
      }
      contentType = 'application/octet-stream';
    } else {
      // JSON file
      if (record.filename.endsWith('.json')) {
        filename = record.filename;
      } else {
        // Try to find the .json counterpart by replacing .db with .json
        filename = record.filename.replace('.db', '.json');
      }
      contentType = 'application/json';
    }

    const filePath = join(BACKUPS_DIR, filename);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: `Backup file not found on disk: ${filename}` },
        { status: 404 }
      );
    }

    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Backup download error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download backup' },
      { status: 500 }
    );
  }
}

// DELETE /api/backup/[id] - Delete a specific backup record and its files
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const record = await db.backupRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Backup record not found' },
        { status: 404 }
      );
    }

    // Delete associated files from disk
    const filesToDelete: string[] = [record.filename];

    // Also try to delete the counterpart file
    if (record.filename.endsWith('.db')) {
      filesToDelete.push(record.filename.replace('.db', '.json'));
    } else if (record.filename.endsWith('.json')) {
      filesToDelete.push(record.filename.replace('.json', '.db'));
    }

    const deletedFiles: string[] = [];
    const notFoundFiles: string[] = [];

    for (const file of filesToDelete) {
      const filePath = join(BACKUPS_DIR, file);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
          deletedFiles.push(file);
        } catch (unlinkError) {
          console.error(`Failed to delete file ${file}:`, unlinkError);
        }
      } else {
        notFoundFiles.push(file);
      }
    }

    // Delete the database record
    await db.backupRecord.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedRecord: record.id,
        deletedFiles,
        notFoundFiles,
      },
    });
  } catch (error) {
    console.error('Backup deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete backup' },
      { status: 500 }
    );
  }
}
