'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

type Props = {
  onScan: (text: string) => void
  onClose: () => void
}

export function QrScanner({ onScan, onClose }: Props) {
  const containerId = 'qr-reader-container'
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true
    let scanner: any

    ;(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (!mounted) return
        scanner = new Html5Qrcode(containerId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText)
          },
          () => { /* swallow per-frame parse errors */ }
        )
      } catch (e: any) {
        console.error('QR scanner error', e)
      }
    })()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear?.()
        })
      }
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-3">
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between text-white">
          <p className="text-sm font-bold uppercase" style={{ fontFamily: 'var(--font-barlow)' }}>Escanear carnet</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        <div id={containerId} className="rounded-lg overflow-hidden bg-black" style={{ minHeight: 280 }} />
        <p className="text-xs text-white/70 text-center">
          Apuntá la cámara al QR del carnet del socio. Se identifica automáticamente.
        </p>
      </div>
    </div>
  )
}
