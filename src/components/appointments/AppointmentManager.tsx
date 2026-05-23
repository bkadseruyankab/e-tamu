'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MapPin,
  Briefcase,
  Hash,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { cn, getRoleLabel } from '@/lib/utils'

interface Department {
  id: string
  name: string
  code: string
}

interface Employee {
  id: string
  name: string
  position: string
  departmentId: string
}

interface Appointment {
  id: string
  visitorName: string
  visitorNip: string | null
  visitorPosition: string | null
  institution: string
  institutionAddr: string | null
  phone: string | null
  email: string | null
  visitPurpose: string
  visitDate: string
  visitTime: string | null
  numberOfPeople: number
  notes: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
  department: { id: string; name: string; code: string } | null
  employee: { id: string; name: string; position: string } | null
}

interface UserOption {
  id: string
  name: string
  role: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  menunggu: { label: 'Menunggu', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  dikonfirmasi: { label: 'Dikonfirmasi', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  ditolak: { label: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  selesai: { label: 'Selesai', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  dibatalkan: { label: 'Dibatalkan', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400', icon: XCircle },
}

export default function AppointmentManager() {
  const { currentUser } = useAppStore()

  // Data state
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [total, setTotal] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)

  // Filter state
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  // UI state
  const [loading, setLoading] = React.useState(true)
  const [showForm, setShowForm] = React.useState(false)
  const [showDetail, setShowDetail] = React.useState(false)
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null)
  const [showRejectDialog, setShowRejectDialog] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState('')
  const [formLoading, setFormLoading] = React.useState(false)

  // Disposition from appointment state
  const [showDispositionDialog, setShowDispositionDialog] = React.useState(false)
  const [dispositionLoading, setDispositionLoading] = React.useState(false)
  const [dispositionToDeptId, setDispositionToDeptId] = React.useState('')
  const [dispositionToUserId, setDispositionToUserId] = React.useState('')
  const [dispositionNotes, setDispositionNotes] = React.useState('')
  const [dispositionDepts, setDispositionDepts] = React.useState<Department[]>([])
  const [dispositionUsers, setDispositionUsers] = React.useState<UserOption[]>([])

  // Form state
  const [form, setForm] = React.useState({
    visitorName: '',
    visitorNip: '',
    visitorPosition: '',
    institution: '',
    institutionAddr: '',
    phone: '',
    email: '',
    visitPurpose: '',
    visitDate: '',
    visitTime: '',
    numberOfPeople: 1,
    departmentId: '',
    employeeId: '',
    notes: '',
  })

  // Fetch appointments
  const fetchAppointments = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      params.set('page', page.toString())
      params.set('limit', '20')
      // Role-based filtering: pass userId and userRole for pegawai/pimpinan
      if (currentUser?.id && (currentUser.role === 'pegawai' || currentUser.role === 'pimpinan')) {
        params.set('userId', currentUser.id)
        params.set('userRole', currentUser.role)
      }

      const res = await fetch(`/api/appointments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.data || [])
        setTotal(data.pagination?.total || 0)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch {
      toast.error('Gagal memuat data janji temu')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page, currentUser?.id, currentUser?.role])

  // Fetch departments
  React.useEffect(() => {
    const fetchDeps = async () => {
      try {
        const res = await fetch('/api/departments')
        if (res.ok) {
          const data = await res.json()
          setDepartments(data.data || [])
        }
      } catch { /* silent */ }
    }
    fetchDeps()
  }, [])

  // Fetch employees when department changes
  React.useEffect(() => {
    const fetchEmps = async () => {
      try {
        const res = await fetch('/api/employees')
        if (res.ok) {
          const data = await res.json()
          const emps = data.data || []
          setEmployees(
            form.departmentId
              ? emps.filter((e: Employee) => e.departmentId === form.departmentId)
              : emps
          )
        }
      } catch { /* silent */ }
    }
    fetchEmps()
  }, [form.departmentId])

  React.useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Stats
  const stats = React.useMemo(() => {
    const menunggu = appointments.filter(a => a.status === 'menunggu').length
    const dikonfirmasi = appointments.filter(a => a.status === 'dikonfirmasi').length
    const ditolak = appointments.filter(a => a.status === 'ditolak').length
    const selesai = appointments.filter(a => a.status === 'selesai').length
    return [
      { label: 'Total', value: total, icon: CalendarCheck, color: 'text-blue-600 dark:text-blue-400' },
      { label: 'Menunggu', value: menunggu, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
      { label: 'Dikonfirmasi', value: dikonfirmasi, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Selesai', value: selesai, icon: CheckCircle2, color: 'text-indigo-600 dark:text-indigo-400' },
    ]
  }, [appointments, total])

  const resetForm = () => {
    setForm({
      visitorName: '',
      visitorNip: '',
      visitorPosition: '',
      institution: '',
      institutionAddr: '',
      phone: '',
      email: '',
      visitPurpose: '',
      visitDate: '',
      visitTime: '',
      numberOfPeople: 1,
      departmentId: '',
      employeeId: '',
      notes: '',
    })
  }

  const handleCreateAppointment = async () => {
    if (!form.visitorName.trim()) {
      toast.error('Nama pengunjung wajib diisi')
      return
    }
    if (!form.institution.trim()) {
      toast.error('Nama instansi wajib diisi')
      return
    }
    if (!form.visitPurpose.trim()) {
      toast.error('Tujuan kunjungan wajib diisi')
      return
    }
    if (!form.visitDate) {
      toast.error('Tanggal kunjungan wajib diisi')
      return
    }

    setFormLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        toast.success('Janji temu berhasil dibuat!')
        setShowForm(false)
        resetForm()
        fetchAppointments()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat janji temu')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const body: any = { status }
      if (reason) body.rejectionReason = reason

      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(`Status janji temu diperbarui: ${STATUS_CONFIG[status]?.label || status}`)
        fetchAppointments()
        setShowDetail(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal memperbarui status')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Janji temu berhasil dihapus')
        fetchAppointments()
      } else {
        toast.error('Gagal menghapus janji temu')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  // Fetch departments & users for disposition dialog
  React.useEffect(() => {
    if (showDispositionDialog) {
      const fetchDispositionData = async () => {
        try {
          const [deptsRes, usersRes] = await Promise.all([
            fetch('/api/departments?includeInactive=true'),
            fetch('/api/users'),
          ])
          const deptsData = await deptsRes.json()
          const usersData = await usersRes.json()
          if (deptsData.success) setDispositionDepts(deptsData.data)
          if (usersData.success) setDispositionUsers(usersData.data)
        } catch { /* silent */ }
      }
      fetchDispositionData()
    }
  }, [showDispositionDialog])

  // Handle create disposition from appointment
  const handleCreateDisposition = async () => {
    if (!selectedAppointment) return
    if (!currentUser?.id) {
      toast.error('Sesi pengguna tidak valid. Silakan login kembali.')
      return
    }
    setDispositionLoading(true)
    try {
      const res = await fetch('/api/dispositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          fromUserId: currentUser.id,
          toUserId: dispositionToUserId || null,
          toDepartmentId: dispositionToDeptId || null,
          notes: dispositionNotes || null,
        }),
      })
      // Safely parse JSON — handle non-JSON responses
      let data: { success?: boolean; error?: string; data?: unknown } = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        const text = await res.text()
        console.error('Disposition API returned non-JSON response:', text.substring(0, 200))
        toast.error('Terjadi kesalahan server. Silakan coba lagi.')
        return
      }
      if (data.success) {
        toast.success('Disposisi berhasil dibuat dari Janji Temu')
        setShowDispositionDialog(false)
        setShowDetail(false)
        setDispositionToDeptId('')
        setDispositionToUserId('')
        setDispositionNotes('')
        fetchAppointments()
      } else {
        toast.error(data.error || 'Gagal membuat disposisi')
      }
    } catch (err) {
      console.error('Create disposition error:', err)
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setDispositionLoading(false)
    }
  }

  const formatDateSafe = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd MMMM yyyy', { locale: idLocale })
    } catch {
      return dateStr
    }
  }

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
            {currentUser?.role === 'pegawai' || currentUser?.role === 'pimpinan'
              ? 'Janji temu yang ditugaskan kepada Anda'
              : 'Kelola janji temu kunjungan dari pihak luar / instansi luar daerah'
            }
          </p>
        </div>
        {!(currentUser?.role === 'pegawai' || currentUser?.role === 'pimpinan') && (
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Buat Janji Temu
        </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, instansi, jabatan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="menunggu">Menunggu</SelectItem>
                <SelectItem value="dikonfirmasi">Dikonfirmasi</SelectItem>
                <SelectItem value="ditolak">Ditolak</SelectItem>
                <SelectItem value="selesai">Selesai</SelectItem>
                <SelectItem value="dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pengunjung</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Tanggal Kunjungan</TableHead>
                  <TableHead>Bidang Tujuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Memuat data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : appointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CalendarCheck className="w-12 h-12 text-muted-foreground/30" />
                        <p>Belum ada data janji temu</p>
                        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
                          <Plus className="w-4 h-4 mr-1" />
                          Buat Janji Temu Baru
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  appointments.map((apt) => {
                    const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.menunggu
                    return (
                      <TableRow key={apt.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedAppointment(apt); setShowDetail(true) }}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.visitorName}</p>
                            {apt.visitorPosition && (
                              <p className="text-xs text-muted-foreground">{apt.visitorPosition}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-[150px]">{apt.institution}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm">{formatDateSafe(apt.visitDate)}</span>
                            {apt.visitTime && (
                              <span className="text-xs text-muted-foreground">{apt.visitTime}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {apt.department ? (
                            <Badge variant="outline" className="text-xs">
                              {apt.department.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', statusCfg.color)}>
                            <statusCfg.icon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => { setSelectedAppointment(apt); setShowDetail(true) }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Janji Temu?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Janji temu dari <strong>{apt.visitorName}</strong> ({apt.institution}) akan dihapus permanen.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(apt.id)}>
                                    Ya, Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
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
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Appointment Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Buat Janji Temu Baru
            </DialogTitle>
            <DialogDescription>
              Formulir untuk kunjungan dari pihak luar / instansi luar daerah
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Data Pengunjung */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Data Pengunjung
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="visitorName">Nama Pengunjung *</Label>
                  <Input
                    id="visitorName"
                    value={form.visitorName}
                    onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                    placeholder="Nama lengkap pengunjung"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitorNip">NIP</Label>
                  <Input
                    id="visitorNip"
                    value={form.visitorNip}
                    onChange={(e) => setForm({ ...form, visitorNip: e.target.value })}
                    placeholder="NIP (opsional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitorPosition">Jabatan</Label>
                  <Input
                    id="visitorPosition"
                    value={form.visitorPosition}
                    onChange={(e) => setForm({ ...form, visitorPosition: e.target.value })}
                    placeholder="Jabatan / Posisi"
                  />
                </div>
              </div>
            </div>

            {/* Data Instansi */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Data Instansi
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="institution">Nama Instansi *</Label>
                  <Input
                    id="institution"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    placeholder="Nama instansi / lembaga / dinas"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="institutionAddr">Alamat Instansi</Label>
                  <Input
                    id="institutionAddr"
                    value={form.institutionAddr}
                    onChange={(e) => setForm({ ...form, institutionAddr: e.target.value })}
                    placeholder="Alamat lengkap instansi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@instansi.go.id"
                  />
                </div>
              </div>
            </div>

            {/* Detail Kunjungan */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Detail Kunjungan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visitDate">Tanggal Kunjungan *</Label>
                  <Input
                    id="visitDate"
                    type="date"
                    value={form.visitDate}
                    onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitTime">Waktu Kunjungan</Label>
                  <Input
                    id="visitTime"
                    type="time"
                    value={form.visitTime}
                    onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="visitPurpose">Tujuan Kunjungan *</Label>
                  <Textarea
                    id="visitPurpose"
                    value={form.visitPurpose}
                    onChange={(e) => setForm({ ...form, visitPurpose: e.target.value })}
                    placeholder="Jelaskan tujuan kunjungan / agenda pertemuan"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfPeople">Jumlah Orang</Label>
                  <Input
                    id="numberOfPeople"
                    type="number"
                    min={1}
                    value={form.numberOfPeople}
                    onChange={(e) => setForm({ ...form, numberOfPeople: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Bidang Tujuan</Label>
                  <Select value={form.departmentId} onValueChange={(val) => setForm({ ...form, departmentId: val, employeeId: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bidang" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Pegawai yang Dituju</Label>
                  <Select value={form.employeeId} onValueChange={(val) => setForm({ ...form, employeeId: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih pegawai" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => !form.departmentId || e.departmentId === form.departmentId)
                        .map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name} {emp.position ? `- ${emp.position}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">Catatan Tambahan</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Catatan tambahan (opsional)"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateAppointment} disabled={formLoading}>
              {formLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Buat Janji Temu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedAppointment && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Detail Janji Temu
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-sm', (STATUS_CONFIG[selectedAppointment.status] || STATUS_CONFIG.menunggu).color)}>
                    {(() => {
                      const cfg = STATUS_CONFIG[selectedAppointment.status] || STATUS_CONFIG.menunggu
                      const Icon = cfg.icon
                      return <><Icon className="w-4 h-4 mr-1" />{cfg.label}</>
                    })()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Dibuat: {formatDateSafe(selectedAppointment.createdAt)}
                  </span>
                </div>

                {/* Visitor Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> Data Pengunjung
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DetailRow icon={User} label="Nama" value={selectedAppointment.visitorName} />
                    {selectedAppointment.visitorNip && (
                      <DetailRow icon={Hash} label="NIP" value={selectedAppointment.visitorNip} />
                    )}
                    {selectedAppointment.visitorPosition && (
                      <DetailRow icon={Briefcase} label="Jabatan" value={selectedAppointment.visitorPosition} />
                    )}
                    {selectedAppointment.phone && (
                      <DetailRow icon={Phone} label="HP" value={selectedAppointment.phone} />
                    )}
                    {selectedAppointment.email && (
                      <DetailRow icon={Mail} label="Email" value={selectedAppointment.email} />
                    )}
                  </CardContent>
                </Card>

                {/* Institution Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> Data Instansi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DetailRow icon={Building2} label="Instansi" value={selectedAppointment.institution} />
                    {selectedAppointment.institutionAddr && (
                      <DetailRow icon={MapPin} label="Alamat" value={selectedAppointment.institutionAddr} />
                    )}
                  </CardContent>
                </Card>

                {/* Visit Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Detail Kunjungan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <DetailRow icon={Calendar} label="Tanggal" value={formatDateSafe(selectedAppointment.visitDate)} />
                    {selectedAppointment.visitTime && (
                      <DetailRow icon={Clock} label="Waktu" value={selectedAppointment.visitTime} />
                    )}
                    <DetailRow icon={Users} label="Jumlah Orang" value={`${selectedAppointment.numberOfPeople} orang`} />
                    <DetailRow icon={FileText} label="Tujuan" value={selectedAppointment.visitPurpose} />
                    {selectedAppointment.department && (
                      <DetailRow icon={Building2} label="Bidang" value={selectedAppointment.department.name} />
                    )}
                    {selectedAppointment.employee && (
                      <DetailRow icon={User} label="Pegawai" value={`${selectedAppointment.employee.name} ${selectedAppointment.employee.position ? `(${selectedAppointment.employee.position})` : ''}`} />
                    )}
                    {selectedAppointment.notes && (
                      <DetailRow icon={FileText} label="Catatan" value={selectedAppointment.notes} />
                    )}
                  </CardContent>
                </Card>

                {/* Rejection Reason */}
                {selectedAppointment.status === 'ditolak' && selectedAppointment.rejectionReason && (
                  <Card className="border-red-200 dark:border-red-900/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-700 dark:text-red-400">Alasan Penolakan</p>
                          <p className="text-sm text-muted-foreground mt-1">{selectedAppointment.rejectionReason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                {selectedAppointment.status === 'menunggu' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'dikonfirmasi')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Konfirmasi
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      <XCircle className="w-4 h-4" />
                      Tolak
                    </Button>
                  </div>
                )}
                {selectedAppointment.status === 'dikonfirmasi' && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'selesai')}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Tandai Selesai
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 border-[#C5A55A] text-[#C5A55A] hover:bg-[#C5A55A]/10"
                      onClick={() => { setShowDetail(false); setShowDispositionDialog(true) }}
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Buat Disposisi
                    </Button>
                  </div>
                )}
                {(selectedAppointment.status === 'menunggu' || selectedAppointment.status === 'selesai') && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                    onClick={() => { setShowDetail(false); setShowDispositionDialog(true) }}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Buat Disposisi
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Disposition from Appointment Dialog */}
      <Dialog open={showDispositionDialog} onOpenChange={(open) => {
        setShowDispositionDialog(open)
        if (!open) {
          setDispositionToDeptId('')
          setDispositionToUserId('')
          setDispositionNotes('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <ArrowRightLeft className="w-5 h-5 text-[#C5A55A]" />
              Buat Disposisi dari Janji Temu
            </DialogTitle>
            <DialogDescription>
              Disposisi untuk <strong>{selectedAppointment?.visitorName}</strong> dari <strong>{selectedAppointment?.institution}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Appointment summary */}
            <Card className="bg-[#1e3a5f]/5 border-[#1e3a5f]/20">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#C5A55A] mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-[#1e3a5f]">{selectedAppointment?.visitorName}</p>
                    <p className="text-muted-foreground text-xs">{selectedAppointment?.institution} • {selectedAppointment?.visitPurpose}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Ke Bidang</label>
              <Select value={dispositionToDeptId} onValueChange={(val) => { setDispositionToDeptId(val); setDispositionToUserId('') }}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih bidang tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {dispositionDepts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Ke Pegawai</label>
              <Select value={dispositionToUserId} onValueChange={setDispositionToUserId}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih pegawai tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {dispositionUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} - {getRoleLabel(u.role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Catatan</label>
              <Textarea
                value={dispositionNotes}
                onChange={(e) => setDispositionNotes(e.target.value)}
                placeholder="Tambahkan catatan disposisi..."
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispositionDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleCreateDisposition}
              disabled={dispositionLoading}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {dispositionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Buat Disposisi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Tolak Janji Temu
            </DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan untuk janji temu dari {selectedAppointment?.visitorName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Tuliskan alasan penolakan..."
              rows={3}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectionReason('') }}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast.error('Alasan penolakan wajib diisi')
                  return
                }
                if (selectedAppointment) {
                  handleUpdateStatus(selectedAppointment.id, 'ditolak', rejectionReason)
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }
              }}
            >
              Tolak Janji Temu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
      <span className="text-muted-foreground min-w-[100px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
