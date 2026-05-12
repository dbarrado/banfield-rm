'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

const STORAGE_KEY = 'bandield_demo_banner_dismissed'

export function DemoBanner() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (pathname !== '/dashboard') return
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1'
    if (!dismissed) setShow(true)
  }, [pathname])

  if (!show || pathname !== '/dashboard') return null

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  return (
    <div className="w-full py-2 px-4 text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#C9A84C' }}>
      <span className="text-center">⚽ MODO DEMO — Datos ficticios para visualización. Conectá Supabase para usar con datos reales.</span>
      <button onClick={dismiss} className="flex-shrink-0 p-1 rounded hover:bg-white/20" aria-label="Cerrar">
        <X size={14} />
      </button>
    </div>
  )
}
