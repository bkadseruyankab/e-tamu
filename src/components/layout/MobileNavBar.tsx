'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  BookOpen,
  ArrowRightLeft,
  CalendarCheck,
  User,
  Menu,
  MoreHorizontal,
} from 'lucide-react'

import { useAppStore, type PageId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

/** All roles */
const ALL_ROLES = ['super_admin', 'admin', 'resepsionis', 'pegawai', 'pimpinan']

interface MobileNavItem {
  id: PageId
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
  /** Additional page IDs that should highlight this tab as active */
  activeFor?: PageId[]
}

/** Primary nav items for mobile bottom bar */
const mobileNavItems: MobileNavItem[] = [
  {
    id: 'dashboard',
    label: 'Beranda',
    icon: LayoutDashboard,
    roles: ALL_ROLES,
    activeFor: ['dashboard'],
  },
  {
    id: 'guests',
    label: 'Tamu',
    icon: BookOpen,
    roles: ['super_admin', 'admin', 'resepsionis'],
    activeFor: ['guests', 'guest-form'],
  },
  {
    id: 'dispositions',
    label: 'Disposisi',
    icon: ArrowRightLeft,
    roles: ALL_ROLES,
    activeFor: ['dispositions'],
  },
  {
    id: 'appointments',
    label: 'Janji',
    icon: CalendarCheck,
    roles: ALL_ROLES,
    activeFor: ['appointments'],
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: User,
    roles: ['pegawai', 'pimpinan'],
    activeFor: ['profile'],
  },
]

/** Pages that are NOT in the bottom nav — "Lainnya" tab should be highlighted */
const morePages: PageId[] = [
  'departments',
  'employees',
  'reports',
  'backup',
  'users',
  'audit-log',
  'settings',
  'kiosk',
  'tracking',
]

/** Get the 4 most relevant nav items for a given role */
function getMobileNavItems(role: string | undefined): MobileNavItem[] {
  if (!role) return [mobileNavItems[0]]

  const filtered = mobileNavItems.filter((item) => item.roles.includes(role))

  // For admin/super_admin/resepsionis: Dashboard, Tamu, Disposisi, Janji
  // For pegawai/pimpinan: Dashboard, Disposisi, Janji, Profil
  return filtered.slice(0, 4)
}

export function MobileNavBar() {
  const { currentPage, setCurrentPage, currentUser } = useAppStore()
  const { toggleSidebar } = useSidebar()

  const navItems = React.useMemo(
    () => getMobileNavItems(currentUser?.role),
    [currentUser?.role]
  )

  const isMoreActive = morePages.includes(currentPage)

  /** Check if a nav item should be highlighted */
  const isItemActive = (item: MobileNavItem): boolean => {
    return item.activeFor?.includes(currentPage) ?? currentPage === item.id
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Top border - gold accent */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      {/* Nav bar background */}
      <div className="bg-navy dark:bg-navy-dark shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const isActive = isItemActive(item)
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
                  'transition-colors duration-200 outline-none',
                  'active:scale-95'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Active indicator bar */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gold rounded-b-full"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Icon
                    className={cn(
                      'size-[22px] transition-all duration-200',
                      isActive
                        ? 'text-gold'
                        : 'text-white/50 group-hover:text-white/70'
                    )}
                  />
                  {/* Glow effect for active icon */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gold/20 rounded-full blur-md -z-10"
                      layoutId="mobileNavGlow"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>

                <span
                  className={cn(
                    'text-[10px] font-semibold leading-tight transition-colors duration-200',
                    isActive ? 'text-gold' : 'text-white/50'
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* More button - opens sidebar */}
          <button
            onClick={toggleSidebar}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full relative',
              'transition-colors duration-200 outline-none',
              'active:scale-95'
            )}
            aria-label="Menu lainnya"
          >
            {/* Active indicator bar for "More" */}
            <AnimatePresence>
              {isMoreActive && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] bg-gold rounded-b-full"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </AnimatePresence>

            <div className="relative">
              <MoreHorizontal
                className={cn(
                  'size-[22px] transition-all duration-200',
                  isMoreActive ? 'text-gold' : 'text-white/50'
                )}
              />
              {isMoreActive && (
                <motion.div
                  className="absolute inset-0 bg-gold/20 rounded-full blur-md -z-10"
                  layoutId="mobileNavGlow"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>

            <span
              className={cn(
                'text-[10px] font-semibold leading-tight transition-colors duration-200',
                isMoreActive ? 'text-gold' : 'text-white/50'
              )}
            >
              Lainnya
            </span>
          </button>
        </div>
      </div>
    </nav>
  )
}
