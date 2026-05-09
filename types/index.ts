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
  plan: 'free' | 'club' | 'pro' | 'enterprise'
  default_sport_code?: string  // SportCode, default 'football_11'
  total_socios?: number
  created_at: string
}

export type Shift = 'morning' | 'afternoon'

// Tira ahora es string flexible — el tipado real lo da SPORT_TIRAS en lib/tiras.ts
export type Tira = string

// MANTENER por compatibilidad legacy con Banfield/Boca (fútbol AFA):
export const TIRA_LABELS: Record<string, string> = {
  metro: 'Metro',
  liga1: 'Liga 1',
  liga2: 'Liga 2',
  edefi: 'Edefi',
}

export const TIRA_COLORS: Record<string, string> = {
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
  sport_format_code?: string  // ej: 'football_11', 'baby_5', 'baby_6', 'futsal'
  club_id?: string  // si está presente, esta categoría pertenece a un club específico
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
  // Contactos adicionales (otro padre/madre, abuelo/a, etc.) — se acumulan a lo largo del tiempo
  alt_contacts?: { name: string; whatsapp: string; relation?: string }[]
  primary_position: Position
  secondary_positions: Position[]
  apto_medico_ok: boolean
  apto_medico_file_url: string | null
  apto_medico_expires_at: string | null
  is_active: boolean
  convocation_count: number
  created_at: string
  category?: Category
  club_id?: string  // si no está, se asume Banfield Ramos Mejía (legacy)
}

export interface Profe {
  id: string
  full_name: string
  // Identidad
  dni?: string | null
  birth_date?: string | null
  photo_url?: string | null
  // Contacto
  email?: string | null
  whatsapp: string | null
  phone_alt?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  // Profesional
  start_date?: string | null  // antigüedad en el club
  title_certifications?: string | null  // ej: "Profesor de Educación Física"
  matricula?: string | null
  // COMPLIANCE — protección de menores (Argentina)
  antecedentes_penales_url?: string | null
  antecedentes_penales_expires_at?: string | null
  antecedentes_sexuales_url?: string | null  // certificado delitos sexuales
  antecedentes_sexuales_expires_at?: string | null
  apto_psicofisico_url?: string | null
  apto_psicofisico_expires_at?: string | null
  safeguarding_course_completed?: boolean
  safeguarding_course_date?: string | null
  // Económico
  payment_method?: 'recibo' | 'factura' | 'sueldo' | 'ad_honorem' | null
  cbu_alias?: string | null
  hourly_rate?: number | null
  monthly_salary?: number | null
  // Operativo
  is_active: boolean
  notes?: string | null
}

export type ProfeComplianceStatus = 'ok' | 'expiring_soon' | 'expired' | 'missing'

export interface ProfeAttendanceRecord {
  id: string
  profe_id: string
  date: string
  slot_id?: string  // referencia al cronograma
  status: 'present' | 'absent' | 'late' | 'replaced'
  replaced_by_id?: string | null
  notes?: string | null
  registered_by?: string | null
  registered_at: string
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

export interface SiblingDiscountConfig {
  second_child_pct: number  // ej: 50 → 2do hermano paga 50%
  third_or_more_pct: number  // ej: 75 → 3ro+ pagan 75% off
  updated_at: string
  updated_by: string | null
}

export interface AvailabilityRSVP {
  player_id: string
  event_id: string
  status: 'going' | 'maybe' | 'not_going' | 'no_response'
  notes?: string
  responded_by?: string  // tutor o jugador
  responded_at?: string
}

export interface ImageConsent {
  player_id: string
  for_team_photos: boolean         // fotos grupales del plantel
  for_match_videos: boolean        // grabaciones de partidos
  for_social_media: boolean        // redes del club
  for_training_clips: boolean      // videos de entrenamientos
  signed_by_tutor_dni?: string
  signed_at?: string
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
  club_id?: string  // si no está, se asume Banfield (legacy)
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
  min_practice_percentage: number
  min_match_percentage: number
  updated_at: string
  updated_by: string | null
}

export interface EligibilityChangeLog {
  id: string
  type: 'practice_threshold' | 'match_threshold' | 'convocation_override'
  scope: 'club' | 'convocation'
  convocation_id?: string
  category_name?: string
  old_value: number
  new_value: number
  changed_by: string  // nombre profe/admin
  changed_at: string
  reason?: string
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

// ===== Self-onboarding de tutores (Sprint 1) =====

export type TutorRelation = 'padre' | 'madre' | 'tutor' | 'abuelo' | 'otro'

export interface TutorUser {
  id: string                    // UUID universal cross-club
  email: string | null
  dni: string                   // único globalmente
  full_name: string
  whatsapp: string
  created_at: string
}

export interface TutorPlayerLink {
  tutor_user_id: string
  player_id: string
  relation: TutorRelation
  is_primary: boolean
  approved_at: string
}

export interface RegistrationCode {
  id: string
  club_id: string
  category_id: string
  code: string
  expires_at: string | null
  max_uses: number | null
  current_uses: number
  is_active: boolean
  created_at: string
  created_by: string | null
}

export type PendingRegistrationStatus = 'pending' | 'approved' | 'rejected' | 'merged'
export type DuplicateReason = 'dni_match' | 'name_match' | null

export interface PendingRegistration {
  id: string
  code_used: string
  club_id: string
  category_id: string
  // Datos del chico
  full_name: string
  dni: string
  birth_date: string
  primary_position: Position
  photo_url: string | null
  apto_medico_url: string | null
  // Datos del tutor
  tutor_full_name: string
  tutor_dni: string
  tutor_whatsapp: string
  tutor_email: string | null
  tutor_relation: TutorRelation
  // Gestión
  status: PendingRegistrationStatus
  duplicate_of_player_id: string | null
  duplicate_reason: DuplicateReason
  reviewed_by: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
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
