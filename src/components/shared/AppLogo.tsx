'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface AppSettings {
  logo_url: string
  favicon_url: string
  app_name: string
  app_title: string
  running_text: string
  contact_email: string
  contact_whatsapp: string
  whatsapp_api_key: string
  whatsapp_api_url: string
  email_notification_enabled: string
  whatsapp_notification_enabled: string
  qr_code_enabled: string
  qr_code_url: string
  [key: string]: string
}

const defaultSettings: AppSettings = {
  logo_url: '',
  favicon_url: '',
  app_name: 'E-Tamu BKAD',
  app_title: 'Sistem Tamu Digital BKAD',
  running_text: 'Selamat datang di E-Tamu BKAD — Sistem Tamu Digital',
  contact_email: '',
  contact_whatsapp: '',
  whatsapp_api_key: '',
  whatsapp_api_url: 'https://api.fonnte.com/send',
  email_notification_enabled: 'false',
  whatsapp_notification_enabled: 'false',
  qr_code_enabled: 'true',
  qr_code_url: '',
}

interface SettingsContextType {
  settings: AppSettings
  loading: boolean
  refetch: () => void
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refetch: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json') && res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          setSettings({ ...defaultSettings, ...json.data })
        }
      } else {
        // Non-JSON or error response — keep default settings
        console.warn('Settings API returned non-JSON response, using defaults')
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}

// Shared Logo component
interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'light' | 'gold'
  className?: string
  showText?: boolean
}

const sizeMap = {
  sm: { icon: 'size-6', text: 'text-sm', subtext: 'text-[8px]' },
  md: { icon: 'size-8', text: 'text-base', subtext: 'text-[10px]' },
  lg: { icon: 'size-10', text: 'text-lg', subtext: 'text-[11px]' },
  xl: { icon: 'size-14', text: 'text-2xl', subtext: 'text-xs' },
}

const variantMap = {
  default: {
    bg: 'bg-gradient-to-br from-[#c9a84c] to-[#a88a3a]',
    iconColor: 'text-[#0a1f3f]',
    textColor: 'text-[#0c2d57]',
    subtextColor: 'text-[#c9a84c]',
  },
  light: {
    bg: 'bg-gradient-to-br from-[#c9a84c] to-[#a88a3a]',
    iconColor: 'text-[#0a1f3f]',
    textColor: 'text-white',
    subtextColor: 'text-[#c9a84c]/70',
  },
  gold: {
    bg: 'bg-gradient-to-br from-[#c9a84c] to-[#a88a3a]',
    iconColor: 'text-[#0a1f3f]',
    textColor: 'text-[#c9a84c]',
    subtextColor: 'text-[#c9a84c]/70',
  },
}

export function AppLogo({ size = 'md', variant = 'default', className = '', showText = true }: LogoProps) {
  const { settings } = useSettings()
  const s = sizeMap[size]
  const v = variantMap[variant]
  const logoUrl = settings.logo_url

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt="Logo"
          className={`${s.icon} object-contain rounded`}
          onError={(e) => {
            // Fallback to default icon on error
            (e.target as HTMLImageElement).style.display = 'none'
            const parent = (e.target as HTMLImageElement).parentElement
            if (parent) {
              const fallback = parent.querySelector('.logo-fallback') as HTMLElement
              if (fallback) fallback.style.display = 'flex'
            }
          }}
        />
      ) : null}
      <div
        className={`${s.icon} rounded-lg ${v.bg} items-center justify-center shadow-lg shadow-[#c9a84c]/20 ${logoUrl ? 'hidden' : 'flex'} logo-fallback`}
        style={logoUrl ? { display: 'none' } : {}}
      >
        <svg className={`${s.icon} p-1 ${v.iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      {showText && (
        <div>
          <h1 className={`${s.text} font-bold ${v.textColor} leading-tight`}>
            {settings.app_name || 'E-Tamu BKAD'}
          </h1>
          <p className={`${s.subtext} ${v.subtextColor} leading-tight tracking-wider uppercase`}>
            {settings.app_title ? settings.app_title.replace('E-Tamu ', '').replace('BKAD', 'BKAD') : 'Sistem Digital'}
          </p>
        </div>
      )}
    </div>
  )
}
