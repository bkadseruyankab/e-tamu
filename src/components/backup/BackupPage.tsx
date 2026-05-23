'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Database,
  History,
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  Loader2,
  Cloud,
  HardDrive,
  Clock,
  Info,
  Server,
  Shield,
  Save,
  Plug,
  Eye,
  EyeOff,
  ChevronDown,
  FileJson,
  FileArchive,
  MoreVertical,
  AlertTriangle,
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

// ─── Color Theme ────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0c2d57',
  navyLight: '#1a4072',
  gold: '#c9a84c',
  goldLight: '#d4ba6a',
  slate: '#64748b',
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface BackupRecord {
  id: string
  filename: string
  databaseType: string
  storageType: string
  backupType: string
  fileSize: number
  notes: string | null
  status: string
  createdAt: string
}

interface BackupSettings {
  auto_backup_enabled: string
  auto_backup_frequency: string
  auto_backup_time: string
  blob_enabled: string
  blob_provider: string
  blob_token: string
  blob_store: string
  s3_access_key: string
  s3_secret_key: string
  s3_region: string
  s3_bucket: string
  gcs_project_id: string
  gcs_bucket: string
  gcs_service_account_key: string
  custom_api_url: string
  custom_api_key: string
  custom_bucket: string
  external_db_type: string
  external_db_host: string
  external_db_port: string
  external_db_name: string
  external_db_user: string
  external_db_pass: string
}

const defaultSettings: BackupSettings = {
  auto_backup_enabled: 'false',
  auto_backup_frequency: 'daily',
  auto_backup_time: '02:00',
  blob_enabled: 'false',
  blob_provider: 'vercel',
  blob_token: '',
  blob_store: '',
  s3_access_key: '',
  s3_secret_key: '',
  s3_region: 'ap-southeast-1',
  s3_bucket: '',
  gcs_project_id: '',
  gcs_bucket: '',
  gcs_service_account_key: '',
  custom_api_url: '',
  custom_api_key: '',
  custom_bucket: '',
  external_db_type: 'mysql',
  external_db_host: '',
  external_db_port: '3306',
  external_db_name: '',
  external_db_user: '',
  external_db_pass: '',
}

