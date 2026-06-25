import type { Player, Category, Payment, Event, Attendance, CashSession, CashMovement, FinanceCategory, EligibilityConfig, Position, Tira, Profe, ProfeAssignment } from '@/types'
import { SPORT_TIRAS } from './tiras'
import type { SportCode } from './sports'

export const DEMO_MODE = true

// ──────────────────────────────────────────────────────────────────────────
// CATEGORÍAS — años 2010 a 2018 (todas activas)
// ──────────────────────────────────────────────────────────────────────────
export const demoCategories: Category[] = [
  { id: 'cat-2010', name: '2010', birth_year: 2010, sport_format_code: 'football_11', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2011', name: '2011', birth_year: 2011, sport_format_code: 'football_11', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2012', name: '2012', birth_year: 2012, sport_format_code: 'football_11', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2013', name: '2013', birth_year: 2013, sport_format_code: 'football_11', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2014', name: '2014', birth_year: 2014, sport_format_code: 'baby_6', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2015', name: '2015', birth_year: 2015, sport_format_code: 'baby_6', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2016', name: '2016', birth_year: 2016, sport_format_code: 'baby_5', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2017', name: '2017', birth_year: 2017, sport_format_code: 'baby_5', is_active: true, created_at: '2025-01-01' },
  { id: 'cat-2018', name: '2018', birth_year: 2018, sport_format_code: 'baby_5', is_active: true, created_at: '2025-01-01' },
]

// ──────────────────────────────────────────────────────────────────────────
// GENERADOR DE JUGADORES (~450 chicos)
// ──────────────────────────────────────────────────────────────────────────
const NOMBRES = [
  'Lucas','Tomás','Mateo','Santiago','Benjamín','Agustín','Felipe','Ignacio','Valentín','Axel',
  'Lautaro','Thiago','Nicolás','Rodrigo','Bruno','Joaquín','Bautista','Lorenzo','Franco','Juan',
  'Martín','Pedro','Diego','Gonzalo','Manuel','Emiliano','Julián','Facundo','Maximiliano','Sebastián',
  'Gabriel','Cristian','Federico','Alejo','Ezequiel','Iván','Marcos','Nahuel','Ramiro','Tadeo',
  'Mateo','Dylan','Kevin','Brian','Gianluca','Luca','Renzo','Simón','Salvador','León',
  'Vicente','Joaquín','Pablo','Andrés','Hugo','Damián','Esteban','Leandro','Mariano','Matías',
]

const APELLIDOS = [
  'Fernández','García','López','Martínez','Rodríguez','Sánchez','Pérez','Torres','Romero','Díaz',
  'Vargas','Castro','Herrera','Morales','Jiménez','Ruiz','Álvarez','Moreno','Gutiérrez','Acosta',
  'Rojas','Silva','Aguirre','Domínguez','Peralta','Sosa','Méndez','Ortega','Cabrera','Suárez',
  'Quiroga','Núñez','Molina','Flores','Vega','Navarro','Reyes','Cruz','Ortiz','Ríos',
  'Ferrari','Bianchi','Russo','Marino','Costa','Romano','Greco','Ferrara','Esposito','Conti',
]

const TUTOR_NOMBRES = [
  'Carlos','Ana','Jorge','Laura','Silvia','Roberto','Mónica','Diego','Patricia','Marcelo',
  'Claudia','Gabriel','Sandra','Fernando','Valeria','Adrián','Mariela','Pablo','Andrea','Gustavo',
  'Verónica','Daniel','Karina','Hugo','Elena','Walter','Susana','Ricardo','Beatriz','Oscar',
]

// PRNG determinístico para que los datos no cambien entre renders
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

// Distribución de tiras por categoría — los más grandes tienen 4 tiras, los chicos 2
const distribucion: Record<string, { tiras: Tira[]; perTira: number[] }> = {
  // 4 tiras × ~12-13 chicos = 50
  'cat-2010': { tiras: ['metro', 'liga1', 'liga2', 'edefi'], perTira: [13, 13, 12, 12] },
  'cat-2011': { tiras: ['metro', 'liga1', 'liga2', 'edefi'], perTira: [14, 13, 13, 12] },
  'cat-2012': { tiras: ['metro', 'liga1', 'liga2', 'edefi'], perTira: [14, 14, 14, 13] },
  'cat-2013': { tiras: ['metro'], perTira: [25] }, // sólo Metro = 25 chicos
  'cat-2014': { tiras: ['metro', 'liga1', 'liga2', 'edefi'], perTira: [14, 14, 14, 13] },
  'cat-2015': { tiras: ['metro', 'liga1', 'liga2', 'edefi'], perTira: [14, 13, 13, 13] },
  // 2 tiras × ~25 chicos = 50
  'cat-2016': { tiras: ['metro', 'edefi'], perTira: [28, 27] },
  'cat-2017': { tiras: ['metro', 'edefi'], perTira: [27, 26] },
  'cat-2018': { tiras: ['metro', 'edefi'], perTira: [26, 26] },
}

// Distribución realista de posiciones por equipo: ~8% arquero / 32% defensor / 36% medio / 24% delantero
function pickPrimaryPosition(idx: number): Position {
  const r = ((idx * 7919) % 100) + (rand() - 0.5) * 5
  if (r < 8) return 'arquero'
  if (r < 40) return 'defensor'
  if (r < 76) return 'mediocampista'
  return 'delantero'
}

function pickSecondaryPositions(primary: Position): Position[] {
  const all: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
  const others = all.filter(p => p !== primary)
  // Arqueros casi nunca tienen segundas posiciones
  if (primary === 'arquero') {
    return rand() > 0.85 ? [pick(others)] : []
  }
  // El resto puede tener 0 a 2 segundas posiciones (raro hasta 3)
  const n = rand() < 0.4 ? 0 : rand() < 0.85 ? 1 : rand() < 0.97 ? 2 : 3
  // Excluir arquero como secundaria salvo en raros casos
  const pool = others.filter(p => p !== 'arquero' || rand() > 0.95)
  const result: Position[] = []
  for (let i = 0; i < n && pool.length > 0; i++) {
    const choice = pick(pool)
    result.push(choice)
    pool.splice(pool.indexOf(choice), 1)
  }
  return result
}

function generatePlayers(): Player[] {
  const players: Player[] = []
  let idCounter = 1
  let positionIdx = 0
  for (const cat of demoCategories) {
    const dist = distribucion[cat.id]
    if (!dist) continue
    dist.tiras.forEach((tira, tiraIdx) => {
      const count = dist.perTira[tiraIdx]
      for (let i = 0; i < count; i++) {
        const nombre = pick(NOMBRES)
        const apellido = pick(APELLIDOS)
        const tutorApellido = apellido
        const tutorNombre = pick(TUTOR_NOMBRES)
        const month = String(Math.floor(rand() * 12) + 1).padStart(2, '0')
        const day = String(Math.floor(rand() * 28) + 1).padStart(2, '0')
        const shift = i % 2 === 0 ? 'morning' : 'afternoon'
        const phoneBase = 1100000000 + Math.floor(rand() * 99999999)
        const primary = pickPrimaryPosition(positionIdx++)
        const secondary = pickSecondaryPositions(primary)
        const dniBase = 50000000 + Math.floor(rand() * 5000000)
        const tutorDniBase = 20000000 + Math.floor(rand() * 25000000)
        const aptoOk = rand() < 0.78
        players.push({
          id: `p-${idCounter}`,
          full_name: `${nombre} ${apellido}`,
          dni: String(dniBase),
          birth_date: `${cat.birth_year}-${month}-${day}`,
          category_id: cat.id,
          tira,
          shift,
          photo_url: null,
          tutor_name: `${tutorNombre} ${tutorApellido}`,
          tutor_dni: String(tutorDniBase),
          tutor_email: `${tutorNombre.toLowerCase()}.${tutorApellido.toLowerCase()}@gmail.com`,
          tutor_whatsapp: String(phoneBase),
          primary_position: primary,
          secondary_positions: secondary,
          apto_medico_ok: aptoOk,
          apto_medico_file_url: aptoOk && rand() < 0.6 ? '/demo-apto.pdf' : null,
          apto_medico_expires_at: aptoOk ? '2026-12-31' : null,
          is_active: true,
          convocation_count: Math.floor(rand() * 12),
          created_at: '2026-03-01',
        })
        idCounter++
      }
    })
  }
  return players
}

export const demoPlayers: Player[] = generatePlayers()

// Vincular hermanos: tomar 8 grupos de 2 y 3 grupos de 3 jugadores con mismo tutor_email
;(function linkSiblings() {
  const familyEmails = [
    'fernandez.diego@gmail.com',
    'garcia.ana@gmail.com',
    'lopez.jorge@gmail.com',
    'martinez.laura@gmail.com',
    'rodriguez.silvia@gmail.com',
    'sanchez.roberto@gmail.com',
    'perez.monica@gmail.com',
    'torres.diego@gmail.com',
  ]
  // 8 familias de 2 hermanos
  let p = 0
  for (let i = 0; i < 8; i++) {
    if (p + 1 >= demoPlayers.length) break
    demoPlayers[p].tutor_email = familyEmails[i]
    demoPlayers[p].tutor_name = familyEmails[i].split('@')[0].split('.')[0].charAt(0).toUpperCase() + familyEmails[i].split('@')[0].split('.')[0].slice(1) + ' ' + demoPlayers[p].full_name.split(' ').slice(-1)[0]
    demoPlayers[p + 1].tutor_email = familyEmails[i]
    demoPlayers[p + 1].tutor_name = demoPlayers[p].tutor_name
    p += 30 // saltear suficientes para no chocar
  }
  // 3 familias de 3 hermanos (jugadores p-200 a p-220 aprox)
  const tripleFamilies = [
    { email: 'gomez.carlos@gmail.com', name: 'Carlos Gómez', start: 100 },
    { email: 'romero.veronica@gmail.com', name: 'Verónica Romero', start: 200 },
    { email: 'silva.daniel@gmail.com', name: 'Daniel Silva', start: 300 },
  ]
  for (const f of tripleFamilies) {
    for (let i = 0; i < 3; i++) {
      const idx = f.start + i
      if (idx < demoPlayers.length) {
        demoPlayers[idx].tutor_email = f.email
        demoPlayers[idx].tutor_name = f.name
      }
    }
  }
})()

// ──────────────────────────────────────────────────────────────────────────
// EVENTOS — prácticas del último mes + partidos próximos
// Calendario: lunes/miércoles/viernes para todas las categorías
// ──────────────────────────────────────────────────────────────────────────
function generateEvents(): Event[] {
  const events: Event[] = []
  let evId = 1
  const today = new Date('2026-05-05')

  for (const cat of demoCategories) {
    // Prácticas del último mes (12 prácticas, 3 por semana × 4 semanas)
    for (let weeksBack = 4; weeksBack >= 0; weeksBack--) {
      // Lunes, miércoles, viernes de cada semana
      for (const dayOffset of [0, 2, 4]) {
        const d = new Date(today)
        d.setDate(today.getDate() - weeksBack * 7 - (today.getDay() === 0 ? 6 : today.getDay() - 1) + dayOffset - 7 * weeksBack)
        // Recalcular más simple: tomar fecha base hace N días
        const daysBack = weeksBack * 7 + (4 - dayOffset)
        const eventDate = new Date(today)
        eventDate.setDate(today.getDate() - daysBack)
        if (eventDate > today) continue

        // 1 de cada 8 prácticas suspendida por lluvia
        const suspended = (evId * 7) % 8 === 0
        events.push({
          id: `ev-${evId++}`,
          category_id: cat.id,
          event_type: 'practice',
          scheduled_at: `${eventDate.toISOString().split('T')[0]}T${dayOffset === 0 ? '17:00' : dayOffset === 2 ? '17:30' : '18:00'}:00`,
          is_suspended: suspended,
          suspension_reason: suspended ? 'Lluvia' : null,
          rival: null,
          venue: 'Predio Banfield Ramos Mejía',
          is_home: null,
          created_by: null,
          created_at: '2026-04-01',
        })
      }
    }

    // Los partidos se generan después en bloque (uno por tira, todas las categorías de esa tira juegan al mismo rival)
    if (false) {
    events.push({
      id: `ev-${evId++}`,
      category_id: cat.id,
      event_type: 'match',
      scheduled_at: today.toISOString(),
      is_suspended: false,
      suspension_reason: null,
      rival: null,
      venue: null,
      is_home: null,
      created_by: null,
      created_at: '2026-04-25',
    })
    }
  }

  // ─── PARTIDOS POR TIRA ───
  // Los próximos 4 fines de semana, cada tira juega contra 1 rival distinto.
  // Todas las categorías que tienen esa tira juegan al mismo rival ese día.
  const tiraRivales: Record<string, string[]> = {
    metro:  ['Independiente', 'Lanús', 'Argentinos', 'Estudiantes (LP)'],
    liga1:  ['Acassuso', 'Talleres (RE)', 'Tigre', 'Almagro'],
    liga2:  ['Sacachispas', 'San Telmo', 'Defensores Unidos', 'Excursionistas'],
    edefi:  ['Liniers', 'Ferro Mini', 'Brown (A)', 'Comunicaciones'],
  }
  const allTiras: ('metro'|'liga1'|'liga2'|'edefi')[] = ['metro', 'liga1', 'liga2', 'edefi']

  // weekOffset negativo = partidos pasados (con resultado / aptos para puntajes)
  // weekOffset positivo = próximos partidos
  const pastRivalesByTira: Record<string, string[]> = {
    metro:  ['Vélez Junior', 'Boca Mini', 'River Sub', 'San Lorenzo'],
    liga1:  ['Banfield Sur', 'Quilmes', 'Temperley', 'Talleres (RE)'],
    liga2:  ['Liniers', 'Excursionistas', 'Comunicaciones', 'Defensores Unidos'],
    edefi:  ['Ferro Mini', 'Argentinos Mini', 'Brown (A)', 'Atlanta'],
  }

  for (let weekOffset = -4; weekOffset <= 4; weekOffset++) {
    if (weekOffset === 0) continue
    const matchDate = new Date(today)
    matchDate.setDate(today.getDate() + (6 - today.getDay()) + (weekOffset > 0 ? weekOffset - 1 : weekOffset) * 7)
    const dateStr = matchDate.toISOString().split('T')[0]
    const isPast = weekOffset < 0

    for (const tira of allTiras) {
      const catsWithTira = demoCategories.filter(c => {
        const dist = distribucion[c.id]
        return dist && dist.tiras.includes(tira)
      })
      if (catsWithTira.length === 0) continue

      const rival = isPast
        ? pastRivalesByTira[tira][Math.abs(weekOffset) - 1]
        : tiraRivales[tira][weekOffset - 1]
      const isHome = weekOffset % 2 === 1
      const venue = isHome ? 'Predio Banfield Ramos Mejía' : `Cancha de ${rival}`

      const horarios = ['09:00','09:45','10:30','11:15','12:00','12:45','13:30','14:15','15:00']
      catsWithTira.forEach((cat, idx) => {
        events.push({
          id: `ev-match-${weekOffset}-${tira}-${cat.id}`,
          category_id: cat.id,
          event_type: 'match',
          scheduled_at: `${dateStr}T${horarios[idx]}:00`,
          is_suspended: false,
          suspension_reason: null,
          rival,
          venue,
          is_home: isHome,
          created_by: null,
          created_at: '2026-04-25',
        })
      })
    }
  }
  return events
}

export const demoEvents: Event[] = generateEvents()

// ──────────────────────────────────────────────────────────────────────────
// ASISTENCIAS — generadas para todo el mes con patrones realistas
// ──────────────────────────────────────────────────────────────────────────
function generateAttendance(): Attendance[] {
  const attendance: Attendance[] = []
  let attId = 1
  const practices = demoEvents.filter(e => e.event_type === 'practice' && !e.is_suspended)

  for (const player of demoPlayers) {
    // Cada jugador tiene un "perfil de asistencia": alto, medio, bajo
    const profile = rand()
    const baseAttendanceRate =
      profile > 0.75 ? 0.95 :         // 25% son cumplidores top
      profile > 0.45 ? 0.75 :         // 30% asistencia media-alta
      profile > 0.20 ? 0.55 :         // 25% asistencia media
                       0.30           // 20% baja asistencia

    const playerPractices = practices.filter(p => p.category_id === player.category_id)
    for (const practice of playerPractices) {
      const r = rand()
      let status: 'present' | 'absent_justified' | 'absent_unjustified'
      let justified_reason: string | null = null
      if (r < baseAttendanceRate) {
        status = 'present'
      } else if (r < baseAttendanceRate + 0.10) {
        status = 'absent_justified'
        justified_reason = pick(['Colegio','Examen','Médico','Familia'])
      } else {
        status = 'absent_unjustified'
      }
      attendance.push({
        id: `att-${attId++}`,
        event_id: practice.id,
        player_id: player.id,
        status,
        justified_reason,
        registered_by: null,
        created_at: practice.scheduled_at.split('T')[0],
      })
    }
  }
  return attendance
}

export const demoAttendance: Attendance[] = generateAttendance()

// ──────────────────────────────────────────────────────────────────────────
// PAGOS — cuota actividad mes en curso
// ──────────────────────────────────────────────────────────────────────────
const today = new Date('2026-05-05')
const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
const lastMonth = `${today.getFullYear()}-${String(today.getMonth()).padStart(2, '0')}`

function generatePayments(): Payment[] {
  const payments: Payment[] = []
  let payId = 1
  for (const player of demoPlayers) {
    // 72% pagó la cuota de este mes (~20M); el resto deudor
    const r = rand()
    if (r < 0.72) {
      const day = Math.floor(rand() * 5) + 1
      payments.push({
        id: `pay-${payId++}`,
        player_id: player.id,
        fee_type: 'actividad',
        period: thisMonth,
        amount: 62000,
        paid_at: `2026-05-${String(day).padStart(2, '0')}`,
        payment_method: r < 0.5 ? 'cash' : 'transfer',
        transfer_reference: r < 0.5 ? null : `MP-${Math.floor(rand() * 100000)}`,
        registered_by: null,
        created_at: `2026-05-${String(day).padStart(2, '0')}`,
      })
    }
    // Mes pasado: 88% pagó (~24.5M, comparativo con caída -18%)
    if (rand() < 0.88) {
      const day = Math.floor(rand() * 28) + 1
      payments.push({
        id: `pay-${payId++}`,
        player_id: player.id,
        fee_type: 'actividad',
        period: lastMonth,
        amount: 62000,
        paid_at: `2026-04-${String(day).padStart(2, '0')}`,
        payment_method: rand() < 0.5 ? 'cash' : 'transfer',
        transfer_reference: rand() < 0.5 ? null : `MP-${Math.floor(rand() * 100000)}`,
        registered_by: null,
        created_at: `2026-04-${String(day).padStart(2, '0')}`,
      })
    }
    // Matrícula 2026: 90% pagó
    if (rand() < 0.90) {
      payments.push({
        id: `pay-${payId++}`,
        player_id: player.id,
        fee_type: 'matricula',
        period: '2026',
        amount: 35000,
        paid_at: '2026-03-15',
        payment_method: 'transfer',
        transfer_reference: `MP-MATR-${Math.floor(rand() * 100000)}`,
        registered_by: null,
        created_at: '2026-03-15',
      })
    }
  }
  return payments
}

export const demoPayments: Payment[] = generatePayments()

// ──────────────────────────────────────────────────────────────────────────
// CAJA Y FINANZAS
// ──────────────────────────────────────────────────────────────────────────
export const demoFinanceCategories: FinanceCategory[] = [
  { id: 'fc-1', name: 'Cuotas cobradas',        movement_type: 'income',  is_active: true, created_at: '2025-01-01' },
  { id: 'fc-2', name: 'Matrículas cobradas',     movement_type: 'income',  is_active: true, created_at: '2025-01-01' },
  { id: 'fc-3', name: 'Donaciones',              movement_type: 'income',  is_active: true, created_at: '2025-01-01' },
  { id: 'fc-4', name: 'Alquiler de cancha',      movement_type: 'expense', is_active: true, created_at: '2025-01-01' },
  { id: 'fc-5', name: 'Materiales deportivos',   movement_type: 'expense', is_active: true, created_at: '2025-01-01' },
  { id: 'fc-6', name: 'Arbitraje',               movement_type: 'expense', is_active: true, created_at: '2025-01-01' },
  { id: 'fc-7', name: 'Inscripciones a torneos', movement_type: 'expense', is_active: true, created_at: '2025-01-01' },
  { id: 'fc-8', name: 'Indumentaria',             movement_type: 'expense', is_active: true, created_at: '2025-01-01' },
]

export const demoCashSession: CashSession = {
  id: 'cs-1',
  date: '2026-05-05',
  opening_amount: 25000,
  closing_amount: null,
  opened_by: null,
  closed_by: null,
  created_at: '2026-05-05T08:00:00',
}

export const demoCashMovements: CashMovement[] = [
  { id: 'cm-1', session_id: 'cs-1', movement_type: 'income',  amount: 62000, finance_category_id: 'fc-1', description: 'Cuota mayo — Lucas Fernández',   payment_method: 'cash',     transfer_reference: null,           registered_by: null, created_at: '2026-05-05T10:00:00' },
  { id: 'cm-2', session_id: 'cs-1', movement_type: 'income',  amount: 62000, finance_category_id: 'fc-1', description: 'Cuota mayo — Bruno Jiménez',     payment_method: 'transfer', transfer_reference: 'MP-88420',     registered_by: null, created_at: '2026-05-05T10:30:00' },
  { id: 'cm-3', session_id: 'cs-1', movement_type: 'income',  amount: 62000, finance_category_id: 'fc-1', description: 'Cuota mayo — Tomás García',     payment_method: 'cash',     transfer_reference: null,           registered_by: null, created_at: '2026-05-05T11:00:00' },
  { id: 'cm-4', session_id: 'cs-1', movement_type: 'expense', amount: 18500, finance_category_id: 'fc-6', description: 'Arbitraje partido Sub-12',       payment_method: 'cash',     transfer_reference: null,           registered_by: null, created_at: '2026-05-05T11:30:00' },
  { id: 'cm-5', session_id: 'cs-1', movement_type: 'income',  amount: 62000, finance_category_id: 'fc-1', description: 'Cuota mayo — Mateo López',      payment_method: 'transfer', transfer_reference: 'MP-88533',     registered_by: null, created_at: '2026-05-05T12:00:00' },
  { id: 'cm-6', session_id: 'cs-1', movement_type: 'expense', amount: 35000, finance_category_id: 'fc-5', description: 'Pelotas y conos',                payment_method: 'transfer', transfer_reference: 'TR-001234',    registered_by: null, created_at: '2026-05-05T13:00:00' },
  { id: 'cm-7', session_id: 'cs-1', movement_type: 'income',  amount: 35000, finance_category_id: 'fc-2', description: 'Matrícula — Felipe Pérez',       payment_method: 'transfer', transfer_reference: 'MP-MATR-883', registered_by: null, created_at: '2026-05-05T14:00:00' },
]

// ──────────────────────────────────────────────────────────────────────────
// PROFES Y ASIGNACIONES — cada profe puede coachear varias tiras
// ──────────────────────────────────────────────────────────────────────────
export const demoProfes: Profe[] = [
  // 3 profes con compliance completo, 3 con algo vencido, otros varios
  { id: 'pf-1',  full_name: 'Martín Olivera',     dni: '32145678', birth_date: '1985-03-12', email: 'martin.olivera@gmail.com', whatsapp: '1145001111', start_date: '2018-03-01', title_certifications: 'Profesor de Educación Física (UNLP)', payment_method: 'factura', hourly_rate: 4500,
    antecedentes_penales_url: '/demo-doc.pdf', antecedentes_penales_expires_at: '2026-09-15',
    antecedentes_sexuales_url: '/demo-doc.pdf', antecedentes_sexuales_expires_at: '2026-09-15',
    apto_psicofisico_url: '/demo-doc.pdf', apto_psicofisico_expires_at: '2026-12-31',
    safeguarding_course_completed: true, safeguarding_course_date: '2025-08-10',
    is_active: true },
  { id: 'pf-2',  full_name: 'Pablo Quintana',     dni: '30987654', email: 'pquintana@gmail.com', whatsapp: '1145002222', start_date: '2020-06-01', title_certifications: 'DT Asoc. de Técnicos del Fútbol', payment_method: 'recibo', hourly_rate: 4000,
    antecedentes_penales_url: '/demo-doc.pdf', antecedentes_penales_expires_at: '2026-06-01', // VENCE EN MENOS DE 30 DÍAS
    antecedentes_sexuales_url: '/demo-doc.pdf', antecedentes_sexuales_expires_at: '2026-08-12',
    apto_psicofisico_expires_at: '2026-04-15',  // VENCIDO
    safeguarding_course_completed: false,
    is_active: true },
  { id: 'pf-3',  full_name: 'Diego Salinas',      dni: '28456789', email: 'dsalinas@yahoo.com', whatsapp: '1145003333', start_date: '2015-02-01', title_certifications: 'Profesor de Educación Física', payment_method: 'sueldo', monthly_salary: 380000,
    antecedentes_penales_url: '/demo-doc.pdf', antecedentes_penales_expires_at: '2027-02-20',
    antecedentes_sexuales_url: '/demo-doc.pdf', antecedentes_sexuales_expires_at: '2026-11-30',
    apto_psicofisico_url: '/demo-doc.pdf', apto_psicofisico_expires_at: '2026-10-15',
    safeguarding_course_completed: true, safeguarding_course_date: '2026-02-15',
    is_active: true },
  { id: 'pf-4',  full_name: 'Hernán Ledesma',     dni: '34567890', email: 'h.ledesma@gmail.com', whatsapp: '1145004444', start_date: '2022-09-01', payment_method: 'factura', hourly_rate: 3500,
    antecedentes_penales_expires_at: '2026-07-20',
    antecedentes_sexuales_expires_at: '2026-07-20',
    apto_psicofisico_expires_at: '2026-09-01',
    safeguarding_course_completed: true, safeguarding_course_date: '2025-11-05',
    is_active: true },
  { id: 'pf-5',  full_name: 'Marcos Cabezas',     dni: '36789012', email: 'mcabezas@gmail.com', whatsapp: '1145005555', start_date: '2024-03-01', payment_method: 'ad_honorem',
    safeguarding_course_completed: false,  // FALTA curso
    is_active: true },
  { id: 'pf-6',  full_name: 'Ariel Vázquez',      dni: '29234567', whatsapp: '1145006666', start_date: '2017-08-01', is_active: true,
    antecedentes_penales_expires_at: '2026-12-01', antecedentes_sexuales_expires_at: '2026-12-01', apto_psicofisico_expires_at: '2027-01-15',
    safeguarding_course_completed: true, payment_method: 'recibo' },
  { id: 'pf-7',  full_name: 'Cristian Mendoza',   whatsapp: '1145007777', is_active: true },
  { id: 'pf-8',  full_name: 'Gustavo Maldonado',  whatsapp: '1145008888', is_active: true,
    antecedentes_penales_expires_at: '2025-12-01' /* VENCIDO */ },
  { id: 'pf-9',  full_name: 'Sergio Aguilar',     whatsapp: '1145009999', is_active: true },
  { id: 'pf-10', full_name: 'Ezequiel Cabrera',   whatsapp: '1145010101', is_active: true },
  { id: 'pf-11', full_name: 'Damián Roldán',      whatsapp: '1145011111', is_active: true },
  { id: 'pf-12', full_name: 'Lucas Iturralde',    whatsapp: '1145012121', is_active: true },
]

// Helper: estado de compliance del profe
export function getProfeComplianceStatus(profe: Profe): {
  status: import('@/types').ProfeComplianceStatus
  issues: { label: string; severity: 'high' | 'medium'; expires?: string }[]
} {
  const today = new Date('2026-05-07')
  const issues: { label: string; severity: 'high' | 'medium'; expires?: string }[] = []

  function checkExpiry(label: string, expiresAt?: string | null, isCritical = true) {
    if (!expiresAt) {
      issues.push({ label: `Falta ${label}`, severity: isCritical ? 'high' : 'medium' })
      return
    }
    const exp = new Date(expiresAt)
    const daysLeft = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) issues.push({ label: `${label} VENCIDO`, severity: 'high', expires: expiresAt })
    else if (daysLeft <= 30) issues.push({ label: `${label} vence en ${daysLeft}d`, severity: 'medium', expires: expiresAt })
  }

  checkExpiry('Antecedentes penales', profe.antecedentes_penales_expires_at)
  checkExpiry('Cert. delitos sexuales', profe.antecedentes_sexuales_expires_at)
  checkExpiry('Apto psicofísico', profe.apto_psicofisico_expires_at, false)
  if (!profe.safeguarding_course_completed) {
    issues.push({ label: 'Curso safeguarding pendiente', severity: 'medium' })
  }

  const hasHigh = issues.some(i => i.severity === 'high')
  const hasMed = issues.some(i => i.severity === 'medium')
  const status: import('@/types').ProfeComplianceStatus =
    hasHigh ? 'expired' : hasMed ? 'expiring_soon' : issues.length === 0 ? 'ok' : 'missing'
  return { status, issues }
}

