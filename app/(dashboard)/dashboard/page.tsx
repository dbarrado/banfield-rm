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

export default function DashboardPage() {
  const totalSocios = demoPlayers.filter(p => p.is_active).length
  const thisMonthPayments = demoPayments.filter(p => p.period === thisMonth && p.fee_type === 'actividad')
  const monthlyIncome = thisMonthPayments.reduce((s, p) => s + p.amount, 0)
  const cuotaActividad = 62000
  const target = cuotaActividad * totalSocios
  const incomePercent = Math.round((monthlyIncome / target) * 100)
  const upcoming = demoEvents
    .filter(e => e.event_type === 'match' && !e.is_suspended && new Date(e.scheduled_at) > new Date('2026-05-05'))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]
  const cat = upcoming ? demoCategories.find(c => c.id === upcoming.category_id) : null
  const nextMatchData = upcoming ? { scheduled_at: upcoming.scheduled_at, rival: upcoming.rival, category: cat ? { name: cat.name } : null } : null
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
            <CardTitle className="text-sm text-muted-foreground font-medium">Próximo partido</CardTitle>
            <Calendar size={18} style={{ color: '#1d4ed8' }} />
          </CardHeader>
          <CardContent>
            {nextMatchData ? (
              <>
                <p className="text-lg font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  vs. {nextMatchData.rival ?? 'Por definir'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(nextMatchData.scheduled_at).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {nextMatchData.category && ` · ${nextMatchData.category.name}`}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin partidos próximos</p>
            )}
          </CardContent>
        </Card>
      </div>

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
