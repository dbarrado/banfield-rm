'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isRealClub, realClubId } from '@/lib/real-clubs'
import { useCurrentClub } from '@/lib/use-current-club'

export type ActiveRole = 'admin' | 'profe' | 'tesorero' | 'coordinador' | 'asistencia_manana'

const ROLE_KEY = 'plantel_active_role'
const USER_ROLES_KEY = 'plantel_user_roles'

// En producción esto vendría del usuario logueado (su tabla user_roles)
// Para el demo: el usuario tiene los 4 roles asignados, puede cambiar entre ellos
const DEFAULT_USER_ROLES: ActiveRole[] = ['admin', 'profe', 'tesorero', 'coordinador']

const VALID_ROLES: ActiveRole[] = ['admin', 'profe', 'tesorero', 'coordinador', 'asistencia_manana']

// Cache simple en memoria del proceso para no repetir el fetch a Supabase
// en cada componente que monte el hook durante la misma sesión de navegación.
// Se cachea la PROMESA (no solo el resultado): varios componentes montan a la
// vez y sin esto disparaban el mismo request 3-4 veces en paralelo.
let rolesPromise: Promise<ActiveRole[]> | null = null
let rolesPromiseClub: string | null = null

function fetchRealRoles(demoClubId: string): Promise<ActiveRole[]> {
  if (rolesPromiseClub === demoClubId && rolesPromise) return rolesPromise
  rolesPromiseClub = demoClubId
  rolesPromise = (async () => {
    const sbClubId = realClubId(demoClubId)
    if (!sbClubId) return []
    const supabase = createClient()
    // getSession lee del storage local (sin request de red)
    const { data: sess } = await supabase.auth.getSession()
    const userId = sess.session?.user?.id
    if (!userId) return []
    const { data, error } = await supabase
      .from('user_clubs')
      .select('roles')
      .eq('club_id', sbClubId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()
    if (error || !data?.roles) return []
    return (data.roles as string[]).filter((r): r is ActiveRole => VALID_ROLES.includes(r as ActiveRole))
  })()
  return rolesPromise
}

// Club real: roles vienen de `user_clubs.roles` (Supabase, usuario logueado).
// Club demo: se mantiene el comportamiento simulado por localStorage.
export function useUserRoles(): ActiveRole[] {
  const club = useCurrentClub()
  const [roles, setRoles] = useState<ActiveRole[]>(DEFAULT_USER_ROLES)

  useEffect(() => {
    if (isRealClub(club.id)) {
      let cancelled = false
      fetchRealRoles(club.id).then(real => {
        if (!cancelled && real.length > 0) setRoles(real)
      })
      return () => { cancelled = true }
    }
    const stored = localStorage.getItem(USER_ROLES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ActiveRole[]
        if (Array.isArray(parsed) && parsed.length > 0) setRoles(parsed)
      } catch {}
    }
  }, [club.id])

  return roles
}

export function useActiveRole(): [ActiveRole, (r: ActiveRole) => void] {
  const club = useCurrentClub()
  const userRoles = useUserRoles()
  const [role, setRole] = useState<ActiveRole>('admin')

  useEffect(() => {
    const stored = localStorage.getItem(ROLE_KEY) as ActiveRole | null
    if (stored && VALID_ROLES.includes(stored)) {
      setRole(stored)
    }
  }, [])

  // Club real: si el rol activo guardado no está entre los roles reales del
  // usuario (p.ej. quedó en "admin" de una sesión demo previa), corregir al
  // primer rol que sí tiene asignado.
  useEffect(() => {
    if (!isRealClub(club.id)) return
    if (userRoles.length > 0 && !userRoles.includes(role)) {
      setRole(userRoles[0])
    }
  }, [club.id, userRoles, role])

  function update(r: ActiveRole) {
    localStorage.setItem(ROLE_KEY, r)
    setRole(r)
    window.location.reload()
  }

  return [role, update]
}

export const ROLE_LABELS: Record<ActiveRole, { label: string; emoji: string; description: string }> = {
  admin:        { label: 'Admin',        emoji: '⚙️',  description: 'Gestión completa del club' },
  profe:        { label: 'Profe',        emoji: '🏃', description: 'Asistencia, convocatorias, partidos' },
  tesorero:     { label: 'Tesorero',     emoji: '💰', description: 'Caja, cobros, finanzas, reportes' },
  coordinador:  { label: 'Coordinador',  emoji: '🎯', description: 'Deportivo + acceso a tesorería' },
  asistencia_manana: { label: 'Asistencia mañana', emoji: '🌅', description: 'Toma asistencia de los turnos de la mañana' },
}

// Items visibles por rol — Profe se adapta según día (lun-vie vs sáb-dom)
export function getRoleNavItems(role: ActiveRole, dayOfWeek: number): { primary: string[]; secondary: string[] } {
  if (role === 'admin') {
    return {
      primary: ['/dashboard', '/socios', '/asistencia', '/cobranzas'],
      secondary: ['/plan', '/caja', '/convocatoria', '/fixture', '/partidos', '/asistencia-profes', '/finanzas', '/reportes', '/tienda', '/inscripciones', '/invitar', '/config', '/clave'],
    }
  }
  if (role === 'tesorero') {
    return {
      primary: ['/dashboard', '/cobranzas', '/caja', '/finanzas'],
      secondary: ['/socios', '/reportes', '/tienda', '/invitar', '/clave'],
    }
  }
  if (role === 'coordinador') {
    // Coordinador prioriza lo deportivo pero también ve tesorería + toma asistencia de profes
    // Tiene acceso al cronograma de canchas y a la gestión de profes (sub-páginas de config)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    if (isWeekend) {
      return {
        primary: ['/dashboard', '/partidos', '/asistencia-profes', '/asistencia'],
        secondary: ['/plan', '/convocatoria', '/fixture', '/socios', '/inscripciones', '/config/cronograma', '/config/profes', '/deportes', '/cobranzas', '/finanzas', '/reportes', '/caja', '/tienda', '/invitar', '/clave'],
      }
    }
    return {
      primary: ['/dashboard', '/plan', '/asistencia', '/asistencia-profes'],
      secondary: ['/convocatoria', '/fixture', '/partidos', '/socios', '/inscripciones', '/config/cronograma', '/config/profes', '/deportes', '/cobranzas', '/finanzas', '/reportes', '/caja', '/tienda', '/invitar', '/clave'],
    }
  }
  if (role === 'asistencia_manana') {
    // Alcance acotado: firmar la asistencia de los turnos de la mañana y ver el plan del día.
    return {
      primary: ['/dashboard', '/asistencia', '/plan'],
      secondary: ['/socios', '/fixture', '/clave'],
    }
  }
  // Profe — adapta según día
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  if (isWeekend) {
    return {
      primary: ['/dashboard', '/partidos', '/convocatoria', '/asistencia'],
      secondary: ['/fixture', '/socios', '/clave'],
    }
  }
  return {
    primary: ['/dashboard', '/asistencia', '/plan', '/convocatoria'],
    secondary: ['/fixture', '/partidos', '/socios', '/clave'],
  }
}

export const ROLE_NAV_ITEMS: Record<ActiveRole, { primary: string[]; secondary: string[] }> = {
  admin: getRoleNavItems('admin', 1),
  profe: getRoleNavItems('profe', 1),
  tesorero: getRoleNavItems('tesorero', 1),
  coordinador: getRoleNavItems('coordinador', 1),
  asistencia_manana: getRoleNavItems('asistencia_manana', 1),
}
