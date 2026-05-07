// Billings (cuotas emitidas) — modelo simulado para el demo
// En producción esto vive en una tabla `billings` con un cron que corre día 1.
// El "overdue_day" es configurable desde /config (default: 16).

import { demoPlayers, demoPayments, getSiblingDiscount } from './demo-data'
import type { Player, Payment } from '@/types'

export type BillingStatus = 'paid' | 'pending' | 'overdue' | 'overdue_with_fee'

export type Billing = {
  id: string
  player_id: string
  fee_type: 'actividad' | 'matricula' | 'social'
  period: string // YYYY-MM
  amount_original: number
  discount_pct: number
  amount_final: number
  due_date: string // YYYY-MM-DD (día 10 del mes por convención)
  status: BillingStatus
  late_fee_amount: number
  paid_at: string | null
  payment_method: 'cash' | 'transfer' | 'mercadopago' | null
}

// Config (en prod vendría de tabla club_settings)
export const DEFAULT_OVERDUE_DAY = 16
export const DEFAULT_LATE_FEE_PCT = 10
export const DEFAULT_DUE_DAY = 10
export const DEFAULT_MP_SURCHARGE_PCT = 10
const CONFIG_KEY = 'plantel_billing_config'

export type BillingConfig = {
  overdue_day: number
  late_fee_pct: number
  due_day: number
  mp_surcharge_pct: number
}

export function loadBillingConfig(): BillingConfig {
  const defaults = {
    overdue_day: DEFAULT_OVERDUE_DAY,
    late_fee_pct: DEFAULT_LATE_FEE_PCT,
    due_day: DEFAULT_DUE_DAY,
    mp_surcharge_pct: DEFAULT_MP_SURCHARGE_PCT,
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        overdue_day: parsed.overdue_day ?? defaults.overdue_day,
        late_fee_pct: parsed.late_fee_pct ?? defaults.late_fee_pct,
        due_day: parsed.due_day ?? defaults.due_day,
        mp_surcharge_pct: parsed.mp_surcharge_pct ?? defaults.mp_surcharge_pct,
      }
    }
  } catch {}
  return defaults
}

export function saveBillingConfig(cfg: BillingConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

// Genera billings del mes actual a partir de los jugadores activos
// Combina con demoPayments para marcar pagados
export function generateBillingsForPeriod(period: string, today: Date, cfg: BillingConfig): Billing[] {
  const [year, month] = period.split('-').map(Number)
  const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(cfg.due_day).padStart(2, '0')}`
  const billings: Billing[] = []

  // ¿Estamos pasados del overdue_day para ese período?
  const isPastOverdue =
    today.getFullYear() > year ||
    (today.getFullYear() === year && today.getMonth() + 1 > month) ||
    (today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() >= cfg.overdue_day)

  for (const player of demoPlayers) {
    if (!player.is_active) continue
    const { discount_pct: discountPct } = getSiblingDiscount(player.id)
    const amountOriginal = 62000
    const amountFinal = Math.round(amountOriginal * (1 - discountPct / 100))

    // ¿Ya pagó esta cuota?
    const payment = demoPayments.find(
      (p: Payment) => p.player_id === player.id && p.fee_type === 'actividad' && p.period === period
    )

    let status: BillingStatus
    let lateFee = 0
    if (payment) {
      status = 'paid'
    } else if (isPastOverdue) {
      status = 'overdue_with_fee'
      lateFee = Math.round(amountFinal * (cfg.late_fee_pct / 100))
    } else {
      status = 'pending'
    }

    billings.push({
      id: `bill-${period}-${player.id}`,
      player_id: player.id,
      fee_type: 'actividad',
      period,
      amount_original: amountOriginal,
      discount_pct: discountPct,
      amount_final: amountFinal,
      due_date: dueDate,
      status,
      late_fee_amount: lateFee,
      paid_at: payment?.paid_at ?? null,
      payment_method: payment?.payment_method ?? null,
    })
  }

  return billings
}

export const STATUS_CONFIG: Record<BillingStatus, { label: string; color: string; bg: string }> = {
  paid:              { label: 'Pagado',         color: '#16a34a', bg: '#dcfce7' },
  pending:           { label: 'Pendiente',      color: '#f59e0b', bg: '#fef3c7' },
  overdue:           { label: 'Vencido',        color: '#dc2626', bg: '#fee2e2' },
  overdue_with_fee:  { label: 'Vencido c/recargo', color: '#991b1b', bg: '#fecaca' },
}
