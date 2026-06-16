// Persistencia real (Supabase) de altas/ediciones de jugadores para clubes reales.
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'
import type { Position } from '@/types'

export type NewChild = {
  full_name: string
  birth_date: string
  category_id: string
  tira: string
  primary_position: Position
  secondary_positions: Position[]
  photo_url?: string | null
}

export async function createPlayers(
  demoClubId: string,
  args: {
    tutor: { name: string; dni: string; email: string; whatsapp: string }
    children: NewChild[]
  }
): Promise<{ ok: boolean; error?: string; ids?: string[] }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  try {
    const rows = args.children.map((c) => ({
      club_id: sb,
      full_name: c.full_name,
      birth_date: c.birth_date || null,
      category_id: c.category_id,
      tira: c.tira,
      primary_position: c.primary_position,
      secondary_positions: c.secondary_positions,
      photo_url: c.photo_url ?? null,
      tutor_name: args.tutor.name || null,
      tutor_dni: args.tutor.dni || null,
      tutor_email: args.tutor.email || null,
      tutor_whatsapp: args.tutor.whatsapp || null,
      is_active: true,
    }))
    const { data, error } = await supabase.from('players').insert(rows).select('id')
    if (error) throw error
    return { ok: true, ids: (data ?? []).map((d) => d.id) }
  } catch (e: any) {
    console.error('[players-store] createPlayers:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}

export async function updatePlayer(
  demoClubId: string,
  playerId: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  try {
    const { error } = await supabase.from('players').update(patch).eq('id', playerId).eq('club_id', sb)
    if (error) throw error
    return { ok: true }
  } catch (e: any) {
    console.error('[players-store] updatePlayer:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}
