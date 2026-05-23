'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Eye,
  Pencil,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
  Loader2,
  X,
  User,
  Building2,
  StickyNote,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { getStatusColor, getStatusLabel, formatDateTime, getRoleLabel } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface DispositionGuest {
  id: string
  name: string
  institution: string | null
  visitPurpose: string
  status: string
  phone: string | null
}

interface DispositionAppointment {
  id: string
  visitorName: string
  visitorNip?: string | null
  visitorPosition?: string | null
  institution: string
  phone?: string | null
  visitPurpose: string
  visitDate: string
  visitTime?: string | null
  numberOfPeople: number
  status: string
  department?: { id: string; name: string; code: string } | null
  employee?: { id: string; name: string; position: string } | null
}

interface DispositionUser {
  id: string
  name: string
  role: string
}

interface FollowUp {
  id: string
  description: string
  createdBy: string
  createdAt: string
}

interface Disposition {
  id: string
  guestId: string
  appointmentId: string | null
  fromUserId: string
  toUserId: string | null
  toDepartmentId: string | null
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  guest: DispositionGuest
  appointment: DispositionAppointment | null
  fromUser: DispositionUser
  toUser: DispositionUser | null
  followUps: FollowUp[]
}

interface GuestOption {
  id: string
  name: string
  institution: string | null
  visitPurpose: string
}

interface AppointmentOption {
  id: string
  visitorName: string
  institution: string
  visitPurpose: string
  visitDate: string
  department?: { id: string; name: string; code: string } | null
}

interface DepartmentOption {
  id: string
  name: string
  code: string
}

interface UserOption {
  id: string
  name: string
  role: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const dispositionStatusOptions = [
  { value: 'menunggu', label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'diproses', label: 'Diproses', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'selesai', label: 'Selesai', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'ditolak', label: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
]

function getDispositionStatusColor(status: string): string {
  const map: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    diproses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    selesai: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ditolak: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }
  return map[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

function getDispositionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    menunggu: 'Menunggu',
    diproses: 'Diproses',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
  }
  return map[status] || status
}

function getAppointmentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    menunggu: 'Menunggu',
    dikonfirmasi: 'Dikonfirmasi',
    ditolak: 'Ditolak',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
  }
  return map[status] || status
}

