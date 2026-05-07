'use client'

import { use, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trophy, MapPin, Calendar, ClipboardList, Star, Edit2, ArrowUpDown, AlertTriangle, Ban, MessageSquare, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, demoCategories, demoPlayers } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, type Position } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'
import { getSportFormat, type SportCode } from '@/lib/sports'

type CardStatus = 'none' | 'yellow' | 'red'

export default function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()

  const cat = demoCategories.find(c => c.id === event!.category_id)
  // Formato de juego de la categoría (cada cat puede tener distinto)
  const sportCode = (cat?.sport_format_code ?? 'football_11') as SportCode
  const format = getSportFormat(sportCode)
  const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
  const allOfCat = demoPlayers.filter(p => p.category_id === event!.category_id)

  // Estructura de titulares según el formato:
  // football_11: 1 arq + 4 def + 4 med + 2 del = 11
  // baby_6:      1 arq + 2 def + 2 med + 1 del = 6
  // baby_5:      1 arq + 1 def + 1 med + 2 del = 5  (variable)
  // futsal:      1 arq + 1 def + 2 med + 1 del = 5
  const slotsByPos = sportCode === 'football_11' ? { arquero: 1, defensor: 4, mediocampista: 4, delantero: 2 }
                   : sportCode === 'baby_6'      ? { arquero: 1, defensor: 2, mediocampista: 2, delantero: 1 }
                   : sportCode === 'baby_5'      ? { arquero: 1, defensor: 1, mediocampista: 1, delantero: 2 }
                   : sportCode === 'futsal'      ? { arquero: 1, defensor: 1, mediocampista: 2, delantero: 1 }
                   :                                 { arquero: 1, defensor: 4, mediocampista: 4, delantero: 2 }

  const arq = allOfCat.filter(p => p.primary_position === 'arquero')
  const def = allOfCat.filter(p => p.primary_position === 'defensor')
  const med = allOfCat.filter(p => p.primary_position === 'mediocampista')
  const del = allOfCat.filter(p => p.primary_position === 'delantero')

  const initialTitulares = [
    ...arq.slice(0, slotsByPos.arquero),
    ...def.slice(0, slotsByPos.defensor),
    ...med.slice(0, slotsByPos.mediocampista),
    ...del.slice(0, slotsByPos.delantero),
  ]
  const maxSubs = format.players_on_field > 9 ? 5 : 3
  const initialSuplentes = allOfCat.filter(p => !initialTitulares.includes(p)).slice(0, maxSubs)

  const [titularesIds, setTitularesIds] = useState<string[]>(initialTitulares.map(p => p.id))
  const [suplentesIds, setSuplentesIds] = useState<string[]>(initialSuplentes.map(p => p.id))
  const [cards, setCards] = useState<Record<string, CardStatus>>({})
  const [matchComment, setMatchComment] = useState('')
  const [swap, setSwap] = useState<{ titularId?: string; suplenteId?: string } | null>(null)

  const titulares = titularesIds.map(id => allOfCat.find(p => p.id === id)!).filter(Boolean)
  const suplentes = suplentesIds.map(id => allOfCat.find(p => p.id === id)!).filter(Boolean)

  // Agrupados por posición principal
  const titularesByPos: Record<Position, typeof titulares> = { arquero: [], defensor: [], mediocampista: [], delantero: [] }
  for (const t of titulares) titularesByPos[t.primary_position].push(t)

  const date = new Date(event!.scheduled_at)

  function setCard(playerId: string, status: CardStatus) {
    setCards(prev => ({ ...prev, [playerId]: status }))
  }

  function performSwap(titularId: string, suplenteId: string) {
    setTitularesIds(prev => prev.map(id => id === titularId ? suplenteId : id))
    setSuplentesIds(prev => prev.map(id => id === suplenteId ? titularId : id))
    setSwap(null)
  }

  return (
    <div className="pb-4">
      <div className="text-white p-4 pb-6" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}>
        <Link href="/fixture" className="text-white/80 text-xs flex items-center gap-1 mb-2">
          <ArrowLeft size={12} /> Fixture
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={20} style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
            vs. {event!.rival}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/90">
          <span className="flex items-center gap-1"><Calendar size={11} /> {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          {event!.venue && <span className="flex items-center gap-1"><MapPin size={11} /> {event!.venue}</span>}
          <span>Cat. {cat?.name}</span>
        </div>
      </div>

      <div className="p-3 space-y-3 -mt-3">
        {/* Acciones */}
        <div className="grid grid-cols-3 gap-2">
          <Link href={`/convocatoria?event=${id}`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <Edit2 size={14} className="mx-auto" style={{ color: '#1d4ed8' }} />
                <p className="text-[10px] font-bold mt-1">Convocatoria</p>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/partidos/${id}/asistencia`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <ClipboardList size={14} className="mx-auto" style={{ color: '#00843D' }} />
                <p className="text-[10px] font-bold mt-1">Asistencia</p>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/partidos/${id}/puntajes`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <Star size={14} className="mx-auto" style={{ color: '#C9A84C' }} />
                <p className="text-[10px] font-bold mt-1">Puntajes</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Formación visual */}
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
          FORMACIÓN
        </h2>
        <p className="text-[10px] text-muted-foreground -mt-2">Tap en un jugador para hacer cambio o marcar tarjeta</p>

        <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: '2/3', maxWidth: 480, margin: '0 auto' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }}>
            <svg viewBox="0 0 200 300" className="w-full h-full">
              <rect x="5" y="5" width="190" height="290" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <line x1="5" y1="150" x2="195" y2="150" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <circle cx="100" cy="150" r="20" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <circle cx="100" cy="150" r="1" fill="white" opacity="0.7" />
              <rect x="50" y="5" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="50" y="260" width="100" height="35" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="75" y="5" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
              <rect x="75" y="280" width="50" height="15" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
            </svg>
          </div>

          {(() => {
            const layouts: Record<string, { y: number }> = {
              arquero: { y: 92 },
              defensor: { y: 70 },
              mediocampista: { y: 45 },
              delantero: { y: 18 },
            }
            return POSITIONS.flatMap(pos => {
              const players = titularesByPos[pos]
              return players.map((p, i) => {
                const x = ((i + 1) / (players.length + 1)) * 100
                const card = cards[p.id]
                return (
                  <button
                    key={p.id}
                    onClick={() => setSwap({ titularId: p.id })}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${layouts[pos].y}%` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full bg-white border-2 shadow-lg overflow-hidden relative"
                      style={{ borderColor: POSITION_COLORS[p.primary_position] }}
                    >
                      <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
                      {card === 'yellow' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-yellow-400 border border-yellow-600 z-10" />}
                      {card === 'red' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-red-600 border border-red-800 z-10" />}
                    </div>
                    <p className="text-[9px] text-white text-center mt-0.5 font-bold leading-tight whitespace-nowrap drop-shadow-md">
                      {p.full_name.split(' ').slice(-1)[0]}
                    </p>
                  </button>
                )
              })
            })
          })()}
        </div>

        {/* Suplentes */}
        <h3 className="text-xs uppercase font-bold text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
          Suplentes ({suplentes.length})
        </h3>
        <div className="space-y-1.5">
          {suplentes.map(p => {
            const card = cards[p.id]
            return (
              <Card key={p.id} className="border-0 shadow-sm bg-amber-50">
                <CardContent className="p-2 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 relative bg-white" style={{ borderColor: POSITION_COLORS[p.primary_position] }}>
                    <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
                    {card === 'yellow' && <span className="absolute -top-1 -right-1 w-3 h-4 rounded-sm bg-yellow-400 border border-yellow-600 z-10" />}
                    {card === 'red' && <span className="absolute -top-1 -right-1 w-3 h-4 rounded-sm bg-red-600 border border-red-800 z-10" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.full_name}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                      {POSITION_LABELS[p.primary_position]}
                    </span>
                  </div>
                  <button
                    onClick={() => setSwap({ suplenteId: p.id })}
                    className="text-xs px-2 py-1 rounded text-white font-semibold flex items-center gap-1 flex-shrink-0"
                    style={{ backgroundColor: '#00843D' }}
                  >
                    <ArrowUpDown size={12} /> Subir
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tarjetas amarillas y rojas */}
        <h3 className="text-xs uppercase font-bold text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
          Tarjetas
        </h3>
        <div className="space-y-1.5">
          {[...titulares, ...suplentes].map(p => {
            const card = cards[p.id] ?? 'none'
            return (
              <div key={p.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                <span className="flex-1 text-sm font-medium truncate">{p.full_name}</span>
                <button
                  onClick={() => setCard(p.id, card === 'none' ? 'yellow' : 'none')}
                  className={`w-6 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold border ${card === 'yellow' ? 'bg-yellow-400 border-yellow-600' : 'bg-yellow-50 border-yellow-200 opacity-50'}`}
                  title="Amonestación"
                >🟨</button>
                <button
                  onClick={() => setCard(p.id, card === 'red' ? 'none' : 'red')}
                  className={`w-6 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold border ${card === 'red' ? 'bg-red-600 border-red-800' : 'bg-red-50 border-red-200 opacity-50'}`}
                  title="Expulsión"
                >🟥</button>
              </div>
            )
          })}
        </div>

        {/* Comentario del partido */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
              <MessageSquare size={12} /> COMENTARIO DEL PARTIDO
            </p>
            <textarea
              value={matchComment}
              onChange={e => setMatchComment(e.target.value)}
              rows={3}
              placeholder="Resumen del partido, jugadas clave, decisiones tácticas..."
              className="w-full text-sm px-3 py-2 border rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm sticky bottom-20 md:bottom-4"
          style={{ backgroundColor: '#00843D' }}
          onClick={() => {
            const yellows = Object.values(cards).filter(c => c === 'yellow').length
            const reds = Object.values(cards).filter(c => c === 'red').length
            alert(`✅ Partido guardado (demo)\n\n${yellows} amonestaciones · ${reds} expulsiones\nComentario: ${matchComment ? 'sí' : 'no'}`)
          }}
        >
          GUARDAR PARTIDO
        </button>
      </div>

      {/* Modal de cambio */}
      {swap && (
        <SwapModal
          titulares={titulares}
          suplentes={suplentes}
          initialTitularId={swap.titularId}
          initialSuplenteId={swap.suplenteId}
          onClose={() => setSwap(null)}
          onConfirm={performSwap}
        />
      )}
    </div>
  )
}

function SwapModal({ titulares, suplentes, initialTitularId, initialSuplenteId, onClose, onConfirm }: {
  titulares: { id: string; full_name: string; primary_position: Position }[]
  suplentes: { id: string; full_name: string; primary_position: Position }[]
  initialTitularId?: string
  initialSuplenteId?: string
  onClose: () => void
  onConfirm: (titularId: string, suplenteId: string) => void
}) {
  const [titularId, setTitularId] = useState(initialTitularId ?? '')
  const [suplenteId, setSuplenteId] = useState(initialSuplenteId ?? '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>CAMBIO</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">Sale (titular)</label>
          <select value={titularId} onChange={e => setTitularId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Elegir titular...</option>
            {titulares.map(t => <option key={t.id} value={t.id}>{t.full_name} — {POSITION_LABELS[t.primary_position]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">Entra (suplente)</label>
          <select value={suplenteId} onChange={e => setSuplenteId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Elegir suplente...</option>
            {suplentes.map(s => <option key={s.id} value={s.id}>{s.full_name} — {POSITION_LABELS[s.primary_position]}</option>)}
          </select>
        </div>
        <button
          onClick={() => titularId && suplenteId && onConfirm(titularId, suplenteId)}
          disabled={!titularId || !suplenteId}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: '#00843D' }}
        >
          CONFIRMAR CAMBIO
        </button>
      </div>
    </div>
  )
}
