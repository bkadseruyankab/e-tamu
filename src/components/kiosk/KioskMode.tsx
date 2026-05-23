'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Printer,
  X,
  Building2,
  Phone,
  User,
  FileText,
  CheckCircle2,
  Loader2,
  UserPlus,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useAppStore } from '@/lib/store'
import { useSettings, AppLogo } from '@/components/shared/AppLogo'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  code: string
}

const VISIT_PURPOSES = [
  { value: 'Konsultasi', label: 'Konsultasi', icon: '💬' },
  { value: 'Penyampaian Dokumen', label: 'Penyampaian Dokumen', icon: '📄' },
  { value: 'Koordinasi', label: 'Koordinasi', icon: '🤝' },
  { value: 'Lainnya', label: 'Lainnya', icon: '📋' },
]

export default function KioskMode() {
  const { setIsKioskMode, setCurrentPage } = useAppStore()
  const { settings } = useSettings()

  // Form state
  const [name, setName] = React.useState('')
  const [institution, setInstitution] = React.useState('')
  const [phone, setPhone] = React.useState('')
  const [visitPurpose, setVisitPurpose] = React.useState('')
  const [departmentId, setDepartmentId] = React.useState('')
  const [need, setNeed] = React.useState('')

  // UI state
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [runningText, setRunningText] = React.useState(
    settings.running_text || 'Selamat datang di Badan Keuangan dan Aset Daerah Kabupaten Seruyan — Jam Pelayanan: 08:00 - 16:00 WIB — Pastikan membawa dokumen yang diperlukan'
  )

  // Fetch departments on mount
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

  // Update running text when settings change
  React.useEffect(() => {
    if (settings.running_text) {
      setRunningText(settings.running_text)
    }
  }, [settings.running_text])

  // Real-time clock
  const [clock, setClock] = React.useState(new Date())
  React.useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nama Lengkap wajib diisi')
      return
    }
    if (!visitPurpose) {
      toast.error('Tujuan Kunjungan wajib dipilih')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          institution: institution.trim() || undefined,
          phone: phone.trim() || undefined,
          visitPurpose,
          departmentId: departmentId || undefined,
          need: need.trim() || undefined,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success('Pendaftaran berhasil!')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mendaftar')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setName('')
    setInstitution('')
    setPhone('')
    setVisitPurpose('')
    setDepartmentId('')
    setNeed('')
    setSubmitted(false)
  }

  const handleExitKiosk = () => {
    setIsKioskMode(false)
    setCurrentPage('home')
  }

  const formatDate = (d: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const formatTimeStr = (d: Date) => {
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white overflow-hidden flex flex-col">
      {/* Exit & Back buttons */}
      <div className="absolute top-3 right-3 z-50 no-print flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-white/30 hover:text-white/70 hover:bg-white/10 h-8 px-3"
          onClick={handleExitKiosk}
        >
          <ArrowLeft className="size-4 mr-1" />
          <span className="text-xs">Kembali</span>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/30 hover:text-white/70 hover:bg-white/10 h-8 w-8 p-0"
            >
              <X className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Keluar Register Tamu?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan keluar dari halaman pendaftaran tamu dan kembali ke halaman utama
                aplikasi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleExitKiosk}>
                Ya, Keluar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-shrink-0 bg-navy-dark/80 backdrop-blur-sm border-b border-gold/20 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AppLogo size="lg" variant="light" />
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-gold tabular-nums font-mono">
              {formatTimeStr(clock)}
            </div>
            <div className="text-xs text-white/50">{formatDate(clock)}</div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Left: Form */}
                <div className="lg:col-span-2 space-y-5">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 space-y-5"
                  >
                    <h2 className="text-xl font-semibold text-gold flex items-center gap-2">
                      <User className="size-5" />
                      Data Tamu
                    </h2>

                    {/* Nama Lengkap */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                        <User className="size-4 text-gold" />
                        Nama Lengkap <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                        className="h-14 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30"
                      />
                    </div>

                    {/* Instansi & Phone row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                          <Building2 className="size-4 text-gold" />
                          Instansi/Perusahaan
                        </label>
                        <Input
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Nama instansi"
                          className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                          <Phone className="size-4 text-gold" />
                          Nomor HP
                        </label>
                        <Input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="h-12 text-base bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30"
                        />
                      </div>
                    </div>

                    {/* Tujuan Kunjungan */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/80">
                        Tujuan Kunjungan <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {VISIT_PURPOSES.map((purpose) => (
                          <motion.button
                            key={purpose.value}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setVisitPurpose(purpose.value)}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all min-h-[80px] justify-center',
                              visitPurpose === purpose.value
                                ? 'border-gold bg-gold/20 text-gold shadow-lg shadow-gold/10'
                                : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                            )}
                          >
                            <span className="text-2xl">{purpose.icon}</span>
                            <span className="text-xs font-medium leading-tight text-center">
                              {purpose.label}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Bidang Tujuan */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                        <Building2 className="size-4 text-gold" />
                        Bidang Tujuan
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {departments.map((dept) => (
                          <motion.button
                            key={dept.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setDepartmentId(dept.id)}
                            className={cn(
                              'px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium min-h-[48px] flex items-center justify-center text-center',
                              departmentId === dept.id
                                ? 'border-gold bg-gold/20 text-gold shadow-lg shadow-gold/10'
                                : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
                            )}
                          >
                            {dept.name}
                          </motion.button>
                        ))}
                        {departments.length === 0 && (
                          <div className="col-span-full text-center text-white/40 py-4 text-sm">
                            Memuat data bidang...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Keperluan */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 flex items-center gap-1.5">
                        <FileText className="size-4 text-gold" />
                        Keperluan
                      </label>
                      <Textarea
                        value={need}
                        onChange={(e) => setNeed(e.target.value)}
                        placeholder="Jelaskan keperluan Anda (opsional)"
                        rows={3}
                        className="text-base bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-gold focus:ring-gold/30 min-h-[80px]"
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full h-16 text-lg font-bold bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy-dark shadow-xl shadow-gold/20 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="size-5 animate-spin" />
                            Mendaftar...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="size-5" />
                            Daftar Sekarang
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Right: Info Card */}
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5"
                  >
                    <h4 className="font-semibold text-gold mb-3 flex items-center gap-2">
                      <FileText className="size-4" />
                      Informasi Pelayanan
                    </h4>
                    <ul className="space-y-2 text-sm text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">•</span>
                        Jam Pelayanan: 08:00 - 16:00 WIB
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">•</span>
                        Harap menunggu untuk dilayani
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold mt-0.5">•</span>
                        Siapkan dokumen yang diperlukan
                      </li>
                    </ul>
                  </motion.div>

                  {/* Contact Info */}
                  {(settings.contact_email || settings.contact_whatsapp) && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5"
                    >
                      <h4 className="font-semibold text-gold mb-3 flex items-center gap-2">
                        <i className="fa-solid fa-address-book" />
                        Hubungi Kami
                      </h4>
                      <div className="space-y-3">
                        {settings.contact_email && (
                          <a
                            href={`mailto:${settings.contact_email}`}
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-[#c9a84c] transition-colors"
                          >
                            <div className="flex items-center justify-center size-8 rounded-lg bg-[#0c2d57]">
                              <i className="fa-solid fa-envelope text-[#c9a84c]" />
                            </div>
                            <span>{settings.contact_email}</span>
                          </a>
                        )}
                        {settings.contact_whatsapp && (
                          <a
                            href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-sm text-white/60 hover:text-[#25D366] transition-colors"
                          >
                            <div className="flex items-center justify-center size-8 rounded-lg bg-[#25D366]/20">
                              <i className="fa-brands fa-whatsapp text-[#25D366]" />
                            </div>
                            <span>{settings.contact_whatsapp}</span>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Success display */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="text-center space-y-8">
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 12,
                      delay: 0.2,
                    }}
                  >
                    <CheckCircle2 className="size-20 text-green-400 mx-auto" />
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Pendaftaran Berhasil!
                    </h2>
                    <p className="text-white/60 text-lg">
                      Selamat datang, {name}
                    </p>
                  </motion.div>

                  {/* Action buttons */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  >
                    <Button
                      onClick={() =>
                        toast.info('Fitur cetak akan segera hadir')
                      }
                      className="h-14 px-8 text-base bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-navy-dark font-bold shadow-lg shadow-gold/20"
                    >
                      <Printer className="size-5 mr-2" />
                      Cetak Kartu Tamu
                    </Button>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="h-14 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-gold"
                    >
                      <UserPlus className="size-5 mr-2" />
                      Daftar Tamu Lagi
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Running text footer */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="flex-shrink-0 bg-navy-dark/80 border-t border-gold/20 overflow-hidden"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-gold/20 px-4 py-2.5 border-r border-gold/20">
            <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-xs" />
              Info
            </span>
          </div>
          <div className="flex-1 overflow-hidden py-2.5">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-sm text-white/70 mx-8">{runningText}</span>
              <span className="text-sm text-white/70 mx-8">{runningText}</span>
              <span className="text-sm text-white/70 mx-8">{runningText}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
