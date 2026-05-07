'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, AlertCircle, MessageCircle, RefreshCw, Settings } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers, demoCategories } from '@/lib/demo-data'
import {
  generateBillingsForPeriod,
  loadBillingConfig,
  saveBillingConfig,
  STATUS_CONFIG,
  type Billing,
  type BillingStatus,
} from '@/lib/billings'

const FILTERS: { key: 'all' | BillingStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'paid', label: 'Pagados' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'overdue_with_fee', label: 'Vencidos' },
]

export default function CobranzasPage() {
  const today = new Date()
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [cfg, setCfg] = useState(() => loadBillingConfig())
  const [billings, setBillings] = useState<Billing[]>([])
  const [filter, setFilter] = useState<'all' | BillingStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showConfig, setShowConfig] = useState(false)
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    setBillings(generateBillingsForPeriod(period, today, cfg))
    setGenerated(true)
  }, [period, cfg])

  const filtered = useMemo(() => {
    return billings.filter(b => {
      if (filter !== 'all' && b.status !== filter) return false
      if (categoryFilter !== 'all') {
        const player = demoPlayers.find(p => p.id === b.player_id)
        if (player?.category_id !== categoryFilter) return false
      }
      return true
    })
  }, [billings, filter, categoryFilter])

  const counts = useMemo(() => ({
    paid: billings.filter(b => b.status === 'paid').length,
    pending: billings.filter(b => b.status === 'pending').length,
    overdue: billings.filter(b => b.status === 'overdue_with_fee').length,
    total_paid: billings.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount_final, 0),
    total_pending: billings.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount_final + b.late_fee_amount, 0),
    total_late_fees: billings.reduce((s, b) => s + b.late_fee_amount, 0),
  }), [billings])

  function regenerate() {
    setBillings(generateBillingsForPeriod(period, today, cfg))
    alert(`✅ Cuotas regeneradas para ${period} (demo)\n\n${billings.length} billings emitidos.`)
  }

  function applyLateFees() {
    const overdueCount = billings.filter(b => b.status === 'overdue_with_fee').length
    if (overdueCount === 0) {
      alert(`No hay vencidos hoy (${today.getDate()}/${today.getMonth() + 1}). El día de overdue está configurado en ${cfg.overdue_day}.`)
      return
    }
    alert(`✅ Recargo aplicado a ${overdueCount} cuotas vencidas (demo)\n\nRecargo: ${cfg.late_fee_pct}%\nTotal recargos: $${counts.total_late_fees.toLocaleString('es-AR')}`)
  }

  function reminderToOverdue() {
    const overdues = billings.filter(b => b.status !== 'paid')
    if (overdues.length === 0) {
      alert('No hay deudores para notificar.')
      return
    }
    alert(`📱 Mensaje WhatsApp masivo enviado a ${overdues.length} familias deudoras (demo)\n\nMonto total a recuperar: $${counts.total_pending.toLocaleString('es-AR')}`)
  }

  function saveConfig(newCfg: typeof cfg) {
    saveBillingConfig(newCfg)
    setCfg(newCfg)
    setShowConfig(false)
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: 'var(--font-barlow)', color: 'var(--club-primary, #00843D)' }}>
            COBRANZAS
          </h1>
        </div>
        <button onClick={() => setShowConfig(!showConfig)} className="p-2 rounded-lg border text-muted-foreground hover:bg-gray-50">
          <Settings size={16} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Cuotas emitidas del período <strong>{period}</strong> · Vencimiento día {cfg.due_day} · Mora desde día {cfg.overdue_day}
      </p>

      {/* Config inline */}
      {showConfig && (
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-3 space-y-3">
            <p className="text-xs font-bold uppercase text-muted-foreground">Parámetros de cobranza</p>
            <ConfigField label="Día de vencimiento" min={1} max={28} value={cfg.due_day} onChange={v => saveConfig({ ...cfg, due_day: v })} />
            <ConfigField label="Día de mora (overdue)" min={2} max={28} value={cfg.overdue_day} onChange={v => saveConfig({ ...cfg, overdue_day: v })} />
            <ConfigField label="% recargo por mora" min={0} max={50} value={cfg.late_fee_pct} onChange={v => saveConfig({ ...cfg, late_fee_pct: v })} />
            <p className="text-[10px] text-muted-foreground italic">
              Los cambios se aplican inmediatamente al recalcular el estado de las cuotas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-1.5">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-green-600 uppercase font-bold">Pagados</p>
            <p className="text-base font-bold text-green-600" style={{ fontFamily: 'var(--font-barlow)' }}>{counts.paid}</p>
            <p className="text-[10px] text-muted-foreground">${(counts.total_paid / 1_000_000).toFixed(1)}M</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-amber-600 uppercase font-bold">Pendientes</p>
            <p className="text-base font-bold text-amber-600" style={{ fontFamily: 'var(--font-barlow)' }}>{counts.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2 text-center">
            <p className="text-[9px] text-red-600 uppercase font-bold">Vencidos</p>
            <p className="text-base font-bold text-red-600" style={{ fontFamily: 'var(--font-barlow)' }}>{counts.overdue}</p>
            <p className="text-[10px] text-muted-foreground">+${(counts.total_late_fees / 1000).toFixed(0)}k mora</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-1.5">
        <button onClick={regenerate} className="py-2 rounded-lg text-[11px] font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-1">
          <RefreshCw size={12} /> Generar cuotas
        </button>
        <button onClick={applyLateFees} className="py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: '#dc2626' }}>
          <AlertCircle size={12} /> Aplicar recargo
        </button>
        <button onClick={reminderToOverdue} className="py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: '#16a34a' }}>
          <MessageCircle size={12} /> Recordar deuda
        </button>
      </div>

      {/* Filtros */}
      <div className="space-y-1.5">
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
          {FILTERS.map(f => {
            const sel = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}>
                {f.label}
              </button>
            )
          })}
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="w-full px-2 py-1.5 border rounded text-xs">
          <option value="all">Todas las categorías</option>
          {demoCategories.filter(c => c.is_active).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <p className="text-[11px] text-muted-foreground">{filtered.length} de {billings.length} cuotas</p>
      <div className="space-y-1.5">
        {filtered.slice(0, 100).map(b => {
          const player = demoPlayers.find(p => p.id === b.player_id)
          const cat = demoCategories.find(c => c.id === player?.category_id)
          const sCfg = STATUS_CONFIG[b.status]
          return (
            <Card key={b.id} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${sCfg.color}` }}>
              <CardContent className="p-2.5 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{player?.full_name ?? '?'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant="outline" className="text-[9px]">{cat?.name ?? '-'}</Badge>
                    {b.discount_pct > 0 && (
                      <Badge variant="outline" className="text-[9px] text-purple-700 border-purple-200">
                        -{b.discount_pct}% hno.
                      </Badge>
                    )}
                    {b.late_fee_amount > 0 && (
                      <Badge variant="outline" className="text-[9px] text-red-700 border-red-200">
                        +${b.late_fee_amount.toLocaleString('es-AR')}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
                    ${(b.amount_final + b.late_fee_amount).toLocaleString('es-AR')}
                  </p>
                  <Badge className="text-[9px] border-0 mt-0.5" style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>
                    {sCfg.label}
                  </Badge>
                </div>
                {b.status !== 'paid' && (
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Hola ${player?.tutor_name ?? ''}, recordatorio de cuota ${period} pendiente: $${(b.amount_final + b.late_fee_amount).toLocaleString('es-AR')}.`)}`}
                    target="_blank" rel="noreferrer"
                    className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 flex-shrink-0"
                    title="WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {filtered.length > 100 && (
        <p className="text-center text-[11px] text-muted-foreground">Mostrando primeras 100 · {filtered.length - 100} más</p>
      )}

      <Link href="/config" className="block text-center text-[11px] text-muted-foreground underline pt-2">
        Configuración general del club →
      </Link>
    </div>
  )
}

function ConfigField({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs font-medium flex-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        className="w-20 px-2 py-1 border rounded text-sm text-right font-bold"
      />
    </div>
  )
}
