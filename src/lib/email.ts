import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────
interface EmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

interface SmtpSettings {
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: string
  email_notification_enabled: string
  contact_email: string
  app_name: string
  app_url: string
}

// ─── Helper: Get SMTP settings from database ──────────────────────────────────
export async function getEmailSettings(): Promise<SmtpSettings> {
  const keys = [
    'smtp_host',
    'smtp_port',
    'smtp_user',
    'smtp_pass',
    'smtp_secure',
    'email_notification_enabled',
    'contact_email',
    'app_name',
    'app_url',
  ]

  const settings = await db.setting.findMany({
    where: { key: { in: keys } },
  })

  const obj = {} as SmtpSettings
  settings.forEach((s) => {
    ;(obj as Record<string, string>)[s.key] = s.value
  })

  return obj
}

// ─── Helper: Create nodemailer transporter ────────────────────────────────────
function createTransporter(smtpSettings: SmtpSettings) {
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
    // (common issue with some SMTP servers that don't listen on IPv6)
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    // For port 587, use STARTTLS; for port 465, use implicit TLS
    ...(port === 587 && !secure ? { requireTLS: true } : {}),
  })
}

// ─── Check if email notifications are enabled and configured ──────────────────
export async function isEmailNotificationEnabled(): Promise<{
  enabled: boolean
  settings: SmtpSettings
}> {
  const settings = await getEmailSettings()
  const enabled =
    settings.email_notification_enabled === 'true' &&
    !!settings.smtp_host &&
    !!settings.smtp_user

  return { enabled, settings }
}

// ─── Check if a specific email notification event is enabled ──────────────────
export async function isEmailEventEnabled(eventKey: string): Promise<{
  enabled: boolean
  settings: SmtpSettings
}> {
  const { enabled, settings } = await isEmailNotificationEnabled()
  if (!enabled) return { enabled: false, settings }

  // Check specific event setting
  const eventSetting = await db.setting.findUnique({ where: { key: eventKey } })
  const eventEnabled = eventSetting?.value !== 'false' // default true if not set

  return { enabled: eventEnabled, settings }
}

// ─── Send email notification ──────────────────────────────────────────────────
export async function sendEmailNotification(options: EmailOptions): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const { enabled, settings } = await isEmailNotificationEnabled()

    if (!enabled) {
      console.log('[Email] Notifications disabled or SMTP not configured')
      return { success: false, error: 'Email notifications not enabled or configured' }
    }

    const transporter = createTransporter(settings)
    const appName = settings.app_name || 'E-Tamu BKAD'

    const mailOptions = {
      from: `"${appName}" <${settings.smtp_user}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || '',
      html: options.html || options.text || '',
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`[Email] Sent to ${options.to}, messageId: ${info.messageId}`)
    return { success: true }
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    console.error('[Email] Send error:', err.message || error)
    return { success: false, error: err.message || 'Failed to send email' }
  }
}

// ─── Send email with styled HTML template ─────────────────────────────────────
export async function sendStyledEmail(options: {
  to: string
  subject: string
  title: string
  greeting?: string
  bodyContent: string
  footerText?: string
}): Promise<{ success: boolean; error?: string }> {
  const { settings } = await isEmailNotificationEnabled()
  const appName = settings.app_name || 'E-Tamu BKAD'
  const appUrl = settings.app_url || ''

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #0c2d57, #1a4072); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #c9a84c; margin: 0; font-size: 22px;">${appName}</h1>
        <p style="color: #e2e8f0; margin: 8px 0 0; font-size: 13px;">Sistem Tamu Digital</p>
      </div>
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none;">
        ${options.greeting ? `<p style="color: #334155; font-size: 15px; margin: 0 0 16px;">${options.greeting}</p>` : ''}
        <h2 style="color: #0c2d57; margin: 0 0 16px; font-size: 18px;">${options.title}</h2>
        ${options.bodyContent}
        ${appUrl ? `
          <div style="text-align: center; margin: 24px 0 8px;">
            <a href="${appUrl}" style="background: linear-gradient(135deg, #0c2d57, #1a4072); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
              Buka Sistem ${appName}
            </a>
          </div>
        ` : ''}
      </div>
      <div style="text-align: center; padding: 16px; color: #94a3b8; font-size: 12px;">
        ${options.footerText || `Email ini dikirim otomatis oleh sistem ${appName}`}
      </div>
    </div>
  `

  return sendEmailNotification({
    to: options.to,
    subject: options.subject,
    html,
  })
}

