import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PageId = 
  | 'home'
  | 'login'
  | 'dashboard' 
  | 'guests' 
  | 'guest-form' 
  | 'departments' 
  | 'employees' 
  | 'dispositions' 
  | 'reports' 
  | 'settings' 
  | 'backup'
  | 'users' 
  | 'audit-log'
  | 'profile'
  | 'kiosk'
  | 'tracking'
  | 'appointments'

interface AppState {
  currentPage: PageId
  setCurrentPage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  selectedGuestId: string | null
  setSelectedGuestId: (id: string | null) => void
  currentUser: {
    id: string
    name: string
    email: string
    role: string
  } | null
  setCurrentUser: (user: AppState['currentUser']) => void
  isAuthenticated: boolean
  setIsAuthenticated: (auth: boolean) => void
  isKioskMode: boolean
  setIsKioskMode: (mode: boolean) => void
  isSetupComplete: boolean
  setIsSetupComplete: (complete: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentPage: 'home' as PageId,
      setCurrentPage: (page) => set({ currentPage: page }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      selectedGuestId: null,
      setSelectedGuestId: (id) => set({ selectedGuestId: id }),
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      isAuthenticated: false,
      setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
      isKioskMode: false,
      setIsKioskMode: (mode) => set({ isKioskMode: mode }),
      isSetupComplete: false,
      setIsSetupComplete: (complete) => set({ isSetupComplete: complete }),
    }),
    {
      name: 'e-tamu-bkad-auth',
      storage: createJSONStorage(() => {
        // Only use localStorage on the client side
        if (typeof window !== 'undefined') {
          return localStorage
        }
        // Return a no-op storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        isSetupComplete: state.isSetupComplete,
        currentPage: state.isAuthenticated && state.currentPage !== 'home' && state.currentPage !== 'login'
          ? state.currentPage
          : 'dashboard',
      }),
    }
  )
)
