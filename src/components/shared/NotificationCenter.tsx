'use client'

import * as React from 'react'
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

interface NotificationCenterProps {
  unreadCount: number
  onUnreadCountChange: (count: number) => void
}

export function NotificationCenter({ unreadCount, onUnreadCountChange }: NotificationCenterProps) {
  const { currentUser } = useAppStore()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=30')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data || [])
        onUnreadCountChange(data.unreadCount ?? 0)
      }
    } catch {
      // silently fail
    }
  }, [onUnreadCountChange])

  React.useEffect(() => {
    if (open) {
      setLoading(true)
      fetchNotifications().finally(() => setLoading(false))
    }
  }, [open, fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        onUnreadCountChange(Math.max(0, unreadCount - 1))
      }
    } catch {
      // silently fail
    }
  }

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: currentUser?.id }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        onUnreadCountChange(0)
        toast.success('Semua notifikasi ditandai sudah dibaca')
      }
    } catch {
      // silently fail
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'error': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'warning': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      default: return 'ℹ️'
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: idLocale })
    } catch {
      return dateStr
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-[#0c2d57]" />
            <h3 className="font-semibold text-sm text-[#0c2d57]">Notifikasi</h3>
            {unreadCount > 0 && (
              <Badge className="bg-[#c9a84c] text-[#0c2d57] border-0 text-[10px] px-1.5">
                {unreadCount} baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[#c9a84c] hover:text-[#b8963f] hover:bg-[#c9a84c]/10 gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="size-3" />
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-[#0c2d57] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Bell className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className={cn(
                      'px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b last:border-b-0',
                      !notif.isRead && 'bg-[#0c2d57]/5'
                    )}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif.id)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5 flex-shrink-0">
                        {getTypeIcon(notif.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-sm truncate',
                            !notif.isRead ? 'font-semibold text-[#0c2d57]' : 'font-medium text-muted-foreground'
                          )}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="size-2 rounded-full bg-[#c9a84c] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/30 text-center">
            <p className="text-[10px] text-muted-foreground">
              {notifications.length} notifikasi
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