// Asignaciones: cada (categoría, tira) puede tener 1-2 profes; un profe puede estar en varias
export const demoProfeAssignments: ProfeAssignment[] = [
  // Martín Olivera — 2010 Metro/Liga1, 2011 Metro
  { profe_id: 'pf-1', category_id: 'cat-2010', tira: 'metro' },
  { profe_id: 'pf-1', category_id: 'cat-2010', tira: 'liga1' },
  { profe_id: 'pf-1', category_id: 'cat-2011', tira: 'metro' },
  // Pablo Quintana — 2010 Liga2/Edefi
  { profe_id: 'pf-2', category_id: 'cat-2010', tira: 'liga2' },
  { profe_id: 'pf-2', category_id: 'cat-2010', tira: 'edefi' },
  // Diego Salinas — 2011 Liga1/Liga2, 2012 Metro
  { profe_id: 'pf-3', category_id: 'cat-2011', tira: 'liga1' },
  { profe_id: 'pf-3', category_id: 'cat-2011', tira: 'liga2' },
  { profe_id: 'pf-3', category_id: 'cat-2012', tira: 'metro' },
  // Hernán Ledesma — 2011 Edefi, 2012 Liga1
  { profe_id: 'pf-4', category_id: 'cat-2011', tira: 'edefi' },
  { profe_id: 'pf-4', category_id: 'cat-2012', tira: 'liga1' },
  // Marcos Cabezas — 2012 Liga2/Edefi
  { profe_id: 'pf-5', category_id: 'cat-2012', tira: 'liga2' },
  { profe_id: 'pf-5', category_id: 'cat-2012', tira: 'edefi' },
  // Ariel Vázquez — 2013 Metro, 2014 Metro
  { profe_id: 'pf-6', category_id: 'cat-2013', tira: 'metro' },
  { profe_id: 'pf-6', category_id: 'cat-2014', tira: 'metro' },
  // Cristian Mendoza — 2014 Liga1/Liga2
  { profe_id: 'pf-7', category_id: 'cat-2014', tira: 'liga1' },
  { profe_id: 'pf-7', category_id: 'cat-2014', tira: 'liga2' },
  // Gustavo Maldonado — 2014 Edefi, 2015 Metro
  { profe_id: 'pf-8', category_id: 'cat-2014', tira: 'edefi' },
  { profe_id: 'pf-8', category_id: 'cat-2015', tira: 'metro' },
  // Sergio Aguilar — 2015 Liga1/Liga2/Edefi
  { profe_id: 'pf-9', category_id: 'cat-2015', tira: 'liga1' },
  { profe_id: 'pf-9', category_id: 'cat-2015', tira: 'liga2' },
  { profe_id: 'pf-9', category_id: 'cat-2015', tira: 'edefi' },
  // Ezequiel Cabrera — 2016 Metro, 2017 Metro
  { profe_id: 'pf-10', category_id: 'cat-2016', tira: 'metro' },
  { profe_id: 'pf-10', category_id: 'cat-2017', tira: 'metro' },
  // Damián Roldán — 2016 Edefi, 2017 Edefi
  { profe_id: 'pf-11', category_id: 'cat-2016', tira: 'edefi' },
  { profe_id: 'pf-11', category_id: 'cat-2017', tira: 'edefi' },
  // Lucas Iturralde — 2018 Metro/Edefi
  { profe_id: 'pf-12', category_id: 'cat-2018', tira: 'metro' },
  { profe_id: 'pf-12', category_id: 'cat-2018', tira: 'edefi' },
]

