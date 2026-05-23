'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CalendarCheck,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Users,
  FileText,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Clock,
  MapPin,
  Briefcase,
  Hash,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { useSettings, AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const STEPS = [
  { id: 1, title: 'Data Pengunjung', icon: User, description: 'Informasi diri Anda' },
  { id: 2, title: 'Data Instansi', icon: Building2, description: 'Asal instansi/lembaga' },
  { id: 3, title: 'Detail Kunjungan', icon: Calendar, description: 'Waktu & tujuan' },
  { id: 4, title: 'Konfirmasi', icon: CheckCircle2, description: 'Periksa & kirim' },
]

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
}

const glowPulse = {
  initial: { boxShadow: '0 0 20px rgba(201,168,76,0.0)' },
  animate: {
    boxShadow: [
      '0 0 20px rgba(201,168,76,0.0)',
      '0 0 30px rgba(201,168,76,0.15)',
      '0 0 20px rgba(201,168,76,0.0)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
}

const particleFloat = {
  initial: { y: 0, opacity: 0 },
  animate: {
    y: [-20, 20, -20],
    opacity: [0, 0.6, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

export default function PublicAppointmentForm() {
  const { setCurrentPage } = useAppStore()
  const { settings } = useSettings()

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

  const [departments, setDepartments] = React.useState<Department[]>([])
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(1)
  const [direction, setDirection] = React.useState(0)
  const [runningText, setRunningText] = React.useState(
    settings.running_text || 'Selamat datang di Badan Keuangan dan Aset Daerah Kabupaten Seruyan — Jam Pelayanan: 08:00 - 16:00 WIB — Formulir Janji Temu untuk kunjungan dari pihak luar'
  )

  // Real-time clock
  const [clock, setClock] = React.useState(new Date())
  React.useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Update running text
  React.useEffect(() => {
    if (settings.running_text) {
      setRunningText(settings.running_text)
    }
  }, [settings.running_text])

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

  const goNext = () => {
    if (currentStep === 1 && !form.visitorName.trim()) {
      toast.error('Nama pengunjung wajib diisi')
      return
    }
    if (currentStep === 2 && !form.institution.trim()) {
      toast.error('Nama instansi wajib diisi')
      return
    }
    if (currentStep === 3 && !form.visitPurpose.trim()) {
      toast.error('Tujuan kunjungan wajib diisi')
      return
    }
    if (currentStep === 3 && !form.visitDate) {
      toast.error('Tanggal kunjungan wajib diisi')
      return
    }
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, 4))
  }

  const goPrev = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setSubmitted(true)
        toast.success('Janji temu berhasil dibuat!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal membuat janji temu')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
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
    setSubmitted(false)
    setCurrentStep(1)
    setDirection(0)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
    } catch {
      return dateStr
    }
  }

  const formatClock = (d: Date) => {
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const formatClockDate = (d: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  }

  const selectedDept = departments.find(d => d.id === form.departmentId)
  const selectedEmp = employees.find(e => e.id === form.employeeId)

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#070e1b] via-[#0a1f3f] to-[#0c2d57] text-white overflow-hidden flex flex-col">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#c9a84c]/5 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/3 right-1/4 w-[250px] h-[250px] bg-emerald-500/5 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-2/3 left-1/2 w-[200px] h-[200px] bg-cyan-500/5 rounded-full blur-[70px]"
        />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            variants={particleFloat}
            initial="initial"
            animate="animate"
            transition={{ delay: i * 0.8, duration: 3 + i }}
            className="absolute w-1 h-1 bg-[#c9a84c]/40 rounded-full"
            style={{
              top: `${15 + i * 15}%`,
              left: `${10 + i * 14}%`,
            }}
          />
        ))}
        {/* Decorative rings */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-[#c9a84c]/8" />
        <div className="absolute -top-10 -right-10 w-[300px] h-[300px] rounded-full border border-[#c9a84c]/5" />
        <div className="absolute bottom-10 -left-20 w-[350px] h-[350px] rounded-full border border-white/3" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex-shrink-0 bg-[#070e1b]/80 backdrop-blur-sm border-b border-[#c9a84c]/20 px-4 sm:px-6 py-3"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentPage('home')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Kembali</span>
            </Button>
          </div>
          <AppLogo size="md" variant="light" />
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-[#c9a84c] tabular-nums font-mono">
              {formatClock(clock)}
            </div>
            <div className="text-[10px] text-white/40">{formatClockDate(clock)}</div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 flex-1 overflow-y-auto py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="form-wrapper"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-2"
                >
                  <motion.div
                    variants={glowPulse}
                    initial="initial"
                    animate="animate"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm font-semibold tracking-wide">Janji Temu Kunjungan</span>
                  </motion.div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                    Formulir Janji Temu
                  </h1>
                  <p className="text-white/40 text-sm">
                    Untuk kunjungan dari pihak luar / instansi luar daerah
                  </p>
                </motion.div>

                {/* Step Indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    {STEPS.map((step, idx) => {
                      const isActive = currentStep === step.id
                      const isCompleted = currentStep > step.id
                      const StepIcon = step.icon
                      return (
                        <React.Fragment key={step.id}>
                          <div className="flex flex-col items-center gap-1.5">
                            <motion.div
                              animate={isActive ? {
                                boxShadow: [
                                  '0 0 0px rgba(201,168,76,0)',
                                  '0 0 20px rgba(201,168,76,0.3)',
                                  '0 0 0px rgba(201,168,76,0)',
                                ],
                              } : {}}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              className={`
                                relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500
                                ${isCompleted
                                  ? 'bg-emerald-500/20 border border-emerald-500/40'
                                  : isActive
                                    ? 'bg-[#c9a84c]/20 border-2 border-[#c9a84c]/60'
                                    : 'bg-white/5 border border-white/10'
                                }
                              `}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : (
                                <StepIcon className={`w-5 h-5 ${isActive ? 'text-[#c9a84c]' : 'text-white/30'}`} />
                              )}
                              {/* Pulse ring for active step */}
                              {isActive && (
                                <motion.div
                                  className="absolute inset-0 rounded-xl border-2 border-[#c9a84c]/30"
                                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                />
                              )}
                            </motion.div>
                            <span className={`text-[10px] font-medium ${isActive ? 'text-[#c9a84c]' : isCompleted ? 'text-emerald-400' : 'text-white/30'}`}>
                              {step.title}
                            </span>
                          </div>
                          {idx < STEPS.length - 1 && (
                            <div className="flex-1 mx-2 h-0.5 relative mt-[-20px]">
                              <div className="absolute inset-0 bg-white/10 rounded-full" />
                              <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-[#c9a84c] rounded-full"
                                initial={{ width: '0%' }}
                                animate={{ width: isCompleted ? '100%' : isActive ? '50%' : '0%' }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Step Content */}
                <div className="relative overflow-hidden" style={{ minHeight: '340px' }}>
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    {/* Step 1: Data Pengunjung */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#c9a84c]" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-white">Data Pengunjung</h2>
                              <p className="text-xs text-white/40">Langkah 1 dari 4 — Informasi diri Anda</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#c9a84c]" />
                                Nama Pengunjung <span className="text-red-400">*</span>
                              </label>
                              <Input
                                value={form.visitorName}
                                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                                placeholder="Nama lengkap pengunjung"
                                className="h-13 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Hash className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  NIP
                                </label>
                                <Input
                                  value={form.visitorNip}
                                  onChange={(e) => setForm({ ...form, visitorNip: e.target.value })}
                                  placeholder="NIP (opsional)"
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Briefcase className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Jabatan
                                </label>
                                <Input
                                  value={form.visitorPosition}
                                  onChange={(e) => setForm({ ...form, visitorPosition: e.target.value })}
                                  placeholder="Jabatan / Posisi"
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Data Instansi */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-[#c9a84c]" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-white">Data Instansi</h2>
                              <p className="text-xs text-white/40">Langkah 2 dari 4 — Asal instansi/lembaga</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#c9a84c]" />
                                Nama Instansi <span className="text-red-400">*</span>
                              </label>
                              <Input
                                value={form.institution}
                                onChange={(e) => setForm({ ...form, institution: e.target.value })}
                                placeholder="Nama instansi / lembaga / dinas"
                                className="h-13 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#c9a84c]" />
                                Alamat Instansi
                              </label>
                              <Input
                                value={form.institutionAddr}
                                onChange={(e) => setForm({ ...form, institutionAddr: e.target.value })}
                                placeholder="Alamat lengkap instansi"
                                className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Nomor HP
                                </label>
                                <Input
                                  value={form.phone}
                                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                  placeholder="08xxxxxxxxxx"
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Email
                                </label>
                                <Input
                                  type="email"
                                  value={form.email}
                                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                                  placeholder="email@instansi.go.id"
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Detail Kunjungan */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-[#c9a84c]" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-white">Detail Kunjungan</h2>
                              <p className="text-xs text-white/40">Langkah 3 dari 4 — Waktu & tujuan</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Tanggal <span className="text-red-400">*</span>
                                </label>
                                <Input
                                  type="date"
                                  value={form.visitDate}
                                  onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 [color-scheme:dark] transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Waktu
                                </label>
                                <Input
                                  type="time"
                                  value={form.visitTime}
                                  onChange={(e) => setForm({ ...form, visitTime: e.target.value })}
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 [color-scheme:dark] transition-all"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[#c9a84c]" />
                                Tujuan Kunjungan <span className="text-red-400">*</span>
                              </label>
                              <Textarea
                                value={form.visitPurpose}
                                onChange={(e) => setForm({ ...form, visitPurpose: e.target.value })}
                                placeholder="Jelaskan tujuan kunjungan / agenda pertemuan"
                                rows={3}
                                className="text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 min-h-[80px] transition-all"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Jumlah Orang
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={form.numberOfPeople}
                                  onChange={(e) => setForm({ ...form, numberOfPeople: parseInt(e.target.value) || 1 })}
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Bidang Tujuan
                                </label>
                                <Select value={form.departmentId} onValueChange={(val) => setForm({ ...form, departmentId: val, employeeId: '' })}>
                                  <SelectTrigger className="h-12 text-base bg-white/[0.06] border-white/15 text-white focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all">
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
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Pegawai yang Dituju
                                </label>
                                <Select value={form.employeeId} onValueChange={(val) => setForm({ ...form, employeeId: val })}>
                                  <SelectTrigger className="h-12 text-base bg-white/[0.06] border-white/15 text-white focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all">
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
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[#c9a84c]" />
                                  Catatan
                                </label>
                                <Input
                                  value={form.notes}
                                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                  placeholder="Catatan tambahan (opsional)"
                                  className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Konfirmasi */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 space-y-5">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <h2 className="text-lg font-bold text-white">Konfirmasi Data</h2>
                              <p className="text-xs text-white/40">Langkah 4 dari 4 — Periksa & kirim</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Pengunjung summary */}
                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                              <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Data Pengunjung
                              </h3>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div><span className="text-white/40">Nama:</span> <span className="font-medium">{form.visitorName}</span></div>
                                {form.visitorNip && <div><span className="text-white/40">NIP:</span> <span className="font-medium">{form.visitorNip}</span></div>}
                                {form.visitorPosition && <div><span className="text-white/40">Jabatan:</span> <span className="font-medium">{form.visitorPosition}</span></div>}
                              </div>
                            </div>

                            {/* Instansi summary */}
                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                              <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" /> Data Instansi
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div><span className="text-white/40">Instansi:</span> <span className="font-medium">{form.institution}</span></div>
                                {form.institutionAddr && <div><span className="text-white/40">Alamat:</span> <span className="font-medium">{form.institutionAddr}</span></div>}
                                {form.phone && <div><span className="text-white/40">HP:</span> <span className="font-medium">{form.phone}</span></div>}
                                {form.email && <div><span className="text-white/40">Email:</span> <span className="font-medium">{form.email}</span></div>}
                              </div>
                            </div>

                            {/* Kunjungan summary */}
                            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Detail Kunjungan
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div><span className="text-white/40">Tanggal:</span> <span className="font-medium">{form.visitDate ? formatDate(form.visitDate) : '-'}</span></div>
                                {form.visitTime && <div><span className="text-white/40">Waktu:</span> <span className="font-medium">{form.visitTime} WIB</span></div>}
                                <div><span className="text-white/40">Jumlah:</span> <span className="font-medium">{form.numberOfPeople} orang</span></div>
                                {selectedDept && <div><span className="text-white/40">Bidang:</span> <span className="font-medium">{selectedDept.name}</span></div>}
                                {selectedEmp && <div><span className="text-white/40">Pegawai:</span> <span className="font-medium">{selectedEmp.name}</span></div>}
                              </div>
                              <div className="text-sm"><span className="text-white/40">Tujuan:</span> <span className="font-medium">{form.visitPurpose}</span></div>
                              {form.notes && <div className="text-sm"><span className="text-white/40">Catatan:</span> <span className="font-medium">{form.notes}</span></div>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between gap-4"
                >
                  {currentStep > 1 ? (
                    <Button
                      variant="outline"
                      onClick={goPrev}
                      className="h-12 px-6 border-white/15 text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Kembali
                    </Button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <Button
                      onClick={goNext}
                      className="h-12 px-8 bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-bold hover:from-[#d4b55c] hover:to-[#b8974a] shadow-lg shadow-[#c9a84c]/20 transition-all"
                    >
                      Selanjutnya
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold shadow-lg shadow-emerald-600/20 transition-all"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Mengirim...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Kirim Janji Temu
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            ) : (
              /* Success screen */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="text-center space-y-8">
                  {/* Animated success ring */}
                  <div className="relative inline-block">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                    >
                      <div className="relative">
                        <CheckCircle2 className="w-24 h-24 text-emerald-400 mx-auto" />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                      Janji Temu Berhasil Dibuat!
                    </h2>
                    <p className="text-white/60 text-lg">
                      Terima kasih, {form.visitorName}
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      Janji temu Anda akan dikonfirmasi oleh pihak BKAD.
                    </p>
                    {form.visitDate && (
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20"
                      >
                        <Calendar className="w-4 h-4 text-[#c9a84c]" />
                        <span className="text-[#c9a84c] font-semibold">{formatDate(form.visitDate)}</span>
                        {form.visitTime && (
                          <>
                            <span className="text-white/20">|</span>
                            <Clock className="w-4 h-4 text-[#c9a84c]" />
                            <span className="text-[#c9a84c] font-semibold">{form.visitTime} WIB</span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                  >
                    <Button
                      onClick={handleReset}
                      className="h-14 px-8 text-base bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] hover:from-[#d4b55c] hover:to-[#b8974a] text-[#0a1f3f] font-bold shadow-lg shadow-[#c9a84c]/20"
                    >
                      <CalendarCheck className="w-5 h-5 mr-2" />
                      Buat Janji Temu Lagi
                    </Button>
                    <Button
                      onClick={() => setCurrentPage('home')}
                      variant="outline"
                      className="h-14 px-8 text-base border-white/15 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/30"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Kembali ke Beranda
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
        className="relative z-10 flex-shrink-0 bg-[#070e1b]/80 border-t border-[#c9a84c]/20 overflow-hidden"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-[#c9a84c]/10 px-4 py-2.5 border-r border-[#c9a84c]/20">
            <span className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1.5">
              <i className="fa-solid fa-circle-info text-xs" />
              Info
            </span>
          </div>
          <div className="flex-1 overflow-hidden py-2.5">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-sm text-white/60 mx-8">{runningText}</span>
              <span className="text-sm text-white/60 mx-8">{runningText}</span>
              <span className="text-sm text-white/60 mx-8">{runningText}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
