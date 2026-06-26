'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Star, FileSpreadsheet, FileText, Filter } from 'lucide-react'
import Link from 'next/link'
import {
  demoMatchRatings,
  demoPlayers,
  demoCategories,
  demoEvents,
  demoProfes,
  getPlayerRatingStats,
} from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS, type Tira, type Position } from '@/types'
import { useActiveRole } from '@/lib/use-role'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'

const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']
const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']

export default function RendimientoDeportivoPage() {
  // GATE de seguridad: tesoreros no entran. Padres viven en /padres/, fuera de este shell.
  const [activeRole] = useActiveRole()
  const club = useCurrentClub()
  if (activeRole === 'tesorero') {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground">Este reporte es de uso exclusivo del cuerpo técnico.</p>
        <Link href="/reportes" className="text-xs text-blue-600 underline mt-2 inline-block">← Volver a Reportes</Link>
      </div>
    )
  }
  // Club real: aún no hay evaluaciones de partidos cargadas → estado vacío honesto
  // (no mostrar el plantel/puntajes demo).
  if (isRealClub(club.id)) {
    return (
      <div className="p-3 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/reportes" className="p-1.5 rounded hover:bg-gray-100">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            RENDIMIENTO DEPORTIVO
          </h1>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center space-y-2">
            <Star size={28} className="mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold">Aún no hay evaluaciones cargadas</p>
            <p className="text-xs text-muted-foreground">
              Las evaluaciones deportivas se generan después de cada partido, desde la sección Partidos → Puntajes.
              Cuando el cuerpo técnico cargue puntajes, este reporte se completa automáticamente.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [filterCat, setFilterCat] = useState<string>('')
  const [filterTira, setFilterTira] = useState<Tira | ''>('')
  const [filterPos, setFilterPos] = useState<Position | ''>('')
  const [sort, setSort] = useState<'avg' | 'count' | 'lastFive' | 'name'>('avg')

  const activeCats = demoCategories.filter(c => c.is_active)

  // Jugadores que tienen al menos 1 rating
  const playersWithRatings = useMemo(() => {
    const playerIds = new Set(demoMatchRatings.map(r => r.player_id))
    return demoPlayers
      .filter(p => playerIds.has(p.id) && p.is_active)
      .filter(p => !filterCat || p.category_id === filterCat)
      .filter(p => !filterTira || p.tira === filterTira)
      .filter(p => !filterPos || p.primary_position === filterPos)
      .map(p => ({ ...p, stats: getPlayerRatingStats(p.id) }))
      .sort((a, b) => {
        if (sort === 'avg') return b.stats.avg - a.stats.avg
        if (sort === 'count') return b.stats.count - a.stats.count
        if (sort === 'lastFive') return b.stats.lastFiveAvg - a.stats.lastFiveAvg
        return a.full_name.localeCompare(b.full_name)
      })
  }, [filterCat, filterTira, filterPos, sort])

  const totalRatings = playersWithRatings.reduce((s, p) => s + p.stats.count, 0)
  const globalAvg = totalRatings > 0
    ? playersWithRatings.reduce((s, p) => s + p.stats.avg * p.stats.count, 0) / totalRatings
    : 0
  const withComments = demoMatchRatings.filter(r => {
    if (!r.observation) return false
    const player = demoPlayers.find(p => p.id === r.player_id)
    if (!player) return false
    if (filterCat && player.category_id !== filterCat) return false
    if (filterTira && player.tira !== filterTira) return false
    if (filterPos && player.primary_position !== filterPos) return false
    return true
  }).length

  function scoreColor(score: number): string {
    if (score >= 8) return '#00843D'
    if (score >= 6) return '#1d4ed8'
    if (score >= 4) return '#F59E0B'
    return '#DC2626'
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/reportes" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <Star size={20} style={{ color: '#1d4ed8' }} />
        <h1 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>
          RENDIMIENTO DEPORTIVO
        </h1>
      </div>

      <Card className="border-0 shadow-sm bg-blue-50 border-l-4 border-l-blue-700">
        <CardContent className="p-2.5 flex items-center gap-2">
          <span className="text-[18px]">🔒</span>
          <p className="text-[11px] text-blue-900 leading-snug">
            <strong>Confidencial.</strong> Reporte de uso interno del cuerpo técnico. Los puntajes y comentarios <strong>no son visibles para padres ni jugadores</strong>.
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
            <Filter size={12} /> Filtros
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="px-2 py-1.5 rounded border text-xs bg-white">
              <option value="">Todas las categorías</option>
              {activeCats.map(c => <option key={c.id} value={c.id}>Cat. {c.name}</option>)}
            </select>
            <select value={filterTira} onChange={e => setFilterTira(e.target.value as Tira | '')} className="px-2 py-1.5 rounded border text-xs bg-white">
              <option value="">Todas las tiras</option>
              {ALL_TIRAS.map(t => <option key={t} value={t}>{TIRA_LABELS[t]}</option>)}
            </select>
            <select value={filterPos} onChange={e => setFilterPos(e.target.value as Position | '')} className="px-2 py-1.5 rounded border text-xs bg-white">
              <option value="">Todas las posiciones</option>
              {POSITIONS.map(p => <option key={p} value={p}>{POSITION_LABELS[p]}s</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="px-2 py-1.5 rounded border text-xs bg-white">
              <option value="avg">Ordenar por promedio</option>
              <option value="lastFive">Ordenar por últimos 5</option>
              <option value="count">Ordenar por partidos puntuados</option>
              <option value="name">Ordenar por nombre</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Jugadores</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{playersWithRatings.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Promedio global</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>{globalAvg.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Comentarios</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{withComments}</p>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <div className="flex gap-2">
        <button onClick={() => alert('Export Excel (demo)')} className="flex-1 px-2 py-1.5 rounded border text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1">
          <FileSpreadsheet size={11} /> Exportar Excel
        </button>
        <button onClick={() => alert('Export PDF (demo)')} className="flex-1 px-2 py-1.5 rounded border text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1">
          <FileText size={11} /> Exportar PDF
        </button>
      </div>

      {/* Listado de jugadores */}
      <div className="space-y-2">
        {playersWithRatings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay evaluaciones que cumplan los filtros seleccionados.</p>
        ) : playersWithRatings.map(p => {
          const cat = demoCategories.find(c => c.id === p.category_id)
          // Últimos 3 comentarios
          const recentWithComment = demoMatchRatings
            .filter(r => r.player_id === p.id && r.observation)
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 3)
          return (
            <Card key={p.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${scoreColor(p.stats.avg)}` }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/socios/${p.id}`} className="text-sm font-semibold hover:underline truncate block">
                      {p.full_name}
                    </Link>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                        {POSITION_LABELS[p.primary_position]}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[p.tira] }}>
                        {TIRA_LABELS[p.tira]}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-gray-100 text-gray-600">
                        Cat. {cat?.name}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center flex-shrink-0">
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Prom</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: scoreColor(p.stats.avg) }}>{p.stats.avg}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Últ 5</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: scoreColor(p.stats.lastFiveAvg) }}>{p.stats.lastFiveAvg}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-muted-foreground">Part</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{p.stats.count}</p>
                    </div>
                  </div>
                </div>
                {recentWithComment.length > 0 && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    {recentWithComment.map(r => {
                      const ev = demoEvents.find(e => e.id === r.event_id)
                      const profe = demoProfes.find(prf => prf.id === r.rated_by_profe_id)
                      const d = ev ? new Date(ev.scheduled_at) : new Date(r.created_at)
                      return (
                        <div key={r.id} className="flex items-start gap-1.5 text-[11px]">
                          <span className="font-bold w-5 text-center flex-shrink-0" style={{ color: scoreColor(r.score) }}>{r.score}</span>
                          <div className="flex-1 min-w-0">
                            <p className="italic text-gray-700">"{r.observation}"</p>
                            <p className="text-[9px] text-muted-foreground">
                              vs. {ev?.rival ?? '—'} · {d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                              {profe && <> · {profe.full_name}</>}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
