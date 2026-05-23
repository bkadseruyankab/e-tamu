'use client'

import { useSettings, AppLogo } from '@/components/shared/AppLogo'

export function AppFooter() {
  const { settings } = useSettings()

  return (
    <footer className="mt-auto hidden md:block">
      {/* Gold accent line on top */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

      {/* Footer content */}
      <div className="bg-navy dark:bg-navy-dark px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppLogo size="sm" variant="light" showText={false} />
            <span className="text-[11px] sm:text-xs text-white/60">
              &copy; 2026 BKAD Kabupaten Seruyan
            </span>
          </div>
          <div className="flex items-center gap-4">
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="text-white/40 hover:text-gold transition-colors text-xs flex items-center gap-1.5"
                title={settings.contact_email}
              >
                <i className="fa-solid fa-envelope" />
                <span className="hidden sm:inline">{settings.contact_email}</span>
              </a>
            )}
            {settings.contact_whatsapp && (
              <a
                href={`https://wa.me/${settings.contact_whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#25D366] transition-colors text-xs flex items-center gap-1.5"
                title={settings.contact_whatsapp}
              >
                <i className="fa-brands fa-whatsapp" />
                <span className="hidden sm:inline">{settings.contact_whatsapp}</span>
              </a>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-white/40">
            Sistem Pelayanan Tamu Digital
          </p>
        </div>
      </div>
    </footer>
  )
}