// Lista de profes para un club: reales si el club está hidratado, demo si no.
export function getProfesForClub(clubId?: string): Profe[] {
  const real = clubId ? realProfesByClub.get(clubId) : undefined
  return real ?? demoProfes
}

// Busca un profe por id en cualquier set real y, si no, en los demo.
// (los ids reales son UUID y los demo 'pf-N', no colisionan)
export function getProfeById(id?: string | null): Profe | undefined {
  if (!id) return undefined
  for (const profes of realProfesByClub.values()) {
    const found = profes.find(p => p.id === id)
    if (found) return found
  }
  return demoProfes.find(p => p.id === id)
}

export function getProfesForTira(categoryId: string, tira: Tira): Profe[] {
  // Club real: resolver contra asignaciones/profes reales del club.
  for (const [clubId, assigns] of realAssignmentsByClub) {
    const ids = assigns
      .filter(a => a.category_id === categoryId && a.tira === tira)
      .map(a => a.profe_id)
    if (ids.length) return (realProfesByClub.get(clubId) ?? []).filter(p => ids.includes(p.id))
  }
  const profeIds = demoProfeAssignments
    .filter(a => a.category_id === categoryId && a.tira === tira)
    .map(a => a.profe_id)
  return demoProfes.filter(p => profeIds.includes(p.id))
}

