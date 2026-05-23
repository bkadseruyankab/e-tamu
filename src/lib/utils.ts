import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function getDayName(date: Date | string): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  return days[new Date(date).getDay()]
}

export function generateQueueNumber(existingCount: number): number {
  return existingCount + 1
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    menunggu: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    check_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    dilayani: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    selesai: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    ditolak: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    diproses: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    menunggu: 'Menunggu',
    check_in: 'Check-In',
    dilayani: 'Dilayani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
    diproses: 'Diproses',
  }
  return labels[status] || status
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    resepsionis: 'Resepsionis',
    pegawai: 'Pegawai',
    pimpinan: 'Pimpinan',
  }
  return labels[role] || role
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    super_admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    resepsionis: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pegawai: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    pimpinan: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Baru saja'
  if (diffMins < 60) return `${diffMins} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays < 7) return `${diffDays} hari lalu`
  return d.toLocaleDateString('id-ID')
}
