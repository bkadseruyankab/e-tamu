'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useSettings, AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ArrowRightLeft,
  BarChart3,
  Users,
  Bell,
  Monitor,
  ChevronRight,
  Building2,
  Clock,
  Zap,
  QrCode,
  ScanLine,
  UserPlus,
  CalendarCheck,
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const features = [
  {
    icon: BookOpen,
    title: 'Buku Tamu Digital',
    description: 'Pencatatan tamu secara digital yang terintegrasi dan terorganisir',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: ArrowRightLeft,
    title: 'Disposisi Cepat',
    description: 'Penerusan tamu ke bidang terkait dengan sistem disposisi otomatis',
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: BarChart3,
    title: 'Laporan Statistik',
    description: 'Analisis kunjungan real-time dengan grafik dan laporan lengkap',
    color: 'from-emerald-500/20 to-green-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Users,
    title: 'Manajemen Pegawai',
    description: 'Data bidang dan pegawai terintegrasi dalam satu platform',
    color: 'from-purple-500/20 to-violet-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: Bell,
    title: 'Notifikasi Real-time',
    description: 'Pemberitahuan otomatis untuk tamu baru dan disposisi masuk',
    color: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: UserPlus,
    title: 'Register Tamu',
    description: 'Layanan layar sentuh publik untuk pendaftaran mandiri tamu kunjungan',
    color: 'from-teal-500/20 to-cyan-500/20',
    iconColor: 'text-teal-400',
  },
]

const stats = [
  { value: '5+', label: 'Bidang', icon: Building2 },
  { value: '12+', label: 'Pegawai', icon: Users },
  { value: '24/7', label: 'Monitoring', icon: Clock },
  { value: '100%', label: 'Digital', icon: Zap },
]

