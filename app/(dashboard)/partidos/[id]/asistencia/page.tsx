'use client'

import { useState, use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trophy, CheckCircle2, XCircle, AlertCircle, Clock, MessageCircle, X } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, demoCategories, demoPlayers } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_COLORS, TIRA_LABELS } from '@/types'

type AvailabilityStatus =
  | 'pending'              // sin definir aún
  | 'confirmed'            // confirmó que va
  | 'unavailable_in_time'  // avisó a tiempo (durante semana) que no podía
  | 'unavailable_late'     // avisó tarde (cerca del partido)
  | 'present'              // asistió al partido
  | 'no_show'              // convocado y no se presentó

const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; icon: any }> = {
  pending:               { label: 'Sin definir',         color: '#9ca3af', icon: Clock },
  confirmed:             { label: 'Confirmado',          color: '#1d4ed8', icon: CheckCircle2 },
  unavailable_in_time:   { label: 'Baja a tiempo',       color: '#F59E0B', icon: AlertCircle },
  unavailable_late:      { label: 'Baja tarde',          color: '#DC2626', icon: AlertCircle },
  present:               { label: 'Presente al partido', color: '#00843D', icon: CheckCircle2 },
  no_show:               { label: 'No se presentó',      color: '#7c2d12', icon: XCircle },
}

