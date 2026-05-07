'use client'

import { useState, useEffect } from 'react'
import { demoClubs } from './clubs'
import type { Club } from '@/types'

const CURRENT_CLUB_KEY = 'banfieldrm_current_club_id'

export function useCurrentClub(): Club {
  const [club, setClub] = useState<Club>(demoClubs[0])

  useEffect(() => {
    const id = localStorage.getItem(CURRENT_CLUB_KEY)
    const found = demoClubs.find(c => c.id === id)
    if (found) setClub(found)
  }, [])

  return club
}
