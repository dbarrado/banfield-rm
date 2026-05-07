'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ALL_SPORT_FORMATS, type SportCode } from '@/lib/sports'
import { FieldRenderer } from '@/components/field-renderer'
import { Trophy } from 'lucide-react'

export default function DeportesPage() {
  const [selected, setSelected] = useState<SportCode>('football_11')
  const format = ALL_SPORT_FORMATS.find(f => f.code === selected)!

  // Generar jugadores demo para el formato
  const demoPlayers = format.positions.flatMap((pos, posIdx) => {
    // Cantidad por posición: distribuir players_on_field entre las posiciones
    let count = 1
    if (pos.code.includes('def') || pos.code.includes('zona') || pos.code === 'forward' || pos.code === 'back') {
      count = format.code === 'football_11' || format.code === 'hockey_field' ? 4 :
              format.code === 'baby_6' ? 2 : 2
    }
    if (pos.code === 'mediocampista' || pos.code === 'volante') {
      count = format.code === 'football_11' || format.code === 'hockey_field' ? 4 :
              format.code === 'baby_6' ? 2 : 1
    }
    if (pos.code === 'delantero' || pos.code === 'delantera') {
      count = format.code === 'football_11' || format.code === 'hockey_field' ? 2 :
              format.code === 'baby_6' ? 1 : (format.code === 'baby_5' ? 2 : 1)
    }
    if (pos.code === 'ala') count = 2
    return Array.from({ length: count }, (_, i) => ({
      id: `${pos.code}-${i}`,
      full_name: `Jugador ${posIdx + 1}.${i + 1}`,
      position_code: pos.code,
    }))
  }).slice(0, format.players_on_field)

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          DEPORTES
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Plantel soporta {ALL_SPORT_FORMATS.length} formatos. Cada categoría del club puede usar el suyo.
      </p>

      {/* Selector de deporte */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {ALL_SPORT_FORMATS.map(f => (
          <button
            key={f.code}
            onClick={() => setSelected(f.code)}
            className={`p-3 rounded-lg border-2 text-left transition-all ${selected === f.code ? 'shadow-md' : 'border-gray-200 hover:bg-gray-50'}`}
            style={selected === f.code ? { borderColor: 'var(--club-primary, #00843D)', backgroundColor: 'var(--club-primary, #00843D)10' } : {}}
          >
            <div className="text-2xl">{f.icon}</div>
            <p className="text-sm font-bold mt-1">{f.format_name}</p>
            <p className="text-[10px] text-muted-foreground">{f.players_on_field} jugadores</p>
          </button>
        ))}
      </div>

      {/* Detalle del formato seleccionado */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                {format.icon} {format.sport_name} — {format.format_name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {format.players_on_field} jugadores en cancha
                {format.has_goalkeeper ? ' · con arquero' : ' · sin arquero'}
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {format.has_yellow_red_cards && <Badge className="bg-yellow-100 text-yellow-800 border-0 text-[10px]">🟨🟥 Tarjetas</Badge>}
              <Badge variant="outline" className="text-[10px]">
                {format.scoring === 'goals' ? 'Goles' : format.scoring === 'sets_points' ? 'Sets/puntos' : 'Cuartos/puntos'}
              </Badge>
            </div>
          </div>

          {/* Posiciones */}
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Posiciones</p>
            <div className="flex flex-wrap gap-1.5">
              {format.positions.map(p => (
                <span
                  key={p.code}
                  className="text-[10px] px-2 py-1 rounded font-bold uppercase text-white"
                  style={{ backgroundColor: p.color_hex }}
                >
                  {p.label}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancha visual */}
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
        Cancha y formación
      </p>
      <FieldRenderer sportCode={selected} players={demoPlayers} />

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Plan Club: cancha visual estática · Plan Pro: drag & drop de posiciones
      </p>
    </div>
  )
}
