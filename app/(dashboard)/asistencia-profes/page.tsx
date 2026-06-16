'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, CheckCircle2, XCircle, AlertCircle, UserMinus } from 'lucide-react'
import { demoProfes, demoCategories } from '@/lib/demo-data'
import { demoTrainingRoster, getSlotsByDay, DAYS_OF_WEEK } from '@/lib/training-roster'
import { TIRA_COLORS, TIRA_LABELS } from '@/types'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { persistProfeAttendance } from '@/lib/data/ops-store'
import { hasAccess, getRequiredPlan, type Plan } from '@/lib/feature-gates'
import { UpgradePrompt } from '@/components/upgrade-prompt'

type ProfeAttendance = 'present' | 'absent' | 'late' | 'replaced'

const STATUS_CONFIG: Record<ProfeAttendance, { label: string; color: string; icon: any }> = {
  present:  { label: 'Vino',          color: '#00843D', icon: CheckCircle2 },
  late:     { label: 'Llegó tarde',   color: '#F59E0B', icon: AlertCircle },
  replaced: { label: 'Reemplazado',   color: '#7c3aed', icon: UserMinus },
  absent:   { label: 'No vino',       color: '#DC2626', icon: XCircle },
}

const COURT_COLORS = ['#7c3aed', '#1d4ed8', '#dc2626', '#16a34a']

export default function AsistenciaProfesPage() {
  const club = useCurrentClub()
  const required = getRequiredPlan('/asistencia-profes')
  if (!hasAccess(club.plan as Plan, required)) {
    return <UpgradePrompt currentPlan={club.plan as Plan} requiredPlan={required} featureName="Asistencia de profes" featureDescription="Coordinador toma asistencia a profesores para gestión de planilla." />
  }
  return <AsistenciaProfesContent />
}

