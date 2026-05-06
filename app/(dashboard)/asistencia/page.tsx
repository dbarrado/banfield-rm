'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, ChevronDown } from 'lucide-react'
import { demoPlayers, demoCategories, demoEvents } from '@/lib/demo-data'

type AttendanceStatus = 'present' | 'absent_unjustified' | 'absent_justified'

const statusConfig = {
  present:            { label: 'Presente',           color: '#00843D', icon: CheckCircle2 },
  absent_unjustified: { label: 'Ausente',             color: '#DC2626', icon: XCircle },
  absent_justified:   { label: 'Ausente justificado', color: '#F59E0B', icon: AlertCircle },
}

export default function AsistenciaPage() {
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedShift, setSelectedShift] = useState<'morning' | 'afternoon'>('morning')
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

  const activeCategories = demoCategories.filter(c => c.is_active)
  const players = demoPlayers.filter(p => p.category_id === selectedCategory && p.shift === selectedShift && p.is_active)
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  function getStatus(playerId: string): AttendanceStatus {
    return attendance[playerId] ?? 'present'
  }

  function cycleStatus(playerId: string) {
    const current = getStatus(playerId)
    const next: AttendanceStatus = current === 'present' ? 'absent_unjustified' : current === 'absent_unjustified' ? 'absent_justified' : 'present'
    setAttendance(prev => ({ ...prev, [playerId]: next }))
  }

  const presentCount = players.filter(p => getStatus(p.id) === 'present').length
  const absentCount = players.filter(p => getStatus(p.id) !== 'present').length

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
          ASISTENCIA
        </h1>
      </div>

      <p className="text-sm text-muted-foreground capitalize">{today}</p>

      {/* Selector categoría y turno */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-lg border text-sm font-medium bg-white cursor-pointer"
            style={{ borderColor: '#00843D', color: '#00843D' }}
          >
            {activeCategories.map(cat => (
              <option key={cat.id} value={cat.id}>Categoría {cat.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#00843D' }} />
        </div>
        <button
          onClick={() => setSelectedShift('morning')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedShift === 'morning' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
          style={selectedShift === 'morning' ? { backgroundColor: '#00843D' } : {}}
        >Mañana</button>
        <button
          onClick={() => setSelectedShift('afternoon')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${selectedShift === 'afternoon' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
          style={selectedShift === 'afternoon' ? { backgroundColor: '#00843D' } : {}}
        >Tarde</button>
      </div>

      {/* Resumen */}
      <div className="flex gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50">
          <CheckCircle2 size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-green-700">{presentCount} presentes</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50">
          <XCircle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-red-600">{absentCount} ausentes</span>
        </div>
      </div>

      {/* Instrucción */}
      <p className="text-xs text-muted-foreground">Tocá el nombre para cambiar el estado. Todos arrancan como presentes.</p>

      {/* Lista de jugadores */}
      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No hay jugadores en este turno.</p>
        )}
        {players.map(player => {
          const status = getStatus(player.id)
          const { label, color, icon: Icon } = statusConfig[status]
          return (
            <button
              key={player.id}
              onClick={() => cycleStatus(player.id)}
              className="w-full text-left"
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-all active:scale-[0.99]" style={{ borderLeft: `4px solid ${color}` }}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: color }}>
                    {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{player.full_name}</p>
                    <p className="text-xs text-muted-foreground">Conv. este año: {player.convocation_count}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Icon size={18} style={{ color }} />
                    <span className="text-xs font-medium" style={{ color }}>{label}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      {/* Botón guardar */}
      {players.length > 0 && (
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-base"
          style={{ backgroundColor: '#00843D' }}
          onClick={() => alert('✅ Asistencia guardada (modo demo)')}
        >
          GUARDAR ASISTENCIA
        </button>
      )}
    </div>
  )
}
