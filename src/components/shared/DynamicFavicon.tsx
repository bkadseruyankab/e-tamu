'use client'

import { useEffect } from 'react'
import { useSettings } from '@/components/shared/AppLogo'

/**
 * DynamicFavicon - Updates the browser tab favicon dynamically
 * based on the logo_url or favicon_url stored in the database settings.
 * 
 * Priority: favicon_url > logo_url > default /logo.svg
 * 
 * This component renders nothing visible. It manipulates
 * the <link rel="icon"> element in the document <head>.
 * 
 * When a logo is uploaded via Settings, the favicon_url is
 * automatically set to the same URL as logo_url, ensuring
 * the browser tab icon always matches the app logo.
 */
export function DynamicFavicon() {
  const { settings } = useSettings()

  useEffect(() => {
    const faviconUrl = settings.favicon_url || settings.logo_url

    if (!faviconUrl) {
      // If no favicon/logo set, ensure default is used
      const existingLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null
      if (existingLink && existingLink.dataset.dynamic === 'true') {
        // Reset to default
        existingLink.href = '/logo.svg'
        existingLink.type = 'image/svg+xml'
      }
      return
    }

    // Find or create the favicon link element
    let linkElement = document.querySelector("link[rel='icon']") as HTMLLinkElement | null

    if (!linkElement) {
      linkElement = document.createElement('link')
      linkElement.rel = 'icon'
      document.head.appendChild(linkElement)
    }

    // Mark as dynamically managed
    linkElement.dataset.dynamic = 'true'

    // Determine MIME type based on URL
    let mimeType = 'image/png' // default for data URLs and unknown types

    if (faviconUrl.startsWith('data:')) {
      // Extract mime type from data URL (e.g., "data:image/png;base64,...")
      const mimeMatch = faviconUrl.match(/^data:(image\/[a-z+]+);/)
      if (mimeMatch) {
        mimeType = mimeMatch[1]
      }
    } else if (faviconUrl.endsWith('.svg')) {
      mimeType = 'image/svg+xml'
    } else if (faviconUrl.endsWith('.png')) {
      mimeType = 'image/png'
    } else if (faviconUrl.endsWith('.jpg') || faviconUrl.endsWith('.jpeg')) {
      mimeType = 'image/jpeg'
    } else if (faviconUrl.endsWith('.webp')) {
      mimeType = 'image/webp'
    } else if (faviconUrl.endsWith('.ico')) {
      mimeType = 'image/x-icon'
    } else if (faviconUrl.endsWith('.gif')) {
      mimeType = 'image/gif'
    }

    linkElement.type = mimeType

    // Add cache-busting timestamp for external URLs
    // (skip for data URLs as they're already in-memory)
    if (faviconUrl.startsWith('data:')) {
      linkElement.href = faviconUrl
    } else {
      const separator = faviconUrl.includes('?') ? '&' : '?'
      linkElement.href = `${faviconUrl}${separator}t=${Date.now()}`
    }

    // Also update apple-touch-icon for iOS devices
    let appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null
    if (!appleLink) {
      appleLink = document.createElement('link')
      appleLink.rel = 'apple-touch-icon'
      document.head.appendChild(appleLink)
    }
    appleLink.href = faviconUrl.startsWith('data:') ? faviconUrl : `${faviconUrl}${faviconUrl.includes('?') ? '&' : '?'}t=${Date.now()}`

    // Update page title with app name from settings
    const appName = settings.app_name || 'E-Tamu BKAD'
    const appTitle = settings.app_title || 'Sistem Pelayanan Tamu Digital'
    document.title = `${appName} - ${appTitle}`
  }, [settings.favicon_url, settings.logo_url, settings.app_name, settings.app_title])

  return null
}
