'use client'

import { useEffect, useState } from 'react'

export type ActiveRole = 'admin' | 'profe' | 'tesorero' | 'coordinador'

const ROLE_KEY = 'plantel_active_role'
const USER_ROLES_KEY = 'plantel_user_roles'

// En producción esto vendría del usuario logueado (su tabla user_roles)
// Para el demo: el usuario tiene los 4 roles asignados, puede cambiar entre ellos
const DEFAULT_USER_ROLES: ActiveRole[] = ['admin', 'profe', 'tesorero', 'coordinador']

export function useUserRoles(): ActiveRole[] {
  const [roles, setRoles] = useState<ActiveRole[]>(DEFAULT_USER_ROLES)
  useEffect(() => {
    const stored = localStorage.getItem(USER_ROLES_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ActiveRole[]
        if (Array.isArray(parsed) && parsed.length > 0) setRoles(parsed)
      } catch {}
    }
  }, [])
  return roles
}

export function useActiveRole(): [ActiveRole, (r: ActiveRole) => void] {
  const [role, setRole] = useState<ActiveRole>('admin')

  useEffect(() => {
    const stored = localStorage.getItem(ROLE_KEY) as ActiveRole | null
    if (stored && ['admin', 'profe', 'tesorero', 'coordinador'].includes(stored)) {
      setRole(stored)
    }
  }, [])

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
}

// Items visibles por rol — Profe se adapta según día (lun-vie vs sáb-dom)
export function getRoleNavItems(role: ActiveRole, dayOfWeek: number): { primary: string[]; secondary: string[] } {
  if (role === 'admin') {
    return {
      primary: ['/dashboard', '/socios', '/asistencia', '/caja'],
      secondary: ['/convocatoria', '/fixture', '/partidos', '/asistencia-profes', '/finanzas', '/reportes', '/tienda', '/invitar', '/config'],
    }
  }
  if (role === 'tesorero') {
    return {
      primary: ['/dashboard', '/caja', '/finanzas', '/socios'],
      secondary: ['/reportes', '/tienda', '/invitar'],
    }
  }
  if (role === 'coordinador') {
    // Coordinador prioriza lo deportivo pero también ve tesorería + toma asistencia de profes
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    if (isWeekend) {
      return {
        primary: ['/dashboard', '/partidos', '/asistencia-profes', '/asistencia'],
        secondary: ['/convocatoria', '/fixture', '/socios', '/finanzas', '/reportes', '/caja'],
      }
    }
    return {
      primary: ['/dashboard', '/asistencia-profes', '/asistencia', '/convocatoria'],
      secondary: ['/fixture', '/partidos', '/socios', '/finanzas', '/reportes', '/caja'],
    }
  }
  // Profe — adapta según día
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  if (isWeekend) {
    return {
      primary: ['/dashboard', '/partidos', '/convocatoria', '/asistencia'],
      secondary: ['/fixture', '/socios'],
    }
  }
  return {
    primary: ['/dashboard', '/asistencia', '/convocatoria', '/fixture'],
    secondary: ['/partidos', '/socios'],
  }
}

export const ROLE_NAV_ITEMS: Record<ActiveRole, { primary: string[]; secondary: string[] }> = {
  admin: getRoleNavItems('admin', 1),
  profe: getRoleNavItems('profe', 1),
  tesorero: getRoleNavItems('tesorero', 1),
  coordinador: getRoleNavItems('coordinador', 1),
}
