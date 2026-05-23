'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Shield,
  Users,
  Loader2,
  RefreshCw,
  Filter,
  Power,
  PowerOff,
  Mail,
  Phone,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getRoleColor, getRoleLabel } from '@/lib/utils'

// ─── Color Theme ────────────────────────────────────────────────────────────────
const COLORS = {
  navy: '#0c2d57',
  navyLight: '#1a4072',
  gold: '#c9a84c',
  goldLight: '#d4ba6a',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  info: '#3b82f6',
  slate: '#64748b',
}

// ─── Types ──────────────────────────────────────────────────────────────────────
interface UserData {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  avatar: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Skeleton Loaders ───────────────────────────────────────────────────────────
function UserManagerSkeleton() {
  return (
    <div className="space-y-0">
      <div className="px-4 md:px-6 pt-5 pb-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48 mt-2" />
      </div>
      <div className="px-4 md:px-6 mt-4">
        <Skeleton className="h-16 rounded-xl" />
      </div>
      <div className="px-4 md:px-6 mt-4">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function UserManager() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pegawai',
    phone: '',
    isActive: true,
  })

  // Fetch users
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (roleFilter && roleFilter !== 'all') {
        params.set('role', roleFilter)
      }
      const res = await fetch(`/api/users?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setUsers(json.data)
        setPagination(json.pagination)
      }
    } catch (err) {
      console.error('Failed to fetch users:', err)
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => {
    fetchUsers(pagination.page)
  }, [fetchUsers, pagination.page])

  // Filter users by search query (client-side)
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      (user.phone && user.phone.toLowerCase().includes(q))
    )
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'pegawai',
      phone: '',
      isActive: true,
    })
  }

  // Open add dialog
  const handleOpenAdd = () => {
    resetForm()
    setAddDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEdit = (user: UserData) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      isActive: user.isActive,
    })
    setEditDialogOpen(true)
  }

  // Open delete dialog
  const handleOpenDelete = (user: UserData) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  // Add user
  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Nama, email, dan password wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || null,
          isActive: formData.isActive,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Pengguna "${formData.name}" berhasil ditambahkan`)
        setAddDialogOpen(false)
        resetForm()
        fetchUsers(1)
      } else {
        toast.error(json.error || 'Gagal menambahkan pengguna')
      }
    } catch (err) {
      console.error('Failed to add user:', err)
      toast.error('Gagal menambahkan pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  // Edit user
  const handleEditUser = async () => {
    if (!selectedUser) return
    if (!formData.name || !formData.email) {
      toast.error('Nama dan email wajib diisi')
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone || null,
        isActive: formData.isActive,
      }
      if (formData.password) {
        body.password = formData.password
      }
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Pengguna "${formData.name}" berhasil diperbarui`)
        setEditDialogOpen(false)
        setSelectedUser(null)
        resetForm()
        fetchUsers(pagination.page)
      } else {
        toast.error(json.error || 'Gagal memperbarui pengguna')
      }
    } catch (err) {
      console.error('Failed to update user:', err)
      toast.error('Gagal memperbarui pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Pengguna "${selectedUser.name}" berhasil dinonaktifkan`)
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers(pagination.page)
      } else {
        toast.error(json.error || 'Gagal menghapus pengguna')
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      toast.error('Gagal menghapus pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle active status
  const handleToggleActive = async (user: UserData) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: !user.isActive,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(
          `Pengguna "${user.name}" ${!user.isActive ? 'diaktifkan' : 'dinonaktifkan'}`
        )
        fetchUsers(pagination.page)
      } else {
        toast.error(json.error || 'Gagal mengubah status')
      }
    } catch (err) {
      console.error('Failed to toggle active:', err)
      toast.error('Gagal mengubah status pengguna')
    }
  }

  // Pagination controls
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setLoading(true)
      setPagination((prev) => ({ ...prev, page }))
    }
  }

  // Render pagination buttons
  const renderPagination = () => {
    const pages: (number | string)[] = []
    const { page, totalPages } = pagination

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 2) pages.push('...')
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i)
      }
      if (page < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return (
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          Menampilkan {users.length} dari {pagination.total} pengguna
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="h-8 w-8 p-0"
          >
            ‹
          </Button>
          {pages.map((p, i) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === pagination.page ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(p)}
                className="h-8 w-8 p-0"
                style={
                  p === pagination.page
                    ? { backgroundColor: COLORS.navy }
                    : {}
                }
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="h-8 w-8 p-0"
          >
            ›
          </Button>
        </div>
      </div>
    )
  }

  if (loading && users.length === 0) {
    return <UserManagerSkeleton />
  }

  return (
    <div className="space-y-0">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              style={{ color: COLORS.navy }}
            >
              Manajemen Pengguna
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Kelola akun dan hak akses pengguna sistem
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              style={{ borderColor: COLORS.navy, color: COLORS.navy }}
              onClick={() => {
                setLoading(true)
                fetchUsers(pagination.page)
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              className="gap-1.5 text-white"
              style={{ backgroundColor: COLORS.navy }}
              onClick={handleOpenAdd}
            >
              <UserPlus className="h-4 w-4" />
              Tambah Pengguna
            </Button>
          </div>
        </motion.div>
      </div>

      {/* ─── Filters ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="px-4 md:px-6 mt-3"
      >
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, atau telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="resepsionis">Resepsionis</SelectItem>
                  <SelectItem value="pegawai">Pegawai</SelectItem>
                  <SelectItem value="pimpinan">Pimpinan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Users Table ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="px-4 md:px-6 mt-4"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold" style={{ color: COLORS.navy }}>
                  Daftar Pengguna
                </CardTitle>
                <CardDescription>
                  {pagination.total} pengguna terdaftar
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Shield className="h-4 w-4" />
                <span>{roleFilter !== 'all' ? getRoleLabel(roleFilter) : 'Semua Role'}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className="max-h-[500px] overflow-y-auto"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${COLORS.navyLight} transparent`,
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold" style={{ color: COLORS.navy }}>
                      Nama
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold" style={{ color: COLORS.navy }}>
                      Email
                    </TableHead>
                    <TableHead className="font-semibold" style={{ color: COLORS.navy }}>
                      Role
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold" style={{ color: COLORS.navy }}>
                      Telepon
                    </TableHead>
                    <TableHead className="font-semibold" style={{ color: COLORS.navy }}>
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold" style={{ color: COLORS.navy }}>
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, idx) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.3, delay: 0.03 * idx }}
                          className="border-b transition-colors hover:bg-gray-50/80"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shrink-0"
                                style={{ backgroundColor: COLORS.navy }}
                              >
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-400 sm:hidden">{user.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRoleColor(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-sm text-gray-600">
                              {user.phone || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                user.isActive
                                  ? 'bg-green-100 text-green-800 border-green-300'
                                  : 'bg-gray-100 text-gray-500 border-gray-300'
                              }
                            >
                              {user.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-green-50"
                                onClick={() => handleToggleActive(user)}
                                title={user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {user.isActive ? (
                                  <PowerOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                onClick={() => handleOpenEdit(user)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-50"
                                onClick={() => handleOpenDelete(user)}
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                          <div className="flex flex-col items-center gap-3">
                            <Users className="h-10 w-10 text-gray-300" />
                            <span className="text-base">Tidak ada data pengguna</span>
                            <span className="text-sm">
                              Coba ubah filter atau tambahkan pengguna baru
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && renderPagination()}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Add User Dialog ───────────────────────────────────────── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.navy }}>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Isi data berikut untuk menambahkan pengguna baru ke sistem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="contoh@bkad.seruyan.go.id"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="resepsionis">Resepsionis</SelectItem>
                    <SelectItem value="pegawai">Pegawai</SelectItem>
                    <SelectItem value="pimpinan">Pimpinan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Telepon
                </Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Status Aktif
                </Label>
                <p className="text-xs text-gray-400">Aktifkan akun pengguna</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={submitting}
              className="gap-2 text-white"
              style={{ backgroundColor: COLORS.navy }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Tambah
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ──────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle style={{ color: COLORS.navy }}>Edit Pengguna</DialogTitle>
            <DialogDescription>
              Perbarui data pengguna {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Nama Lengkap <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="contoh@bkad.seruyan.go.id"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                Password Baru
              </Label>
              <Input
                type="password"
                placeholder="Kosongkan jika tidak ingin mengubah"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
              />
              <p className="text-xs text-gray-400">Biarkan kosong jika tidak ingin mengubah password</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="resepsionis">Resepsionis</SelectItem>
                    <SelectItem value="pegawai">Pegawai</SelectItem>
                    <SelectItem value="pimpinan">Pimpinan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Telepon
                </Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="border-gray-200 focus:border-[#0c2d57] focus:ring-[#0c2d57]/20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
              <div>
                <Label className="text-sm font-medium" style={{ color: COLORS.navy }}>
                  Status Aktif
                </Label>
                <p className="text-xs text-gray-400">Aktifkan atau nonaktifkan akun</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setSelectedUser(null)
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={submitting}
              className="gap-2 text-white"
              style={{ backgroundColor: COLORS.navy }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: COLORS.danger }}>
              Konfirmasi Hapus Pengguna
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengguna{' '}
              <strong>{selectedUser?.name}</strong>? Pengguna akan dinonaktifkan
              dan tidak dapat login ke sistem. Tindakan ini dapat dibatalkan
              dengan mengaktifkan kembali pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={submitting}
              className="gap-2 bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
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

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer
        className="mt-auto py-3 px-4 text-center text-xs text-white/70"
        style={{ backgroundColor: COLORS.navy }}
      >
        &copy; {new Date().getFullYear()} BKAD — E-Tamu Sistem Tamu Digital
      </footer>
    </div>
  )
}
