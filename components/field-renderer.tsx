'use client'

import type { SportCode, SportFormat } from '@/lib/sports'
import { getSportFormat } from '@/lib/sports'

type PlayerOnField = {
  id: string
  full_name: string
  position_code: string
  avatar_url?: string
  card?: 'yellow' | 'red' | null
}

export function FieldRenderer({
  sportCode,
  players,
  onPlayerClick,
}: {
  sportCode: SportCode
  players: PlayerOnField[]
  onPlayerClick?: (id: string) => void
}) {
  const format = getSportFormat(sportCode)
  const isVolleyball = sportCode === 'volleyball'
  const isBasketball = sportCode === 'basketball'

  return (
    <div className="relative overflow-hidden rounded-xl shadow-lg mx-auto box-border" style={{ aspectRatio: format.field_aspect_ratio, width: 'min(100%, calc(100vw - 32px))', maxWidth: 480 }}>
      {/* Cancha */}
      <FieldBackground sportCode={sportCode} />

      {/* Posicionar jugadores */}
      {placePlayers(format, players).map(({ player, x, y }) => {
        const pos = format.positions.find(p => p.code === player.position_code)
        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onPlayerClick?.(player.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className="w-12 h-12 rounded-full bg-white border-2 shadow-lg overflow-hidden relative"
              style={{ borderColor: pos?.color_hex ?? '#999' }}
            >
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ color: pos?.color_hex ?? '#999' }}>
                  {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}
              {player.card === 'yellow' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-yellow-400 border border-yellow-600 z-10" />}
              {player.card === 'red' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-red-600 border border-red-800 z-10" />}
            </div>
            <p className="text-[9px] text-white text-center mt-0.5 font-bold leading-tight whitespace-nowrap drop-shadow-md">
              {player.full_name.split(' ').slice(-1)[0]}
            </p>
          </button>
        )
      })}
    </div>
  )
}

function placePlayers(format: SportFormat, players: PlayerOnField[]) {
  const result: { player: PlayerOnField; x: number; y: number }[] = []
  // Agrupar jugadores por posición
  for (const pos of format.positions) {
    const ofPos = players.filter(p => p.position_code === pos.code)
    ofPos.forEach((player, i) => {
      const x = pos.default_x_for_count(ofPos.length, i)
      const y = pos.default_y
      result.push({ player, x, y })
    })
  }
  return result
}

function FieldBackground({ sportCode }: { sportCode: SportCode }) {
  // Distintos tipos de cancha según deporte
  if (sportCode === 'volleyball') {
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #d4a574 0%, #c89860 100%)' }}>
        <svg viewBox="0 0 200 200" className="w-full h-full" preserveAspectRatio="none">
          <rect x="5" y="5" width="190" height="190" fill="none" stroke="white" strokeWidth="0.8" />
          <line x1="5" y1="100" x2="195" y2="100" stroke="white" strokeWidth="2" />
          <line x1="5" y1="62" x2="195" y2="62" stroke="white" strokeWidth="0.6" strokeDasharray="2,2" />
          <line x1="5" y1="138" x2="195" y2="138" stroke="white" strokeWidth="0.6" strokeDasharray="2,2" />
        </svg>
      </div>
    )
  }
  if (sportCode === 'basketball') {
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #b8743f 0%, #9c5f33 100%)' }}>
        <svg viewBox="0 0 100 200" className="w-full h-full" preserveAspectRatio="none">
          <rect x="3" y="3" width="94" height="194" fill="none" stroke="white" strokeWidth="0.6" />
          <line x1="3" y1="100" x2="97" y2="100" stroke="white" strokeWidth="0.6" />
          <circle cx="50" cy="100" r="10" fill="none" stroke="white" strokeWidth="0.5" />
          {/* Zona pintada arriba */}
          <rect x="35" y="3" width="30" height="35" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="38" r="10" fill="none" stroke="white" strokeWidth="0.5" />
          {/* Zona pintada abajo */}
          <rect x="35" y="162" width="30" height="35" fill="none" stroke="white" strokeWidth="0.5" />
          <circle cx="50" cy="162" r="10" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
      </div>
    )
  }
  if (sportCode === 'baby_5' || sportCode === 'baby_6' || sportCode === 'futsal') {
    // Cancha más cuadrada, sin círculo central, áreas chicas
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }}>
        <svg viewBox="0 0 200 250" className="w-full h-full" preserveAspectRatio="none">
          <rect x="5" y="5" width="190" height="240" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <line x1="5" y1="125" x2="195" y2="125" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <circle cx="100" cy="125" r="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          {/* Áreas chicas */}
          <rect x="65" y="5" width="70" height="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <rect x="65" y="225" width="70" height="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        </svg>
      </div>
    )
  }
  // Default: fútbol 11 / hockey / rugby — cancha vertical 2:3
  return (
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }}>
      <svg viewBox="0 0 200 300" className="w-full h-full" preserveAspectRatio="none">
        <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <line x1="5" y1="150" x2="195" y2="150" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <circle cx="100" cy="150" r="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <circle cx="100" cy="150" r="1" fill="white" opacity="0.7" />
        <rect x="50" y="5" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <rect x="50" y="260" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <rect x="75" y="5" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
        <rect x="75" y="280" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
      </svg>
    </div>
  )
}
