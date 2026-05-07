import type { Player, Category, Payment, Event, Attendance, CashSession, CashMovement, FinanceCategory, EligibilityConfig, Position, Tira, Profe, ProfeAssignment } from '@/types'

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

  for (let weekOffset = 1; weekOffset <= 4; weekOffset++) {
    // Sábado del weekOffset
    const matchDate = new Date(today)
    matchDate.setDate(today.getDate() + (6 - today.getDay()) + (weekOffset - 1) * 7)
    const dateStr = matchDate.toISOString().split('T')[0]

    for (const tira of allTiras) {
      // Categorías que tienen esta tira
      const catsWithTira = demoCategories.filter(c => {
        const dist = distribucion[c.id]
        return dist && dist.tiras.includes(tira)
      })
      if (catsWithTira.length === 0) continue

      const rival = tiraRivales[tira][weekOffset - 1]
      const isHome = weekOffset % 2 === 1
      const venue = isHome ? 'Predio Banfield Ramos Mejía' : `Cancha de ${rival}`

      // Una hora distinta por categoría dentro del mismo día
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
    // 78% pagó la cuota de este mes; el resto deudor
    const r = rand()
    if (r < 0.78) {
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
    // Mes pasado: 95% pagó
    if (rand() < 0.95) {
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
  { id: 'pf-1',  full_name: 'Martín Olivera',     whatsapp: '1145001111', is_active: true },
  { id: 'pf-2',  full_name: 'Pablo Quintana',     whatsapp: '1145002222', is_active: true },
  { id: 'pf-3',  full_name: 'Diego Salinas',      whatsapp: '1145003333', is_active: true },
  { id: 'pf-4',  full_name: 'Hernán Ledesma',     whatsapp: '1145004444', is_active: true },
  { id: 'pf-5',  full_name: 'Marcos Cabezas',     whatsapp: '1145005555', is_active: true },
  { id: 'pf-6',  full_name: 'Ariel Vázquez',      whatsapp: '1145006666', is_active: true },
  { id: 'pf-7',  full_name: 'Cristian Mendoza',   whatsapp: '1145007777', is_active: true },
  { id: 'pf-8',  full_name: 'Gustavo Maldonado',  whatsapp: '1145008888', is_active: true },
  { id: 'pf-9',  full_name: 'Sergio Aguilar',     whatsapp: '1145009999', is_active: true },
  { id: 'pf-10', full_name: 'Ezequiel Cabrera',   whatsapp: '1145010101', is_active: true },
  { id: 'pf-11', full_name: 'Damián Roldán',      whatsapp: '1145011111', is_active: true },
  { id: 'pf-12', full_name: 'Lucas Iturralde',    whatsapp: '1145012121', is_active: true },
]

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

export function getProfesForTira(categoryId: string, tira: Tira): Profe[] {
  const profeIds = demoProfeAssignments
    .filter(a => a.category_id === categoryId && a.tira === tira)
    .map(a => a.profe_id)
  return demoProfes.filter(p => profeIds.includes(p.id))
}

export function getAssignmentsForProfe(profeId: string): ProfeAssignment[] {
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

export { thisMonth, lastMonth }
