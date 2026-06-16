'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, User, Lock, Unlock, Clock, Radio, Plus, X, Search, UserPlus, MapPin, Sparkles, Circle } from 'lucide-react'
import { demoProfes, getAssignmentsForProfe, getProfesForTira, getPlayersForClub, getCategoriesForClub } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'
import { getTiraLabel, getTiraColor, getTirasForSport } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'
import { getSessionsForDay, TIRA_GROUPS, tiraGroupOf } from '@/lib/training-schedule'
import { getActiveSlotForNow, getNextSlotForDay, type TrainingSlot } from '@/lib/training-roster'
import { getAvatarUrl } from '@/lib/avatars'
import { isRealClub } from '@/lib/real-clubs'
import { persistAttendanceClose } from '@/lib/data/attendance-store'

type AttendanceStatus = 'unmarked' | 'present' | 'late' | 'absent_unjustified' | 'absent_justified'

const statusConfig = {
  unmarked:           { label: 'Sin marcar',         color: '#9ca3af', icon: Circle },
  present:            { label: 'Presente',           color: '#00843D', icon: CheckCircle2 },
  late:               { label: 'Llegó tarde',        color: '#F59E0B', icon: Clock },
  absent_unjustified: { label: 'Ausente',            color: '#DC2626', icon: XCircle },
  absent_justified:   { label: 'Justificado',        color: '#3b82f6', icon: AlertCircle },
}

// Tarde cuenta como presente para % de asistencia (regla de elegibilidad)
function isPresentForEligibility(s: AttendanceStatus): boolean {
  return s === 'present' || s === 'late'
}

