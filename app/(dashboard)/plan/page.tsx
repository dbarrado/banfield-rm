'use client'

export const dynamic = 'force-dynamic'

// PLAN DE ENTRENAMIENTO — planificación MENSUAL del coordinador.
// El coordinador ve el mes por semanas (puntito = día con plan), edita el plan de un día,
// y replica: a otros días, a otras categorías, o una semana entera a otra.
// El profe puro ve el plan de sus categorías en SOLO LECTURA (sin vista mensual).
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Plus, Trash2, Save, Calendar, Copy, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { getCategoriesForClub, getAssignmentsForProfe } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { loadPlan, savePlan, loadPlansInRange, copyPlanTo, copyWeek, loadExerciseLibrary, type PlanItem, type ExerciseSuggestion } from '@/lib/data/plan-store'
import { useUserRoles } from '@/lib/use-role'
import { useCurrentProfe } from '@/lib/use-current-profe'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromISO = (s: string) => new Date(`${s}T12:00:00`)
const addDays = (s: string, n: number) => { const d = fromISO(s); d.setDate(d.getDate() + n); return iso(d) }
// Lunes de la semana de una fecha
const mondayOf = (s: string) => { const d = fromISO(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d) }
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

// Semanas (lun-dom) que tocan un mes dado
function weeksOfMonth(year: number, month: number): string[][] {
  const first = mondayOf(iso(new Date(year, month, 1)))
  const weeks: string[][] = []
  let cur = first
  while (true) {
    const week = Array.from({ length: 7 }, (_, i) => addDays(cur, i))
    weeks.push(week)
    cur = addDays(cur, 7)
    if (fromISO(cur).getMonth() !== month && fromISO(week[0]).getMonth() !== month) break
    if (weeks.length > 6) break
  }
  // descartar semanas que no tocan el mes
  return weeks.filter(w => w.some(d => fromISO(d).getMonth() === month))
}

