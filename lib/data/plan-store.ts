// Plan de entrenamiento — persistencia real (Supabase) para clubes reales.
// Un plan = ejercicios de UNA clase (categoría + fecha). El coordinador lo carga;
// los profes lo ven junto con la asistencia. Para clubes demo no persiste (local).
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'

export type PlanItem = { position: number; description: string; duration_min: number | null }
export type DayPlan = { planId: string | null; title: string; items: PlanItem[] }

export async function loadPlan(demoClubId: string, categoryId: string, dateISO: string): Promise<DayPlan | null> {
  const sb = realClubId(demoClubId)
  if (!sb) return null
  const supabase = createClient()
  const { data: plan } = await supabase
    .from('session_plans')
    .select('id,title')
    .eq('club_id', sb)
    .eq('category_id', categoryId)
    .eq('session_date', dateISO)
    .maybeSingle()
  if (!plan) return { planId: null, title: '', items: [] }
  const { data: items } = await supabase
    .from('session_plan_items')
    .select('position,duration_min,notes')
    .eq('session_plan_id', plan.id)
    .order('position')
  return {
    planId: plan.id,
    title: plan.title ?? '',
    items: (items ?? []).map((i) => ({ position: i.position, description: i.notes ?? '', duration_min: i.duration_min })),
  }
}

// Biblioteca de ejercicios del club: todo lo ya cargado alguna vez, ordenado por
// frecuencia de uso — alimenta el autocompletar del editor del plan.
export type ExerciseSuggestion = { text: string; count: number; duration: number | null }
export async function loadExerciseLibrary(
  demoClubId: string
): Promise<{ exercises: ExerciseSuggestion[]; titles: string[] }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { exercises: [], titles: [] }
  const supabase = createClient()
  const [{ data: items }, { data: plans }] = await Promise.all([
    supabase
      .from('session_plan_items')
      .select('notes,duration_min,session_plans!inner(club_id)')
      .eq('session_plans.club_id', sb)
      .limit(2000),
    supabase.from('session_plans').select('title').eq('club_id', sb).not('title', 'is', null).limit(500),
  ])
  // Agrupar por texto normalizado; duración = la más frecuente para ese ejercicio
  const map = new Map<string, { text: string; count: number; durations: Map<number, number> }>()
  for (const it of items ?? []) {
    const text = (it.notes ?? '').trim()
    if (!text) continue
    const key = text.toLowerCase()
    const cur = map.get(key) ?? { text, count: 0, durations: new Map() }
    cur.count++
    if (it.duration_min != null) cur.durations.set(it.duration_min, (cur.durations.get(it.duration_min) ?? 0) + 1)
    map.set(key, cur)
  }
  const exercises = Array.from(map.values())
    .map(e => ({
      text: e.text,
      count: e.count,
      duration: Array.from(e.durations.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.count - a.count)
  const titles = Array.from(new Set((plans ?? []).map(p => (p.title ?? '').trim()).filter(Boolean)))
  return { exercises, titles }
}

// Días con plan en un rango (para la vista mensual del coordinador).
export async function loadPlansInRange(
  demoClubId: string,
  categoryId: string,
  fromISO: string,
  toISO: string
): Promise<{ date: string; title: string; itemCount: number }[]> {
  const sb = realClubId(demoClubId)
  if (!sb) return []
  const supabase = createClient()
  const { data, error } = await supabase
    .from('session_plans')
    .select('session_date,title,session_plan_items(count)')
    .eq('club_id', sb)
    .eq('category_id', categoryId)
    .gte('session_date', fromISO)
    .lte('session_date', toISO)
    .order('session_date')
  if (error) { console.error('[plan-store] loadPlansInRange:', error.message); return [] }
  return (data ?? []).map((p: any) => ({
    date: p.session_date,
    title: p.title ?? '',
    itemCount: p.session_plan_items?.[0]?.count ?? 0,
  }))
}

// Copia un plan guardado a otros destinos (otras fechas y/o otras categorías).
// Cada destino queda como copia independiente (editable por separado). PISA lo existente.
export async function copyPlanTo(
  demoClubId: string,
  from: { categoryId: string; dateISO: string },
  targets: { categoryId: string; dateISO: string }[]
): Promise<{ ok: boolean; copied: number; error?: string }> {
  const source = await loadPlan(demoClubId, from.categoryId, from.dateISO)
  if (!source || !source.items.some(i => i.description.trim())) {
    return { ok: false, copied: 0, error: 'El plan de origen está vacío — guardalo primero.' }
  }
  let copied = 0
  for (const t of targets) {
    if (t.categoryId === from.categoryId && t.dateISO === from.dateISO) continue
    const res = await savePlan(demoClubId, t.categoryId, t.dateISO, source.title, source.items)
    if (res.ok) copied++
    else return { ok: false, copied, error: res.error }
  }
  return { ok: true, copied }
}

// Copia todos los planes de una semana (lun-dom) a otra semana, mismo día de semana.
export async function copyWeek(
  demoClubId: string,
  categoryId: string,
  fromMondayISO: string,
  toMondayISO: string
): Promise<{ ok: boolean; copied: number; error?: string }> {
  const addDays = (iso: string, n: number) => {
    const d = new Date(`${iso}T12:00:00`)
    d.setDate(d.getDate() + n)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const sourceDays = await loadPlansInRange(demoClubId, categoryId, fromMondayISO, addDays(fromMondayISO, 6))
  if (!sourceDays.length) return { ok: false, copied: 0, error: 'La semana de origen no tiene planes cargados.' }
  let copied = 0
  for (const day of sourceDays) {
    const offset = Math.round((new Date(`${day.date}T12:00:00`).getTime() - new Date(`${fromMondayISO}T12:00:00`).getTime()) / 86400000)
    const source = await loadPlan(demoClubId, categoryId, day.date)
    if (!source) continue
    const res = await savePlan(demoClubId, categoryId, addDays(toMondayISO, offset), source.title, source.items)
    if (res.ok) copied++
    else return { ok: false, copied, error: res.error }
  }
  return { ok: true, copied }
}

export async function savePlan(
  demoClubId: string,
  categoryId: string,
  dateISO: string,
  title: string,
  items: PlanItem[]
): Promise<{ ok: boolean; error?: string }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  try {
    // upsert idempotente: borrar plan previo de esa (cat, fecha) y reinsertar
    const { data: prev } = await supabase
      .from('session_plans')
      .select('id')
      .eq('club_id', sb)
      .eq('category_id', categoryId)
      .eq('session_date', dateISO)
      .maybeSingle()
    if (prev) await supabase.from('session_plans').delete().eq('id', prev.id) // cascada borra items

    const { data: plan, error: pErr } = await supabase
      .from('session_plans')
      .insert({ club_id: sb, category_id: categoryId, session_date: dateISO, title })
      .select('id')
      .single()
    if (pErr) throw pErr

    const rows = items
      .filter((i) => i.description.trim())
      .map((i, idx) => ({
        session_plan_id: plan.id,
        position: idx + 1,
        duration_min: i.duration_min,
        notes: i.description.trim(),
      }))
    if (rows.length > 0) {
      const { error: iErr } = await supabase.from('session_plan_items').insert(rows)
      if (iErr) throw iErr
    }
    return { ok: true }
  } catch (e: any) {
    console.error('[plan-store] savePlan:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}
