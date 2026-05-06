'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, CheckCircle2, MessageCircle, Lock } from 'lucide-react'
import { demoPlayers, demoCategories, demoEvents, getAttendanceStats, demoEligibilityConfig } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS, type Position, type Tira } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function ConvocatoriaPage() {
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedTira, setSelectedTira] = useState<Tira | null>(null)
  const [selectedEvent, setSelectedEvent] = useState(demoEvents.filter(e => e.event_type === 'match')[0]?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [threshold, setThreshold] = useState(demoEligibilityConfig.min_attendance_percentage)

  const activeCategories = demoCategories.filter(c => c.is_active)
  const matches = demoEvents.filter(e => e.event_type === 'match' && e.category_id === selectedCategory)
  const tirasInCategory = ALL_TIRAS.filter(t =>
    demoPlayers.some(p => p.category_id === selectedCategory && p.tira === t)
  )

  const players = demoPlayers.filter(p =>
    p.category_id === selectedCategory &&
    p.is_active &&
    (selectedTira ? p.tira === selectedTira : true)
  )

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
    const ordered = [...selectedPlayers].sort(
      (a, b) => POSITIONS.indexOf(a.primary_position) - POSITIONS.indexOf(b.primary_position)
    )
    const lista = ordered.map((p, i) => `${i + 1}. ${p.full_name} (${POSITION_LABELS[p.primary_position]})`).join('\n')
    const tiraInfo = selectedTira ? ` — ${TIRA_LABELS[selectedTira]}` : ''
    const msg = `⚽ CONVOCATORIA — ${cat?.name ?? ''}${tiraInfo}\n📅 ${date} — ${time}\n📍 ${event?.venue ?? 'A confirmar'}\n\nJugadores convocados (${selectedPlayers.length}):\n${lista}\n\nPresentarse 30 min antes.\n¡Vamos Banfield! 💚`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const selectedByPosition = POSITIONS.map(pos => ({
    position: pos,
    count: selectedPlayers.filter(p => p.primary_position === pos).length,
  }))

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          CONVOCATORIA
        </h1>
      </div>

      {/* Selectores */}
      <div className="space-y-2">
        <select
          value={selectedCategory}
          onChange={e => { setSelectedCategory(e.target.value); setSelected(new Set()); setSelectedTira(null); }}
          className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
          style={{ borderColor: '#00843D', color: '#00843D' }}
        >
          {activeCategories.map(c => <option key={c.id} value={c.id}>Categoría {c.name}</option>)}
        </select>

        <select
          value={selectedEvent}
          onChange={e => setSelectedEvent(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
        >
          <option value="">Seleccionar partido...</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              vs. {m.rival} — {new Date(m.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </option>
          ))}
        </select>

        {/* Filtro por tira */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <button
            onClick={() => { setSelectedTira(null); setSelected(new Set()); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              selectedTira === null ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
            }`}
            style={selectedTira === null ? { backgroundColor: '#00843D' } : {}}
          >
            Todas
          </button>
          {tirasInCategory.map(tira => (
            <button
              key={tira}
              onClick={() => { setSelectedTira(tira); setSelected(new Set()); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                selectedTira === tira ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
              }`}
              style={selectedTira === tira ? { backgroundColor: TIRA_COLORS[tira] } : {}}
            >
              {TIRA_LABELS[tira]}
            </button>
          ))}
        </div>
      </div>

      {/* Slider de umbral */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Asistencia mínima para ser convocado</p>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
              {threshold}%
            </p>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-full accent-[#00843D]"
          />
          <p className="text-[10px] text-muted-foreground">
            Default: {demoEligibilityConfig.min_attendance_percentage}% · Modificable para esta convocatoria.
          </p>
        </CardContent>
      </Card>

      {/* Resumen de convocados por posición */}
      {selected.size > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-3">
            <p className="text-xs font-bold mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              CONVOCADOS ({selected.size})
            </p>
            <div className="flex flex-wrap gap-1.5">
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
          <div key={pos} className="space-y-1.5">
            <div className="flex items-center gap-2 mt-3">
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
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: isSelected ? POSITION_COLORS[pos] : '#9ca3af' }}
                      >
                        {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.full_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white"
                            style={{ backgroundColor: TIRA_COLORS[p.tira] }}
                          >
                            {TIRA_LABELS[p.tira]}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Asist: <strong>{p.stats.percentage}%</strong> · {p.convocation_count} conv.
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={18} style={{ color: POSITION_COLORS[pos] }} className="flex-shrink-0" />}
                    </CardContent>
                  </Card>
                </button>
              )
            })}

            {notEligibleOfPos.length > 0 && (
              <details className="opacity-70">
                <summary className="text-xs text-gray-400 cursor-pointer flex items-center gap-1 py-1 px-1">
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
                          <p className="text-[10px] text-gray-400">
                            <span style={{ color: TIRA_COLORS[p.tira] }}>{TIRA_LABELS[p.tira]}</span>
                            {' · '}Asist: {p.stats.percentage}%
                          </p>
                        </div>
                        <button
                          onClick={() => togglePlayer(p.id)}
                          className="text-[10px] px-2 py-0.5 rounded border text-gray-500 hover:bg-white"
                        >
                          Excepción
                        </button>
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
            className="w-full py-3 rounded-xl font-bold text-sm md:text-base text-white flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={18} />
            ENVIAR ({selected.size}) por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
