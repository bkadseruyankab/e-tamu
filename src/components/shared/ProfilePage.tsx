'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  Shield,
  BookOpen,
  ArrowRightLeft,
  Loader2,
  Camera,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { getRoleLabel, getRoleColor } from '@/lib/utils'

export default function ProfilePage() {
  const { currentUser } = useAppStore()

  // Profile form state
  const [name, setName] = React.useState(currentUser?.name || '')
  const [email, setEmail] = React.useState(currentUser?.email || '')
  const [phone, setPhone] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  // Password form state
  const [oldPassword, setOldPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [changingPassword, setChangingPassword] = React.useState(false)

  // Activity summary state
  const [activitySummary, setActivitySummary] = React.useState({
    guestsHandled: 0,
    dispositionsProcessed: 0,
  })

  // Fetch activity summary
  React.useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [guestsRes, dispositionsRes] = await Promise.all([
          fetch('/api/guests?limit=1'),
          fetch('/api/dispositions?limit=1'),
        ])
        if (guestsRes.ok) {
          const guestsData = await guestsRes.json()
          setActivitySummary((prev) => ({
            ...prev,
            guestsHandled: guestsData.pagination?.total || 0,
          }))
        }
        if (dispositionsRes.ok) {
          const dispositionsData = await dispositionsRes.json()
          setActivitySummary((prev) => ({
            ...prev,
            dispositionsProcessed: dispositionsData.pagination?.total || 0,
          }))
        }
      } catch {
        // Use defaults
      }
    }
    fetchActivity()
  }, [])

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Nama tidak boleh kosong')
      return
    }
    if (!email.trim()) {
      toast.error('Email tidak boleh kosong')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      })

      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal memperbarui profil')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPassword) {
      toast.error('Password lama wajib diisi')
      return
    }
    if (!newPassword) {
      toast.error('Password baru wajib diisi')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }

    setChangingPassword(true)
    try {
      const res = await fetch(`/api/users/${currentUser?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      })

      if (res.ok) {
        toast.success('Password berhasil diubah')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal mengubah password')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setChangingPassword(false)
    }
  }

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-l-4 border-l-gold overflow-hidden">
          <div className="bg-gradient-to-r from-navy via-navy-light to-navy p-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="size-20 border-4 border-gold/30 shadow-xl">
                  <AvatarFallback className="bg-gold/20 text-gold text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 flex items-center justify-center size-7 rounded-full bg-gold text-navy-dark shadow-md hover:bg-gold-light transition-colors">
                  <Camera className="size-3.5" />
                </button>
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">{currentUser?.name || 'Pengguna'}</h1>
                <p className="text-white/60 text-sm mt-0.5">{currentUser?.email}</p>
                <div className="mt-2">
                  <Badge
                    className={getRoleColor(currentUser?.role || '')}
                  >
                    <Shield className="size-3 mr-1" />
                    {getRoleLabel(currentUser?.role || '')}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Profile edit */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy dark:text-gold">
                  <User className="size-5" />
                  Informasi Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      Nama Lengkap
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="focus:border-gold focus:ring-gold/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      className="focus:border-gold focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-muted-foreground" />
                    Nomor HP
                  </Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="focus:border-gold focus:ring-gold/30 max-w-sm"
                  />
                </div>

                <Separator className="my-2" />

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-navy hover:bg-navy-light text-white min-w-[140px]"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Save className="size-4 mr-2" />
                    )}
                    {saving ? 'Menyimpan...' : 'Simpan Profil'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy dark:text-gold">
                  <Lock className="size-5" />
                  Ubah Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Lama</Label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama"
                    className="focus:border-gold focus:ring-gold/30 max-w-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div className="space-y-2">
                    <Label>Password Baru</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="focus:border-gold focus:ring-gold/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Konfirmasi Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="focus:border-gold focus:ring-gold/30"
                    />
                  </div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-red-500">
                    Konfirmasi password tidak cocok
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" />
                    Password cocok
                  </p>
                )}

                <Separator className="my-2" />

                <div className="flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-navy hover:bg-navy-light text-white min-w-[160px]"
                  >
                    {changingPassword ? (
                      <Loader2 className="size-4 animate-spin mr-2" />
                    ) : (
                      <Lock className="size-4 mr-2" />
                    )}
                    {changingPassword ? 'Mengubah...' : 'Ubah Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right column - Activity Summary */}
        <div className="space-y-6">
          {/* Activity Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-navy dark:text-gold">
                  Ringkasan Aktivitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-navy/5 dark:bg-navy-light/10">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-navy/10 dark:bg-navy-light/20">
                    <BookOpen className="size-5 text-navy dark:text-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-navy dark:text-gold tabular-nums">
                      {activitySummary.guestsHandled}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tamu Ditangani
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 dark:bg-gold/10">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-gold/10 dark:bg-gold/20">
                    <ArrowRightLeft className="size-5 text-gold-dark dark:text-gold" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gold-dark dark:text-gold tabular-nums">
                      {activitySummary.dispositionsProcessed}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Disposisi Diproses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-navy dark:text-gold">
                  Informasi Akun
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <Badge className={getRoleColor(currentUser?.role || '')}>
                    {getRoleLabel(currentUser?.role || '')}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium truncate ml-2">
                    {currentUser?.email || '-'}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Aktif
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-gold/10 flex-shrink-0 mt-0.5">
                    <Shield className="size-4 text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-navy dark:text-gold">
                      Tips Keamanan
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ubah password Anda secara berkala untuk menjaga keamanan
                      akun. Gunakan kombinasi huruf, angka, dan simbol.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
