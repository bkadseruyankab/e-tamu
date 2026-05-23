import { db } from '@/lib/db'

// ─── Types ────────────────────────────────────────────────────────────────────
interface WhatsAppSettings {
  whatsapp_api_key: string
  whatsapp_api_url: string
  whatsapp_device_id: string
  whatsapp_notification_enabled: string
  contact_whatsapp: string
  app_name: string
  app_url: string
}

// ─── Helper: Get WhatsApp settings from database ──────────────────────────────
export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  const keys = [
    'whatsapp_api_key',
    'whatsapp_api_url',
    'whatsapp_device_id',
    'whatsapp_notification_enabled',
    'contact_whatsapp',
    'app_name',
    'app_url',
  ]

  const settings = await db.setting.findMany({
    where: { key: { in: keys } },
  })

  const obj = {} as Record<string, string>
  settings.forEach((s) => {
    obj[s.key] = s.value
  })

  return obj as unknown as WhatsAppSettings
}

// ─── Check if WhatsApp notifications are enabled and configured ──────────────
export async function isWhatsAppEnabled(): Promise<{
  enabled: boolean
  settings: WhatsAppSettings
}> {
  const settings = await getWhatsAppSettings()
  const enabled =
    settings.whatsapp_notification_enabled === 'true' &&
    !!settings.whatsapp_api_key

  return { enabled, settings }
}

// ─── Check if a specific WhatsApp notification event is enabled ──────────────
export async function isWhatsAppEventEnabled(eventKey: string): Promise<{
  enabled: boolean
  settings: WhatsAppSettings
}> {
  const { enabled, settings } = await isWhatsAppEnabled()
  if (!enabled) return { enabled: false, settings }

  // Check specific event setting
  const eventSetting = await db.setting.findUnique({ where: { key: eventKey } })
  const eventEnabled = eventSetting?.value !== 'false' // default true if not set

  return { enabled: eventEnabled, settings }
}

// ─── Send WhatsApp message via Fonnte API ────────────────────────────────────
export async function sendWhatsAppMessage(
  target: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { enabled, settings } = await isWhatsAppEnabled()

    if (!enabled) {
      console.log('[WhatsApp] Notifications disabled or API key not configured')
      return { success: false, error: 'WhatsApp notifications not enabled or configured' }
    }

    const apiUrl = settings.whatsapp_api_url || 'https://api.fonnte.com/send'
    const cleanTarget = target.replace(/[^0-9+]/g, '')

    const body: Record<string, string> = {
      target: cleanTarget,
      message,
    }

    // Include device_id if available
    if (settings.whatsapp_device_id) {
      body.device = settings.whatsapp_device_id
    }

    // Add timeout to prevent hanging (15 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: settings.whatsapp_api_key,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    // Safely parse response - handle non-JSON responses
    const contentType = response.headers.get('content-type') || ''
    let result: { status?: boolean; message?: string; reason?: string; error?: string } = {}

    if (contentType.includes('application/json')) {
      result = await response.json()
    } else {
      const text = await response.text()
      console.error('[WhatsApp] Non-JSON response:', text.substring(0, 500))
      return { success: false, error: 'Fonnte API mengembalikan respons yang tidak valid' }
    }

    // Fonnte returns { status: true } on success
    if (result.status === true || response.ok) {
      console.log(`[WhatsApp] Sent to ${cleanTarget}`)
      return { success: true }
    } else {
      const errorMsg = result.message || result.reason || result.error || 'Unknown Fonnte error'
      console.error('[WhatsApp] Fonnte API error:', errorMsg)
      return { success: false, error: errorMsg }
    }
  } catch (error: unknown) {
    const err = error as Error & { code?: string }
    console.error('[WhatsApp] Send error:', err.message || error)

    // Provide user-friendly error messages
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { success: false, error: 'Koneksi ke Fonnte API time-out. Periksa koneksi internet.' }
    }
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return { success: false, error: 'Tidak dapat terhubung ke Fonnte API. Periksa API URL.' }
    }

    return { success: false, error: err.message || 'Failed to send WhatsApp message' }
  }
}

// ─── Helper: Build footer with login link ────────────────────────────────────
function buildFooter(settings: WhatsAppSettings, status?: string): string {
  const appName = settings.app_name || 'E-Tamu BKAD'
  const appUrl = settings.app_url

  let footerText: string
  if (status === 'selesai' || status === 'check_out') {
    footerText = '_Proses telah selesai._'
  } else if (status === 'ditolak') {
    footerText = '_Proses ditolak._'
  } else {
    footerText = '_Harap segera ditindaklanjuti._'
  }

  let footer = `\n\n${footerText}`
  if (appUrl) {
    footer += `\n\n🔗 *Login ${appName}:* ${appUrl}`
  }
  return footer
}

// ─── Pre-built WhatsApp notification templates ────────────────────────────────

export async function sendGuestArrivalWhatsApp(data: {
  guestName: string
  institution: string | null
  visitPurpose: string
  department: string | null
  time: string
  targetPhone: string
}): Promise<{ success: boolean; error?: string }> {
  const { settings } = await isWhatsAppEnabled()
  const appName = settings.app_name || 'E-Tamu BKAD'

  const message =
    `🔔 *Tamu Baru - ${appName}*\n\n` +
    `👤 Nama: ${data.guestName}\n` +
    `🏢 Instansi: ${data.institution || '-'}\n` +
    `📋 Tujuan: ${data.visitPurpose}\n` +
    `🏛️ Bidang: ${data.department || '-'}\n` +
    `🕐 Waktu: ${data.time}` +
    buildFooter(settings, 'menunggu')

  return sendWhatsAppMessage(data.targetPhone, message)
}

