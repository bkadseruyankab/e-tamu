'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  User,
  Building2,
  Phone,
  Mail,
  FileText,
  Camera,
  Upload,
  PenTool,
  Send,
  ArrowLeft,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { SignatureCanvas } from '@/components/shared/SignatureCanvas'
import { useAppStore } from '@/lib/store'

// Zod schema
const guestFormSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  nik: z.string().optional().refine(
    (val) => !val || /^\d{16}$/.test(val),
    'NIK harus 16 digit angka'
  ),
  institution: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional().refine(
    (val) => !val || /^(\+62|62|0)[0-9]{8,13}$/.test(val),
    'Nomor HP tidak valid'
  ),
  email: z.string().optional().refine(
    (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Email tidak valid'
  ),
  visitPurpose: z.string().min(1, 'Tujuan kunjungan wajib dipilih'),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  need: z.string().optional(),
  photo: z.string().optional(),
  document: z.string().optional(),
  signature: z.string().optional(),
})

type GuestFormValues = z.infer<typeof guestFormSchema>

interface Department {
  id: string
  name: string
  code: string
}

interface Employee {
  id: string
  name: string
  position: string | null
  departmentId: string
  department: { id: string; name: string; code: string }
}

export function GuestForm() {
  const { setCurrentPage } = useAppStore()
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string>('')

  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: '',
      nik: '',
      institution: '',
      address: '',
      phone: '',
      email: '',
      visitPurpose: '',
      departmentId: '',
      employeeId: '',
      need: '',
      photo: '',
      document: '',
      signature: '',
    },
  })

  const watchDepartmentId = form.watch('departmentId')

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
        toast.error('Gagal memuat data bidang')
      }
    }
    fetchDepartments()
  }, [])

  // Fetch employees
  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch('/api/employees?limit=100')
        const data = await res.json()
        if (data.success) {
          setEmployees(data.data)
        }
      } catch {
        toast.error('Gagal memuat data pegawai')
      }
    }
    fetchEmployees()
  }, [])

  // Filter employees by department
  useEffect(() => {
    if (watchDepartmentId) {
      const filtered = employees.filter(
        (emp) => emp.departmentId === watchDepartmentId
      )
      setFilteredEmployees(filtered)
      // Reset employee selection if department changes
      form.setValue('employeeId', '')
    } else {
      setFilteredEmployees([])
      form.setValue('employeeId', '')
    }
  }, [watchDepartmentId, employees, form])

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB')
      return
    }

    // Show preview immediately from local file
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)

    // Upload to server
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'photo')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Gagal mengupload foto')
        setPhotoPreview(null)
        return
      }

      const data = await res.json()
      if (data.success && data.data) {
        form.setValue('photo', data.data.url)
        setPhotoPreview(data.data.url)
      } else {
        toast.error(data.error || 'Gagal mengupload foto')
        setPhotoPreview(null)
      }
    } catch {
      toast.error('Gagal mengupload foto')
      setPhotoPreview(null)
    } finally {
      setUploadingPhoto(false)
    }
  }, [form])

  const handleDocumentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setDocumentName(file.name + ' (mengupload...)')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'document')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        toast.error('Gagal mengupload dokumen')
        setDocumentName('')
        return
      }

      const data = await res.json()
      if (data.success && data.data) {
        form.setValue('document', data.data.url)
        setDocumentName(file.name)
      } else {
        toast.error(data.error || 'Gagal mengupload dokumen')
        setDocumentName('')
      }
    } catch {
      toast.error('Gagal mengupload dokumen')
      setDocumentName('')
    }
  }, [form])

  const onSubmit = async (values: GuestFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Pendaftaran tamu berhasil!')
        form.reset()
        setPhotoPreview(null)
        setDocumentName('')
      } else {
        toast.error(data.error || 'Gagal mendaftarkan tamu')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mendaftarkan tamu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setPhotoPreview(null)
    setDocumentName('')
    form.reset()
  }

  const visitPurposes = [
    { value: 'Konsultasi', label: 'Konsultasi' },
    { value: 'Penyampaian Dokumen', label: 'Penyampaian Dokumen' },
    { value: 'Koordinasi', label: 'Koordinasi' },
    { value: 'Lainnya', label: 'Lainnya' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentPage('guests')}
          className="text-[#1e3a5f] hover:bg-[#1e3a5f]/10"
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Pendaftaran Tamu</h1>
          <p className="text-muted-foreground text-sm">Isi formulir untuk mendaftarkan tamu baru</p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Section: Data Pribadi */}
            <Card className="border-[#1e3a5f]/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1e3a5f] text-white">
                    <User className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[#1e3a5f] text-lg">Data Pribadi</CardTitle>
                    <CardDescription>Informasi pribadi tamu</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nama Lengkap */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama lengkap"
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* NIK/KTP */}
                  <FormField
                    control={form.control}
                    name="nik"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">NIK/KTP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="16 digit NIK"
                            maxLength={16}
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Instansi/Perusahaan */}
                  <FormField
                    control={form.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <Building2 className="size-4 inline mr-1" />
                          Instansi/Perusahaan
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nama instansi/perusahaan"
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Alamat */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">Alamat</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Alamat lengkap"
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Nomor HP */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <Phone className="size-4 inline mr-1" />
                          Nomor HP
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="08xxxxxxxxxx"
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <Mail className="size-4 inline mr-1" />
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@contoh.com"
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section: Tujuan Kunjungan */}
            <Card className="border-[#1e3a5f]/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1e3a5f] text-white">
                    <FileText className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[#1e3a5f] text-lg">Tujuan Kunjungan</CardTitle>
                    <CardDescription>Informasi tujuan dan bidang tujuan</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tujuan Kunjungan */}
                  <FormField
                    control={form.control}
                    name="visitPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          Tujuan Kunjungan <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                              <SelectValue placeholder="Pilih tujuan kunjungan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {visitPurposes.map((purpose) => (
                              <SelectItem key={purpose.value} value={purpose.value}>
                                {purpose.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Bidang Tujuan */}
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">Bidang Tujuan</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                              <SelectValue placeholder="Pilih bidang tujuan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pegawai Tujuan */}
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">Pegawai Tujuan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchDepartmentId}
                        >
                          <FormControl>
                            <SelectTrigger className="border-[#1e3a5f]/30 focus:border-[#1e3a5f] w-full">
                              <SelectValue
                                placeholder={
                                  watchDepartmentId
                                    ? 'Pilih pegawai tujuan'
                                    : 'Pilih bidang terlebih dahulu'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredEmployees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name}
                                {emp.position ? ` - ${emp.position}` : ''}
                              </SelectItem>
                            ))}
                            {filteredEmployees.length === 0 && watchDepartmentId && (
                              <SelectItem value="_none" disabled>
                                Tidak ada pegawai di bidang ini
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Keperluan */}
                  <FormField
                    control={form.control}
                    name="need"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-[#1e3a5f] font-medium">Keperluan</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Jelaskan keperluan kunjungan Anda secara detail"
                            rows={3}
                            className="border-[#1e3a5f]/30 focus:border-[#1e3a5f]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section: Dokumen & Tanda Tangan */}
            <Card className="border-[#1e3a5f]/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1e3a5f] text-white">
                    <PenTool className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-[#1e3a5f] text-lg">Dokumen & Tanda Tangan</CardTitle>
                    <CardDescription>Foto, dokumen pendukung, dan tanda tangan digital</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Foto/Selfie */}
                  <FormField
                    control={form.control}
                    name="photo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <Camera className="size-4 inline mr-1" />
                          Foto/Selfie
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {photoPreview ? (
                              <div className="relative w-full max-w-[200px] mx-auto">
                                <img
                                  src={photoPreview}
                                  alt="Preview foto"
                                  className="w-full h-40 object-cover rounded-lg border-2 border-[#1e3a5f]/30"
                                />
                                {uploadingPhoto && (
                                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-lg">
                                    <div className="size-6 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0"
                                  onClick={() => {
                                    setPhotoPreview(null)
                                    field.onChange('')
                                  }}
                                  disabled={uploadingPhoto}
                                >
                                  &times;
                                </Button>
                              </div>
                            ) : (
                              <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#1e3a5f]/30 rounded-lg cursor-pointer hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                                {uploadingPhoto ? (
                                  <>
                                    <div className="size-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin mb-2" />
                                    <span className="text-sm text-muted-foreground">
                                      Mengupload...
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Camera className="size-8 text-[#1e3a5f]/50 mb-2" />
                                    <span className="text-sm text-muted-foreground">
                                      Klik untuk upload foto
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                      Maks. 5MB
                                    </span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                  disabled={uploadingPhoto}
                                />
                              </label>
                            )}
                            <input type="hidden" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dokumen Pendukung */}
                  <FormField
                    control={form.control}
                    name="document"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <Upload className="size-4 inline mr-1" />
                          Dokumen Pendukung
                        </FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            {documentName ? (
                              <div className="flex items-center gap-2 p-3 bg-[#1e3a5f]/5 rounded-lg border border-[#1e3a5f]/20">
                                <FileText className="size-5 text-[#1e3a5f]" />
                                <span className="text-sm text-[#1e3a5f] font-medium flex-1 truncate">
                                  {documentName}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-red-500"
                                  onClick={() => {
                                    setDocumentName('')
                                    field.onChange('')
                                  }}
                                >
                                  &times;
                                </Button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#1e3a5f]/30 rounded-lg cursor-pointer hover:border-[#1e3a5f] hover:bg-[#1e3a5f]/5 transition-colors">
                                <Upload className="size-8 text-[#1e3a5f]/50 mb-2" />
                                <span className="text-sm text-muted-foreground">
                                  Klik untuk upload dokumen
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                  PDF, DOC, JPG, PNG
                                </span>
                                <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={handleDocumentUpload}
                                />
                              </label>
                            )}
                            <input type="hidden" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tanda Tangan Digital */}
                  <FormField
                    control={form.control}
                    name="signature"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-[#1e3a5f] font-medium">
                          <PenTool className="size-4 inline mr-1" />
                          Tanda Tangan Digital
                        </FormLabel>
                        <FormControl>
                          <SignatureCanvas onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentPage('guests')}
                className="border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#1e3a5f] hover:bg-[#16325a] text-white min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Daftar Tamu
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </motion.div>
    </div>
  )
}