function getAppointmentStatusColor(status: string): string {
  const map: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    dikonfirmasi: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ditolak: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    selesai: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    dibatalkan: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

export function DispositionManager() {
  const { currentUser } = useAppStore()

  // Data
  const [dispositions, setDispositions] = useState<Disposition[]>([])
  const [guests, setGuests] = useState<GuestOption[]>([])
  const [appointments, setAppointments] = useState<AppointmentOption[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // UI
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDisposition, setSelectedDisposition] = useState<Disposition | null>(null)
  const [saving, setSaving] = useState(false)

  // Create form
  const [formGuestId, setFormGuestId] = useState('')
  const [formAppointmentId, setFormAppointmentId] = useState('')
  const [formToDepartmentId, setFormToDepartmentId] = useState('')
  const [formToUserId, setFormToUserId] = useState('')
  const [formNotes, setFormNotes] = useState('')

  // Update form
  const [updateStatus, setUpdateStatus] = useState('')
  const [updateNotes, setUpdateNotes] = useState('')
  const [updateFollowUp, setUpdateFollowUp] = useState('')

  // Fetch dispositions
  const fetchDispositions = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (statusFilter) params.set('status', statusFilter)
      // Role-based filtering: pass userId and userRole for pegawai/pimpinan
      if (currentUser?.id && (currentUser.role === 'pegawai' || currentUser.role === 'pimpinan')) {
        params.set('userId', currentUser.id)
        params.set('userRole', currentUser.role)
      }

      const res = await fetch(`/api/dispositions?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        let filtered = data.data as Disposition[]
        // Client-side date filtering since API doesn't support it
        if (dateFrom) {
          const from = new Date(dateFrom)
          from.setHours(0, 0, 0, 0)
          filtered = filtered.filter((d: Disposition) => new Date(d.createdAt) >= from)
        }
        if (dateTo) {
          const to = new Date(dateTo)
          to.setHours(23, 59, 59, 999)
          filtered = filtered.filter((d: Disposition) => new Date(d.createdAt) <= to)
        }
        setDispositions(filtered)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Gagal memuat data disposisi')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo, currentUser?.id, currentUser?.role])

  // Fetch supporting data
  useEffect(() => {
    async function fetchData() {
      try {
        const [guestsRes, deptsRes, usersRes, appointRes] = await Promise.all([
          fetch('/api/guests?limit=100'),
          fetch('/api/departments?includeInactive=true'),
          fetch('/api/users'),
          fetch('/api/appointments?limit=100'),
        ])
        const guestsData = await guestsRes.json()
        const deptsData = await deptsRes.json()
        const usersData = await usersRes.json()
        const appointData = await appointRes.json()

        if (guestsData.success) setGuests(guestsData.data)
        if (deptsData.success) setDepartments(deptsData.data)
        if (usersData.success) setUsers(usersData.data)
        if (appointData.success) setAppointments(appointData.data)
      } catch {
        // silent
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    fetchDispositions(1)
  }, [fetchDispositions])

  // Create disposition
  const handleCreate = async () => {
    if (!formGuestId) {
      toast.error('Pilih tamu terlebih dahulu')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/dispositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: formGuestId,
          appointmentId: formAppointmentId || null,
          fromUserId: currentUser?.id || '1',
          toUserId: formToUserId || null,
          toDepartmentId: formToDepartmentId || null,
          notes: formNotes || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Disposisi berhasil dibuat')
        setCreateOpen(false)
        resetCreateForm()
        fetchDispositions(1)
      } else {
        toast.error(data.error || 'Gagal membuat disposisi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Update disposition
  const handleUpdate = async () => {
    if (!selectedDisposition || !updateStatus) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        status: updateStatus,
        notes: updateNotes || undefined,
        userId: currentUser?.id || '1',
      }
      if (updateFollowUp) {
        body.followUpDescription = updateFollowUp
      }
      const res = await fetch(`/api/dispositions/${selectedDisposition.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Disposisi berhasil diperbarui')
        setUpdateOpen(false)
        fetchDispositions(pagination.page)
      } else {
        toast.error(data.error || 'Gagal memperbarui disposisi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const resetCreateForm = () => {
    setFormGuestId('')
    setFormAppointmentId('')
    setFormToDepartmentId('')
    setFormToUserId('')
    setFormNotes('')
  }

  const openUpdateDialog = (disp: Disposition) => {
    setSelectedDisposition(disp)
    setUpdateStatus(disp.status)
    setUpdateNotes(disp.notes || '')
    setUpdateFollowUp('')
    setUpdateOpen(true)
  }

  const openDetailDialog = (disp: Disposition) => {
    setSelectedDisposition(disp)
    setDetailOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'menunggu': return <AlertCircle className="size-4" />
      case 'diproses': return <Clock className="size-4" />
      case 'selesai': return <CheckCircle2 className="size-4" />
      case 'ditolak': return <XCircle className="size-4" />
      default: return null
    }
  }

  // Get display name for a disposition (prioritize appointment name)
  const getDisplayName = (disp: Disposition) => {
    if (disp.appointment) {
      return disp.appointment.visitorName
    }
    return disp.guest.name
  }

  const getDisplayInstitution = (disp: Disposition) => {
    if (disp.appointment) {
      return disp.appointment.institution
    }
    return disp.guest.institution
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <ArrowRightLeft className="size-6 text-[#C5A55A]" />
            Disposisi
          </h1>
          <p className="text-muted-foreground text-sm">
            {currentUser?.role === 'pegawai' || currentUser?.role === 'pimpinan'
              ? `Disposisi untuk Anda (${pagination.total} disposisi)`
              : `Kelola disposisi tamu (${pagination.total} disposisi)`
            }
          </p>
        </div>
        {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'resepsionis') && (
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#1e3a5f] hover:bg-[#16325a] text-white"
        >
          <Plus className="size-4 mr-2" />
          Buat Disposisi
        </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="border-[#1e3a5f]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#1e3a5f] flex items-center gap-2">
            <Search className="size-4" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === '_all' ? '' : val)}>
              <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Status</SelectItem>
                {dispositionStatusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date from */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-9 border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                placeholder="Dari tanggal"
              />
            </div>

            {/* Date to */}
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-9 border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                placeholder="Sampai tanggal"
              />
            </div>
          </div>

          {/* Active filters */}
          {(statusFilter || dateFrom || dateTo) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter aktif:</span>
              {statusFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Status: {getDispositionStatusLabel(statusFilter)}
                  <X className="size-3 cursor-pointer" onClick={() => setStatusFilter('')} />
                </Badge>
              )}
              {dateFrom && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Dari: {dateFrom}
                  <X className="size-3 cursor-pointer" onClick={() => setDateFrom('')} />
                </Badge>
              )}
              {dateTo && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Sampai: {dateTo}
                  <X className="size-3 cursor-pointer" onClick={() => setDateTo('')} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 h-6"
                onClick={() => {
                  setStatusFilter('')
                  setDateFrom('')
                  setDateTo('')
                }}
              >
                Hapus Semua Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-[#1e3a5f]/20">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#1e3a5f]/5 hover:bg-[#1e3a5f]/5">
                  <TableHead className="text-[#1e3a5f] font-semibold w-12">No</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Tamu</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Dari</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Ke Bidang</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Status</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Catatan</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Tanggal</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : dispositions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">Belum ada disposisi</p>
                        <p className="text-muted-foreground text-sm">
                          Buat disposisi baru dengan klik tombol &ldquo;Buat Disposisi&rdquo;
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {dispositions.map((disp, index) => {
                      const toDept = departments.find(d => d.id === disp.toDepartmentId)
                      const displayName = getDisplayName(disp)
                      const displayInst = getDisplayInstitution(disp)
                      return (
                        <motion.tr
                          key={disp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-[#1e3a5f]/5 border-b transition-colors"
                        >
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {(pagination.page - 1) * pagination.limit + index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-[#1e3a5f] flex items-center gap-1.5">
                                {displayName}
                                {disp.appointmentId && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-[#C5A55A]/10 text-[#C5A55A] border-[#C5A55A]/30">
                                    <CalendarCheck className="size-3 mr-0.5" />
                                    Janji Temu
                                  </Badge>
                                )}
                              </p>
                              {displayInst && (
                                <p className="text-xs text-muted-foreground">{displayInst}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>
                              <p className="font-medium">{disp.fromUser.name}</p>
                              <p className="text-xs text-muted-foreground">{getRoleLabel(disp.fromUser.role)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {toDept ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="size-3.5 text-[#C5A55A]" />
                                <span>{toDept.name}</span>
                              </div>
                            ) : disp.toUser ? (
                              <div className="flex items-center gap-1">
                                <User className="size-3.5 text-[#1e3a5f]" />
                                <span>{disp.toUser.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getDispositionStatusColor(disp.status)} border-0 font-medium gap-1`}
                            >
                              {getStatusIcon(disp.status)}
                              {getDispositionStatusLabel(disp.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {disp.notes || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(disp.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                                onClick={() => openDetailDialog(disp)}
                                title="Lihat Detail"
                              >
                                <Eye className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-[#C5A55A] hover:bg-[#C5A55A]/10"
                                onClick={() => openUpdateDialog(disp)}
                                title="Ubah Status"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} dari{' '}
                {pagination.total} disposisi
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[#1e3a5f]/30"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchDispositions(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                  .map((p, i, arr) => {
                    const prev = arr[i - 1]
                    const showEllipsis = prev !== undefined && p - prev > 1
                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                        <Button
                          variant={p === pagination.page ? 'default' : 'outline'}
                          size="icon"
                          className={`h-8 w-8 ${
                            p === pagination.page
                              ? 'bg-[#1e3a5f] hover:bg-[#16325a]'
                              : 'border-[#1e3a5f]/30'
                          }`}
                          onClick={() => fetchDispositions(p)}
                        >
                          {p}
                        </Button>
                      </span>
                    )
                  })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[#1e3a5f]/30"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchDispositions(pagination.page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Disposition Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Plus className="size-5" />
              Buat Disposisi Baru
            </DialogTitle>
            <DialogDescription>Buat disposisi untuk meneruskan tamu ke bidang/pegawai tujuan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Guest select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Tamu *</label>
              <Select value={formGuestId} onValueChange={setFormGuestId}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih tamu" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      <span className="flex items-center gap-2">
                        {g.name}
                        {g.institution && <span className="text-muted-foreground text-xs">({g.institution})</span>}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appointment select (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1.5">
                <CalendarCheck className="size-4 text-[#C5A55A]" />
                Janji Temu (Opsional)
              </label>
              <Select value={formAppointmentId} onValueChange={(val) => setFormAppointmentId(val === '_none' ? '' : val)}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih janji temu (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tidak ada</SelectItem>
                  {appointments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="flex items-center gap-2">
                        <CalendarCheck className="size-3 text-[#C5A55A]" />
                        {a.visitorName}
                        <span className="text-muted-foreground text-xs">({a.institution})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Hubungkan disposisi ini dengan janji temu yang sudah dikonfirmasi</p>
            </div>

            {/* Department select */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Ke Bidang</label>
              <Select value={formToDepartmentId} onValueChange={(val) => { setFormToDepartmentId(val); setFormToUserId('') }}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih bidang tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tidak ada</SelectItem>
                  {departments.map((d) => (
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
              <Select value={formToUserId} onValueChange={setFormToUserId}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih pegawai tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Tidak ada</SelectItem>
                  {users
                    .filter(u => !formToDepartmentId || formToDepartmentId === '_none' || true)
                    .map((u) => (
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
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Tambahkan catatan disposisi..."
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm() }}>
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formGuestId}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Buat Disposisi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Pencil className="size-5" />
              Update Disposisi
            </DialogTitle>
            <DialogDescription>
              Ubah status disposisi untuk tamu <strong>{selectedDisposition ? getDisplayName(selectedDisposition) : ''}</strong>
              {selectedDisposition?.appointmentId && (
                <span className="text-[#C5A55A] ml-1">(Janji Temu)</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current status */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status saat ini:</p>
              <Badge
                variant="outline"
                className={`${getDispositionStatusColor(selectedDisposition?.status || '')} border-0 font-medium gap-1`}
              >
                {getStatusIcon(selectedDisposition?.status || '')}
                {getDispositionStatusLabel(selectedDisposition?.status || '')}
              </Badge>
            </div>

            {/* New status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Ubah ke:</label>
              <Select value={updateStatus} onValueChange={setUpdateStatus}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih status baru" />
                </SelectTrigger>
                <SelectContent>
                  {dispositionStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {getStatusIcon(opt.value)}
                        {opt.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Update notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f]">Catatan</label>
              <Textarea
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Tambahkan catatan..."
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[60px]"
              />
            </div>

            {/* Follow-up */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                <MessageSquare className="size-4" />
                Tindak Lanjut
              </label>
              <Textarea
                value={updateFollowUp}
                onChange={(e) => setUpdateFollowUp(e.target.value)}
                placeholder="Tambahkan tindak lanjut..."
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || !updateStatus}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Eye className="size-5" />
              Detail Disposisi
            </DialogTitle>
            <DialogDescription>Informasi lengkap disposisi</DialogDescription>
          </DialogHeader>
          {selectedDisposition && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] rounded-xl text-white w-full">
                  <ArrowRightLeft className="size-6 text-[#C5A55A] mb-1" />
                  <span className="text-sm text-[#C5A55A]">Status Disposisi</span>
                  <Badge
                    variant="outline"
                    className={`${getDispositionStatusColor(selectedDisposition.status)} border-0 mt-2 font-medium text-sm px-4 py-1 gap-1`}
                  >
                    {getStatusIcon(selectedDisposition.status)}
                    {getDispositionStatusLabel(selectedDisposition.status)}
                  </Badge>
                </div>
              </div>

              {/* Guest Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <User className="size-4" />
                  Informasi Tamu
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Tamu</p>
                    <p className="font-medium text-[#1e3a5f]">{selectedDisposition.guest.name}</p>
                  </div>
                  {selectedDisposition.guest.institution && (
                    <div>
                      <p className="text-xs text-muted-foreground">Instansi</p>
                      <p className="font-medium">{selectedDisposition.guest.institution}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Tujuan Kunjungan</p>
                    <p className="font-medium">{selectedDisposition.guest.visitPurpose}</p>
                  </div>
                  {selectedDisposition.guest.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telepon</p>
                      <p className="font-medium">{selectedDisposition.guest.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Info (if linked) */}
              {selectedDisposition.appointment && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#1e3a5f] flex items-center gap-2">
                      <CalendarCheck className="size-4 text-[#C5A55A]" />
                      Informasi Janji Temu
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-[#C5A55A]/10 text-[#C5A55A] border-[#C5A55A]/30 ml-1">
                        Terhubung
                      </Badge>
                    </h4>
                    <div className="pl-6 p-4 rounded-xl bg-gradient-to-r from-[#C5A55A]/5 to-[#C5A55A]/10 border border-[#C5A55A]/20">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Nama Pengunjung</p>
                          <p className="font-medium text-[#1e3a5f]">{selectedDisposition.appointment.visitorName}</p>
                        </div>
                        {selectedDisposition.appointment.visitorPosition && (
                          <div>
                            <p className="text-xs text-muted-foreground">Jabatan</p>
                            <p className="font-medium">{selectedDisposition.appointment.visitorPosition}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Instansi</p>
                          <p className="font-medium">{selectedDisposition.appointment.institution}</p>
                        </div>
                        {selectedDisposition.appointment.phone && (
                          <div>
                            <p className="text-xs text-muted-foreground">Telepon</p>
                            <p className="font-medium">{selectedDisposition.appointment.phone}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Tujuan Kunjungan</p>
                          <p className="font-medium">{selectedDisposition.appointment.visitPurpose}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tanggal & Waktu</p>
                          <p className="font-medium">
                            {new Date(selectedDisposition.appointment.visitDate).toLocaleDateString('id-ID')}
                            {selectedDisposition.appointment.visitTime && ` ${selectedDisposition.appointment.visitTime}`}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Jumlah Orang</p>
                          <p className="font-medium flex items-center gap-1">
                            <Users className="size-3.5" />
                            {selectedDisposition.appointment.numberOfPeople} orang
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status Janji</p>
                          <Badge
                            variant="outline"
                            className={`${getAppointmentStatusColor(selectedDisposition.appointment.status)} border-0 text-xs`}
                          >
                            {getAppointmentStatusLabel(selectedDisposition.appointment.status)}
                          </Badge>
                        </div>
                        {selectedDisposition.appointment.department && (
                          <div>
                            <p className="text-xs text-muted-foreground">Bidang Tujuan</p>
                            <p className="font-medium flex items-center gap-1">
                              <Building2 className="size-3.5 text-[#C5A55A]" />
                              {selectedDisposition.appointment.department.name}
                            </p>
                          </div>
                        )}
                        {selectedDisposition.appointment.employee && (
                          <div>
                            <p className="text-xs text-muted-foreground">Pegawai Tujuan</p>
                            <p className="font-medium">{selectedDisposition.appointment.employee.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedDisposition.appointment.employee.position}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Disposition Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-[#1e3a5f] flex items-center gap-2">
                  <ArrowRightLeft className="size-4" />
                  Informasi Disposisi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Dari</p>
                    <p className="font-medium text-[#1e3a5f]">{selectedDisposition.fromUser.name}</p>
                    <p className="text-xs text-muted-foreground">{getRoleLabel(selectedDisposition.fromUser.role)}</p>
                  </div>
                  {selectedDisposition.toUser && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ke Pegawai</p>
                      <p className="font-medium">{selectedDisposition.toUser.name}</p>
                      <p className="text-xs text-muted-foreground">{getRoleLabel(selectedDisposition.toUser.role)}</p>
                    </div>
                  )}
                  {selectedDisposition.toDepartmentId && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ke Bidang</p>
                      <p className="font-medium">
                        {departments.find(d => d.id === selectedDisposition.toDepartmentId)?.name || '-'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Tanggal Dibuat</p>
                    <p className="font-medium">{formatDateTime(selectedDisposition.createdAt)}</p>
                  </div>
                </div>
                {selectedDisposition.notes && (
                  <div className="pl-6">
                    <p className="text-xs text-muted-foreground">Catatan</p>
                    <div className="mt-1 p-3 bg-[#1e3a5f]/5 rounded-lg text-sm">
                      <StickyNote className="size-4 inline mr-2 text-[#C5A55A]" />
                      {selectedDisposition.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up History */}
              {selectedDisposition.followUps && selectedDisposition.followUps.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold text-[#1e3a5f] flex items-center gap-2">
                      <MessageSquare className="size-4" />
                      Riwayat Tindak Lanjut ({selectedDisposition.followUps.length})
                    </h4>
                    <div className="space-y-3 pl-6">
                      {selectedDisposition.followUps.map((fu, idx) => (
                        <motion.div
                          key={fu.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex gap-3 items-start"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-[#C5A55A] mt-1.5 shrink-0" />
                            {idx < (selectedDisposition.followUps?.length ?? 0) - 1 && (
                              <div className="w-0.5 h-full bg-[#1e3a5f]/20 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 pb-3">
                            <p className="text-sm font-medium">{fu.description}</p>
                            <p className="text-xs text-muted-foreground">
                              oleh {fu.createdBy} &bull; {formatDateTime(fu.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
