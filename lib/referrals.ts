import { demoClubs } from './clubs'

export type ReferralStatus = 'registered' | 'in_trial' | 'successful' | 'cancelled'

export type Referral = {
  id: string
  referrer_club_id: string
  referred_club_name: string
  referred_at: string
  status: ReferralStatus
  reward_applied_at: string | null
  referred_plan?: 'club' | 'pro' | 'pro_plus_shop'  // qué contrató el referido
}

// Mock de referidos por club referente (demo data)
export const demoReferrals: Referral[] = [
  // Banfield ya tiene 2 exitosos + 1 en trial
  { id: 'ref-1', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Club Atlético Vélez RM', referred_at: '2026-04-02', status: 'successful', reward_applied_at: '2026-04-15', referred_plan: 'club' },
  { id: 'ref-2', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Filial San Lorenzo Morón', referred_at: '2026-04-20', status: 'successful', reward_applied_at: '2026-05-01', referred_plan: 'pro_plus_shop' },
  { id: 'ref-3', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Club Defensores de Castelar', referred_at: '2026-05-04', status: 'in_trial', reward_applied_at: null },

  // Brisas tiene 5 exitosos
  { id: 'ref-4', referrer_club_id: 'club-brisas', referred_club_name: 'Club Liniers FC', referred_at: '2025-08-01', status: 'successful', reward_applied_at: '2025-08-15', referred_plan: 'club' },
  { id: 'ref-5', referrer_club_id: 'club-brisas', referred_club_name: 'Atlético Ituzaingó', referred_at: '2025-09-12', status: 'successful', reward_applied_at: '2025-09-25', referred_plan: 'pro' },
  { id: 'ref-6', referrer_club_id: 'club-brisas', referred_club_name: 'Club Castelar Norte', referred_at: '2025-11-03', status: 'successful', reward_applied_at: '2025-11-18', referred_plan: 'pro_plus_shop' },
  { id: 'ref-7', referrer_club_id: 'club-brisas', referred_club_name: 'Defensores Ramos Mejía', referred_at: '2026-01-20', status: 'successful', reward_applied_at: '2026-02-05', referred_plan: 'club' },
  { id: 'ref-8', referrer_club_id: 'club-brisas', referred_club_name: 'San Miguel FC', referred_at: '2026-03-12', status: 'successful', reward_applied_at: '2026-03-28', referred_plan: 'pro_plus_shop' },
]

export function getReferredPlanLabel(plan?: 'club' | 'pro' | 'pro_plus_shop'): string {
  if (plan === 'club') return 'Plan Club'
  if (plan === 'pro') return 'Plan Pro'
  if (plan === 'pro_plus_shop') return 'Pro + Tienda'
  return '—'
}

export type ReferralStatus2 =
  | { active: false; days_since_first_payment: number; days_to_activation: number }
  | { active: true; days_since_first_payment: number }

export function getReferralActivationStatus(firstPaymentAt: string): ReferralStatus2 {
  const today = new Date('2026-05-07')
  const firstPay = new Date(firstPaymentAt)
  const daysSince = Math.floor((today.getTime() - firstPay.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince >= 15) return { active: true, days_since_first_payment: daysSince }
  return { active: false, days_since_first_payment: daysSince, days_to_activation: 15 - daysSince }
}

export function getReferralsForClub(clubId: string): Referral[] {
  return demoReferrals.filter(r => r.referrer_club_id === clubId)
}

// Niveles del programa de referidos
export type ReferralMilestone = {
  level: 1 | 2 | 3 | 4
  threshold: number
  label: string
  description: string
  bonus_months: number
  bonus_label: string
  unlocks_pro?: boolean
  emoji: string
}

export const REFERRAL_MILESTONES: ReferralMilestone[] = [
  {
    level: 1,
    threshold: 1,
    label: 'Embajador inicial',
    description: '1 mes bonificado por cada referido',
    bonus_months: 0,
    bonus_label: '',
    emoji: '🌱',
  },
  {
    level: 2,
    threshold: 3,
    label: 'Embajador Pro',
    description: 'Upgrade a Plan Pro sin costo (si estás en Club)',
    bonus_months: 0,
    bonus_label: 'Upgrade Pro gratis',
    unlocks_pro: true,
    emoji: '🚀',
  },
  {
    level: 3,
    threshold: 5,
    label: 'Embajador Plata',
    description: '+3 meses gratis extra (8 meses acumulados)',
    bonus_months: 3,
    bonus_label: '+3 meses extra',
    emoji: '🥈',
  },
  {
    level: 4,
    threshold: 10,
    label: 'Embajador Oro',
    description: '+12 meses gratis (1 año completo del plan)',
    bonus_months: 12,
    bonus_label: '+1 año del plan',
    emoji: '🥇',
  },
]

// Calcula meses bonificados totales acumulados según referidos exitosos
export function calculateTotalBonusMonths(successful: number): number {
  let months = successful // 1 por cada referido
  if (successful >= 5) months += 3   // bonus al 5
  if (successful >= 10) months += 12 // bonus al 10
  return months
}

export function getReferralProgress(clubId: string) {
  const refs = getReferralsForClub(clubId)
  const successful = refs.filter(r => r.status === 'successful').length
  const inTrial = refs.filter(r => r.status === 'in_trial').length
  const club = demoClubs.find(c => c.id === clubId)!
  const reachedPro = successful >= 3 && club.plan === 'club'
  const totalBonusMonths = calculateTotalBonusMonths(successful)

  // Próximo hito
  const nextMilestone = REFERRAL_MILESTONES.find(m => m.threshold > successful)
  const currentMilestone = [...REFERRAL_MILESTONES].reverse().find(m => m.threshold <= successful)
  const referralsToNext = nextMilestone ? nextMilestone.threshold - successful : 0
  const progressToNext = nextMilestone
    ? (successful - (currentMilestone?.threshold ?? 0)) / (nextMilestone.threshold - (currentMilestone?.threshold ?? 0))
    : 1

  return {
    successful,
    inTrial,
    total: refs.length,
    progress_to_pro: Math.min(successful / 3, 1),
    needs_for_pro: Math.max(0, 3 - successful),
    reached_pro: reachedPro,
    referrals: refs,
    total_bonus_months: totalBonusMonths,
    next_milestone: nextMilestone,
    current_milestone: currentMilestone,
    referrals_to_next: referralsToNext,
    progress_to_next: progressToNext,
  }
}

export function findClubByReferralCode(code: string) {
  return demoClubs.find(c => c.referral_code === code)
}
