import type { SportCode } from './sports'

export type TiraInfo = {
  code: string
  label: string
  color: string
}

export const SPORT_TIRAS: Record<SportCode, TiraInfo[]> = {
  football_11: [
    { code: 'metro', label: 'Metro', color: '#1d4ed8' },
    { code: 'liga1', label: 'Banfield Ramos', color: '#00843D' },
    { code: 'liga2', label: 'Banfield Ramos "A"', color: '#C9A84C' },
    { code: 'edefi', label: 'Edefi', color: '#7c3aed' },
  ],
  hockey_field: [
    { code: 'aahba_a', label: 'AAHBA A', color: '#dc2626' },
    { code: 'aahba_b', label: 'AAHBA B', color: '#f59e0b' },
    { code: 'aahba_c', label: 'AAHBA C', color: '#16a34a' },
    { code: 'mamis', label: "Mami's", color: '#7c3aed' },
  ],
  volleyball: [
    { code: 'feva_a1', label: 'FeVA A1', color: '#1d4ed8' },
    { code: 'feva_a2', label: 'FeVA A2', color: '#16a34a' },
    { code: 'feva_b', label: 'FeVA B', color: '#f59e0b' },
    { code: 'mini', label: 'Mini', color: '#ec4899' },
  ],
  basketball: [
    { code: 'adc_a', label: 'AdC A', color: '#ea580c' },
    { code: 'adc_b', label: 'AdC B', color: '#1d4ed8' },
    { code: 'provincial', label: 'Provincial', color: '#16a34a' },
    { code: 'federal', label: 'Federal', color: '#7c3aed' },
  ],
  rugby_7: [
    { code: 'urba_1', label: 'URBA 1ra', color: '#000000' },
    { code: 'urba_2', label: 'URBA 2da', color: '#7c2d12' },
    { code: 'urba_3', label: 'URBA 3ra', color: '#16a34a' },
    { code: 'desarrollo', label: 'Desarrollo', color: '#f59e0b' },
  ],
  rugby_15: [
    { code: 'urba_1', label: 'URBA 1ra', color: '#000000' },
    { code: 'urba_2', label: 'URBA 2da', color: '#7c2d12' },
    { code: 'urba_3', label: 'URBA 3ra', color: '#16a34a' },
    { code: 'desarrollo', label: 'Desarrollo', color: '#f59e0b' },
  ],
  handball_7: [
    { code: 'femebal_a', label: 'FeMeBal A', color: '#0891b2' },
    { code: 'femebal_b', label: 'FeMeBal B', color: '#16a34a' },
    { code: 'pcial', label: 'Provincial', color: '#7c3aed' },
  ],
  futsal: [
    { code: 'afa_a', label: 'AFA A', color: '#1d4ed8' },
    { code: 'afa_b', label: 'AFA B', color: '#16a34a' },
    { code: 'promocional', label: 'Promocional', color: '#f59e0b' },
  ],
  baby_5: [
    { code: 'premini', label: 'Pre-mini', color: '#ec4899' },
    { code: 'mini_baby', label: 'Mini', color: '#7c3aed' },
    { code: 'sub7', label: 'Sub-7', color: '#1d4ed8' },
    { code: 'sub9', label: 'Sub-9', color: '#16a34a' },
  ],
  baby_6: [
    { code: 'premini', label: 'Pre-mini', color: '#ec4899' },
    { code: 'mini_baby', label: 'Mini', color: '#7c3aed' },
    { code: 'sub7', label: 'Sub-7', color: '#1d4ed8' },
    { code: 'sub9', label: 'Sub-9', color: '#16a34a' },
  ],
}

// Devuelve la info de una tira en el contexto de un deporte
export function getTiraInfo(code: string, sportCode: SportCode): TiraInfo | undefined {
  return SPORT_TIRAS[sportCode]?.find(t => t.code === code)
}

// Helpers para casos donde no se conoce el sport (busca en todas)
export function getTiraLabel(code: string, sportCode?: SportCode): string {
  if (!code) return ''
  if (sportCode) {
    const info = getTiraInfo(code, sportCode)
    if (info) return info.label
  }
  for (const tiras of Object.values(SPORT_TIRAS)) {
    const found = tiras.find(t => t.code === code)
    if (found) return found.label
  }
  return code
}

export function getTiraColor(code: string, sportCode?: SportCode): string {
  if (!code) return '#6b7280'
  if (sportCode) {
    const info = getTiraInfo(code, sportCode)
    if (info) return info.color
  }
  for (const tiras of Object.values(SPORT_TIRAS)) {
    const found = tiras.find(t => t.code === code)
    if (found) return found.color
  }
  return '#6b7280'
}

export function getTirasForSport(sportCode: SportCode): TiraInfo[] {
  return SPORT_TIRAS[sportCode] ?? []
}