export default function AsistenciaPartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()

  const cat = demoCategories.find(c => c.id === event!.category_id)
  const initialConvocados = demoPlayers.filter(p => p.category_id === event!.category_id).slice(0, 14)

  const [statuses, setStatuses] = useState<Record<string, AvailabilityStatus>>(() => {
    const init: Record<string, AvailabilityStatus> = {}
    initialConvocados.forEach((p, i) => {
      init[p.id] = i < 2 ? 'unavailable_in_time' : i === 2 ? 'unavailable_late' : 'confirmed'
    })
    return init
  })
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [phase, setPhase] = useState<'pre' | 'matchday'>('pre')

  function setStatus(playerId: string, status: AvailabilityStatus, reason?: string) {
    setStatuses({ ...statuses, [playerId]: status })
    if (reason) setReasons({ ...reasons, [playerId]: reason })
    setEditing(null)
  }

  const counts = {
    confirmed: Object.values(statuses).filter(s => s === 'confirmed' || s === 'present').length,
    bajas: Object.values(statuses).filter(s => s === 'unavailable_in_time' || s === 'unavailable_late').length,
    presentes: Object.values(statuses).filter(s => s === 'present').length,
    noShow: Object.values(statuses).filter(s => s === 'no_show').length,
  }

  return (
    <div className="pb-4">
      <div className="text-white p-4 pb-6" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}>
        <Link href={`/partidos/${id}`} className="text-white/80 text-xs flex items-center gap-1 mb-2">
          <ArrowLeft size={12} /> Volver al partido
        </Link>
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
            ASISTENCIA — vs. {event!.rival}
          </h1>
        </div>
        <p className="text-xs text-white/80 mt-1">Cat. {cat?.name} · {new Date(event!.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
      </div>

      <div className="p-3 space-y-3 -mt-3">
        {/* Toggle de fase */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button onClick={() => setPhase('pre')}
            className={`flex-1 py-2 rounded-md text-xs font-bold ${phase === 'pre' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            🗓️ Pre-partido (semana)
          </button>
          <button onClick={() => setPhase('matchday')}
            className={`flex-1 py-2 rounded-md text-xs font-bold ${phase === 'matchday' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
            ⚽ Día del partido
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-1.5">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Convocados</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{initialConvocados.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] text-blue-600">Confirmados</p>
              <p className="text-lg font-bold text-blue-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.confirmed}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] text-amber-600">Bajas</p>
              <p className="text-lg font-bold text-amber-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.bajas}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2 text-center">
              <p className="text-[9px] text-green-600">Presentes</p>
              <p className="text-lg font-bold text-green-600" style={{ fontFamily: "var(--font-barlow)" }}>{counts.presentes}</p>
            </CardContent>
          </Card>
        </div>

        <p className="text-[11px] text-muted-foreground">
          {phase === 'pre'
            ? 'Tap para marcar bajas durante la semana — distinguí si avisaron a tiempo o tarde.'
            : 'Día del partido: marcá quién se presentó y quién no.'}
        </p>

        {/* Lista */}
        <div className="space-y-2">
          {initialConvocados.map(p => {
            const status = statuses[p.id] ?? 'pending'
            const cfg = STATUS_CONFIG[status]
            const Icon = cfg.icon
            return (
              <Card key={p.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${cfg.color}` }}>
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: cfg.color }}>
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.full_name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                          {POSITION_LABELS[p.primary_position]}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[p.tira] }}>
                          {TIRA_LABELS[p.tira]}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Icon size={14} style={{ color: cfg.color }} />
                      <span className="text-[11px] font-semibold hidden sm:inline" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                  </div>

                  {reasons[p.id] && (
                    <p className="text-[11px] text-muted-foreground mt-1 ml-12 italic">"{reasons[p.id]}"</p>
                  )}

                  {/* Botones de acción */}
                  <div className="flex gap-1 mt-2">
                    {phase === 'pre' ? (
                      <>
                        <button onClick={() => setStatus(p.id, 'confirmed')}
                          className={`flex-1 py-1 text-[10px] font-semibold rounded border ${status === 'confirmed' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                          style={status === 'confirmed' ? { backgroundColor: '#1d4ed8' } : {}}>
                          ✓ Confirmado
                        </button>
                        <button onClick={() => setEditing(p.id)}
                          className={`flex-1 py-1 text-[10px] font-semibold rounded border ${(status === 'unavailable_in_time' || status === 'unavailable_late') ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                          style={status === 'unavailable_in_time' ? { backgroundColor: '#F59E0B' } : status === 'unavailable_late' ? { backgroundColor: '#DC2626' } : {}}>
                          Marcar baja
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setStatus(p.id, 'present')}
                          className={`flex-1 py-1 text-[10px] font-semibold rounded border ${status === 'present' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                          style={status === 'present' ? { backgroundColor: '#00843D' } : {}}>
                          ✓ Presente
                        </button>
                        <button onClick={() => setStatus(p.id, 'no_show')}
                          className={`flex-1 py-1 text-[10px] font-semibold rounded border ${status === 'no_show' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                          style={status === 'no_show' ? { backgroundColor: '#7c2d12' } : {}}>
                          ✗ No vino
                        </button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Botón guardar */}
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm sticky bottom-20 md:bottom-4"
          style={{ backgroundColor: '#00843D' }}
          onClick={() => alert(`✅ Asistencia guardada (demo)\n\n${counts.presentes} presentes · ${counts.bajas} bajas · ${counts.noShow} no shows`)}
        >
          GUARDAR
        </button>
      </div>

      {/* Modal de baja */}
      {editing && (
        <BajaModal
          player={initialConvocados.find(p => p.id === editing)!}
          onClose={() => setEditing(null)}
          onConfirm={(timing, reason) => {
            setStatus(editing, timing === 'in_time' ? 'unavailable_in_time' : 'unavailable_late', reason)
          }}
        />
      )}
    </div>
  )
}

function BajaModal({ player, onClose, onConfirm }: {
  player: any
  onClose: () => void
  onConfirm: (timing: 'in_time' | 'late', reason: string) => void
}) {
  const [timing, setTiming] = useState<'in_time' | 'late'>('in_time')
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>MARCAR BAJA</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-sm text-muted-foreground">{player.full_name}</p>

        <div>
          <p className="text-xs font-semibold mb-2">¿Cuándo avisó?</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setTiming('in_time')}
              className={`py-3 rounded-lg text-xs font-semibold border ${timing === 'in_time' ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={timing === 'in_time' ? { backgroundColor: '#F59E0B' } : {}}>
              <AlertCircle size={14} className="inline mr-1" />
              <strong>A tiempo</strong>
              <p className="text-[10px] mt-0.5 font-normal opacity-90">Avisó durante la semana</p>
            </button>
            <button onClick={() => setTiming('late')}
              className={`py-3 rounded-lg text-xs font-semibold border ${timing === 'late' ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={timing === 'late' ? { backgroundColor: '#DC2626' } : {}}>
              <AlertCircle size={14} className="inline mr-1" />
              <strong>Tarde</strong>
              <p className="text-[10px] mt-0.5 font-normal opacity-90">Avisó muy cerca del partido</p>
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Motivo (opcional)</label>
          <input type="text" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Ej: cumpleaños familiar, viaje, lesionado..." className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <button onClick={() => onConfirm(timing, reason)}
          className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
          CONFIRMAR BAJA
        </button>
      </div>
    </div>
  )
}