const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function AsistenciaPage() {
  const club = useCurrentClub()
  const clubPlayers = useMemo(() => getPlayersForClub(club.id), [club.id])
  const clubCategories = useMemo(() => getCategoriesForClub(club.id), [club.id])
  const activeCategories = clubCategories.filter(c => c.is_active)
  const clubSportCode = (club.default_sport_code ?? 'football_11') as SportCode
  const clubTiras = getTirasForSport(clubSportCode)
  function playerSport(p: { category_id: string }): SportCode {
    const c = clubCategories.find(cc => cc.id === p.category_id)
    return (c?.sport_format_code ?? clubSportCode) as SportCode
  }

  // Sesiones del día actual (hoy)
  const now = new Date()
  const sessionsToday = getSessionsForDay(now, activeCategories.map(c => ({ id: c.id, name: c.name })))
  const liveSession = sessionsToday.find(s => s.status === 'live')
  const upcomingSession = sessionsToday.find(s => s.status === 'upcoming')

  const initialCategory = liveSession?.category_id ?? upcomingSession?.category_id ?? activeCategories[0].id
  const initialGroup = liveSession?.group ?? upcomingSession?.group ?? 'group-a'
  const initialTira = (TIRA_GROUPS.find(g => g.id === initialGroup)?.tiras[0]) ?? 'metro'

  // ¿Hay slot del cronograma cargable ahora o próximamente?
  const activeSlot = getActiveSlotForNow(now)
  const nextSlot = activeSlot ?? getNextSlotForDay(now)
  const [usedSlot, setUsedSlot] = useState(false)
  const [dismissedSlot, setDismissedSlot] = useState(false)

  // Multi-select: el profe arma la sesión real (sin rigidez de turno)
  const [selectedProfe, setSelectedProfe] = useState<string>(nextSlot?.profe_titular_id ?? '')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(nextSlot?.category_ids ?? [initialCategory])
  )
  const initialTiras = (nextSlot?.tiras ?? TIRA_GROUPS.find(g => g.id === initialGroup)?.tiras ?? ['metro']) as Tira[]
  const [selectedTiras, setSelectedTiras] = useState<Set<Tira>>(new Set(initialTiras))

  function loadSlot(slot: TrainingSlot) {
    setSelectedCategories(new Set(slot.category_ids))
    setSelectedTiras(new Set(slot.tiras))
    setSelectedProfe(slot.profe_titular_id ?? '')
    setUsedSlot(true)
    setAttendance({})
  }
  const sessionColor = Array.from(selectedTiras)[0] ? TIRA_COLORS[Array.from(selectedTiras)[0]] : 'var(--club-primary, #00843D)'
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [closed, setClosed] = useState(false)
  const [log, setLog] = useState<{ action: 'open' | 'close' | 'reopen'; user: string; at: string }[]>([])
  // Visitantes (jugadores de otra tira) y no anotados (sin ficha aún)
  const [guests, setGuests] = useState<{ id: string; type: 'visitor' | 'unregistered'; name: string; tira?: Tira; categoryName?: string; notes?: string }[]>([])
  const [showAddGuest, setShowAddGuest] = useState(false)

  const dayLabels = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const todayLabel = dayLabels[now.getDay()]

  // Si hay profe seleccionado, limitar categorías y tiras a las que tiene asignadas
  const profeAssignments = selectedProfe ? getAssignmentsForProfe(selectedProfe) : []
  const allowedCategoryIds = selectedProfe
    ? Array.from(new Set(profeAssignments.map(a => a.category_id)))
    : activeCategories.map(c => c.id)
  const filteredCategories = activeCategories.filter(c => allowedCategoryIds.includes(c.id))

  // Helpers para multi-select
  function toggleCat(catId: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.has(catId) ? next.delete(catId) : next.add(catId)
      return next
    })
    setAttendance({})
  }
  function toggleTira(t: Tira) {
    setSelectedTiras(prev => {
      const next = new Set(prev)
      next.has(t) ? next.delete(t) : next.add(t)
      return next
    })
    setAttendance({})
  }

  // Jugadores: TODOS los que estén en las (categorías × tiras) seleccionadas — sin filtro de turno
  const players = clubPlayers.filter(p =>
    selectedCategories.has(p.category_id) && selectedTiras.has(p.tira) && p.is_active
  )

  // Agrupar por categoría para mostrar header de cat. en la lista
  const playersByCategory = activeCategories
    .filter(c => selectedCategories.has(c.id))
    .map(c => ({
      category: c,
      players: players.filter(p => p.category_id === c.id),
    }))
    .filter(g => g.players.length > 0)

  // Profes asignados a cualquiera de las (cat × tira) seleccionadas
  const profesAsignados = Array.from(new Set(
    Array.from(selectedCategories).flatMap(catId =>
      Array.from(selectedTiras).flatMap(t => getProfesForTira(catId, t).map(p => p.id))
    )
  )).map(id => demoProfes.find(p => p.id === id)!).filter(Boolean)

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  function getStatus(playerId: string): AttendanceStatus {
    return attendance[playerId] ?? 'unmarked'
  }

  function setStatus(playerId: string, status: AttendanceStatus) {
    setAttendance(prev => ({ ...prev, [playerId]: status }))
  }

  // Cycle por tap en toda la ficha: unmarked → present → late → absent → unmarked
  function cycleStatus(playerId: string) {
    const current = getStatus(playerId)
    const next: AttendanceStatus =
      current === 'unmarked' ? 'present' :
      current === 'present' ? 'late' :
      current === 'late' ? 'absent_unjustified' :
      'unmarked'
    setAttendance(prev => ({ ...prev, [playerId]: next }))
  }

  // Tarde cuenta como presente para %; sin marcar cuenta como ausente
  const presentCount = players.filter(p => isPresentForEligibility(getStatus(p.id))).length
  const lateCount = players.filter(p => getStatus(p.id) === 'late').length
  const absentCount = players.filter(p => !isPresentForEligibility(getStatus(p.id))).length
  const unmarkedCount = players.filter(p => getStatus(p.id) === 'unmarked').length
  const livePercent = players.length > 0 ? Math.round((presentCount / players.length) * 100) : 0

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          ASISTENCIA
        </h1>
      </div>

      <p className="text-xs text-muted-foreground capitalize">{today}</p>

      {/* Clases del día */}
      {sessionsToday.length > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Radio size={14} className="text-green-600" />
              <p className="text-xs font-bold uppercase text-muted-foreground capitalize" style={{ fontFamily: "var(--font-barlow)" }}>
                Clases de hoy ({todayLabel}) — {sessionsToday.length}
              </p>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {sessionsToday.map((s, idx) => {
                const isSelected = selectedCategories.has(s.category_id) && (TIRA_GROUPS.find(g => g.id === s.group)?.tiras ?? []).every(t => selectedTiras.has(t))
                return (
                  <button
                    key={`${s.category_id}-${s.group}-${idx}`}
                    onClick={() => {
                      const groupTiras = TIRA_GROUPS.find(g => g.id === s.group)?.tiras ?? []
                      setSelectedCategories(new Set([s.category_id]))
                      setSelectedTiras(new Set(groupTiras))
                      setAttendance({})
                      setClosed(false)
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-all ${isSelected ? 'shadow-md' : ''}`}
                    style={isSelected ? { backgroundColor: `${s.group_color}10`, borderColor: s.group_color } : { borderColor: '#e5e7eb' }}
                  >
                    {s.status === 'live' && (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-bold uppercase animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> EN VIVO
                      </span>
                    )}
                    {s.status === 'upcoming' && (
                      <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold uppercase">
                        En {Math.floor(s.starts_in_min! / 60) > 0 ? `${Math.floor(s.starts_in_min! / 60)}h ` : ''}{s.starts_in_min! % 60}m
                      </span>
                    )}
                    {s.status === 'past' && (
                      <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-bold uppercase">
                        Terminó
                      </span>
                    )}
                    <span className="text-[11px] font-bold flex-shrink-0">{s.start}–{s.end}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold truncate">Cat. {s.category_name}</p>
                      <p className="text-[10px] truncate" style={{ color: s.group_color }}>{s.group_name}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de slot del cronograma */}
      {nextSlot && !usedSlot && !dismissedSlot && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #7c3aed', background: 'linear-gradient(135deg, #f5f3ff 0%, white 100%)' }}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={14} className="text-purple-600 flex-shrink-0" />
                <p className="text-xs font-bold uppercase text-purple-800 truncate" style={{ fontFamily: "var(--font-barlow)" }}>
                  {activeSlot ? '📋 Sesión del cronograma' : '📋 Próxima sesión'}
                </p>
              </div>
              <button onClick={() => setDismissedSlot(true)} className="p-1 rounded text-purple-400 hover:bg-purple-100 flex-shrink-0">
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-bold">{nextSlot.start_time}–{nextSlot.end_time}</span>
              <span className="flex items-center gap-1"><MapPin size={10} className="text-purple-600" /> Cancha {nextSlot.court}</span>
              <span className="text-muted-foreground">·</span>
              {nextSlot.category_ids.map(cid => {
                const c = clubCategories.find(x => x.id === cid)
                return c ? <Badge key={cid} className="text-[10px] bg-purple-100 text-purple-700 border-0">{c.name}</Badge> : null
              })}
              {nextSlot.tiras.map(t => (
                <Badge key={t} className="text-[10px] border-0 text-white" style={{ backgroundColor: getTiraColor(t, clubSportCode) }}>
                  {getTiraLabel(t, clubSportCode)}
                </Badge>
              ))}
            </div>
            {(() => {
              const tit = demoProfes.find(p => p.id === nextSlot.profe_titular_id)
              const sups = (nextSlot.profe_suplentes_ids ?? []).map(id => demoProfes.find(p => p.id === id)).filter(Boolean) as typeof demoProfes
              return (
                <p className="text-[11px] text-muted-foreground">
                  Titular: <strong>{tit?.full_name ?? '—'}</strong>
                  {sups.length > 0 && <> · Suplentes ({sups.length}): <strong>{sups.map(s => s.full_name).join(', ')}</strong></>}
                </p>
              )
            })()}
            <button
              onClick={() => loadSlot(nextSlot)}
              className="w-full py-2 rounded-lg text-white font-bold text-sm"
              style={{ backgroundColor: '#7c3aed' }}
            >
              CARGAR ESTA SESIÓN →
            </button>
            <p className="text-[10px] text-muted-foreground text-center">
              Carga las tiras, categorías y profe titular automáticamente. Después podés modificar todo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Configurador de sesión */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid var(--club-primary, #00843D)' }}>
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow)" }}>
              ¿Qué estás dando ahora?
            </p>
            <span className="text-[10px] text-muted-foreground">
              {players.length} chico{players.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Profe a cargo */}
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Profe a cargo</label>
            <select
              value={selectedProfe}
              onChange={e => setSelectedProfe(e.target.value)}
              className="w-full mt-1 px-2.5 py-1.5 rounded border text-sm bg-white"
            >
              <option value="">— Sin firmar todavía —</option>
              {demoProfes.filter(p => p.is_active).map(p => (
                <option key={p.id} value={p.id}>👤 {p.full_name}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Si te suplantó otro profe hoy, elegí su nombre. Queda registrado en la firma de la asistencia.
            </p>
          </div>

          {/* Tiras (multi-select) */}
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Tiras en esta sesión</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {(clubTiras.length > 0 ? clubTiras.map(x => x.code) : (['metro', 'liga1', 'liga2', 'edefi'] as string[])).map(t => {
                const sel = selectedTiras.has(t)
                return (
                  <button
                    key={t}
                    onClick={() => toggleTira(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={sel ? { backgroundColor: getTiraColor(t, clubSportCode) } : {}}
                  >
                    {getTiraLabel(t, clubSportCode)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categorías (multi-select) */}
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Categorías</label>
            <div className="flex gap-1 mt-1 flex-wrap">
              {filteredCategories.map(c => {
                const sel = selectedCategories.has(c.id)
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tocá las categorías que están entrenando ahora. Por la mañana es común que se agrupen varias.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Profes asignados a esta tira */}
      {profesAsignados.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <User size={12} className="text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">A cargo:</span>
          {profesAsignados.map((p, i) => (
            <span key={p.id} className="font-semibold" style={{ color: sessionColor }}>
              {p.full_name}{i < profesAsignados.length - 1 ? ',' : ''}
            </span>
          ))}
        </div>
      )}

      {/* % vivo de asistencia */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${sessionColor}` }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Asistencia en vivo</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: sessionColor }}>
              {livePercent}%
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${livePercent}%`, backgroundColor: sessionColor }}
            />
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs">
            <span className="text-green-700 font-semibold">{presentCount} presentes</span>
            {lateCount > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-amber-600 font-semibold">{lateCount} tarde</span>
              </>
            )}
            <span className="text-gray-400">·</span>
            <span className="text-red-600 font-semibold">{absentCount} ausentes</span>
            {unmarkedCount > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 italic">({unmarkedCount} sin marcar)</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-0.5">
            "Tarde" suma para % de elegibilidad; "sin marcar" cuenta como ausente al cerrar.
          </p>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Tocá toda la ficha para ciclar: <strong>Vino</strong> → <strong>Tarde</strong> → <strong>No vino</strong> → sin marcar. O usá los botones para ir directo.
      </p>

      {/* Lista */}
      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No hay jugadores en esta tira.</p>
        )}
        {players.map(player => {
          const status = getStatus(player.id)
          const { color } = statusConfig[status]
          // Fondo tenue según estado para que la ficha "se pinte"
          const cardBg =
            status === 'present' ? '#dcfce7' :
            status === 'late' ? '#fef3c7' :
            status === 'absent_unjustified' ? '#fee2e2' :
            status === 'absent_justified' ? '#dbeafe' :
            '#ffffff'
          return (
            <Card
              key={player.id}
              className={`border-0 shadow-sm transition-colors ${closed ? '' : 'cursor-pointer active:scale-[0.99]'}`}
              style={{ borderLeft: `4px solid ${color}`, backgroundColor: cardBg }}
              onClick={() => !closed && cycleStatus(player.id)}
            >
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 flex-shrink-0 bg-white" style={{ borderColor: color }}>
                  <img src={getAvatarUrl(player)} alt={player.full_name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{player.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: getTiraColor(player.tira, playerSport(player)) }}>
                      {getTiraLabel(player.tira, playerSport(player))}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Conv: {player.convocation_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => !closed && setStatus(player.id, status === 'present' ? 'unmarked' : 'present')}
                    disabled={closed}
                    title="Vino"
                    className={`w-8 h-8 rounded-md flex items-center justify-center border ${status === 'present' ? 'text-white border-transparent' : 'border-gray-200 text-gray-400 bg-white'}`}
                    style={status === 'present' ? { backgroundColor: '#00843D' } : {}}
                  ><CheckCircle2 size={15} /></button>
                  <button
                    onClick={() => !closed && setStatus(player.id, status === 'late' ? 'unmarked' : 'late')}
                    disabled={closed}
                    title="Llegó tarde"
                    className={`w-8 h-8 rounded-md flex items-center justify-center border ${status === 'late' ? 'text-white border-transparent' : 'border-gray-200 text-gray-400 bg-white'}`}
                    style={status === 'late' ? { backgroundColor: '#F59E0B' } : {}}
                  ><Clock size={15} /></button>
                  <button
                    onClick={() => !closed && setStatus(player.id, status === 'absent_unjustified' ? 'unmarked' : 'absent_unjustified')}
                    disabled={closed}
                    title="No vino"
                    className={`w-8 h-8 rounded-md flex items-center justify-center border ${status === 'absent_unjustified' ? 'text-white border-transparent' : 'border-gray-200 text-gray-400 bg-white'}`}
                    style={status === 'absent_unjustified' ? { backgroundColor: '#DC2626' } : {}}
                  ><XCircle size={15} /></button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Visitantes y no anotados */}
      {!closed && (
        <>
          <div className="flex items-center justify-between mt-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              Otros que vinieron ({guests.length})
            </h3>
            <button
              onClick={() => setShowAddGuest(true)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded text-white"
              style={{ backgroundColor: '#7c3aed' }}
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-2">
            Jugadores de otra tira/categoría o chicos no anotados que están participando hoy. Cuenta como participación.
          </p>

          {guests.map(g => (
            <Card key={g.id} className="border-0 shadow-sm" style={{ borderLeft: '4px solid #7c3aed' }}>
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#7c3aed' }}>
                  {g.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{g.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {g.type === 'visitor' && g.tira && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: getTiraColor(g.tira, clubSportCode) }}>
                        Visita de {getTiraLabel(g.tira, clubSportCode)}
                      </span>
                    )}
                    {g.type === 'unregistered' && (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">
                        ⚠️ NO ANOTADO
                      </Badge>
                    )}
                    {g.categoryName && <span className="text-[10px] text-muted-foreground">Cat. {g.categoryName}</span>}
                  </div>
                  {g.notes && <p className="text-[10px] text-muted-foreground mt-0.5 italic">"{g.notes}"</p>}
                </div>
                <button
                  onClick={() => setGuests(guests.filter(x => x.id !== g.id))}
                  className="p-1 rounded text-red-400 hover:bg-red-50 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Modal agregar visitante / no anotado */}
      {showAddGuest && (
        <AddGuestModal
          allPlayers={clubPlayers}
          allCategories={clubCategories}
          onClose={() => setShowAddGuest(false)}
          onAdd={(g) => {
            setGuests([...guests, { ...g, id: `guest-${Date.now()}` }])
            setShowAddGuest(false)
          }}
        />
      )}

      {/* Log de aperturas/cierres */}
      {log.length > 0 && (
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-2.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-1">
              <Clock size={10} /> Historial de cierres
            </p>
            <div className="space-y-1">
              {log.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                  {entry.action === 'close' && <Lock size={10} className="text-red-500" />}
                  {entry.action === 'reopen' && <Unlock size={10} className="text-blue-500" />}
                  {entry.action === 'open' && <CheckCircle2 size={10} className="text-green-500" />}
                  <span className="font-semibold">
                    {entry.action === 'close' ? 'Cerrada' : entry.action === 'reopen' ? 'Reabierta' : 'Abierta'}
                  </span>
                  <span className="text-muted-foreground">por</span>
                  <span className="font-medium">{entry.user}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{entry.at}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {players.length > 0 && (
        <div className="sticky bottom-20 md:bottom-4 pt-2 space-y-2">
          {!closed ? (
            <button
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2"
              style={{ backgroundColor: '#00843D' }}
              onClick={() => {
                if (unmarkedCount > 0) {
                  const ok = confirm(`Hay ${unmarkedCount} jugador(es) sin marcar. Al cerrar quedarán registrados como AUSENTES. ¿Continuar?`)
                  if (!ok) return
                  // Convertir sin marcar → ausente
                  setAttendance(prev => {
                    const next = { ...prev }
                    players.forEach(pl => { if (!next[pl.id]) next[pl.id] = 'absent_unjustified' })
                    return next
                  })
                }
                const profeName = selectedProfe ? demoProfes.find(p => p.id === selectedProfe)?.full_name ?? 'Diego Barrado' : 'Diego Barrado'
                const now = new Date().toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

                // PRODUCCIÓN: persistir la asistencia en Supabase (club real)
                if (isRealClub(club.id)) {
                  const records = players.map(pl => ({
                    playerId: pl.id,
                    status: (attendance[pl.id] ?? 'absent_unjustified') as string,
                  }))
                  persistAttendanceClose(club.id, {
                    categoryId: players.length > 0 ? (players[0].category_id ?? null) : null,
                    scheduledAt: new Date().toISOString(),
                    records,
                    profeName,
                  }).then(res => { if (!res.ok) console.error('No se pudo persistir la asistencia:', res.error) })
                }

                setLog([...log, { action: log.length === 0 ? 'close' : 'close', user: profeName, at: now }])
                setClosed(true)
              }}
            >
              <Lock size={16} /> CERRAR Y FIRMAR ({presentCount}/{players.length})
            </button>
          ) : (
            <>
              <Card className="border-0 shadow-sm bg-gray-100">
                <CardContent className="p-3 text-center">
                  <Lock size={20} className="text-gray-500 mx-auto mb-1" />
                  <p className="text-sm font-semibold text-gray-700">Asistencia cerrada</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {presentCount}/{players.length} presentes · {livePercent}%
                  </p>
                </CardContent>
              </Card>
              <button
                className="w-full py-3 rounded-xl font-bold text-sm border-2 border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2"
                onClick={() => {
                  const profeName = selectedProfe ? demoProfes.find(p => p.id === selectedProfe)?.full_name ?? 'Diego Barrado' : 'Diego Barrado'
                  const now = new Date().toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                  setLog([...log, { action: 'reopen', user: profeName, at: now }])
                  setClosed(false)
                }}
              >
                <Unlock size={16} /> REABRIR (llegó alguien tarde)
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AddGuestModal({ allPlayers, allCategories, onClose, onAdd }: {
  allPlayers: ReturnType<typeof getPlayersForClub>
  allCategories: ReturnType<typeof getCategoriesForClub>
  onClose: () => void
  onAdd: (g: { type: 'visitor' | 'unregistered'; name: string; tira?: Tira; categoryName?: string; notes?: string }) => void
}) {
  const [mode, setMode] = useState<'visitor' | 'unregistered'>('visitor')
  const [search, setSearch] = useState('')
  const [unregName, setUnregName] = useState('')
  const [unregNotes, setUnregNotes] = useState('')

  const matches = search.trim()
    ? allPlayers.filter(p =>
        p.is_active &&
        (p.full_name.toLowerCase().includes(search.toLowerCase()) || (p.dni ?? '').includes(search))
      ).slice(0, 8)
    : []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>AGREGAR PARTICIPANTE</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setMode('visitor')}
            className={`py-2 rounded-lg text-xs font-bold border ${mode === 'visitor' ? 'text-white border-transparent' : 'border-gray-200'}`}
            style={mode === 'visitor' ? { backgroundColor: '#7c3aed' } : {}}>
            <Search size={13} className="inline mr-1" /> Visita de otra tira
          </button>
          <button onClick={() => setMode('unregistered')}
            className={`py-2 rounded-lg text-xs font-bold border ${mode === 'unregistered' ? 'text-white border-transparent' : 'border-gray-200'}`}
            style={mode === 'unregistered' ? { backgroundColor: '#F59E0B' } : {}}>
            <UserPlus size={13} className="inline mr-1" /> No anotado
          </button>
        </div>

        {mode === 'visitor' ? (
          <>
            <div>
              <label className="text-xs font-semibold mb-1 block">Buscar jugador del club</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                placeholder="Apellido, nombre o DNI..."
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
              />
            </div>
            {matches.length === 0 && search.trim() && (
              <p className="text-xs text-muted-foreground text-center py-3">Sin resultados</p>
            )}
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {matches.map(p => {
                const cat = allCategories.find(c => c.id === p.category_id)
                const sc = (cat?.sport_format_code ?? 'football_11') as SportCode
                return (
                  <button
                    key={p.id}
                    onClick={() => onAdd({ type: 'visitor', name: p.full_name, tira: p.tira, categoryName: cat?.name })}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 border border-gray-200 flex items-center gap-2.5"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0" style={{ borderColor: getTiraColor(p.tira, sc) }}>
                      <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.full_name}</p>
                      <p className="text-[10px]">
                        Cat. {cat?.name} · <span style={{ color: getTiraColor(p.tira, sc) }}>{getTiraLabel(p.tira, sc)}</span>
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold mb-1 block">Nombre y apellido *</label>
              <input
                type="text"
                value={unregName}
                onChange={e => setUnregName(e.target.value)}
                autoFocus
                placeholder="Ej: Mateo Acuña"
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Nota (opcional)</label>
              <input
                type="text"
                value={unregNotes}
                onChange={e => setUnregNotes(e.target.value)}
                placeholder="Ej: hermano de X / a prueba / lo trajo el papá..."
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
              />
            </div>
            <p className="text-[10px] text-muted-foreground bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ Va a aparecer en el dashboard como "no anotado" para que admin lo siga (a prueba o pendiente de cobro).
            </p>
            <button
              onClick={() => unregName.trim() && onAdd({ type: 'unregistered', name: unregName.trim(), notes: unregNotes.trim() || undefined })}
              disabled={!unregName.trim()}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
              style={{ backgroundColor: '#F59E0B' }}
            >
              AGREGAR NO ANOTADO
            </button>
          </>
        )}
      </div>
    </div>
  )
}
