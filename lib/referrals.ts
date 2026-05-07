import { demoClubs } from './clubs'

export type ReferralStatus = 'registered' | 'in_trial' | 'successful' | 'cancelled'

export type Referral = {
  id: string
  referrer_club_id: string
  referred_club_name: string
  referred_at: string
  status: ReferralStatus
  reward_applied_at: string | null
}

// Mock de referidos por club referente (demo data)
export const demoReferrals: Referral[] = [
  // Banfield ya tiene 2 exitosos + 1 en trial
  { id: 'ref-1', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Club Atlético Vélez RM', referred_at: '2026-04-02', status: 'successful', reward_applied_at: '2026-04-15' },
  { id: 'ref-2', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Filial San Lorenzo Morón', referred_at: '2026-04-20', status: 'successful', reward_applied_at: '2026-05-01' },
  { id: 'ref-3', referrer_club_id: 'club-banfield-rm', referred_club_name: 'Club Defensores de Castelar', referred_at: '2026-05-04', status: 'in_trial', reward_applied_at: null },

  // Brisas tiene 5 exitosos (ya está en Pro gratis)
  { id: 'ref-4', referrer_club_id: 'club-brisas', referred_club_name: 'Club Liniers FC', referred_at: '2025-08-01', status: 'successful', reward_applied_at: '2025-08-15' },
  { id: 'ref-5', referrer_club_id: 'club-brisas', referred_club_name: 'Atlético Ituzaingó', referred_at: '2025-09-12', status: 'successful', reward_applied_at: '2025-09-25' },
  { id: 'ref-6', referrer_club_id: 'club-brisas', referred_club_name: 'Club Castelar Norte', referred_at: '2025-11-03', status: 'successful', reward_applied_at: '2025-11-18' },
  { id: 'ref-7', referrer_club_id: 'club-brisas', referred_club_name: 'Defensores Ramos Mejía', referred_at: '2026-01-20', status: 'successful', reward_applied_at: '2026-02-05' },
  { id: 'ref-8', referrer_club_id: 'club-brisas', referred_club_name: 'San Miguel FC', referred_at: '2026-03-12', status: 'successful', reward_applied_at: '2026-03-28' },
]

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

export function getReferralProgress(clubId: string) {
  const refs = getReferralsForClub(clubId)
  const successful = refs.filter(r => r.status === 'successful').length
  const inTrial = refs.filter(r => r.status === 'in_trial').length
  const club = demoClubs.find(c => c.id === clubId)!
  const reachedPro = successful >= 3 && club.plan === 'club'
  return {
    successful,
    inTrial,
    total: refs.length,
    progress_to_pro: Math.min(successful / 3, 1),
    needs_for_pro: Math.max(0, 3 - successful),
    reached_pro: reachedPro,
    referrals: refs,
  }
}

export function findClubByReferralCode(code: string) {
  return demoClubs.find(c => c.referral_code === code)
}
