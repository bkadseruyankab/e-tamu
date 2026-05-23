'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { useSettings, AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Loader2,
  CheckCircle2,
  Users,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  ArrowLeft,
  Plus,
  MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  code: string
}

interface Appointment {
  id: string
  name: string
  nik?: string
  institution?: string
  address?: string
  phone?: string
  email?: string
  visitPurpose: string
  departmentId?: string
  employeeId?: string
  need?: string
  appointmentDate: string
  appointmentTime: string
  status: string
  notes?: string
  visitorCount: number
  document?: string
  createdAt: string
  updatedAt: string
  department?: { id: string; name: string; code: string }
  employee?: { id: string; name: string; position: string }
}

const VISIT_PURPOSES = [
  { value: 'Konsultasi', label: 'Konsultasi', icon: '💬' },
  { value: 'Koordinasi', label: 'Koordinasi', icon: '🤝' },
  { value: 'Penyampaian Dokumen', label: 'Penyampaian Dokumen', icon: '📄' },
  { value: 'Kunjungan Kerja', label: 'Kunjungan Kerja', icon: '🏗️' },
  { value: 'Musyawarah', label: 'Musyawarah', icon: '🏛️' },
  { value: 'Lainnya', label: 'Lainnya', icon: '📋' },
]

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00',
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  menunggu: { label: 'Menunggu', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  dikonfirmasi: { label: 'Dikonfirmasi', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  ditolak: { label: 'Ditolak', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  selesai: { label: 'Selesai', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  dibatalkan: { label: 'Dibatalkan', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
}

export default function AppointmentPage() {
  const { isAuthenticated, currentPage, setCurrentPage } = useAppStore()
  const { settings } = useSettings()
  const isPublic = !isAuthenticated

  // Form state
  const [name, setName] = React.useState('')
  const [nik, setNik] = React.useState('')
  const [institution, setInstitution] = React.useState('')
  const [address, setAddress] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [visitPurpose, setVisitPurpose] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState('')
  const [need, setNeed] = React.useState('')
  const [appointmentDate, setAppointmentDate] = React.useState('')
  const [appointmentTime, setAppointmentTime] = React.useState('')
  const [visitorCount, setVisitorCount] = React.useState('1')
  const [notes, setNotes] = React.useState('')

  // Data state
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')

  // Dialog state
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)

  // Fetch departments
  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments')
        if (res.ok) {
          const data = await res.json()
          setDepartments(data.data || [])
        }
      } catch {
        // Silently fail
      }
    }
    fetchDepartments()
  }, [])

  // Fetch appointments (admin only)
  React.useEffect(() => {
    if (isAuthenticated) {
      fetchAppointments()
    }
  }, [isAuthenticated, page, search, statusFilter])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: statusFilter,
      })
      const res = await fetch(`/api/appointments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.data || [])
        setTotal(data.pagination?.total || 0)
      }
    } catch {
      toast.error('Gagal memuat data janji temu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nama Lengkap wajib diisi')
      return
    }
    if (!visitPurpose) {
      toast.error('Tujuan Kunjungan wajib dipilih')
      return
    }
    if (!appointmentDate) {
      toast.error('Tanggal Janji Temu wajib diisi')
      return
    }
    if (!appointmentTime) {
      toast.error('Waktu Janji Temu wajib dipilih')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          nik: nik.trim() || undefined,
          institution: institution.trim() || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          visitPurpose,
          departmentId: departmentId || undefined,
          need: need.trim() || undefined,
          appointmentDate,
          appointmentTime,
          visitorCount: parseInt(visitorCount) || 1,
          notes: notes.trim() || undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setShowForm(false)
        toast.success('Janji temu berhasil dibuat!')
        handleReset()
        fetchAppointments()
      } else {
        const respText = await res.text()
        let errorData: { error?: string }
        try {
          errorData = JSON.parse(respText)
        } catch {
          errorData = { error: 'Gagal membuat janji temu' }
        }
        toast.error(errorData.error || 'Gagal membuat janji temu')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setNik('')
    setInstitution('')
    setAddress('')
    setPhone('')
    setEmail('')
    setVisitPurpose('')
    setDepartmentId('')
    setNeed('')
    setAppointmentDate('')
    setAppointmentTime('')
    setVisitorCount('1')
    setNotes('')
    setSubmitted(false)
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success(`Status janji temu diperbarui`)
        fetchAppointments()
        setDetailOpen(false)
      } else {
        toast.error('Gagal memperbarui status')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Janji temu dihapus')
        fetchAppointments()
        setDetailOpen(false)
      } else {
        toast.error('Gagal menghapus janji temu')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const totalPages = Math.ceil(total / 10)

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  // PUBLIC FORM (shown when not authenticated or on homepage)
  if (isPublic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1f3f] via-[#0c2d57] to-[#0a1f3f] text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-[#c9a84c]/10" />
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-[#c9a84c]/5" />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full border border-white/5" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#c9a84c]/5 rounded-full blur-[100px]" />
        </div>

        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 p-4 sm:p-6"
        >
          <Button
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setCurrentPage('home')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>
        </motion.div>

        <div className="relative z-10 flex-1 flex items-start justify-center px-4 pb-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/20 flex items-center justify-center">
                        <CalendarCheck className="w-8 h-8 text-[#c9a84c]" />
                      </div>
                      <h1 className="text-3xl font-extrabold text-white">
                        Janji <span className="text-[#c9a84c]">Temu</span>
                      </h1>
                      <p className="text-white/50 max-w-md">
                        Buat janji temu untuk kunjungan dari pihak luar atau instansi luar daerah ke BKAD Kabupaten Seruyan
                      </p>
                    </motion.div>
                  </div>

                  {/* Form Card */}
                  <Card className="bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-2xl">
                    <div className="h-1 bg-gradient-to-r from-[#c9a84c] via-[#e8d08c] to-[#c9a84c]" />
                    <CardContent className="p-6 sm:p-8">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Data Pribadi */}
                        <div className="space-y-4">
                          <h3 className="text-[#c9a84c] font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <User className="w-4 h-4" />
                            Data Pribadi
                          </h3>

                          <div className="space-y-2">
                            <Label className="text-white/70">
                              Nama Lengkap <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Masukkan nama lengkap"
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white/70">NIK</Label>
                              <Input
                                value={nik}
                                onChange={(e) => setNik(e.target.value)}
                                placeholder="Nomor Induk Kependudukan"
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white/70">
                                Nomor HP <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white/70">Email</Label>
                            <Input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="email@contoh.com"
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>
                        </div>

                        {/* Data Instansi */}
                        <div className="space-y-4">
                          <h3 className="text-[#c9a84c] font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Building2 className="w-4 h-4" />
                            Data Instansi / Asal
                          </h3>

                          <div className="space-y-2">
                            <Label className="text-white/70">Instansi / Perusahaan</Label>
                            <Input
                              value={institution}
                              onChange={(e) => setInstitution(e.target.value)}
                              placeholder="Nama instansi atau perusahaan"
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-white/70">Alamat</Label>
                            <Input
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="Alamat instansi/asal"
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>
                        </div>

                        {/* Detail Kunjungan */}
                        <div className="space-y-4">
                          <h3 className="text-[#c9a84c] font-semibold flex items-center gap-2 text-sm uppercase tracking-wider">
                            <FileText className="w-4 h-4" />
                            Detail Kunjungan
                          </h3>

                          {/* Tujuan Kunjungan */}
                          <div className="space-y-3">
                            <Label className="text-white/70">
                              Tujuan Kunjungan <span className="text-red-400">*</span>
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {VISIT_PURPOSES.map((purpose) => (
                                <motion.button
                                  key={purpose.value}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setVisitPurpose(purpose.value)}
                                  className={cn(
                                    'flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                                    visitPurpose === purpose.value
                                      ? 'border-[#c9a84c] bg-[#c9a84c]/20 text-[#c9a84c]'
                                      : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                                  )}
                                >
                                  <span>{purpose.icon}</span>
                                  <span>{purpose.label}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Bidang Tujuan */}
                          <div className="space-y-2">
                            <Label className="text-white/70">Bidang Tujuan</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {departments.map((dept) => (
                                <motion.button
                                  key={dept.id}
                                  type="button"
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setDepartmentId(dept.id)}
                                  className={cn(
                                    'px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium text-center',
                                    departmentId === dept.id
                                      ? 'border-[#c9a84c] bg-[#c9a84c]/20 text-[#c9a84c]'
                                      : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                                  )}
                                >
                                  {dept.name}
                                </motion.button>
                              ))}
                            </div>
                          </div>

                          {/* Tanggal & Waktu */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-white/70 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-[#c9a84c]" />
                                Tanggal Janji <span className="text-red-400">*</span>
                              </Label>
                              <Input
                                type="date"
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                                min={today}
                                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20 [color-scheme:dark]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-white/70 flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-[#c9a84c]" />
                                Waktu Janji <span className="text-red-400">*</span>
                              </Label>
                              <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white focus:ring-[#c9a84c]/20">
                                  <SelectValue placeholder="Pilih waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0c2d57] border-white/10">
                                  {TIME_SLOTS.map((time) => (
                                    <SelectItem key={time} value={time} className="text-white focus:bg-white/10 focus:text-white">
                                      {time} WIB
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Jumlah Pengunjung */}
                          <div className="space-y-2">
                            <Label className="text-white/70 flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-[#c9a84c]" />
                              Jumlah Pengunjung
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max="50"
                              value={visitorCount}
                              onChange={(e) => setVisitorCount(e.target.value)}
                              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>

                          {/* Keperluan */}
                          <div className="space-y-2">
                            <Label className="text-white/70">Keperluan / Agenda</Label>
                            <Textarea
                              value={need}
                              onChange={(e) => setNeed(e.target.value)}
                              placeholder="Jelaskan keperluan atau agenda kunjungan Anda"
                              rows={3}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>

                          {/* Catatan Tambahan */}
                          <div className="space-y-2">
                            <Label className="text-white/70">Catatan Tambahan</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Catatan atau permintaan khusus (opsional)"
                              rows={2}
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20"
                            />
                          </div>
                        </div>

                        {/* Submit */}
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] hover:from-[#d4b55c] hover:to-[#b8974a] shadow-lg shadow-[#c9a84c]/25"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Mengirim...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <CalendarCheck className="w-5 h-5" />
                              Buat Janji Temu
                            </span>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                /* Success */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-20"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6"
                  >
                    <h2 className="text-3xl font-extrabold text-white mb-2">
                      Janji Temu Berhasil Dibuat!
                    </h2>
                    <p className="text-white/60 text-lg mb-2">
                      Terima kasih, {name}
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 mt-2">
                      <Calendar className="w-4 h-4 text-[#c9a84c]" />
                      <span className="text-[#c9a84c] font-semibold">
                        {formatDate(appointmentDate)} • {appointmentTime} WIB
                      </span>
                    </div>
                    <p className="text-white/40 text-sm mt-4 max-w-md mx-auto">
                      Janji temu Anda akan dikonfirmasi oleh pihak BKAD. Pastikan nomor HP yang didaftarkan aktif untuk menerima informasi konfirmasi.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
                  >
                    <Button
                      onClick={handleReset}
                      className="h-12 px-8 text-base bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-bold shadow-lg shadow-[#c9a84c]/25"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Buat Janji Lagi
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage('home')}
                      className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Kembali
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )
  }

  // ADMIN VIEW (shown when authenticated)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-primary" />
            Janji Temu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola janji temu kunjungan dari pihak luar / instansi luar daerah
          </p>
        </div>
        <Button
          onClick={() => {
            if (showForm) {
              setShowForm(false)
            } else {
              handleReset()
              setShowForm(true)
            }
          }}
          className="bg-primary hover:bg-primary/90"
        >
          {showForm ? (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Buat Janji Temu Baru
            </>
          )}
        </Button>
      </div>

      {/* Show Form when showForm is true */}
      {showForm && (
        <Card className="border-0 shadow-lg">
          <div className="h-1 bg-gradient-to-r from-[#c9a84c] via-[#e8d08c] to-[#c9a84c]" />
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Data Pribadi */}
              <div className="space-y-4">
                <h3 className="text-[#c9a84c] font-semibold flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: '#0c2d57' }}>
                  <User className="w-4 h-4" />
                  Data Pribadi
                </h3>

                <div className="space-y-2">
                  <Label>Nama Lengkap <span className="text-red-400">*</span></Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama lengkap" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>NIK</Label>
                    <Input value={nik} onChange={(e) => setNik(e.target.value)} placeholder="Nomor Induk Kependudukan" />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor HP</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xxxxxxxxxx" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" />
                </div>
              </div>

              {/* Data Instansi */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: '#0c2d57' }}>
                  <Building2 className="w-4 h-4" />
                  Data Instansi / Asal
                </h3>

                <div className="space-y-2">
                  <Label>Instansi / Perusahaan</Label>
                  <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Nama instansi atau perusahaan" />
                </div>

                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat instansi/asal" />
                </div>
              </div>

              {/* Detail Kunjungan */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wider" style={{ color: '#0c2d57' }}>
                  <FileText className="w-4 h-4" />
                  Detail Kunjungan
                </h3>

                {/* Tujuan Kunjungan */}
                <div className="space-y-3">
                  <Label>Tujuan Kunjungan <span className="text-red-400">*</span></Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {VISIT_PURPOSES.map((purpose) => (
                      <button
                        key={purpose.value}
                        type="button"
                        onClick={() => setVisitPurpose(purpose.value)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all text-sm font-medium',
                          visitPurpose === purpose.value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <span>{purpose.icon}</span>
                        <span>{purpose.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bidang Tujuan */}
                <div className="space-y-2">
                  <Label>Bidang Tujuan</Label>
                  <Select value={departmentId} onValueChange={setDepartmentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bidang tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tanggal & Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" style={{ color: '#0c2d57' }} />
                      Tanggal Janji <span className="text-red-400">*</span>
                    </Label>
                    <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} min={today} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" style={{ color: '#0c2d57' }} />
                      Waktu Janji <span className="text-red-400">*</span>
                    </Label>
                    <Select value={appointmentTime} onValueChange={setAppointmentTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih waktu" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>{time} WIB</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Jumlah Pengunjung */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" style={{ color: '#0c2d57' }} />
                    Jumlah Pengunjung
                  </Label>
                  <Input type="number" min="1" max="50" value={visitorCount} onChange={(e) => setVisitorCount(e.target.value)} />
                </div>

                {/* Keperluan */}
                <div className="space-y-2">
                  <Label>Keperluan / Agenda</Label>
                  <Textarea value={need} onChange={(e) => setNeed(e.target.value)} placeholder="Jelaskan keperluan atau agenda kunjungan" rows={3} />
                </div>

                {/* Catatan Tambahan */}
                <div className="space-y-2">
                  <Label>Catatan Tambahan</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan atau permintaan khusus (opsional)" rows={2} />
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 text-base font-bold text-white"
                  style={{ backgroundColor: '#0c2d57' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengirim...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CalendarCheck className="w-5 h-5" />
                      Buat Janji Temu
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="h-12 px-6"
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards, Filters, and Table - hidden when form is shown */}
      {!showForm && (
      <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Menunggu', count: appointments.filter(a => a.status === 'menunggu').length, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Dikonfirmasi', count: appointments.filter(a => a.status === 'dikonfirmasi').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Selesai', count: appointments.filter(a => a.status === 'selesai').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ditolak', count: appointments.filter(a => a.status === 'ditolak').length, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', stat.bg)}>
                <span className={cn('text-lg font-bold', stat.color)}>{stat.count}</span>
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, instansi, tujuan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="dikonfirmasi">Dikonfirmasi</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading && appointments.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Belum ada janji temu</p>
              <p className="text-sm">Janji temu dari pihak luar akan tampil di sini</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pengunjung</TableHead>
                      <TableHead>Instansi</TableHead>
                      <TableHead>Tujuan</TableHead>
                      <TableHead>Tanggal & Waktu</TableHead>
                      <TableHead>Bidang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => {
                      const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.menunggu
                      return (
                        <TableRow key={apt.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{apt.name}</p>
                              {apt.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {apt.phone}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{apt.institution || '-'}</p>
                              {apt.visitorCount > 1 && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {apt.visitorCount} orang
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{apt.visitPurpose}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{formatDate(apt.appointmentDate)}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {apt.appointmentTime} WIB
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{apt.department?.name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-xs', statusCfg.bg, statusCfg.color, 'border-0')}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedAppointment(apt)
                                  setDetailOpen(true)
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {apt.status === 'menunggu' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={() => handleStatusUpdate(apt.id, 'dikonfirmasi')}
                                    title="Konfirmasi"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleStatusUpdate(apt.id, 'ditolak')}
                                    title="Tolak"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {apt.status === 'dikonfirmasi' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleStatusUpdate(apt.id, 'selesai')}
                                  title="Selesai"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Total: {total} janji temu
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </>)} {/* End of !showForm conditional */}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Detail Janji Temu
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap janji temu kunjungan
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-medium">{selectedAppointment.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Instansi</p>
                  <p className="font-medium">{selectedAppointment.institution || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telepon</p>
                  <p className="font-medium">{selectedAppointment.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedAppointment.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{formatDate(selectedAppointment.appointmentDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Waktu</p>
                  <p className="font-medium">{selectedAppointment.appointmentTime} WIB</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bidang</p>
                  <p className="font-medium">{selectedAppointment.department?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Jumlah Pengunjung</p>
                  <p className="font-medium">{selectedAppointment.visitorCount} orang</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Tujuan Kunjungan</p>
                <p className="font-medium">{selectedAppointment.visitPurpose}</p>
              </div>

              {selectedAppointment.need && (
                <div>
                  <p className="text-xs text-muted-foreground">Keperluan / Agenda</p>
                  <p className="font-medium text-sm">{selectedAppointment.need}</p>
                </div>
              )}

              {selectedAppointment.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Catatan</p>
                  <p className="font-medium text-sm">{selectedAppointment.notes}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1',
                    STATUS_CONFIG[selectedAppointment.status]?.bg,
                    STATUS_CONFIG[selectedAppointment.status]?.color,
                    'border-0'
                  )}
                >
                  {STATUS_CONFIG[selectedAppointment.status]?.label || selectedAppointment.status}
                </Badge>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                {selectedAppointment.status === 'menunggu' && (
                  <>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'dikonfirmasi')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Konfirmasi
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedAppointment.id, 'ditolak')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </>
                )}
                {selectedAppointment.status === 'dikonfirmasi' && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'selesai')}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Tandai Selesai
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Janji Temu?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini tidak dapat dibatalkan. Data janji temu akan dihapus secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => handleDelete(selectedAppointment.id)}
                      >
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
