import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import Link from 'next/link'
import {
  demoPlayers,
  demoPayments,
  demoEvents,
  demoCategories,
  getPlayerDebts,
  thisMonth,
} from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, type Tira } from '@/types'

export default function DashboardPage() {
  const totalSocios = demoPlayers.filter(p => p.is_active).length
  const thisMonthPayments = demoPayments.filter(p => p.period === thisMonth && p.fee_type === 'actividad')
  const monthlyIncome = thisMonthPayments.reduce((s, p) => s + p.amount, 0)
  const cuotaActividad = 62000
  const target = cuotaActividad * totalSocios
  const incomePercent = Math.round((monthlyIncome / target) * 100)
  // Próximos partidos agrupados: por (fecha, rival, tira) — todas las categorías que juegan ese día contra ese rival con esa tira
  const today = new Date('2026-05-07')
  const allUpcoming = demoEvents
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
    const playersOfCat = demoPlayers.filter(p => p.category_id === m.category_id)
    const tiraCount: Record<string, number> = {}
    for (const p of playersOfCat) tiraCount[p.tira] = (tiraCount[p.tira] || 0) + 1
    // Inferir tira por id del evento si tiene patrón
    const tiraFromId = m.id.match(/ev-match-\d+-(\w+)-/)?.[1] as Tira | undefined
    const tira = tiraFromId ?? (Object.entries(tiraCount).sort((a, b) => b[1] - a[1])[0]?.[0] as Tira | null)
    const key = `${dateOnly}-${m.rival}-${tira}`
    const cat = demoCategories.find(c => c.id === m.category_id)
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
  const deudoresCount = getPlayerDebts(demoPlayers, demoPayments).length

  const quickActions = [
    { label: 'Tomar asistencia', href: '/asistencia', color: '#00843D' },
    { label: 'Nueva convocatoria', href: '/convocatoria', color: '#1d4ed8' },
    { label: 'Registrar pago', href: '/socios', color: '#C9A84C' },
    { label: 'Abrir caja', href: '/caja', color: '#7c3aed' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            BANFIELD RM
          </h1>
          <p className="text-sm text-muted-foreground">Filial Ramos Mejía</p>
        </div>
        <img src="/escudo-banfield.png" alt="Escudo" className="w-12 h-12 object-contain" />
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
            <Users size={18} style={{ color: '#00843D' }} />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
              {totalSocios ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Recaudado este mes</CardTitle>
            <TrendingUp size={18} style={{ color: '#C9A84C' }} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#C9A84C' }}>
              ${monthlyIncome.toLocaleString('es-AR')}
            </p>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(incomePercent, 100)}%`, backgroundColor: '#C9A84C' }}
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

      {/* Próximos partidos agrupados por tira/rival */}
      {groupedMatches.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
            PRÓXIMOS PARTIDOS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {groupedMatches.map(g => {
              const date = new Date(g.date)
              const tiraColor = g.tira ? TIRA_COLORS[g.tira] : '#9ca3af'
              const tiraLabel = g.tira ? TIRA_LABELS[g.tira] : '—'
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
