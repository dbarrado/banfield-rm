'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, FileSpreadsheet, FileText, Calendar, AlertTriangle, Lock, Sparkles, Users, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'

export default function ReportesPage() {
  const club = useCurrentClub()
  const isPro = club.plan === 'pro'

  if (!isPro) {
    return (
      <div className="p-3 md:p-6 space-y-3 pb-8">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-muted-foreground" />
          <h1 className="text-2xl font-bold text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            REPORTES
          </h1>
        </div>
        <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-5 text-center space-y-3">
            <Lock size={28} className="mx-auto text-purple-600" />
            <h2 className="text-lg font-bold text-purple-900" style={{ fontFamily: "var(--font-barlow)" }}>
              Disponible en Plan Pro
            </h2>
            <p className="text-sm text-purple-700">
              Reportes mensuales y anuales con exportación a Excel y PDF, comparativos contra períodos anteriores y proyecciones.
            </p>
            <div className="bg-white rounded-lg p-3 space-y-1.5 text-left text-xs">
              <Bullet>Estado de resultados mensual</Bullet>
              <Bullet>Comparativo año vs año</Bullet>
              <Bullet>Top deudores por antigüedad</Bullet>
              <Bullet>Recaudación por categoría</Bullet>
              <Bullet>Asistencia consolidada</Bullet>
              <Bullet>Exportar Excel y PDF</Bullet>
            </div>
            <button className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#7c3aed' }}>
              UPGRADE A PLAN PRO
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const reportes = [
    {
      href: '/reportes/mensual',
      icon: Calendar,
      title: 'Reporte mensual',
      description: 'Recaudación, egresos, asistencia y comparativos del mes',
      color: '#00843D',
      featured: true,
    },
    {
      href: '/reportes/estado-resultados',
      icon: TrendingUp,
      title: 'Estado de resultados',
      description: 'Ingresos vs egresos por categoría jerárquica',
      color: '#1d4ed8',
    },
    {
      href: '#',
      icon: AlertTriangle,
      title: 'Deudores por antigüedad',
      description: '0-30, 30-60, 60-90, +90 días',
      color: '#DC2626',
    },
    {
      href: '#',
      icon: Users,
      title: 'Asistencia consolidada',
      description: 'Por categoría, por tira, por profe',
      color: '#7c3aed',
    },
    {
      href: '#',
      icon: Receipt,
      title: 'Conciliación bancaria',
      description: 'Cruce de extractos vs movimientos',
      color: '#F59E0B',
    },
    {
      href: '#',
      icon: BarChart3,
      title: 'Comparativos anuales',
      description: 'Año actual vs año anterior',
      color: '#059669',
    },
  ]

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <BarChart3 size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            REPORTES
          </h1>
          <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0">
            <Sparkles size={9} className="mr-0.5" /> PRO
          </Badge>
        </div>
        <div className="flex gap-1">
          <button className="px-2 py-1.5 rounded border text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center gap-1">
            <FileSpreadsheet size={11} /> Excel
          </button>
          <button className="px-2 py-1.5 rounded border text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center gap-1">
            <FileText size={11} /> PDF
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Todos los reportes se pueden exportar a Excel y PDF. Datos en vivo de los últimos 12 meses.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {reportes.map(r => {
          const Icon = r.icon
          return (
            <Link key={r.title} href={r.href}>
              <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full ${r.featured ? 'border-l-4' : ''}`} style={r.featured ? { borderLeft: `4px solid ${r.color}` } : {}}>
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: r.color }}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-purple-600 flex-shrink-0">✓</span>
      <span>{children}</span>
    </div>
  )
}
