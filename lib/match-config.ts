// Configuración de máximos de convocatoria por club + deporte.
// Cada club puede definir cuántos titulares y suplentes admite por actividad.
// Persiste en localStorage. En producción → tabla `club_match_config`.

import type { SportCode } from './sports'

export type MatchConfig = {
  titulares: number
  suplentes: number
}

const KEY_PREFIX = 'plantel_match_config'

// Defaults por deporte (estándar)
export const DEFAULT_MATCH_CONFIG: Record<string, MatchConfig> = {
  football_11:  { titulares: 11, suplentes: 5 },
  baby_6:       { titulares: 6,  suplentes: 3 },
  baby_5:       { titulares: 5,  suplentes: 3 },
  futsal:       { titulares: 5,  suplentes: 5 },
  hockey_field: { titulares: 11, suplentes: 5 },
  volleyball:   { titulares: 6,  suplentes: 6 },
  basketball:   { titulares: 5,  suplentes: 5 },
  rugby_7:      { titulares: 7,  suplentes: 5 },
  rugby_15:     { titulares: 15, suplentes: 8 },
  handball_7:   { titulares: 7,  suplentes: 7 },
}

function storageKey(clubId: string, sportCode: string): string {
  return `${KEY_PREFIX}__${clubId}__${sportCode}`
}

export function getMatchConfig(clubId: string, sportCode: string): MatchConfig {
  if (typeof window === 'undefined') {
    return DEFAULT_MATCH_CONFIG[sportCode] ?? { titulares: 11, suplentes: 5 }
  }
  try {
    const raw = localStorage.getItem(storageKey(clubId, sportCode))
    if (raw) {
      const parsed = JSON.parse(raw) as MatchConfig
      if (typeof parsed.titulares === 'number' && typeof parsed.suplentes === 'number') {
        return parsed
      }
    }
  } catch {}
  return DEFAULT_MATCH_CONFIG[sportCode] ?? { titulares: 11, suplentes: 5 }
}

export function saveMatchConfig(clubId: string, sportCode: string, cfg: MatchConfig) {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(clubId, sportCode), JSON.stringify(cfg))
}

export function resetMatchConfig(clubId: string, sportCode: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey(clubId, sportCode))
}
