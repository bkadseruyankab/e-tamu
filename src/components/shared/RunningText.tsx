'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

export function RunningText() {
  const [text, setText] = React.useState<string>(
    'Selamat datang di E-Tamu BKAD Kabupaten Seruyan — Sistem Pelayanan Tamu Digital'
  )
  const [isPaused, setIsPaused] = React.useState(false)

  // Fetch running text from settings API
  React.useEffect(() => {
    const fetchText = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.running_text) {
            setText(data.running_text)
          }
        }
      } catch {
        // Keep default text
      }
    }
    fetchText()

    // Refresh every 60 seconds
    const interval = setInterval(fetchText, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="relative overflow-hidden bg-gold/10 border-y border-gold/20"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center h-8">
        {/* Fixed icon label */}
        <div className="flex items-center gap-1.5 px-3 shrink-0 bg-gold/20 h-full border-r border-gold/20">
          <Volume2 className="size-3.5 text-gold" />
          <span className="text-[10px] font-bold text-navy uppercase tracking-wider">
            Info
          </span>
        </div>

        {/* Scrolling text container */}
        <div className="relative flex-1 overflow-hidden">
          <motion.div
            className="flex whitespace-nowrap"
            animate={{
              x: isPaused ? undefined : undefined,
            }}
            style={{
              animation: isPaused ? 'none' : 'marquee 25s linear infinite',
            }}
          >
            {/* Duplicate for seamless loop */}
            <span className="text-xs text-navy dark:text-gold-light font-medium px-8">
              {text}
            </span>
            <span className="text-xs text-navy dark:text-gold-light font-medium px-8">
              {text}
            </span>
            <span className="text-xs text-navy dark:text-gold-light font-medium px-8">
              {text}
            </span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