export default function HomePage() {
  const { setCurrentPage, setIsKioskMode } = useAppStore()
  const { settings } = useSettings()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  // Fetch QR code
  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const res = await fetch('/api/qrcode')
        const data = await res.json()
        if (data.success && data.data?.qr_code_url) {
          setQrCodeUrl(data.data.qr_code_url)
        }
      } catch {
        // silently fail
      }
    }
    fetchQrCode()
  }, [])

  // Handle quick-register action from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action === 'quick-register') {
      setIsKioskMode(true)
    }
  }, [setIsKioskMode])

  const qrEnabled = settings.qr_code_enabled !== 'false'

  return (
    <div className="min-h-screen bg-[#0a1f3f] text-white overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full border border-[#c9a84c]/10" />
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full border border-[#c9a84c]/5" />
        <div className="absolute top-1/3 -left-60 w-[400px] h-[400px] rounded-full border border-white/5" />
        <div className="absolute bottom-20 right-10 w-[300px] h-[300px] rounded-full border border-[#c9a84c]/5" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0c2d57]/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#c9a84c]/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Navigation Bar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 border-b border-white/10 bg-[#0a1f3f]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <AppLogo size="md" variant="light" />
            <div className="flex items-center gap-3">
              {settings.contact_whatsapp && (
                <a
                  href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-2 text-white/60 hover:text-[#25D366] transition-colors text-sm"
                >
                  <i className="fa-brands fa-whatsapp text-base" />
                  <span className="hidden md:inline">WhatsApp</span>
                </a>
              )}
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="hidden sm:flex items-center gap-2 text-white/60 hover:text-[#c9a84c] transition-colors text-sm"
                >
                  <i className="fa-solid fa-envelope text-base" />
                  <span className="hidden md:inline">Email</span>
                </a>
              )}
              <Button
                className="bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-semibold hover:from-[#d4b55c] hover:to-[#b8974a] shadow-lg shadow-[#c9a84c]/25 h-10 px-6"
                onClick={() => setCurrentPage('login')}
              >
                <i className="fa-solid fa-right-to-bracket mr-2" />
                Login Admin
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={fadeInUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
                  <span className="text-[#c9a84c] text-sm font-medium">Sistem Pelayanan Tamu Digital</span>
                </div>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
              >
                <span className="text-white">E-Tamu</span>{' '}
                <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d08c] bg-clip-text text-transparent">BKAD</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-lg"
              >
                Sistem pelayanan tamu digital untuk{' '}
                <span className="text-[#c9a84c] font-semibold">
                  Badan Keuangan dan Aset Daerah Kabupaten Seruyan
                </span>
                . Modern, efisien, dan terintegrasi.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-bold text-lg hover:from-[#d4b55c] hover:to-[#b8974a] shadow-xl shadow-[#c9a84c]/30 h-16 px-10"
                  onClick={() => setIsKioskMode(true)}
                >
                  <UserPlus className="w-6 h-6 mr-3" />
                  Register Tamu
                </Button>
                <Button
                  size="lg"
                  className="bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 h-16 px-10"
                  onClick={() => setCurrentPage('appointments')}
                >
                  <CalendarCheck className="w-6 h-6 mr-3" />
                  Buat Janji Temu
                </Button>
              </motion.div>

              {/* Quick contact info */}
              <motion.div
                variants={fadeInUp}
                className="flex items-center gap-6 pt-4"
              >
                {settings.contact_email && (
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-[#c9a84c]" />
                    <span className="text-sm text-white/50">{settings.contact_email}</span>
                  </div>
                )}
                {settings.contact_whatsapp && (
                  <div className="flex items-center gap-2">
                    <i className="fa-brands fa-whatsapp text-[#25D366]" />
                    <span className="text-sm text-white/50">{settings.contact_whatsapp}</span>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Right: QR Code Card / Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 40 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Main QR Code Card */}
                <div className="relative bg-gradient-to-br from-[#0c2d57] to-[#0a1f3f] border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                  {/* Gold accent line */}
                  <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent" />

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <AppLogo size="md" variant="light" />
                    </div>

                    {qrEnabled ? (
                      <div className="flex flex-col items-center">
                        {/* QR Code Display */}
                        <div className="relative w-56 h-56 rounded-xl border-2 border-[#c9a84c]/30 bg-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                          {qrCodeUrl ? (
                            <img
                              src={qrCodeUrl}
                              alt="QR Code Pendaftaran Tamu"
                              className="w-full h-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-3 text-white/30">
                              <QrCode className="size-16" />
                              <span className="text-xs">QR Code belum digenerate</span>
                            </div>
                          )}
                          {/* Scan animation line */}
                          <motion.div
                            className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent"
                            animate={{ top: ['16px', 'calc(100% - 16px)', '16px'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        </div>

                        {/* QR Label */}
                        <div className="mt-4 text-center">
                          <p className="text-[#c9a84c] text-sm font-semibold flex items-center justify-center gap-1.5">
                            <ScanLine className="size-4" />
                            Pindai untuk Daftar Cepat
                          </p>
                          <p className="text-white/30 text-xs mt-1 max-w-[240px]">
                            Arahkan kamera HP ke QR Code untuk mendaftar sebagai tamu kunjungan
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Mock dashboard when QR disabled */
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Tamu Hari Ini', value: '12', change: '+3' },
                            { label: 'Menunggu', value: '4', change: '-1' },
                            { label: 'Dilayani', value: '6', change: '+2' },
                            { label: 'Selesai', value: '2', change: '+1' },
                          ].map((stat, i) => (
                            <motion.div
                              key={stat.label}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + i * 0.15 }}
                              className="bg-white/5 rounded-lg p-3 border border-white/5"
                            >
                              <p className="text-xs text-white/40">{stat.label}</p>
                              <div className="flex items-end gap-2 mt-1">
                                <span className="text-2xl font-bold text-white">{stat.value}</span>
                                <span className="text-xs text-emerald-400 mb-1">{stat.change}</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-white/40">Aktivitas Minggu Ini</p>
                          <div className="flex items-end gap-1 h-16">
                            {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
                              <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 1 + i * 0.1, duration: 0.5 }}
                                className="flex-1 rounded-sm bg-gradient-to-t from-[#c9a84c]/60 to-[#c9a84c]/20"
                              />
                            ))}
                          </div>
                          <div className="flex justify-between text-[10px] text-white/30">
                            <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 }}
                  className="absolute -left-6 top-1/4 bg-[#c9a84c] text-[#0a1f3f] rounded-lg px-3 py-2 shadow-xl text-xs font-bold"
                >
                  ✓ Digital
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 }}
                  className="absolute -right-4 bottom-1/4 bg-emerald-500 text-white rounded-lg px-3 py-2 shadow-xl text-xs font-bold"
                >
                  ● Live
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile QR Code - visible on small screens */}
            {qrEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="lg:hidden"
              >
                {showQr ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-52 h-52 rounded-xl border-2 border-[#c9a84c]/30 bg-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="QR Code Pendaftaran Tamu"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/30">
                          <QrCode className="size-14" />
                          <span className="text-xs">QR belum digenerate</span>
                        </div>
                      )}
                      <motion.div
                        className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent"
                        animate={{ top: ['12px', 'calc(100% - 12px)', '12px'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[#c9a84c] text-sm font-semibold flex items-center justify-center gap-1.5">
                        <ScanLine className="size-4" />
                        Pindai untuk Daftar Cepat
                      </p>
                      <p className="text-white/30 text-xs mt-1">
                        Arahkan kamera HP ke QR Code untuk mendaftar
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/40 hover:text-white"
                      onClick={() => setShowQr(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 border-[#c9a84c]/30 text-[#c9a84c] hover:bg-[#c9a84c]/10 hover:text-[#e8d08c] font-semibold text-base h-12 bg-transparent"
                    onClick={() => setShowQr(true)}
                  >
                    <QrCode className="size-5" />
                    Daftar Cepat via QR Code
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent via-[#0c2d57]/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] text-sm font-medium mb-4">
                Fitur Unggulan
              </span>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl sm:text-4xl font-extrabold text-white mb-4"
            >
              Solusi Digital{' '}
              <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d08c] bg-clip-text text-transparent">
                Lengkap
              </span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-white/50 max-w-2xl mx-auto text-lg"
            >
              Sistem terintegrasi untuk mengelola pelayanan tamu dengan efisien dan profesional
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm hover:bg-white/[0.06] hover:border-[#c9a84c]/30 transition-all duration-300 group cursor-default h-full">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#c9a84c] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <Card className="bg-white/[0.03] border-white/10 backdrop-blur-sm text-center group hover:border-[#c9a84c]/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#c9a84c]/20 transition-colors">
                      <stat.icon className="w-5 h-5 text-[#c9a84c]" />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#c9a84c] to-[#e8d08c] bg-clip-text text-transparent"
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-white/50 text-sm mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section with QR Code */}
      <section className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-gradient-to-br from-[#0c2d57] to-[#0a1f3f] border border-[#c9a84c]/20 rounded-2xl p-8 sm:p-12 text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#c9a84c]/30 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#c9a84c]/30 rounded-br-2xl" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/5 via-transparent to-[#c9a84c]/5" />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
                Kunjungan Langsung ke Kantor?
              </h2>
              <p className="text-white/50 max-w-xl mx-auto mb-8 text-lg">
                Pindai QR Code di bawah ini untuk pendaftaran cepat, atau buat janji temu untuk kunjungan terjadwal.
              </p>

              {/* QR Code in CTA */}
              {qrEnabled && qrCodeUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center mb-8"
                >
                  <div className="relative w-44 h-44 rounded-xl border-2 border-[#c9a84c]/30 bg-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center mb-3">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code Pendaftaran Cepat"
                      className="w-full h-full object-contain p-2"
                    />
                    <motion.div
                      className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent"
                      animate={{ top: ['10px', 'calc(100% - 10px)', '10px'] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  <p className="text-[#c9a84c] text-sm font-semibold flex items-center gap-1.5">
                    <ScanLine className="size-4" />
                    Scan QR - Daftar Cepat
                  </p>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-5 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-bold text-lg hover:from-[#d4b55c] hover:to-[#b8974a] shadow-xl shadow-[#c9a84c]/30 h-16 px-10"
                  onClick={() => setIsKioskMode(true)}
                >
                  <UserPlus className="w-6 h-6 mr-3" />
                  Register Tamu
                </Button>
                <Button
                  size="lg"
                  className="bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 h-16 px-10"
                  onClick={() => setCurrentPage('appointments')}
                >
                  <CalendarCheck className="w-6 h-6 mr-3" />
                  Buat Janji Temu
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer
        variants={fadeIn}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="relative z-10 border-t border-white/10 bg-[#0a1f3f]/80 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AppLogo size="sm" variant="light" showText={false} />
              <span className="text-white/60 text-sm font-medium">{settings.app_name || 'E-Tamu BKAD'}</span>
            </div>
            <div className="flex items-center gap-4">
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="text-white/30 hover:text-[#c9a84c] transition-colors"
                  title={settings.contact_email}
                >
                  <i className="fa-solid fa-envelope" />
                </a>
              )}
              {settings.contact_whatsapp && (
                <a
                  href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/30 hover:text-[#25D366] transition-colors"
                  title={settings.contact_whatsapp}
                >
                  <i className="fa-brands fa-whatsapp" />
                </a>
              )}
            </div>
            <p className="text-white/30 text-sm text-center">
              © 2026 BKAD Kabupaten Seruyan – Sistem Pelayanan Tamu Digital
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
