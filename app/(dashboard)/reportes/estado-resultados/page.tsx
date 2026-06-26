'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FileSpreadsheet, FileText, ChevronDown, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { demoPlayers, demoPayments, demoCashMovements, thisMonth, lastMonth } from '@/lib/demo-data'
import { isRealClub } from '@/lib/real-clubs'
import { getRealBillings } from '@/lib/data/billing-store'

const PERIOD_OPTIONS = [
  { value: '2026-05', label: 'Mayo 2026' },
  { value: '2026-04', label: 'Abril 2026' },
  { value: '2026-03', label: 'Marzo 2026' },
  { value: '2026-02', label: 'Febrero 2026' },
  { value: '2026-01', label: 'Enero 2026' },
  { value: 'ytd-2026', label: 'YTD 2026 (acumulado)' },
]

export default function EstadoResultadosPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const [period, setPeriod] = useState('2026-05')
  const isYTD = period.startsWith('ytd')

  // Club real: ingresos operativos = cuotas cobradas reales (billings del período cargado).
  const realBillings = real ? (getRealBillings(club.id) ?? []) : []

  // === CÁLCULOS DEL PERÍODO ===
  function calcPeriod(p: string) {
    if (real) {
      // Solo el período actual está hidratado; otros períodos = 0 (sin datos cargados).
      const cuotas = realBillings.filter(b => b.fee_type === 'actividad').reduce((s, b) => s + (b.amount_paid ?? 0), 0)
      const matriculas = realBillings.filter(b => b.fee_type === 'matricula').reduce((s, b) => s + (b.amount_paid ?? 0), 0)
      return { cuotas, matriculas }
    }
    const periods = isYTD ? ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05'] : [p]
    const cuotas = demoPayments.filter(pay => periods.includes(pay.period) && pay.fee_type === 'actividad').reduce((s, x) => s + x.amount, 0)
    const matriculas = demoPayments.filter(pay => periods.includes(pay.period) && pay.fee_type === 'matricula').reduce((s, x) => s + x.amount, 0)
    return { cuotas, matriculas }
  }
  const current = calcPeriod(period)
  const prev = real ? { cuotas: 0, matriculas: 0 }
             : period === '2026-05' ? calcPeriod('2026-04')
             : period === '2026-04' ? calcPeriod('2026-03')
             : period === '2026-03' ? calcPeriod('2026-02')
             : period === '2026-02' ? calcPeriod('2026-01')
             : { cuotas: 0, matriculas: 0 }

  // Otros ingresos y egresos: club real aún sin fuente cargada → 0 (no inventar).
  // Demo: valores simulados de muestra.
  const periodMultiplier = isYTD ? 5 : 1
  const donaciones = real ? 0 : 85000 * periodMultiplier
  const sponsoreo = real ? 0 : 220000 * periodMultiplier
  const ventas_indumentaria = real ? 0 : 156000 * periodMultiplier
  const otros_ingresos = donaciones + sponsoreo + ventas_indumentaria

  const alquiler_cancha = real ? 0 : 480000 * periodMultiplier
  const arbitraje = real ? 0 : 145000 * periodMultiplier
  const materiales = real ? 0 : 95000 * periodMultiplier
  const transporte = real ? 0 : 78000 * periodMultiplier
  const indumentaria_costo = real ? 0 : 198000 * periodMultiplier
  const inscripciones = real ? 0 : 35000 * periodMultiplier
  const mantenimiento = real ? 0 : 62000 * periodMultiplier
  const otros_gastos = real ? 0 : 28000 * periodMultiplier

  const total_egresos_operativos = alquiler_cancha + arbitraje + materiales + transporte + mantenimiento
  const total_egresos_otros = indumentaria_costo + inscripciones + otros_gastos
  const total_egresos = total_egresos_operativos + total_egresos_otros

  const ingresos_operativos = current.cuotas + current.matriculas
  const total_ingresos = ingresos_operativos + otros_ingresos
  const resultado_bruto = total_ingresos - total_egresos_operativos
  const resultado_neto = total_ingresos - total_egresos
  const margen = total_ingresos > 0 ? (resultado_neto / total_ingresos) * 100 : 0

  const prev_total = prev.cuotas + prev.matriculas
  const variacion = prev_total > 0 ? ((ingresos_operativos - prev_total) / prev_total) * 100 : 0

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/reportes" className="p-1.5 rounded hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          ESTADO DE RESULTADOS
        </h1>
      </div>

      {/* Selector + export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full appearance-none pl-9 pr-8 py-2 rounded-lg border text-sm font-medium bg-white"
          >
            {PERIOD_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
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

      {/* Resultado neto destacado */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${resultado_neto >= 0 ? 'var(--club-primary, #00843D)' : '#DC2626'}` }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Resultado neto del período</p>
          <p className="text-4xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: resultado_neto >= 0 ? 'var(--club-primary, #00843D)' : '#DC2626' }}>
            ${resultado_neto.toLocaleString('es-AR')}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Margen: <strong>{margen.toFixed(1)}%</strong> sobre ingresos totales
          </p>
        </CardContent>
      </Card>

      {/* Estado de resultados jerárquico */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-3">
          {/* INGRESOS */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={14} className="text-green-600" />
              <p className="text-xs font-bold uppercase tracking-wider text-green-700" style={{ fontFamily: "var(--font-barlow)" }}>
                INGRESOS
              </p>
            </div>

            <div className="ml-1 space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Operativos</p>
              <Row label="Cuotas mensuales" amount={current.cuotas} />
              <Row label="Matrículas anuales" amount={current.matriculas} />
              <Row label="Subtotal operativos" amount={ingresos_operativos} bold />

              <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2">Otros ingresos</p>
              <Row label="Donaciones" amount={donaciones} />
              <Row label="Sponsoreo" amount={sponsoreo} />
              <Row label="Ventas de indumentaria" amount={ventas_indumentaria} muted />
              <Row label="Subtotal otros" amount={otros_ingresos} bold />
            </div>

            <div className="border-t border-green-200 mt-2 pt-1.5">
              <Row label="TOTAL INGRESOS" amount={total_ingresos} bold large color="#059669" />
            </div>
          </div>

          {/* EGRESOS */}
          <div className="pt-3 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={14} className="text-red-500" />
              <p className="text-xs font-bold uppercase tracking-wider text-red-600" style={{ fontFamily: "var(--font-barlow)" }}>
                EGRESOS
              </p>
            </div>

            <div className="ml-1 space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1">Operativos</p>
              <Row label="Alquiler de cancha" amount={alquiler_cancha} negative />
              <Row label="Arbitraje" amount={arbitraje} negative />
              <Row label="Materiales deportivos" amount={materiales} negative />
              <Row label="Transporte" amount={transporte} negative />
              <Row label="Mantenimiento" amount={mantenimiento} negative />
              <Row label="Subtotal operativos" amount={total_egresos_operativos} bold negative />

              <p className="text-[10px] font-bold uppercase text-muted-foreground mt-2">Otros egresos</p>
              <Row label="Indumentaria (costo)" amount={indumentaria_costo} negative />
              <Row label="Inscripciones a torneos" amount={inscripciones} negative />
              <Row label="Otros" amount={otros_gastos} negative />
              <Row label="Subtotal otros" amount={total_egresos_otros} bold negative />
            </div>

            <div className="border-t border-red-200 mt-2 pt-1.5">
              <Row label="TOTAL EGRESOS" amount={total_egresos} bold large negative color="#DC2626" />
            </div>
          </div>

          {/* Resultado bruto */}
          <div className="pt-3 border-t">
            <Row label="Resultado bruto (sólo operativos)" amount={resultado_bruto} bold color={resultado_bruto >= 0 ? '#059669' : '#DC2626'} />
          </div>

          {/* Resultado neto */}
          <div className="pt-1 border-t-2 border-gray-300">
            <Row label="RESULTADO NETO" amount={resultado_neto} bold large color={resultado_neto >= 0 ? '#00843D' : '#DC2626'} />
          </div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      {!isYTD && period !== '2026-01' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              Comparativo período anterior (operativos)
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Anterior</p>
                <p className="font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
                  ${(prev_total / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Actual</p>
                <p className="font-bold text-base mt-0.5" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                  ${(ingresos_operativos / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Variación</p>
                <p className={`font-bold mt-0.5 ${variacion > 0 ? 'text-green-600' : variacion < 0 ? 'text-red-500' : ''}`} style={{ fontFamily: "var(--font-barlow)" }}>
                  {variacion > 0 ? '+' : ''}{variacion.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-[10px] text-center text-muted-foreground pt-2">
        Generado {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {club.short_name}
      </p>
    </div>
  )
}

function Row({ label, amount, bold = false, large = false, negative = false, muted = false, color }: {
  label: string
  amount: number
  bold?: boolean
  large?: boolean
  negative?: boolean
  muted?: boolean
  color?: string
}) {
  const sign = negative ? '-' : ''
  const baseClass = large ? 'text-base' : bold ? 'text-sm' : 'text-xs'
  return (
    <div className={`flex items-center justify-between py-0.5 ${muted ? 'opacity-70' : ''}`}>
      <span className={`${baseClass} ${bold ? 'font-bold' : ''} ${negative && bold ? 'text-red-600' : ''}`}>
        {label}
      </span>
      <span
        className={`${baseClass} font-mono ${bold ? 'font-bold' : ''}`}
        style={{ fontFamily: bold ? "var(--font-barlow)" : 'inherit', color: color ?? (negative ? '#DC2626' : 'inherit') }}
      >
        {sign}${amount.toLocaleString('es-AR')}
      </span>
    </div>
  )
}
