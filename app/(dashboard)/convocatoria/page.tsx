'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, CheckCircle2, MessageCircle, Lock, List, LayoutGrid, ExternalLink, Unlock } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers, demoCategories, demoEvents, getAttendanceStats, getMatchAttendanceStats, demoEligibilityConfig, demoProfes, getAssignmentsForProfe } from '@/lib/demo-data'
import { getAvatarUrl } from '@/lib/avatars'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { persistConvocation } from '@/lib/data/ops-store'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS, type Position, type Tira } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function ConvocatoriaPage() {
  const club = useCurrentClub()
  const [selectedProfe, setSelectedProfe] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedTira, setSelectedTira] = useState<Tira | null>(null)
  const [convocarDeOtra, setConvocarDeOtra] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(demoEvents.filter(e => e.event_type === 'match')[0]?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Flujo guardar → enviar: primero guardar localmente, después enviar por WhatsApp
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [practiceThreshold, setPracticeThreshold] = useState(demoEligibilityConfig.min_practice_percentage)
  const [matchThreshold, setMatchThreshold] = useState(demoEligibilityConfig.min_match_percentage)
  const [view, setView] = useState<'list' | 'pitch'>('list')

  const practiceModified = practiceThreshold !== demoEligibilityConfig.min_practice_percentage
  const matchModified = matchThreshold !== demoEligibilityConfig.min_match_percentage
  const anyModified = practiceModified || matchModified

  // Si hay profe seleccionado, limitar categorías y tiras a las que tiene asignadas
  const profeAssignments = selectedProfe ? getAssignmentsForProfe(selectedProfe) : []
  const allCategoriesActive = demoCategories.filter(c => c.is_active)
  const activeCategories = selectedProfe
    ? allCategoriesActive.filter(c => profeAssignments.some(a => a.category_id === c.id))
    : allCategoriesActive
  const effectiveCategory = activeCategories.some(c => c.id === selectedCategory)
    ? selectedCategory
    : (activeCategories[0]?.id ?? selectedCategory)

  const matches = demoEvents.filter(e => e.event_type === 'match' && e.category_id === effectiveCategory)
  // Tiras de la categoría que efectivamente tienen jugadores
  const tirasInCategoryAll = ALL_TIRAS.filter(t =>
    demoPlayers.some(p => p.category_id === effectiveCategory && p.tira === t)
  )
  // Tiras asignadas al profe (si hay profe seleccionado)
  const tirasAsignadas = selectedProfe
    ? tirasInCategoryAll.filter(t => profeAssignments.some(a => a.category_id === effectiveCategory && a.tira === t))
    : tirasInCategoryAll
  // Tiras visibles según toggle: por defecto solo las del profe; si activa "convocar de otra", todas
  const tirasInCategory = selectedProfe && !convocarDeOtra ? tirasAsignadas : tirasInCategoryAll
  const hayOtrasTiras = selectedProfe && tirasInCategoryAll.length > tirasAsignadas.length

  // Tira obligatoria: si no hay una seleccionada (o la actual no está disponible), elegir la primera
  const effectiveTira: Tira | null = selectedTira && tirasInCategory.includes(selectedTira)
    ? selectedTira
    : (tirasInCategory[0] ?? null)

  const players = effectiveTira
    ? demoPlayers.filter(p => p.category_id === effectiveCategory && p.is_active && p.tira === effectiveTira)
    : []

  const playersWithStats = players.map(p => {
    const practiceStats = getAttendanceStats(p.id, selectedCategory)
    const matchStats = getMatchAttendanceStats(p.id)
    const meetsPractice = practiceStats.percentage >= practiceThreshold || practiceStats.total === 0
    const meetsMatch = matchStats.percentage >= matchThreshold || matchStats.total === 0
    const eligible = meetsPractice && meetsMatch
    return { ...p, practiceStats, matchStats, meetsPractice, meetsMatch, eligible }
  })

  function togglePlayer(id: string) {
    // Si modifico la selección, vuelvo a estado "no guardado" (hay que guardar de nuevo)
    if (savedAt) setSavedAt(null)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Cálculo de cuántos jugadores convocar según el deporte de la categoría del partido
  const eventCat = demoCategories.find(c => c.id === effectiveCategory)
  const sportCode = eventCat?.sport_format_code ?? 'football_11'
  const targetByPos = sportCode === 'football_11'  ? { titulares: 11, suplentes: 5 }
                    : sportCode === 'baby_6'       ? { titulares: 6,  suplentes: 3 }
                    : sportCode === 'baby_5'       ? { titulares: 5,  suplentes: 3 }
                    : sportCode === 'futsal'       ? { titulares: 5,  suplentes: 5 }
                    : sportCode === 'hockey_field' ? { titulares: 11, suplentes: 5 }
                    : sportCode === 'volleyball'   ? { titulares: 6,  suplentes: 6 }
                    : sportCode === 'basketball'   ? { titulares: 5,  suplentes: 5 }
                    : sportCode === 'rugby_7'      ? { titulares: 7,  suplentes: 5 }
                    : sportCode === 'rugby_15'     ? { titulares: 15, suplentes: 8 }
                    : sportCode === 'handball_7'   ? { titulares: 7,  suplentes: 7 }
                    :                                 { titulares: 11, suplentes: 5 }
  const targetTotal = targetByPos.titulares + targetByPos.suplentes
  const targetMin = targetByPos.titulares
  const selectedCount = selected.size
  const selectedPercent = Math.min(100, Math.round((selectedCount / targetTotal) * 100))
  const reachedMin = selectedCount >= targetMin
  const reachedMax = selectedCount >= targetTotal

  function saveConvocatoria() {
    const now = new Date().toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    setSavedAt(now)
    // PRODUCCIÓN: persistir convocatoria en Supabase (club real). Requiere un evento real seleccionado.
    if (isRealClub(club.id) && selectedEvent) {
      persistConvocation(club.id, { eventId: selectedEvent, playerIds: Array.from(selected) })
        .then(res => { if (!res.ok) console.error('No se pudo persistir la convocatoria:', res.error) })
    }
  }

  const selectedPlayers = playersWithStats.filter(p => selected.has(p.id))

  function generateWhatsApp() {
    const event = demoEvents.find(e => e.id === selectedEvent)
    const cat = demoCategories.find(c => c.id === effectiveCategory)
    const date = event ? new Date(event.scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Por definir'
    const time = event ? new Date(event.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''
    const ordered = [...selectedPlayers].sort(
      (a, b) => POSITIONS.indexOf(a.primary_position) - POSITIONS.indexOf(b.primary_position)
    )
    const lista = ordered.map((p, i) => `${i + 1}. ${p.full_name} (${POSITION_LABELS[p.primary_position]})`).join('\n')
    const tiraInfo = effectiveTira ? ` — ${TIRA_LABELS[effectiveTira]}` : ''
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
          value={selectedProfe}
          onChange={e => { setSelectedProfe(e.target.value); setSelected(new Set()); setSelectedTira(null); setConvocarDeOtra(false); }}
          className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
        >
          <option value="">Todos los profes (admin)</option>
          {demoProfes.filter(p => p.is_active).map(p => (
            <option key={p.id} value={p.id}>👤 {p.full_name}</option>
          ))}
        </select>

        <select
          value={effectiveCategory}
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

        {/* Filtro por tira — obligatorio, no se pueden mezclar */}
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 tracking-wider">Tira (obligatoria)</p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
            {tirasInCategory.map(tira => (
              <button
                key={tira}
                onClick={() => { setSelectedTira(tira); setSelected(new Set()); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
                  effectiveTira === tira ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
                }`}
                style={effectiveTira === tira ? { backgroundColor: TIRA_COLORS[tira] } : {}}
              >
                {TIRA_LABELS[tira]}
              </button>
            ))}
          </div>
          {hayOtrasTiras && (
            <label className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={convocarDeOtra}
                onChange={e => { setConvocarDeOtra(e.target.checked); setSelectedTira(null); setSelected(new Set()); }}
                className="accent-[#00843D]"
              />
              <Unlock size={12} />
              Convocar de otra tira (fuera de mis asignaciones)
            </label>
          )}
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
            Default del club: 🏃 {demoEligibilityConfig.min_practice_percentage}% prácticas · ⚽ {demoEligibilityConfig.min_match_percentage}% partidos. Elegible si cumple <strong>ambos</strong>.
          </p>

          {anyModified && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
              <span>⚠️</span>
              <div>
                <p className="font-semibold">Vas a modificar el default del club</p>
                <p className="text-amber-700">
                  Los nuevos umbrales para esta convocatoria:
                  {practiceModified && <> 🏃 <strong>{practiceThreshold}%</strong></>}
                  {matchModified && <> ⚽ <strong>{matchThreshold}%</strong></>}
                  . Al guardar, queda registro en el log con tu nombre y motivo.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de convocados + toggle de vista */}
      {selected.size > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${reachedMin ? '#00843D' : '#F59E0B'}` }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <p className="text-xs font-bold uppercase" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
                  Convocados
                </p>
                <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: reachedMin ? '#00843D' : '#F59E0B' }}>
                  {selectedCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  / {targetTotal} <span className="text-[10px]">(min {targetMin})</span>
                </p>
              </div>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setView('list')} className={`px-2 py-1 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
                  <List size={14} />
                </button>
                <button onClick={() => setView('pitch')} className={`px-2 py-1 rounded ${view === 'pitch' ? 'bg-white shadow-sm' : ''}`}>
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${selectedPercent}%`,
                  backgroundColor: reachedMax ? '#16a34a' : reachedMin ? '#00843D' : '#F59E0B',
                }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1 mb-2">
              {!reachedMin && (
                <>Te faltan <strong>{targetMin - selectedCount}</strong> jugadores para llegar al mínimo de titulares ({targetMin}).</>
              )}
              {reachedMin && !reachedMax && (
                <>✓ Mínimo de titulares cubierto. Podés sumar hasta <strong>{targetTotal - selectedCount}</strong> suplentes más.</>
              )}
              {reachedMax && (
                <>✓ Convocatoria completa ({targetByPos.titulares} titulares + {targetByPos.suplentes} suplentes).</>
              )}
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

      {/* Vista de cancha */}
      {view === 'pitch' && selected.size > 0 && (
        <div className="relative overflow-hidden rounded-xl shadow-lg mx-auto box-border" style={{ aspectRatio: '2/3', width: 'min(100%, calc(100vw - 32px))', maxWidth: 480 }}>
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
                    className="w-12 h-12 rounded-full bg-white border-2 shadow-lg overflow-hidden"
                    style={{ borderColor: POSITION_COLORS[p.primary_position] }}
                  >
                    <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
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
                        className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 bg-white"
                        style={{ borderColor: isSelected ? POSITION_COLORS[pos] : '#d1d5db' }}
                      >
                        <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
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
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 bg-white flex-shrink-0 grayscale">
                          <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
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

      {/* Botones sticky — flujo: 1) Guardar  2) Enviar por WhatsApp */}
      {selected.size > 0 && (
        <div className="sticky bottom-20 md:bottom-4 pt-2 space-y-2">
          {!savedAt ? (
            <button
              onClick={saveConvocatoria}
              className="w-full py-3 rounded-xl font-bold text-sm md:text-base text-white flex items-center justify-center gap-2 shadow-lg"
              style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
            >
              <CheckCircle2 size={18} />
              GUARDAR CONVOCATORIA ({selected.size})
            </button>
          ) : (
            <>
              <Card className="border-0 shadow-sm bg-green-50 border-l-4 border-l-green-600">
                <CardContent className="p-2.5 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-800">Convocatoria guardada</p>
                    <p className="text-[11px] text-green-700">{selected.size} jugadores · {savedAt}</p>
                  </div>
                  <button onClick={() => setSavedAt(null)} className="text-[11px] text-green-700 underline">
                    Editar
                  </button>
                </CardContent>
              </Card>
              <button
                onClick={generateWhatsApp}
                className="w-full py-3 rounded-xl font-bold text-sm md:text-base text-white flex items-center justify-center gap-2 shadow-lg"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                ENVIAR por WhatsApp
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
