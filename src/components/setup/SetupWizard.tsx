'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  Settings,
  ListOrdered,
  Flag,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

// ── Step Definitions ──────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Selamat Datang', icon: Sparkles, description: 'Mulai konfigurasi' },
  { id: 2, title: 'Admin', icon: Shield, description: 'Akun administrator' },
  { id: 3, title: 'Organisasi', icon: Building2, description: 'Data organisasi' },
  { id: 4, title: 'Bidang', icon: ListOrdered, description: 'Departemen / bidang' },
  { id: 5, title: 'Selesai', icon: Flag, description: 'Konfirmasi & simpan' },
]

const DEFAULT_DEPARTMENTS = [
  'Sekretariat',
  'Bidang Pendapatan',
  'Bidang Belanja',
  'Bidang Keuangan',
  'Bidang Aset',
]

// ── Animation Variants ────────────────────────────────────
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

const particleFloat = {
  initial: { y: 0, opacity: 0 },
  animate: {
    y: [-20, 20, -20],
    opacity: [0, 0.6, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ── Helper ────────────────────────────────────────────────
function generateCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 5)
}

// ── Main Component ────────────────────────────────────────
export default function SetupWizard() {
  const { setCurrentUser, setIsAuthenticated, setIsSetupComplete, setCurrentPage } = useAppStore()

  // Step navigation
  const [currentStep, setCurrentStep] = React.useState(1)
  const [direction, setDirection] = React.useState(0)

  // Step 2: Admin
  const [adminName, setAdminName] = React.useState('')
  const [adminEmail, setAdminEmail] = React.useState('')
  const [adminPassword, setAdminPassword] = React.useState('')
  const [adminConfirmPassword, setAdminConfirmPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  // Step 3: Organization
  const [orgName, setOrgName] = React.useState('Badan Keuangan dan Aset Daerah Kabupaten Seruyan')
  const [orgAddress, setOrgAddress] = React.useState('')
  const [orgPhone, setOrgPhone] = React.useState('')
  const [orgEmail, setOrgEmail] = React.useState('')
  const [serviceStart, setServiceStart] = React.useState('08:00')
  const [serviceEnd, setServiceEnd] = React.useState('16:00')
  const [runningText, setRunningText] = React.useState(
    'Selamat datang di Badan Keuangan dan Aset Daerah Kabupaten Seruyan — Jam Pelayanan: 08:00 - 16:00 WIB — Pastikan membawa dokumen yang diperlukan'
  )

  // Step 4: Departments
  const [departments, setDepartments] = React.useState<
    { name: string; code: string }[]
  >(() =>
    DEFAULT_DEPARTMENTS.map((name) => ({
      name,
      code: generateCode(name),
    }))
  )
  const [newDeptName, setNewDeptName] = React.useState('')

  // Loading
  const [loading, setLoading] = React.useState(false)

  // ── Navigation ──────────────────────────────────────────
  const goNext = () => {
    // Validation per step
    if (currentStep === 2) {
      if (!adminName.trim()) {
        toast.error('Nama Lengkap wajib diisi')
        return
      }
      if (!adminEmail.trim()) {
        toast.error('Email wajib diisi')
        return
      }
      if (!adminPassword.trim()) {
        toast.error('Password wajib diisi')
        return
      }
      if (adminPassword.length < 6) {
        toast.error('Password minimal 6 karakter')
        return
      }
      if (adminPassword !== adminConfirmPassword) {
        toast.error('Konfirmasi password tidak cocok')
        return
      }
    }
    if (currentStep === 3) {
      if (!orgName.trim()) {
        toast.error('Nama Organisasi wajib diisi')
        return
      }
    }
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, 5))
  }

  const goPrev = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  // ── Department management ───────────────────────────────
  const addDepartment = () => {
    const name = newDeptName.trim()
    if (!name) {
      toast.error('Nama bidang wajib diisi')
      return
    }
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Bidang sudah ada')
      return
    }
    setDepartments((prev) => [...prev, { name, code: generateCode(name) }])
    setNewDeptName('')
  }

  const removeDepartment = (index: number) => {
    setDepartments((prev) => prev.filter((_, i) => i !== index))
  }

  // ── Submit setup ────────────────────────────────────────
  const handleFinish = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin: {
            name: adminName.trim(),
            email: adminEmail.trim(),
            password: adminPassword,
          },
          organization: {
            name: orgName.trim(),
            address: orgAddress.trim() || undefined,
            phone: orgPhone.trim() || undefined,
            email: orgEmail.trim() || undefined,
            serviceStart,
            serviceEnd,
            runningText: runningText.trim() || undefined,
          },
          departments,
        }),
      })

      // Safely parse JSON response — handle non-JSON responses gracefully
      let data: { success?: boolean; data?: { user?: { id: string; name: string; email: string; role: string } }; error?: string } = {}
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        // Non-JSON response (e.g., "Server action..." error from Next.js)
        const text = await res.text()
        console.error('Setup API returned non-JSON response:', text.substring(0, 200))
      }

      if (res.ok && data.success) {
        toast.success('Setup berhasil diselesaikan!')
        setIsSetupComplete(true)
        if (data.data?.user) {
          setCurrentUser(data.data.user)
          setIsAuthenticated(true)
        }
        setCurrentPage('dashboard')
      } else if (res.status === 400 && data.error?.includes('sudah pernah')) {
        // Setup was already completed before — still mark as complete and proceed
        toast.success('Setup sudah pernah dilakukan. Melanjutkan ke aplikasi...')
        setIsSetupComplete(true)
        setCurrentPage('login')
      } else {
        toast.error(data.error || 'Gagal menyelesaikan setup')
      }
    } catch (err) {
      console.error('Setup error:', err)
      // Even on network error, check if setup is already complete via GET
      try {
        const checkRes = await fetch('/api/setup')
        const checkContentType = checkRes.headers.get('content-type') || ''
        if (checkContentType.includes('application/json')) {
          const checkData = await checkRes.json()
          if (checkData.setupComplete) {
            toast.success('Setup sudah lengkap. Melanjutkan ke aplikasi...')
            setIsSetupComplete(true)
            setCurrentPage('login')
            return
          }
        }
      } catch {
        // Secondary check also failed
      }
      toast.error('Terjadi kesalahan jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#070e1b] via-[#0a1f3f] to-[#0c2d57] text-white overflow-hidden flex flex-col">
      {/* ── Animated Background ──────────────────────────── */}
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

      {/* ── Header ───────────────────────────────────────── */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex-shrink-0 bg-[#070e1b]/80 backdrop-blur-sm border-b border-[#c9a84c]/20 px-4 sm:px-6 py-3"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <AppLogo size="md" variant="light" />
        </div>
      </motion.header>

      {/* ── Step Indicator ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex-shrink-0 px-4 sm:px-6 pt-5 pb-2"
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2 px-2">
            {STEPS.map((step, idx) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              const StepIcon = step.icon
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <motion.div
                      animate={
                        isActive
                          ? {
                              boxShadow: [
                                '0 0 0px rgba(201,168,76,0)',
                                '0 0 20px rgba(201,168,76,0.3)',
                                '0 0 0px rgba(201,168,76,0)',
                              ],
                            }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className={cn(
                        'relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500',
                        isCompleted
                          ? 'bg-emerald-500/20 border border-emerald-500/40'
                          : isActive
                            ? 'bg-[#c9a84c]/20 border-2 border-[#c9a84c]/60'
                            : 'bg-white/5 border border-white/10'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      ) : (
                        <StepIcon
                          className={cn(
                            'w-4 h-4 sm:w-5 sm:h-5',
                            isActive ? 'text-[#c9a84c]' : 'text-white/30'
                          )}
                        />
                      )}
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-[#c9a84c]/30"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        'text-[9px] sm:text-[10px] font-medium text-center leading-tight',
                        isActive
                          ? 'text-[#c9a84c]'
                          : isCompleted
                            ? 'text-emerald-400'
                            : 'text-white/30'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-1 sm:mx-2 h-0.5 relative mt-[-16px]">
                      <div className="absolute inset-0 bg-white/10 rounded-full" />
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-[#c9a84c] rounded-full"
                        initial={{ width: '0%' }}
                        animate={{
                          width: isCompleted ? '100%' : isActive ? '50%' : '0%',
                        }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto py-4 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {/* ── Step 1: Welcome ─────────────────────────── */}
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
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 text-center space-y-6">
                  {/* Animated Logo */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 200,
                      damping: 15,
                      delay: 0.2,
                    }}
                    className="flex justify-center"
                  >
                    <motion.div
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(201,168,76,0.0)',
                          '0 0 40px rgba(201,168,76,0.2)',
                          '0 0 20px rgba(201,168,76,0.0)',
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center shadow-2xl shadow-[#c9a84c]/30"
                    >
                      <svg
                        className="w-10 h-10 text-[#0a1f3f]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </motion.div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                      Selamat Datang!
                    </h1>
                    <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
                      Ini adalah langkah pertama untuk mengkonfigurasi{' '}
                      <span className="text-[#c9a84c] font-semibold">E-Tamu BKAD</span> — Sistem
                      Tamu Digital untuk organisasi Anda.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-3"
                  >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20">
                      <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                      <span className="text-[#c9a84c] text-sm font-medium">
                        Setup hanya membutuhkan beberapa menit
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
                  >
                    {[
                      {
                        icon: Shield,
                        title: 'Akun Admin',
                        desc: 'Buat akun super admin',
                      },
                      {
                        icon: Building2,
                        title: 'Organisasi',
                        desc: 'Data organisasi & pelayanan',
                      },
                      {
                        icon: ListOrdered,
                        title: 'Bidang',
                        desc: 'Departemen / bidang awal',
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="bg-white/[0.04] rounded-xl p-4 border border-white/5 text-center"
                      >
                        <item.icon className="w-6 h-6 text-[#c9a84c] mx-auto mb-2" />
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <p className="text-[11px] text-white/40 mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <Button
                      onClick={goNext}
                      className="h-14 px-10 text-lg font-bold bg-gradient-to-r from-[#c9a84c] to-[#e0c878] hover:from-[#e0c878] hover:to-[#c9a84c] text-[#0a1f3f] shadow-xl shadow-[#c9a84c]/20 transition-all"
                    >
                      Mulai Setup
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Admin Account ────────────────────── */}
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
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Akun Administrator</h2>
                      <p className="text-xs text-white/40">Langkah 2 dari 5 — Buat akun super admin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Nama Lengkap */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Nama Lengkap <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Nama lengkap administrator"
                        className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Email <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@organisasi.go.id"
                        className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Password <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi Password */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Konfirmasi Password <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={adminConfirmPassword}
                          onChange={(e) => setAdminConfirmPassword(e.target.value)}
                          placeholder="Ulangi password"
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {adminConfirmPassword && adminPassword !== adminConfirmPassword && (
                        <p className="text-red-400 text-xs mt-1">Password tidak cocok</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Organization ─────────────────────── */}
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
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Data Organisasi</h2>
                      <p className="text-xs text-white/40">Langkah 3 dari 5 — Informasi organisasi</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Nama Organisasi */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Nama Organisasi <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Nama organisasi / instansi"
                        className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                      />
                    </div>

                    {/* Alamat */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Alamat
                      </Label>
                      <Textarea
                        value={orgAddress}
                        onChange={(e) => setOrgAddress(e.target.value)}
                        placeholder="Alamat lengkap organisasi (opsional)"
                        rows={2}
                        className="text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 min-h-[60px] transition-all"
                      />
                    </div>

                    {/* Telepon & Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#c9a84c]" />
                          Telepon
                        </Label>
                        <Input
                          value={orgPhone}
                          onChange={(e) => setOrgPhone(e.target.value)}
                          placeholder="05xx-xxxxxxx"
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#c9a84c]" />
                          Email Organisasi
                        </Label>
                        <Input
                          type="email"
                          value={orgEmail}
                          onChange={(e) => setOrgEmail(e.target.value)}
                          placeholder="info@organisasi.go.id"
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                        />
                      </div>
                    </div>

                    {/* Jam Pelayanan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#c9a84c]" />
                          Jam Pelayanan Mulai
                        </Label>
                        <Input
                          type="time"
                          value={serviceStart}
                          onChange={(e) => setServiceStart(e.target.value)}
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 [color-scheme:dark] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#c9a84c]" />
                          Jam Pelayanan Selesai
                        </Label>
                        <Input
                          type="time"
                          value={serviceEnd}
                          onChange={(e) => setServiceEnd(e.target.value)}
                          className="h-12 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 [color-scheme:dark] transition-all"
                        />
                      </div>
                    </div>

                    {/* Running Text */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white/70 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#c9a84c]" />
                        Teks Berjalan / Running Text
                      </Label>
                      <Textarea
                        value={runningText}
                        onChange={(e) => setRunningText(e.target.value)}
                        placeholder="Teks yang berjalan di bagian bawah layar"
                        rows={2}
                        className="text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 min-h-[60px] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 4: Departments ──────────────────────── */}
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
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                      <ListOrdered className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Bidang / Departemen</h2>
                      <p className="text-xs text-white/40">
                        Langkah 4 dari 5 — Tambah bidang awal
                      </p>
                    </div>
                  </div>

                  {/* Add new department */}
                  <div className="flex gap-2">
                    <Input
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addDepartment()
                        }
                      }}
                      placeholder="Nama bidang baru..."
                      className="h-11 text-base bg-white/[0.06] border-white/15 text-white placeholder:text-white/25 focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20 transition-all"
                    />
                    <Button
                      onClick={addDepartment}
                      className="h-11 px-4 bg-[#c9a84c]/20 border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/30 transition-all flex-shrink-0"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </div>

                  {/* Department list */}
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {departments.length === 0 && (
                      <div className="text-center py-8 text-white/30 text-sm">
                        Belum ada bidang. Tambahkan bidang baru di atas.
                      </div>
                    )}
                    {departments.map((dept, index) => (
                      <motion.div
                        key={`${dept.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-4 py-3 border border-white/5 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-4 h-4 text-[#c9a84c]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{dept.name}</p>
                          <p className="text-[10px] text-white/30">Kode: {dept.code}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDepartment(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-xs text-white/30 text-center">
                    {departments.length} bidang terdaftar • Anda dapat menambah atau menghapus nanti di Pengaturan
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 5: Confirmation ─────────────────────── */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-emerald-500/20 p-6 sm:p-8 space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Konfirmasi Setup</h2>
                      <p className="text-xs text-white/40">Langkah 5 dari 5 — Periksa & simpan</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Admin summary */}
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                      <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Akun Admin
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                        <div>
                          <span className="text-white/40">Nama:</span>{' '}
                          <span className="font-medium">{adminName}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Email:</span>{' '}
                          <span className="font-medium">{adminEmail}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Role:</span>{' '}
                          <span className="font-medium text-emerald-400">Super Admin</span>
                        </div>
                      </div>
                    </div>

                    {/* Organization summary */}
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                      <h3 className="text-xs font-semibold text-[#c9a84c] uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Organisasi
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                        <div className="sm:col-span-2">
                          <span className="text-white/40">Nama:</span>{' '}
                          <span className="font-medium">{orgName}</span>
                        </div>
                        {orgAddress && (
                          <div className="sm:col-span-2">
                            <span className="text-white/40">Alamat:</span>{' '}
                            <span className="font-medium">{orgAddress}</span>
                          </div>
                        )}
                        {orgPhone && (
                          <div>
                            <span className="text-white/40">Telepon:</span>{' '}
                            <span className="font-medium">{orgPhone}</span>
                          </div>
                        )}
                        {orgEmail && (
                          <div>
                            <span className="text-white/40">Email:</span>{' '}
                            <span className="font-medium">{orgEmail}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-white/40">Jam Pelayanan:</span>{' '}
                          <span className="font-medium">
                            {serviceStart} - {serviceEnd} WIB
                          </span>
                        </div>
                      </div>
                      {runningText && (
                        <div className="text-sm">
                          <span className="text-white/40">Running Text:</span>{' '}
                          <span className="font-medium text-white/70 text-xs">{runningText}</span>
                        </div>
                      )}
                    </div>

                    {/* Departments summary */}
                    <div className="bg-white/[0.04] rounded-xl p-4 border border-white/5 space-y-2">
                      <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <ListOrdered className="w-3.5 h-3.5" /> Bidang ({departments.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {departments.map((dept, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs"
                          >
                            <span className="text-[#c9a84c] font-mono text-[10px]">{dept.code}</span>
                            <span className="text-white/70">{dept.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      onClick={handleFinish}
                      disabled={loading}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-xl shadow-emerald-500/20 transition-all"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Menyimpan...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          Selesai & Masuk
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Navigation Buttons ──────────────────────────── */}
          {currentStep > 1 && currentStep < 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mt-6 gap-4"
            >
              <Button
                onClick={goPrev}
                variant="outline"
                className="h-11 px-6 border-white/15 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button
                onClick={goNext}
                className="h-11 px-6 bg-gradient-to-r from-[#c9a84c] to-[#e0c878] hover:from-[#e0c878] hover:to-[#c9a84c] text-[#0a1f3f] font-bold shadow-lg shadow-[#c9a84c]/20 transition-all"
              >
                Lanjutkan
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Back only on step 5 */}
          {currentStep === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center mt-6"
            >
              <Button
                onClick={goPrev}
                variant="outline"
                className="h-11 px-6 border-white/15 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/25 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative z-10 flex-shrink-0 bg-[#070e1b]/80 border-t border-[#c9a84c]/20 overflow-hidden py-3 px-4"
      >
        <div className="text-center">
          <p className="text-[10px] text-white/30">
            E-Tamu BKAD — Setup Wizard • Langkah {currentStep} dari 5
          </p>
        </div>
      </motion.div>
    </div>
  )
}
