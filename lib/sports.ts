import type { Position } from '@/types'

export type SportCode =
  | 'football_11'
  | 'baby_5'
  | 'baby_6'
  | 'futsal'
  | 'hockey_field'
  | 'volleyball'
  | 'basketball'
  | 'rugby_7'
  | 'rugby_15'
  | 'handball_7'

export type DisciplineCard = {
  code: 'yellow' | 'red' | 'blue' | 'green' | 'warning'
  label: string  // ej: "Amonestación", "Expulsión"
  color_hex: string
  bg_class: string  // tailwind bg
  consequence?: string  // ej: "5 min fuera del juego"
}

export type SportFormat = {
  code: SportCode
  sport_name: string
  format_name: string
  icon: string
  players_on_field: number
  has_goalkeeper: boolean
  field_aspect_ratio: string  // ej: "2/3"
  positions: Array<{
    code: string
    label: string
    short_label: string
    color_hex: string
    default_y: number  // % vertical
    default_x_for_count: (count: number, indexInPosition: number) => number
  }>
  // Tarjetas disciplinarias propias del deporte
  discipline_cards: DisciplineCard[]
  scoring: 'goals' | 'sets_points' | 'quarters_points'
  // Compatibilidad: deprecated
  has_yellow_red_cards: boolean
}

// Conjuntos comunes
const FOOTBALL_CARDS: DisciplineCard[] = [
  { code: 'yellow', label: 'Amonestación', color_hex: '#fbbf24', bg_class: 'bg-yellow-400' },
  { code: 'red',    label: 'Expulsión',     color_hex: '#dc2626', bg_class: 'bg-red-600' },
]

const HOCKEY_CARDS: DisciplineCard[] = [
  { code: 'green',  label: 'Verde',         color_hex: '#16a34a', bg_class: 'bg-green-600',  consequence: 'Advertencia oficial' },
  { code: 'yellow', label: 'Amarilla',      color_hex: '#fbbf24', bg_class: 'bg-yellow-400', consequence: '5 min fuera' },
  { code: 'red',    label: 'Roja',          color_hex: '#dc2626', bg_class: 'bg-red-600',    consequence: 'Expulsión' },
]

const VOLLEY_CARDS: DisciplineCard[] = [
  { code: 'yellow', label: 'Amarilla',      color_hex: '#fbbf24', bg_class: 'bg-yellow-400', consequence: 'Amonestación' },
  { code: 'red',    label: 'Roja',          color_hex: '#dc2626', bg_class: 'bg-red-600',    consequence: 'Penalización: punto y saque al rival' },
  { code: 'warning', label: 'Roja + Amarilla', color_hex: '#7c2d12', bg_class: 'bg-red-900', consequence: 'Expulsión del set / descalificación del partido' },
]

const BASKET_CARDS: DisciplineCard[] = [
  { code: 'warning', label: 'Falta personal', color_hex: '#f59e0b', bg_class: 'bg-amber-500', consequence: 'Acumula a 5 = afuera' },
  { code: 'red',     label: 'Falta técnica/antideportiva', color_hex: '#dc2626', bg_class: 'bg-red-600' },
]

const RUGBY_CARDS: DisciplineCard[] = [
  { code: 'yellow', label: 'Amarilla',  color_hex: '#fbbf24', bg_class: 'bg-yellow-400', consequence: '10 min fuera (sin bin)' },
  { code: 'red',    label: 'Roja',       color_hex: '#dc2626', bg_class: 'bg-red-600',    consequence: 'Expulsión definitiva' },
]

const HANDBALL_CARDS: DisciplineCard[] = [
  { code: 'yellow', label: 'Amarilla',           color_hex: '#fbbf24', bg_class: 'bg-yellow-400', consequence: 'Amonestación oficial' },
  { code: 'warning', label: '2 minutos',          color_hex: '#f59e0b', bg_class: 'bg-amber-500',  consequence: 'Suspensión temporal' },
  { code: 'red',    label: 'Roja',                color_hex: '#dc2626', bg_class: 'bg-red-600',    consequence: 'Expulsión (3 × 2min = roja)' },
  { code: 'blue',   label: 'Azul',                color_hex: '#2563eb', bg_class: 'bg-blue-600',   consequence: 'Roja + informe escrito' },
]

