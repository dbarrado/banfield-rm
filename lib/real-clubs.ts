// Mapa de clubes "reales" (corren contra Supabase) vs demo (en memoria).
//
// Estrategia: el resto de la app sigue 100% en modo demo para poder mostrarse
// a prospectos. Solo los clubes listados acá traen sus datos de Supabase.
// La clave es el id del club en lib/clubs.ts (demoClubs); el valor es el
// id real del club en la tabla `clubs` de Supabase.

export const REAL_CLUBS: Record<string, string> = {
  'club-banfield-rm': 'b1f1e1d0-0000-4000-8000-000000000001',
}

export function isRealClub(demoClubId?: string): boolean {
  return !!demoClubId && demoClubId in REAL_CLUBS
}

export function realClubId(demoClubId: string): string | undefined {
  return REAL_CLUBS[demoClubId]
}

// Mapeo de nombres de liga (tira real en planilla) → códigos de tira del demo
// para football_11 (ver lib/tiras.ts SPORT_TIRAS.football_11).
export const LIGA_TO_TIRA: Record<string, string> = {
  'Liga Metropolitana': 'metro',
  'Liga Buenos Aires 1': 'liga1',
  'Liga Buenos Aires 2': 'liga2',
  'Liga EDEFI': 'edefi',
}
