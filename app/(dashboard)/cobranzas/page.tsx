'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, AlertCircle, MessageCircle, RefreshCw, Settings, Mail, Ban, Edit2, X, Check, CreditCard } from 'lucide-react'
import { useActiveRole } from '@/lib/use-role'
import Link from 'next/link'
import { demoPlayers, demoCategories } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { hasAccess, getRequiredPlan, type Plan } from '@/lib/feature-gates'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import {
  generateBillingsForPeriod,
  loadBillingConfig,
  saveBillingConfig,
  STATUS_CONFIG,
  CONDONE_CAUSALES,
  getOutstandingAmount,
  type Billing,
  type BillingStatus,
  type BillingAdjustment,
} from '@/lib/billings'
import { isRealClub } from '@/lib/real-clubs'
import { getRealBillings, persistBillingUpdate, hydrateBillings } from '@/lib/data/billing-store'

const FILTERS: { key: 'all' | BillingStatus; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'paid', label: 'Pagados' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'overdue_with_fee', label: 'Vencidos' },
]

export default function CobranzasPage() {
  const club = useCurrentClub()
  const required = getRequiredPlan('/cobranzas')
  if (!hasAccess(club.plan as Plan, required)) {
    return <UpgradePrompt currentPlan={club.plan as Plan} requiredPlan={required} featureName="Cobranzas" featureDescription="Gestión de cuotas emitidas, condonación, ajuste de importes y pagos parciales." />
  }
  return <CobranzasContent />
}