function AsistenciaProfesContent() {
  const club = useCurrentClub()
  const today = new Date()
  const [selectedDay, setSelectedDay] = useState(today.getDay() === 0 ? 6 : today.getDay())
  const [attendance, setAttendance] = useState<Record<string, ProfeAttendance>>({})
  const [replacedBy, setReplacedBy] = useState<Record<string, string>>({})

  const slotsToday = getSlotsByDay(selectedDay)

  function setStatus(slotId: string, status: ProfeAttendance) {
    setAttendance(prev => ({ ...prev, [slotId]: status }))
  }

  const counts = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    late: Object.values(attendance).filter(s => s === 'late').length,
    replaced: Object.values(attendance).filter(s => s === 'replaced').length,
    absent: Object.values(attendance).filter(s => s === 'absent').length,
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <ClipboardList size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          ASISTENCIA DE PROFES
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        El coordinador toma asistencia de los profes que dieron clase. Si faltó el titular y vino el suplente, marcar "Reemplazado".
      </p>

      {/* Selector día */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
        {DAYS_OF_WEEK.map(d => {
          const sel = selectedDay === d.num
          const count = demoTrainingRoster.filter(s => s.day_of_week === d.num && s.is_active).length
          return (
            <button key={d.num} onClick={() => setSelectedDay(d.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 whitespace-nowrap ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
              style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}>
              {d.label} {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-1.5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-green-600 uppercase font-bold">Vinieron</p>
            <p className="text-lg font-bold text-green-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.present}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-amber-600 uppercase font-bold">Tarde</p>
            <p className="text-lg font-bold text-amber-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.late}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-purple-600 uppercase font-bold">Reempl.</p>
            <p className="text-lg font-bold text-purple-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.replaced}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-red-500 uppercase font-bold">Faltó</p>
            <p className="text-lg font-bold text-red-500" style={{ fontFamily: "var(--font-barlow)" }}>{counts.absent}</p>
          </CardContent>
        </Card>
      </div>

      {/* Slots del día con su profe */}
      {slotsToday.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No hay prácticas programadas para este día.
        </p>
      )}

      <div className="space-y-2">
        {slotsToday.map(slot => {
          const titular = demoProfes.find(p => p.id === slot.profe_titular_id)
          const suplentes = (slot.profe_suplentes_ids ?? []).map(id => demoProfes.find(p => p.id === id)).filter(Boolean) as typeof demoProfes
          const suplente = suplentes[0] // primer suplente como "designado por defecto"
          const status = attendance[slot.id]
          const cfg = status ? STATUS_CONFIG[status] : null
          const courtColor = COURT_COLORS[(slot.court - 1) % COURT_COLORS.length]
          const cats = demoCategories.filter(c => slot.category_ids.includes(c.id))

          return (
            <Card key={slot.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${cfg?.color ?? '#e5e7eb'}` }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                      {slot.start_time}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white" style={{ backgroundColor: courtColor }}>
                      Cancha {slot.court}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {cats.slice(0, 2).map(c => (
                      <Badge key={c.id} variant="outline" className="text-[10px]">{c.name}</Badge>
                    ))}
                    {slot.tiras.slice(0, 2).map(t => (
                      <Badge key={t} className="text-[10px] border-0 text-white" style={{ backgroundColor: TIRA_COLORS[t] }}>
                        {TIRA_LABELS[t]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Profe titular */}
                <div className="flex items-center gap-2.5 pt-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                    {titular?.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{titular?.full_name ?? 'Sin titular'}</p>
                    <p className="text-[10px] text-muted-foreground">Titular</p>
                  </div>
                  {cfg && (
                    <Badge className="text-[10px] border-0 text-white flex-shrink-0" style={{ backgroundColor: cfg.color }}>
                      {cfg.label}
                    </Badge>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => setStatus(slot.id, 'present')}
                    className={`py-1.5 rounded text-[10px] font-bold border ${status === 'present' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={status === 'present' ? { backgroundColor: '#00843D' } : {}}
                  >✓ Vino</button>
                  <button
                    onClick={() => setStatus(slot.id, 'late')}
                    className={`py-1.5 rounded text-[10px] font-bold border ${status === 'late' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={status === 'late' ? { backgroundColor: '#F59E0B' } : {}}
                  >Tarde</button>
                  <button
                    onClick={() => {
                      setStatus(slot.id, 'replaced')
                      if (suplente) setReplacedBy(prev => ({ ...prev, [slot.id]: suplente.id }))
                    }}
                    className={`py-1.5 rounded text-[10px] font-bold border ${status === 'replaced' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={status === 'replaced' ? { backgroundColor: '#7c3aed' } : {}}
                  >Reempl.</button>
                  <button
                    onClick={() => setStatus(slot.id, 'absent')}
                    className={`py-1.5 rounded text-[10px] font-bold border ${status === 'absent' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={status === 'absent' ? { backgroundColor: '#DC2626' } : {}}
                  >No vino</button>
                </div>

                {/* Suplente cuando reemplazo */}
                {status === 'replaced' && (
                  <div className="bg-purple-50 rounded p-2">
                    <label className="text-[10px] font-bold uppercase text-purple-700">Reemplazado por</label>
                    <select
                      value={replacedBy[slot.id] ?? ''}
                      onChange={e => setReplacedBy(prev => ({ ...prev, [slot.id]: e.target.value }))}
                      className="w-full mt-1 px-2 py-1.5 border rounded text-sm bg-white"
                    >
                      <option value="">— Seleccionar —</option>
                      {suplentes.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name} (suplente designado)</option>
                      ))}
                      {demoProfes.filter(p => p.is_active && p.id !== slot.profe_titular_id && !suplentes.find(s => s.id === p.id)).map(p => (
                        <option key={p.id} value={p.id}>{p.full_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Suplentes disponibles (info) */}
                {!status && suplentes.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Suplentes designados ({suplentes.length}): <strong>{suplentes.map(s => s.full_name).join(', ')}</strong>
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(attendance).length > 0 && (
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm sticky bottom-20 md:bottom-4"
          style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
          onClick={() => {
            if (isRealClub(club.id)) {
              const dateStr = new Date().toISOString().slice(0, 10)
              const records = slotsToday
                .filter(s => attendance[s.id] && s.profe_titular_id)
                .map(s => ({
                  profeId: s.profe_titular_id as string,
                  status: attendance[s.id],
                  replacedById: replacedBy[s.id] ?? null,
                  slotId: s.id,
                }))
              if (records.length) persistProfeAttendance(club.id, { date: dateStr, records }).then(r => { if (!r.ok) console.error('profe-att:', r.error) })
            }
            alert(`✅ Asistencia de profes guardada\n\n${counts.present} vinieron · ${counts.late} tarde · ${counts.replaced} reemplazos · ${counts.absent} faltaron`)
          }}
        >
          GUARDAR ASISTENCIA DE PROFES
        </button>
      )}
    </div>
  )
}
