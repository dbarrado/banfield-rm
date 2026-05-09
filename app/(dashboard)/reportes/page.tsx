'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, FileSpreadsheet, FileText, Calendar, AlertTriangle, Sparkles, Users, Receipt } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { hasAccess, getRequiredPlan, type Plan } from '@/lib/feature-gates'
import { UpgradePrompt } from '@/components/upgrade-prompt'

export default function ReportesPage() {
  const club = useCurrentClub()
  const required = getRequiredPlan('/reportes')
  if (!hasAccess(club.plan as Plan, required)) {
    return <UpgradePrompt currentPlan={club.plan as Plan} requiredPlan={required} featureName="Reportes" featureDescription="Estado de Resultados mensual y anual, comparativos y reportes para asamblea." />
  }
  return <ReportesContent />
}

function ReportesContent() {
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

