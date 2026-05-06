'use client'

import { useState, use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, MapPin, Calendar, ClipboardList, Star, MessageCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, demoCategories, demoPlayers } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_COLORS, TIRA_LABELS } from '@/types'

export default function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()

  const cat = demoCategories.find(c => c.id === event!.category_id)
  const convocados = demoPlayers.filter(p => p.category_id === event!.category_id).slice(0, 14)
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
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Convocados</p>
              <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>{convocados.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Confirmados</p>
              <p className="text-2xl font-bold mt-0.5 text-green-600" style={{ fontFamily: "var(--font-barlow)" }}>{convocados.length - 2}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Bajas</p>
              <p className="text-2xl font-bold mt-0.5 text-red-500" style={{ fontFamily: "var(--font-barlow)" }}>2</p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones */}
        <Link href={`/partidos/${id}/asistencia`}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00843D' }}>
                <ClipboardList size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Asistencia del partido</p>
                <p className="text-xs text-muted-foreground">Marcar quién vino, quién no</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/partidos/${id}/puntajes`}>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C9A84C' }}>
                <Star size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Puntajes</p>
                <p className="text-xs text-muted-foreground">Calificar 1-10 a los que jugaron</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Lista de convocados */}
        <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-4" style={{ fontFamily: "var(--font-barlow)" }}>
          CONVOCADOS ({convocados.length})
        </h2>
        <div className="space-y-2">
          {convocados.map(p => (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                  {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.full_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                      {POSITION_LABELS[p.primary_position]}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[p.tira] }}>
                      {TIRA_LABELS[p.tira]}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