export function getAssignmentsForProfe(profeId: string): ProfeAssignment[] {
  for (const assigns of realAssignmentsByClub.values()) {
    const found = assigns.filter(a => a.profe_id === profeId)
    if (found.length) return found
  }
  return demoProfeAssignments.filter(a => a.profe_id === profeId)
}

// ──────────────────────────────────────────────────────────────────────────
// PERMISOS DE AUSENCIA — días de la semana que un jugador tiene autorizado faltar
// ──────────────────────────────────────────────────────────────────────────
export type AttendancePermit = {
  id: string
  player_id: string
  weekday: number  // 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes
  reason: string
  approved_by_profe?: string | null
  active_from: string
  active_to?: string | null
}

// Demo: algunos chicos tienen permisos para faltar ciertos días
export const demoAttendancePermits: AttendancePermit[] = [
  { id: 'perm-1', player_id: 'p-1',  weekday: 1, reason: 'Colegio (clases extendidas)', approved_by_profe: 'pf-1', active_from: '2026-03-01' },
  { id: 'perm-2', player_id: 'p-1',  weekday: 5, reason: 'Apoyo escolar',                 approved_by_profe: 'pf-1', active_from: '2026-03-01' },
  { id: 'perm-3', player_id: 'p-3',  weekday: 4, reason: 'Catequesis',                    approved_by_profe: 'pf-1', active_from: '2026-03-01' },
  { id: 'perm-4', player_id: 'p-7',  weekday: 1, reason: 'Inglés',                        approved_by_profe: 'pf-3', active_from: '2026-03-01' },
  { id: 'perm-5', player_id: 'p-15', weekday: 3, reason: 'Médico',                        approved_by_profe: 'pf-1', active_from: '2026-03-01', active_to: '2026-06-30' },
]

export function getPermitsForPlayer(playerId: string): AttendancePermit[] {
  return demoAttendancePermits.filter(p => p.player_id === playerId)
}

