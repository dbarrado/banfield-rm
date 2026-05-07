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
