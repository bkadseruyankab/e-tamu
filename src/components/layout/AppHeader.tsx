'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Search,
  Moon,
  Sun,
  Menu,
  User,
  LogOut,
  Clock,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CheckCheck,
  BellRing,
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { useAppStore, type PageId } from '@/lib/store'
import { getDayName, formatDate, formatTime, formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  link: string | null
  isRead: boolean
  createdAt: string
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="size-4 text-green-500 shrink-0" />
    case 'warning':
      return <AlertTriangle className="size-4 text-yellow-500 shrink-0" />
    case 'error':
      return <XCircle className="size-4 text-red-500 shrink-0" />
    default:
      return <Info className="size-4 text-blue-500 shrink-0" />
  }
}

function getNotificationDotColor(type: string) {
  switch (type) {
    case 'success':
      return 'bg-green-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-blue-500'
  }
}

export function AppHeader() {
  const { currentUser, setCurrentPage, setCurrentUser, setIsAuthenticated } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date())
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Real-time clock
  React.useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // Silently fail
    }
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark single notification as read
  const markAsRead = React.useCallback(
    async (notification: Notification) => {
      if (!notification.isRead) {
        try {
          await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: notification.id }),
          })
        } catch {
          // Silently fail
        }
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)))

      // Navigate if link exists
      if (notification.link) {
        setCurrentPage(notification.link as PageId)
        setNotifOpen(false)
      }
    },
    [setCurrentPage]
  )

  // Mark all as read
  const markAllAsRead = React.useCallback(async () => {
    if (!currentUser?.id) return
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // Silently fail
    }
  }, [currentUser])

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

  const dayName = getDayName(currentTime)
  const dateStr = formatDate(currentTime)
  const timeStr = formatTime(currentTime)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-md px-4">
      {/* Mobile menu toggle */}
      <SidebarTrigger className="md:hidden">
        <Menu className="size-5" />
      </SidebarTrigger>

      {/* Sidebar trigger for desktop too */}
      <SidebarTrigger className="hidden md:flex" />

      {/* Date and Time */}
      <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground mr-2">
        <Clock className="size-4 text-gold" />
        <AnimatePresence mode="wait">
          <motion.span
            key={timeStr}
            initial={{ opacity: 0.5, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2 }}
            className="font-mono font-medium text-foreground tabular-nums"
          >
            {mounted ? timeStr : '--:--:--'}
          </motion.span>
        </AnimatePresence>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">
          {dayName}, {mounted ? dateStr : '...'}
        </span>
      </div>

      {/* Mobile time only */}
      <div className="sm:hidden flex items-center gap-1 text-sm font-mono font-medium text-foreground tabular-nums">
        <Clock className="size-3.5 text-gold" />
        {mounted ? timeStr : '--:--:--'}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-2.5 size-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari tamu, pegawai..."
          className="pl-9 h-8 bg-muted/50 border-0 focus-visible:ring-1 text-sm"
        />
      </div>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
      >
        <AnimatePresence mode="wait">
          {mounted && theme === 'dark' ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="size-4" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="size-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Notification dropdown */}
      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground relative"
            aria-label="Notifikasi"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <Badge
                className={cn(
                  'absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[9px] font-bold',
                  'bg-gold text-navy border-0'
                )}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[380px] p-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Notifikasi</span>
              {unreadCount > 0 && (
                <Badge
                  className={cn(
                    'h-5 px-1.5 text-[10px] font-bold',
                    'bg-navy text-gold border-0'
                  )}
                >
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  markAllAsRead()
                }}
              >
                <CheckCheck className="size-3.5" />
                Tandai semua dibaca
              </Button>
            )}
          </div>

          {/* Notification list */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-muted-foreground">
              <BellRing className="size-8 mb-2 opacity-40" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="flex flex-col">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 text-left w-full transition-colors',
                      'hover:bg-muted/50',
                      !notification.isRead && 'bg-blue-50/50 dark:bg-blue-950/10'
                    )}
                    onClick={() => markAsRead(notification)}
                  >
                    {/* Unread dot indicator */}
                    <div className="flex items-center gap-3 pt-0.5">
                      {!notification.isRead ? (
                        <span
                          className={cn(
                            'size-2 rounded-full shrink-0',
                            getNotificationDotColor(notification.type)
                          )}
                        />
                      ) : (
                        <span className="size-2 shrink-0" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-tight',
                          !notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Link indicator */}
                    {notification.link && (
                      <span className="shrink-0 mt-0.5">
                        <span className="inline-flex size-1.5 rounded-full bg-gold" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Footer */}
          <div className="border-t">
            <DropdownMenuItem
              className="justify-center py-2.5 text-xs font-medium text-navy dark:text-gold cursor-pointer"
              onSelect={() => setNotifOpen(false)}
            >
              Lihat semua notifikasi
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-8 px-2 hover:bg-muted/50"
          >
            <Avatar className="size-7 border border-gold/30">
              <AvatarFallback className="bg-navy text-gold text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden lg:inline text-sm font-medium max-w-[120px] truncate">
              {currentUser?.name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground">
                {currentUser?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setCurrentPage('profile')}
              className="cursor-pointer"
            >
              <User className="size-4 mr-2" />
              Profil Saya
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            onClick={() => {
              setCurrentUser(null)
              setIsAuthenticated(false)
              setCurrentPage('home')
            }}
          >
            <LogOut className="size-4 mr-2" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
