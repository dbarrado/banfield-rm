'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileSpreadsheet, FileText, TrendingUp, TrendingDown, Users, ChevronDown, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { demoPlayers, demoPayments, demoCashMovements, demoFinanceCategories, demoEvents, demoAttendance, getPlayerDebts, getPlayersForClub, thisMonth, lastMonth } from '@/lib/demo-data'
import { isRealClub } from '@/lib/real-clubs'
import { getRealBillings } from '@/lib/data/billing-store'

const MONTH_OPTIONS = [
  { value: '2026-05', label: 'Mayo 2026' },
  { value: '2026-04', label: 'Abril 2026' },
  { value: '2026-03', label: 'Marzo 2026' },
  { value: '2026-02', label: 'Febrero 2026' },
  { value: '2026-01', label: 'Enero 2026' },
]

export default function ReporteMensualPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const [period, setPeriod] = useState('2026-05')

  // ── CLUB REAL: datos desde Supabase. Ingresos = cuotas cobradas (billings);
  // socios reales; egresos/asistencia aún sin fuente cargada → 0 (no demo). ──
  const realBillings = real ? (getRealBillings(club.id) ?? []) : []
  const realPlayers = real ? getPlayersForClub(club.id) : []

  // Datos: ingresos REALES = pagos del período + movimientos manuales (donaciones, etc.)
  // Egresos = movimientos de caja del mes
  const monthPayments = demoPayments.filter(p => p.period === period)
  const monthPaymentsActividad = monthPayments.filter(p => p.fee_type === 'actividad')

  // Ingresos: cuotas cobradas + matrículas + ingresos extra de caja (donaciones, etc.)
  const ingresosCuotas = real
    ? realBillings.filter(b => b.fee_type === 'actividad').reduce((s, b) => s + (b.amount_paid ?? 0), 0)
    : monthPaymentsActividad.reduce((s, p) => s + p.amount, 0)
  const ingresosMatriculas = real
    ? realBillings.filter(b => b.fee_type === 'matricula').reduce((s, b) => s + (b.amount_paid ?? 0), 0)
    : monthPayments.filter(p => p.fee_type === 'matricula').reduce((s, p) => s + p.amount, 0)
  const otrosIngresos = real ? 0 : demoCashMovements.filter(m => m.movement_type === 'income' && m.finance_category_id !== 'fc-1' && m.finance_category_id !== 'fc-2').reduce((s, m) => s + m.amount, 0)
  const totalIngresos = ingresosCuotas + ingresosMatriculas + otrosIngresos

  // Egresos: gastos del mes desde movimientos de caja (club real: aún sin loader → 0)
  const totalEgresos = real ? 0 : demoCashMovements.filter(m => m.movement_type === 'expense').reduce((s, m) => s + m.amount, 0)
  const saldoNeto = totalIngresos - totalEgresos

  // Mes anterior (comparativo) — solo ingresos por cuotas para que sea simétrico
  const lastMonthPayments = demoPayments.filter(p => p.period === lastMonth && p.fee_type === 'actividad')
  const lastMonthIncome = real ? 0 : lastMonthPayments.reduce((s, p) => s + p.amount, 0)
  const monthIncome = totalIngresos
  const incomeVariation = lastMonthIncome > 0 ? Math.round(((monthIncome - lastMonthIncome) / lastMonthIncome) * 100) : 0

  // Socios
  const totalSocios = real ? realPlayers.filter(p => p.is_active).length : demoPlayers.filter(p => p.is_active).length
  const deudores = real
    ? (() => {
        const alDiaSet = new Set(realBillings.filter(b => b.fee_type === 'actividad' && b.status === 'paid').map(b => b.player_id))
        return realPlayers.filter(p => p.is_active && !alDiaSet.has(p.id)).length
      })()
    : getPlayerDebts(demoPlayers, demoPayments).length
  const alDia = totalSocios - deudores
  const cobranzaPct = totalSocios > 0 ? Math.round((alDia / totalSocios) * 100) : 0

  // Asistencia (club real: sin asistencias cargadas aún → 0)
  const monthEvents = real ? [] : demoEvents.filter(e => e.event_type === 'practice' && !e.is_suspended)
  const monthAtt = real ? [] : demoAttendance.filter(a => a.status === 'present')
  const avgAttendance = monthEvents.length > 0
    ? Math.round((monthAtt.length / (monthEvents.length * (totalSocios / 9))) * 100)
    : 0

  // Ingresos por categoría: arranca con totales reales de cuotas y matrículas, suma resto desde movimientos
  const incomeByCat: Record<string, number> = {}
  if (ingresosCuotas > 0) incomeByCat['Cuotas cobradas'] = ingresosCuotas
  if (ingresosMatriculas > 0) incomeByCat['Matrículas cobradas'] = ingresosMatriculas
  if (!real) for (const m of demoCashMovements.filter(x => x.movement_type === 'income')) {
    const cat = demoFinanceCategories.find(c => c.id === m.finance_category_id)
    if (cat && cat.name !== 'Cuotas cobradas' && cat.name !== 'Matrículas cobradas') {
      incomeByCat[cat.name] = (incomeByCat[cat.name] || 0) + m.amount
    }
  }
  const topIncome = Object.entries(incomeByCat).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const expenseByCat = real ? {} : demoCashMovements.filter(m => m.movement_type === 'expense').reduce((acc, m) => {
    const cat = demoFinanceCategories.find(c => c.id === m.finance_category_id)
    if (cat) acc[cat.name] = (acc[cat.name] || 0) + m.amount
    return acc
  }, {} as Record<string, number>)
  const topExpense = Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/reportes" className="p-1.5 rounded hover:bg-gray-100 flex-shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            REPORTE MENSUAL
          </h1>
        </div>
      </div>

      {/* Selector mes + export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full appearance-none pl-9 pr-8 py-2 rounded-lg border text-sm font-medium bg-white"
          >
            {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
        <button className="px-2.5 py-2 rounded border text-xs font-semibold flex items-center gap-1 hover:bg-gray-50">
          <FileSpreadsheet size={12} /> XLS
        </button>
        <button className="px-2.5 py-2 rounded border text-xs font-semibold flex items-center gap-1 hover:bg-gray-50">
          <FileText size={12} /> PDF
        </button>
      </div>

      {/* Resumen ejecutivo */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid var(--club-primary, #00843D)' }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saldo neto del mes</p>
          <p className="text-4xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: saldoNeto >= 0 ? 'var(--club-primary, #00843D)' : '#DC2626' }}>
            ${saldoNeto.toLocaleString('es-AR')}
          </p>
          {incomeVariation !== 0 && (
            <p className={`text-xs mt-1 ${incomeVariation > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {incomeVariation > 0 ? '↑' : '↓'} {Math.abs(incomeVariation)}% vs. mes anterior
            </p>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-green-600 uppercase font-semibold">Ingresos</p>
            <p className="text-lg font-bold text-green-600 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              ${(totalIngresos / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-red-500 uppercase font-semibold">Egresos</p>
            <p className="text-lg font-bold text-red-500 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              ${(totalEgresos / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-blue-600 uppercase font-semibold">Cobranza</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              {cobranzaPct}%
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5">
            <p className="text-[10px] text-amber-600 uppercase font-semibold">Asistencia</p>
            <p className="text-lg font-bold text-amber-600 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              {avgAttendance}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            Comparativo
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="text-muted-foreground">Mes anterior</p>
              <p className="font-bold" style={{ fontFamily: "var(--font-barlow)" }}>${(lastMonthIncome / 1000).toFixed(0)}K</p>
            </div>
            <div>
              <p className="text-muted-foreground">Este mes</p>
              <p className="font-bold text-base" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                ${(monthIncome / 1000).toFixed(0)}K
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Variación</p>
              <p className={`font-bold ${incomeVariation > 0 ? 'text-green-600' : incomeVariation < 0 ? 'text-red-500' : ''}`}>
                {incomeVariation > 0 ? '+' : ''}{incomeVariation}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top ingresos por categoría */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
            <TrendingUp size={14} className="text-green-600" /> Ingresos por categoría
          </p>
          {topIncome.length === 0 && <p className="text-xs text-muted-foreground">Sin cobros registrados en el período.</p>}
          {topIncome.map(([name, amount]) => {
            const pct = Math.round((amount / totalIngresos) * 100)
            return (
              <div key={name} className="space-y-0.5">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{name}</span>
                  <span className="font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                    ${amount.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Top egresos por categoría */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
            <TrendingDown size={14} className="text-red-500" /> Egresos por categoría
          </p>
          {topExpense.length === 0 && <p className="text-xs text-muted-foreground">Sin egresos registrados en el período.</p>}
          {topExpense.map(([name, amount]) => {
            const pct = totalEgresos > 0 ? Math.round((amount / totalEgresos) * 100) : 0
            return (
              <div key={name} className="space-y-0.5">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{name}</span>
                  <span className="font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                    ${amount.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Estado de socios */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
            <Users size={14} /> Estado de socios
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-green-50">
              <p className="text-[10px] text-green-700 font-semibold uppercase">Al día</p>
              <p className="text-xl font-bold text-green-700" style={{ fontFamily: "var(--font-barlow)" }}>{alDia}</p>
            </div>
            <div className="p-2 rounded bg-red-50">
              <p className="text-[10px] text-red-700 font-semibold uppercase">Deudores</p>
              <p className="text-xl font-bold text-red-700" style={{ fontFamily: "var(--font-barlow)" }}>{deudores}</p>
            </div>
            <div className="p-2 rounded bg-blue-50">
              <p className="text-[10px] text-blue-700 font-semibold uppercase">Total</p>
              <p className="text-xl font-bold text-blue-700" style={{ fontFamily: "var(--font-barlow)" }}>{totalSocios}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-[10px] text-center text-muted-foreground pt-2">
        Reporte generado el {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}
