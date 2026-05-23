'use client'

import * as React from 'react'
import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppFooter } from '@/components/layout/AppFooter'
import { MobileNavBar } from '@/components/layout/MobileNavBar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import DashboardPage from '@/components/dashboard/DashboardPage'
import { GuestTable } from '@/components/guests/GuestTable'
import { GuestForm } from '@/components/guests/GuestForm'
import { DispositionManager } from '@/components/dispositions/DispositionManager'
import { DepartmentManager } from '@/components/departments/DepartmentManager'
import { EmployeeManager } from '@/components/employees/EmployeeManager'
import ReportsPage from '@/components/reports/ReportsPage'
import SettingsPage from '@/components/settings/SettingsPage'
import BackupPage from '@/components/backup/BackupPage'
import UserManager from '@/components/users/UserManager'
import AuditLogViewer from '@/components/shared/AuditLogViewer'
import ProfilePage from '@/components/shared/ProfilePage'
import KioskMode from '@/components/kiosk/KioskMode'
import HomePage from '@/components/home/HomePage'
import LoginPage from '@/components/auth/LoginPage'
import AppointmentManager from '@/components/appointments/AppointmentManager'
import PublicAppointmentForm from '@/components/appointments/PublicAppointmentForm'
import SetupWizard from '@/components/setup/SetupWizard'
import { AnimatePresence, motion } from 'framer-motion'

/** All roles in the system */
const ALL_ROLES = ['super_admin', 'admin', 'resepsionis', 'pegawai', 'pimpinan']

/** Role-based page permissions mapping */
const pagePermissions: Record<string, string[]> = {
  dashboard: ALL_ROLES,
  guests: ['super_admin', 'admin', 'resepsionis'],
  'guest-form': ['super_admin', 'admin', 'resepsionis'],
  appointments: ALL_ROLES,
  dispositions: ALL_ROLES,
  departments: ['super_admin', 'admin'],
  employees: ['super_admin', 'admin'],
  reports: ['super_admin', 'admin'],
  settings: ['super_admin', 'admin'],
  backup: ['super_admin'],
  users: ['super_admin'],
  'audit-log': ['super_admin'],
  profile: ALL_ROLES,
}

/** Public pages that should NOT be guarded */
const publicPages = ['home', 'login']

/** Check if a page is accessible by a given role */
function isPageAllowed(page: string, role: string | undefined): boolean {
  // Public pages are always accessible
  if (publicPages.includes(page)) return true
  // If no role, only public pages are accessible
  if (!role) return false
  // Get allowed roles for the page
  const allowedRoles = pagePermissions[page]
  // If page is not in the permissions map, deny access
  if (!allowedRoles) return false
  return allowedRoles.includes(role)
}

function PageRenderer() {
  const { currentPage, isKioskMode, isAuthenticated, currentUser, setCurrentPage } = useAppStore()

  // Role-based page guard: redirect to dashboard if user lacks permission
  React.useEffect(() => {
    if (isKioskMode) return
    if (publicPages.includes(currentPage)) return
    if (!isAuthenticated) return

    const userRole = currentUser?.role
    if (!isPageAllowed(currentPage, userRole)) {
      setCurrentPage('dashboard')
    }
  }, [currentPage, currentUser?.role, isAuthenticated, isKioskMode, setCurrentPage])

  if (isKioskMode) {
    return <KioskMode />
  }

  // Standalone full-screen pages (no sidebar layout)
  if (currentPage === 'home') {
    return <HomePage />
  }

  if (currentPage === 'login') {
    return <LoginPage />
  }

  // Public appointment form for non-authenticated users
  if (currentPage === 'appointments' && !isAuthenticated) {
    return <PublicAppointmentForm />
  }

  // Check page permission before rendering
  const userRole = currentUser?.role
  if (!isPageAllowed(currentPage, userRole)) {
    // Render dashboard as fallback (redirect will happen via useEffect)
    return <DashboardPage />
  }

  const pages: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    guests: <GuestTable />,
    'guest-form': <GuestForm />,
    dispositions: <DispositionManager />,
    appointments: <AppointmentManager />,
    departments: <DepartmentManager />,
    employees: <EmployeeManager />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
    backup: <BackupPage />,
    users: <UserManager />,
    'audit-log': <AuditLogViewer />,
    profile: <ProfilePage />,
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1 overflow-auto"
      >
        {pages[currentPage] || <DashboardPage />}
      </motion.div>
    </AnimatePresence>
  )
}

function SetupCheck({ children }: { children: React.ReactNode }) {
  const { isSetupComplete, setIsSetupComplete } = useAppStore()
  const [checking, setChecking] = React.useState(true)
  const [forceSkip, setForceSkip] = React.useState(false)

  React.useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/setup')
        if (res.ok) {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await res.json()
            if (data.setupComplete) {
              setIsSetupComplete(true)
            }
            // Only set to false if the API explicitly says setup is NOT complete
            // AND there are no admin users (meaning setup truly hasn't been done)
            // This prevents overwriting localStorage on temporary API issues
            else if (data.hasNoUsers) {
              setIsSetupComplete(false)
            }
            // If setupComplete is false but users exist, trust localStorage
            // The setup_complete key might have been lost from DB
          } else {
            // Non-JSON response — trust localStorage, don't reset
            console.warn('Setup API returned non-JSON response, trusting local state')
          }
        } else {
          // Non-OK response — trust localStorage, don't reset
          console.warn('Setup API returned non-OK status:', res.status)
        }
      } catch (err) {
        // If API fails, trust the persisted localStorage value
        // Don't override with false — could be a temporary network issue
        console.warn('Setup API fetch failed, trusting local state:', err)
      } finally {
        setChecking(false)
      }
    }
    checkSetup()
  }, [setIsSetupComplete])

  // If setup was previously completed (in Zustand/localStorage), skip the check screen entirely
  // This prevents the setup wizard from flashing on refresh
  if (isSetupComplete && !forceSkip) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070e1b] via-[#0a1f3f] to-[#0c2d57]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a84c] to-[#a88a3a] flex items-center justify-center mx-auto animate-pulse shadow-lg shadow-[#c9a84c]/30">
            <svg
              className="w-6 h-6 text-[#0a1f3f]"
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
          </div>
          <p className="text-white/50 text-sm">Memeriksa konfigurasi...</p>
        </div>
      </div>
    )
  }

  if (!isSetupComplete) {
    return <SetupWizard />
  }

  return <>{children}</>
}

export default function Home() {
  const { currentPage, isKioskMode, isAuthenticated } = useAppStore()

  return (
    <SetupCheck>
      {currentPage === 'home' || currentPage === 'login' ? (
        <PageRenderer />
      ) : currentPage === 'appointments' && !isAuthenticated ? (
        <PageRenderer />
      ) : isKioskMode ? (
        <div className="min-h-screen flex flex-col">
          <PageRenderer />
        </div>
      ) : (
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-col min-h-screen">
              <AppHeader />
              <main className="flex-1 flex flex-col overflow-hidden px-2 md:px-4 pb-16 md:pb-0">
                <PageRenderer />
              </main>
              <AppFooter />
            </SidebarInset>
            <MobileNavBar />
          </div>
        </SidebarProvider>
      )}
    </SetupCheck>
  )
}
