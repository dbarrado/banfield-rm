'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isRealClub, realClubId, LIGA_TO_TIRA } from '@/lib/real-clubs'
import { hydrateRealClub } from '@/lib/demo-data'
import { hydrateBillings } from '@/lib/data/billing-store'
import { loadProfes, loadProfeAssignments } from '@/lib/data/ops-store'
import type { Player, Category, Position, Profe, ProfeAssignment } from '@/types'

function currentPeriod(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const CURRENT_CLUB_KEY = 'banfieldrm_current_club_id'

// Trae jugadores + categorías reales del club desde Supabase y los inyecta en
// el store en memoria, para que los getters existentes (getPlayersForClub, etc.)
// devuelvan datos reales. Solo aplica a los clubes "reales"; el resto queda demo.
async function hydrateFromSupabase(demoClubId: string) {
  const sbClubId = realClubId(demoClubId)
  const supabase = createClient()
  if (!sbClubId) {
    hydrateRealClub(demoClubId, [], [])
    return
  }

  const [{ data: cats }, { data: pls }, profesRaw, assignsRaw] = await Promise.all([
    supabase
      .from('categories')
      .select('id,name,birth_year,sport_format_code,is_active,created_at')
      .eq('club_id', sbClubId),
    supabase
      .from('players')
      .select('id,full_name,dni,birth_date,category_id,tira,shift,photo_url,tutor_name,tutor_dni,tutor_email,tutor_whatsapp,primary_position,is_active,convocation_count,created_at')
      .eq('club_id', sbClubId)
      .order('full_name'),
    loadProfes(demoClubId),
    loadProfeAssignments(demoClubId),
  ])

  const categories: Category[] = (cats ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    birth_year: c.birth_year,
    sport_format_code: c.sport_format_code ?? 'football_11',
    is_active: c.is_active,
    created_at: c.created_at,
    club_id: demoClubId,
  }))

  const players: Player[] = (pls ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    dni: p.dni ?? null,
    birth_date: p.birth_date ?? '',
    category_id: p.category_id,
    tira: LIGA_TO_TIRA[p.tira ?? ''] ?? p.tira ?? 'metro',
    shift: (p.shift as Player['shift']) ?? 'afternoon',
    photo_url: p.photo_url ?? null,
    tutor_name: p.tutor_name ?? null,
    tutor_dni: p.tutor_dni ?? null,
    tutor_email: p.tutor_email ?? null,
    tutor_whatsapp: p.tutor_whatsapp ?? null,
    alt_contacts: [],
    primary_position: (p.primary_position as Position) ?? 'mediocampista',
    secondary_positions: [],
    apto_medico_ok: false,
    apto_medico_file_url: null,
    apto_medico_expires_at: null,
    is_active: p.is_active,
    convocation_count: p.convocation_count ?? 0,
    created_at: p.created_at,
    club_id: demoClubId,
  }))

  const profes: Profe[] = (profesRaw ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email ?? null,
    whatsapp: p.whatsapp ?? null,
    is_active: p.is_active,
    club_id: demoClubId,
  }))

  const assignments: ProfeAssignment[] = (assignsRaw ?? []).map((a) => ({
    profe_id: a.profe_id,
    category_id: a.category_id,
    tira: a.tira,
  }))

  hydrateRealClub(demoClubId, players, categories, profes, assignments)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    const clubId = localStorage.getItem(CURRENT_CLUB_KEY) ?? 'club-banfield-rm'
    if (!isRealClub(clubId)) {
      setReady(true)
      return
    }
    let cancelled = false
    ;(async () => {
      // El club real exige sesión Supabase (RLS). Sin sesión no hay datos → a login.
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        if (!cancelled) setNeedsLogin(true)
        return
      }
      try {
        await hydrateFromSupabase(clubId)
        await hydrateBillings(clubId, currentPeriod())
      } catch (e) {
        console.error('[DataProvider] hydrate real club failed:', e)
        hydrateRealClub(clubId, [], [])
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (needsLogin) {
    // Club real sin sesión Supabase. NO redirigir en automático: el middleware
    // rebota /login→/dashboard por la cookie demo_auth y se genera un loop.
    // Mostramos un CTA que limpia demo_auth y manda a login con acción del usuario.
    function goLogin() {
      document.cookie = 'demo_auth=; path=/; max-age=0; SameSite=Lax'
      window.location.href = '/login'
    }
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <p className="text-sm text-muted-foreground">
            Para ver los datos reales del club necesitás iniciar sesión con tu usuario.
          </p>
          <button onClick={goLogin} className="px-4 py-2 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm">Cargando datos del club…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
