'use client'

import { use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, MapPin, Calendar, ClipboardList, Star, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, demoCategories, demoPlayers } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_COLORS, TIRA_LABELS, type Position } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']

export default function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()

  const cat = demoCategories.find(c => c.id === event!.category_id)
  // Demo: tomar 11 titulares + 3 suplentes
  const allOfCat = demoPlayers.filter(p => p.category_id === event!.category_id)
  const arqueros = allOfCat.filter(p => p.primary_position === 'arquero').slice(0, 1)
  const defensores = allOfCat.filter(p => p.primary_position === 'defensor').slice(0, 4)
  const medios = allOfCat.filter(p => p.primary_position === 'mediocampista').slice(0, 4)
  const delanteros = allOfCat.filter(p => p.primary_position === 'delantero').slice(0, 2)
  const titulares = [...arqueros, ...defensores, ...medios, ...delanteros]
  const suplentes = allOfCat.filter(p => !titulares.includes(p)).slice(0, 3)
  const convocados = [...titulares, ...suplentes]
  const date = new Date(event!.scheduled_at)

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
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Convocados</p>
              <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>{convocados.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Titulares</p>
              <p className="text-2xl font-bold mt-0.5 text-green-600" style={{ fontFamily: "var(--font-barlow)" }}>{titulares.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Suplentes</p>
              <p className="text-2xl font-bold mt-0.5 text-amber-600" style={{ fontFamily: "var(--font-barlow)" }}>{suplentes.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones — antes/durante/después */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Link href={`/convocatoria?event=${id}`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1d4ed8' }}>
                  <Edit2 size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Editar convocatoria</p>
                  <p className="text-[11px] text-muted-foreground">Antes del partido</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/partidos/${id}/asistencia`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#00843D' }}>
                  <ClipboardList size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Asistencia</p>
                  <p className="text-[11px] text-muted-foreground">Día del partido</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/partidos/${id}/puntajes`}>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#C9A84C' }}>
                  <Star size={16} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Puntajes 1-10</p>
                  <p className="text-[11px] text-muted-foreground">Después del partido</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Formación visual */}
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-4" style={{ fontFamily: "var(--font-barlow)" }}>
          FORMACIÓN
        </h2>
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

          {/* Posicionar titulares */}
          {(() => {
            const layouts: Record<string, { y: number; players: typeof titulares }> = {
              arquero: { y: 92, players: arqueros },
              defensor: { y: 70, players: defensores },
              mediocampista: { y: 45, players: medios },
              delantero: { y: 18, players: delanteros },
            }
            return POSITIONS.flatMap(pos => {
              const { y, players } = layouts[pos]
              return players.map((p, i) => {
                const x = ((i + 1) / (players.length + 1)) * 100
                return (
                  <div
                    key={p.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full bg-white border-2 shadow-lg flex items-center justify-center text-[10px] font-bold"
                      style={{ borderColor: POSITION_COLORS[p.primary_position], color: POSITION_COLORS[p.primary_position] }}
                    >
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-[9px] text-white text-center mt-0.5 font-bold leading-tight whitespace-nowrap drop-shadow-md">
                      {p.full_name.split(' ').slice(-1)[0]}
                    </p>
                  </div>
                )
              })
            })
          })()}
        </div>

        {/* Suplentes */}
        {suplentes.length > 0 && (
          <>
            <h3 className="text-xs uppercase font-bold text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
              Suplentes ({suplentes.length})
            </h3>
            <div className="space-y-1.5">
              {suplentes.map(p => (
                <Card key={p.id} className="border-0 shadow-sm bg-amber-50">
                  <CardContent className="p-2 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.full_name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                        {POSITION_LABELS[p.primary_position]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
