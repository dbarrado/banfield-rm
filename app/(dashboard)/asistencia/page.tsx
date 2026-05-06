'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { demoPlayers, demoCategories } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'

type AttendanceStatus = 'present' | 'absent_unjustified' | 'absent_justified'

const statusConfig = {
  present:            { label: 'Presente',           color: '#00843D', icon: CheckCircle2 },
  absent_unjustified: { label: 'Ausente',            color: '#DC2626', icon: XCircle },
  absent_justified:   { label: 'Justificado',        color: '#F59E0B', icon: AlertCircle },
}

const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function AsistenciaPage() {
  const activeCategories = demoCategories.filter(c => c.is_active)
  const [selectedCategory, setSelectedCategory] = useState(activeCategories[0].id)
  const [selectedTira, setSelectedTira] = useState<Tira>('metro')
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  const tirasInCategory = ALL_TIRAS.filter(t =>
    demoPlayers.some(p => p.category_id === selectedCategory && p.tira === t)
  )

  // Si la tira seleccionada no existe en esta categoría, usar la primera disponible
  const effectiveTira = tirasInCategory.includes(selectedTira) ? selectedTira : (tirasInCategory[0] ?? 'metro')

  const players = demoPlayers.filter(p =>
    p.category_id === selectedCategory && p.tira === effectiveTira && p.is_active
  )

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

      {/* Selector categoría */}
      <select
        value={selectedCategory}
        onChange={e => { setSelectedCategory(e.target.value); setAttendance({}); }}
        className="w-full px-3 py-2 rounded-lg border text-sm font-medium bg-white"
        style={{ borderColor: '#00843D', color: '#00843D' }}
      >
        {activeCategories.map(c => <option key={c.id} value={c.id}>Categoría {c.name}</option>)}
      </select>

      {/* Selector tira */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
        {tirasInCategory.map(tira => (
          <button
            key={tira}
            onClick={() => { setSelectedTira(tira); setAttendance({}); }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${
              effectiveTira === tira ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'
            }`}
            style={effectiveTira === tira ? { backgroundColor: TIRA_COLORS[tira] } : {}}
          >
            {TIRA_LABELS[tira]}
          </button>
        ))}
      </div>

      {/* % vivo de asistencia */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${TIRA_COLORS[effectiveTira]}` }}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Asistencia en vivo</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: TIRA_COLORS[effectiveTira] }}>
              {livePercent}%
            </p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${livePercent}%`, backgroundColor: TIRA_COLORS[effectiveTira] }}
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
            <button key={player.id} onClick={() => cycleStatus(player.id)} className="w-full text-left">
              <Card className="border-0 shadow-sm transition-all active:scale-[0.99]" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-2.5 flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: color }}>
                    {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{player.full_name}</p>
                    <p className="text-[10px] text-muted-foreground">Conv. año: {player.convocation_count}</p>
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

      {players.length > 0 && (
        <div className="sticky bottom-20 md:bottom-4 pt-2 space-y-2">
          <button
            className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg"
            style={{ backgroundColor: '#00843D' }}
            onClick={() => alert(`✅ Asistencia guardada — ${presentCount}/${players.length} presentes (${livePercent}%)`)}
          >
            CERRAR Y GUARDAR ({presentCount}/{players.length})
          </button>
        </div>
      )}
    </div>
  )
}
