import type { Tira } from '@/types'

// Cronograma de prácticas semanal — define slots de entrenamiento
export type TrainingSlot = {
  id: string
  day_of_week: number  // 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado, 0=domingo
  start_time: string   // "HH:MM"
  end_time: string
  court: number        // 1, 2, 3
  category_ids: string[]
  tiras: Tira[]
  profe_titular_id: string | null
  profe_suplentes_ids?: string[]   // sin límite
  notes?: string
  is_active: boolean
}

export const DAYS_OF_WEEK = [
  { num: 1, label: 'Lun', full: 'Lunes' },
  { num: 2, label: 'Mar', full: 'Martes' },
  { num: 3, label: 'Mié', full: 'Miércoles' },
  { num: 4, label: 'Jue', full: 'Jueves' },
  { num: 5, label: 'Vie', full: 'Viernes' },
  { num: 6, label: 'Sáb', full: 'Sábado' },
  { num: 0, label: 'Dom', full: 'Domingo' },
]

// Cronograma demo — 3 canchas, casos variados
export const demoTrainingRoster: TrainingSlot[] = [
  // ─── LUNES ───
  { id: 'ts-1',  day_of_week: 1, start_time: '17:00', end_time: '18:30', court: 1, category_ids: ['cat-2010'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-1', profe_suplentes_ids: ['pf-3', 'pf-9'], is_active: true },
  { id: 'ts-2',  day_of_week: 1, start_time: '17:00', end_time: '18:30', court: 2, category_ids: ['cat-2011'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-1', is_active: true },
  { id: 'ts-3',  day_of_week: 1, start_time: '18:30', end_time: '20:00', court: 1, category_ids: ['cat-2012'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-3', is_active: true },
  { id: 'ts-4',  day_of_week: 1, start_time: '18:30', end_time: '20:00', court: 2, category_ids: ['cat-2013'], tiras: ['metro'], profe_titular_id: 'pf-6', is_active: true },

  // ─── MARTES (Liga 2 + Edefi) ───
  { id: 'ts-5',  day_of_week: 2, start_time: '17:00', end_time: '18:30', court: 1, category_ids: ['cat-2010'], tiras: ['liga2', 'edefi'], profe_titular_id: 'pf-2', is_active: true },
  { id: 'ts-6',  day_of_week: 2, start_time: '18:30', end_time: '20:00', court: 1, category_ids: ['cat-2011'], tiras: ['liga2', 'edefi'], profe_titular_id: 'pf-3', profe_suplentes_ids: ['pf-4'], is_active: true },
  { id: 'ts-7',  day_of_week: 2, start_time: '17:00', end_time: '18:00', court: 3, category_ids: ['cat-2017'], tiras: ['metro', 'edefi'], profe_titular_id: 'pf-10', is_active: true },

  // ─── MIÉRCOLES ───
  { id: 'ts-8',  day_of_week: 3, start_time: '17:00', end_time: '18:30', court: 1, category_ids: ['cat-2010'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-1', is_active: true },
  { id: 'ts-9',  day_of_week: 3, start_time: '17:00', end_time: '18:30', court: 2, category_ids: ['cat-2014'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-6', is_active: true },
  { id: 'ts-10', day_of_week: 3, start_time: '18:30', end_time: '20:00', court: 1, category_ids: ['cat-2012'], tiras: ['metro', 'liga1'], profe_titular_id: 'pf-3', is_active: true },

  // ─── JUEVES ───
  { id: 'ts-11', day_of_week: 4, start_time: '17:00', end_time: '18:30', court: 1, category_ids: ['cat-2014'], tiras: ['liga2', 'edefi'], profe_titular_id: 'pf-7', is_active: true },
  { id: 'ts-12', day_of_week: 4, start_time: '17:00', end_time: '18:00', court: 2, category_ids: ['cat-2017'], tiras: ['metro', 'edefi'], profe_titular_id: 'pf-10', profe_suplentes_ids: ['pf-11'], is_active: true },

  // ─── SÁBADO MAÑANA — múltiples canchas en simultáneo, agrupaciones grandes ───
  { id: 'ts-13', day_of_week: 6, start_time: '09:00', end_time: '10:30', court: 1, category_ids: ['cat-2014', 'cat-2015', 'cat-2016'], tiras: ['edefi'], profe_titular_id: 'pf-6', profe_suplentes_ids: ['pf-8', 'pf-7', 'pf-11'], notes: 'Sesión combinada Edefi formativas — staff numeroso', is_active: true },
  { id: 'ts-14', day_of_week: 6, start_time: '09:00', end_time: '10:30', court: 2, category_ids: ['cat-2010'], tiras: ['liga1', 'liga2'], profe_titular_id: 'pf-3', is_active: true },
  { id: 'ts-15', day_of_week: 6, start_time: '09:00', end_time: '10:00', court: 3, category_ids: ['cat-2018'], tiras: ['metro', 'edefi'], profe_titular_id: 'pf-12', is_active: true },
  { id: 'ts-16', day_of_week: 6, start_time: '10:30', end_time: '12:00', court: 1, category_ids: ['cat-2012', 'cat-2013'], tiras: ['metro'], profe_titular_id: 'pf-3', is_active: true },
  { id: 'ts-17', day_of_week: 6, start_time: '10:30', end_time: '12:00', court: 2, category_ids: ['cat-2011'], tiras: ['edefi'], profe_titular_id: 'pf-4', is_active: true },
  { id: 'ts-18', day_of_week: 6, start_time: '10:00', end_time: '11:00', court: 3, category_ids: ['cat-2017'], tiras: ['metro', 'edefi'], profe_titular_id: 'pf-10', is_active: true },
]

export function getSlotsByDay(day: number): TrainingSlot[] {
  return demoTrainingRoster.filter(s => s.day_of_week === day && s.is_active).sort((a, b) => a.start_time.localeCompare(b.start_time))
}

export function getActiveSlotForNow(now: Date): TrainingSlot | null {
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  return demoTrainingRoster.find(s => {
    if (s.day_of_week !== day || !s.is_active) return false
    const [sh, sm] = s.start_time.split(':').map(Number)
    const [eh, em] = s.end_time.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    return minutes >= startMin && minutes <= endMin
  }) ?? null
}

export function getNextSlotForDay(now: Date, profeId?: string): TrainingSlot | null {
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const slots = demoTrainingRoster
    .filter(s => s.day_of_week === day && s.is_active)
    .filter(s => !profeId || s.profe_titular_id === profeId || (s.profe_suplentes_ids ?? []).includes(profeId))
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  for (const s of slots) {
    const [sh, sm] = s.start_time.split(':').map(Number)
    const startMin = sh * 60 + sm
    if (minutes <= startMin + 30) return s  // hasta 30 min después que arrancó es relevante
  }
  return slots[0] ?? null
}
