import type { Tira } from '@/types'

// Grupos de tiras que entrenan juntas
export const TIRA_GROUPS: { id: string; name: string; tiras: Tira[]; color: string }[] = [
  { id: 'group-a', name: 'Metro + Liga 1', tiras: ['metro', 'liga1'], color: '#1d4ed8' },
  { id: 'group-b', name: 'Liga 2 + Edefi', tiras: ['liga2', 'edefi'], color: '#7c3aed' },
]

export function tiraGroupOf(tira: Tira) {
  return TIRA_GROUPS.find(g => g.tiras.includes(tira))
}

// Calendario de entrenamientos por categoría y grupo
// Día de la semana: 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado
type WeekSlot = { day: number; start: string; end: string; group: string }

export const TRAINING_SCHEDULE: Record<string, WeekSlot[]> = {
  'cat-2010': [
    { day: 1, start: '17:00', end: '18:30', group: 'group-a' }, // Lunes Metro+Liga1
    { day: 3, start: '17:00', end: '18:30', group: 'group-a' }, // Miércoles Metro+Liga1
    { day: 2, start: '17:00', end: '18:30', group: 'group-b' }, // Martes Liga2+Edefi
    { day: 4, start: '17:00', end: '18:30', group: 'group-b' }, // Jueves Liga2+Edefi
  ],
  'cat-2011': [
    { day: 1, start: '18:30', end: '20:00', group: 'group-a' },
    { day: 3, start: '18:30', end: '20:00', group: 'group-a' },
    { day: 2, start: '18:30', end: '20:00', group: 'group-b' },
    { day: 4, start: '18:30', end: '20:00', group: 'group-b' },
  ],
  'cat-2012': [
    { day: 1, start: '17:00', end: '18:30', group: 'group-a' },
    { day: 3, start: '17:00', end: '18:30', group: 'group-a' },
    { day: 2, start: '17:00', end: '18:30', group: 'group-b' },
    { day: 4, start: '17:00', end: '18:30', group: 'group-b' },
  ],
  'cat-2013': [
    // Solo tiene Metro
    { day: 2, start: '17:00', end: '18:30', group: 'group-a' },
    { day: 4, start: '17:00', end: '18:30', group: 'group-a' },
  ],
  'cat-2014': [
    // Mañana — turno escolar tarde
    { day: 1, start: '09:00', end: '10:30', group: 'group-a' },
    { day: 3, start: '09:00', end: '10:30', group: 'group-a' },
    { day: 2, start: '09:00', end: '10:30', group: 'group-b' },
    { day: 4, start: '09:00', end: '10:30', group: 'group-b' },
    // Tarde — turno escolar mañana
    { day: 1, start: '16:00', end: '17:30', group: 'group-a' },
    { day: 3, start: '16:00', end: '17:30', group: 'group-a' },
    { day: 2, start: '16:00', end: '17:30', group: 'group-b' },
    { day: 4, start: '16:00', end: '17:30', group: 'group-b' },
  ],
  'cat-2015': [
    // Mañana
    { day: 1, start: '10:30', end: '11:30', group: 'group-a' },
    { day: 3, start: '10:30', end: '11:30', group: 'group-a' },
    { day: 2, start: '10:30', end: '11:30', group: 'group-b' },
    { day: 4, start: '10:30', end: '11:30', group: 'group-b' },
    // Tarde
    { day: 1, start: '17:30', end: '18:30', group: 'group-a' },
    { day: 3, start: '17:30', end: '18:30', group: 'group-a' },
    { day: 2, start: '17:30', end: '18:30', group: 'group-b' },
    { day: 4, start: '17:30', end: '18:30', group: 'group-b' },
  ],
  'cat-2016': [
    { day: 1, start: '16:00', end: '17:00', group: 'group-a' },
    { day: 3, start: '16:00', end: '17:00', group: 'group-a' },
    { day: 1, start: '16:00', end: '17:00', group: 'group-b' },
    { day: 3, start: '16:00', end: '17:00', group: 'group-b' },
  ],
  'cat-2017': [
    { day: 2, start: '16:00', end: '17:00', group: 'group-a' },
    { day: 4, start: '16:00', end: '17:00', group: 'group-a' },
    { day: 2, start: '16:00', end: '17:00', group: 'group-b' },
    { day: 4, start: '16:00', end: '17:00', group: 'group-b' },
  ],
  'cat-2018': [
    { day: 6, start: '10:00', end: '11:00', group: 'group-a' }, // Sábado mañana
    { day: 6, start: '11:00', end: '12:00', group: 'group-b' },
  ],
}

export type ActiveSession = {
  category_id: string
  category_name: string
  group: string
  group_name: string
  group_color: string
  tiras: Tira[]
  start: string
  end: string
  shift: 'morning' | 'afternoon'  // derivado de la hora — antes de 14:00 = mañana
  status: 'live' | 'upcoming' | 'past'
  starts_in_min?: number
}

export function getSessionsForDay(now: Date, categories: { id: string; name: string }[]): ActiveSession[] {
  // 0=domingo, 1=lunes, ..., 6=sábado
  const day = now.getDay()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const sessions: ActiveSession[] = []

  for (const cat of categories) {
    const slots = TRAINING_SCHEDULE[cat.id] ?? []
    for (const slot of slots) {
      if (slot.day !== day) continue
      const [sh, sm] = slot.start.split(':').map(Number)
      const [eh, em] = slot.end.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      const group = TIRA_GROUPS.find(g => g.id === slot.group)!
      let status: 'live' | 'upcoming' | 'past' = 'past'
      let startsInMin: number | undefined
      if (nowMinutes < startMin) {
        status = 'upcoming'
        startsInMin = startMin - nowMinutes
      } else if (nowMinutes >= startMin && nowMinutes <= endMin) {
        status = 'live'
      }
      const shift: 'morning' | 'afternoon' = sh < 14 ? 'morning' : 'afternoon'
      sessions.push({
        category_id: cat.id,
        category_name: cat.name,
        group: slot.group,
        group_name: group.name,
        group_color: group.color,
        tiras: group.tiras,
        start: slot.start,
        end: slot.end,
        shift,
        status,
        starts_in_min: startsInMin,
      })
    }
  }
  // Orden: live primero, luego próximas (por hora), luego pasadas (por hora)
  return sessions.sort((a, b) => {
    const order = { live: 0, upcoming: 1, past: 2 }
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return a.start.localeCompare(b.start)
  })
}
