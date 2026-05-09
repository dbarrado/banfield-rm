// Feature gating por plan.
// Las opciones aparecen igual en toda la UI; al usuario que no tiene el plan se le muestra
// el upgrade prompt en vez del feature real.

export type Plan = 'free' | 'club' | 'pro' | 'enterprise'

export const PLAN_LABEL: Record<Plan, string> = {
  free: 'Asistencia',
  club: 'Club',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

export const PLAN_COLOR: Record<Plan, string> = {
  free: '#6b7280',
  club: '#00843D',
  pro: '#7c3aed',
  enterprise: '#1e40af',
}

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  club: 1,
  pro: 2,
  enterprise: 3,
}

// Cada path requiere un plan mínimo
export const PATH_REQUIRES: Record<string, Plan> = {
  // Asistencia (free)
  '/dashboard': 'free',
  '/socios': 'free',
  '/asistencia': 'free',
  '/convocatoria': 'free',
  '/fixture': 'free',
  '/partidos': 'free',
  '/deportes': 'free',
  '/invitar': 'free',

  // Club (USD 40+)
  '/caja': 'club',
  '/caja/cobrar': 'club',
  '/cobranzas': 'club',
  '/finanzas': 'club',
  '/padres': 'club',           // portal de tutores

  // Pro (USD 60+)
  '/reportes': 'pro',
  '/reportes/mensual': 'pro',
  '/reportes/estado-resultados': 'pro',
  '/asistencia-profes': 'pro',
  '/carnet': 'pro',            // carnet QR
  '/config/cronograma': 'pro', // multi-cancha completo
  '/tienda': 'pro',            // (add-on aparte pero requiere pro)
  // /config/profes queda accesible para todos los planes (sin compliance, solo gestión básica)

  // Config básica disponible para todos
  '/config': 'free',
}

export function getRequiredPlan(path: string): Plan {
  // Match exacto primero, luego prefijos más largos
  if (PATH_REQUIRES[path]) return PATH_REQUIRES[path]
  // Buscar el prefijo más específico
  const candidates = Object.entries(PATH_REQUIRES)
    .filter(([p]) => path.startsWith(p))
    .sort((a, b) => b[0].length - a[0].length)
  return candidates[0]?.[1] ?? 'free'
}

export function hasAccess(currentPlan: Plan, requiredPlan: Plan): boolean {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]
}

export function isLocked(currentPlan: Plan, path: string): boolean {
  return !hasAccess(currentPlan, getRequiredPlan(path))
}

// Texto del CTA de upgrade ("Actualizá a Club para...")
export function upgradeMessage(currentPlan: Plan, requiredPlan: Plan): string {
  return `Actualizá a Plan ${PLAN_LABEL[requiredPlan]} para más funcionalidades`
}
