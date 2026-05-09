import type {
  RegistrationCode,
  PendingRegistration,
  Player,
  TutorUser,
  TutorPlayerLink,
} from '@/types'
import { demoPlayers } from './demo-data'

// ─── CÓDIGOS DE INSCRIPCIÓN DEMO ──────────────────────────────────────────
export const demoRegistrationCodes: RegistrationCode[] = [
  {
    id: 'rc-1',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2014',
    code: 'BAN-2014-XYZ',
    expires_at: '2026-12-31',
    max_uses: 50,
    current_uses: 8,
    is_active: true,
    created_at: '2026-04-01',
    created_by: null,
  },
  {
    id: 'rc-2',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2015',
    code: 'BAN-2015-ABC',
    expires_at: '2026-12-31',
    max_uses: 50,
    current_uses: 3,
    is_active: true,
    created_at: '2026-04-01',
    created_by: null,
  },
  {
    id: 'rc-3',
    club_id: 'club-las-halcones',
    category_id: 'cat-lh-sub12',
    code: 'HAL-SUB12-123',
    expires_at: '2026-12-31',
    max_uses: 30,
    current_uses: 5,
    is_active: true,
    created_at: '2026-04-15',
    created_by: null,
  },
]

// ─── PENDIENTES DEMO ──────────────────────────────────────────────────────
// Para garantizar al menos 1 duplicado real, tomamos el DNI de un player existente
const dupPlayer = demoPlayers.find(p => p.category_id === 'cat-2014' && p.dni)
const dupDni = dupPlayer?.dni ?? '60000001'
const dupPlayerId = dupPlayer?.id ?? null