function CobranzasContent() {
  const club = useCurrentClub()
  const today = new Date()
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  function buildReminderMessage(playerName: string, debt: number, deadlineDay: number) {
    return `Hola, nos comunicamos desde ${club.name} para informarle que el jugador/a ${playerName} tiene una deuda pendiente de $${debt.toLocaleString('es-AR')}.

Le recordamos que la fecha límite para abonar es hasta el día ${deadlineDay} de cada mes. Le agradecemos que pase a abonarlo a la brevedad.

Muchas gracias.`
  }

  const [cfg, setCfg] = useState(() => loadBillingConfig())
  const [billings, setBillings] = useState<Billing[]>([])
  const [filter, setFilter] = useState<'all' | BillingStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showConfig, setShowConfig] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [activeRole] = useActiveRole()
  const canAdjust = activeRole === 'admin' || activeRole === 'tesorero' || activeRole === 'coordinador'

  // Modal state para condonar / ajustar
  const [actionTarget, setActionTarget] = useState<{ billing: Billing; mode: 'condone' | 'adjust' } | null>(null)
  const [actionCausal, setActionCausal] = useState('')
  const [actionReason, setActionReason] = useState('')
  const [actionAmount, setActionAmount] = useState('')

  function openCondone(b: Billing) {
    setActionTarget({ billing: b, mode: 'condone' })
    setActionCausal(CONDONE_CAUSALES[0])
    setActionReason('')
  }

  function openAdjust(b: Billing) {
    setActionTarget({ billing: b, mode: 'adjust' })
    setActionAmount(String(b.amount_final))
    setActionReason('')
  }

  function applyAction() {
    if (!actionTarget) return
    const now = new Date().toISOString()
    const actor = activeRole // en producción sería el nombre del usuario logueado
    const newAdjustment: BillingAdjustment = actionTarget.mode === 'condone'
      ? { type: 'condone', amount: getOutstandingAmount(actionTarget.billing), reason: actionReason || actionCausal, causal: actionCausal, by: actor, by_role: activeRole as any, at: now }
      : { type: 'amount_override', amount: Number(actionAmount), reason: actionReason || 'Ajuste manual', by: actor, by_role: activeRole as any, at: now }

    setBillings(prev => prev.map(b => {
      if (b.id !== actionTarget.billing.id) return b
      if (actionTarget.mode === 'condone') {
        return { ...b, status: 'condoned' as BillingStatus, adjustments: [...(b.adjustments ?? []), newAdjustment] }
      } else {
        return { ...b, amount_final: Number(actionAmount), adjustments: [...(b.adjustments ?? []), newAdjustment] }
      }
    }))

    // PRODUCCIÓN: persistir condonación/ajuste en Supabase (club real)
    if (isRealClub(club.id)) {
      persistBillingUpdate(club.id, actionTarget.billing.id,
        actionTarget.mode === 'condone'
          ? { status: 'condoned', adjustment: newAdjustment }
          : { amount_final: Number(actionAmount), adjustment: newAdjustment }
      ).then(res => { if (!res.ok) console.error('No se pudo persistir el ajuste:', res.error) })
    }
    setActionTarget(null)
  }

  useEffect(() => {
    if (isRealClub(club.id)) {
      setBillings(getRealBillings(club.id) ?? [])
    } else {
      setBillings(generateBillingsForPeriod(period, today, cfg))
    }
    setGenerated(true)
  }, [period, cfg, club.id])

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

  async function regenerate() {
    if (isRealClub(club.id)) {
      await hydrateBillings(club.id, period)
      setBillings(getRealBillings(club.id) ?? [])
      alert(`✅ Cuotas actualizadas desde Supabase para ${period}.`)
      return
    }
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

  function emailToOverdue() {
    const overdues = billings.filter(b => b.status !== 'paid')
    if (overdues.length === 0) {
      alert('No hay deudores para notificar.')
      return
    }
    alert(`✉️ Email masivo encolado a ${overdues.length} familias deudoras (demo)\n\nMonto total a recuperar: $${counts.total_pending.toLocaleString('es-AR')}\n\nWhatsApp individual disponible en cada fila.`)
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

      {/* CTA principal — cobrar cuota directo desde acá */}
      <Link href="/caja/cobrar"
        className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 shadow-md"
        style={{ backgroundColor: '#00843D' }}
      >
        <CreditCard size={22} /> COBRAR CUOTA
      </Link>

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
        <button onClick={emailToOverdue} className="py-2 rounded-lg text-[11px] font-bold text-white flex items-center justify-center gap-1" style={{ backgroundColor: '#1d4ed8' }}>
          <Mail size={12} /> Email a deudores
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
          const outstanding = getOutstandingAmount(b)
          const isAdjustable = b.status !== 'paid' && b.status !== 'condoned'
          const wasOverridden = (b.adjustments ?? []).some(a => a.type === 'amount_override')
          return (
            <Card key={b.id} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${sCfg.color}` }}>
              <CardContent className="p-2.5 space-y-1.5">
                <div className="flex items-center gap-2">
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
                      {wasOverridden && (
                        <Badge variant="outline" className="text-[9px] text-blue-700 border-blue-200">Ajustada</Badge>
                      )}
                      {b.status === 'partial' && b.amount_paid > 0 && (
                        <Badge variant="outline" className="text-[9px] text-amber-700 border-amber-200">
                          Pagó ${b.amount_paid.toLocaleString('es-AR')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
                      ${(b.status === 'condoned' ? 0 : outstanding || b.amount_final + b.late_fee_amount).toLocaleString('es-AR')}
                    </p>
                    <Badge className="text-[9px] border-0 mt-0.5" style={{ backgroundColor: sCfg.bg, color: sCfg.color }}>
                      {sCfg.label}
                    </Badge>
                  </div>
                </div>

                {/* Última observación si está condonada o ajustada */}
                {b.adjustments && b.adjustments.length > 0 && (b.status === 'condoned' || wasOverridden) && (
                  <p className="text-[10px] text-muted-foreground italic truncate">
                    {(() => {
                      const last = b.adjustments[b.adjustments.length - 1]
                      return `${last.type === 'condone' ? '🚫 Condonado' : '✏️ Ajustado'}: ${last.causal ?? last.reason} · ${last.by}`
                    })()}
                  </p>
                )}

                {/* Acciones */}
                {isAdjustable && (
                  <div className="flex items-center gap-1 pt-1">
                    <a
                      href={`https://wa.me/${(player?.tutor_whatsapp ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(buildReminderMessage(player?.full_name ?? '', outstanding, cfg.overdue_day - 1))}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 py-1 rounded text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 flex items-center justify-center gap-1"
                    >
                      <MessageCircle size={11} /> WhatsApp
                    </a>
                    {canAdjust && (
                      <>
                        <button onClick={() => openAdjust(b)} className="flex-1 py-1 rounded text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center justify-center gap-1">
                          <Edit2 size={11} /> Ajustar
                        </button>
                        <button onClick={() => openCondone(b)} className="flex-1 py-1 rounded text-[10px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1">
                          <Ban size={11} /> Condonar
                        </button>
                      </>
                    )}
                  </div>
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

      {/* Modal Condonar / Ajustar */}
      {actionTarget && (() => {
        const player = demoPlayers.find(p => p.id === actionTarget.billing.player_id)
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={() => setActionTarget(null)}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-1.5" style={{ fontFamily: 'var(--font-barlow)' }}>
                  {actionTarget.mode === 'condone' ? <><Ban size={18} /> CONDONAR CUOTA</> : <><Edit2 size={18} /> AJUSTAR IMPORTE</>}
                </h3>
                <button onClick={() => setActionTarget(null)}><X size={20} /></button>
              </div>

              <Card className="border-0 bg-gray-50">
                <CardContent className="p-2.5">
                  <p className="text-sm font-semibold">{player?.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">Cuota {actionTarget.billing.period} · ${(actionTarget.billing.amount_final + actionTarget.billing.late_fee_amount).toLocaleString('es-AR')}</p>
                </CardContent>
              </Card>

              {actionTarget.mode === 'condone' ? (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Causal</label>
                    <select value={actionCausal} onChange={e => setActionCausal(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                      {CONDONE_CAUSALES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Observación (opcional)</label>
                    <textarea value={actionReason} onChange={e => setActionReason(e.target.value)}
                      placeholder="Detalle del motivo..." rows={2}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded p-2 italic">
                    La cuota quedará registrada como condonada con tu nombre y la fecha. Queda en el log de auditoría.
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Nuevo importe</label>
                    <input type="number" value={actionAmount} onChange={e => setActionAmount(e.target.value)}
                      className="w-full px-3 py-3 border rounded-lg text-2xl font-bold text-center" />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Original: ${actionTarget.billing.amount_original.toLocaleString('es-AR')} · Actual: ${actionTarget.billing.amount_final.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-muted-foreground mb-1 block">Motivo *</label>
                    <input type="text" value={actionReason} onChange={e => setActionReason(e.target.value)}
                      placeholder="Ej: Asistió 15 días, beca parcial..."
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <button onClick={() => setActionTarget(null)} className="flex-1 py-2.5 rounded-lg border-2 font-bold text-sm">Cancelar</button>
                <button onClick={applyAction}
                  disabled={actionTarget.mode === 'adjust' && !actionReason.trim()}
                  className="flex-[2] py-2.5 rounded-lg text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: actionTarget.mode === 'condone' ? '#6b7280' : '#1d4ed8' }}>
                  <Check size={14} /> Confirmar
                </button>
              </div>
            </div>
          </div>
        )
      })()}
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
