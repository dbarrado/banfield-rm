// Persistencia real (Supabase) de los módulos operativos restantes, para clubes reales.
// Cada función es no-op (ok:false) si el club no es real. Patrón: el handler de la
// página llama estas funciones dentro de `if (isRealClub(club.id))`.
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'

type Res = { ok: boolean; error?: string; id?: string }

function sbFor(demoClubId: string) {
  const sb = realClubId(demoClubId)
  return sb ? { sb, supabase: createClient() } : null
}

// ── Lectura: cronograma / profes reales ─────────────────────────────────
export async function loadTrainingSlots(demoClubId: string): Promise<any[] | null> {
  const ctx = sbFor(demoClubId); if (!ctx) return null
  const { data, error } = await ctx.supabase
    .from('training_slots')
    .select('id,day_of_week,start_time,end_time,court,category_ids,tiras,profe_titular_id,profe_suplentes_ids,is_active')
    .eq('club_id', ctx.sb)
  if (error) { console.error('[ops] loadTrainingSlots', error.message); return [] }
  return (data ?? []).map((s) => ({
    id: s.id,
    day_of_week: s.day_of_week,
    start_time: (s.start_time ?? '').slice(0, 5),
    end_time: (s.end_time ?? '').slice(0, 5),
    court: s.court ?? 1,
    category_ids: s.category_ids ?? [],
    tiras: s.tiras ?? [],
    profe_titular_id: s.profe_titular_id ?? null,
    profe_suplentes_ids: s.profe_suplentes_ids ?? [],
    is_active: s.is_active,
  }))
}

export async function loadProfes(demoClubId: string): Promise<any[] | null> {
  const ctx = sbFor(demoClubId); if (!ctx) return null
  const { data, error } = await ctx.supabase
    .from('profes')
    .select('id,full_name,email,whatsapp,is_active')
    .eq('club_id', ctx.sb)
    .order('full_name')
  if (error) { console.error('[ops] loadProfes', error.message); return [] }
  return data ?? []
}

// ── Convocatoria ────────────────────────────────────────────────────────
export async function persistConvocation(
  demoClubId: string,
  args: { eventId: string; playerIds: string[]; whatsappMessage?: string }
): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data: conv, error: e1 } = await ctx.supabase
      .from('convocations')
      .insert({ event_id: args.eventId, is_reused: false, whatsapp_message: args.whatsappMessage ?? null })
      .select('id').single()
    if (e1) throw e1
    if (args.playerIds.length) {
      const rows = args.playerIds.map(pid => ({ convocation_id: conv.id, player_id: pid }))
      const { error: e2 } = await ctx.supabase.from('convocation_players').insert(rows)
      if (e2) throw e2
    }
    return { ok: true, id: conv.id }
  } catch (e: any) { console.error('[ops] convocation', e?.message); return { ok: false, error: e?.message } }
}

// ── Puntajes de partido ─────────────────────────────────────────────────
export async function persistMatchRatings(
  demoClubId: string,
  args: { eventId: string; ratings: { playerId: string; score: number; comment?: string; profeId?: string | null }[] }
): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const rows = args.ratings.map(r => ({
      event_id: args.eventId, player_id: r.playerId, score: r.score,
      comment: r.comment ?? null, rated_by_profe_id: r.profeId ?? null,
    }))
    // upsert por (event_id, player_id)
    const { error } = await ctx.supabase.from('match_ratings').upsert(rows, { onConflict: 'event_id,player_id' })
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] ratings', e?.message); return { ok: false, error: e?.message } }
}

// ── Observación / tarjeta ───────────────────────────────────────────────
export async function persistObservation(
  demoClubId: string,
  args: { eventId: string; playerId: string; type: 'highlight' | 'warning' | 'sanction'; notes?: string; sanctionCauseId?: string | null }
): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { error } = await ctx.supabase.from('observations').insert({
      event_id: args.eventId, player_id: args.playerId, observation_type: args.type,
      notes: args.notes ?? null, sanction_cause_id: args.sanctionCauseId ?? null,
    })
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] observation', e?.message); return { ok: false, error: e?.message } }
}

// ── Asistencia de profes ────────────────────────────────────────────────
export async function persistProfeAttendance(
  demoClubId: string,
  args: { date: string; records: { profeId: string; status: 'present' | 'absent' | 'late' | 'replaced'; replacedById?: string | null; slotId?: string | null }[] }
): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const rows = args.records.map(r => ({
      club_id: ctx.sb, profe_id: r.profeId, date: args.date, status: r.status,
      replaced_by_id: r.replacedById ?? null, slot_id: r.slotId ?? null,
    }))
    const { error } = await ctx.supabase.from('profe_attendance_records').insert(rows)
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] profe-att', e?.message); return { ok: false, error: e?.message } }
}

