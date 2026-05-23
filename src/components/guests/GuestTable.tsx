'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Clock,
  Loader2,
  X,
  Hash,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils'

interface Guest {
  id: string
  name: string
  nik: string | null
  institution: string | null
  address: string | null
  phone: string | null
  email: string | null
  visitPurpose: string
  need: string | null
  photo: string | null
  document: string | null
  signature: string | null
  status: string
  checkInTime: string | null
  checkOutTime: string | null
  visitDate: string
  createdAt: string
  departmentId: string | null
  employeeId: string | null
  department: { id: string; name: string; code: string } | null
  employee: { id: string; name: string; position: string | null } | null
}

interface Department {
  id: string
  name: string
  code: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function GuestTable() {
  const { setCurrentPage } = useAppStore()

  // Data state
  const [guests, setGuests] = useState<Guest[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // UI state
  const [loading, setLoading] = useState(true)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch guests
  const fetchGuests = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (departmentFilter) params.set('departmentId', departmentFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/guests?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setGuests(data.data)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Gagal memuat data tamu')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, departmentFilter, dateFrom, dateTo])

  // Fetch departments
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments')
        const data = await res.json()
        if (data.success) {
          setDepartments(data.data)
        }
      } catch {
        // silent fail
      }
    }
    fetchDepartments()
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchGuests(1)
  }, [fetchGuests])

  // Page change
  const handlePageChange = (page: number) => {
    fetchGuests(page)
  }

  // View detail
  const handleViewDetail = (guest: Guest) => {
    setSelectedGuest(guest)
    setDetailOpen(true)
  }

  // Update status
  const handleUpdateStatus = (guest: Guest) => {
    setSelectedGuest(guest)
    setNewStatus(guest.status)
    setStatusOpen(true)
  }

  const confirmUpdateStatus = async () => {
    if (!selectedGuest || !newStatus) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/guests/${selectedGuest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Status tamu berhasil diperbarui')
        setStatusOpen(false)
        fetchGuests(pagination.page)
      } else {
        toast.error(data.error || 'Gagal memperbarui status')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setUpdating(false)
    }
  }

  // Delete
  const handleDelete = (guest: Guest) => {
    setSelectedGuest(guest)
    setDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedGuest) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/guests/${selectedGuest.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Data tamu berhasil dihapus')
        setDeleteOpen(false)
        fetchGuests(pagination.page)
      } else {
        toast.error(data.error || 'Gagal menghapus data')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  const statusOptions = [
    { value: 'menunggu', label: 'Menunggu' },
    { value: 'check_in', label: 'Check-In' },
    { value: 'dilayani', label: 'Dilayani' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'ditolak', label: 'Ditolak' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Data Tamu</h1>
          <p className="text-muted-foreground text-sm">
            Kelola data tamu yang terdaftar ({pagination.total} tamu)
          </p>
        </div>
        <Button
          onClick={() => setCurrentPage('guest-form')}
          className="bg-[#1e3a5f] hover:bg-[#16325a] text-white"
        >
          <Plus className="size-4 mr-2" />
          Tambah Tamu
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#1e3a5f]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#1e3a5f] flex items-center gap-2">
            <Filter className="size-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, instansi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val === '_all' ? '' : val)}>
              <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Status</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val === '_all' ? '' : val)}>
              <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                <SelectValue placeholder="Semua Bidang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Bidang</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
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
          {(search || statusFilter || departmentFilter || dateFrom || dateTo) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter aktif:</span>
              {search && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Cari: {search}
                  <X className="size-3 cursor-pointer" onClick={() => setSearch('')} />
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Status: {getStatusLabel(statusFilter)}
                  <X className="size-3 cursor-pointer" onClick={() => setStatusFilter('')} />
                </Badge>
              )}
              {departmentFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Bidang: {departments.find(d => d.id === departmentFilter)?.name || ''}
                  <X className="size-3 cursor-pointer" onClick={() => setDepartmentFilter('')} />
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
                  setSearch('')
                  setStatusFilter('')
                  setDepartmentFilter('')
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
                  <TableHead className="text-[#1e3a5f] font-semibold">Nama</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Instansi</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Bidang</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Tujuan</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Status</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Waktu Kunjungan</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : guests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">Belum ada data tamu</p>
                        <p className="text-muted-foreground text-sm">
                          Tambah tamu baru dengan klik tombol &ldquo;Tambah Tamu&rdquo;
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {guests.map((guest, index) => (
                      <motion.tr
                        key={guest.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-[#1e3a5f]/5 border-b transition-colors"
                      >
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {index + 1 + (pagination.page - 1) * pagination.limit}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-[#1e3a5f]">{guest.name}</p>
                            {guest.phone && (
                              <p className="text-xs text-muted-foreground">{guest.phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {guest.institution || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {guest.department?.name || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-sm max-w-[150px] truncate">
                          {guest.visitPurpose}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(guest.status)} border-0 font-medium`}
                          >
                            {getStatusLabel(guest.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(guest.visitDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                              onClick={() => handleViewDetail(guest)}
                              title="Lihat Detail"
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#C5A55A] hover:bg-[#C5A55A]/10"
                              onClick={() => handleUpdateStatus(guest)}
                              title="Ubah Status"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => handleDelete(guest)}
                              title="Hapus"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
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
                {pagination.total} tamu
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 border-[#1e3a5f]/30"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    // Show first, last, current, and neighbors
                    return (
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                    )
                  })
                  .map((p, i, arr) => {
                    const prev = arr[i - 1]
                    const showEllipsis = prev !== undefined && p - prev > 1
                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={p === pagination.page ? 'default' : 'outline'}
                          size="icon"
                          className={`h-8 w-8 ${
                            p === pagination.page
                              ? 'bg-[#1e3a5f] hover:bg-[#16325a]'
                              : 'border-[#1e3a5f]/30'
                          }`}
                          onClick={() => handlePageChange(p)}
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Eye className="size-5" />
              Detail Tamu
            </DialogTitle>
            <DialogDescription>Informasi lengkap tamu</DialogDescription>
          </DialogHeader>
          {selectedGuest && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] rounded-xl text-white w-full">
                  <span className="text-sm text-[#C5A55A]">Status Tamu</span>
                  <Badge
                    variant="outline"
                    className={`${getStatusColor(selectedGuest.status)} border-0 mt-2 font-medium`}
                  >
                    {getStatusLabel(selectedGuest.status)}
                  </Badge>
                </div>
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                    <p className="font-medium text-[#1e3a5f]">{selectedGuest.name}</p>
                  </div>
                </div>
                {selectedGuest.nik && (
                  <div className="flex items-start gap-3">
                    <Hash className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">NIK</p>
                      <p className="font-medium">{selectedGuest.nik}</p>
                    </div>
                  </div>
                )}
                {selectedGuest.institution && (
                  <div className="flex items-start gap-3">
                    <Building2 className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Instansi</p>
                      <p className="font-medium">{selectedGuest.institution}</p>
                    </div>
                  </div>
                )}
                {selectedGuest.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nomor HP</p>
                      <p className="font-medium">{selectedGuest.phone}</p>
                    </div>
                  </div>
                )}
                {selectedGuest.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedGuest.email}</p>
                    </div>
                  </div>
                )}
                {selectedGuest.address && (
                  <div className="flex items-start gap-3 sm:col-span-2">
                    <Building2 className="size-5 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Alamat</p>
                      <p className="font-medium">{selectedGuest.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Visit Info */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-[#1e3a5f]">Informasi Kunjungan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Tujuan Kunjungan</p>
                    <p className="font-medium">{selectedGuest.visitPurpose}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bidang Tujuan</p>
                    <p className="font-medium">{selectedGuest.department?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pegawai Tujuan</p>
                    <p className="font-medium">{selectedGuest.employee?.name || '-'}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 text-[#1e3a5f] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu Kunjungan</p>
                      <p className="font-medium">{formatDateTime(selectedGuest.visitDate)}</p>
                    </div>
                  </div>
                  {selectedGuest.need && (
                    <div className="sm:col-span-2">
                      <p className="text-xs text-muted-foreground">Keperluan</p>
                      <p className="font-medium">{selectedGuest.need}</p>
                    </div>
                  )}
                  {selectedGuest.checkInTime && (
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu Check-In</p>
                      <p className="font-medium">{formatDateTime(selectedGuest.checkInTime)}</p>
                    </div>
                  )}
                  {selectedGuest.checkOutTime && (
                    <div>
                      <p className="text-xs text-muted-foreground">Waktu Check-Out</p>
                      <p className="font-medium">{formatDateTime(selectedGuest.checkOutTime)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature */}
              {selectedGuest.signature && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-[#1e3a5f] mb-2">Tanda Tangan</h4>
                  <div className="border rounded-lg p-2 bg-white">
                    <img
                      src={selectedGuest.signature}
                      alt="Tanda tangan"
                      className="max-h-32 mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Pencil className="size-5" />
              Ubah Status Tamu
            </DialogTitle>
            <DialogDescription>
              Ubah status tamu <strong>{selectedGuest?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Status saat ini:</p>
              <Badge
                variant="outline"
                className={`${getStatusColor(selectedGuest?.status || '')} border-0 font-medium`}
              >
                {getStatusLabel(selectedGuest?.status || '')}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Ubah ke:</p>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih status baru" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={confirmUpdateStatus}
              disabled={updating || !newStatus || newStatus === selectedGuest?.status}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {updating ? (
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

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Hapus Data Tamu</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data tamu{' '}
              <strong>{selectedGuest?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan dan semua data terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
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