export const demoPendingRegistrations: PendingRegistration[] = [
  {
    id: 'pr-1',
    code_used: 'BAN-2014-XYZ',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2014',
    full_name: 'Tomás Mendoza',
    dni: '60123456',
    birth_date: '2014-05-12',
    primary_position: 'mediocampista',
    photo_url: null,
    apto_medico_url: '/demo-apto.pdf',
    tutor_full_name: 'Carlos Mendoza',
    tutor_dni: '28456789',
    tutor_whatsapp: '1145678901',
    tutor_email: 'carlos.mendoza@gmail.com',
    tutor_relation: 'padre',
    status: 'pending',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: '2026-05-08T10:30:00',
  },
  {
    id: 'pr-2',
    code_used: 'BAN-2014-XYZ',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2014',
    full_name: 'Bruno Iglesias',
    dni: '60234567',
    birth_date: '2014-09-03',
    primary_position: 'defensor',
    photo_url: null,
    apto_medico_url: null,
    tutor_full_name: 'Marina Iglesias',
    tutor_dni: '30112233',
    tutor_whatsapp: '1156781234',
    tutor_email: 'marina.iglesias@gmail.com',
    tutor_relation: 'madre',
    status: 'pending',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: '2026-05-08T14:12:00',
  },
  {
    id: 'pr-3',
    code_used: 'BAN-2015-ABC',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2015',
    full_name: 'Felipe Acosta',
    dni: '61345678',
    birth_date: '2015-02-19',
    primary_position: 'delantero',
    photo_url: null,
    apto_medico_url: '/demo-apto.pdf',
    tutor_full_name: 'Diego Acosta',
    tutor_dni: '32445566',
    tutor_whatsapp: '1167890123',
    tutor_email: null,
    tutor_relation: 'padre',
    status: 'pending',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: '2026-05-09T09:45:00',
  },
  // ── Duplicado por DNI con un player existente ──
  {
    id: 'pr-4',
    code_used: 'BAN-2014-XYZ',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2014',
    full_name: dupPlayer ? dupPlayer.full_name : 'Lucas Pereyra',
    dni: dupDni,
    birth_date: dupPlayer?.birth_date ?? '2014-06-15',
    primary_position: 'mediocampista',
    photo_url: null,
    apto_medico_url: '/demo-apto.pdf',
    tutor_full_name: 'Andrea Pereyra',
    tutor_dni: '29887766',
    tutor_whatsapp: '1198765432',
    tutor_email: 'andrea.pereyra@gmail.com',
    tutor_relation: 'madre',
    status: 'pending',
    duplicate_of_player_id: dupPlayerId,
    duplicate_reason: dupPlayerId ? 'dni_match' : null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: '2026-05-09T11:20:00',
  },
  {
    id: 'pr-5',
    code_used: 'HAL-SUB12-123',
    club_id: 'club-las-halcones',
    category_id: 'cat-lh-sub12',
    full_name: 'Camila Vázquez',
    dni: '62456789',
    birth_date: '2014-11-08',
    primary_position: 'mediocampista',
    photo_url: null,
    apto_medico_url: null,
    tutor_full_name: 'Roberto Vázquez',
    tutor_dni: '27334455',
    tutor_whatsapp: '1145001234',
    tutor_email: 'roberto.vazquez@gmail.com',
    tutor_relation: 'padre',
    status: 'pending',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: null,
    reviewed_at: null,
    rejection_reason: null,
    created_at: '2026-05-09T16:00:00',
  },
  {
    id: 'pr-6',
    code_used: 'BAN-2014-XYZ',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2014',
    full_name: 'Mateo Núñez',
    dni: '60567890',
    birth_date: '2014-08-22',
    primary_position: 'arquero',
    photo_url: null,
    apto_medico_url: '/demo-apto.pdf',
    tutor_full_name: 'Patricia Núñez',
    tutor_dni: '31223344',
    tutor_whatsapp: '1133445566',
    tutor_email: 'patricia.nunez@gmail.com',
    tutor_relation: 'madre',
    status: 'approved',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: 'admin',
    reviewed_at: '2026-05-08T18:00:00',
    rejection_reason: null,
    created_at: '2026-05-07T20:00:00',
  },
  {
    id: 'pr-7',
    code_used: 'BAN-2015-ABC',
    club_id: 'club-banfield-rm',
    category_id: 'cat-2015',
    full_name: 'Pruebita Test',
    dni: '99999999',
    birth_date: '2015-01-01',
    primary_position: 'defensor',
    photo_url: null,
    apto_medico_url: null,
    tutor_full_name: 'Test Test',
    tutor_dni: '00000000',
    tutor_whatsapp: '0000000000',
    tutor_email: null,
    tutor_relation: 'otro',
    status: 'rejected',
    duplicate_of_player_id: null,
    duplicate_reason: null,
    reviewed_by: 'admin',
    reviewed_at: '2026-05-08T19:00:00',
    rejection_reason: 'Datos de prueba inválidos',
    created_at: '2026-05-07T22:30:00',
  },
]

// ─── TUTORES DEMO (cross-club) ────────────────────────────────────────────
// Tutor demo con hijos en 2 clubes distintos
export const demoTutorUsers: TutorUser[] = [
  {
    id: 'tu-1',
    email: 'carlos.fernandez@gmail.com',
    dni: '28111222',
    full_name: 'Carlos Fernández',
    whatsapp: '1144556677',
    created_at: '2026-01-10',
  },
]

// Vincula al tutor demo a 3 hijos (2 en Banfield, 1 en Las Halcones — para demo cross-club)
export const demoTutorPlayerLinks: TutorPlayerLink[] = [
  // Banfield: tomamos los primeros 2 players de Banfield (sin club_id = legacy Banfield)
  ...(demoPlayers
    .filter(p => !p.club_id)
    .slice(0, 2)
    .map((p, idx) => ({
      tutor_user_id: 'tu-1',
      player_id: p.id,
      relation: 'padre' as const,
      is_primary: idx === 0,
      approved_at: '2026-03-15',
    }))),
  // Las Halcones: primer player de ese club (si existe)
  ...(() => {
    const halcon = demoPlayers.find(p => p.club_id === 'club-las-halcones')
    if (!halcon) return []
    return [{
      tutor_user_id: 'tu-1',
      player_id: halcon.id,
      relation: 'padre' as const,
      is_primary: false,
      approved_at: '2026-04-01',
    }]
  })(),
]

