'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser, Save } from 'lucide-react'

interface SignatureCanvasProps {
  onChange: (data: string) => void
  width?: number
  height?: number
}

export function SignatureCanvas({ onChange, width = 500, height = 200 }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size based on container
    const container = canvas.parentElement
    if (container) {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    // Set drawing styles
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw signature line
    ctx.beginPath()
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.moveTo(20, height - 30)
    ctx.lineTo((canvas.style.width ? parseInt(canvas.style.width) : width) - 20, height - 30)
    ctx.stroke()
    ctx.setLineDash([])

    // Reset stroke style for drawing
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5
  }, [width, height])

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setHasSignature(true)

    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)

    // Prevent scrolling on touch
    if ('touches' in e) {
      e.preventDefault()
    }
  }, [getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    if ('touches' in e) {
      e.preventDefault()
    }
  }, [isDrawing, getPos])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr)

    // Redraw signature line
    ctx.beginPath()
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.moveTo(20, height - 30)
    ctx.lineTo((canvas.style.width ? parseInt(canvas.style.width) : width) - 20, height - 30)
    ctx.stroke()
    ctx.setLineDash([])

    // Reset stroke style
    ctx.strokeStyle = '#1e3a5f'
    ctx.lineWidth = 2.5

    setHasSignature(false)
    onChange('')
  }, [height, width, onChange])

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dataUrl = canvas.toDataURL('image/png')
    onChange(dataUrl)
  }, [onChange])

  return (
    <div className="space-y-2">
      <div className="border-2 border-[#1e3a5f] rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          className="border-[#C5A55A] text-[#C5A55A] hover:bg-[#C5A55A] hover:text-white"
        >
          <Eraser className="size-4 mr-1" />
          Hapus
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="bg-[#C5A55A] hover:bg-[#b8963f] text-white"
        >
          <Save className="size-4 mr-1" />
          Simpan TTD
        </Button>
      </div>
    </div>
  )
}
