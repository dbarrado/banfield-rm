// Persistencia real (Supabase) de la asistencia para clubes reales.
// Al cerrar/firmar una sesión, crea un evento de práctica y las asistencias.
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'

type DbStatus = 'present' | 'late' | 'absent_justified' | 'absent_unjustified'

export async function persistAttendanceClose(
  demoClubId: string,
  args: {
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
    // 1) Crear el evento de práctica
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

    // 2) Insertar asistencias (solo estados válidos del modelo)
    const valid: DbStatus[] = ['present', 'late', 'absent_justified', 'absent_unjustified']
    const rows = args.records
      .filter((r) => (valid as string[]).includes(r.status))
      .map((r) => ({
        event_id: ev.id,
        player_id: r.playerId,
        status: r.status as DbStatus,
      }))
    if (rows.length > 0) {
      const { error: attErr } = await supabase.from('attendances').insert(rows)
      if (attErr) throw attErr
    }
    return { ok: true, eventId: ev.id }
  } catch (e: any) {
    console.error('[attendance-store] persistAttendanceClose:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}