// ─── HELPERS ──────────────────────────────────────────────────────────────
export function getCodesByClub(clubId: string): RegistrationCode[] {
  return getAllRegistrationCodes().filter(c => c.club_id === clubId)
}

export function getCodeByValue(code: string): RegistrationCode | undefined {
  return getAllRegistrationCodes().find(c => c.code.toUpperCase() === code.toUpperCase())
}

export function isCodeValid(code: RegistrationCode): { valid: boolean; reason?: string } {
  if (!code.is_active) return { valid: false, reason: 'Código desactivado' }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return { valid: false, reason: 'Código vencido' }
  }
  if (code.max_uses != null && code.current_uses >= code.max_uses) {
    return { valid: false, reason: 'Código sin cupos disponibles' }
  }
  return { valid: true }
}

export function getPendingByClub(clubId: string): PendingRegistration[] {
  return getAllPendingRegistrations().filter(r => r.club_id === clubId)
}

export function detectDuplicate(dni: string): Player | undefined {
  if (!dni) return undefined
  return demoPlayers.find(p => p.dni === dni)
}

export function generateRandomCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${prefix.toUpperCase()}-${suffix}`
}

export function getTutorChildren(tutorUserId: string): Player[] {
  const links = demoTutorPlayerLinks.filter(l => l.tutor_user_id === tutorUserId)
  return links
    .map(l => demoPlayers.find(p => p.id === l.player_id))
    .filter((p): p is Player => Boolean(p))
}

// ─── PERSISTENCIA EN SESSION/LOCAL STORAGE PARA DEMO ─────────────────────
const PENDING_KEY = 'camadaclub_pending_registrations'
const CODES_KEY = 'camadaclub_registration_codes'

export function getAllPendingRegistrations(): PendingRegistration[] {
  if (typeof window === 'undefined') return demoPendingRegistrations
  const stored = sessionStorage.getItem(PENDING_KEY)
  if (stored) {
    try { return JSON.parse(stored) as PendingRegistration[] } catch {}
  }
  return demoPendingRegistrations
}

export function savePendingRegistrations(list: PendingRegistration[]) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(list))
}

export function addPendingRegistration(p: PendingRegistration) {
  const cur = getAllPendingRegistrations()
  savePendingRegistrations([p, ...cur])
}

export function updatePendingRegistration(id: string, patch: Partial<PendingRegistration>) {
  const cur = getAllPendingRegistrations()
  const next = cur.map(r => (r.id === id ? { ...r, ...patch } : r))
  savePendingRegistrations(next)
}

export function getAllRegistrationCodes(): RegistrationCode[] {
  if (typeof window === 'undefined') return demoRegistrationCodes
  const stored = localStorage.getItem(CODES_KEY)
  if (stored) {
    try { return JSON.parse(stored) as RegistrationCode[] } catch {}
  }
  return demoRegistrationCodes
}

export function saveRegistrationCodes(list: RegistrationCode[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CODES_KEY, JSON.stringify(list))
}

export function addRegistrationCode(c: RegistrationCode) {
  const cur = getAllRegistrationCodes()
  saveRegistrationCodes([c, ...cur])
}

export function updateRegistrationCode(id: string, patch: Partial<RegistrationCode>) {
  const cur = getAllRegistrationCodes()
  saveRegistrationCodes(cur.map(c => (c.id === id ? { ...c, ...patch } : c)))
}

export function deleteRegistrationCode(id: string) {
  const cur = getAllRegistrationCodes()
  saveRegistrationCodes(cur.filter(c => c.id !== id))
}