// Helper para distribuir N jugadores horizontalmente
function spread(n: number, i: number): number {
  return ((i + 1) / (n + 1)) * 100
}

export const SPORT_FORMATS: Record<SportCode, SportFormat> = {
  football_11: {
    code: 'football_11',
    sport_name: 'Fútbol',
    format_name: 'Fútbol 11',
    icon: '⚽',
    players_on_field: 11,
    has_goalkeeper: true,
    field_aspect_ratio: '2/3',
    has_yellow_red_cards: true,
    discipline_cards: FOOTBALL_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquero', label: 'Arquero', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 92, default_x_for_count: () => 50 },
      { code: 'defensor', label: 'Defensor', short_label: 'DEF', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: spread },
      { code: 'mediocampista', label: 'Mediocampista', short_label: 'MED', color_hex: '#00843D', default_y: 45, default_x_for_count: spread },
      { code: 'delantero', label: 'Delantero', short_label: 'DEL', color_hex: '#DC2626', default_y: 18, default_x_for_count: spread },
    ],
  },
  baby_5: {
    code: 'baby_5',
    sport_name: 'Baby Fútbol',
    format_name: 'Baby 5',
    icon: '⚽',
    players_on_field: 5,
    has_goalkeeper: true,
    field_aspect_ratio: '3/4',
    has_yellow_red_cards: true,
    discipline_cards: FOOTBALL_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquero', label: 'Arquero', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 88, default_x_for_count: () => 50 },
      { code: 'defensor', label: 'Defensor', short_label: 'DEF', color_hex: '#1d4ed8', default_y: 65, default_x_for_count: spread },
      { code: 'mediocampista', label: 'Mediocampista', short_label: 'MED', color_hex: '#00843D', default_y: 42, default_x_for_count: () => 50 },
      { code: 'delantero', label: 'Delantero', short_label: 'DEL', color_hex: '#DC2626', default_y: 18, default_x_for_count: spread },
    ],
  },
  baby_6: {
    code: 'baby_6',
    sport_name: 'Baby Fútbol',
    format_name: 'Baby 6',
    icon: '⚽',
    players_on_field: 6,
    has_goalkeeper: true,
    field_aspect_ratio: '3/4',
    has_yellow_red_cards: true,
    discipline_cards: FOOTBALL_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquero', label: 'Arquero', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 88, default_x_for_count: () => 50 },
      { code: 'defensor', label: 'Defensor', short_label: 'DEF', color_hex: '#1d4ed8', default_y: 65, default_x_for_count: spread },
      { code: 'mediocampista', label: 'Mediocampista', short_label: 'MED', color_hex: '#00843D', default_y: 42, default_x_for_count: spread },
      { code: 'delantero', label: 'Delantero', short_label: 'DEL', color_hex: '#DC2626', default_y: 18, default_x_for_count: () => 50 },
    ],
  },
  futsal: {
    code: 'futsal',
    sport_name: 'Futsal',
    format_name: 'Futsal 5',
    icon: '🥅',
    players_on_field: 5,
    has_goalkeeper: true,
    field_aspect_ratio: '3/4',
    has_yellow_red_cards: true,
    discipline_cards: FOOTBALL_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquero', label: 'Arquero', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 88, default_x_for_count: () => 50 },
      { code: 'fijo', label: 'Fijo', short_label: 'FIJO', color_hex: '#1d4ed8', default_y: 68, default_x_for_count: () => 50 },
      { code: 'ala', label: 'Ala', short_label: 'ALA', color_hex: '#00843D', default_y: 42, default_x_for_count: spread },
      { code: 'pivot', label: 'Pívot', short_label: 'PIV', color_hex: '#DC2626', default_y: 18, default_x_for_count: () => 50 },
    ],
  },
  hockey_field: {
    code: 'hockey_field',
    sport_name: 'Hockey',
    format_name: 'Hockey 11',
    icon: '🏑',
    players_on_field: 11,
    has_goalkeeper: true,
    field_aspect_ratio: '2/3',
    has_yellow_red_cards: true,
    discipline_cards: HOCKEY_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquera', label: 'Arquera', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 92, default_x_for_count: () => 50 },
      { code: 'defensora', label: 'Defensora', short_label: 'DEF', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: spread },
      { code: 'volante', label: 'Volante', short_label: 'VOL', color_hex: '#00843D', default_y: 45, default_x_for_count: spread },
      { code: 'delantera', label: 'Delantera', short_label: 'DEL', color_hex: '#DC2626', default_y: 18, default_x_for_count: spread },
    ],
  },
  volleyball: {
    code: 'volleyball',
    sport_name: 'Vóley',
    format_name: 'Vóley 6',
    icon: '🏐',
    players_on_field: 6,
    has_goalkeeper: false,
    field_aspect_ratio: '1/1',
    has_yellow_red_cards: false,
    discipline_cards: VOLLEY_CARDS,
    scoring: 'sets_points',
    positions: [
      { code: 'zona_4', label: 'Zona 4 (delantera izq)', short_label: 'Z4', color_hex: '#DC2626', default_y: 28, default_x_for_count: () => 25 },
      { code: 'zona_3', label: 'Zona 3 (delantera centro)', short_label: 'Z3', color_hex: '#DC2626', default_y: 28, default_x_for_count: () => 50 },
      { code: 'zona_2', label: 'Zona 2 (delantera der)', short_label: 'Z2', color_hex: '#DC2626', default_y: 28, default_x_for_count: () => 75 },
      { code: 'zona_5', label: 'Zona 5 (zaguera izq)', short_label: 'Z5', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: () => 25 },
      { code: 'zona_6', label: 'Zona 6 (zaguera centro)', short_label: 'Z6', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: () => 50 },
      { code: 'zona_1', label: 'Zona 1 (saque)', short_label: 'Z1', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: () => 75 },
    ],
  },
  basketball: {
    code: 'basketball',
    sport_name: 'Básquet',
    format_name: 'Básquet 5',
    icon: '🏀',
    players_on_field: 5,
    has_goalkeeper: false,
    field_aspect_ratio: '1/2',
    has_yellow_red_cards: false,
    discipline_cards: BASKET_CARDS,
    scoring: 'quarters_points',
    positions: [
      { code: 'base', label: 'Base (1)', short_label: 'BAS', color_hex: '#1d4ed8', default_y: 80, default_x_for_count: () => 50 },
      { code: 'escolta', label: 'Escolta (2)', short_label: 'ESC', color_hex: '#00843D', default_y: 62, default_x_for_count: () => 25 },
      { code: 'alero', label: 'Alero (3)', short_label: 'ALE', color_hex: '#00843D', default_y: 62, default_x_for_count: () => 75 },
      { code: 'ala_pivot', label: 'Ala-Pívot (4)', short_label: 'AP', color_hex: '#DC2626', default_y: 35, default_x_for_count: () => 35 },
      { code: 'pivot', label: 'Pívot (5)', short_label: 'PIV', color_hex: '#DC2626', default_y: 35, default_x_for_count: () => 65 },
    ],
  },
  rugby_7: {
    code: 'rugby_7',
    sport_name: 'Rugby',
    format_name: 'Rugby 7s',
    icon: '🏉',
    players_on_field: 7,
    has_goalkeeper: false,
    field_aspect_ratio: '2/3',
    has_yellow_red_cards: true,
    discipline_cards: RUGBY_CARDS,
    scoring: 'quarters_points',
    positions: [
      { code: 'forward', label: 'Forward', short_label: 'FW', color_hex: '#1d4ed8', default_y: 70, default_x_for_count: spread },
      { code: 'medio', label: 'Medio scrum', short_label: 'MED', color_hex: '#00843D', default_y: 50, default_x_for_count: () => 50 },
      { code: 'back', label: 'Back', short_label: 'BK', color_hex: '#DC2626', default_y: 25, default_x_for_count: spread },
    ],
  },
  rugby_15: {
    code: 'rugby_15',
    sport_name: 'Rugby',
    format_name: 'Rugby XV',
    icon: '🏉',
    players_on_field: 15,
    has_goalkeeper: false,
    field_aspect_ratio: '2/3',
    has_yellow_red_cards: true,
    discipline_cards: RUGBY_CARDS,
    scoring: 'quarters_points',
    positions: [
      { code: 'pilar', label: 'Pilar / Hooker', short_label: 'PIL', color_hex: '#1d4ed8', default_y: 78, default_x_for_count: spread },
      { code: 'segunda_linea', label: 'Segunda línea', short_label: '2L', color_hex: '#1d4ed8', default_y: 65, default_x_for_count: spread },
      { code: 'tercera_linea', label: 'Tercera línea / Ala', short_label: '3L', color_hex: '#3b82f6', default_y: 52, default_x_for_count: spread },
      { code: 'medio_apertura', label: 'Medio scrum / Apertura', short_label: 'MED', color_hex: '#00843D', default_y: 38, default_x_for_count: spread },
      { code: 'centro', label: 'Centro', short_label: 'CEN', color_hex: '#16a34a', default_y: 25, default_x_for_count: spread },
      { code: 'wing_fullback', label: 'Wing / Fullback', short_label: 'BK', color_hex: '#DC2626', default_y: 12, default_x_for_count: spread },
    ],
  },
  handball_7: {
    code: 'handball_7',
    sport_name: 'Handball',
    format_name: 'Handball 7',
    icon: '🤾',
    players_on_field: 7,
    has_goalkeeper: true,
    field_aspect_ratio: '2/3',
    has_yellow_red_cards: true,
    discipline_cards: HANDBALL_CARDS,
    scoring: 'goals',
    positions: [
      { code: 'arquero', label: 'Arquero', short_label: 'ARQ', color_hex: '#F59E0B', default_y: 90, default_x_for_count: () => 50 },
      { code: 'central', label: 'Central', short_label: 'CEN', color_hex: '#00843D', default_y: 60, default_x_for_count: () => 50 },
      { code: 'lateral', label: 'Lateral', short_label: 'LAT', color_hex: '#1d4ed8', default_y: 45, default_x_for_count: spread },
      { code: 'extremo', label: 'Extremo', short_label: 'EXT', color_hex: '#7c3aed', default_y: 30, default_x_for_count: spread },
      { code: 'pivote', label: 'Pivote', short_label: 'PIV', color_hex: '#DC2626', default_y: 18, default_x_for_count: () => 50 },
    ],
  },
}

