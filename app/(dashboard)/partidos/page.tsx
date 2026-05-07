'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, MapPin, Calendar, ClipboardList, Star, Users } from 'lucide-react'
import Link from 'next/link'
import { demoEvents, demoCategories, demoPlayers } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'

export default function PartidosPage() {
  const today = new Date('2026-05-07')
  const todayStr = today.toISOString().split('T')[0]

  // Partidos de hoy y los próximos 7 días
  const matches = demoEvents
    .filter(e => e.event_type === 'match' && !e.is_suspended)
    .map(m => ({
      ...m,
      date_obj: new Date(m.scheduled_at),
    }))
    .filter(m => {
      const days = Math.floor((m.date_obj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return days >= -1 && days <= 14
    })
    .sort((a, b) => a.date_obj.getTime() - b.date_obj.getTime())

  // Agrupar por día
  type GroupedDay = {
    date: string
    label: string
    isToday: boolean
    matches: typeof matches
  }
  const grouped: GroupedDay[] = []
  for (const m of matches) {
    const dateKey = m.scheduled_at.split('T')[0]
    let group = grouped.find(g => g.date === dateKey)
    if (!group) {
      const d = new Date(dateKey)
      const isToday = dateKey === todayStr
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
      const isTomorrow = dateKey === tomorrow.toISOString().split('T')[0]
      const label = isToday ? 'Hoy' : isTomorrow ? 'Mañana' : d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      group = { date: dateKey, label, isToday, matches: [] }
      grouped.push(group)
    }
    group.matches.push(m)
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Trophy size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          PARTIDOS
        </h1>
        <Badge variant="outline" className="text-[10px]">{matches.length}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Hoy y los próximos 14 días. Tap en uno para tomar asistencia, hacer cambios o cargar puntajes.
      </p>

      {grouped.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <Trophy size={36} className="mx-auto text-gray-300" />
          <p className="text-sm text-muted-foreground">No hay partidos programados</p>
          <Link href="/fixture" className="inline-block px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
            Ver fixture
          </Link>
        </div>
      )}

      {grouped.map(g => (
        <div key={g.date} className="space-y-2">
          <div className="flex items-center gap-2 mt-3">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow)", color: g.isToday ? 'var(--club-primary, #00843D)' : '#6b7280' }}>
              {g.label}
            </h2>
            {g.isToday && (
              <Badge className="text-[10px] bg-green-100 text-green-700 border-0 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1" /> HOY
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{g.matches.length} partido{g.matches.length === 1 ? '' : 's'}</span>
          </div>

          <div className="space-y-2">
            {g.matches.map(m => {
              const cat = demoCategories.find(c => c.id === m.category_id)
              const tiraFromId = m.id.match(/ev-match-\d+-(\w+)-/)?.[1] as Tira | undefined
              // inferir tira desde mayoría de jugadores de la categoría si no viene del id
              let tira: Tira | null = tiraFromId ?? null
              if (!tira) {
                const playersOfCat = demoPlayers.filter(p => p.category_id === m.category_id)
                const counts: Record<string, number> = {}
                for (const p of playersOfCat) counts[p.tira] = (counts[p.tira] || 0) + 1
                tira = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as Tira | null) ?? 'metro'
              }
              const color = tira ? TIRA_COLORS[tira] : '#9ca3af'
              return (
                <Link key={m.id} href={`/partidos/${m.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]" style={{ borderLeft: `4px solid ${color}` }}>
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {tira && (
                            <Badge className="text-[10px] border-0 text-white" style={{ backgroundColor: color }}>
                              {TIRA_LABELS[tira]}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">Cat. {cat?.name ?? '—'}</Badge>
                        </div>
                        <span className="text-xs font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                          {m.date_obj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
                        vs. {m.rival ?? 'Por definir'}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                        <span>{m.is_home ? '🏠 Local' : '✈️ Visitante'}</span>
                        {m.venue && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 truncate">
                              <MapPin size={10} /> {m.venue}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: '#00843D20', color: '#00843D' }}>
                          <ClipboardList size={10} /> Asistencia
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: '#1d4ed820', color: '#1d4ed8' }}>
                          <Users size={10} /> Convocatoria
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1" style={{ backgroundColor: '#C9A84C20', color: '#C9A84C' }}>
                          <Star size={10} /> Puntajes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
