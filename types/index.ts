export type UserRole = 'admin' | 'profe' | 'tesorero'

export type Shift = 'morning' | 'afternoon'

export type FeeType = 'actividad' | 'social' | 'matricula'

export type PaymentMethod = 'cash' | 'transfer'

export type EventType = 'practice' | 'match'

export type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified'

export type ObservationType = 'highlight' | 'warning' | 'sanction'

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
  birth_date: string
  category_id: string
  shift: Shift
  photo_url: string | null
  tutor_name: string | null
  tutor_whatsapp: string | null
  is_active: boolean
  convocation_count: number
  created_at: string
  category?: Category
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
