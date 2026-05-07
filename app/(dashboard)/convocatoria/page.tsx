'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, CheckCircle2, MessageCircle, Lock, List, LayoutGrid, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers, demoCategories, demoEvents, getAttendanceStats, getMatchAttendanceStats, demoEligibilityConfig } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS, type Position, type Tira } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function ConvocatoriaPage() {
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedTira, setSelectedTira] = useState<Tira | null>(null)
  const [selectedEvent, setSelectedEvent] = useState(demoEvents.filter(e => e.event_type === 'match')[0]?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [practiceThreshold, setPracticeThreshold] = useState(demoEligibilityConfig.min_attendance_percentage)
  const [matchThreshold, setMatchThreshold] = useState(50)
  const [view, setView] = useState<'list' | 'pitch'>('list')

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
    const practiceStats = getAttendanceStats(p.id, selectedCategory)
    const matchStats = getMatchAttendanceStats(p.id)
    const meetsPractice = practiceStats.percentage >= practiceThreshold || practiceStats.total === 0
    const meetsMatch = matchStats.percentage >= matchThreshold || matchStats.total === 0
    const eligible = meetsPractice && meetsMatch
    return { ...p, practiceStats, matchStats, meetsPractice, meetsMatch, eligible }
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

      {/* Sliders dobles: prácticas y partidos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1">
                🏃 Mínimo en <strong>prácticas</strong>
              </p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
                {practiceThreshold}%
              </p>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={practiceThreshold}
              onChange={e => setPracticeThreshold(Number(e.target.value))}
              className="w-full accent-[#00843D]"
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1">
                ⚽ Mínimo en <strong>partidos</strong>
              </p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>
                {matchThreshold}%
              </p>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={matchThreshold}
              onChange={e => setMatchThreshold(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Default global: {demoEligibilityConfig.min_attendance_percentage}% · Un jugador es elegible si cumple <strong>ambos</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Resumen de convocados + toggle de vista */}
      {selected.size > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                CONVOCADOS ({selected.size})
              </p>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setView('list')} className={`px-2 py-1 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
                  <List size={14} />
                </button>
                <button onClick={() => setView('pitch')} className={`px-2 py-1 rounded ${view === 'pitch' ? 'bg-white shadow-sm' : ''}`}>
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
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

      {/* Vista de cancha */}
      {view === 'pitch' && selected.size > 0 && (
        <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: '2/3' }}>
          {/* Cancha de fútbol */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }}>
            {/* Líneas */}
            <svg viewBox="0 0 200 300" className="w-full h-full">
              <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <line x1="5" y1="150" x2="195" y2="150" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <circle cx="100" cy="150" r="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <circle cx="100" cy="150" r="1" fill="white" opacity="0.7" />
              {/* Áreas */}
              <rect x="50" y="5" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="50" y="260" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="75" y="5" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="75" y="280" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
            </svg>
          </div>

          {/* Jugadores posicionados */}
          {(() => {
            const ordered = [...selectedPlayers].sort(
              (a, b) => POSITIONS.indexOf(a.primary_position) - POSITIONS.indexOf(b.primary_position)
            )
            const layouts: Record<string, { y: number; positions: number[] }> = {
              arquero: { y: 92, positions: [50] },
              defensor: { y: 70, positions: [] },
              mediocampista: { y: 45, positions: [] },
              delantero: { y: 18, positions: [] },
            }
            // Distribuir x entre los de cada posición
            for (const pos of POSITIONS) {
              const count = ordered.filter(p => p.primary_position === pos).length
              const xs: number[] = []
              for (let i = 0; i < count; i++) {
                xs.push(((i + 1) / (count + 1)) * 100)
              }
              layouts[pos].positions = xs
            }
            const counters: Record<string, number> = { arquero: 0, defensor: 0, mediocampista: 0, delantero: 0 }
            return ordered.map(p => {
              const layout = layouts[p.primary_position]
              const x = layout.positions[counters[p.primary_position]++]
              const y = layout.y
              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="w-12 h-12 rounded-full bg-white border-2 shadow-lg flex items-center justify-center text-[10px] font-bold"
                    style={{ borderColor: POSITION_COLORS[p.primary_position], color: POSITION_COLORS[p.primary_position] }}
                  >
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <p className="text-[9px] text-white text-center mt-0.5 font-bold leading-tight whitespace-nowrap drop-shadow-md">
                    {p.full_name.split(' ').slice(-1)[0]}
                  </p>
                </div>
              )
            })
          })()}
        </div>
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
                <Card
                  key={p.id}
                  className="border-0 shadow-sm transition-all"
                  style={{
                    borderLeft: `4px solid ${isSelected ? POSITION_COLORS[pos] : '#e5e7eb'}`,
                    backgroundColor: isSelected ? '#f0fdf4' : 'white',
                  }}
                >
                  <CardContent className="p-2.5 flex items-center gap-2.5">
                    <button
                      onClick={() => togglePlayer(p.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                    >
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
                          <span className="text-[10px] flex items-center gap-1.5">
                            <span style={{ color: p.meetsPractice ? '#00843D' : '#DC2626' }}>
                              🏃 <strong>{p.practiceStats.percentage}%</strong>
                            </span>
                            <span style={{ color: p.meetsMatch ? '#1d4ed8' : '#DC2626' }}>
                              ⚽ <strong>{p.matchStats.percentage}%</strong>
                            </span>
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 size={18} style={{ color: POSITION_COLORS[pos] }} className="flex-shrink-0" />}
                    </button>
                    <Link href={`/socios/${p.id}`} className="p-1.5 rounded hover:bg-gray-100 text-muted-foreground" title="Ver/editar ficha">
                      <ExternalLink size={14} />
                    </Link>
                  </CardContent>
                </Card>
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
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span style={{ color: TIRA_COLORS[p.tira] }}>{TIRA_LABELS[p.tira]}</span>
                            <span style={{ color: p.meetsPractice ? '#00843D' : '#DC2626' }}>
                              🏃 {p.practiceStats.percentage}%
                            </span>
                            <span style={{ color: p.meetsMatch ? '#1d4ed8' : '#DC2626' }}>
                              ⚽ {p.matchStats.percentage}%
                            </span>
                          </div>
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