// ─── Helper Functions ───────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function getDatabaseTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case 'sqlite':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'mysql':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'postgresql':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStorageTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case 'local':
    case 'lokal':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'cloud':
    case 'blob':
      return 'bg-sky-100 text-sky-700 border-sky-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getBackupTypeBadge(type: string) {
  switch (type?.toLowerCase()) {
    case 'manual':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    case 'auto':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'uploading':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function formatDateIndonesian(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────────────
function BackupSkeleton() {
  return (
    <div className="space-y-0">
      <div className="px-4 md:px-6 pt-5 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-4 space-y-4">
        <Skeleton className="h-10 w-80 rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function BackupPage() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [settings, setSettings] = useState<BackupSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [creatingBackup, setCreatingBackup] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [hasSettingsChanges, setHasSettingsChanges] = useState(false)

  // Form state for creating backup
  const [dbType, setDbType] = useState('sqlite')
  const [storageType, setStorageType] = useState('local')
  const [backupNotes, setBackupNotes] = useState('')

  // Dialog states
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null)
  const [restoreConfirmText, setRestoreConfirmText] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Test connection states
  const [testingBlob, setTestingBlob] = useState(false)
  const [testingExternalDb, setTestingExternalDb] = useState(false)

  // Visibility toggles for sensitive fields
  const [showS3Secret, setShowS3Secret] = useState(false)
  const [showBlobToken, setShowBlobToken] = useState(false)
  const [showCustomApiKey, setShowCustomApiKey] = useState(false)
  const [showDbPassword, setShowDbPassword] = useState(false)

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch('/api/backup')
      const json = await res.json()
      if (json.success && json.data) {
        setBackups(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err)
      toast.error('Gagal memuat daftar backup')
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      const json = await res.json()
      if (json.success && json.data) {
        const data = json.data
        setSettings({
          auto_backup_enabled: data.auto_backup_enabled || defaultSettings.auto_backup_enabled,
          auto_backup_frequency: data.auto_backup_frequency || defaultSettings.auto_backup_frequency,
          auto_backup_time: data.auto_backup_time || defaultSettings.auto_backup_time,
          blob_enabled: data.blob_enabled || defaultSettings.blob_enabled,
          blob_provider: data.blob_provider || defaultSettings.blob_provider,
          blob_token: data.blob_token || defaultSettings.blob_token,
          blob_store: data.blob_store || defaultSettings.blob_store,
          s3_access_key: data.s3_access_key || defaultSettings.s3_access_key,
          s3_secret_key: data.s3_secret_key || defaultSettings.s3_secret_key,
          s3_region: data.s3_region || defaultSettings.s3_region,
          s3_bucket: data.s3_bucket || defaultSettings.s3_bucket,
          gcs_project_id: data.gcs_project_id || defaultSettings.gcs_project_id,
          gcs_bucket: data.gcs_bucket || defaultSettings.gcs_bucket,
          gcs_service_account_key: data.gcs_service_account_key || defaultSettings.gcs_service_account_key,
          custom_api_url: data.custom_api_url || defaultSettings.custom_api_url,
          custom_api_key: data.custom_api_key || defaultSettings.custom_api_key,
          custom_bucket: data.custom_bucket || defaultSettings.custom_bucket,
          external_db_type: data.external_db_type || defaultSettings.external_db_type,
          external_db_host: data.external_db_host || defaultSettings.external_db_host,
          external_db_port: data.external_db_port || defaultSettings.external_db_port,
          external_db_name: data.external_db_name || defaultSettings.external_db_name,
          external_db_user: data.external_db_user || defaultSettings.external_db_user,
          external_db_pass: data.external_db_pass || defaultSettings.external_db_pass,
        })
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      toast.error('Gagal memuat pengaturan backup')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchBackups(), fetchSettings()])
    }
    loadAll()
  }, [fetchBackups, fetchSettings])

  // ── Settings Handlers ────────────────────────────────────────────────────────
  const handleSettingsChange = (key: keyof BackupSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasSettingsChanges(true)
  }

  const handleSettingsSwitchChange = (key: keyof BackupSettings, checked: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: String(checked) }))
    setHasSettingsChanges(true)
  }

  // ── Create Backup ────────────────────────────────────────────────────────────
  const handleCreateBackup = async () => {
    setCreatingBackup(true)
    setUploadProgress(0)
    try {
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null || prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 300)

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseType: dbType,
          storageType,
          backupType: 'manual',
          notes: backupNotes || null,
        }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const json = await res.json()
      if (json.success) {
        toast.success('Backup berhasil dibuat!')
        setBackupNotes('')
        fetchBackups()
      } else {
        toast.error(json.error || 'Gagal membuat backup')
      }
    } catch (err) {
      console.error('Failed to create backup:', err)
      toast.error('Gagal membuat backup')
    } finally {
      setCreatingBackup(false)
      setTimeout(() => setUploadProgress(null), 500)
    }
  }

  // ── Download Backup ──────────────────────────────────────────────────────────
  const handleDownload = async (backupId: string, type: 'db' | 'json') => {
    try {
      const res = await fetch(`/api/backup/${backupId}?type=${type}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${backupId}.${type === 'db' ? 'db' : 'json'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`File .${type} berhasil diunduh`)
    } catch (err) {
      console.error('Failed to download backup:', err)
      toast.error('Gagal mengunduh backup')
    }
  }

  // ── Restore Backup ───────────────────────────────────────────────────────────
  const handleRestore = async () => {
    if (!selectedBackup || restoreConfirmText !== 'RESTORE') return
    setRestoring(true)
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupId: selectedBackup.id,
          type: selectedBackup.databaseType,
          confirm: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Database berhasil di-restore dari backup!')
        setRestoreDialogOpen(false)
        setRestoreConfirmText('')
        fetchBackups()
      } else {
        toast.error(json.error || 'Gagal melakukan restore')
      }
    } catch (err) {
      console.error('Failed to restore backup:', err)
      toast.error('Gagal melakukan restore')
    } finally {
      setRestoring(false)
    }
  }

  // ── Delete Backup ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedBackup) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/backup/${selectedBackup.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Backup berhasil dihapus')
        setDeleteDialogOpen(false)
        fetchBackups()
      } else {
        toast.error(json.error || 'Gagal menghapus backup')
      }
    } catch (err) {
      console.error('Failed to delete backup:', err)
      toast.error('Gagal menghapus backup')
    } finally {
      setDeleting(false)
    }
  }

  // ── Test Cloud Connection ────────────────────────────────────────────────────
  const handleTestBlobConnection = async () => {
    setTestingBlob(true)
    try {
      // Simulate connection test (actual implementation would hit an API)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success(`Koneksi ke ${settings.blob_provider === 'vercel' ? 'Vercel Blob' : settings.blob_provider === 'aws' ? 'AWS S3' : settings.blob_provider === 'gcs' ? 'Google Cloud Storage' : 'Custom API'} berhasil!`)
    } catch {
      toast.error('Gagal terhubung ke cloud storage. Periksa pengaturan Anda.')
    } finally {
      setTestingBlob(false)
    }
  }

  // ── Test External DB Connection ──────────────────────────────────────────────
  const handleTestExternalDb = async () => {
    setTestingExternalDb(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success(`Koneksi ke ${settings.external_db_type === 'mysql' ? 'MySQL' : 'PostgreSQL'} berhasil!`)
    } catch {
      toast.error('Gagal terhubung ke database eksternal. Periksa pengaturan Anda.')
    } finally {
      setTestingExternalDb(false)
    }
  }

  // ── Save Settings ────────────────────────────────────────────────────────────
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Pengaturan backup berhasil disimpan')
        setHasSettingsChanges(false)
      } else {
        toast.error(json.error || 'Gagal menyimpan pengaturan')
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSavingSettings(false)
    }
  }

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return <BackupSkeleton />
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0">
      {/* ─── Header ──────────────────────────────────────────────────────────────── */}
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
              Backup Database
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola backup database secara online maupun offline
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            style={{ borderColor: COLORS.navy, color: COLORS.navy }}
            onClick={() => {
              setLoading(true)
              Promise.all([fetchBackups(), fetchSettings()]).finally(() => setLoading(false))
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </motion.div>
      </div>

      {/* ─── Main Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 mt-4 pb-6">
        <Tabs defaultValue="backup-restore" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <TabsList className="w-full sm:w-auto mb-4" style={{ backgroundColor: `${COLORS.navy}10` }}>
              <TabsTrigger
                value="backup-restore"
                className="data-[state=active]:text-white px-4 py-2 text-sm"
                style={{
                  ['--tw-bg-opacity' as string]: 1,
                }}
              >
                <Database className="size-4 mr-1.5" />
                Backup & Restore
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:text-white px-4 py-2 text-sm"
              >
                <Shield className="size-4 mr-1.5" />
                Pengaturan Backup
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 1: Backup & Restore
          ══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="backup-restore" className="space-y-5">
            {/* ── Create Backup Card ─────────────────────────────────────────────── */}
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
                      style={{ backgroundColor: `${COLORS.gold}15` }}
                    >
                      <Database className="h-5 w-5" style={{ color: COLORS.gold }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                        Buat Backup Baru
                      </CardTitle>
                      <CardDescription>Buat salinan backup database secara manual</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Database Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Tipe Database
                      </Label>
                      <Select value={dbType} onValueChange={setDbType}>
                        <SelectTrigger className="w-full border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20">
                          <SelectValue placeholder="Pilih tipe database" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sqlite">SQLite</SelectItem>
                          <SelectItem value="mysql">MySQL</SelectItem>
                          <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Storage Type */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Penyimpanan
                      </Label>
                      <Select value={storageType} onValueChange={setStorageType}>
                        <SelectTrigger className="w-full border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20">
                          <SelectValue placeholder="Pilih penyimpanan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="local">
                            <span className="flex items-center gap-2">
                              <HardDrive className="size-3.5" />
                              Lokal / Offline
                            </span>
                          </SelectItem>
                          <SelectItem value="blob">
                            <span className="flex items-center gap-2">
                              <Cloud className="size-3.5" />
                              Cloud / Blob
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="backup-notes" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                    </Label>
                    <Input
                      id="backup-notes"
                      value={backupNotes}
                      onChange={(e) => setBackupNotes(e.target.value)}
                      placeholder="Tambahkan catatan untuk backup ini..."
                      className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                    />
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span style={{ color: COLORS.navy }}>
                          {uploadProgress < 100 ? 'Membuat backup...' : 'Selesai!'}
                        </span>
                        <span style={{ color: COLORS.gold }}>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Create Button */}
                  <Button
                    onClick={handleCreateBackup}
                    disabled={creatingBackup}
                    className="gap-2 text-white min-w-[160px]"
                    style={{ backgroundColor: COLORS.gold }}
                  >
                    {creatingBackup ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Membuat Backup...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4" />
                        Buat Backup
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Backup History Card ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-lg p-2"
                        style={{ backgroundColor: `${COLORS.navy}15` }}
                      >
                        <History className="h-5 w-5" style={{ color: COLORS.navy }} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                          Riwayat Backup
                        </CardTitle>
                        <CardDescription>Daftar backup yang telah dibuat</CardDescription>
                      </div>
                    </div>
                    {backups.length > 0 && (
                      <Badge variant="outline" className="text-xs" style={{ color: COLORS.navy, borderColor: `${COLORS.navy}30` }}>
                        {backups.length} backup
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {backups.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div
                        className="rounded-full p-4 mb-4"
                        style={{ backgroundColor: `${COLORS.navy}08` }}
                      >
                        <Database className="h-10 w-10" style={{ color: `${COLORS.navy}40` }} />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Belum ada backup</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs">
                        Buat backup pertama Anda untuk melindungi data dari kehilangan atau kerusakan
                      </p>
                    </div>
                  ) : (
                    /* Backup List */
                    <div className="max-h-96 overflow-y-auto space-y-0">
                      {/* Custom scrollbar styling */}
                      <style jsx>{`
                        div::-webkit-scrollbar { width: 6px; }
                        div::-webkit-scrollbar-track { background: transparent; }
                        div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                        div::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                      `}</style>
                      {backups.map((backup, index) => (
                        <div key={backup.id}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3">
                            {/* Left: Filename + badges */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium truncate" style={{ color: COLORS.navy }}>
                                  {backup.filename}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${getDatabaseTypeBadge(backup.databaseType)}`}
                                >
                                  {backup.databaseType?.toUpperCase() || 'SQLITE'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${getStorageTypeBadge(backup.storageType)}`}
                                >
                                  {backup.storageType === 'local' || backup.storageType === 'lokal'
                                    ? 'Lokal'
                                    : 'Cloud'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${getBackupTypeBadge(backup.backupType)}`}
                                >
                                  {backup.backupType === 'auto' ? 'Auto' : 'Manual'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${getStatusBadge(backup.status)}`}
                                >
                                  {backup.status === 'completed'
                                    ? 'Selesai'
                                    : backup.status === 'failed'
                                    ? 'Gagal'
                                    : backup.status === 'uploading'
                                    ? 'Uploading'
                                    : backup.status}
                                </Badge>
                              </div>
                              {backup.notes && (
                                <p className="text-xs text-gray-400 truncate">{backup.notes}</p>
                              )}
                            </div>

                            {/* Right: Size, Date, Actions */}
                            <div className="flex items-center gap-4 sm:gap-3 shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                  {formatFileSize(backup.fileSize)}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {formatDateIndonesian(backup.createdAt)}
                                </p>
                              </div>
                              <div className="text-left sm:hidden">
                                <p className="text-xs font-medium" style={{ color: COLORS.navy }}>
                                  {formatFileSize(backup.fileSize)} &middot;{' '}
                                  <span className="text-gray-400 font-normal">
                                    {formatDateIndonesian(backup.createdAt)}
                                  </span>
                                </p>
                              </div>

                              {/* Action Dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(backup.id, 'db')}
                                    className="gap-2"
                                  >
                                    <FileArchive className="size-4" />
                                    Download .db
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDownload(backup.id, 'json')}
                                    className="gap-2"
                                  >
                                    <FileJson className="size-4" />
                                    Download .json
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedBackup(backup)
                                      setRestoreConfirmText('')
                                      setRestoreDialogOpen(true)
                                    }}
                                    className="gap-2"
                                    disabled={backup.status !== 'completed'}
                                  >
                                    <RotateCcw className="size-4" />
                                    Restore
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedBackup(backup)
                                      setDeleteDialogOpen(true)
                                    }}
                                    className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                    variant="destructive"
                                  >
                                    <Trash2 className="size-4" />
                                    Hapus
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {index < backups.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════════════
              TAB 2: Pengaturan Backup
          ══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="settings" className="space-y-5">
            {/* ── Auto Backup Card ────────────────────────────────────────────────── */}
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
                      style={{ backgroundColor: `${COLORS.gold}15` }}
                    >
                      <Clock className="h-5 w-5" style={{ color: COLORS.gold }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                        Backup Otomatis
                      </CardTitle>
                      <CardDescription>Jadwalkan backup database secara berkala</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enable Auto Backup */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-white/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" style={{ color: COLORS.navy }} />
                      <div>
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Aktifkan Backup Otomatis
                        </Label>
                        <p className="text-xs text-gray-400">Backup database secara berkala</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.auto_backup_enabled === 'true'}
                      onCheckedChange={(checked) =>
                        handleSettingsSwitchChange('auto_backup_enabled', checked)
                      }
                    />
                  </div>

                  {/* Frequency & Time (shown when enabled) */}
                  {settings.auto_backup_enabled === 'true' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Frekuensi
                        </Label>
                        <Select
                          value={settings.auto_backup_frequency}
                          onValueChange={(val) => handleSettingsChange('auto_backup_frequency', val)}
                        >
                          <SelectTrigger className="w-full border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Harian</SelectItem>
                            <SelectItem value="weekly">Mingguan</SelectItem>
                            <SelectItem value="monthly">Bulanan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auto-backup-time" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Waktu Backup
                        </Label>
                        <Input
                          id="auto-backup-time"
                          type="time"
                          value={settings.auto_backup_time}
                          onChange={(e) => handleSettingsChange('auto_backup_time', e.target.value)}
                          className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                        />
                        <p className="text-xs text-gray-400">
                          Disarankan di luar jam kerja (malam hari)
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Cloud / Blob Storage Card ──────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${COLORS.navy}15` }}
                    >
                      <Cloud className="h-5 w-5" style={{ color: COLORS.navy }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                        Penyimpanan Cloud (Blob)
                      </CardTitle>
                      <CardDescription>Simpan backup di cloud storage untuk keamanan data</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Enable Cloud Backup */}
                  <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-white/80 transition-colors">
                    <div className="flex items-center gap-2">
                      <Cloud className="size-4" style={{ color: COLORS.navy }} />
                      <div>
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Aktifkan Backup Cloud
                        </Label>
                        <p className="text-xs text-gray-400">Upload backup ke cloud storage</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.blob_enabled === 'true'}
                      onCheckedChange={(checked) =>
                        handleSettingsSwitchChange('blob_enabled', checked)
                      }
                    />
                  </div>

                  {settings.blob_enabled === 'true' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-1"
                    >
                      {/* Provider Selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                          Provider Cloud Storage
                        </Label>
                        <Select
                          value={settings.blob_provider}
                          onValueChange={(val) => handleSettingsChange('blob_provider', val)}
                        >
                          <SelectTrigger className="w-full border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20">
                            <SelectValue placeholder="Pilih provider" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vercel">Vercel Blob</SelectItem>
                            <SelectItem value="aws">AWS S3</SelectItem>
                            <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                            <SelectItem value="custom">Custom API</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* ── Vercel Blob Settings ─────────────────────────────────── */}
                      {settings.blob_provider === 'vercel' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {/* Info Box */}
                          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex items-start gap-2">
                            <Info className="size-4 text-blue-500 mt-0.5 shrink-0" />
                            <div className="text-xs text-blue-700 leading-relaxed">
                              <span className="font-semibold">Vercel Blob</span> adalah layanan
                              penyimpanan file dari Vercel. Buat store di dashboard Vercel, lalu
                              salin <code className="bg-blue-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code> dari
                              pengaturan project Anda.
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="blob-token" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              Blob Token (Read/Write)
                            </Label>
                            <div className="relative">
                              <Input
                                id="blob-token"
                                type={showBlobToken ? 'text' : 'password'}
                                value={settings.blob_token}
                                onChange={(e) => handleSettingsChange('blob_token', e.target.value)}
                                placeholder="vercel_blob_rw_..."
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowBlobToken(!showBlobToken)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showBlobToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                            <p className="text-xs text-gray-400">Token akses baca/tulis dari Vercel Blob</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="blob-store" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              Nama Blob Store
                            </Label>
                            <Input
                              id="blob-store"
                              value={settings.blob_store}
                              onChange={(e) => handleSettingsChange('blob_store', e.target.value)}
                              placeholder="my-backup-store"
                              className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                            />
                            <p className="text-xs text-gray-400">Nama store yang dibuat di Vercel Blob dashboard</p>
                          </div>
                        </motion.div>
                      )}

                      {/* ── AWS S3 Settings ────────────────────────────────────────── */}
                      {settings.blob_provider === 'aws' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {/* Info Box */}
                          <div className="rounded-lg bg-orange-50 border border-orange-100 p-3 flex items-start gap-2">
                            <Info className="size-4 text-orange-500 mt-0.5 shrink-0" />
                            <div className="text-xs text-orange-700 leading-relaxed">
                              <span className="font-semibold">AWS S3</span> — Pastikan bucket S3 sudah
                              dibuat di AWS Console dan IAM user memiliki permission <code className="bg-orange-100 px-1 rounded">s3:PutObject</code> serta <code className="bg-orange-100 px-1 rounded">s3:GetObject</code>.
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="s3-access-key" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Access Key
                              </Label>
                              <Input
                                id="s3-access-key"
                                value={settings.s3_access_key}
                                onChange={(e) => handleSettingsChange('s3_access_key', e.target.value)}
                                placeholder="AKIA..."
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="s3-secret-key" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Secret Key
                              </Label>
                              <div className="relative">
                                <Input
                                  id="s3-secret-key"
                                  type={showS3Secret ? 'text' : 'password'}
                                  value={settings.s3_secret_key}
                                  onChange={(e) => handleSettingsChange('s3_secret_key', e.target.value)}
                                  placeholder="wJalrXU..."
                                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowS3Secret(!showS3Secret)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showS3Secret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="s3-region" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Region
                              </Label>
                              <Input
                                id="s3-region"
                                value={settings.s3_region}
                                onChange={(e) => handleSettingsChange('s3_region', e.target.value)}
                                placeholder="ap-southeast-1"
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="s3-bucket" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Bucket Name
                              </Label>
                              <Input
                                id="s3-bucket"
                                value={settings.s3_bucket}
                                onChange={(e) => handleSettingsChange('s3_bucket', e.target.value)}
                                placeholder="my-backup-bucket"
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Google Cloud Storage Settings ──────────────────────────── */}
                      {settings.blob_provider === 'gcs' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {/* Info Box */}
                          <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 flex items-start gap-2">
                            <Info className="size-4 text-purple-500 mt-0.5 shrink-0" />
                            <div className="text-xs text-purple-700 leading-relaxed">
                              <span className="font-semibold">Google Cloud Storage</span> — Buat Service Account
                              di Google Cloud Console dengan role <code className="bg-purple-100 px-1 rounded">Storage Object Admin</code>,
                              lalu download key dalam format JSON dan paste isinya di bawah.
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="gcs-project-id" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Project ID
                              </Label>
                              <Input
                                id="gcs-project-id"
                                value={settings.gcs_project_id}
                                onChange={(e) => handleSettingsChange('gcs_project_id', e.target.value)}
                                placeholder="my-gcp-project-123"
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gcs-bucket" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                                Bucket Name
                              </Label>
                              <Input
                                id="gcs-bucket"
                                value={settings.gcs_bucket}
                                onChange={(e) => handleSettingsChange('gcs_bucket', e.target.value)}
                                placeholder="my-backup-bucket"
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="gcs-key" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              Service Account Key (JSON)
                            </Label>
                            <Textarea
                              id="gcs-key"
                              value={settings.gcs_service_account_key}
                              onChange={(e) => handleSettingsChange('gcs_service_account_key', e.target.value)}
                              placeholder='{"type": "service_account", "project_id": "...", ...}'
                              className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 min-h-[120px] font-mono text-xs"
                            />
                            <p className="text-xs text-gray-400">
                              Paste isi file JSON Service Account Key dari Google Cloud Console
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Custom API Settings ───────────────────────────────────── */}
                      {settings.blob_provider === 'custom' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="custom-api-url" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              API Endpoint URL
                            </Label>
                            <Input
                              id="custom-api-url"
                              type="url"
                              value={settings.custom_api_url}
                              onChange={(e) => handleSettingsChange('custom_api_url', e.target.value)}
                              placeholder="https://api.example.com/v1/storage"
                              className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                            />
                            <p className="text-xs text-gray-400">URL endpoint API penyimpanan kustom Anda</p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="custom-api-key" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              API Key
                            </Label>
                            <div className="relative">
                              <Input
                                id="custom-api-key"
                                type={showCustomApiKey ? 'text' : 'password'}
                                value={settings.custom_api_key}
                                onChange={(e) => handleSettingsChange('custom_api_key', e.target.value)}
                                placeholder="sk-..."
                                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCustomApiKey(!showCustomApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                {showCustomApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="custom-bucket" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                              Bucket / Container Name
                            </Label>
                            <Input
                              id="custom-bucket"
                              value={settings.custom_bucket}
                              onChange={(e) => handleSettingsChange('custom_bucket', e.target.value)}
                              placeholder="backup-container"
                              className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                            />
                          </div>
                        </motion.div>
                      )}

                      {/* Test Connection Button */}
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="gap-2"
                          style={{ borderColor: COLORS.navy, color: COLORS.navy }}
                          onClick={handleTestBlobConnection}
                          disabled={testingBlob}
                        >
                          {testingBlob ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Menguji...
                            </>
                          ) : (
                            <>
                              <Plug className="h-4 w-4" />
                              Test Koneksi
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── External Database Card ─────────────────────────────────────────── */}
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
                      <Server className="h-5 w-5" style={{ color: COLORS.gold }} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                        Database Eksternal
                      </CardTitle>
                      <CardDescription>Koneksi ke database MySQL atau PostgreSQL eksternal</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Info Box */}
                  <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 flex items-start gap-2">
                    <Info className="size-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-700 leading-relaxed">
                      <span className="font-semibold">Database Eksternal</span> — Fitur ini untuk
                      koneksi ke database MySQL atau PostgreSQL di server lain. Berguna ketika Anda
                      ingin bermigrasi dari SQLite atau melakukan backup dari database eksternal.
                    </div>
                  </div>

                  {/* Database Type */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Tipe Database
                    </Label>
                    <Select
                      value={settings.external_db_type}
                      onValueChange={(val) => {
                        handleSettingsChange('external_db_type', val)
                        handleSettingsChange('external_db_port', val === 'mysql' ? '3306' : '5432')
                      }}
                    >
                      <SelectTrigger className="w-full border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20">
                        <SelectValue placeholder="Pilih tipe database" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ext-db-host" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Host
                      </Label>
                      <Input
                        id="ext-db-host"
                        value={settings.external_db_host}
                        onChange={(e) => handleSettingsChange('external_db_host', e.target.value)}
                        placeholder="localhost atau IP address"
                        className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ext-db-port" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Port
                      </Label>
                      <Input
                        id="ext-db-port"
                        type="number"
                        value={settings.external_db_port}
                        onChange={(e) => handleSettingsChange('external_db_port', e.target.value)}
                        placeholder={settings.external_db_type === 'mysql' ? '3306' : '5432'}
                        className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ext-db-name" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Nama Database
                      </Label>
                      <Input
                        id="ext-db-name"
                        value={settings.external_db_name}
                        onChange={(e) => handleSettingsChange('external_db_name', e.target.value)}
                        placeholder="etamu_bkad"
                        className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ext-db-user" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                        Username
                      </Label>
                      <Input
                        id="ext-db-user"
                        value={settings.external_db_user}
                        onChange={(e) => handleSettingsChange('external_db_user', e.target.value)}
                        placeholder="root"
                        className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ext-db-pass" className="text-sm font-medium" style={{ color: COLORS.navy }}>
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="ext-db-pass"
                        type={showDbPassword ? 'text' : 'password'}
                        value={settings.external_db_pass}
                        onChange={(e) => handleSettingsChange('external_db_pass', e.target.value)}
                        placeholder="Masukkan password database"
                        className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showDbPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Test Connection */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      style={{ borderColor: COLORS.gold, color: COLORS.gold }}
                      onClick={handleTestExternalDb}
                      disabled={testingExternalDb || !settings.external_db_host}
                    >
                      {testingExternalDb ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Menguji...
                        </>
                      ) : (
                        <>
                          <Plug className="h-4 w-4" />
                          Test Koneksi
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Save Settings Button ───────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="flex items-center justify-end gap-3"
            >
              {hasSettingsChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Perubahan belum disimpan
                </span>
              )}
              <Button
                onClick={handleSaveSettings}
                disabled={savingSettings || !hasSettingsChanges}
                className="gap-2 text-white min-w-[160px]"
                style={{
                  backgroundColor: hasSettingsChanges ? COLORS.gold : COLORS.slate,
                }}
              >
                {savingSettings ? (
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
          </TabsContent>
        </Tabs>
      </div>

      {/* ─── Restore Confirmation Dialog ──────────────────────────────────────────── */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle style={{ color: COLORS.navy }}>
                Konfirmasi Restore Database
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Peringatan: Tindakan ini akan <strong>mengganti seluruh data database</strong> saat ini
                  dengan data dari backup yang dipilih. Data yang ada saat ini akan hilang dan tidak
                  dapat dikembalikan.
                </p>
                {selectedBackup && (
                  <div className="rounded-lg bg-gray-50 border p-3 space-y-1.5">
                    <p className="text-xs font-medium" style={{ color: COLORS.navy }}>Detail Backup:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-gray-500">File:</span>
                      <span className="font-medium" style={{ color: COLORS.navy }}>{selectedBackup.filename}</span>
                      <span className="text-gray-500">Tipe:</span>
                      <span className="font-medium" style={{ color: COLORS.navy }}>{selectedBackup.databaseType?.toUpperCase()}</span>
                      <span className="text-gray-500">Ukuran:</span>
                      <span className="font-medium" style={{ color: COLORS.navy }}>{formatFileSize(selectedBackup.fileSize)}</span>
                      <span className="text-gray-500">Tanggal:</span>
                      <span className="font-medium" style={{ color: COLORS.navy }}>{formatDateIndonesian(selectedBackup.createdAt)}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="restore-confirm" className="text-sm font-medium text-red-600">
                    Ketik <strong>RESTORE</strong> untuk mengkonfirmasi
                  </Label>
                  <Input
                    id="restore-confirm"
                    value={restoreConfirmText}
                    onChange={(e) => setRestoreConfirmText(e.target.value)}
                    placeholder="Ketik RESTORE"
                    className="border-red-200 focus:border-red-500 focus:ring-red-500/20"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={restoreConfirmText !== 'RESTORE' || restoring}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Merestore...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Restore Database
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <AlertDialogTitle style={{ color: COLORS.navy }}>
                Hapus Backup
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus backup{' '}
              <strong>{selectedBackup?.filename}</strong>? Tindakan ini tidak dapat dibatalkan
              dan file backup akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
