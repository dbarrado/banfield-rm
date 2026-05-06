'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, CheckCircle2, MessageCircle, Lock } from 'lucide-react'
import { demoPlayers, demoCategories, demoEvents, getAttendanceStats, demoEligibilityConfig } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, type Position } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']

export default function ConvocatoriaPage() {
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedEvent, setSelectedEvent] = useState(demoEvents.filter(e => e.event_type === 'match')[0]?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeCategories = demoCategories.filter(c => c.is_active)
  const matches = demoEvents.filter(e => e.event_type === 'match' && e.category_id === selectedCategory)
  const players = demoPlayers.filter(p => p.category_id === selectedCategory && p.is_active)
  const threshold = demoEligibilityConfig.min_attendance_percentage

  const playersWithStats = players.map(p => {
    const stats = getAttendanceStats(p.id, selectedCategory)
    return { ...p, stats, eligible: stats.percentage >= threshold || stats.total === 0 }
  })

  function togglePlayer(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedPlayers = playersWithStats.filter(p => selected.has(p.id))

  function generateWhatsApp() {
    const event = demoEvents.find(e => e.id === selectedEvent)
    const cat = demoCategories.find(c => c.id === selectedCategory)
    const date = event ? new Date(event.scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Por definir'
    const time = event ? new Date(event.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''
    // Ordenar convocados por posición: arqueros, defensores, medios, delanteros
    const ordered = [...selectedPlayers].sort(
      (a, b) => POSITIONS.indexOf(a.primary_position) - POSITIONS.indexOf(b.primary_position)
    )
    const lista = ordered.map((p, i) => `${i + 1}. ${p.full_name} (${POSITION_LABELS[p.primary_position]})`).join('\n')
    const msg = `⚽ CONVOCATORIA — ${cat?.name ?? ''}\n📅 ${date} — ${time}\n📍 ${event?.venue ?? 'A confirmar'}\n\nJugadores convocados (${selectedPlayers.length}):\n${lista}\n\nPresentarse 30 min antes.\n¡Vamos Banfield! 💚`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Conteo por posición de los convocados
  const selectedByPosition = POSITIONS.map(pos => ({
    position: pos,
    count: selectedPlayers.filter(p => p.primary_position === pos).length,
  }))

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          CONVOCATORIA
        </h1>
      </div>

      {/* Selectores */}
      <div className="flex gap-2 flex-wrap">
        <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelected(new Set()); }}
          className="pl-3 pr-6 py-2 rounded-lg border text-sm font-medium bg-white" style={{ borderColor: '#00843D', color: '#00843D' }}>
          {activeCategories.map(c => <option key={c.id} value={c.id}>Cat. {c.name}</option>)}
        </select>
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
          className="pl-3 pr-6 py-2 rounded-lg border text-sm font-medium bg-white flex-1">
          <option value="">Seleccionar partido...</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              vs. {m.rival} — {new Date(m.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Umbral mínimo de asistencia: <strong>{threshold}%</strong>. Tocá para seleccionar/deseleccionar.
      </p>

      {/* Resumen de convocados por posición */}
      {selected.size > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-3">
            <p className="text-xs font-bold mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              CONVOCADOS ({selected.size})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedByPosition.map(({ position, count }) => (
                <div
                  key={position}
                  className="px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1"
                  style={{
                    backgroundColor: count > 0 ? POSITION_COLORS[position] : '#f3f4f6',
                    color: count > 0 ? 'white' : '#9ca3af',
                  }}
                >
                  <span className="font-bold">{count}</span>
                  <span>{POSITION_LABELS[position]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listado por posición */}
      {POSITIONS.map(pos => {
        const ofPos = playersWithStats.filter(p => p.primary_position === pos)
        if (ofPos.length === 0) return null
        const eligibleOfPos = ofPos.filter(p => p.eligible)
        const notEligibleOfPos = ofPos.filter(p => !p.eligible)
        return (
          <div key={pos} className="space-y-2">
            <div className="flex items-center gap-2 mt-4">
              <div className="w-1 h-5 rounded" style={{ backgroundColor: POSITION_COLORS[pos] }} />
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: POSITION_COLORS[pos], fontFamily: "var(--font-barlow)" }}>
                {POSITION_LABELS[pos]}S ({ofPos.length})
              </h2>
            </div>

            {eligibleOfPos.map(p => {
              const isSelected = selected.has(p.id)
              return (
                <button key={p.id} onClick={() => togglePlayer(p.id)} className="w-full text-left">
                  <Card
                    className="border-0 shadow-sm transition-all"
                    style={{
                      borderLeft: `4px solid ${isSelected ? POSITION_COLORS[pos] : '#e5e7eb'}`,
                      backgroundColor: isSelected ? '#f0fdf4' : 'white',
                    }}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: isSelected ? POSITION_COLORS[pos] : '#9ca3af' }}
                      >
                        {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.full_name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {p.secondary_positions.map(sp => (
                            <span key={sp} className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${POSITION_COLORS[sp]}20`, color: POSITION_COLORS[sp] }}>
                              {POSITION_LABELS[sp]}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Asist: {p.stats.percentage}% · Conv: {p.convocation_count}v</p>
                      </div>
                      {isSelected && <CheckCircle2 size={18} style={{ color: POSITION_COLORS[pos] }} />}
                    </CardContent>
                  </Card>
                </button>
              )
            })}

            {notEligibleOfPos.length > 0 && (
              <details className="opacity-70">
                <summary className="text-xs text-gray-400 cursor-pointer flex items-center gap-1 py-1">
                  <Lock size={11} /> {notEligibleOfPos.length} no elegibles
                </summary>
                <div className="space-y-1 mt-1">
                  {notEligibleOfPos.map(p => (
                    <Card key={p.id} className="border-0 shadow-sm bg-gray-50">
                      <CardContent className="p-2 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold bg-gray-400 flex-shrink-0">
                          {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 truncate">{p.full_name}</p>
                          <p className="text-[10px] text-gray-400">Asist: {p.stats.percentage}%</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-gray-400">No elegible</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </details>
            )}
          </div>
        )
      })}

      {/* Botón WhatsApp sticky */}
      {selected.size > 0 && (
        <div className="sticky bottom-20 md:bottom-4 pt-2">
          <button
            onClick={generateWhatsApp}
            className="w-full py-3 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={20} />
            ENVIAR CONVOCATORIA ({selected.size}) por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
