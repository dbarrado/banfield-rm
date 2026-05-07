import type { Club } from '@/types'

// Lista de clubes demo. En producción vendría de Supabase tabla `clubs`.
export const demoClubs: (Club & { referral_code: string; first_payment_at: string; successful_referrals: number; has_shop_addon?: boolean })[] = [
  {
    id: 'club-banfield-rm',
    name: 'Filial Banfield Ramos Mejía',
    slug: 'banfield-rm',
    short_name: 'Banfield RM',
    logo_url: '/escudo-banfield.png',
    primary_color: '#00843D',
    secondary_color: '#C9A84C',
    city: 'Ramos Mejía',
    is_active: true,
    plan: 'club',
    default_sport_code: 'football_11',
    total_socios: 450,
    created_at: '2025-03-01',
    referral_code: 'BANFIELD-RM-A3X',
    first_payment_at: '2026-03-15', // ~50 días atrás → ya activo
    successful_referrals: 2,
  },
  {
    id: 'club-brisas',
    name: 'Club Brisas de Haedo',
    slug: 'brisas',
    short_name: 'Brisas',
    logo_url: null,
    primary_color: '#7c3aed',
    secondary_color: '#fbbf24',
    city: 'Haedo',
    is_active: true,
    plan: 'pro',
    default_sport_code: 'baby_5',
    total_socios: 875,
    created_at: '2025-01-15',
    referral_code: 'BRISAS-HD-K7M',
    first_payment_at: '2025-02-01', // muy antiguo
    successful_referrals: 5,
    has_shop_addon: true, // Brisas tiene tienda activa (es Pro + addon)
  },
  {
    id: 'club-boca-rm',
    name: 'Filial Boca Ramos Mejía',
    slug: 'boca-rm',
    short_name: 'Boca RM',
    logo_url: null,
    primary_color: '#0a4ca8',
    secondary_color: '#fbbf24',
    city: 'Ramos Mejía',
    is_active: true,
    plan: 'club',
    default_sport_code: 'football_11',
    total_socios: 312,
    created_at: '2026-02-10',
    referral_code: 'BOCA-RM-Q2P',
    first_payment_at: '2026-04-25', // ~12 días atrás → todavía no activo, falta llegar a 15d
    successful_referrals: 0,
  },
]

const CURRENT_CLUB_KEY = 'banfieldrm_current_club_id'

export function getCurrentClub(): Club {
  if (typeof window === 'undefined') return demoClubs[0]
  const id = localStorage.getItem(CURRENT_CLUB_KEY)
  return demoClubs.find(c => c.id === id) ?? demoClubs[0]
}

export function setCurrentClub(clubId: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CURRENT_CLUB_KEY, clubId)
  // Recargar para que se apliquen los datos del nuevo club
  window.location.reload()
}
