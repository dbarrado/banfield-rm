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
