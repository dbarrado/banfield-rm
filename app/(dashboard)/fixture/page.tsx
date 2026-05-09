'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Trophy, Plus, X, CloudRain, Edit2 } from 'lucide-react'
import { getEventsForClub, getCategoriesForClub, getPlayersForClub } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
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
  const club = useCurrentClub()
  const demoCategories = getCategoriesForClub(club.id)
  const demoPlayers = getPlayersForClub(club.id)
  const demoEvents = getEventsForClub(club.id)
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

      {showAdd && (
        <NewMatchModal
          categories={demoCategories}
          players={demoPlayers}
          onClose={() => setShowAdd(false)}
          onSubmit={(newMatches) => {
            const withIds = newMatches.map((m, i) => ({ ...m, id: `ev-new-${Date.now()}-${i}` }))
            setMatches([...matches, ...withIds])
            setShowAdd(false)
          }}
        />
      )}
      {reprogramming && <RescheduleModal match={reprogramming} onClose={() => setReprogramming(null)} onConfirm={handleReschedule} />}
    </div>
  )
}

function NewMatchModal({ onClose, onSubmit, categories, players }: { onClose: () => void; onSubmit: (matches: any[]) => void; categories: any[]; players: any[] }) {
  const demoCategories = categories
  const demoPlayers = players
  const ALL_TIRAS: ('metro' | 'liga1' | 'liga2' | 'edefi')[] = ['metro', 'liga1', 'liga2', 'edefi']
  const [tira, setTira] = useState<'metro' | 'liga1' | 'liga2' | 'edefi'>('metro')
  const [rival, setRival] = useState('')
  const [date, setDate] = useState('')
  const [isHome, setIsHome] = useState(true)
  const [venue, setVenue] = useState('Predio Banfield Ramos Mejía')
  const [address, setAddress] = useState('Av. Rivadavia 14250, Ramos Mejía')
  const [shareLink, setShareLink] = useState('')

  // Categorías que tienen jugadores en esa tira
  const categoriesInTira = demoCategories.filter(c =>
    c.is_active && demoPlayers.some(p => p.category_id === c.id && p.tira === tira)
  )

  // Horarios default — secuencia típica de un sábado por la mañana, escalonado por categoría
  const DEFAULT_HOMES = ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45', '13:30', '14:15']
  const DEFAULT_AWAY  = ['10:00', '10:45', '11:30', '12:15', '13:00', '13:45', '14:30', '15:15']

  // Map: catId → time
  const [times, setTimes] = useState<Record<string, string>>({})

  // Inicializar/actualizar horarios al cambiar tira o local/visitante
  function recomputeDefaultTimes() {
    const defaults = isHome ? DEFAULT_HOMES : DEFAULT_AWAY
    const next: Record<string, string> = {}
    categoriesInTira.forEach((c, i) => {
      next[c.id] = defaults[i] ?? defaults[defaults.length - 1]
    })
    setTimes(next)
  }

  // Actualizar default cuando cambian inputs clave
  if (Object.keys(times).length === 0 && categoriesInTira.length > 0) {
    recomputeDefaultTimes()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (categoriesInTira.length === 0) return
    const matches = categoriesInTira.map(c => ({
      category_id: c.id,
      rival,
      scheduled_at: `${date}T${times[c.id] ?? '10:00'}:00`,
      is_home: isHome,
      venue,
      is_suspended: false,
    }))
    onSubmit(matches)
  }

  function generateMapLink() {
    if (!address.trim()) return
    const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    setShareLink(link)
  }

  function shareWA() {
    const baseLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    const msg = `📍 ${venue}\n${address}\n\n${baseLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVO PARTIDO POR TIRA</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Crea un partido para cada categoría de la tira que juega el mismo día contra el mismo rival.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Tira *</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_TIRAS.map(t => {
                const sel = tira === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTira(t); setTimes({}); }}
                    className={`py-2 rounded-lg text-sm font-bold border-2 ${sel ? 'text-white border-transparent' : 'border-gray-200'}`}
                    style={sel ? { backgroundColor: TIRA_COLORS[t] } : {}}
                  >
                    {TIRA_LABELS[t]}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Se crearán {categoriesInTira.length} partido{categoriesInTira.length === 1 ? '' : 's'}: {categoriesInTira.map(c => c.name).join(', ')}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Rival *</label>
            <input type="text" required value={rival} onChange={e => setRival(e.target.value)}
              placeholder="Ej: Independiente" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Fecha *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">¿Local o visitante?</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setIsHome(true); setTimes({}); }}
                className={`py-2 rounded-lg text-sm font-semibold border-2 ${isHome ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={isHome ? { backgroundColor: '#00843D' } : {}}>🏠 Local</button>
              <button type="button" onClick={() => { setIsHome(false); setTimes({}); }}
                className={`py-2 rounded-lg text-sm font-semibold border-2 ${!isHome ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={!isHome ? { backgroundColor: '#1d4ed8' } : {}}>✈️ Visitante</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Sede</label>
            <input type="text" value={venue} onChange={e => setVenue(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>

          <div className="space-y-1.5 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <label className="text-xs font-semibold flex items-center gap-1">
              <MapPin size={12} className="text-blue-600" /> Dirección (Google Maps)
            </label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="Av. Rivadavia 14250, Ramos Mejía" className="w-full px-3 py-2 border rounded text-xs" />
            <div className="flex gap-1.5">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex-1 text-center py-1.5 rounded text-xs font-semibold bg-blue-600 text-white"
              >
                🗺️ Ver en Maps
              </a>
              <button
                type="button"
                onClick={shareWA}
                className="flex-1 py-1.5 rounded text-xs font-semibold bg-green-600 text-white"
              >
                💬 Compartir por WhatsApp
              </button>
            </div>
          </div>

          {/* Horarios por categoría */}
          {categoriesInTira.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold">Horarios por categoría</label>
                <span className="text-[10px] text-muted-foreground">
                  {isHome ? 'Default local' : 'Default visitante'}
                </span>
              </div>
              <div className="space-y-1.5 bg-gray-50 rounded-lg p-2">
                {categoriesInTira.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="text-xs font-semibold w-12">Cat. {c.name}</span>
                    <input
                      type="time"
                      value={times[c.id] ?? '10:00'}
                      onChange={e => setTimes({ ...times, [c.id]: e.target.value })}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {c.sport_format_code === 'baby_5' ? 'Baby 5' :
                       c.sport_format_code === 'baby_6' ? 'Baby 6' :
                       c.sport_format_code === 'football_11' ? 'Fútbol 11' :
                       c.sport_format_code ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 italic">
                Default basado en horarios típicos de la última fecha como {isHome ? 'local' : 'visitante'}.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!rival || !date || categoriesInTira.length === 0}
            className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
            style={{ backgroundColor: '#00843D' }}
          >
            CREAR {categoriesInTira.length} PARTIDO{categoriesInTira.length === 1 ? '' : 'S'}
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