export async function sendGuestStatusWhatsApp(data: {
  guestName: string
  status: string
  time: string
  targetPhone: string
  notes?: string
}): Promise<{ success: boolean; error?: string }> {
  const { settings } = await isWhatsAppEnabled()
  const appName = settings.app_name || 'E-Tamu BKAD'

  const statusLabels: Record<string, string> = {
    check_in: '✅ Check-In',
    dilayani: '🟡 Sedang Dilayani',
    selesai: '✔️ Selesai',
    check_out: '✔️ Check-Out',
    ditolak: '❌ Ditolak',
    menunggu: '⏳ Menunggu',
  }
  const statusLabel = statusLabels[data.status] || data.status

  const message =
    `📋 *Status Tamu - ${appName}*\n\n` +
    `👤 Tamu: ${data.guestName}\n` +
    `📋 Status: ${statusLabel}\n` +
    `🕐 Waktu: ${data.time}` +
    (data.notes ? `\n📝 Catatan: ${data.notes}` : '') +
    buildFooter(settings, data.status)

  return sendWhatsAppMessage(data.targetPhone, message)
}

export async function sendDispositionWhatsApp(data: {
  fromUserName: string
  guestName: string
  notes: string | null
  department: string | null
  targetPhone: string
  isUpdate?: boolean
  status?: string
}): Promise<{ success: boolean; error?: string }> {
  const { settings } = await isWhatsAppEnabled()
  const appName = settings.app_name || 'E-Tamu BKAD'

  const statusLabels: Record<string, string> = {
    menunggu: '⏳ Menunggu',
    diproses: '🔄 Diproses',
    selesai: '✔️ Selesai',
    ditolak: '❌ Ditolak',
  }

  if (data.isUpdate && data.status) {
    const statusLabel = statusLabels[data.status] || data.status
    const message =
      `📋 *Update Disposisi - ${appName}*\n\n` +
      `👤 Tamu: ${data.guestName}\n` +
      `📋 Status: ${statusLabel}\n` +
      `🏛️ Bidang: ${data.department || '-'}` +
      (data.notes ? `\n📝 Catatan: ${data.notes}` : '') +
      buildFooter(settings, data.status)

    return sendWhatsAppMessage(data.targetPhone, message)
  }

  const message =
    `📨 *Disposisi Baru - ${appName}*\n\n` +
    `👤 Dari: ${data.fromUserName}\n` +
    `👥 Tamu: ${data.guestName}\n` +
    `🏛️ Bidang: ${data.department || '-'}` +
    (data.notes ? `\n📝 Catatan: ${data.notes}` : '') +
    buildFooter(settings, 'menunggu')

  return sendWhatsAppMessage(data.targetPhone, message)
}

export async function sendAppointmentWhatsApp(data: {
  visitorName: string
  institution: string
  visitPurpose: string
  visitDate: string
  visitTime: string | null
  department: string | null
  employee: string | null
  numberOfPeople: number
  targetPhone: string
  isUpdate?: boolean
  status?: string
  rejectionReason?: string
}): Promise<{ success: boolean; error?: string }> {
  const { settings } = await isWhatsAppEnabled()
  const appName = settings.app_name || 'E-Tamu BKAD'

  const statusLabels: Record<string, string> = {
    menunggu: '⏳ Menunggu Konfirmasi',
    dikonfirmasi: '✅ Dikonfirmasi',
    ditolak: '❌ Ditolak',
    selesai: '✔️ Selesai',
  }

  if (data.isUpdate && data.status) {
    const statusLabel = statusLabels[data.status] || data.status
    const message =
      `📅 *Update Janji Temu - ${appName}*\n\n` +
      `📋 Status: ${statusLabel}\n` +
      `📅 Tanggal: ${data.visitDate}` +
      (data.visitTime ? `\n🕐 Waktu: ${data.visitTime}` : '') +
      (data.department ? `\n🏛️ Bidang: ${data.department}` : '') +
      (data.employee ? `\n👤 Pejabat: ${data.employee}` : '') +
      (data.rejectionReason ? `\n📝 Alasan: ${data.rejectionReason}` : '') +
      (data.status === 'dikonfirmasi'
        ? '\n\n✅ Janji temu Anda telah dikonfirmasi. Harap datang tepat waktu.'
        : data.status === 'ditolak'
          ? '\n\n❌ Mohon maaf, janji temu Anda tidak dapat dipenuhi.'
          : '') +
      buildFooter(settings, data.status)

    return sendWhatsAppMessage(data.targetPhone, message)
  }

  const message =
    `📅 *Janji Temu Baru - ${appName}*\n\n` +
    `👤 Nama: ${data.visitorName}\n` +
    `🏢 Instansi: ${data.institution}\n` +
    `📋 Tujuan: ${data.visitPurpose}\n` +
    `📅 Tanggal: ${data.visitDate}` +
    (data.visitTime ? `\n🕐 Waktu: ${data.visitTime}` : '') +
    `\n👥 Jumlah: ${data.numberOfPeople} orang` +
    (data.department ? `\n🏛️ Bidang: ${data.department}` : '') +
    (data.employee ? `\n👤 Pejabat: ${data.employee}` : '') +
    buildFooter(settings, 'menunggu')

  return sendWhatsAppMessage(data.targetPhone, message)
}
