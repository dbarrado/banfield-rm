// Persistencia real (Supabase) del módulo dinero para clubes reales.
// - hydrateBillings: carga las cuotas del período desde Supabase a memoria.
// - getRealBillings: las devuelve para que las páginas las usen (real club).
// - persistPayment / persistBillingUpdate: escriben a Supabase (write-through).
// Para clubes demo, nada de esto aplica (siguen 100% en memoria).

import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'
import type { Billing, BillingStatus, BillingAdjustment } from '@/lib/billings'

// demoClubId → billings reales del período cargado
const realBillings: Record<string, Billing[]> = {}

type Row = {
  id: string
  player_id: string
  fee_type: 'actividad' | 'social' | 'matricula'
  period: string
  amount_original: number
  discount_pct: number
  amount_final: number
  due_date: string
  status: BillingStatus
  late_fee_amount: number
  amount_paid: number
  paid_at: string | null
  payment_method: 'cash' | 'transfer' | 'mercadopago' | null
  adjustments: BillingAdjustment[] | null
}

function rowToBilling(r: Row): Billing {
  return {
    id: r.id,
    player_id: r.player_id,
    fee_type: r.fee_type,
    period: r.period,
    amount_original: Number(r.amount_original),
    discount_pct: Number(r.discount_pct),
    amount_final: Number(r.amount_final),
    due_date: r.due_date,
    status: r.status,
    late_fee_amount: Number(r.late_fee_amount),
    paid_at: r.paid_at,
    payment_method: r.payment_method,
    amount_paid: Number(r.amount_paid),
    adjustments: r.adjustments ?? [],
  }
}

export async function hydrateBillings(demoClubId: string, period: string) {
  const sb = realClubId(demoClubId)
  if (!sb) return
  const supabase = createClient()
  const { data, error } = await supabase
    .from('billings')
    .select('id,player_id,fee_type,period,amount_original,discount_pct,amount_final,due_date,status,late_fee_amount,amount_paid,paid_at,payment_method,adjustments')
    .eq('club_id', sb)
    .eq('period', period)
  if (error) {
    console.error('[billing-store] hydrateBillings:', error.message)
    realBillings[demoClubId] = []
    return
  }
  realBillings[demoClubId] = (data ?? []).map(rowToBilling)
}

export function getRealBillings(demoClubId: string): Billing[] | null {
  return realBillings[demoClubId] ?? null
}

export type ChargeItem = { billingId: string; playerId: string; amount: number; willBeFull: boolean }

// Registra un cobro en Supabase: 1 payment por cuota + actualiza el billing.
// El recargo (transferencia/MP) se registra como un payment extra (fee_type social
// no aplica; lo guardamos como ingreso con period y referencia).
export async function persistPayment(
  demoClubId: string,
  args: {
    items: ChargeItem[]
    method: 'cash' | 'transfer' | 'mercadopago'
    reference: string | null
    period: string
    surchargeAmount: number
    actorName: string
  }
): Promise<{ ok: boolean; error?: string }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  const nowIso = new Date().toISOString()
  const today = nowIso.slice(0, 10)

  try {
    // 1) Insertar payments (uno por cuota cobrada)
    const paymentRows = args.items.map((it) => ({
      club_id: sb,
      player_id: it.playerId,
      billing_id: it.billingId,
      fee_type: 'actividad' as const,
      period: args.period,
      amount: it.amount,
      paid_at: nowIso,
      payment_method: args.method,
      transfer_reference: args.reference,
    }))
    const { error: payErr } = await supabase.from('payments').insert(paymentRows)
    if (payErr) throw payErr

    // 2) Actualizar cada billing (status + amount_paid + paid_at + método)
    for (const it of args.items) {
      const current = (realBillings[demoClubId] ?? []).find((b) => b.id === it.billingId)
      const newPaid = (current?.amount_paid ?? 0) + it.amount
      const { error: upErr } = await supabase
        .from('billings')
        .update({
          amount_paid: newPaid,
          status: it.willBeFull ? 'paid' : 'partial',
          paid_at: it.willBeFull ? today : current?.paid_at ?? null,
          payment_method: args.method,
        })
        .eq('id', it.billingId)
      if (upErr) throw upErr
      // refrescar cache local
      if (current) {
        current.amount_paid = newPaid
        current.status = it.willBeFull ? 'paid' : 'partial'
        current.payment_method = args.method
        if (it.willBeFull) current.paid_at = today
      }
    }
    return { ok: true }
  } catch (e: any) {
    console.error('[billing-store] persistPayment:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}

// Persiste un ajuste/condonación sobre un billing.
export async function persistBillingUpdate(
  demoClubId: string,
  billingId: string,
  patch: { status?: BillingStatus; amount_final?: number; adjustment?: BillingAdjustment }
): Promise<{ ok: boolean; error?: string }> {
  const sb = realClubId(demoClubId)
  if (!sb) return { ok: false, error: 'club no real' }
  const supabase = createClient()
  try {
    const current = (realBillings[demoClubId] ?? []).find((b) => b.id === billingId)
    const update: Record<string, unknown> = {}
    if (patch.status) update.status = patch.status
    if (patch.amount_final !== undefined) update.amount_final = patch.amount_final
    if (patch.adjustment) update.adjustments = [...(current?.adjustments ?? []), patch.adjustment]
    const { error } = await supabase.from('billings').update(update).eq('id', billingId)
    if (error) throw error
    if (current) {
      if (patch.status) current.status = patch.status
      if (patch.amount_final !== undefined) current.amount_final = patch.amount_final
      if (patch.adjustment) current.adjustments = [...(current.adjustments ?? []), patch.adjustment]
    }
    return { ok: true }
  } catch (e: any) {
    console.error('[billing-store] persistBillingUpdate:', e?.message ?? e)
    return { ok: false, error: e?.message ?? 'error' }
  }
}
