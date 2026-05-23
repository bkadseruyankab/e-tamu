'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  Loader2,
  X,
  UserCircle,
  Hash,
  FileText,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'

interface Department {
  id: string
  name: string
  code: string
  headName: string | null
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    employees: number
    guests: number
  }
}

export function DepartmentManager() {
  // Data
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // UI
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formCode, setFormCode] = useState('')
  const [formHeadName, setFormHeadName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/departments?includeInactive=true')
      const data = await res.json()
      if (data.success) {
        setDepartments(data.data)
      }
    } catch {
      toast.error('Gagal memuat data bidang')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  // Filter departments
  useEffect(() => {
    let result = departments
    if (!showInactive) {
      result = result.filter(d => d.isActive)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.headName && d.headName.toLowerCase().includes(q))
      )
    }
    setFilteredDepartments(result)
  }, [departments, search, showInactive])

  // Reset form
  const resetForm = () => {
    setFormName('')
    setFormCode('')
    setFormHeadName('')
    setFormDescription('')
    setFormIsActive(true)
  }

  // Open create dialog
  const openCreate = () => {
    resetForm()
    setCreateOpen(true)
  }

  // Open edit dialog
  const openEdit = (dept: Department) => {
    setSelectedDept(dept)
    setFormName(dept.name)
    setFormCode(dept.code)
    setFormHeadName(dept.headName || '')
    setFormDescription(dept.description || '')
    setFormIsActive(dept.isActive)
    setEditOpen(true)
  }

  // Open delete dialog
  const openDelete = (dept: Department) => {
    setSelectedDept(dept)
    setDeleteOpen(true)
  }

  // Create department
  const handleCreate = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Nama dan kode bidang wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          headName: formHeadName.trim() || null,
          description: formDescription.trim() || null,
          isActive: formIsActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bidang berhasil ditambahkan')
        setCreateOpen(false)
        resetForm()
        fetchDepartments()
      } else {
        toast.error(data.error || 'Gagal menambahkan bidang')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Update department
  const handleUpdate = async () => {
    if (!selectedDept || !formName.trim() || !formCode.trim()) {
      toast.error('Nama dan kode bidang wajib diisi')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/departments/${selectedDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          code: formCode.trim().toUpperCase(),
          headName: formHeadName.trim() || null,
          description: formDescription.trim() || null,
          isActive: formIsActive,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bidang berhasil diperbarui')
        setEditOpen(false)
        fetchDepartments()
      } else {
        toast.error(data.error || 'Gagal memperbarui bidang')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  // Delete department
  const handleDelete = async () => {
    if (!selectedDept) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/departments/${selectedDept.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Bidang berhasil dihapus')
        setDeleteOpen(false)
        fetchDepartments()
      } else {
        toast.error(data.error || 'Gagal menghapus bidang')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setDeleting(false)
    }
  }

  // Toggle active/inactive
  const handleToggleActive = async (dept: Department) => {
    setTogglingId(dept.id)
    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !dept.isActive }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(dept.isActive ? 'Bidang dinonaktifkan' : 'Bidang diaktifkan')
        fetchDepartments()
      } else {
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <Building2 className="size-6 text-[#C5A55A]" />
            Kelola Bidang
          </h1>
          <p className="text-muted-foreground text-sm">
            Kelola data bidang/bagian ({departments.length} bidang)
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-[#1e3a5f] hover:bg-[#16325a] text-white"
        >
          <Plus className="size-4 mr-2" />
          Tambah Bidang
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, kode, atau kepala bidang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearch('')}
            >
              <X className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border rounded-lg border-[#1e3a5f]/20 bg-white">
          <Label htmlFor="show-inactive" className="text-sm text-[#1e3a5f] cursor-pointer whitespace-nowrap">
            Tampilkan Nonaktif
          </Label>
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
        </div>
      </div>

      {/* Active filter badges */}
      {search && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter aktif:</span>
          <Badge variant="secondary" className="text-xs gap-1">
            Cari: {search}
            <X className="size-3 cursor-pointer" onClick={() => setSearch('')} />
          </Badge>
        </div>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-[#1e3a5f]/20">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <Card className="border-[#1e3a5f]/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-2">
              <FileText className="size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground font-medium">Tidak ada bidang ditemukan</p>
              <p className="text-muted-foreground text-sm">
                {search ? 'Coba ubah kata kunci pencarian' : 'Tambah bidang baru dengan klik tombol "Tambah Bidang"'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDepartments.map((dept, index) => (
              <motion.div
                key={dept.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card
                  className={`border-[#1e3a5f]/20 hover:shadow-lg transition-shadow group relative overflow-hidden ${
                    !dept.isActive ? 'opacity-60' : ''
                  }`}
                >
                  {/* Gold accent top */}
                  <div className="h-1.5 bg-gradient-to-r from-[#C5A55A] to-[#d4b86a]" />

                  <CardContent className="p-5 space-y-4">
                    {/* Name & Code */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="size-5 text-[#1e3a5f] shrink-0" />
                          <h3 className="font-bold text-[#1e3a5f] truncate">{dept.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 ml-7">
                          <Hash className="size-3 text-[#C5A55A]" />
                          <span className="text-sm font-mono text-[#C5A55A] font-semibold">{dept.code}</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs border-0 shrink-0 ${
                          dept.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {dept.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>

                    {/* Head Name */}
                    {dept.headName && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserCircle className="size-4 text-[#1e3a5f] shrink-0" />
                        <span className="text-muted-foreground">Kepala:</span>
                        <span className="font-medium text-[#1e3a5f] truncate">{dept.headName}</span>
                      </div>
                    )}

                    {/* Description */}
                    {dept.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 ml-7">
                        {dept.description}
                      </p>
                    )}

                    {/* Counts */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="size-4 text-[#1e3a5f]" />
                        <span className="text-muted-foreground">Pegawai:</span>
                        <span className="font-semibold text-[#1e3a5f]">{dept._count?.employees ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Building2 className="size-4 text-[#C5A55A]" />
                        <span className="text-muted-foreground">Tamu:</span>
                        <span className="font-semibold text-[#1e3a5f]">{dept._count?.guests ?? 0}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1e3a5f]/10">
                      <button
                        onClick={() => handleToggleActive(dept)}
                        disabled={togglingId === dept.id}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#1e3a5f] transition-colors"
                      >
                        {togglingId === dept.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : dept.isActive ? (
                          <ToggleRight className="size-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="size-5 text-gray-400" />
                        )}
                        <span className="text-xs">{dept.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#C5A55A] hover:bg-[#C5A55A]/10"
                          onClick={() => openEdit(dept)}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => openDelete(dept)}
                          title="Hapus"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Plus className="size-5" />
              Tambah Bidang Baru
            </DialogTitle>
            <DialogDescription>Tambahkan bidang/bagian baru ke dalam sistem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Nama Bidang *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama bidang"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Kode *</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="KODE"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] uppercase"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Kepala Bidang</Label>
              <Input
                value={formHeadName}
                onChange={(e) => setFormHeadName(e.target.value)}
                placeholder="Nama kepala bidang"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Deskripsi</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi bidang (opsional)"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="create-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="create-active" className="text-sm font-medium text-[#1e3a5f] cursor-pointer">
                Status Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm() }}>
              Batal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={saving || !formName.trim() || !formCode.trim()}
              className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Tambah Bidang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1e3a5f] flex items-center gap-2">
              <Pencil className="size-5" />
              Edit Bidang
            </DialogTitle>
            <DialogDescription>
              Perbarui informasi bidang <strong>{selectedDept?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Nama Bidang *</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama bidang"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#1e3a5f]">Kode *</Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="KODE"
                  className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] uppercase"
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Kepala Bidang</Label>
              <Input
                value={formHeadName}
                onChange={(e) => setFormHeadName(e.target.value)}
                placeholder="Nama kepala bidang"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1e3a5f]">Deskripsi</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi bidang (opsional)"
                className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-active"
                checked={formIsActive}
                onCheckedChange={setFormIsActive}
              />
              <Label htmlFor="edit-active" className="text-sm font-medium text-[#1e3a5f] cursor-pointer">
                Status Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={saving || !formName.trim() || !formCode.trim()}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Hapus Bidang</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus bidang <strong>{selectedDept?.name}</strong> ({selectedDept?.code})?
              Tindakan ini tidak dapat dibatalkan. Bidang yang memiliki pegawai atau tamu terkait tidak dapat dihapus.
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
