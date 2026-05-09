'use client'

import { useState, use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, Star, Save } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, demoPlayers, demoCategories } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS } from '@/types'
import { getTiraLabel, getTiraColor } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'

export default function PuntajesPartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()

  const cat = demoCategories.find(c => c.id === event!.category_id)
  // Demo: tomar 14 "convocados" y ordenarlos por posición (arquero → defensor → medio → delantero)
  // dentro de cada posición, derecha → izquierda (orden inverso al index)
  const allOfCat = demoPlayers.filter(p => p.category_id === event!.category_id).slice(0, 14)
  const positionOrder: Record<string, number> = { arquero: 0, defensor: 1, mediocampista: 2, delantero: 3 }
  const convocados = [...allOfCat].sort((a, b) => {
    const posDiff = positionOrder[a.primary_position] - positionOrder[b.primary_position]
    if (posDiff !== 0) return posDiff
    // Mismo puesto: invertir el orden natural (derecha→izquierda en cancha = última posición primero)
    return b.id.localeCompare(a.id)
  })

  const [scores, setScores] = useState<Record<string, number>>({})
  const [observations, setObservations] = useState<Record<string, string>>({})

  function setScore(playerId: string, score: number) {
    setScores(prev => ({ ...prev, [playerId]: score }))
  }

  const ratedCount = Object.keys(scores).length
  const avg = ratedCount > 0
    ? Object.values(scores).reduce((s, v) => s + v, 0) / ratedCount
    : 0

  const date = new Date(event!.scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="pb-4">
      <div className="text-white p-4 pb-6" style={{ background: `linear-gradient(135deg, #00843D 0%, #005a2a 100%)` }}>
        <Link href="/fixture" className="text-white/80 text-xs flex items-center gap-1 mb-2">
          <ArrowLeft size={12} /> Fixture
        </Link>
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
            PUNTAJES — vs. {event!.rival}
          </h1>
        </div>
        <p className="text-xs text-white/80 capitalize mt-1">{date} · Cat. {cat?.name}</p>
      </div>

      <div className="p-3 space-y-3 -mt-3">
        {/* Resumen */}
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Puntuados</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                {ratedCount}/{convocados.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Promedio</p>
              <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
                {avg.toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-[11px] text-muted-foreground">
          Puntuá de <strong>1 a 10</strong> a cada jugador que jugó. Es opcional — podés dejar sin puntuar a quien no jugó o no quieras evaluar.
        </p>

        {/* Lista de jugadores */}
        <div className="space-y-2">
          {convocados.map(p => {
            const score = scores[p.id]
            return (
              <Card key={p.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${POSITION_COLORS[p.primary_position]}` }}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.full_name}</p>
                      <div className="flex gap-1 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                          {POSITION_LABELS[p.primary_position]}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: getTiraColor(p.tira, (cat?.sport_format_code ?? 'football_11') as SportCode) }}>
                          {getTiraLabel(p.tira, (cat?.sport_format_code ?? 'football_11') as SportCode)}
                        </span>
                      </div>
                    </div>
                    {score !== undefined && (
                      <div className="text-center flex-shrink-0">
                        <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: scoreColor(score) }}>
                          {score}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Score selector */}
                  <div className="grid grid-cols-10 gap-0.5">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setScore(p.id, score === n ? 0 : n)}
                        className={`py-1.5 rounded text-[11px] font-bold border transition-all ${
                          score === n
                            ? 'text-white border-transparent scale-110'
                            : score && n <= score
                              ? 'border-transparent text-white opacity-70'
                              : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                        style={score && n <= score ? { backgroundColor: scoreColor(score) } : {}}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  {/* Optional comment */}
                  {score !== undefined && score > 0 && (
                    <input
                      type="text"
                      placeholder="Observación opcional (ej: gol decisivo, gran defensa...)"
                      value={observations[p.id] ?? ''}
                      onChange={e => setObservations({ ...observations, [p.id]: e.target.value })}
                      className="w-full text-xs px-2 py-1.5 border rounded"
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Botón guardar */}
        <div className="sticky bottom-20 md:bottom-4 pt-3">
          <button
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
            style={{ backgroundColor: '#00843D' }}
            onClick={() => alert(`✅ Puntajes guardados (demo)\n\n${ratedCount} jugadores puntuados\nPromedio: ${avg.toFixed(1)}/10`)}
          >
            <Save size={16} /> GUARDAR PUNTAJES ({ratedCount}/{convocados.length})
          </button>
          {ratedCount === 0 && (
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Podés guardar sin puntuar a todos. Se considera opcional salvo que admin lo marque obligatorio.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 8) return '#00843D' // verde
  if (score >= 6) return '#1d4ed8' // azul
  if (score >= 4) return '#F59E0B' // ámbar
  return '#DC2626' // rojo
}