// ── Profes (alta) ───────────────────────────────────────────────────────
export async function createProfe(demoClubId: string, p: Record<string, unknown>): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('profes').insert({ club_id: ctx.sb, ...p }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] profe', e?.message); return { ok: false, error: e?.message } }
}

// ── Cronograma (training slot) ──────────────────────────────────────────
export async function createTrainingSlot(demoClubId: string, slot: Record<string, unknown>): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('training_slots').insert({ club_id: ctx.sb, ...slot }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] slot', e?.message); return { ok: false, error: e?.message } }
}

// ── Config: cuota, cobranza, elegibilidad ───────────────────────────────
export async function saveFeeConfig(demoClubId: string, feeType: string, amount: number): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { error } = await ctx.supabase.from('fee_configs')
      .upsert({ club_id: ctx.sb, fee_type: feeType, amount, updated_at: new Date().toISOString() }, { onConflict: 'club_id,fee_type' })
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] fee', e?.message); return { ok: false, error: e?.message } }
}

export async function saveBillingConfigDb(demoClubId: string, cfg: { overdue_day: number; late_fee_pct: number; due_day: number; mp_surcharge_pct: number; transfer_surcharge_pct: number }): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { error } = await ctx.supabase.from('billing_configs').upsert({ club_id: ctx.sb, ...cfg }, { onConflict: 'club_id' })
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] billcfg', e?.message); return { ok: false, error: e?.message } }
}

export async function saveEligibilityConfig(demoClubId: string, practicePct: number, matchPct: number): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { error } = await ctx.supabase.from('eligibility_configs')
      .upsert({ club_id: ctx.sb, min_practice_percentage: practicePct, min_match_percentage: matchPct, updated_at: new Date().toISOString() }, { onConflict: 'club_id' })
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] elig', e?.message); return { ok: false, error: e?.message } }
}

// ── Códigos de inscripción ──────────────────────────────────────────────
export async function createRegistrationCode(demoClubId: string, args: { categoryId: string; code: string; expiresAt?: string | null; maxUses?: number | null }): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('registration_codes').insert({
      club_id: ctx.sb, category_id: args.categoryId, code: args.code,
      expires_at: args.expiresAt ?? null, max_uses: args.maxUses ?? null,
    }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] regcode', e?.message); return { ok: false, error: e?.message } }
}

// ── Caja: sesión + movimientos ──────────────────────────────────────────
export async function openCashSession(demoClubId: string, date: string, openingAmount: number): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('cash_sessions')
      .insert({ club_id: ctx.sb, date, opening_amount: openingAmount }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] cashopen', e?.message); return { ok: false, error: e?.message } }
}

export async function addCashMovement(demoClubId: string, sessionId: string, m: { type: 'income' | 'expense'; amount: number; description?: string; paymentMethod?: string | null }): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('cash_movements').insert({
      session_id: sessionId, movement_type: m.type, amount: m.amount,
      description: m.description ?? null, payment_method: m.paymentMethod ?? null,
    }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] cashmov', e?.message); return { ok: false, error: e?.message } }
}

export async function closeCashSession(demoClubId: string, sessionId: string, closingAmount: number): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { error } = await ctx.supabase.from('cash_sessions').update({ closing_amount: closingAmount }).eq('id', sessionId)
    if (error) throw error
    return { ok: true }
  } catch (e: any) { console.error('[ops] cashclose', e?.message); return { ok: false, error: e?.message } }
}

// ── Tienda ──────────────────────────────────────────────────────────────
export async function createProduct(demoClubId: string, p: Record<string, unknown>): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('products').insert({ club_id: ctx.sb, ...p }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] product', e?.message); return { ok: false, error: e?.message } }
}

export async function createOrder(demoClubId: string, o: Record<string, unknown>): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('orders').insert({ club_id: ctx.sb, ...o }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] order', e?.message); return { ok: false, error: e?.message } }
}

// ── Referidos ───────────────────────────────────────────────────────────
export async function createReferral(demoClubId: string, referredClubName: string): Promise<Res> {
  const ctx = sbFor(demoClubId); if (!ctx) return { ok: false, error: 'club no real' }
  try {
    const { data, error } = await ctx.supabase.from('referrals')
      .insert({ referrer_club_id: ctx.sb, referred_club_name: referredClubName }).select('id').single()
    if (error) throw error
    return { ok: true, id: data.id }
  } catch (e: any) { console.error('[ops] referral', e?.message); return { ok: false, error: e?.message } }
}