// Cálculo de asistencia ANUAL y SEMANAL considerando suspensiones y permisos
export function getDetailedAttendanceStats(playerId: string, categoryId: string) {
  const permits = getPermitsForPlayer(playerId)
  const permittedDays = new Set(permits.map(p => p.weekday))

  // Eventos del año (prácticas)
  const allPractices = demoEvents.filter(e =>
    e.category_id === categoryId && e.event_type === 'practice'
  )

  // Anual
  const yearPractices = allPractices.filter(e => !e.is_suspended)
  // Quitar las que caen en día con permiso
  const eligibleYear = yearPractices.filter(e => {
    const wd = new Date(e.scheduled_at).getDay()
    return !permittedDays.has(wd)
  })
  const playerAtt = demoAttendance.filter(a => a.player_id === playerId)
  const yearPresentes = playerAtt.filter(a => a.status === 'present').length
  const yearJustificadas = playerAtt.filter(a => a.status === 'absent_justified').length
  const yearDenom = Math.max(eligibleYear.length, 1)
  const yearPct = Math.min(100, Math.round((yearPresentes / yearDenom) * 100))

  // Semanal (lunes-viernes de esta semana)
  const today = new Date('2026-05-07') // demo: 2026-05-07 jueves
  const dayOfWeek = today.getDay() // 4 = jueves
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek - 1))
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)

  const weekPractices = allPractices.filter(e => {
    const d = new Date(e.scheduled_at)
    return d >= monday && d <= friday && !e.is_suspended
  })
  const eligibleWeek = weekPractices.filter(e => {
    const wd = new Date(e.scheduled_at).getDay()
    return !permittedDays.has(wd)
  })
  const weekAttIds = new Set(weekPractices.map(e => e.id))
  const weekPresentes = playerAtt.filter(a => weekAttIds.has(a.event_id) && a.status === 'present').length
  const weekDenom = Math.max(eligibleWeek.length, 1)
  const weekPct = Math.min(100, Math.round((weekPresentes / weekDenom) * 100))

  return {
    year: { presentes: yearPresentes, justificadas: yearJustificadas, total: eligibleYear.length, totalRaw: yearPractices.length, percentage: yearPct },
    week:  { presentes: weekPresentes, total: eligibleWeek.length, totalRaw: weekPractices.length, percentage: weekPct },
    permits,
  }
}

// ──────────────────────────────────────────────────────────────────────────
// VISITANTES / NO ANOTADOS — chicos que participaron en clases pero no son socios todavía
// (a prueba, hermanos, invitados, o control para que empiecen a abonar)
// ──────────────────────────────────────────────────────────────────────────
export type GuestParticipation = {
  id: string
  full_name: string
  category_id: string
  shifted_to: 'metro' | 'liga1' | 'liga2' | 'edefi'
  date: string
  reason: 'visit_other_tira' | 'unregistered_trial' | 'sibling' | 'invited'
  // Si es de otra tira de la misma estructura
  source_player_id?: string
  source_tira?: 'metro' | 'liga1' | 'liga2' | 'edefi'
  added_by_profe?: string | null
  notes?: string | null
}

export const demoGuestParticipations: GuestParticipation[] = [
  { id: 'guest-1', full_name: 'Mateo Acuña',     category_id: 'cat-2014', shifted_to: 'metro', date: '2026-05-05', reason: 'unregistered_trial', notes: 'Hermano de Lucas Fernández. Vino a probar.', added_by_profe: 'pf-6' },
  { id: 'guest-2', full_name: 'Joaquín Pereyra', category_id: 'cat-2015', shifted_to: 'metro', date: '2026-05-04', reason: 'unregistered_trial', notes: 'Lo trajo el papá, quiere asociarse.', added_by_profe: 'pf-8' },
  { id: 'guest-3', full_name: 'Lautaro Vargas',  category_id: 'cat-2014', shifted_to: 'liga1', date: '2026-05-03', reason: 'visit_other_tira', source_player_id: 'p-50', source_tira: 'liga2', added_by_profe: 'pf-7' },
  { id: 'guest-4', full_name: 'Brian Núñez',     category_id: 'cat-2012', shifted_to: 'metro', date: '2026-05-02', reason: 'sibling', notes: 'Hermano de Tomás García', added_by_profe: 'pf-3' },
  { id: 'guest-5', full_name: 'Tobías Ledesma',  category_id: 'cat-2016', shifted_to: 'metro', date: '2026-05-01', reason: 'unregistered_trial', notes: 'A prueba — pendiente registro', added_by_profe: 'pf-10' },
]

// ──────────────────────────────────────────────────────────────────────────
// DESCUENTOS POR HERMANO
// ──────────────────────────────────────────────────────────────────────────
export const demoSiblingDiscountConfig: import('@/types').SiblingDiscountConfig = {
  second_child_pct: 50,        // 2do hermano paga 50% de su cuota
  third_or_more_pct: 75,       // 3ro+ pagan 25% de su cuota (75% off)
  updated_at: '2026-03-01',
  updated_by: null,
}

// Detecta hermanos por mismo email del tutor
export function getSiblings(playerId: string) {
  const player = demoPlayers.find(p => p.id === playerId)
  if (!player || !player.tutor_email) return []
  return demoPlayers.filter(p =>
    p.id !== playerId && p.tutor_email && p.tutor_email === player.tutor_email && p.is_active
  )
}

// Calcula el descuento aplicable a un jugador según orden entre hermanos (mayor a menor por nacimiento)
export function getSiblingDiscount(playerId: string): { order: number; discount_pct: number } {
  const player = demoPlayers.find(p => p.id === playerId)
  if (!player || !player.tutor_email) return { order: 1, discount_pct: 0 }
  const family = demoPlayers
    .filter(p => p.tutor_email === player.tutor_email && p.is_active)
    .sort((a, b) => a.birth_date.localeCompare(b.birth_date))
  const order = family.findIndex(p => p.id === playerId) + 1
  if (order === 1) return { order: 1, discount_pct: 0 }
  if (order === 2) return { order: 2, discount_pct: demoSiblingDiscountConfig.second_child_pct }
  return { order, discount_pct: demoSiblingDiscountConfig.third_or_more_pct }
}

export const demoEligibilityConfig: EligibilityConfig = {
  id: 'ec-1',
  min_practice_percentage: 50,
  min_match_percentage: 50,
  updated_at: '2026-03-01',
  updated_by: null,
}

// Log de cambios en umbrales (audit)
export const demoEligibilityLog: import('@/types').EligibilityChangeLog[] = [
  {
    id: 'elog-1',
    type: 'practice_threshold',
    scope: 'club',
    old_value: 60,
    new_value: 50,
    changed_by: 'Diego Barrado (Admin)',
    changed_at: '2026-04-15T10:30:00',
    reason: 'Bajada por contemplar permisos de colegio',
  },
  {
    id: 'elog-2',
    type: 'convocation_override',
    scope: 'convocation',
    convocation_id: 'conv-001',
    category_name: '2014 Metro',
    old_value: 50,
    new_value: 70,
    changed_by: 'Ariel Vázquez (Profe)',
    changed_at: '2026-05-04T18:42:00',
    reason: 'Convocatoria especial: solo elegibles top',
  },
  {
    id: 'elog-3',
    type: 'convocation_override',
    scope: 'convocation',
    convocation_id: 'conv-002',
    category_name: '2012 Metro',
    old_value: 50,
    new_value: 30,
    changed_by: 'Diego Salinas (Profe)',
    changed_at: '2026-05-06T14:15:00',
    reason: 'Partido amistoso, abrimos para más jugadores',
  },
  {
    id: 'elog-4',
    type: 'match_threshold',
    scope: 'club',
    old_value: 40,
    new_value: 50,
    changed_by: 'Diego Barrado (Admin)',
    changed_at: '2026-03-01T09:00:00',
  },
]

// ──────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────
export function getPlayersByCategory(categoryId: string, shift?: string) {
  return demoPlayers.filter(p =>
    p.category_id === categoryId && (shift ? p.shift === shift : true)
  )
}

export function getPlayerDebts(players: Player[], payments: Payment[]): Player[] {
  const paidThisMonth = new Set(
    payments
      .filter(p => p.period === thisMonth && p.fee_type === 'actividad')
      .map(p => p.player_id)
  )
  return players.filter(p => !paidThisMonth.has(p.id))
}

export function getAttendanceStats(playerId: string, categoryId: string) {
  const practices = demoEvents.filter(
    e => e.category_id === categoryId && e.event_type === 'practice' && !e.is_suspended
  )
  const playerAttendance = demoAttendance.filter(a => a.player_id === playerId)
  const attended = playerAttendance.filter(a => a.status === 'present').length
  const justified = playerAttendance.filter(a => a.status === 'absent_justified').length
  const denominator = Math.max(practices.length - justified, 1)
  const percentage = Math.round((attended / denominator) * 100)
  return { attended, justified, total: practices.length, percentage }
}

// Asistencia a partidos (simulada): basada en convocation_count vs total de partidos jugados
export function getMatchAttendanceStats(playerId: string) {
  const player = demoPlayers.find(p => p.id === playerId)
  if (!player) return { played: 0, total: 0, percentage: 0 }
  // Suponemos que se jugaron 12 partidos en lo que va del año
  const totalMatches = 12
  const played = Math.min(player.convocation_count, totalMatches)
  // Variabilidad: el porcentaje de partidos jugados de los convocados es alto (85-100%)
  const seed = (player.id.charCodeAt(2) ?? 0) + (player.id.charCodeAt(3) ?? 0)
  const matchAttendanceRate = 0.85 + ((seed * 7) % 15) / 100
  const percentage = Math.round((played / totalMatches) * 100)
  return { played, total: totalMatches, percentage }
}

// ──────────────────────────────────────────────────────────────────────────
// CLUBES FICTICIOS POR DEPORTE — datos demo para grabación multi-deporte
// Cada club tiene categorías + jugadores con club_id apuntando al club
// correspondiente. Las posiciones se mapean al type Position genérico
// (arquero/defensor/mediocampista/delantero) — ver mapeo por deporte abajo.
// ──────────────────────────────────────────────────────────────────────────

