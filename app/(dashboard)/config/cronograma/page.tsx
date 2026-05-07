'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Clock, MapPin, User, Plus, Edit2, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { demoTrainingRoster, DAYS_OF_WEEK, type TrainingSlot } from '@/lib/training-roster'
import { demoCategories, demoProfes } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'

const COURT_COLORS = ['#7c3aed', '#1d4ed8', '#dc2626', '#16a34a']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function CronogramaPage() {
  const [slots, setSlots] = useState<TrainingSlot[]>(demoTrainingRoster)
  const [selectedDay, setSelectedDay] = useState(1)
  const [editingSlot, setEditingSlot] = useState<TrainingSlot | null>(null)
  const [showNew, setShowNew] = useState(false)

  const slotsByDay = slots.filter(s => s.day_of_week === selectedDay && s.is_active).sort((a, b) => a.start_time.localeCompare(b.start_time))

  // Agrupar por horario para detectar simultáneos
  type TimeGroup = { time_key: string; start: string; end: string; slots: TrainingSlot[] }
  const grouped: TimeGroup[] = []
  for (const s of slotsByDay) {
    const key = `${s.start_time}-${s.end_time}`
    let g = grouped.find(x => x.time_key === key)
    if (!g) {
      g = { time_key: key, start: s.start_time, end: s.end_time, slots: [] }
      grouped.push(g)
    }
    g.slots.push(s)
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/config" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <Calendar size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          CRONOGRAMA
        </h1>
        <Badge variant="outline" className="text-[10px]">{slots.filter(s => s.is_active).length}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Plantilla de prácticas semanales. Define día, horario, cancha, categorías, tiras y profe asignado. Soporta múltiples sesiones simultáneas en distintas canchas.
      </p>

      {/* Selector de día */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
        {DAYS_OF_WEEK.map(d => {
          const sel = selectedDay === d.num
          const count = slots.filter(s => s.day_of_week === d.num && s.is_active).length
          return (
            <button
              key={d.num}
              onClick={() => setSelectedDay(d.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 whitespace-nowrap transition-colors ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
              style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
            >
              {d.label}
              {count > 0 && <span className="ml-1 opacity-70">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Botón nuevo slot */}
      <button
        onClick={() => setShowNew(true)}
        className="w-full py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-1.5"
        style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
      >
        <Plus size={14} /> Nueva práctica el {DAYS_OF_WEEK.find(d => d.num === selectedDay)?.full.toLowerCase()}
      </button>

      {/* Grilla de slots agrupados por horario */}
      {grouped.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          No hay prácticas programadas para este día.
        </p>
      )}

      {grouped.map(g => (
        <div key={g.time_key} className="space-y-2">
          <div className="flex items-center gap-2 mt-2">
            <Clock size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
              {g.start} – {g.end}
            </h2>
            {g.slots.length > 1 && (
              <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">
                {g.slots.length} canchas en simultáneo
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {g.slots.map(s => {
              const courtColor = COURT_COLORS[(s.court - 1) % COURT_COLORS.length]
              const cats = demoCategories.filter(c => s.category_ids.includes(c.id))
              const titular = demoProfes.find(p => p.id === s.profe_titular_id)
              const suplente = s.profe_suplente_id ? demoProfes.find(p => p.id === s.profe_suplente_id) : null
              return (
                <Card key={s.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${courtColor}` }}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin size={12} className="flex-shrink-0" style={{ color: courtColor }} />
                        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-barlow)", color: courtColor }}>
                          Cancha {s.court}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => setEditingSlot(s)} className="p-1 rounded hover:bg-gray-100">
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => setSlots(slots.map(x => x.id === s.id ? { ...x, is_active: false } : x))}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {cats.map(c => (
                        <Badge key={c.id} className="text-[10px] border-0 text-white" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                          Cat. {c.name}
                        </Badge>
                      ))}
                      <span className="text-[10px] text-muted-foreground">·</span>
                      {s.tiras.map(t => (
                        <Badge key={t} className="text-[10px] border-0 text-white" style={{ backgroundColor: TIRA_COLORS[t] }}>
                          {TIRA_LABELS[t]}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
                      <User size={10} className="text-muted-foreground" />
                      <span>Titular: <strong>{titular?.full_name ?? 'Sin asignar'}</strong></span>
                      {suplente && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span>Suplente: <strong className="text-muted-foreground">{suplente.full_name}</strong></span>
                        </>
                      )}
                    </div>

                    {s.notes && (
                      <p className="text-[10px] italic text-muted-foreground">"{s.notes}"</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Modal nuevo / editar */}
      {(showNew || editingSlot) && (
        <SlotModal
          slot={editingSlot ?? undefined}
          defaultDay={selectedDay}
          onClose={() => { setShowNew(false); setEditingSlot(null); }}
          onSave={(s) => {
            if (editingSlot) {
              setSlots(slots.map(x => x.id === editingSlot.id ? s : x))
            } else {
              setSlots([...slots, { ...s, id: `ts-new-${Date.now()}` }])
            }
            setShowNew(false)
            setEditingSlot(null)
          }}
        />
      )}
    </div>
  )
}

function SlotModal({ slot, defaultDay, onClose, onSave }: {
  slot?: TrainingSlot
  defaultDay: number
  onClose: () => void
  onSave: (s: TrainingSlot) => void
}) {
  const [day, setDay] = useState(slot?.day_of_week ?? defaultDay)
  const [start, setStart] = useState(slot?.start_time ?? '17:00')
  const [end, setEnd] = useState(slot?.end_time ?? '18:30')
  const [court, setCourt] = useState(slot?.court ?? 1)
  const [catIds, setCatIds] = useState<Set<string>>(new Set(slot?.category_ids ?? []))
  const [tiras, setTiras] = useState<Set<Tira>>(new Set(slot?.tiras ?? []))
  const [titular, setTitular] = useState(slot?.profe_titular_id ?? '')
  const [suplente, setSuplente] = useState(slot?.profe_suplente_id ?? '')
  const [notes, setNotes] = useState(slot?.notes ?? '')

  function toggleCat(id: string) {
    setCatIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  function toggleTira(t: Tira) {
    setTiras(prev => { const next = new Set(prev); next.has(t) ? next.delete(t) : next.add(t); return next })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (catIds.size === 0 || tiras.size === 0) return
    onSave({
      id: slot?.id ?? '',
      day_of_week: day,
      start_time: start,
      end_time: end,
      court,
      category_ids: Array.from(catIds),
      tiras: Array.from(tiras),
      profe_titular_id: titular || null,
      profe_suplente_id: suplente || null,
      notes: notes || undefined,
      is_active: true,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
            {slot ? 'EDITAR PRÁCTICA' : 'NUEVA PRÁCTICA'}
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Día */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Día</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(d => {
                const sel = day === d.num
                return (
                  <button key={d.num} type="button" onClick={() => setDay(d.num)}
                    className={`py-1.5 rounded text-[10px] font-bold border ${sel ? 'text-white border-transparent' : 'border-gray-200'}`}
                    style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}>
                    {d.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold mb-1 block">Inicio</label>
              <input type="time" required value={start} onChange={e => setStart(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Fin</label>
              <input type="time" required value={end} onChange={e => setEnd(e.target.value)} className="w-full px-3 py-2 border rounded text-sm" />
            </div>
          </div>

          {/* Cancha */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Cancha</label>
            <div className="flex gap-1.5">
              {[1, 2, 3].map(n => {
                const sel = court === n
                const c = COURT_COLORS[(n - 1) % COURT_COLORS.length]
                return (
                  <button key={n} type="button" onClick={() => setCourt(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200'}`}
                    style={sel ? { backgroundColor: c } : {}}>
                    Cancha {n}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Categorías (multi) */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Categorías * (multi)</label>
            <div className="flex flex-wrap gap-1">
              {demoCategories.filter(c => c.is_active).map(c => {
                const sel = catIds.has(c.id)
                return (
                  <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}>
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tiras (multi) */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Tiras * (multi)</label>
            <div className="flex flex-wrap gap-1">
              {ALL_TIRAS.map(t => {
                const sel = tiras.has(t)
                return (
                  <button key={t} type="button" onClick={() => toggleTira(t)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                    style={sel ? { backgroundColor: TIRA_COLORS[t] } : {}}>
                    {TIRA_LABELS[t]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Profes */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Profe titular *</label>
            <select required value={titular} onChange={e => setTitular(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">— Seleccionar —</option>
              {demoProfes.filter(p => p.is_active).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Profe suplente (opcional)</label>
            <select value={suplente} onChange={e => setSuplente(e.target.value)} className="w-full px-3 py-2 border rounded text-sm">
              <option value="">— Sin suplente —</option>
              {demoProfes.filter(p => p.is_active && p.id !== titular).map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="text-xs font-semibold mb-1 block">Notas (opcional)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ej: Sesión combinada formativas"
              className="w-full px-3 py-2 border rounded text-sm" />
          </div>

          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
            {slot ? 'GUARDAR CAMBIOS' : 'CREAR PRÁCTICA'}
          </button>
        </form>
      </div>
    </div>
  )
}
