'use client'

import { useEffect, useState } from 'react'

export type ActiveRole = 'admin' | 'profe' | 'tesorero'

const ROLE_KEY = 'plantel_active_role'

export function useActiveRole(): [ActiveRole, (r: ActiveRole) => void] {
  const [role, setRole] = useState<ActiveRole>('admin')

  useEffect(() => {
    const stored = localStorage.getItem(ROLE_KEY) as ActiveRole | null
    if (stored && ['admin', 'profe', 'tesorero'].includes(stored)) {
      setRole(stored)
    }
  }, [])

  function update(r: ActiveRole) {
    localStorage.setItem(ROLE_KEY, r)
    setRole(r)
    // Recargar para que todo se refresque con el rol nuevo
    window.location.reload()
  }

  return [role, update]
}

export const ROLE_LABELS: Record<ActiveRole, { label: string; emoji: string; description: string }> = {
  admin:    { label: 'Admin',    emoji: '⚙️',  description: 'Gestión completa del club' },
  profe:    { label: 'Profe',    emoji: '🏃', description: 'Asistencia, convocatorias, partidos' },
  tesorero: { label: 'Tesorero', emoji: '💰', description: 'Caja, cobros, finanzas, reportes' },
}

// Items visibles por rol
export const ROLE_NAV_ITEMS: Record<ActiveRole, { primary: string[]; secondary: string[] }> = {
  admin: {
    primary: ['/dashboard', '/socios', '/asistencia', '/caja'],
    secondary: ['/convocatoria', '/fixture', '/finanzas', '/reportes', '/tienda', '/deportes', '/invitar', '/config'],
  },
  profe: {
    primary: ['/dashboard', '/asistencia', '/convocatoria', '/fixture'],
    secondary: ['/socios', '/deportes'],
  },
  tesorero: {
    primary: ['/dashboard', '/caja', '/finanzas', '/socios'],
    secondary: ['/reportes', '/tienda', '/invitar'],
  },
}
