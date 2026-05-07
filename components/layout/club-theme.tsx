'use client'

import { useCurrentClub } from '@/lib/use-current-club'
import { useEffect } from 'react'

export function ClubTheme() {
  const club = useCurrentClub()

  useEffect(() => {
    document.documentElement.style.setProperty('--club-primary', club.primary_color)
    document.documentElement.style.setProperty('--club-secondary', club.secondary_color)
    // Tema CSS variables que Tailwind puede usar
    const r = parseInt(club.primary_color.slice(1, 3), 16)
    const g = parseInt(club.primary_color.slice(3, 5), 16)
    const b = parseInt(club.primary_color.slice(5, 7), 16)
    document.documentElement.style.setProperty('--club-primary-rgb', `${r}, ${g}, ${b}`)
  }, [club])

  return null
}
