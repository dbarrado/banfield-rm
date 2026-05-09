'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, AlertTriangle, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import {
  demoPayments,
  demoGuestParticipations,
  getPlayerDebts,
  thisMonth,
  getPlayersForClub,
  getCategoriesForClub,
  getEventsForClub,
} from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'
import { getTiraLabel, getTiraColor } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'
import { useCurrentClub } from '@/lib/use-current-club'
import { useActiveRole } from '@/lib/use-role'
import { demoClubs } from '@/lib/clubs'
import { getReferralActivationStatus, getReferralProgress } from '@/lib/referrals'
import { Gift, Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const club = useCurrentClub()
  const clubPlayers = useMemo(() => getPlayersForClub(club.id), [club.id])
  const clubCategories = useMemo(() => getCategoriesForClub(club.id), [club.id])
  const clubEvents = useMemo(() => getEventsForClub(club.id), [club.id])

  const baseSocios = club.total_socios ?? clubPlayers.filter(p => p.is_active).length
  // Escala los datos demo proporcionalmente al tamaño del club
  const scale = baseSocios / 450
  const totalSocios = baseSocios
  const thisMonthPayments = demoPayments.filter(p => p.period === thisMonth && p.fee_type === 'actividad')
  const monthlyIncome = Math.round(thisMonthPayments.reduce((s, p) => s + p.amount, 0) * scale)
  const cuotaActividad = 62000
  const target = cuotaActividad * totalSocios
  const incomePercent = Math.round((monthlyIncome / target) * 100)
  // Próximos partidos agrupados: por (fecha, rival, tira) — todas las categorías que juegan ese día contra ese rival con esa tira
  const today = new Date('2026-05-07')
  const allUpcoming = clubEvents
    .filter(e => e.event_type === 'match' && !e.is_suspended && new Date(e.scheduled_at) > today)
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  // Para cada match, determinar la tira mirando los jugadores de la categoría
  type GroupedMatch = {
    key: string
    date: string
    rival: string | null
    is_home: boolean | null
    tira: Tira | null
    venue: string | null
    categories: { id: string; name: string; matchId: string; time: string }[]
  }
  const groupsMap = new Map<string, GroupedMatch>()
  for (const m of allUpcoming) {
    const dateOnly = m.scheduled_at.split('T')[0]
    const time = m.scheduled_at.split('T')[1]?.slice(0, 5) ?? '—'
    // Inferir tira: la mayoría de la categoría
    const playersOfCat = clubPlayers.filter(p => p.category_id === m.category_id)
    const tiraCount: Record<string, number> = {}
    for (const p of playersOfCat) tiraCount[p.tira] = (tiraCount[p.tira] || 0) + 1
    // Inferir tira por id del evento si tiene patrón
    const tiraFromId = m.id.match(/ev-match-\d+-(\w+)-/)?.[1] as Tira | undefined
    const tira = tiraFromId ?? (Object.entries(tiraCount).sort((a, b) => b[1] - a[1])[0]?.[0] as Tira | null)
    const key = `${dateOnly}-${m.rival}-${tira}`
    const cat = clubCategories.find(c => c.id === m.category_id)
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        date: dateOnly,
        rival: m.rival,
        is_home: m.is_home,
        tira,
        venue: m.venue,
        categories: [],
      })
    }
    groupsMap.get(key)!.categories.push({ id: m.category_id, name: cat?.name ?? '—', matchId: m.id, time })
  }
  // Solo el más próximo por tira (1 por tira: Metro, Liga 1, Liga 2, Edefi)
  const sortedAll = Array.from(groupsMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  const seenTiras = new Set<string>()
  const groupedMatches: typeof sortedAll = []
  for (const g of sortedAll) {
    if (g.tira && !seenTiras.has(g.tira)) {
      seenTiras.add(g.tira)
      groupedMatches.push(g)
    }
    if (groupedMatches.length === 4) break
  }
  const deudoresCount = getPlayerDebts(clubPlayers, demoPayments).length

  // Referrals
  const fullClub = demoClubs.find(c => c.id === club.id)
  const referralActive = fullClub ? getReferralActivationStatus(fullClub.first_payment_at).active : false
  const referralProgress = fullClub ? getReferralProgress(club.id) : null

  const [activeRole] = useActiveRole()
  // Acciones rápidas filtradas por rol — los profes no manejan dinero, los tesoreros priorizan caja
  const allActions = {
    asistencia:    { label: 'Tomar asistencia',  href: '/asistencia',   color: club.primary_color },
    convocatoria:  { label: 'Nueva convocatoria', href: '/convocatoria', color: '#1d4ed8' },
    cobrar:        { label: 'Cobrar cuota',       href: '/caja/cobrar',  color: club.secondary_color },
    caja:          { label: 'Abrir caja',         href: '/caja',         color: '#7c3aed' },
    cobranzas:     { label: 'Ver cobranzas',      href: '/cobranzas',    color: '#dc2626' },
    asistProfes:   { label: 'Asistencia profes',  href: '/asistencia-profes', color: '#0891b2' },
    fixture:       { label: 'Fixture',            href: '/fixture',       color: '#7c2d12' },
    socios:        { label: 'Socios',             href: '/socios',        color: club.primary_color },
  }
  const actionsByRole: Record<typeof activeRole, (keyof typeof allActions)[]> = {
    admin:        ['asistencia', 'convocatoria', 'cobrar', 'caja'],
    profe:        ['asistencia', 'convocatoria', 'fixture', 'socios'],
    tesorero:     ['cobrar', 'caja', 'cobranzas', 'socios'],
    coordinador:  ['asistencia', 'asistProfes', 'convocatoria', 'cobrar'],
  }
  const quickActions = (actionsByRole[activeRole] ?? actionsByRole.admin).map(k => allActions[k])

  return (
    <div className="p-3 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold uppercase truncate" style={{ fontFamily: "var(--font-barlow)", color: club.primary_color }}>
            {club.short_name}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground truncate">{club.city}</p>
        </div>
        {club.logo_url ? (
          <img src={club.logo_url} alt={club.name} className="w-12 h-12 object-contain flex-shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: club.primary_color }}>
            {club.short_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
        )}
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-0" style={{ backgroundColor: action.color }}>
              <CardContent className="p-3 text-center">
                <p className="text-white text-sm font-semibold leading-tight">{action.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Socios activos</CardTitle>
            <Users size={18} style={{ color: club.primary_color }} />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: club.primary_color }}>
              {totalSocios ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Recaudado este mes</CardTitle>
            <TrendingUp size={18} style={{ color: club.secondary_color }} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: club.secondary_color }}>
              ${monthlyIncome.toLocaleString('es-AR')}
            </p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(incomePercent, 100)}%`, backgroundColor: club.secondary_color }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{incomePercent}% del objetivo</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #DC2626' }}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Deudores</CardTitle>
            <AlertTriangle size={18} style={{ color: '#DC2626' }} />
          </CardHeader>
          <CardContent>
            <Link href="/socios?filter=deudores">
              <p className="text-4xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#DC2626' }}>
                {deudoresCount}
              </p>
              <p className="text-xs text-red-500 mt-1">Ver deudores →</p>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Próximos partidos</CardTitle>
            <Calendar size={18} style={{ color: '#1d4ed8' }} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>
              {groupedMatches.length}
            </p>
            <p className="text-xs text-muted-foreground">próximos rivales</p>
          </CardContent>
        </Card>
      </div>

      {/* Card de programa de referidos (solo si activo después de 15 días) */}
      {referralActive && referralProgress && !referralProgress.reached_pro && club.plan === 'club' && (
        <Link href="/invitar">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeft: '4px solid #C9A84C', background: 'linear-gradient(135deg, #fef3c7 0%, white 100%)' }}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-800 flex-1" style={{ fontFamily: "var(--font-barlow)" }}>
                  ¿Conocés otro club? Subí a Pro gratis
                </p>
                <ArrowRight size={14} className="text-amber-600 flex-shrink-0" />
              </div>
              <p className="text-[11px] text-amber-700 mb-2">
                Llevás <strong>{referralProgress.successful}/3</strong> referidos. Te falta {referralProgress.needs_for_pro} para acceder a Plan Pro sin costo.
              </p>
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${referralProgress.progress_to_pro * 100}%` }} />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {referralActive && referralProgress?.reached_pro && (
        <Link href="/invitar">
          <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-purple-100 to-pink-50">
            <CardContent className="p-3 flex items-center gap-2">
              <Sparkles size={20} className="text-purple-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-purple-800">¡Sos embajador Pro!</p>
                <p className="text-[11px] text-purple-700">{referralProgress.successful} clubes confían en vos. Tu Plan Pro es gratis.</p>
              </div>
              <ArrowRight size={14} className="text-purple-600 flex-shrink-0" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* No anotados que participaron */}
      {demoGuestParticipations.filter(g => g.reason !== 'visit_other_tira').length > 0 && (
        <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #F59E0B', backgroundColor: '#fffbeb' }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
                ⚠️ Chicos no anotados que están participando
              </p>
              <span className="text-2xl font-bold text-amber-700" style={{ fontFamily: "var(--font-barlow)" }}>
                {demoGuestParticipations.filter(g => g.reason !== 'visit_other_tira').length}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">A prueba o pendientes de regularizar el cobro.</p>
            <div className="space-y-1">
              {demoGuestParticipations.filter(g => g.reason !== 'visit_other_tira').slice(0, 4).map(g => {
                const cat = clubCategories.find(c => c.id === g.category_id)
                return (
                  <div key={g.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{g.full_name}</p>
                      {g.notes && <p className="text-[10px] text-muted-foreground truncate italic">"{g.notes}"</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">Cat. {cat?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(g.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos partidos agrupados por tira/rival */}
      {groupedMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
            PRÓXIMOS PARTIDOS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {groupedMatches.map(g => {
              const date = new Date(g.date)
              const sc = (club.default_sport_code ?? 'football_11') as SportCode
              const tiraColor = g.tira ? getTiraColor(g.tira, sc) : '#9ca3af'
              const tiraLabel = g.tira ? getTiraLabel(g.tira, sc) : '—'
              return (
                <Card key={g.key} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${tiraColor}` }}>
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white" style={{ backgroundColor: tiraColor }}>
                        {tiraLabel}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {g.is_home ? '🏠 Local' : '✈️ Visitante'}
                      </span>
                    </div>
                    <p className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
                      vs. {g.rival ?? 'Por definir'}
                    </p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      📅 {date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">Categorías:</span>
                      {g.categories.map(c => (
                        <Link key={c.matchId} href={`/partidos/${c.matchId}`}>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border hover:bg-gray-100" style={{ borderColor: tiraColor, color: tiraColor }}>
                            {c.name} · {c.time}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Acceso rápido a módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>SOCIOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/socios" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm">Ver todos los socios</span>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
            <Link href="/socios?filter=deudores" className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 transition-colors">
              <span className="text-sm text-red-600">Listado de deudores</span>
              <span className="text-xs text-red-400">→</span>
            </Link>
            <Link href="/socios/nuevo" className="flex items-center justify-between p-2 rounded-lg hover:bg-green-50 transition-colors">
              <span className="text-sm text-green-700">+ Alta de nuevo socio</span>
              <span className="text-xs text-green-400">→</span>
            </Link>
            <Link href="/padres" className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 transition-colors">
              <span className="text-sm text-blue-700">👨‍👦 Vista del portal de padres (preview)</span>
              <span className="text-xs text-blue-400">→</span>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>FINANZAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/caja" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm">Caja del día</span>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
            <Link href="/finanzas" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm">Ingresos y egresos</span>
              <span className="text-xs text-muted-foreground">→</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
