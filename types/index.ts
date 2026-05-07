export type UserRole = 'super_admin' | 'admin' | 'profe' | 'tesorero'

export interface Club {
  id: string
  name: string
  slug: string
  short_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  city: string
  is_active: boolean
  plan: 'free' | 'pro' | 'enterprise'
  total_socios?: number
  created_at: string
}

export type Shift = 'morning' | 'afternoon'

export type Tira = 'metro' | 'liga1' | 'liga2' | 'edefi'

export const TIRA_LABELS: Record<Tira, string> = {
  metro: 'Metro',
  liga1: 'Liga 1',
  liga2: 'Liga 2',
  edefi: 'Edefi',
}

export const TIRA_COLORS: Record<Tira, string> = {
  metro: '#1d4ed8',
  liga1: '#00843D',
  liga2: '#C9A84C',
  edefi: '#7c3aed',
}

export type FeeType = 'actividad' | 'social' | 'matricula'

export type PaymentMethod = 'cash' | 'transfer'

export type EventType = 'practice' | 'match'

export type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified'

export type ObservationType = 'highlight' | 'warning' | 'sanction'

export type Position = 'arquero' | 'defensor' | 'mediocampista' | 'delantero'

export const POSITION_LABELS: Record<Position, string> = {
  arquero: 'Arquero',
  defensor: 'Defensor',
  mediocampista: 'Mediocampista',
  delantero: 'Delantero',
}

export const POSITION_COLORS: Record<Position, string> = {
  arquero: '#F59E0B',
  defensor: '#1d4ed8',
  mediocampista: '#00843D',
  delantero: '#DC2626',
}

export type MovementType = 'income' | 'expense'

export type FinanceCategoryMovementType = 'income' | 'expense' | 'both'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  birth_year: number
  is_active: boolean
  created_at: string
}

export interface Player {
  id: string
  full_name: string
  dni: string | null
  birth_date: string
  category_id: string
  tira: Tira
  shift: Shift
  photo_url: string | null
  tutor_name: string | null
  tutor_dni: string | null
  tutor_email: string | null
  tutor_whatsapp: string | null
  primary_position: Position
  secondary_positions: Position[]
  apto_medico_ok: boolean
  apto_medico_file_url: string | null
  apto_medico_expires_at: string | null
  is_active: boolean
  convocation_count: number
  created_at: string
  category?: Category
}

export interface Profe {
  id: string
  full_name: string
  whatsapp: string | null
  is_active: boolean
}

export interface ProfeAssignment {
  profe_id: string
  category_id: string
  tira: Tira
}

export interface FeeConfig {
  id: string
  fee_type: FeeType
  amount: number
  updated_at: string
  updated_by: string | null
}

export interface Payment {
  id: string
  player_id: string
  fee_type: FeeType
  period: string
  amount: number
  paid_at: string
  payment_method: PaymentMethod
  transfer_reference: string | null
  registered_by: string | null
  created_at: string
  player?: Player
}

export interface Event {
  id: string
  category_id: string
  event_type: EventType
  scheduled_at: string
  is_suspended: boolean
  suspension_reason: string | null
  rival: string | null
  venue: string | null
  is_home: boolean | null
  created_by: string | null
  created_at: string
  category?: Category
}

export interface Attendance {
  id: string
  event_id: string
  player_id: string
  status: AttendanceStatus
  justified_reason: string | null
  registered_by: string | null
  created_at: string
  player?: Player
}

export interface SanctionCause {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Observation {
  id: string
  event_id: string
  player_id: string
  observation_type: ObservationType
  sanction_cause_id: string | null
  notes: string | null
  registered_by: string | null
  created_at: string
  player?: Player
  sanction_cause?: SanctionCause
}

export interface Convocation {
  id: string
  event_id: string
  created_by: string | null
  is_reused: boolean
  whatsapp_message: string | null
  created_at: string
  event?: Event
  players?: ConvocationPlayer[]
}

export interface ConvocationPlayer {
  id: string
  convocation_id: string
  player_id: string
  position: string | null
  is_exception: boolean
  created_at: string
  player?: Player
}

export interface EligibilityConfig {
  id: string
  min_attendance_percentage: number
  updated_at: string
  updated_by: string | null
}

export interface CashSession {
  id: string
  date: string
  opening_amount: number
  closing_amount: number | null
  opened_by: string | null
  closed_by: string | null
  created_at: string
}

export interface FinanceCategory {
  id: string
  name: string
  movement_type: FinanceCategoryMovementType
  is_active: boolean
  created_at: string
}

export interface CashMovement {
  id: string
  session_id: string
  movement_type: MovementType
  amount: number
  finance_category_id: string | null
  description: string | null
  payment_method: PaymentMethod
  transfer_reference: string | null
  registered_by: string | null
  created_at: string
  finance_category?: FinanceCategory
}

export interface PlayerAttendanceStats {
  player: Player
  total_practices: number
  attended: number
  justified_absences: number
  suspended_days: number
  percentage: number
  is_eligible: boolean
}
