'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Trophy, Plus, X, CloudRain, Edit2 } from 'lucide-react'
import { demoEvents, demoCategories } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'

type FixtureMatch = {
  id: string
  category_id: string
  rival: string | null
  scheduled_at: string
  is_home: boolean | null
  venue: string | null
  is_suspended: boolean
}

export default function FixturePage() {
  const initialMatches = demoEvents
    .filter(e => e.event_type === 'match')
    .map(e => ({
      id: e.id,
      category_id: e.category_id,
      rival: e.rival,
      scheduled_at: e.scheduled_at,
      is_home: e.is_home,
      venue: e.venue,
      is_suspended: e.is_suspended,
    }))

  const [matches, setMatches] = useState<FixtureMatch[]>(initialMatches)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<FixtureMatch | null>(null)
  const [reprogramming, setReprogramming] = useState<FixtureMatch | null>(null)

  const sorted = [...matches].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  function handleReschedule(matchId: string, newDate: string, reuseConvocation: boolean) {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, scheduled_at: newDate } : m))
    alert(`✅ Partido reprogramado.\n${reuseConvocation ? 'Se mantiene la última convocatoria.' : 'Hay que armar nueva convocatoria.'}`)
    setReprogramming(null)
  }

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={22} style={{ color: '#00843D' }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            FIXTURE
          </h1>
          <Badge variant="outline">{matches.length}</Badge>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#00843D' }}>
          <Plus size={16} /> Partido
        </button>
      </div>

      <div className="space-y-2">
        {sorted.map(match => {
          const cat = demoCategories.find(c => c.id === match.category_id)
          const date = new Date(match.scheduled_at)
          const isPast = date < new Date()
          return (
            <Card key={match.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${match.is_suspended ? '#DC2626' : isPast ? '#9ca3af' : '#00843D'}` }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs" style={{ borderColor: '#00843D', color: '#00843D' }}>
                    Cat. {cat?.name ?? '—'}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${match.is_home ? 'text-blue-700 border-blue-300' : 'text-gray-500'}`}>
                    {match.is_home ? '🏠 Local' : '✈️ Visitante'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Trophy size={18} style={{ color: '#C9A84C' }} />
                  <p className="font-bold text-base" style={{ fontFamily: "var(--font-barlow)" }}>
                    vs. {match.rival ?? 'Por definir'}
                  </p>
                  {match.is_suspended && <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">SUSPENDIDO</Badge>}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} — {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {match.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {match.venue}
                    </span>
                  )}
                </div>

                <div className="flex gap-1.5 pt-1 flex-wrap">
                  <a href={`/partidos/${match.id}`} className="text-xs px-2.5 py-1 rounded-lg font-bold text-white" style={{ backgroundColor: '#00843D' }}>
                    Abrir partido
                  </a>
                  <button onClick={() => setReprogramming(match)} className="text-xs px-2.5 py-1 rounded-lg border font-medium hover:bg-gray-50 flex items-center gap-1">
                    <Edit2 size={11} /> Reprogramar
                  </button>
                  <button
                    onClick={() => setMatches(prev => prev.map(m => m.id === match.id ? { ...m, is_suspended: !m.is_suspended } : m))}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1 ${match.is_suspended ? 'border-green-300 text-green-700' : 'border-red-200 text-red-600'}`}
                  >
                    <CloudRain size={11} /> {match.is_suspended ? 'Reactivar' : 'Suspender'}
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showAdd && <NewMatchModal onClose={() => setShowAdd(false)} onSubmit={(m) => { setMatches([...matches, { ...m, id: `ev-new-${matches.length + 1}` }]); setShowAdd(false); }} />}
      {reprogramming && <RescheduleModal match={reprogramming} onClose={() => setReprogramming(null)} onConfirm={handleReschedule} />}
    </div>
  )
}

function NewMatchModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (m: any) => void }) {
  const [form, setForm] = useState({
    category_id: demoCategories[0].id,
    rival: '',
    date: '',
    time: '10:00',
    is_home: true,
    venue: 'Predio Banfield Ramos Mejía',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      category_id: form.category_id,
      rival: form.rival,
      scheduled_at: `${form.date}T${form.time}:00`,
      is_home: form.is_home,
      venue: form.venue,
      is_suspended: false,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVO PARTIDO</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Categoría *</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {demoCategories.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Rival *</label>
            <input type="text" required value={form.rival} onChange={e => setForm({ ...form, rival: e.target.value })}
              placeholder="Ej: Deportivo Norte" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold mb-1 block">Fecha *</label>
              <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Hora *</label>
              <input type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setForm({ ...form, is_home: true })}
              className={`py-2 rounded-lg text-sm font-semibold border ${form.is_home ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={form.is_home ? { backgroundColor: '#00843D' } : {}}>🏠 Local</button>
            <button type="button" onClick={() => setForm({ ...form, is_home: false })}
              className={`py-2 rounded-lg text-sm font-semibold border ${!form.is_home ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={!form.is_home ? { backgroundColor: '#1d4ed8' } : {}}>✈️ Visitante</button>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Sede</label>
            <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
            CREAR PARTIDO
          </button>
        </form>
      </div>
    </div>
  )
}

function RescheduleModal({ match, onClose, onConfirm }: { match: FixtureMatch; onClose: () => void; onConfirm: (id: string, newDate: string, reuseConv: boolean) => void }) {
  const currentDate = new Date(match.scheduled_at)
  const [date, setDate] = useState(currentDate.toISOString().split('T')[0])
  const [time, setTime] = useState(currentDate.toTimeString().slice(0, 5))
  const [step, setStep] = useState<'date' | 'convocation'>('date')

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    setStep('convocation')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>REPROGRAMAR PARTIDO</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-xs text-muted-foreground">vs. {match.rival}</p>

        {step === 'date' ? (
          <form onSubmit={handleNext} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nueva fecha *</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Nueva hora *</label>
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
              SIGUIENTE
            </button>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold">¿Qué hacés con la convocatoria?</p>
            <p className="text-xs text-muted-foreground">El partido se mueve al {new Date(`${date}T${time}`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las {time}.</p>
            <button
              onClick={() => onConfirm(match.id, `${date}T${time}:00`, true)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: '#00843D' }}
            >
              ✓ Reusar última convocatoria
            </button>
            <button
              onClick={() => onConfirm(match.id, `${date}T${time}:00`, false)}
              className="w-full py-3 rounded-xl font-bold text-sm border-2 hover:bg-gray-50"
            >
              Armar nueva convocatoria
            </button>
            <button onClick={() => setStep('date')} className="w-full py-2 text-xs text-muted-foreground">← Volver</button>
          </div>
        )}
      </div>
    </div>
  )
}
