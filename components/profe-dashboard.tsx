'use client'

// Dashboard del profe puro (club real): 100% deportivo y personal — sin plata.
// Bloques (definición Diego 24-jul): Mis clases de hoy · Plan del día · Baja asistencia.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ClipboardList, AlertTriangle, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { getAssignmentsForProfe, getPlayersForClub, getCategoriesForClub, demoEligibilityConfig } from '@/lib/demo-data'
import { useCurrentProfe } from '@/lib/use-current-profe'
import { loadTrainingSlots } from '@/lib/data/ops-store'
import { loadPracticeStatsBulk, loadPracticeCategoriesForDate } from '@/lib/data/attendance-store'
import { loadPlansForDay, type DayPlan } from '@/lib/data/plan-store'
import { getTiraLabel, getTiraColor } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'
import type { Club } from '@/types'

type Slot = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  court: number
  category_ids: string[]
  tiras: string[]
  is_active: boolean
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function ProfeDashboard({ club }: { club: Club }) {
  const { profeId, profeName } = useCurrentProfe(club.id)
  const assignments = profeId ? getAssignmentsForProfe(profeId) : []
  const cats = getCategoriesForClub(club.id)
  const players = getPlayersForClub(club.id)
  const sport = (club.default_sport_code ?? 'football_11') as SportCode

  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [takenCats, setTakenCats] = useState<Set<string>>(new Set())
  const [plans, setPlans] = useState<Record<string, DayPlan>>({})
  const [lowAtt, setLowAtt] = useState<{ id: string; name: string; cat: string; pct: number }[] | null>(null)
  // Sección colapsable: cerrada por defecto; al abrir muestra la lista COMPLETA (sin corte)
  const [lowOpen, setLowOpen] = useState(false)

  useEffect(() => {
    if (!profeId) return
    let cancelled = false
    const dateISO = todayISO()
    const dow = new Date().getDay()
    const myAssign = getAssignmentsForProfe(profeId)
    const myCatIds = Array.from(new Set(myAssign.map(a => a.category_id)))

    // Mis clases de hoy: turnos donde alguna (categoría × tira) es mía
    loadTrainingSlots(club.id).then(all => {
      if (cancelled || !all) return
      const mine = (all as Slot[]).filter(s =>
        s.is_active && s.day_of_week === dow &&
        (s.tiras ?? []).some(t => (s.category_ids ?? []).some(c => myAssign.some(a => a.tira === t && a.category_id === c)))
      ).sort((a, b) => a.start_time.localeCompare(b.start_time))
      setSlots(mine)
      // Plan del día de las categorías que me tocan hoy — UN solo request
      const todayCats = Array.from(new Set(mine.flatMap(s => s.category_ids ?? []))).filter(c => myCatIds.includes(c))
      loadPlansForDay(club.id, todayCats, dateISO).then(all => {
        if (cancelled) return
        const conContenido = Object.fromEntries(
          Object.entries(all).filter(([, p]) => p.items.some(i => i.description?.trim()))
        )
        setPlans(conContenido)
      })
    })

    loadPracticeCategoriesForDate(club.id, dateISO).then(s => { if (!cancelled) setTakenCats(s) })

    // Chicos con baja asistencia en MIS (categoría × tira) — 2 requests en total (bulk)
    loadPracticeStatsBulk(club.id, myCatIds)
      .then(bulk => {
        if (cancelled) return
        const results = myCatIds.map(catId => ({ catId, stats: bulk?.[catId] ?? null }))
        const th = demoEligibilityConfig.min_practice_percentage
        const out: { id: string; name: string; cat: string; pct: number }[] = []
        for (const { catId, stats } of results) {
          if (!stats) continue
          const myTiras = new Set(myAssign.filter(a => a.category_id === catId).map(a => a.tira))
          for (const p of players) {
            if (p.category_id !== catId || !p.is_active || !myTiras.has(p.tira)) continue
            const s = stats[p.id]
            if (s && s.total > 0 && s.percentage < th) {
              out.push({ id: p.id, name: p.full_name, cat: cats.find(c => c.id === catId)?.name ?? '', pct: s.percentage })
            }
          }
        }
        out.sort((a, b) => a.pct - b.pct)
        setLowAtt(out)
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club.id, profeId])

  const catName = (id: string) => cats.find(c => c.id === id)?.name ?? '—'

  return (
    <div className="space-y-4">
      {/* Mis clases de hoy */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-barlow)' }}>
          <CalendarDays size={14} /> MIS CLASES DE HOY{profeName ? ` — ${profeName.split(' ')[0].toUpperCase()}` : ''}
        </h2>
        {slots === null ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : slots.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-sm text-muted-foreground">Hoy no tenés clases asignadas. 🙌</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {slots.map(s => {
              const taken = (s.category_ids ?? []).some(c => takenCats.has(c))
              const tira = (s.tiras ?? [])[0]
              return (
                <Card key={s.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${tira ? getTiraColor(tira, sport) : '#9ca3af'}` }}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="text-center flex-shrink-0">
                      <p className="text-lg font-bold leading-none" style={{ fontFamily: 'var(--font-barlow)' }}>{s.start_time}</p>
                      <p className="text-[10px] text-muted-foreground">{s.end_time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        Cat. {(s.category_ids ?? []).map(catName).join(', ')}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {(s.tiras ?? []).map(t => getTiraLabel(t, sport)).join(' · ')} · Cancha {s.court}
                      </p>
                    </div>
                    {taken ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 flex-shrink-0">
                        <CheckCircle2 size={15} /> Tomada
                      </span>
                    ) : (
                      <Link href="/asistencia" className="text-xs font-bold px-3 py-2 rounded-lg text-white flex-shrink-0" style={{ backgroundColor: club.primary_color }}>
                        Tomar asistencia
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Plan del día (solo lectura — lo define el coordinador) */}
      {slots !== null && slots.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-barlow)' }}>
            <ClipboardList size={14} /> PLAN DEL DÍA
          </h2>
          {Object.keys(plans).length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 text-sm text-muted-foreground">
                El coordinador todavía no cargó el plan de hoy para tus categorías.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {Object.entries(plans).map(([catId, plan]) => (
                <Card key={catId} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${club.primary_color}` }}>
                  <CardContent className="p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">
                      Cat. {catName(catId)}{plan.title ? ` — ${plan.title}` : ''}
                    </p>
                    <ol className="space-y-0.5">
                      {plan.items.filter(i => i.description?.trim()).map((i, idx) => (
                        <li key={idx} className="text-sm flex gap-2">
                          <span className="font-bold flex-shrink-0" style={{ color: club.primary_color }}>{idx + 1}.</span>
                          <span className="min-w-0">{i.description}{i.duration_min != null ? ` (${i.duration_min}′)` : ''}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chicos con baja asistencia (mis categorías/tiras) — colapsable, lista completa al abrir */}
      <div>
        {lowAtt === null ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : lowAtt.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-sm text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-green-600" /> Todos tus chicos están arriba del umbral de asistencia. 💪
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #F59E0B' }}>
            <CardContent className="p-3">
              <button
                onClick={() => setLowOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2"
              >
                <span className="text-sm font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-barlow)' }}>
                  <AlertTriangle size={14} /> PARA SEGUIR — BAJA ASISTENCIA
                </span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold text-white bg-amber-500 rounded-full px-2 py-0.5">{lowAtt.length}</span>
                  {lowOpen ? <ChevronUp size={15} className="text-amber-700" /> : <ChevronDown size={15} className="text-amber-700" />}
                </span>
              </button>
              {!lowOpen && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {lowAtt.length} chico{lowAtt.length === 1 ? '' : 's'} bajo el {demoEligibilityConfig.min_practice_percentage}% — tocá para ver la lista completa.
                </p>
              )}
              {lowOpen && (
                <div className="space-y-1 mt-2">
                  {lowAtt.map(p => (
                    <Link key={p.id} href={`/socios/${p.id}`} className="flex items-center justify-between py-1 border-b last:border-0 hover:bg-amber-50 rounded px-1 -mx-1">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">Cat. {p.cat}</p>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: p.pct < 30 ? '#DC2626' : '#F59E0B' }}>
                        {p.pct}%
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