// ─── Pre-built email templates for common events ──────────────────────────────

export async function sendGuestArrivalEmail(data: {
  guestName: string
  institution: string | null
  visitPurpose: string
  department: string | null
  time: string
  recipientEmail: string
}): Promise<{ success: boolean; error?: string }> {
  return sendStyledEmail({
    to: data.recipientEmail,
    subject: `🔔 Tamu Baru - ${data.guestName}`,
    greeting: 'Halo Admin,',
    title: 'Tamu Baru Telah Mendaftar',
    bodyContent: `
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">👤 Nama</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏢 Instansi</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.institution || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📋 Tujuan</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.visitPurpose}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏛️ Bidang</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.department || '-'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🕐 Waktu</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.time}</td>
          </tr>
        </table>
      </div>
      <p style="color: #475569; font-size: 14px; margin: 0;">Harap segera dilayani.</p>
    `,
  })
}

export async function sendGuestStatusEmail(data: {
  guestName: string
  status: string
  time: string
  recipientEmail: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    check_in: '✅ Check-In',
    dilayani: '🟡 Sedang Dilayani',
    selesai: '✔️ Selesai',
    check_out: '✔️ Check-Out',
    ditolak: '❌ Ditolak',
    menunggu: '⏳ Menunggu',
  }

  const statusLabel = statusLabels[data.status] || data.status

  return sendStyledEmail({
    to: data.recipientEmail,
    subject: `📋 Status Tamu - ${data.guestName} (${statusLabel})`,
    greeting: 'Halo,',
    title: `Status Tamu Diperbarui: ${statusLabel}`,
    bodyContent: `
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">👤 Tamu</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📋 Status</td>
            <td style="padding: 6px 0; color: #0f172a;">${statusLabel}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🕐 Waktu</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.time}</td>
          </tr>
          ${data.notes ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📝 Catatan</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.notes}</td>
          </tr>
          ` : ''}
        </table>
      </div>
    `,
  })
}

export async function sendDispositionEmail(data: {
  fromUserName: string
  guestName: string
  notes: string | null
  department: string | null
  recipientEmail: string
  isUpdate?: boolean
  status?: string
}): Promise<{ success: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    menunggu: '⏳ Menunggu',
    diproses: '🔄 Diproses',
    selesai: '✔️ Selesai',
    ditolak: '❌ Ditolak',
  }

  if (data.isUpdate && data.status) {
    const statusLabel = statusLabels[data.status] || data.status
    return sendStyledEmail({
      to: data.recipientEmail,
      subject: `📋 Update Disposisi - ${data.guestName} (${statusLabel})`,
      greeting: 'Halo,',
      title: `Disposisi Diperbarui: ${statusLabel}`,
      bodyContent: `
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">👤 Tamu</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.guestName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📋 Status</td>
              <td style="padding: 6px 0; color: #0f172a;">${statusLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏛️ Bidang</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.department || '-'}</td>
            </tr>
            ${data.notes ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📝 Catatan</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.notes}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ${data.status === 'selesai' ? '<p style="color: #16a34a; font-size: 14px; margin: 0;">Disposisi telah selesai.</p>' : data.status === 'ditolak' ? '<p style="color: #dc2626; font-size: 14px; margin: 0;">Disposisi ditolak.</p>' : '<p style="color: #475569; font-size: 14px; margin: 0;">Harap segera ditindaklanjuti.</p>'}
      `,
    })
  }

  return sendStyledEmail({
    to: data.recipientEmail,
    subject: `📨 Disposisi Baru dari ${data.fromUserName} - ${data.guestName}`,
    greeting: 'Halo,',
    title: 'Anda Menerima Disposisi Baru',
    bodyContent: `
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">👤 Dari</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.fromUserName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">👥 Tamu</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.guestName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏛️ Bidang</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.department || '-'}</td>
          </tr>
          ${data.notes ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📝 Catatan</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.notes}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <p style="color: #475569; font-size: 14px; margin: 0;">Harap segera ditindaklanjuti.</p>
    `,
  })
}

export async function sendAppointmentEmail(data: {
  visitorName: string
  institution: string
  visitPurpose: string
  visitDate: string
  visitTime: string | null
  department: string | null
  employee: string | null
  numberOfPeople: number
  recipientEmail: string
  isUpdate?: boolean
  status?: string
  rejectionReason?: string
}): Promise<{ success: boolean; error?: string }> {
  const statusLabels: Record<string, string> = {
    menunggu: '⏳ Menunggu Konfirmasi',
    dikonfirmasi: '✅ Dikonfirmasi',
    ditolak: '❌ Ditolak',
    selesai: '✔️ Selesai',
  }

  if (data.isUpdate && data.status) {
    const statusLabel = statusLabels[data.status] || data.status
    return sendStyledEmail({
      to: data.recipientEmail,
      subject: `📅 Update Janji Temu - ${data.visitorName} (${statusLabel})`,
      greeting: `Halo ${data.visitorName},`,
      title: `Status Janji Temu: ${statusLabel}`,
      bodyContent: `
        <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">📋 Status</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${statusLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📅 Tanggal</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.visitDate}</td>
            </tr>
            ${data.visitTime ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🕐 Waktu</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.visitTime}</td>
            </tr>
            ` : ''}
            ${data.department ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏛️ Bidang</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.department}</td>
            </tr>
            ` : ''}
            ${data.employee ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">👤 Pejabat</td>
              <td style="padding: 6px 0; color: #0f172a;">${data.employee}</td>
            </tr>
            ` : ''}
            ${data.rejectionReason ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📝 Alasan</td>
              <td style="padding: 6px 0; color: #dc2626;">${data.rejectionReason}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ${data.status === 'dikonfirmasi' ? '<p style="color: #16a34a; font-size: 14px; margin: 0;">Janji temu Anda telah dikonfirmasi. Harap datang tepat waktu.</p>' : ''}
        ${data.status === 'ditolak' ? '<p style="color: #dc2626; font-size: 14px; margin: 0;">Mohon maaf, janji temu Anda tidak dapat dipenuhi.</p>' : ''}
        ${data.status === 'selesai' ? '<p style="color: #16a34a; font-size: 14px; margin: 0;">Janji temu telah selesai.</p>' : ''}
      `,
    })
  }

  return sendStyledEmail({
    to: data.recipientEmail,
    subject: `📅 Janji Temu Baru - ${data.visitorName}`,
    greeting: 'Halo Admin,',
    title: 'Janji Temu Baru Telah Dibuat',
    bodyContent: `
      <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px; vertical-align: top;">👤 Nama</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${data.visitorName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏢 Instansi</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.institution}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📋 Tujuan</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.visitPurpose}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">📅 Tanggal</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.visitDate}</td>
          </tr>
          ${data.visitTime ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🕐 Waktu</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.visitTime}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">👥 Jumlah</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.numberOfPeople} orang</td>
          </tr>
          ${data.department ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">🏛️ Bidang</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.department}</td>
          </tr>
          ` : ''}
          ${data.employee ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b; vertical-align: top;">👤 Pejabat</td>
            <td style="padding: 6px 0; color: #0f172a;">${data.employee}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      <p style="color: #475569; font-size: 14px; margin: 0;">Harap segera dikonfirmasi.</p>
    `,
  })
}