export default function PlanPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const userRoles = useUserRoles()
  const { profeId: myProfeId, profeName: myProfeName } = useCurrentProfe(club.id)
  const isPureProfe = real && userRoles.includes('profe') && !userRoles.includes('admin') && !userRoles.includes('coordinador')

  const allCategories = useMemo(() => getCategoriesForClub(club.id).filter(c => c.is_active), [club.id])
  const myAssignedCategoryIds = useMemo(() => {
    if (!isPureProfe || !myProfeId) return null
    return new Set(getAssignmentsForProfe(myProfeId).map(a => a.category_id))
  }, [isPureProfe, myProfeId])
  const categories = useMemo(() => {
    if (!myAssignedCategoryIds) return allCategories
    return allCategories.filter(c => myAssignedCategoryIds.has(c.id))
  }, [allCategories, myAssignedCategoryIds])

  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(iso(new Date()))
  const [monthAnchor, setMonthAnchor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() } })
  const [monthPlans, setMonthPlans] = useState<Map<string, { title: string; itemCount: number }>>(new Map())
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<PlanItem[]>([{ position: 1, description: '', duration_min: null }])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [monthReload, setMonthReload] = useState(0)

  // Autocompletar: biblioteca de ejercicios/títulos ya usados en el club
  const [library, setLibrary] = useState<{ exercises: ExerciseSuggestion[]; titles: string[] }>({ exercises: [], titles: [] })
  const [focusField, setFocusField] = useState<null | 'title' | number>(null)
  useEffect(() => {
    if (!real || isPureProfe) return
    let cancel = false
    loadExerciseLibrary(club.id).then(lib => { if (!cancel) setLibrary(lib) })
    return () => { cancel = true }
    // se recarga al guardar para aprender los ejercicios nuevos
  }, [real, isPureProfe, club.id, monthReload])

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  function exerciseSuggestions(text: string): ExerciseSuggestion[] {
    const q = norm(text.trim())
    const usedNow = new Set(items.map(i => norm(i.description.trim())).filter(Boolean))
    const pool = library.exercises.filter(e => !usedNow.has(norm(e.text)))
    if (q.length < 2) return pool.slice(0, 5)  // campo vacío: los 5 más usados
    return pool.filter(e => norm(e.text).includes(q)).slice(0, 6)
  }
  function titleSuggestions(text: string): string[] {
    const q = norm(text.trim())
    if (q.length < 1) return library.titles.slice(0, 5)
    return library.titles.filter(t => norm(t).includes(q) && norm(t) !== q).slice(0, 5)
  }

  // Replicación
  const [copyMode, setCopyMode] = useState<null | 'days' | 'cats' | 'week'>(null)
  const [targetDates, setTargetDates] = useState<Set<string>>(new Set())
  const [targetCats, setTargetCats] = useState<Set<string>>(new Set())
  const [weekTarget, setWeekTarget] = useState('')
  const [copying, setCopying] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')

  useEffect(() => {
    if (!categories.length) return
    if (!categoryId || !categories.some(c => c.id === categoryId)) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  // Vista mensual: días con plan de la categoría (solo club real, solo coordinador/admin)
  const weeks = useMemo(() => weeksOfMonth(monthAnchor.year, monthAnchor.month), [monthAnchor])
  useEffect(() => {
    if (!real || isPureProfe || !categoryId || !weeks.length) return
    let cancel = false
    const from = weeks[0][0]
    const to = weeks[weeks.length - 1][6]
    loadPlansInRange(club.id, categoryId, from, to).then(list => {
      if (cancel) return
      setMonthPlans(new Map(list.map(p => [p.date, { title: p.title, itemCount: p.itemCount }])))
    })
    return () => { cancel = true }
  }, [real, isPureProfe, club.id, categoryId, weeks, monthReload])

  // Cargar el plan del día seleccionado
  useEffect(() => {
    if (!categoryId) return
    setSaved(false); setCopyMsg('')
    if (!real) { setItems([{ position: 1, description: '', duration_min: null }]); setTitle(''); return }
    let cancel = false
    setLoading(true)
    loadPlan(club.id, categoryId, date).then(p => {
      if (cancel) return
      if (p && p.items.length) { setItems(p.items); setTitle(p.title) }
      else { setItems([{ position: 1, description: '', duration_min: null }]); setTitle('') }
      setLoading(false)
    })
    return () => { cancel = true }
  }, [club.id, categoryId, date, real])

  function updateItem(idx: number, patch: Partial<PlanItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it)); setSaved(false)
  }
  function addItem() { setItems(prev => [...prev, { position: prev.length + 1, description: '', duration_min: null }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!real) { setSaved(true); return }
    setLoading(true)
    const res = await savePlan(club.id, categoryId, date, title, items)
    setLoading(false)
    if (res.ok) { setSaved(true); setMonthReload(x => x + 1) }
    else alert(`No se pudo guardar: ${res.error}`)
  }

  const hasSavedPlan = monthPlans.has(date)

  async function handleCopy() {
    setCopying(true); setCopyMsg('')
    let res: { ok: boolean; copied: number; error?: string }
    if (copyMode === 'days') {
      res = await copyPlanTo(club.id, { categoryId, dateISO: date }, Array.from(targetDates).map(d => ({ categoryId, dateISO: d })))
    } else if (copyMode === 'cats') {
      res = await copyPlanTo(club.id, { categoryId, dateISO: date }, Array.from(targetCats).map(c => ({ categoryId: c, dateISO: date })))
    } else {
      res = await copyWeek(club.id, categoryId, mondayOf(date), weekTarget)
    }
    setCopying(false)
    if (res.ok) {
      setCopyMsg(`✓ Copiado a ${res.copied} destino${res.copied === 1 ? '' : 's'}.`)
      setCopyMode(null); setTargetDates(new Set()); setTargetCats(new Set()); setWeekTarget('')
      setMonthReload(x => x + 1)
    } else {
      setCopyMsg(`⚠ ${res.error ?? 'No se pudo copiar.'}`)
    }
  }

  const catName = categories.find(c => c.id === categoryId)?.name ?? ''
  const dateLabel = fromISO(date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  // ── PROFE PURO: solo lectura (igual que antes) ─────────────────────────
  if (isPureProfe) {
    return (
      <div className="p-3 md:p-4 max-w-2xl mx-auto pb-24">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={22} style={{ color: club.primary_color }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)', color: club.primary_color }}>
            PLAN DE ENTRENAMIENTO
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          El plan lo define el coordinador. Acá consultás el de tus categorías{myProfeName ? ` (${myProfeName})` : ''}.
        </p>
        <Card className="border-0 shadow-sm mb-3">
          <CardContent className="p-3 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold mb-1 block">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block flex items-center gap-1"><Calendar size={12} /> Día</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            {title && (
              <div className="col-span-2">
                <p className="w-full px-3 py-2.5 border rounded-lg text-sm bg-gray-50 font-semibold">{title}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Cargando plan…</p>
          ) : items.every(it => !it.description.trim()) ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                El coordinador todavía no cargó el plan de {catName} para este día.
              </CardContent>
            </Card>
          ) : (
            items.filter(it => it.description.trim()).map((it, idx) => (
              <Card key={idx} className="border-0 shadow-sm">
                <CardContent className="p-3 flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: club.primary_color }}>{idx + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{it.description}</p>
                    {it.duration_min != null && <p className="text-xs text-muted-foreground mt-1">{it.duration_min} minutos</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    )
  }

  // ── COORDINADOR / ADMIN: planificación mensual ─────────────────────────
  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-1">
        <ClipboardList size={22} style={{ color: club.primary_color }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)', color: club.primary_color }}>
          PLAN DE ENTRENAMIENTO
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        Planificá el mes por categoría. Tocá un día para cargarlo, y usá <b>Duplicar</b> para replicar a otros días, categorías o semanas.
      </p>

      {/* Categoría + mes */}
      <Card className="border-0 shadow-sm mb-3">
        <CardContent className="p-3 space-y-2.5">
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm font-medium">
            {categories.map(c => <option key={c.id} value={c.id}>Categoría {c.name}</option>)}
          </select>

          <div className="flex items-center justify-between">
            <button onClick={() => setMonthAnchor(a => a.month === 0 ? { year: a.year - 1, month: 11 } : { year: a.year, month: a.month - 1 })}
              className="p-2 rounded-lg border hover:bg-gray-50"><ChevronLeft size={16} /></button>
            <p className="text-sm font-bold uppercase tracking-wide" style={{ fontFamily: 'var(--font-barlow)' }}>
              {MESES[monthAnchor.month]} {monthAnchor.year}
            </p>
            <button onClick={() => setMonthAnchor(a => a.month === 11 ? { year: a.year + 1, month: 0 } : { year: a.year, month: a.month + 1 })}
              className="p-2 rounded-lg border hover:bg-gray-50"><ChevronRight size={16} /></button>
          </div>

          {/* Grilla mensual por semanas */}
          <div className="space-y-1">
            <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr) 34px' }}>
              {DAY_LABELS.map((d, i) => <p key={i} className="text-[10px] text-center font-bold text-muted-foreground">{d}</p>)}
              <p></p>
            </div>
            {weeks.map(week => (
              <div key={week[0]} className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr) 34px' }}>
                {week.map(d => {
                  const inMonth = fromISO(d).getMonth() === monthAnchor.month
                  const hasPlan = monthPlans.has(d)
                  const selected = d === date
                  return (
                    <button
                      key={d}
                      onClick={() => setDate(d)}
                      className={`relative rounded-lg py-1.5 text-xs font-semibold border transition-colors ${selected ? 'text-white border-transparent' : inMonth ? 'border-gray-200 text-gray-700 bg-white' : 'border-transparent text-gray-300'}`}
                      style={selected ? { backgroundColor: club.primary_color } : {}}
                    >
                      {fromISO(d).getDate()}
                      {hasPlan && <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : ''}`} style={selected ? {} : { backgroundColor: '#00843D' }} />}
                    </button>
                  )
                })}
                <button
                  title="Copiar esta semana a otra"
                  onClick={() => { setDate(week[0]); setCopyMode('week'); setWeekTarget(addDays(week[0], 7)); setCopyMsg('') }}
                  className="rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                ><Copy size={13} /></button>
              </div>
            ))}
            <p className="text-[10px] text-muted-foreground">● = día con plan cargado · ⧉ al final de cada fila copia la semana entera.</p>
          </div>
        </CardContent>
      </Card>

      {/* Editor del día seleccionado */}
      <Card className="border-0 shadow-sm mb-3">
        <CardContent className="p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold capitalize" style={{ fontFamily: 'var(--font-barlow)' }}>
              {dateLabel} — Cat. {catName}
            </p>
            <span className="flex items-center gap-2 flex-shrink-0">
              {items.some(i => i.duration_min) && (
                <span className="text-[10px] font-bold text-muted-foreground">⏱ {items.reduce((s, i) => s + (i.duration_min ?? 0), 0)} min</span>
              )}
              {hasSavedPlan && <span className="text-[10px] font-bold text-green-700 flex items-center gap-1"><CheckCircle2 size={12} /> Guardado</span>}
            </span>
          </div>

          <div className="relative">
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setSaved(false) }} placeholder="Título / objetivo del día (ej: Pase y control)"
              onFocus={() => setFocusField('title')}
              onBlur={() => setTimeout(() => setFocusField(f => f === 'title' ? null : f), 150)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            {focusField === 'title' && titleSuggestions(title).length > 0 && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
                {titleSuggestions(title).map(t => (
                  <button key={t} onMouseDown={() => { setTitle(t); setSaved(false); setFocusField(null) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0">{t}</button>
                ))}
              </div>
            )}
          </div>

          {items.map((it, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1"
                style={{ backgroundColor: club.primary_color }}>{idx + 1}</div>
              <div className="flex-1 space-y-1.5">
                <div className="relative">
                  <textarea value={it.description} onChange={e => updateItem(idx, { description: e.target.value })}
                    placeholder={idx === 0 && !library.exercises.length ? `Ejercicio ${idx + 1} — descripción` : `Ejercicio ${idx + 1} — escribí y elegí de los ya usados`}
                    rows={2}
                    onFocus={() => setFocusField(idx)}
                    onBlur={() => setTimeout(() => setFocusField(f => f === idx ? null : f), 150)}
                    className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
                  {focusField === idx && exerciseSuggestions(it.description).length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full bg-white border rounded-lg shadow-lg overflow-hidden">
                      {exerciseSuggestions(it.description).map(s => (
                        <button key={s.text} onMouseDown={() => { updateItem(idx, { description: s.text, duration_min: it.duration_min ?? s.duration }); setFocusField(null) }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-0 flex items-center gap-2">
                          <span className="text-sm flex-1 min-w-0 truncate">{s.text}</span>
                          {s.duration != null && <span className="text-[10px] text-muted-foreground flex-shrink-0">{s.duration}′</span>}
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">×{s.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={it.duration_min ?? ''} onChange={e => updateItem(idx, { duration_min: e.target.value ? Number(e.target.value) : null })}
                    placeholder="min" className="w-20 px-2 py-1.5 border rounded-lg text-sm" />
                  <span className="text-xs text-muted-foreground">minutos</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="ml-auto text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button onClick={addItem} className="w-full py-2 rounded-xl border-2 border-dashed text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1">
            <Plus size={13} /> Agregar ejercicio
          </button>

          <button onClick={handleSave} disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: club.primary_color }}>
            <Save size={16} /> {loading ? 'Guardando…' : saved ? '✓ Plan guardado' : `Guardar plan — ${catName} · ${fromISO(date).getDate()}/${monthAnchor.month + 1}`}
          </button>

          {/* Duplicar */}
          <div className="flex gap-2 pt-1">
            <button onClick={() => { setCopyMode('days'); setTargetDates(new Set()); setCopyMsg('') }} disabled={!hasSavedPlan}
              className="flex-1 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40 hover:bg-gray-50">
              <Copy size={12} /> Duplicar a otros días
            </button>
            <button onClick={() => { setCopyMode('cats'); setTargetCats(new Set()); setCopyMsg('') }} disabled={!hasSavedPlan}
              className="flex-1 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-40 hover:bg-gray-50">
              <Copy size={12} /> Duplicar a otras categorías
            </button>
          </div>
          {!hasSavedPlan && <p className="text-[10px] text-muted-foreground text-center">Para duplicar, primero guardá el plan de este día.</p>}
          {copyMsg && <p className={`text-xs text-center font-semibold ${copyMsg.startsWith('✓') ? 'text-green-700' : 'text-amber-600'}`}>{copyMsg}</p>}
        </CardContent>
      </Card>

      {/* Modal de duplicación */}
      {copyMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={() => setCopyMode(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
                {copyMode === 'days' ? 'DUPLICAR A OTROS DÍAS' : copyMode === 'cats' ? 'DUPLICAR A OTRAS CATEGORÍAS' : 'COPIAR SEMANA ENTERA'}
              </h3>
              <button onClick={() => setCopyMode(null)}><X size={18} /></button>
            </div>

            {copyMode === 'days' && (
              <>
                <p className="text-xs text-muted-foreground">
                  El plan de <b className="capitalize">{dateLabel}</b> (Cat. {catName}) se copia a los días que elijas. Si un día ya tenía plan, se pisa.
                </p>
                <div className="space-y-1">
                  <div className="grid grid-cols-7 gap-1">
                    {DAY_LABELS.map((d, i) => <p key={i} className="text-[10px] text-center font-bold text-muted-foreground">{d}</p>)}
                  </div>
                  {weeks.map(week => (
                    <div key={week[0]} className="grid grid-cols-7 gap-1">
                      {week.map(d => {
                        const inMonth = fromISO(d).getMonth() === monthAnchor.month
                        const sel = targetDates.has(d)
                        const isSource = d === date
                        return (
                          <button key={d} disabled={isSource}
                            onClick={() => setTargetDates(prev => { const n = new Set(prev); n.has(d) ? n.delete(d) : n.add(d); return n })}
                            className={`rounded-lg py-1.5 text-xs font-semibold border ${isSource ? 'bg-gray-200 text-gray-400 border-transparent' : sel ? 'text-white border-transparent bg-blue-600' : inMonth ? 'border-gray-200 text-gray-700' : 'border-transparent text-gray-300'}`}>
                            {fromISO(d).getDate()}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
                <button onClick={handleCopy} disabled={!targetDates.size || copying}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: club.primary_color }}>
                  {copying ? 'Copiando…' : `COPIAR A ${targetDates.size} DÍA${targetDates.size === 1 ? '' : 'S'}`}
                </button>
              </>
            )}

            {copyMode === 'cats' && (
              <>
                <p className="text-xs text-muted-foreground">
                  El plan de <b className="capitalize">{dateLabel}</b> se copia a las categorías que elijas, para el mismo día. Si ya tenían plan ese día, se pisa.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.filter(c => c.id !== categoryId).map(c => {
                    const sel = targetCats.has(c.id)
                    return (
                      <button key={c.id}
                        onClick={() => setTargetCats(prev => { const n = new Set(prev); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${sel ? 'text-white border-transparent bg-blue-600' : 'border-gray-200 text-gray-600'}`}>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => setTargetCats(new Set(allCategories.filter(c => c.id !== categoryId).map(c => c.id)))}
                  className="text-[11px] underline text-muted-foreground">Seleccionar todas</button>
                <button onClick={handleCopy} disabled={!targetCats.size || copying}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: club.primary_color }}>
                  {copying ? 'Copiando…' : `COPIAR A ${targetCats.size} CATEGORÍA${targetCats.size === 1 ? '' : 'S'}`}
                </button>
              </>
            )}

            {copyMode === 'week' && (
              <>
                <p className="text-xs text-muted-foreground">
                  Copia TODOS los planes de la semana del <b>{fromISO(mondayOf(date)).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</b> (Cat. {catName})
                  a otra semana, respetando el día: lunes a lunes, martes a martes. Lo existente se pisa.
                </p>
                <div className="space-y-1.5">
                  {Array.from({ length: 6 }, (_, i) => addDays(mondayOf(date), 7 * (i + 1))).map(monday => (
                    <button key={monday} onClick={() => setWeekTarget(monday)}
                      className={`w-full py-2.5 rounded-lg border text-sm font-semibold ${weekTarget === monday ? 'text-white border-transparent bg-blue-600' : 'border-gray-200 text-gray-700'}`}>
                      Semana del {fromISO(monday).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                    </button>
                  ))}
                </div>
                <button onClick={handleCopy} disabled={!weekTarget || copying}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: club.primary_color }}>
                  {copying ? 'Copiando…' : 'COPIAR SEMANA'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
