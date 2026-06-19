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
