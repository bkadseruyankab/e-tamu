'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  UserPlus,
  ArrowRightLeft,
  Building2,
  Users,
  BarChart3,
  Shield,
  FileText,
  Settings,
  Monitor,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  CalendarCheck,
} from 'lucide-react'

import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { getRoleLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AppLogo } from '@/components/shared/AppLogo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

/** All roles in the system */
const ALL_ROLES = ['super_admin', 'admin', 'resepsionis', 'pegawai', 'pimpinan']

interface NavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
  group?: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Utama', roles: ALL_ROLES },
  { id: 'guests', label: 'Buku Tamu', icon: BookOpen, group: 'Tamu', roles: ['super_admin', 'admin', 'resepsionis'] },
  { id: 'guest-form', label: 'Tambah Tamu', icon: UserPlus, group: 'Tamu', roles: ['super_admin', 'admin', 'resepsionis'] },
  { id: 'appointments', label: 'Janji Temu', icon: CalendarCheck, group: 'Tamu', roles: ALL_ROLES },
  { id: 'dispositions', label: 'Disposisi', icon: ArrowRightLeft, group: 'Tamu', roles: ALL_ROLES },
  { id: 'departments', label: 'Bidang', icon: Building2, group: 'Master', roles: ['super_admin', 'admin'] },
  { id: 'employees', label: 'Pegawai', icon: Users, group: 'Master', roles: ['super_admin', 'admin'] },
  { id: 'reports', label: 'Laporan', icon: BarChart3, group: 'Lainnya', roles: ['super_admin', 'admin'] },
  { id: 'backup', label: 'Backup DB', icon: Database, group: 'Lainnya', roles: ['super_admin'] },
  { id: 'users', label: 'Pengguna', icon: Shield, group: 'Lainnya', roles: ['super_admin'] },
  { id: 'audit-log', label: 'Log Audit', icon: FileText, group: 'Lainnya', roles: ['super_admin'] },
  { id: 'settings', label: 'Pengaturan', icon: Settings, group: 'Lainnya', roles: ['super_admin', 'admin'] },
  { id: 'kiosk', label: 'Register Tamu', icon: Monitor, group: 'Lainnya', roles: ['super_admin', 'admin', 'resepsionis'] },
]

const groups = ['Utama', 'Tamu', 'Master', 'Lainnya']

function NavContent() {
  const { currentPage, setCurrentPage, setIsKioskMode, currentUser } = useAppStore()
  const { state } = useSidebar()

  const userRole = currentUser?.role

  // Filter nav items based on user role
  const filteredNavItems = React.useMemo(() => {
    if (!userRole) {
      // If no user or role, show dashboard only
      return navItems.filter((item) => item.id === 'dashboard')
    }
    return navItems.filter((item) => {
      if (!item.roles) return true // If no roles specified, visible to all
      return item.roles.includes(userRole)
    })
  }, [userRole])

  const handleNavigation = (pageId: PageId) => {
    if (pageId === 'kiosk') {
      setIsKioskMode(true)
    }
    setCurrentPage(pageId)
  }

  return (
    <SidebarContent className="px-2">
      {groups.map((group) => {
        const items = filteredNavItems.filter((item) => item.group === group)
        if (items.length === 0) return null
        return (
          <SidebarGroup key={group}>
            <SidebarGroupLabel
              className={cn(
                'text-gold/70 font-semibold uppercase tracking-wider text-[10px]',
                state === 'collapsed' && 'opacity-0'
              )}
            >
              {group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = currentPage === item.id
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        onClick={() => handleNavigation(item.id)}
                        className={cn(
                          'transition-all duration-200 rounded-lg',
                          isActive
                            ? 'bg-gold/20 text-gold font-semibold hover:bg-gold/25 hover:text-gold'
                            : 'text-sidebar-foreground/80 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2"
                        >
                          <item.icon
                            className={cn(
                              'size-4 shrink-0',
                              isActive ? 'text-gold' : 'text-sidebar-foreground/60'
                            )}
                          />
                          <span>{item.label}</span>
                        </motion.div>
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gold rounded-r-full"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )
      })}
    </SidebarContent>
  )
}

export function AppSidebar() {
  const { currentUser, setCurrentPage, setCurrentUser, setIsAuthenticated } = useAppStore()
  const { state, toggleSidebar } = useSidebar()

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'U'

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 shadow-[4px_0_16px_-4px_rgba(0,0,0,0.15)]"
      style={
        {
          '--sidebar-width': '16rem',
          '--sidebar-width-icon': '3.5rem',
        } as React.CSSProperties
      }
    >
      {/* Navy background overlay */}
      <div className="absolute inset-0 bg-navy z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-dark z-0" />

      <div className="relative z-10 flex h-full flex-col">
        {/* Header with AppLogo */}
        <SidebarHeader className="p-3">
          <AppLogo 
            size={state === 'expanded' ? 'md' : 'sm'} 
            variant="light" 
            showText={state === 'expanded'} 
          />
        </SidebarHeader>

        <Separator className="bg-white/10 mx-3 w-auto" />

        {/* Navigation */}
        <NavContent />

        <Separator className="bg-white/10 mx-3 w-auto" />

        {/* Footer */}
        <SidebarFooter className="p-3">
          {state === 'expanded' ? (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border-2 border-gold/40">
                <AvatarFallback className="bg-navy-light text-gold text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser?.name}
                </p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate">
                  {currentUser?.role ? getRoleLabel(currentUser.role) : ''}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-sidebar-foreground/50 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                onClick={() => {
                  setCurrentUser(null)
                  setIsAuthenticated(false)
                  setCurrentPage('home')
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="size-8 border-2 border-gold/40">
                <AvatarFallback className="bg-navy-light text-gold text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 text-sidebar-foreground/50 hover:text-white hover:bg-white/10 shrink-0',
              state === 'collapsed' ? 'mx-auto' : 'ml-auto'
            )}
            onClick={toggleSidebar}
          >
            {state === 'expanded' ? (
              <ChevronLeft className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </SidebarFooter>
      </div>

      <SidebarRail className="bg-white/5 hover:bg-white/10" />
    </Sidebar>
  )
}
