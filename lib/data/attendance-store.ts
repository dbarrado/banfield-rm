// Persistencia real (Supabase) de la asistencia para clubes reales.
// Al cerrar/firmar una sesión, crea (o actualiza) un evento de práctica y sus asistencias.
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'

type DbStatus = 'present' | 'late' | 'absent_justified' | 'absent_unjustified'

// Busca el evento de práctica más reciente para una categoría en una fecha dada (día local)
// y devuelve sus asistencias ya cargadas, para poder editarlas en vez de duplicar.
//
// LIMITACIÓN CONOCIDA: el match es solo por categoría + fecha (día calendario). Si hubiera
// dos eventos de práctica el mismo día para la misma categoría (ej. distinta tira/turno),
// esta función trae el más reciente (`scheduled_at` desc) y podría no ser el que el usuario
// espera editar. No hay forma hoy de desambiguar por tira/turno a nivel de `events`.
export async function loadAttendanceForDate(
  demoClubId: string,
  args: { categoryId: string; dateISO: string /* 'YYYY-MM-DD' */ }
): Promise<{ eventId: string; records: { playerId: string; status: DbStatus }[] } | null> {
  const sb = realClubId(demoClubId)
  if (!sb) return null
  const supabase = createClient()
  try {
    const startISO = `${args.dateISO}T00:00:00.000Z`
    const endDate = new Date(`${args.dateISO}T00:00:00.000Z`)
    endDate.setUTCDate(endDate.getUTCDate() + 1)
    const endISO = endDate.toISOString()

    const { data: ev, error: evErr } = await supabase
      .from('events')
      .select('id')
      .eq('club_id', sb)
      .eq('category_id', args.categoryId)
      .eq('event_type', 'practice')
      .gte('scheduled_at', startISO)
      .lt('scheduled_at', endISO)
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (evErr) throw evErr
    if (!ev) return null

    const { data: atts, error: attErr } = await supabase
      .from('attendances')
      .select('player_id, status')
      .eq('event_id', ev.id)
    if (attErr) throw attErr

    return {
      eventId: ev.id,
      records: (atts ?? []).map((a) => ({ playerId: a.player_id as string, status: a.status as DbStatus })),
    }
  } catch (e: any) {
    console.error('[attendance-store] loadAttendanceForDate:', e?.message ?? e)
    return null
  }
}

// Categorías con práctica ya registrada en una fecha (tilde "asistencia tomada"
// en el dashboard del profe).
export async function loadPracticeCategoriesForDate(demoClubId: string, dateISO: string): Promise<Set<string>> {
  const sb = realClubId(demoClubId)
  if (!sb) return new Set()
  const supabase = createClient()
  const startISO = `${dateISO}T00:00:00.000Z`
  const end = new Date(`${dateISO}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  const { data, error } = await supabase
    .from('events')
    .select('category_id')
    .eq('club_id', sb)
    .eq('event_type', 'practice')
    .gte('scheduled_at', startISO)
    .lt('scheduled_at', end.toISOString())
  if (error) { console.error('[attendance-store] loadPracticeCategoriesForDate:', error.message); return new Set() }
  return new Set((data ?? []).map((e) => e.category_id as string).filter(Boolean))
}

// Estadísticas reales de asistencia a prácticas de una categoría, por jugador
// (para los porcentajes de elegibilidad de la convocatoria).
// El total es POR JUGADOR (cantidad de prácticas donde tiene registro), no el total
// de eventos de la categoría: en categorías multi-tira cada tira firma su propia
// práctica, y un chico no debe ser penalizado por prácticas de otra tira.
// Sin registros → total 0 → la convocatoria lo trata como elegible (sin datos no bloquea).
export async function loadPracticeStats(
  demoClubId: string,
  categoryId: string
): Promise<Record<string, { attended: number; justified: number; total: number; percentage: number }> | null> {
  const sb = realClubId(demoClubId)
  if (!sb) return null
  const supabase = createClient()
  try {
    const { data: evs, error: e1 } = await supabase
      .from('events')
      .select('id')
      .eq('club_id', sb)
      .eq('category_id', categoryId)
      .eq('event_type', 'practice')
      .eq('is_suspended', false)
    if (e1) throw e1
    const ids = (evs ?? []).map((e) => e.id)
    if (!ids.length) return {}
    const { data: atts, error: e2 } = await supabase
      .from('attendances')
      .select('player_id, status')
      .in('event_id', ids)
    if (e2) throw e2
    const out: Record<string, { attended: number; justified: number; total: number; percentage: number }> = {}
    for (const a of atts ?? []) {
      const cur = out[a.player_id as string] ?? { attended: 0, justified: 0, total: 0, percentage: 0 }
      cur.total++
      if (a.status === 'present' || a.status === 'late') cur.attended++
      else if (a.status === 'absent_justified') cur.justified++
      out[a.player_id as string] = cur
    }
    for (const pid of Object.keys(out)) {
      const s = out[pid]
      s.percentage = Math.round((s.attended / Math.max(s.total - s.justified, 1)) * 100)
    }
    return out
  } catch (e: any) {
    console.error('[attendance-store] loadPracticeStats:', e?.message ?? e)
    return null
  }
}

export async function persistAttendanceUpsert(
  demoClubId: string,
  args: {
    eventId?: string | null
    categoryId: string | null
    scheduledAt: string // ISO
    records: { playerId: string; status: string }[]
    profeName: string
  }
): Promise<{ ok: boolean; error?: string; eventId?: string }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  try {
    const valid: DbStatus[] = ['present', 'late', 'absent_justified', 'absent_unjustified']

    let eventId = args.eventId ?? null

    if (eventId) {
      // Editar evento existente: reemplazar todas sus asistencias.
      const { error: delErr } = await supabase.from('attendances').delete().eq('event_id', eventId)
      if (delErr) throw delErr
    } else {
      // Crear evento nuevo
      const { data: ev, error: evErr } = await supabase
        .from('events')
        .insert({
          club_id: sb,
          category_id: args.categoryId,
          event_type: 'practice',
          scheduled_at: args.scheduledAt,
        })
        .select('id')
        .single()
      if (evErr) throw evErr
      eventId = ev.id
    }

    const rows = args.records
      .filter((r) => (valid as string[]).includes(r.status))
      .map((r) => ({
        event_id: eventId,
        player_id: r.playerId,
        status: r.status as DbStatus,
      }))
    if (rows.length > 0) {
      const { error: attErr } = await supabase.from('attendances').insert(rows)
      if (attErr) throw attErr
    }
    return { ok: true, eventId: eventId! }
  } catch (e: any) {
    console.error('[attendance-store] persistAttendanceUpsert:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}

// Alias retrocompatible (sin upsert) — crea siempre un evento nuevo.
export async function persistAttendanceClose(
  demoClubId: string,
  args: {
    categoryId: string | null
    scheduledAt: string // ISO
    records: { playerId: string; status: string }[]
    profeName: string
  }
): Promise<{ ok: boolean; error?: string; eventId?: string }> {
  return persistAttendanceUpsert(demoClubId, { ...args, eventId: null })
}
