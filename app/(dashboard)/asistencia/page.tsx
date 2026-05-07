'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, User, Lock, Unlock, Clock, Radio } from 'lucide-react'
import { demoPlayers, demoCategories, demoProfes, getAssignmentsForProfe, getProfesForTira } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'
import { getSessionsForDay, TIRA_GROUPS, tiraGroupOf } from '@/lib/training-schedule'

type AttendanceStatus = 'present' | 'absent_unjustified' | 'absent_justified'

const statusConfig = {
  present:            { label: 'Presente',           color: '#00843D', icon: CheckCircle2 },
  absent_unjustified: { label: 'Ausente',            color: '#DC2626', icon: XCircle },
  absent_justified:   { label: 'Justificado',        color: '#F59E0B', icon: AlertCircle },
}

const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function AsistenciaPage() {
  const activeCategories = demoCategories.filter(c => c.is_active)

  // Sesiones del día actual (hoy)
  const now = new Date()
  const sessionsToday = getSessionsForDay(now, activeCategories.map(c => ({ id: c.id, name: c.name })))
  const liveSession = sessionsToday.find(s => s.status === 'live')
  const upcomingSession = sessionsToday.find(s => s.status === 'upcoming')

  const initialCategory = liveSession?.category_id ?? upcomingSession?.category_id ?? activeCategories[0].id
  const initialGroup = liveSession?.group ?? upcomingSession?.group ?? 'group-a'
  const initialTira = (TIRA_GROUPS.find(g => g.id === initialGroup)?.tiras[0]) ?? 'metro'

  const [selectedProfe, setSelectedProfe] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)
  const [selectedTira, setSelectedTira] = useState<Tira>(initialTira)
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [closed, setClosed] = useState(false)
  const [log, setLog] = useState<{ action: 'open' | 'close' | 'reopen'; user: string; at: string }[]>([])

  const dayLabels = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const todayLabel = dayLabels[now.getDay()]

  // Si hay profe seleccionado, limitar categorías y tiras a las que tiene asignadas
  const profeAssignments = selectedProfe ? getAssignmentsForProfe(selectedProfe) : []
  const allowedCategoryIds = selectedProfe
    ? Array.from(new Set(profeAssignments.map(a => a.category_id)))
    : activeCategories.map(c => c.id)
  const filteredCategories = activeCategories.filter(c => allowedCategoryIds.includes(c.id))
  const effectiveCategory = filteredCategories.some(c => c.id === selectedCategory)
    ? selectedCategory
    : (filteredCategories[0]?.id ?? activeCategories[0].id)

  // Tiras del grupo seleccionado (Metro+Liga1 o Liga2+Edefi)
  const groupTiras = TIRA_GROUPS.find(g => g.id === selectedGroup)?.tiras ?? []
  const tirasInCategory = ALL_TIRAS.filter(t => {
    if (!groupTiras.includes(t)) return false
    const hasPlayers = demoPlayers.some(p => p.category_id === effectiveCategory && p.tira === t)
    if (!hasPlayers) return false
    if (!selectedProfe) return true
    return profeAssignments.some(a => a.category_id === effectiveCategory && a.tira === t)
  })

  // Jugadores de TODAS las tiras del grupo (entrenan juntos)
  const players = demoPlayers.filter(p =>
    p.category_id === effectiveCategory && groupTiras.includes(p.tira) && p.is_active
  )

  // Profes asignados a cualquiera de las tiras del grupo
  const profesAsignados = Array.from(new Set(
    groupTiras.flatMap(t => getProfesForTira(effectiveCategory, t).map(p => p.id))
  )).map(id => demoProfes.find(p => p.id === id)!).filter(Boolean)

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  function getStatus(playerId: string): AttendanceStatus {
    return attendance[playerId] ?? 'present'
  }

  function cycleStatus(playerId: string) {
    const current = getStatus(playerId)
    const next: AttendanceStatus =
      current === 'present' ? 'absent_unjustified' :
      current === 'absent_unjustified' ? 'absent_justified' :
      'present'
    setAttendance(prev => ({ ...prev, [playerId]: next }))
  }

  const presentCount = players.filter(p => getStatus(p.id) === 'present').length
  const absentCount = players.filter(p => getStatus(p.id) !== 'present').length
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
                const isSelected = effectiveCategory === s.category_id && selectedGroup === s.group
                return (
                  <button
                    key={`${s.category_id}-${s.group}-${idx}`}
                    onClick={() => {
                      setSelectedCategory(s.category_id)
                      setSelectedGroup(s.group)
                      setSelectedTira(TIRA_GROUPS.find(g => g.id === s.group)!.tiras[0])
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

      {/* Selector profe */}
      <select
        value={selectedProfe}
        onChange={e => { setSelectedProfe(e.target.value); setAttendance({}); }}
        className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
      >
        <option value="">Todos los profes</option>
        {demoProfes.filter(p => p.is_active).map(p => (
          <option key={p.id} value={p.id}>👤 {p.full_name}</option>
        ))}
      </select>

      {/* Selector categoría */}
      <select
        value={effectiveCategory}
        onChange={e => { setSelectedCategory(e.target.value); setAttendance({}); }}
        className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
        style={{ borderColor: '#00843D', color: '#00843D' }}
      >
        {filteredCategories.map(c => <option key={c.id} value={c.id}>Categoría {c.name}</option>)}
      </select>

      {/* Selector grupo (Metro+Liga1 o Liga2+Edefi) */}
      <div className="flex gap-1.5">
        {TIRA_GROUPS.map(g => (
          <button
            key={g.id}
            onClick={() => { setSelectedGroup(g.id); setSelectedTira(g.tiras[0]); setAttendance({}); }}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
              selectedGroup === g.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
            }`}
            style={selectedGroup === g.id ? { backgroundColor: g.color } : {}}
          >
            {g.name}
          </button>
        ))}
      </div>

      {/* Profes asignados a esta tira */}
      {profesAsignados.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs flex-wrap">
          <User size={12} className="text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">A cargo:</span>
          {profesAsignados.map((p, i) => (
            <span key={p.id} className="font-semibold" style={{ color: (TIRA_GROUPS.find(g => g.id === selectedGroup)?.color ?? '#00843D') }}>
              {p.full_name}{i < profesAsignados.length - 1 ? ',' : ''}
            </span>
          ))}
        </div>
      )}

      {/* % vivo de asistencia */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${(TIRA_GROUPS.find(g => g.id === selectedGroup)?.color ?? '#00843D')}` }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Asistencia en vivo</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: (TIRA_GROUPS.find(g => g.id === selectedGroup)?.color ?? '#00843D') }}>
              {livePercent}%
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${livePercent}%`, backgroundColor: (TIRA_GROUPS.find(g => g.id === selectedGroup)?.color ?? '#00843D') }}
            />
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-700 font-semibold">{presentCount} presentes</span>
            <span className="text-gray-400">·</span>
            <span className="text-red-600 font-semibold">{absentCount} ausentes</span>
            <span className="text-gray-400">·</span>
            <span className="text-muted-foreground">{players.length} totales</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground">
        Tap para cambiar estado: Presente → Ausente → Justificado.
      </p>

      {/* Lista */}
      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No hay jugadores en esta tira.</p>
        )}
        {players.map(player => {
          const status = getStatus(player.id)
          const { label, color, icon: Icon } = statusConfig[status]
          return (
            <button key={player.id} onClick={() => !closed && cycleStatus(player.id)} disabled={closed} className="w-full text-left disabled:opacity-90">
              <Card className="border-0 shadow-sm transition-all active:scale-[0.99]" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-2.5 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: color }}>
                    {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{player.full_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[player.tira] }}>
                        {TIRA_LABELS[player.tira]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Conv: {player.convocation_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Icon size={18} style={{ color }} />
                    <span className="text-[11px] font-semibold hidden sm:inline" style={{ color }}>{label}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

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
                const profeName = selectedProfe ? demoProfes.find(p => p.id === selectedProfe)?.full_name ?? 'Diego Barrado' : 'Diego Barrado'
                const now = new Date().toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