export const ALL_SPORT_FORMATS = Object.values(SPORT_FORMATS)

export function getSportFormat(code: SportCode): SportFormat {
  return SPORT_FORMATS[code]
}

// ──────────────────────────────────────────────────────────────────────────
// FORMACIONES TÁCTICAS por deporte (las más usadas hoy)
// ──────────────────────────────────────────────────────────────────────────
export type Formation = {
  code: string
  label: string
  description?: string
  // Slots por código de posición
  slots: Record<string, number>
}

export const FORMATIONS: Record<SportCode, Formation[]> = {
  football_11: [
    { code: '4-4-2',   label: '4-4-2 clásico', description: 'Equilibrio defensa/ataque', slots: { arquero: 1, defensor: 4, mediocampista: 4, delantero: 2 } },
    { code: '4-3-3',   label: '4-3-3 ofensivo', description: 'Más presencia adelante', slots: { arquero: 1, defensor: 4, mediocampista: 3, delantero: 3 } },
    { code: '3-5-2',   label: '3-5-2 con carrileros', description: 'Domina el medio', slots: { arquero: 1, defensor: 3, mediocampista: 5, delantero: 2 } },
    { code: '4-5-1',   label: '4-5-1 defensivo', description: 'Control y orden', slots: { arquero: 1, defensor: 4, mediocampista: 5, delantero: 1 } },
    { code: '5-3-2',   label: '5-3-2 ultra defensivo', description: 'Bloque bajo', slots: { arquero: 1, defensor: 5, mediocampista: 3, delantero: 2 } },
    { code: '4-2-3-1', label: '4-2-3-1 moderno', description: 'Doble pivote + enganche', slots: { arquero: 1, defensor: 4, mediocampista: 5, delantero: 1 } },
  ],
  baby_5: [
    { code: '1-1-2', label: '1-1-2 ofensivo', slots: { arquero: 1, defensor: 1, mediocampista: 1, delantero: 2 } },
    { code: '2-1-1', label: '2-1-1 defensivo', slots: { arquero: 1, defensor: 2, mediocampista: 1, delantero: 1 } },
    { code: '1-2-1', label: '1-2-1 medio', slots: { arquero: 1, defensor: 1, mediocampista: 2, delantero: 1 } },
  ],
  baby_6: [
    { code: '2-2-1', label: '2-2-1 clásico', slots: { arquero: 1, defensor: 2, mediocampista: 2, delantero: 1 } },
    { code: '2-1-2', label: '2-1-2 ofensivo', slots: { arquero: 1, defensor: 2, mediocampista: 1, delantero: 2 } },
    { code: '1-3-1', label: '1-3-1 con líbero', slots: { arquero: 1, defensor: 1, mediocampista: 3, delantero: 1 } },
  ],
  futsal: [
    { code: '1-2-1',   label: 'Diamante 1-2-1', slots: { arquero: 1, fijo: 1, ala: 2, pivot: 1 } },
    { code: '2-2',     label: 'Cuadrado 2-2',    slots: { arquero: 1, fijo: 1, ala: 2, pivot: 0 } },
    { code: '3-1',     label: '3-1 con pivote',  slots: { arquero: 1, fijo: 1, ala: 1, pivot: 1 } },
  ],
  hockey_field: [
    { code: '4-3-3',  label: '4-3-3 ofensivo', slots: { arquera: 1, defensora: 4, volante: 3, delantera: 3 } },
    { code: '4-4-2',  label: '4-4-2',           slots: { arquera: 1, defensora: 4, volante: 4, delantera: 2 } },
    { code: '5-3-2',  label: '5-3-2 defensivo', slots: { arquera: 1, defensora: 5, volante: 3, delantera: 2 } },
  ],
  volleyball: [
    { code: '5-1', label: '5-1 (1 armador)',   description: 'Sistema más usado profesional', slots: { zona_1: 1, zona_2: 1, zona_3: 1, zona_4: 1, zona_5: 1, zona_6: 1 } },
    { code: '6-2', label: '6-2 (2 armadores)', description: 'Más opciones de ataque',         slots: { zona_1: 1, zona_2: 1, zona_3: 1, zona_4: 1, zona_5: 1, zona_6: 1 } },
    { code: '4-2', label: '4-2 (formativas)',  description: 'Sistema simple para iniciación', slots: { zona_1: 1, zona_2: 1, zona_3: 1, zona_4: 1, zona_5: 1, zona_6: 1 } },
  ],
  basketball: [
    { code: 'standard',    label: 'Estándar',           description: '1 base, 1 escolta, 1 alero, 1 ala-pívot, 1 pívot', slots: { base: 1, escolta: 1, alero: 1, ala_pivot: 1, pivot: 1 } },
    { code: 'small_ball',  label: 'Small ball',         description: 'Sin pívot — quinteto rápido',                       slots: { base: 1, escolta: 1, alero: 2, ala_pivot: 1, pivot: 0 } },
    { code: 'two_bigs',    label: '2 bigs',             description: 'Dos altos en la pintura',                            slots: { base: 1, escolta: 1, alero: 1, ala_pivot: 1, pivot: 1 } },
  ],
  rugby_7: [
    { code: '3-1-3', label: 'Estándar 7s', slots: { forward: 3, medio: 1, back: 3 } },
  ],
  rugby_15: [
    { code: 'estandar', label: 'Estándar 15', slots: { pilar: 3, segunda_linea: 2, tercera_linea: 3, medio_apertura: 2, centro: 2, wing_fullback: 3 } },
  ],
  handball_7: [
    { code: '3-3', label: '3-3 ataque', slots: { arquero: 1, central: 1, lateral: 2, extremo: 2, pivote: 1 } },
    { code: '5-1', label: '5-1 defensa', slots: { arquero: 1, central: 1, lateral: 2, extremo: 2, pivote: 1 } },
  ],
}

export function getDefaultFormation(code: SportCode): Formation {
  return FORMATIONS[code][0]
}

