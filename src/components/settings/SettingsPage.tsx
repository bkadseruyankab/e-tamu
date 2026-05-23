'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  Save,
  Info,
  Bell,
  Loader2,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  X,
  QrCode,
  Key,
  MessageSquare,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useSettings } from '@/components/shared/AppLogo'

// ─── Color Theme ────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0c2d57',
  navyLight: '#1a4072',
  gold: '#c9a84c',
  goldLight: '#d4ba6a',
  slate: '#64748b',
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface SettingsForm {
  app_name: string
  app_title: string
  app_url: string
  running_text: string
  logo_url: string
  favicon_url: string
  contact_email: string
  contact_whatsapp: string
  whatsapp_api_key: string
  whatsapp_api_url: string
  whatsapp_device_id: string
  email_notification_enabled: string
  email_on_guest_arrival: string
  email_on_guest_status: string
  email_on_disposition: string
  email_on_disposition_status: string
  email_on_appointment: string
  email_on_appointment_status: string
  whatsapp_notification_enabled: string
  whatsapp_on_guest_arrival: string
  whatsapp_on_guest_status: string
  whatsapp_on_disposition: string
  whatsapp_on_disposition_status: string
  whatsapp_on_appointment: string
  whatsapp_on_appointment_status: string
  smtp_host: string
  smtp_port: string
  smtp_user: string
  smtp_pass: string
  smtp_secure: string
  qr_code_enabled: string
  qr_code_url: string
}

