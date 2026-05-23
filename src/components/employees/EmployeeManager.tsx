'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  X,
  FileText,
  Phone,
  Mail,
  Building2,
  UserCircle,
  BadgeCheck,
  Ban,
  Bell,
  MessageCircle,
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
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

interface EmployeeDepartment {
  id: string
  name: string
  code: string
}

interface Employee {
  id: string
  name: string
  nip: string | null
  position: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  notifyEmail: boolean
  notifyWhatsApp: boolean
  departmentId: string
  createdAt: string
  updatedAt: string
  department: EmployeeDepartment
}

interface DepartmentOption {
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

export function EmployeeManager() {
  // Data
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<DepartmentOption[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  // Filters
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // UI
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formNip, setFormNip] = useState('')
  const [formPosition, setFormPosition] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formDepartmentId, setFormDepartmentId] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formNotifyEmail, setFormNotifyEmail] = useState(true)
  const [formNotifyWhatsApp, setFormNotifyWhatsApp] = useState(true)

  // Fetch employees
  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '10')
      if (search) params.set('search', search)
      if (departmentFilter) params.set('departmentId', departmentFilter)
      if (showInactive) params.set('includeInactive', 'true')

      const res = await fetch(`/api/employees?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setEmployees(data.data)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Gagal memuat data pegawai')
    } finally {
      setLoading(false)
    }
  }, [search, departmentFilter, showInactive])

  // Fetch departments
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments?includeInactive=true')
        const data = await res.json()
        if (data.success) {
          setDepartments(data.data)
        }
      } catch {
        // silent
      }
    }
    fetchDepartments()
  }, [])

  // Fetch employees when filters change
  useEffect(() => {
    fetchEmployees(1)
  }, [fetchEmployees])

  // Reset form
  const resetForm = () => {
    setFormName('')
    setFormNip('')
    setFormPosition('')
    setFormPhone('')
    setFormEmail('')
    setFormDepartmentId('')
    setFormIsActive(true)
    setFormNotifyEmail(true)
    setFormNotifyWhatsApp(true)
  }

  // Open create dialog
  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  // Open edit dialog
  const openEdit = (emp: Employee) => {
    setSelectedEmployee(emp)
    setFormName(emp.name)
    setFormNip(emp.nip || '')
    setFormPosition(emp.position || '')
    setFormPhone(emp.phone || '')
    setFormEmail(emp.email || '')
    setFormDepartmentId(emp.departmentId)
    setFormIsActive(emp.isActive)
    setFormNotifyEmail(emp.notifyEmail ?? true)
    setFormNotifyWhatsApp(emp.notifyWhatsApp ?? true)
    setEditOpen(true)
  }

  // Open delete dialog
  const openDelete = (emp: Employee) => {
    setSelectedEmployee(emp)
    setDeleteOpen(true)
  }

  // Create employee
  const handleCreate = async () => {
    if (!formName.trim() || !formDepartmentId) {
      toast.error('Nama dan bidang wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          nip: formNip.trim() || null,
          position: formPosition.trim() || null,
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          departmentId: formDepartmentId,
          isActive: formIsActive,
          notifyEmail: formNotifyEmail,
          notifyWhatsApp: formNotifyWhatsApp,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Pegawai berhasil ditambahkan')
        setCreateOpen(false)
        resetForm()
        fetchEmployees(1)
      } else {
        toast.error(data.error || 'Gagal menambahkan pegawai')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Update employee
  const handleUpdate = async () => {
    if (!selectedEmployee || !formName.trim() || !formDepartmentId) {
      toast.error('Nama dan bidang wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          nip: formNip.trim() || null,
          position: formPosition.trim() || null,
          phone: formPhone.trim() || null,
          email: formEmail.trim() || null,
          departmentId: formDepartmentId,
          isActive: formIsActive,
          notifyEmail: formNotifyEmail,
          notifyWhatsApp: formNotifyWhatsApp,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Data pegawai dan preferensi notifikasi berhasil disimpan')
        setEditOpen(false)
        fetchEmployees(pagination.page)
      } else {
        toast.error(data.error || 'Gagal memperbarui pegawai')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Delete employee
  const handleDelete = async () => {
    if (!selectedEmployee) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Pegawai berhasil dihapus')
        setDeleteOpen(false)
        fetchEmployees(pagination.page)
      } else {
        toast.error(data.error || 'Gagal menghapus pegawai')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  // Toggle active/inactive
  const handleToggleActive = async (emp: Employee) => {
    setTogglingId(emp.id)
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !emp.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(emp.isActive ? 'Pegawai dinonaktifkan' : 'Pegawai diaktifkan')
        fetchEmployees(pagination.page)
      } else {
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setTogglingId(null)
    }
  }

  // Page change
  const handlePageChange = (page: number) => {
    fetchEmployees(page)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <Users className="size-6 text-[#C5A55A]" />
            Kelola Pegawai
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola data pegawai ({pagination.total} pegawai)
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#1e3a5f] hover:bg-[#16325a] text-white"
        >
          <Plus className="size-4 mr-2" />
          Tambah Pegawai
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-[#1e3a5f]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-[#1e3a5f] flex items-center gap-2">
            <Search className="size-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NIP, jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>

            {/* Department filter */}
            <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val === '_all' ? '' : val)}>
              <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                <SelectValue placeholder="Semua Bidang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Semua Bidang</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show inactive toggle */}
            <div className="flex items-center gap-3 px-3 py-2 border rounded-lg border-[#1e3a5f]/20 bg-white">
              <Switch
                id="show-inactive-emp"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive-emp" className="text-sm text-[#1e3a5f] cursor-pointer whitespace-nowrap">
                Tampilkan Nonaktif
              </Label>
            </div>

            {/* Placeholder for alignment */}
            <div className="hidden lg:block" />
          </div>

          {/* Active filters */}
          {(search || departmentFilter) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filter aktif:</span>
              {search && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Cari: {search}
                  <X className="size-3 cursor-pointer" onClick={() => setSearch('')} />
                </Badge>
              )}
              {departmentFilter && (
                <Badge variant="secondary" className="text-xs gap-1">
                  Bidang: {departments.find(d => d.id === departmentFilter)?.name || ''}
                  <X className="size-3 cursor-pointer" onClick={() => setDepartmentFilter('')} />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-red-500 hover:text-red-700 h-6"
                onClick={() => {
                  setSearch('')
                  setDepartmentFilter('')
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
                  <TableHead className="text-[#1e3a5f] font-semibold">NIP</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Nama</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Jabatan</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Bidang</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Telepon</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold">Status</TableHead>
                  <TableHead className="text-[#1e3a5f] font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="size-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground font-medium">Belum ada data pegawai</p>
                        <p className="text-muted-foreground text-sm">
                          Tambah pegawai baru dengan klik tombol &ldquo;Tambah Pegawai&rdquo;
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {employees.map((emp, index) => (
                      <motion.tr
                        key={emp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.03 }}
                        className={`hover:bg-[#1e3a5f]/5 border-b transition-colors ${
                          !emp.isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <TableCell className="font-mono text-sm">
                          {emp.nip || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] text-white text-xs font-bold shrink-0">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-[#1e3a5f]">{emp.name}</p>
                              {emp.email && (
                                <p className="text-xs text-muted-foreground">{emp.email}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {emp.position || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="size-3.5 text-[#C5A55A]" />
                            <span>{emp.department.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {emp.phone ? (
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3.5 text-muted-foreground" />
                              <span>{emp.phone}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`border-0 font-medium ${
                                emp.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}
                            >
                              {emp.isActive ? (
                                <><BadgeCheck className="size-3 mr-1" />Aktif</>
                              ) : (
                                <><Ban className="size-3 mr-1" />Nonaktif</>
                              )}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
                              onClick={() => handleToggleActive(emp)}
                              disabled={togglingId === emp.id}
                              title={emp.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {togglingId === emp.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : emp.isActive ? (
                                <BadgeCheck className="size-4 text-green-600" />
                              ) : (
                                <Ban className="size-4 text-gray-400" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#C5A55A] hover:bg-[#C5A55A]/10"
                              onClick={() => openEdit(emp)}
                              title="Edit"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:bg-red-50"
                              onClick={() => openDelete(emp)}
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
                {pagination.total} pegawai
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Plus className="size-5" />
              Tambah Pegawai Baru
            </DialogTitle>
            <DialogDescription>Tambahkan pegawai baru ke dalam sistem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Nama Lengkap *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama lengkap pegawai"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">NIP</Label>
                <Input
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Nomor Induk Pegawai"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Jabatan</Label>
                <Input
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  placeholder="Jabatan/posisi"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                  <Phone className="size-3.5" />
                  Telepon
                </Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                  <Mail className="size-3.5" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                <Building2 className="size-3.5" />
                Bidang *
              </Label>
              <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih bidang" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="create-emp-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="create-emp-active" className="text-sm font-medium text-[#1e3a5f] cursor-pointer">
                Status Aktif
              </Label>
            </div>

            {/* Notification Preferences */}
            <div className="border-t border-[#1e3a5f]/10 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1e3a5f] flex items-center gap-1.5">
                <Bell className="size-4 text-[#C5A55A]" />
                Preferensi Notifikasi
              </h4>
              <div className="flex items-center justify-between rounded-lg border border-[#1e3a5f]/10 p-3">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-[#1e3a5f]" />
                  <Label htmlFor="create-emp-notify-email" className="text-sm text-[#1e3a5f] cursor-pointer">
                    Notifikasi Email
                  </Label>
                </div>
                <Switch
                  id="create-emp-notify-email"
                  checked={formNotifyEmail}
                  onCheckedChange={setFormNotifyEmail}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#1e3a5f]/10 p-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-green-600" />
                  <Label htmlFor="create-emp-notify-whatsapp" className="text-sm text-[#1e3a5f] cursor-pointer">
                    Notifikasi WhatsApp
                  </Label>
                </div>
                <Switch
                  id="create-emp-notify-whatsapp"
                  checked={formNotifyWhatsApp}
                  onCheckedChange={setFormNotifyWhatsApp}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formName.trim() || !formDepartmentId}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Tambah Pegawai'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Pencil className="size-5" />
              Edit Pegawai
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi pegawai <strong>{selectedEmployee?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Nama Lengkap *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama lengkap pegawai"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">NIP</Label>
                <Input
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  placeholder="Nomor Induk Pegawai"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Jabatan</Label>
                <Input
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  placeholder="Jabatan/posisi"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                  <Phone className="size-3.5" />
                  Telepon
                </Label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                  <Mail className="size-3.5" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f] flex items-center gap-1">
                <Building2 className="size-3.5" />
                Bidang *
              </Label>
              <Select value={formDepartmentId} onValueChange={setFormDepartmentId}>
                <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                  <SelectValue placeholder="Pilih bidang" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-emp-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="edit-emp-active" className="text-sm font-medium text-[#1e3a5f] cursor-pointer">
                Status Aktif
              </Label>
            </div>

            {/* Notification Preferences */}
            <div className="border-t border-[#1e3a5f]/10 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#1e3a5f] flex items-center gap-1.5">
                <Bell className="size-4 text-[#C5A55A]" />
                Preferensi Notifikasi
              </h4>
              <div className="flex items-center justify-between rounded-lg border border-[#1e3a5f]/10 p-3">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-[#1e3a5f]" />
                  <Label htmlFor="edit-emp-notify-email" className="text-sm text-[#1e3a5f] cursor-pointer">
                    Notifikasi Email
                  </Label>
                </div>
                <Switch
                  id="edit-emp-notify-email"
                  checked={formNotifyEmail}
                  onCheckedChange={setFormNotifyEmail}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[#1e3a5f]/10 p-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-green-600" />
                  <Label htmlFor="edit-emp-notify-whatsapp" className="text-sm text-[#1e3a5f] cursor-pointer">
                    Notifikasi WhatsApp
                  </Label>
                </div>
                <Switch
                  id="edit-emp-notify-whatsapp"
                  checked={formNotifyWhatsApp}
                  onCheckedChange={setFormNotifyWhatsApp}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || !formName.trim() || !formDepartmentId}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Bell className="size-4 mr-2" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Hapus Pegawai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pegawai <strong>{selectedEmployee?.name}</strong>
              {selectedEmployee?.nip && ` (NIP: ${selectedEmployee.nip})`}?
              {selectedEmployee && (
                <span className="block mt-1 text-sm">
                  Pegawai yang memiliki tamu terkait akan dinonaktifkan, bukan dihapus.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
