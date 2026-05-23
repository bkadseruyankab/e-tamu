'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useSettings, AppLogo } from '@/components/shared/AppLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { setCurrentPage, setCurrentUser, setIsAuthenticated, setIsKioskMode } = useAppStore()
  const { settings } = useSettings()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Handle quick-register action from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action === 'quick-register') {
      setIsKioskMode(true)
    }
  }, [setIsKioskMode])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      // Safely parse JSON — handle non-JSON responses
      let result: { success?: boolean; data?: { id: string; name: string; email: string; role: string }; error?: string } = {}
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error('Login API returned non-JSON response:', text.substring(0, 200))
      }

      if (result.success && result.data) {
        setCurrentUser(result.data)
        setIsAuthenticated(true)
        setCurrentPage('dashboard')
        toast.success('Login berhasil!', {
          description: `Selamat datang, ${result.data.name}`,
        })
      } else {
        toast.error('Login gagal', {
          description: result.error || 'Email atau password salah',
        })
      }
    } catch {
      toast.error('Login gagal', {
        description: 'Terjadi kesalahan koneksi. Silakan coba lagi.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a1f3f] via-[#0c2d57] to-[#0a1f3f] text-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-[#c9a84c]/10" />
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full border border-[#c9a84c]/5" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full border border-white/5" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#c9a84c]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[200px] h-[200px] bg-[#0c2d57]/80 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(201,168,76,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 p-4 sm:p-6"
      >
        <Button
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/10"
          onClick={() => setCurrentPage('home')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Beranda
        </Button>
      </motion.div>

      {/* Center login card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/[0.04] border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Gold accent top bar */}
            <div className="h-1 bg-gradient-to-r from-[#c9a84c] via-[#e8d08c] to-[#c9a84c]" />

            <CardHeader className="text-center pb-2 pt-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col items-center gap-4"
              >
                <AppLogo size="lg" variant="light" showText={false} />
                <div>
                  <h1 className="text-2xl font-extrabold text-white">
                    {settings.app_name || 'E-Tamu'}{' '}
                    <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d08c] bg-clip-text text-transparent">
                      BKAD
                    </span>
                  </h1>
                  <p className="text-white/40 text-sm mt-1">{settings.app_title || 'Sistem Pelayanan Tamu Digital'}</p>
                </div>
              </motion.div>
            </CardHeader>

            <CardContent className="px-6 sm:px-8 pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="email" className="text-white/70 text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-envelope text-[#c9a84c] text-xs" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@bkad.seruyan.go.id"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20 h-11"
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
                  )}
                </motion.div>

                {/* Password field */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-white/70 text-sm font-medium flex items-center gap-2">
                    <i className="fa-solid fa-lock text-[#c9a84c] text-xs" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus-visible:border-[#c9a84c]/50 focus-visible:ring-[#c9a84c]/20 h-11 pr-10"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
                  )}
                </motion.div>

                {/* Remember me */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-white/20 data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c] data-[state=checked]:text-[#0a1f3f]"
                  />
                  <Label htmlFor="remember" className="text-white/50 text-sm cursor-pointer">
                    Ingat saya
                  </Label>
                </motion.div>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#c9a84c] to-[#a88a3a] text-[#0a1f3f] font-bold text-base hover:from-[#d4b55c] hover:to-[#b8974a] shadow-lg shadow-[#c9a84c]/25 h-11 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-right-to-bracket mr-2" />
                        Masuk
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Contact info */}
              {(settings.contact_email || settings.contact_whatsapp) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-5 flex items-center justify-center gap-4"
                >
                  {settings.contact_email && (
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="flex items-center gap-1.5 text-white/30 hover:text-[#c9a84c] transition-colors text-xs"
                    >
                      <i className="fa-solid fa-envelope" />
                      Email
                    </a>
                  )}
                  {settings.contact_whatsapp && (
                    <a
                      href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-white/30 hover:text-[#25D366] transition-colors text-xs"
                    >
                      <i className="fa-brands fa-whatsapp" />
                      WhatsApp
                    </a>
                  )}
                </motion.div>
              )}

              {/* Demo credentials hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 p-3 rounded-lg bg-[#c9a84c]/5 border border-[#c9a84c]/10"
              >
                <p className="text-[#c9a84c]/70 text-xs text-center">
                  <span className="font-semibold">Demo:</span> admin@bkad.seruyan.go.id / admin123
                </p>
              </motion.div>
            </CardContent>
          </Card>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-white/20 text-xs mt-6"
          >
            © 2026 BKAD Kabupaten Seruyan
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