const defaultSettings: SettingsForm = {
  app_name: 'E-Tamu BKAD',
  app_title: 'Sistem Tamu Digital BKAD',
  app_url: '',
  running_text: 'Selamat datang di E-Tamu BKAD — Sistem Tamu Digital',
  logo_url: '',
  favicon_url: '',
  contact_email: '',
  contact_whatsapp: '',
  whatsapp_api_key: '',
  whatsapp_api_url: 'https://api.fonnte.com/send',
  whatsapp_device_id: '',
  email_notification_enabled: 'false',
  email_on_guest_arrival: 'true',
  email_on_guest_status: 'true',
  email_on_disposition: 'true',
  email_on_disposition_status: 'true',
  email_on_appointment: 'true',
  email_on_appointment_status: 'true',
  whatsapp_notification_enabled: 'false',
  whatsapp_on_guest_arrival: 'true',
  whatsapp_on_guest_status: 'true',
  whatsapp_on_disposition: 'true',
  whatsapp_on_disposition_status: 'true',
  whatsapp_on_appointment: 'true',
  whatsapp_on_appointment_status: 'true',
  smtp_host: '',
  smtp_port: '587',
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: 'false',
  qr_code_enabled: 'true',
  qr_code_url: '',
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-0">
      <div className="px-4 md:px-6 pt-5 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <div className="max-w-3xl mx-auto px-4 md:px-6 mt-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { refetch: refetchGlobalSettings } = useSettings()
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSmtpPass, setShowSmtpPass] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testingWhatsApp, setTestingWhatsApp] = useState(false)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json') || !res.ok) {
        console.warn('Settings API returned non-JSON or error, using defaults')
        return
      }
      const json = await res.json()
      if (json.success && json.data) {
        const data = json.data
        setSettings({
          app_name: data.app_name || defaultSettings.app_name,
          app_title: data.app_title || defaultSettings.app_title,
          app_url: data.app_url || defaultSettings.app_url,
          running_text: data.running_text || data.marquee_text || defaultSettings.running_text,
          logo_url: data.logo_url || defaultSettings.logo_url,
          favicon_url: data.favicon_url || defaultSettings.favicon_url,
          contact_email: data.contact_email || defaultSettings.contact_email,
          contact_whatsapp: data.contact_whatsapp || defaultSettings.contact_whatsapp,
          whatsapp_api_key: data.whatsapp_api_key || defaultSettings.whatsapp_api_key,
          whatsapp_api_url: data.whatsapp_api_url || defaultSettings.whatsapp_api_url,
          whatsapp_device_id: data.whatsapp_device_id || defaultSettings.whatsapp_device_id,
          email_notification_enabled: data.email_notification_enabled || 'false',
          email_on_guest_arrival: data.email_on_guest_arrival || 'true',
          email_on_guest_status: data.email_on_guest_status || 'true',
          email_on_disposition: data.email_on_disposition || 'true',
          email_on_disposition_status: data.email_on_disposition_status || 'true',
          email_on_appointment: data.email_on_appointment || 'true',
          email_on_appointment_status: data.email_on_appointment_status || 'true',
          whatsapp_notification_enabled: data.whatsapp_notification_enabled || 'false',
          whatsapp_on_guest_arrival: data.whatsapp_on_guest_arrival || 'true',
          whatsapp_on_guest_status: data.whatsapp_on_guest_status || 'true',
          whatsapp_on_disposition: data.whatsapp_on_disposition || 'true',
          whatsapp_on_disposition_status: data.whatsapp_on_disposition_status || 'true',
          whatsapp_on_appointment: data.whatsapp_on_appointment || 'true',
          whatsapp_on_appointment_status: data.whatsapp_on_appointment_status || 'true',
          smtp_host: data.smtp_host || defaultSettings.smtp_host,
          smtp_port: data.smtp_port || defaultSettings.smtp_port,
          smtp_user: data.smtp_user || defaultSettings.smtp_user,
          smtp_pass: data.smtp_pass || defaultSettings.smtp_pass,
          smtp_secure: data.smtp_secure || 'false',
          qr_code_enabled: data.qr_code_enabled || 'true',
          qr_code_url: data.qr_code_url || defaultSettings.qr_code_url,
        })
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      toast.error('Gagal memuat pengaturan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleChange = (key: keyof SettingsForm, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSwitchChange = (key: keyof SettingsForm, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: String(checked) }))
    setHasChanges(true)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      // Safely parse JSON
      let data: { success?: boolean; data?: { url: string }; error?: string } = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        toast.error('Server mengembalikan respons yang tidak valid')
        return
      }
      if (data.success && data.data) {
        setSettings((prev) => ({ ...prev, logo_url: data.data.url, favicon_url: data.data.url }))
        setLogoPreview(data.data.url)
        setHasChanges(true)
        toast.success('Logo berhasil diupload (favicon juga diperbarui)')
        refetchGlobalSettings()
      } else {
        toast.error(data.error || 'Gagal mengupload logo')
      }
    } catch (err) {
      console.error('Upload error:', err)
      toast.error('Gagal mengupload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, logo_url: '', favicon_url: '' }))
    setLogoPreview(null)
    setHasChanges(true)
  }

  const handleTestEmail = async () => {
    if (!settings.smtp_host) {
      toast.error('SMTP Server belum diisi')
      return
    }
    if (!settings.smtp_user) {
      toast.error('Username SMTP belum diisi')
      return
    }
    if (!settings.contact_email) {
      toast.error('Alamat Email tujuan belum diisi')
      return
    }

    setTestingEmail(true)
    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_user: settings.smtp_user,
          smtp_pass: settings.smtp_pass,
          smtp_secure: settings.smtp_secure,
        }),
      })

      // Safely parse JSON
      let data: { success?: boolean; data?: { recipient?: string }; error?: string } = {}
      const emailContentType = res.headers.get('content-type') || ''
      if (emailContentType.includes('application/json')) {
        data = await res.json()
      } else {
        toast.error('Server mengembalikan respons yang tidak valid')
        return
      }
      if (data.success) {
        toast.success(`Email test berhasil dikirim ke ${data.data?.recipient || settings.contact_email}`)
      } else {
        toast.error(data.error || 'Gagal mengirim email test')
      }
    } catch {
      toast.error('Gagal menghubungi server email')
    } finally {
      setTestingEmail(false)
    }
  }

  const handleTestWhatsApp = async () => {
    if (!settings.whatsapp_api_key) {
      toast.error('API Key WhatsApp belum diisi')
      return
    }
    if (!settings.contact_whatsapp) {
      toast.error('Nomor WhatsApp tujuan belum diisi')
      return
    }

    setTestingWhatsApp(true)
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: settings.whatsapp_api_key,
          api_url: settings.whatsapp_api_url,
          target: settings.contact_whatsapp,
          device_id: settings.whatsapp_device_id,
        }),
      })

      // Safely parse JSON
      let data: { success?: boolean; error?: string; data?: { target?: string } } = {}
      const waContentType = res.headers.get('content-type') || ''
      if (waContentType.includes('application/json')) {
        data = await res.json()
      } else {
        toast.error('Server mengembalikan respons yang tidak valid')
        return
      }
      if (data.success) {
        toast.success(`Pesan test WhatsApp berhasil dikirim ke ${data.data?.target || settings.contact_whatsapp}!`)
      } else {
        toast.error(data.error || 'Gagal mengirim pesan test WhatsApp')
      }
    } catch {
      toast.error('Gagal menghubungi server WhatsApp')
    } finally {
      setTestingWhatsApp(false)
    }
  }

  const handleGenerateQr = async () => {
    setLoadingQr(true)
    try {
      const res = await fetch('/api/qrcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qr_code_enabled: settings.qr_code_enabled,
          logo_url: settings.logo_url,
        }),
      })

      // Safely parse JSON
      let data: { success?: boolean; data?: { qrDataUrl?: string }; error?: string } = {}
      const qrContentType = res.headers.get('content-type') || ''
      if (qrContentType.includes('application/json')) {
        data = await res.json()
      } else {
        toast.error('Server mengembalikan respons yang tidak valid')
        return
      }
      if (data.success && data.data) {
        setQrPreview(data.data.qrDataUrl)
        setSettings((prev) => ({ ...prev, qr_code_url: data.data.qrDataUrl }))
        setHasChanges(true)
        toast.success('QR Code berhasil digenerate')
      } else {
        toast.error(data.error || 'Gagal generate QR Code')
      }
    } catch {
      toast.error('Gagal generate QR Code')
    } finally {
      setLoadingQr(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      // Safely parse JSON
      const saveContentType = res.headers.get('content-type') || ''
      if (!saveContentType.includes('application/json')) {
        toast.error('Server mengembalikan respons yang tidak valid')
        return
      }
      const json = await res.json()
      if (json.success) {
        toast.success('Pengaturan berhasil disimpan')
        setHasChanges(false)
        refetchGlobalSettings()
      } else {
        toast.error(json.error || 'Gagal menyimpan pengaturan')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <SettingsSkeleton />
  }

  return (
    <div className="space-y-0">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: COLORS.navy }}
            >
              Pengaturan Aplikasi
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola konfigurasi dan pengaturan sistem E-Tamu
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            style={{ borderColor: COLORS.navy, color: COLORS.navy }}
            onClick={() => {
              setLoading(true)
              fetchSettings()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* ─── Settings Form ─────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 mt-4 space-y-5 pb-6">
        {/* Logo Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${COLORS.gold}15` }}
                >
                  <ImageIcon className="h-5 w-5" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    Logo Aplikasi
                  </CardTitle>
                  <CardDescription>Upload logo yang ditampilkan di seluruh aplikasi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Logo Preview */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50 overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <ImageIcon className="size-10" />
                        <span className="text-xs">No logo</span>
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-7"
                      onClick={handleRemoveLogo}
                    >
                      <X className="size-3 mr-1" />
                      Hapus Logo
                    </Button>
                  )}
                </div>
                {/* Upload area */}
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Upload Logo Baru
                    </Label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Format: PNG, JPG, SVG, WebP. Maks. 2MB. Disarankan ukuran 512x512px
                    </p>
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    variant="outline"
                    className="gap-2 w-full border-dashed border-2 h-24 hover:border-[#c9a84c] hover:bg-[#c9a84c]/5"
                    style={{ borderColor: COLORS.navy + '40' }}
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="size-5 animate-spin" style={{ color: COLORS.gold }} />
                        <span className="text-sm" style={{ color: COLORS.navy }}>Mengupload...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="size-5" style={{ color: COLORS.navy }} />
                        <span className="text-sm" style={{ color: COLORS.navy }}>Klik untuk upload logo</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {/* Favicon info */}
              <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {settings.favicon_url || settings.logo_url ? (
                    <img
                      src={settings.favicon_url || settings.logo_url}
                      alt="Favicon preview"
                      className="size-8 rounded object-contain border border-blue-200 bg-white"
                    />
                  ) : (
                    <div className="size-8 rounded bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="size-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-800">Favicon Browser Tab</p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    Favicon otomatis mengikuti logo yang di-upload. Upload logo di atas untuk mengubah ikon pada tab browser.
                  </p>
                </div>
                {(settings.favicon_url || settings.logo_url) && (
                  <span className="text-[10px] font-medium text-green-600 flex items-center gap-1 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Aktif
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Informasi Aplikasi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${COLORS.navy}15` }}
                >
                  <Info className="h-5 w-5" style={{ color: COLORS.navy }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    Informasi Aplikasi
                  </CardTitle>
                  <CardDescription>Pengaturan nama dan teks yang ditampilkan</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="app_name" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Nama Aplikasi
                </Label>
                <Input
                  id="app_name"
                  value={settings.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  placeholder="Masukkan nama aplikasi"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_title" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Judul Aplikasi
                </Label>
                <Input
                  id="app_title"
                  value={settings.app_title}
                  onChange={(e) => handleChange('app_title', e.target.value)}
                  placeholder="Masukkan judul aplikasi"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="running_text" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Running Text
                </Label>
                <Input
                  id="running_text"
                  value={settings.running_text}
                  onChange={(e) => handleChange('running_text', e.target.value)}
                  placeholder="Masukkan teks berjalan"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
                <p className="text-xs text-gray-400">Teks ini akan ditampilkan sebagai teks berjalan di bagian atas halaman</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_url" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                  <i className="fa-solid fa-link text-blue-500 text-sm" />
                  URL Aplikasi
                </Label>
                <Input
                  id="app_url"
                  type="url"
                  value={settings.app_url}
                  onChange={(e) => handleChange('app_url', e.target.value)}
                  placeholder="https://etamu.bkad.seruyan.go.id"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
                <p className="text-xs text-gray-400">URL aplikasi yang digunakan untuk link di email & WhatsApp notifikasi</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pengaturan Kontak & Notifikasi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${COLORS.gold}15` }}
                >
                  <Bell className="h-5 w-5" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    Kontak & Notifikasi
                  </CardTitle>
                  <CardDescription>Pengaturan email, WhatsApp, dan notifikasi</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Email Settings */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-4 bg-gradient-to-r from-blue-50/50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-10 rounded-lg bg-[#0c2d57] text-white">
                      <i className="fa-solid fa-envelope text-lg" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                        Pengaturan Email
                      </h4>
                      <p className="text-xs text-gray-400">Konfigurasi email dan SMTP untuk notifikasi</p>
                    </div>
                  </div>
                  {/* Email Status Badge */}
                  {settings.email_notification_enabled === 'true' && settings.smtp_host && settings.smtp_user ? (
                    <span className="text-[11px] font-medium text-green-600 flex items-center gap-1.5 flex-shrink-0 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Siap
                    </span>
                  ) : settings.email_notification_enabled === 'true' ? (
                    <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1.5 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                      Belum Lengkap
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                      Nonaktif
                    </span>
                  )}
                </div>
                <div className="space-y-3 pl-1">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <i className="fa-solid fa-at text-blue-500" />
                      Alamat Email Penerima
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => handleChange('contact_email', e.target.value)}
                      placeholder="admin@bkad.seruyan.go.id"
                      className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                    />
                    <p className="text-xs text-gray-400">Email penerima notifikasi</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-white/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-bell text-blue-500 text-sm" />
                      <div>
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Notifikasi Email
                        </Label>
                        <p className="text-xs text-gray-400">Kirim notifikasi melalui email</p>
                      </div>
                    </div>
                    <Switch
                      id="email_notification"
                      checked={settings.email_notification_enabled === 'true'}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('email_notification_enabled', checked)
                      }
                    />
                  </div>

                  {/* Email Notification Events */}
                  {settings.email_notification_enabled === 'true' && (
                    <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-list-check text-amber-600 text-sm" />
                        <span className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                          Event Notifikasi Email
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Pilih event yang akan mengirimkan notifikasi email
                      </p>
                      <div className="space-y-2">
                        {/* Guest Arrival */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-user-plus text-blue-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Tamu Baru Mendaftar
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat ada tamu baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_guest_arrival === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_guest_arrival', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Guest Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrow-right-arrow-left text-green-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Tamu Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat check-in, selesai, dll</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_guest_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_guest_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Disposition Created */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-share-from-square text-purple-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Disposisi Baru
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat ada disposisi baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_disposition === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_disposition', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Disposition Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-clipboard-check text-orange-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Disposisi Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat disposisi diproses/selesai</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_disposition_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_disposition_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Appointment Created */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-calendar-plus text-teal-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Janji Temu Baru
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat ada janji temu baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_appointment === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_appointment', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Appointment Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-calendar-check text-emerald-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Janji Temu Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">Email saat dikonfirmasi/ditolak (ke admin & pengunjung)</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.email_on_appointment_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('email_on_appointment_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMTP Configuration */}
                  <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <i className="fa-solid fa-server text-blue-500 text-sm" />
                      <span className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                        Konfigurasi SMTP
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Konfigurasi SMTP diperlukan untuk mengirim email notifikasi. Jika menggunakan Gmail, gunakan App Password (bukan password akun).
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="smtp_host" className="text-xs font-medium" style={{ color: COLORS.navy }}>
                          SMTP Server
                        </Label>
                        <Input
                          id="smtp_host"
                          type="text"
                          value={settings.smtp_host}
                          onChange={(e) => handleChange('smtp_host', e.target.value)}
                          placeholder="smtp.gmail.com"
                          className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_port" className="text-xs font-medium" style={{ color: COLORS.navy }}>
                          Port
                        </Label>
                        <Input
                          id="smtp_port"
                          type="text"
                          value={settings.smtp_port}
                          onChange={(e) => handleChange('smtp_port', e.target.value)}
                          placeholder="587"
                          className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 h-9 text-sm"
                        />
                        <p className="text-[11px] text-gray-400">587 (TLS) atau 465 (SSL)</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_secure" className="text-xs font-medium" style={{ color: COLORS.navy }}>
                          SSL/TLS
                        </Label>
                        <div className="flex items-center gap-2 h-9">
                          <Switch
                            id="smtp_secure"
                            checked={settings.smtp_secure === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('smtp_secure', checked)
                            }
                          />
                          <span className="text-xs text-gray-500">
                            {settings.smtp_secure === 'true' ? 'SSL/TLS' : 'STARTTLS'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          Port 465 → SSL, Port 587 → STARTTLS
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_user" className="text-xs font-medium" style={{ color: COLORS.navy }}>
                          Username / Email SMTP
                        </Label>
                        <Input
                          id="smtp_user"
                          type="text"
                          value={settings.smtp_user}
                          onChange={(e) => handleChange('smtp_user', e.target.value)}
                          placeholder="admin@bkad.seruyan.go.id"
                          className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_pass" className="text-xs font-medium" style={{ color: COLORS.navy }}>
                          Password SMTP
                        </Label>
                        <div className="relative">
                          <Input
                            id="smtp_pass"
                            type={showSmtpPass ? 'text' : 'password'}
                            value={settings.smtp_pass}
                            onChange={(e) => handleChange('smtp_pass', e.target.value)}
                            placeholder="••••••••"
                            className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 h-9 text-sm pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSmtpPass(!showSmtpPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showSmtpPass ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400">Gunakan App Password untuk Gmail</p>
                      </div>
                    </div>

                    {/* Test Email Button */}
                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-[#0c2d57] border-[#0c2d57]/30 hover:bg-[#0c2d57]/5 text-xs"
                        onClick={handleTestEmail}
                        disabled={testingEmail || !settings.smtp_host || !settings.smtp_user}
                      >
                        {testingEmail ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-paper-plane text-xs" />
                            Test Email
                          </>
                        )}
                      </Button>
                      <span className="text-[11px] text-gray-400">
                        Kirim email test ke {settings.contact_email || 'alamat email di atas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Settings */}
              <div className="rounded-xl border border-gray-100 p-4 space-y-4 bg-gradient-to-r from-green-50/50 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-[#25D366] text-white">
                    <i className="fa-brands fa-whatsapp text-xl" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                      Pengaturan WhatsApp
                    </h4>
                    <p className="text-xs text-gray-400">Konfigurasi WhatsApp untuk notifikasi & pesan otomatis</p>
                  </div>
                </div>
                <div className="space-y-3 pl-1">
                  <div className="space-y-2">
                    <Label htmlFor="contact_whatsapp" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                      <i className="fa-brands fa-whatsapp text-green-500" />
                      Nomor WhatsApp
                    </Label>
                    <Input
                      id="contact_whatsapp"
                      type="tel"
                      value={settings.contact_whatsapp}
                      onChange={(e) => handleChange('contact_whatsapp', e.target.value)}
                      placeholder="+6281234567890"
                      className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                    />
                    <p className="text-xs text-gray-400">
                      Nomor WhatsApp dengan kode negara (contoh: +6281234567890)
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-white/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <i className="fa-brands fa-whatsapp text-green-500 text-sm" />
                      <div>
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Notifikasi WhatsApp
                        </Label>
                        <p className="text-xs text-gray-400">Kirim notifikasi melalui WhatsApp</p>
                      </div>
                    </div>
                    <Switch
                      id="whatsapp_notification"
                      checked={settings.whatsapp_notification_enabled === 'true'}
                      onCheckedChange={(checked) =>
                        handleSwitchChange('whatsapp_notification_enabled', checked)
                      }
                    />
                  </div>

                  {/* WhatsApp Notification Events */}
                  {settings.whatsapp_notification_enabled === 'true' && (
                    <div className="mt-2 rounded-lg border border-green-100 bg-green-50/30 p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <i className="fa-solid fa-list-check text-green-600 text-sm" />
                        <span className="text-sm font-semibold" style={{ color: COLORS.navy }}>
                          Event Notifikasi WhatsApp
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        Pilih event yang akan mengirimkan notifikasi WhatsApp
                      </p>
                      <div className="space-y-2">
                        {/* Guest Arrival */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-user-plus text-blue-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Tamu Baru Mendaftar
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat ada tamu baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_guest_arrival === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_guest_arrival', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Guest Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-arrow-right-arrow-left text-green-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Tamu Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat check-in, selesai, dll</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_guest_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_guest_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Disposition Created */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-share-from-square text-purple-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Disposisi Baru
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat ada disposisi baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_disposition === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_disposition', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Disposition Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-clipboard-check text-orange-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Disposisi Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat disposisi diproses/selesai</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_disposition_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_disposition_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Appointment Created */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-calendar-plus text-teal-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Janji Temu Baru
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat ada janji temu baru</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_appointment === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_appointment', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                        {/* Appointment Status */}
                        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/60 p-2.5 hover:bg-white/90 transition-colors">
                          <div className="flex items-center gap-2">
                            <i className="fa-solid fa-calendar-check text-emerald-500 text-xs" />
                            <div>
                              <Label className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                Status Janji Temu Berubah
                              </Label>
                              <p className="text-[11px] text-gray-400">WhatsApp saat dikonfirmasi/ditolak (ke admin & pengunjung)</p>
                            </div>
                          </div>
                          <Switch
                            checked={settings.whatsapp_on_appointment_status === 'true'}
                            onCheckedChange={(checked) =>
                              handleSwitchChange('whatsapp_on_appointment_status', checked)
                            }
                            className="scale-90"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* WhatsApp API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: '#25D36615' }}
                >
                  <Key className="h-5 w-5 text-[#25D366]" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    API WhatsApp (Fonnte)
                  </CardTitle>
                  <CardDescription>Konfigurasi API key untuk integrasi WhatsApp otomatis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info box */}
              <div className="rounded-lg bg-green-50 border border-green-100 p-3 flex items-start gap-2">
                <i className="fa-solid fa-circle-info text-green-500 mt-0.5 text-sm" />
                <div className="text-xs text-green-700 leading-relaxed">
                  <span className="font-semibold">Cara mendapatkan API Key:</span>{' '}
                  Daftar di{' '}
                  <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-green-800">
                    fonnte.com
                  </a>
                  , buat akun, tambahkan perangkat WhatsApp, lalu salin API Key dari dashboard.
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp_api_key" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                  <Key className="size-4 text-[#25D366]" />
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="whatsapp_api_key"
                    type={showApiKey ? 'text' : 'password'}
                    value={settings.whatsapp_api_key}
                    onChange={(e) => handleChange('whatsapp_api_key', e.target.value)}
                    placeholder="Masukkan API Key Fonnte Anda"
                    className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">API Key dari Fonnte untuk mengirim pesan WhatsApp otomatis</p>
              </div>

              {/* API URL */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp_api_url" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                  <MessageSquare className="size-4 text-[#25D366]" />
                  API URL
                </Label>
                <Input
                  id="whatsapp_api_url"
                  type="url"
                  value={settings.whatsapp_api_url}
                  onChange={(e) => handleChange('whatsapp_api_url', e.target.value)}
                  placeholder="https://api.fonnte.com/send"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
                <p className="text-xs text-gray-400">URL endpoint API WhatsApp (default: Fonnte)</p>
              </div>

              {/* Device ID */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp_device_id" className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.navy }}>
                  <i className="fa-solid fa-mobile-screen-button text-[#25D366] size-4" />
                  Device ID
                </Label>
                <Input
                  id="whatsapp_device_id"
                  type="text"
                  value={settings.whatsapp_device_id}
                  onChange={(e) => handleChange('whatsapp_device_id', e.target.value)}
                  placeholder="Contoh: SSLuFVHkCEHvAUCzoayv"
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
                <p className="text-xs text-gray-400">Device ID dari Fonnte (ditemukan di dashboard Fonnte → Perangkat)</p>
              </div>

              {/* Test connection */}
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/5"
                  onClick={handleTestWhatsApp}
                  disabled={!settings.whatsapp_api_key || !settings.contact_whatsapp || testingWhatsApp}
                >
                  {testingWhatsApp ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <i className="fa-brands fa-whatsapp text-base" />
                      Test Koneksi
                    </>
                  )}
                </Button>
                <a
                  href="https://fonnte.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#25D366] transition-colors"
                >
                  <ExternalLink className="size-3" />
                  Buka Fonnte
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Code Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: `${COLORS.navy}15` }}
                >
                  <QrCode className="h-5 w-5" style={{ color: COLORS.navy }} />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                    QR Code Pendaftaran Tamu
                  </CardTitle>
                  <CardDescription>QR Code untuk pendaftaran cepat tamu yang berkunjung langsung ke kantor</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Info */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
                <i className="fa-solid fa-qrcode text-blue-500 mt-0.5 text-sm" />
                <div className="text-xs text-blue-700 leading-relaxed">
                  QR Code akan ditampilkan di halaman login. Tamu dapat memindai QR Code untuk langsung mengisi formulir pendaftaran tamu secara cepat. Logo aplikasi akan ditambahkan di tengah QR Code.
                </div>
              </div>

              {/* Enable QR Code */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-white/80 transition-colors">
                <div className="flex items-center gap-2">
                  <QrCode className="size-4" style={{ color: COLORS.navy }} />
                  <div>
                    <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Aktifkan QR Code
                    </Label>
                    <p className="text-xs text-gray-400">Tampilkan QR Code di halaman login untuk daftar cepat</p>
                  </div>
                </div>
                <Switch
                  id="qr_code_enabled"
                  checked={settings.qr_code_enabled === 'true'}
                  onCheckedChange={(checked) =>
                    handleSwitchChange('qr_code_enabled', checked)
                  }
                />
              </div>

              {/* QR Code Preview */}
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-48 h-48 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50 overflow-hidden">
                    {qrPreview ? (
                      <img
                        src={qrPreview}
                        alt="QR Code preview"
                        className="w-full h-full object-contain p-3"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-300">
                        <QrCode className="size-12" />
                        <span className="text-xs">Belum ada QR Code</span>
                      </div>
                    )}
                  </div>
                  {settings.qr_code_enabled === 'true' && (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      QR Code aktif
                    </span>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Generate QR Code
                    </Label>
                    <p className="text-xs text-gray-400 mt-0.5">
                      QR Code akan berisi link ke halaman pendaftaran tamu. Logo aplikasi akan ditambahkan di tengah QR Code.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2 w-full border-dashed border-2 h-20 hover:border-[#0c2d57] hover:bg-[#0c2d57]/5"
                    style={{ borderColor: COLORS.navy + '40' }}
                    onClick={handleGenerateQr}
                    disabled={loadingQr}
                  >
                    {loadingQr ? (
                      <>
                        <Loader2 className="size-5 animate-spin" style={{ color: COLORS.navy }} />
                        <span className="text-sm" style={{ color: COLORS.navy }}>Generating...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="size-5" style={{ color: COLORS.navy }} />
                        <span className="text-sm" style={{ color: COLORS.navy }}>Generate QR Code dengan Logo</span>
                      </>
                    )}
                  </Button>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p className="flex items-center gap-1.5">
                      <i className="fa-solid fa-check text-green-500" />
                      QR Code berisi link pendaftaran tamu
                    </p>
                    <p className="flex items-center gap-1.5">
                      <i className="fa-solid fa-check text-green-500" />
                      Logo otomatis ditambahkan di tengah
                    </p>
                    <p className="flex items-center gap-1.5">
                      <i className="fa-solid fa-check text-green-500" />
                      Ditampilkan di halaman login untuk daftar cepat
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center justify-end gap-3"
        >
          {hasChanges && (
            <span className="text-sm text-amber-600 font-medium">
              Perubahan belum disimpan
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2 text-white min-w-[140px]"
            style={{
              backgroundColor: hasChanges ? COLORS.gold : COLORS.slate,
            }}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Pengaturan
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
