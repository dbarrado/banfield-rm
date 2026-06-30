'use client'

import { useEffect, useState } from 'react'

// Reloj digital estilo Casio. Usa SOLO el reloj local del dispositivo (new Date()),
// que el teléfono mantiene sincronizado vía el sistema operativo (NTP del SO).
// No hace ninguna llamada de red → no consume datos.
export function CasioClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Evita mismatch de hidratación: no renderiza hora hasta montar en el cliente.
  if (!now) {
    return <div className="w-[88px] h-[28px]" aria-hidden />
  }

  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const dia = now.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3).toUpperCase()

  return (
    <div
      className="flex items-center gap-1.5 rounded-md px-2 py-1 select-none"
      style={{
        background: 'linear-gradient(180deg, #b7c4a8 0%, #a7b59a 100%)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35), 0 1px 1px rgba(255,255,255,0.4)',
        border: '1px solid #5c6650',
      }}
      title="Hora del dispositivo"
    >
      <span
        className="text-[9px] font-bold leading-none"
        style={{ fontFamily: 'var(--font-mono, monospace)', color: '#2c3326' }}
      >
        {dia}
      </span>
      <span
        className="tabular-nums leading-none"
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          color: '#1c2118',
          fontSize: '15px',
          fontWeight: 700,
          letterSpacing: '0.5px',
        }}
      >
        {hh}:{mm}
        <span className="text-[10px] align-top">{ss}</span>
      </span>
    </div>
  )
}
