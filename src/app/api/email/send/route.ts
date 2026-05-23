import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

// ─── Helper: Get SMTP settings from database ─────────────────────────────────
async function getSmtpSettings() {
  const keys = [
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_secure',
    'email_notification_enabled',
  ]

  const settings = await db.setting.findMany({
    where: { key: { in: keys } },
  })

  const obj: Record<string, string> = {}
  settings.forEach((s) => {
    obj[s.key] = s.value
  })

  return obj
}

// ─── Helper: Create nodemailer transporter ────────────────────────────────────
function createTransporter(smtpSettings: Record<string, string>) {
  const port = parseInt(smtpSettings.smtp_port || '587', 10)
  const secure = smtpSettings.smtp_secure === 'true' || port === 465

  return nodemailer.createTransport({
    host: smtpSettings.smtp_host || '',
    port,
    secure,
    auth: smtpSettings.smtp_user
      ? {
          user: smtpSettings.smtp_user,
          pass: smtpSettings.smtp_pass || '',
        }
      : undefined,
    // Force IPv4 to avoid ECONNREFUSED on IPv6 addresses
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // For port 587, use STARTTLS
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  })
}

// ─── POST /api/email/send ────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Get SMTP settings from database
    const smtpSettings = await getSmtpSettings()

    // Check if email notifications are enabled
    if (smtpSettings.email_notification_enabled !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'Notifikasi email tidak diaktifkan. Aktifkan di halaman Pengaturan.',
        },
        { status: 400 }
      )
    }

    // Validate SMTP configuration
    if (!smtpSettings.smtp_host) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMTP Server belum dikonfigurasi. Lengkapi pengaturan SMTP di halaman Pengaturan.',
        },
        { status: 400 }
      )
    }

    if (!smtpSettings.smtp_user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username/Email SMTP belum dikonfigurasi. Lengkapi pengaturan SMTP di halaman Pengaturan.',
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { to, subject, message, html } = body as {
      to: string
      subject: string
      message?: string
      html?: string
    }

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Alamat email tujuan (to) wajib diisi' },
        { status: 400 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject email wajib diisi' },
        { status: 400 }
      )
    }

    if (!html && !message) {
      return NextResponse.json(
        { success: false, error: 'Isi email (message atau html) wajib diisi' },
        { status: 400 }
      )
    }

    // Create transporter and send email
    const transporter = createTransporter(smtpSettings)

    const mailOptions = {
      from: `"E-Tamu BKAD" <${smtpSettings.smtp_user}>`,
      to,
      subject,
      text: message || '',
      html: html || message || '',
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      data: {
        messageId: info.messageId,
        response: info.response,
      },
    })
  } catch (error: unknown) {
    console.error('Email send error:', error)

    // Provide user-friendly error messages for common SMTP errors
    const err = error as Error & { code?: string; command?: string }
    let errorMessage = 'Gagal mengirim email'

    if (err.code === 'ECONNREFUSED') {
      errorMessage = `Koneksi SMTP ditolak (${err.message}). Periksa SMTP Server dan Port di pengaturan. Pastikan server SMTP dapat dijangkau.`
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET') {
      errorMessage = 'Koneksi SMTP timeout. Periksa koneksi jaringan dan pengaturan SMTP Server.'
    } else if (err.code === 'EAUTH' || err.command === 'AUTH') {
      errorMessage = 'Autentikasi SMTP gagal. Periksa Username dan Password SMTP di pengaturan.'
    } else if (err.code === 'ENOTFOUND') {
      errorMessage = `SMTP Server "${(error as { options?: { host?: string } }).options?.host || ''}" tidak ditemukan. Periksa alamat SMTP Server.`
    } else if (err.code === 'ESOCKET') {
      errorMessage = 'Koneksi SSL/TLS gagal. Periksa pengaturan SSL/TLS dan Port SMTP.'
    } else if (err.message?.includes('self signed certificate')) {
      errorMessage = 'Sertifikat SSL tidak valid. Coba nonaktifkan SSL/TLS atau gunakan port yang berbeda.'
    } else if (err.message) {
      errorMessage = `Gagal mengirim email: ${err.message}`
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
