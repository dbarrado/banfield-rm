'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isRealClub } from '@/lib/real-clubs'
import { getProfesForClub } from '@/lib/demo-data'

export type CurrentProfe = {
  profeId: string | null
  profeName: string | null
  isLoading: boolean
}

// Resuelve "quién soy yo como profe" matcheando el email del usuario logueado
// (Supabase Auth) contra la tabla `profes` del club (ya hidratada en memoria
// por components/layout/data-provider.tsx para clubes reales).
// En clubes demo no aplica: devuelve profeId null (sin restricción).
export function useCurrentProfe(clubId?: string): CurrentProfe {
  const [state, setState] = useState<CurrentProfe>({ profeId: null, profeName: null, isLoading: true })

  useEffect(() => {
    if (!clubId || !isRealClub(clubId)) {
      setState({ profeId: null, profeName: null, isLoading: false })
      return
    }
    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email?.toLowerCase() ?? null
      if (!email) {
        if (!cancelled) setState({ profeId: null, profeName: null, isLoading: false })
        return
      }
      const profes = getProfesForClub(clubId)
      const match = profes.find(p => (p.email ?? '').toLowerCase() === email)
      if (!cancelled) {
        setState({
          profeId: match?.id ?? null,
          profeName: match?.full_name ?? null,
          isLoading: false,
        })
      }
    })()
    return () => { cancelled = true }
  }, [clubId])

  return state
}