const NOMBRES_FEM = [
  'Sofía','Martina','Camila','Valentina','Catalina','Mía','Emma','Lucía','Olivia','Isabella',
  'Julieta','Renata','Antonella','Pilar','Delfina','Bianca','Agustina','Florencia','Victoria','Luna',
  'Paloma','Abril','Malena','Ámbar','Constanza','Manuela','Josefina','Zoe','Helena','Clara',
]

// PRNG separado para no afectar la generación legacy de Banfield
function makeRng(seed: number) {
  let s = seed
  return function () {
    s = (s + 0x6d2b79f5) | 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type ClubGenSpec = {
  clubId: string
  sportFormat: string
  isFemale?: boolean
  rngSeed: number
  // distribución posiciones (arquero, defensor, mediocampista, delantero)
  positionDist: [number, number, number, number]
  categories: Array<{ id: string; name: string; birth_year: number; count: number }>
}

const CLUB_GEN_SPECS: ClubGenSpec[] = [
  // Pequeñas Estrellas — baby_6 — 4 categorías por año (2017-2020)
  {
    clubId: 'club-pequenas-estrellas',
    sportFormat: 'baby_6',
    rngSeed: 101,
    positionDist: [10, 30, 35, 25],
    categories: [
      { id: 'cat-pe-2017', name: '2017', birth_year: 2017, count: 26 },
      { id: 'cat-pe-2018', name: '2018', birth_year: 2018, count: 25 },
      { id: 'cat-pe-2019', name: '2019', birth_year: 2019, count: 23 },
      { id: 'cat-pe-2020', name: '2020', birth_year: 2020, count: 21 },
    ],
  },
  // San Marcos — futsal — Sub-13 a Adulto (5 cats)
  {
    clubId: 'club-san-marcos',
    sportFormat: 'futsal',
    rngSeed: 202,
    positionDist: [12, 28, 30, 30], // futsal: arquero, cierre, ala, pivote
    categories: [
      { id: 'cat-sm-sub13', name: 'Sub-13', birth_year: 2013, count: 18 },
      { id: 'cat-sm-sub15', name: 'Sub-15', birth_year: 2011, count: 18 },
      { id: 'cat-sm-sub17', name: 'Sub-17', birth_year: 2009, count: 16 },
      { id: 'cat-sm-sub19', name: 'Sub-19', birth_year: 2007, count: 14 },
      { id: 'cat-sm-adulto', name: 'Adulto', birth_year: 2000, count: 14 },
    ],
  },
  // Las Halcones — hockey femenino — Sub-12 a Primera (5 cats)
  {
    clubId: 'club-las-halcones',
    sportFormat: 'hockey_field',
    isFemale: true,
    rngSeed: 303,
    positionDist: [10, 30, 35, 25], // arquera, back, mediocampista, delantera
    categories: [
      { id: 'cat-lh-sub12', name: 'Sub-12', birth_year: 2014, count: 16 },
      { id: 'cat-lh-sub14', name: 'Sub-14', birth_year: 2012, count: 16 },
      { id: 'cat-lh-sub16', name: 'Sub-16', birth_year: 2010, count: 14 },
      { id: 'cat-lh-sub18', name: 'Sub-18', birth_year: 2008, count: 14 },
      { id: 'cat-lh-primera', name: 'Primera', birth_year: 2002, count: 12 },
    ],
  },
  // Vóley Ituzaingó — volleyball — Mini, Sub-12, Sub-14, Sub-16
  {
    clubId: 'club-voley-ituzaingo',
    sportFormat: 'volleyball',
    rngSeed: 404,
    positionDist: [8, 25, 35, 32], // libero(arquero), central(def), armadora(medio), punta/opuesto(del)
    categories: [
      { id: 'cat-vi-mini', name: 'Mini', birth_year: 2016, count: 12 },
      { id: 'cat-vi-sub12', name: 'Sub-12', birth_year: 2014, count: 12 },
      { id: 'cat-vi-sub14', name: 'Sub-14', birth_year: 2012, count: 12 },
      { id: 'cat-vi-sub16', name: 'Sub-16', birth_year: 2010, count: 12 },
    ],
  },
  // Báskets Quilmes — basketball — U-10 a U-18 (5 cats)
  {
    clubId: 'club-baskets-quilmes',
    sportFormat: 'basketball',
    rngSeed: 505,
    positionDist: [0, 35, 35, 30], // base/escolta(def), alero(medio), ala-pivot/pivot(del); no hay arquero
    categories: [
      { id: 'cat-bq-u10', name: 'U-10', birth_year: 2016, count: 14 },
      { id: 'cat-bq-u12', name: 'U-12', birth_year: 2014, count: 14 },
      { id: 'cat-bq-u14', name: 'U-14', birth_year: 2012, count: 14 },
      { id: 'cat-bq-u16', name: 'U-16', birth_year: 2010, count: 14 },
      { id: 'cat-bq-u18', name: 'U-18', birth_year: 2008, count: 12 },
    ],
  },
  // Tigres Rugby Seven — rugby_7 — Sub-15, Sub-17, Sub-19, Senior (4 cats)
  {
    clubId: 'club-tigres-rugby',
    sportFormat: 'rugby_7',
    rngSeed: 606,
    positionDist: [0, 35, 35, 30], // pilares/segunda(def), medios(medio), centros/wings(del)
    categories: [
      { id: 'cat-tr-sub15', name: 'Sub-15', birth_year: 2011, count: 14 },
      { id: 'cat-tr-sub17', name: 'Sub-17', birth_year: 2009, count: 14 },
      { id: 'cat-tr-sub19', name: 'Sub-19', birth_year: 2007, count: 12 },
      { id: 'cat-tr-senior', name: 'Senior', birth_year: 2000, count: 12 },
    ],
  },
  // Lobos Rugby Club — rugby_15 — Sub-15, Sub-17, Sub-19, M19, Primera (5 cats)
  {
    clubId: 'club-lobos-rugby',
    sportFormat: 'rugby_15',
    rngSeed: 707,
    positionDist: [0, 40, 30, 30],
    categories: [
      { id: 'cat-lr-sub15', name: 'Sub-15', birth_year: 2011, count: 22 },
      { id: 'cat-lr-sub17', name: 'Sub-17', birth_year: 2009, count: 22 },
      { id: 'cat-lr-sub19', name: 'Sub-19', birth_year: 2007, count: 20 },
      { id: 'cat-lr-m19', name: 'M19', birth_year: 2006, count: 20 },
      { id: 'cat-lr-primera', name: 'Primera', birth_year: 1998, count: 18 },
    ],
  },
  // Handball Norte — handball_7 — Cadetes, Juveniles, Mayores (3 cats)
  {
    clubId: 'club-handball-norte',
    sportFormat: 'handball_7',
    rngSeed: 808,
    positionDist: [12, 30, 30, 28], // portero, lateral/central(def/medio), extremo/pivote(del)
    categories: [
      { id: 'cat-hn-cadetes', name: 'Cadetes', birth_year: 2010, count: 14 },
      { id: 'cat-hn-juveniles', name: 'Juveniles', birth_year: 2008, count: 14 },
      { id: 'cat-hn-mayores', name: 'Mayores', birth_year: 2002, count: 12 },
    ],
  },
]

// Generar categorías de clubes ficticios
const fictionalCategories: Category[] = []
for (const spec of CLUB_GEN_SPECS) {
  for (const cat of spec.categories) {
    fictionalCategories.push({
      id: cat.id,
      name: cat.name,
      birth_year: cat.birth_year,
      sport_format_code: spec.sportFormat,
      club_id: spec.clubId,
      is_active: true,
      created_at: '2026-01-15',
    })
  }
}
demoCategories.push(...fictionalCategories)

// Generar jugadores de clubes ficticios
const fictionalPlayers: Player[] = []
let fictPlayerCounter = 10000 // empezar bien lejos de los IDs legacy
let fictDniBase = 55000000

for (const spec of CLUB_GEN_SPECS) {
  const rng = makeRng(spec.rngSeed)
  const nombres = spec.isFemale ? NOMBRES_FEM : NOMBRES
  const [pArq, pDef, pMed, pDel] = spec.positionDist

  function pickPosForSpec(): Position {
    const r = rng() * 100
    if (r < pArq) return 'arquero'
    if (r < pArq + pDef) return 'defensor'
    if (r < pArq + pDef + pMed) return 'mediocampista'
    return 'delantero'
  }

  function pickSecondaryForSpec(primary: Position): Position[] {
    const all: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
    const others = all.filter(p => p !== primary && (p !== 'arquero' || pArq > 0))
    if (primary === 'arquero') {
      return rng() > 0.85 ? [others[Math.floor(rng() * others.length)]] : []
    }
    const n = rng() < 0.5 ? 0 : rng() < 0.9 ? 1 : 2
    const result: Position[] = []
    const pool = [...others]
    for (let i = 0; i < n && pool.length > 0; i++) {
      const idx = Math.floor(rng() * pool.length)
      result.push(pool[idx])
      pool.splice(idx, 1)
    }
    return result
  }

  for (const cat of spec.categories) {
    for (let i = 0; i < cat.count; i++) {
      const nombre = nombres[Math.floor(rng() * nombres.length)]
      const apellido = APELLIDOS[Math.floor(rng() * APELLIDOS.length)]
      const tutorNombre = TUTOR_NOMBRES[Math.floor(rng() * TUTOR_NOMBRES.length)]
      const month = String(Math.floor(rng() * 12) + 1).padStart(2, '0')
      const day = String(Math.floor(rng() * 28) + 1).padStart(2, '0')
      const shift = i % 2 === 0 ? 'morning' : 'afternoon'
      const phoneBase = 1100000000 + Math.floor(rng() * 99999999)
      const primary = pickPosForSpec()
      const secondary = pickSecondaryForSpec(primary)
      const tutorDniBase = 20000000 + Math.floor(rng() * 25000000)
      const aptoOk = rng() < 0.75
      // Tira: distribuir según el deporte del club (~50% top, 30% segunda, 20% inferiores)
      const sportTiras = SPORT_TIRAS[spec.sportFormat as SportCode] ?? []
      let tira: Tira = 'metro'
      if (sportTiras.length > 0) {
        const r = rng()
        if (sportTiras.length === 1) {
          tira = sportTiras[0].code
        } else if (sportTiras.length === 2) {
          tira = r < 0.6 ? sportTiras[0].code : sportTiras[1].code
        } else if (sportTiras.length === 3) {
          tira = r < 0.5 ? sportTiras[0].code : r < 0.8 ? sportTiras[1].code : sportTiras[2].code
        } else {
          // 4+ tiras: 50% top, 30% segunda, 15% tercera, 5% resto
          if (r < 0.5) tira = sportTiras[0].code
          else if (r < 0.8) tira = sportTiras[1].code
          else if (r < 0.95) tira = sportTiras[2].code
          else tira = sportTiras[3].code
        }
      }

      fictionalPlayers.push({
        id: `p-fict-${fictPlayerCounter++}`,
        full_name: `${nombre} ${apellido}`,
        dni: String(fictDniBase++),
        birth_date: `${cat.birth_year}-${month}-${day}`,
        category_id: cat.id,
        tira,
        shift,
        photo_url: null,
        tutor_name: `${tutorNombre} ${apellido}`,
        tutor_dni: String(tutorDniBase),
        tutor_email: `${tutorNombre.toLowerCase()}.${apellido.toLowerCase()}.${spec.clubId.slice(-3)}@gmail.com`,
        tutor_whatsapp: String(phoneBase),
        primary_position: primary,
        secondary_positions: secondary,
        apto_medico_ok: aptoOk,
        apto_medico_file_url: aptoOk && rng() < 0.6 ? '/demo-apto.pdf' : null,
        apto_medico_expires_at: aptoOk ? '2026-12-31' : null,
        is_active: true,
        convocation_count: Math.floor(rng() * 12),
        created_at: '2026-03-01',
        club_id: spec.clubId,
      })
    }
  }
}

// Vincular 1 grupo de hermanos por club (2 hermanos cada uno, mismo tutor)
;(function linkFictionalSiblings() {
  for (const spec of CLUB_GEN_SPECS) {
    const clubPlayers = fictionalPlayers.filter(p => p.club_id === spec.clubId)
    if (clubPlayers.length < 2) continue
    const apellidoComun = clubPlayers[0].full_name.split(' ').slice(-1)[0]
    const tutorEmail = `familia.${spec.clubId.slice(-4)}@gmail.com`
    const tutorName = `Padre ${apellidoComun}`
    // Tomar 2 jugadores de distintas categorías si es posible
    const cat1 = clubPlayers[0].category_id
    const otro = clubPlayers.find(p => p.category_id !== cat1) ?? clubPlayers[1]
    clubPlayers[0].tutor_email = tutorEmail
    clubPlayers[0].tutor_name = tutorName
    otro.tutor_email = tutorEmail
    otro.tutor_name = tutorName
  }
})()

demoPlayers.push(...fictionalPlayers)

// ──────────────────────────────────────────────────────────────────────────
// PARTIDOS DE CLUBES FICTICIOS — ~3-5 partidos por club, mezcla pasados/próximos
// ──────────────────────────────────────────────────────────────────────────
type FictMatchSpec = {
  clubId: string
  rivales: string[]
  venueHome: string
  venueAway: (rival: string) => string
  // dia preferido de juego: 0=domingo, 6=sabado, etc.
  matchDays: number[]
}

const FICT_MATCH_SPECS: FictMatchSpec[] = [
  {
    clubId: 'club-pequenas-estrellas',
    rivales: ['Lomas Athletic', 'Sociedad Hebraica', 'Banco Nación', 'Banco Hipotecario', 'Pinocho'],
    venueHome: 'Cancha Pequeñas Estrellas — Lanús',
    venueAway: (r) => `Cancha de ${r}`,
    matchDays: [6], // sábado
  },
  {
    clubId: 'club-san-marcos',
    rivales: ['Pinocho', 'Boca Futsal', 'Hebraica', 'Hindú Futsal', 'Ferro Futsal'],
    venueHome: 'Polideportivo San Marcos — Vicente López',
    venueAway: (r) => `Estadio ${r}`,
    matchDays: [5, 6], // viernes y sábado (futsal mixto)
  },
  {
    clubId: 'club-las-halcones',
    rivales: ['GEBA', 'Belgrano Athletic', 'Lomas AC', "St. Catherine's", 'San Fernando'],
    venueHome: 'Cancha de Hockey Las Halcones — San Isidro',
    venueAway: (r) => `Cancha de ${r}`,
    matchDays: [6, 0], // sábado y domingo
  },
  {
    clubId: 'club-voley-ituzaingo',
    rivales: ['Italiano', 'GEVA', 'River Volley', 'Boca Volley', 'Ciudad de Buenos Aires'],
    venueHome: 'Polideportivo Vóley Ituzaingó',
    venueAway: (r) => `Estadio ${r}`,
    matchDays: [5, 6], // viernes y sábado
  },
  {
    clubId: 'club-baskets-quilmes',
    rivales: ['Atenas', 'Náutico Hacoaj', 'Obras Sanitarias', 'Argentino de Castelar', 'Quilmes BC'],
    venueHome: 'Estadio Báskets Quilmes',
    venueAway: (r) => `Estadio ${r}`,
    matchDays: [6, 0],
  },
  {
    clubId: 'club-tigres-rugby',
    rivales: ['CASI', 'SIC', 'Belgrano AC', 'Hindú', 'Pucará'],
    venueHome: 'Cancha Tigres — Pilar',
    venueAway: (r) => `Cancha de ${r}`,
    matchDays: [6],
  },
  {
    clubId: 'club-lobos-rugby',
    rivales: ['CASI', 'SIC', 'Hindú', 'Pucará', 'La Plata RC'],
    venueHome: 'Cancha Lobos — Tandil',
    venueAway: (r) => `Cancha de ${r}`,
    matchDays: [6],
  },
  {
    clubId: 'club-handball-norte',
    rivales: ['River', 'Vélez', 'SAG Villa Ballester', 'Ferrocarril Oeste', 'Dorrego'],
    venueHome: 'Polideportivo Handball Norte — San Fernando',
    venueAway: (r) => `Estadio ${r}`,
    matchDays: [6, 0],
  },
]

const fictionalEvents: Event[] = []
let fictEvIdCounter = 1
const todayFict = new Date('2026-05-09')

for (const ms of FICT_MATCH_SPECS) {
  const cats = fictionalCategories.filter(c => c.club_id === ms.clubId)
  if (cats.length === 0) continue
  const rng = makeRng(ms.clubId.length * 31 + ms.rivales.length)

  // Helper: día siguiente que coincida con uno de matchDays a partir de offset (positivo o negativo)
  function findMatchDate(offsetDays: number): Date {
    const d = new Date(todayFict)
    d.setDate(todayFict.getDate() + offsetDays)
    // ajustar al matchDay más cercano hacia adelante
    for (let i = 0; i < 7; i++) {
      if (ms.matchDays.includes(d.getDay())) return d
      d.setDate(d.getDate() + 1)
    }
    return d
  }

  // 2 pasados (-21 y -7 días aprox), 3 próximos (+7, +14, +21 días)
  const offsets = [-21, -7, 7, 14, 21]
  offsets.forEach((off, idx) => {
    const cat = cats[idx % cats.length]
    const matchDate = findMatchDate(off)
    const isHome = idx % 2 === 0
    const rival = ms.rivales[idx % ms.rivales.length]
    const venue = isHome ? ms.venueHome : ms.venueAway(rival)
    const horarios = ['10:00', '11:30', '14:00', '15:30', '17:00']
    const hora = horarios[Math.floor(rng() * horarios.length)]
    const dateStr = matchDate.toISOString().split('T')[0]

    fictionalEvents.push({
      id: `ev-fict-${ms.clubId.slice(-6)}-${fictEvIdCounter++}`,
      category_id: cat.id,
      event_type: 'match',
      scheduled_at: `${dateStr}T${hora}:00`,
      is_suspended: false,
      suspension_reason: null,
      rival,
      venue,
      is_home: isHome,
      created_by: null,
      created_at: '2026-04-01',
      club_id: ms.clubId,
    })
  })
}

demoEvents.push(...fictionalEvents)

// Clubes legacy comparten el set de datos sin club_id (los 450 chicos de fútbol).
// Banfield SALE de legacy: ahora corre en modo real (datos de Supabase, ver
// lib/real-clubs.ts + components/layout/data-provider.tsx). Boca y Brisas siguen demo.
const LEGACY_CLUB_IDS = new Set(['club-boca-rm', 'club-brisas'])

// ──────────────────────────────────────────────────────────────────────────
// HIDRATACIÓN DE CLUBES REALES (Supabase → memoria)
// El data-provider trae jugadores/categorías reales y los inyecta acá, tagueados
// con el id del club demo. Una vez hidratado, los getters devuelven SOLO datos
// reales para ese club (sin fallback a demo, para no mezclar real con ficticio).
// ──────────────────────────────────────────────────────────────────────────
const HYDRATED_REAL_CLUBS = new Set<string>()
// Profes y asignaciones reales por club. NO se mezclan con los arrays demo:
// los accessors (getProfesForClub / getProfeById / getProfesForTira /
// getAssignmentsForProfe) devuelven estos para el club real y los demo para
// el resto. Así un club demo nunca ve profes reales y viceversa.
const realProfesByClub = new Map<string, Profe[]>()
const realAssignmentsByClub = new Map<string, ProfeAssignment[]>()

export function hydrateRealClub(
  clubId: string,
  players: Player[],
  categories: Category[],
  profes: Profe[] = [],
  assignments: ProfeAssignment[] = [],
) {
  // Idempotente: limpiar lo previo de este club antes de inyectar.
  for (let i = demoPlayers.length - 1; i >= 0; i--) {
    if (demoPlayers[i].club_id === clubId) demoPlayers.splice(i, 1)
  }
  for (let i = demoCategories.length - 1; i >= 0; i--) {
    if (demoCategories[i].club_id === clubId) demoCategories.splice(i, 1)
  }
  demoPlayers.push(...players)
  demoCategories.push(...categories)
  realProfesByClub.set(clubId, profes)
  realAssignmentsByClub.set(clubId, assignments)
  HYDRATED_REAL_CLUBS.add(clubId)
}

export function isHydratedRealClub(clubId?: string): boolean {
  return !!clubId && HYDRATED_REAL_CLUBS.has(clubId)
}

export function getEventsForClub(clubId?: string): Event[] {
  if (!clubId || LEGACY_CLUB_IDS.has(clubId)) {
    return demoEvents.filter(e => !e.club_id)
  }
  return demoEvents.filter(e => e.club_id === clubId)
}

// ──────────────────────────────────────────────────────────────────────────
// HELPERS de filtro por club
// ──────────────────────────────────────────────────────────────────────────
export function getCategoriesForClub(clubId?: string): Category[] {
  if (HYDRATED_REAL_CLUBS.has(clubId ?? '')) {
    return demoCategories.filter(c => c.club_id === clubId)
  }
  if (!clubId || LEGACY_CLUB_IDS.has(clubId)) {
    return demoCategories.filter(c => !c.club_id)
  }
  const filtered = demoCategories.filter(c => c.club_id === clubId)
  // Fallback defensivo: si el club no tiene categorías propias, usar legacy para evitar pantallas rotas
  return filtered.length > 0 ? filtered : demoCategories.filter(c => !c.club_id)
}

export function getPlayersForClub(clubId?: string): Player[] {
  if (HYDRATED_REAL_CLUBS.has(clubId ?? '')) {
    return demoPlayers.filter(p => p.club_id === clubId)
  }
  if (!clubId || LEGACY_CLUB_IDS.has(clubId)) {
    return demoPlayers.filter(p => !p.club_id)
  }
  const filtered = demoPlayers.filter(p => p.club_id === clubId)
  return filtered.length > 0 ? filtered : demoPlayers.filter(p => !p.club_id)
}

export { thisMonth, lastMonth }

// ──────────────────────────────────────────────────────────────────────────
// PUNTAJES DE PARTIDOS — evaluación deportiva post-partido
// CONFIDENCIAL: visible sólo para profes/admin/coordinador. NUNCA para padres.
// Los registros son inmutables una vez guardados (auditoría).
// ──────────────────────────────────────────────────────────────────────────
export type MatchRating = {
  id: string
  event_id: string
  player_id: string
  score: number              // 1-10
  observation: string        // comentario opcional del profe
  rated_by_profe_id: string
  created_at: string
}

const POSITIVE_COMMENTS = [
  'Gran partido, muy aplicado en defensa.',
  'Lideró el medio campo, distribución muy precisa.',
  'Goleador del día. Definición notable.',
  'Cobertura excelente, recuperó muchas pelotas.',
  'Atajada decisiva en el segundo tiempo.',
  'Mucha actitud, levantó al equipo cuando estaba abajo.',
  'Probó de afuera y la metió. Confianza ganada.',
  'Marcó al delantero rival sin dejarlo respirar.',
  'Pivote del ataque, generó casi todas las situaciones.',
  'Sólido atrás, no falló un cruce.',
]
const NEUTRAL_COMMENTS = [
  'Cumplió, pero le faltó participación en ataque.',
  'Bien posicionado, jugó simple.',
  'Partido correcto, sin sobresaltos.',
  'Le costó arrancar pero mejoró en el complemento.',
]
const NEGATIVE_COMMENTS = [
  'Llegó cansado, perdió pelotas claves.',
  'Discutió mucho con el árbitro. Hablar a la semana.',
  'No siguió las indicaciones tácticas.',
  'Tuvo una amarilla evitable. Falta foco.',
  'Se mostró desconectado del juego.',
]

function generateRatings(): MatchRating[] {
  const ratings: MatchRating[] = []
  let rId = 1
  const profeIds = demoProfes.filter(p => p.is_active).map(p => p.id)
  const pastMatches = demoEvents.filter(e => e.event_type === 'match' && new Date(e.scheduled_at) < new Date('2026-05-12'))

  for (const match of pastMatches) {
    const playersOfCat = demoPlayers.filter(p => p.category_id === match.category_id && p.is_active)
    // Tomar ~14 jugadores "convocados" (titulares + suplentes típicos)
    const convocados = playersOfCat.slice(0, 14)
    // Profe que puntúa = el profe asignado a esa categoría (o el primero como fallback)
    const profe = demoProfeAssignments.find(a => a.category_id === match.category_id)?.profe_id ?? profeIds[0]

    for (const player of convocados) {
      // 85% chance de tener score (algunos jugadores no se puntúan)
      if (rand() < 0.15) continue
      // Distribución sesgada: la mayoría 5-8, algunos extremos
      const r = rand()
      const score = r < 0.10 ? Math.floor(rand() * 3) + 2      // 2-4 (10% malos)
                  : r < 0.55 ? Math.floor(rand() * 2) + 5      // 5-6 (45% medio-bajo)
                  : r < 0.90 ? Math.floor(rand() * 2) + 7      // 7-8 (35% buenos)
                  :            Math.floor(rand() * 2) + 9      // 9-10 (10% destacados)
      // Comentario sólo en ~40% de los casos
      const hasComment = rand() < 0.40
      let observation = ''
      if (hasComment) {
        if (score >= 7) observation = pick(POSITIVE_COMMENTS)
        else if (score >= 5) observation = pick(NEUTRAL_COMMENTS)
        else observation = pick(NEGATIVE_COMMENTS)
      }
      ratings.push({
        id: `rating-${rId++}`,
        event_id: match.id,
        player_id: player.id,
        score,
        observation,
        rated_by_profe_id: profe,
        created_at: match.scheduled_at,
      })
    }
  }
  return ratings
}

export const demoMatchRatings: MatchRating[] = generateRatings()

export function getRatingsForPlayer(playerId: string): MatchRating[] {
  return demoMatchRatings
    .filter(r => r.player_id === playerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getRatingsForEvent(eventId: string): MatchRating[] {
  return demoMatchRatings.filter(r => r.event_id === eventId)
}

export function getPlayerRatingStats(playerId: string): {
  count: number
  avg: number
  max: number
  min: number
  lastFiveAvg: number
} {
  const ratings = getRatingsForPlayer(playerId)
  if (ratings.length === 0) return { count: 0, avg: 0, max: 0, min: 0, lastFiveAvg: 0 }
  const scores = ratings.map(r => r.score)
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length
  const lastFive = scores.slice(0, 5)
  const lastFiveAvg = lastFive.reduce((s, v) => s + v, 0) / lastFive.length
  return {
    count: ratings.length,
    avg: Math.round(avg * 10) / 10,
    max: Math.max(...scores),
    min: Math.min(...scores),
    lastFiveAvg: Math.round(lastFiveAvg * 10) / 10,
  }
}

export function saveMatchRatings(eventId: string, profeId: string, scores: Record<string, number>, observations: Record<string, string>): void {
  // En demo: mutamos el array. En prod: insert/upsert a Supabase.
  const now = new Date().toISOString()
  for (const [playerId, score] of Object.entries(scores)) {
    if (score < 1 || score > 10) continue
    // Reemplaza rating previo del mismo profe sobre el mismo player en el mismo evento (idempotente)
    const existingIdx = demoMatchRatings.findIndex(r =>
      r.event_id === eventId && r.player_id === playerId && r.rated_by_profe_id === profeId
    )
    const rating: MatchRating = {
      id: existingIdx >= 0 ? demoMatchRatings[existingIdx].id : `rating-live-${Date.now()}-${playerId}`,
      event_id: eventId,
      player_id: playerId,
      score,
      observation: observations[playerId] ?? '',
      rated_by_profe_id: profeId,
      created_at: existingIdx >= 0 ? demoMatchRatings[existingIdx].created_at : now,
    }
    if (existingIdx >= 0) demoMatchRatings[existingIdx] = rating
    else demoMatchRatings.push(rating)
  }
}
