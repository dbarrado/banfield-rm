'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ClipboardList, AlertTriangle, CheckCircle2, XCircle, Eye, Check, X, GitMerge,
  Phone, Mail, FileCheck, FileWarning, Calendar, MapPin
} from 'lucide-react'
import {
  getAllPendingRegistrations,
  updatePendingRegistration,
} from '@/lib/registration'
import { demoCategories, demoPlayers } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { POSITION_LABELS } from '@/types'
import type { PendingRegistration, Player } from '@/types'

type Tab = 'pending' | 'duplicates' | 'approved' | 'rejected'

const TUTOR_REL_LABELS: Record<string, string> = {
  padre: 'Padre', madre: 'Madre', tutor: 'Tutor', abuelo: 'Abuelo/a', otro: 'Otro',
}

export default function InscripcionesPage() {
  const club = useCurrentClub()
  const [tab, setTab] = useState<Tab>('pending')
  const [list, setList] = useState<PendingRegistration[]>([])
  const [tick, setTick] = useState(0)
  const [detail, setDetail] = useState<PendingRegistration | null>(null)
  const [mergeFor, setMergeFor] = useState<PendingRegistration | null>(null)
  const [rejectFor, setRejectFor] = useState<PendingRegistration | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    setList(getAllPendingRegistrations().filter(r => r.club_id === club.id))
  }, [club.id, tick])

  const filtered = useMemo(() => {
    if (tab === 'pending') return list.filter(r => r.status === 'pending' && !r.duplicate_of_player_id)
    if (tab === 'duplicates') return list.filter(r => r.status === 'pending' && r.duplicate_of_player_id)
    if (tab === 'approved') return list.filter(r => r.status === 'approved' || r.status === 'merged')
    return list.filter(r => r.status === 'rejected')
  }, [list, tab])

  const counts = useMemo(() => ({
    pending: list.filter(r => r.status === 'pending' && !r.duplicate_of_player_id).length,
    duplicates: list.filter(r => r.status === 'pending' && r.duplicate_of_player_id).length,
    approved: list.filter(r => r.status === 'approved' || r.status === 'merged').length,
    rejected: list.filter(r => r.status === 'rejected').length,
  }), [list])

  function approve(r: PendingRegistration) {
    updatePendingRegistration(r.id, {
      status: 'approved',
      reviewed_by: 'admin',
      reviewed_at: new Date().toISOString(),
    })
    setTick(t => t + 1)
    setDetail(null)
    alert(`✅ ${r.full_name} aprobado.\n(Demo: en producción se crea el Player + TutorUser + TutorPlayerLink)`)
  }

  function doMerge(r: PendingRegistration, _picks: Record<string, 'existing' | 'new'>) {
    updatePendingRegistration(r.id, {
      status: 'merged',
      reviewed_by: 'admin',
      reviewed_at: new Date().toISOString(),
    })
    setTick(t => t + 1)
    setMergeFor(null)
    setDetail(null)
    alert(`🔀 ${r.full_name} fusionado con socio existente.\n(Demo: en producción se actualiza el Player con los campos elegidos.)`)
  }

  function doReject(r: PendingRegistration) {
    if (!rejectReason.trim()) return alert('Indicá un motivo')
    updatePendingRegistration(r.id, {
      status: 'rejected',
      reviewed_by: 'admin',
      reviewed_at: new Date().toISOString(),
      rejection_reason: rejectReason.trim(),
    })
    setTick(t => t + 1)
    setRejectFor(null)
    setRejectReason('')
    setDetail(null)
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <ClipboardList size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
        <h1 className="text-2xl font-bold truncate" style={{ fontFamily: 'var(--font-barlow)', color: 'var(--club-primary, #00843D)' }}>
          INSCRIPCIONES
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <TabBtn active={tab === 'pending'} onClick={() => setTab('pending')}
          label="Pendientes" emoji="🟡" count={counts.pending} />
        <TabBtn active={tab === 'duplicates'} onClick={() => setTab('duplicates')}
          label="Duplicados" emoji="🔴" count={counts.duplicates} />
        <TabBtn active={tab === 'approved'} onClick={() => setTab('approved')}
          label="Aprobados" emoji="🟢" count={counts.approved} />
        <TabBtn active={tab === 'rejected'} onClick={() => setTab('rejected')}
          label="Rechazados" emoji="🚫" count={counts.rejected} />
      </div>

      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay inscripciones en esta categoría.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map(r => {
          const cat = demoCategories.find(c => c.id === r.category_id)
          const dupPlayer = r.duplicate_of_player_id ? demoPlayers.find(p => p.id === r.duplicate_of_player_id) : null
          return (
            <Card key={r.id} className="border-0 shadow-sm">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{r.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      DNI {r.dni} · Cat. {cat?.name ?? r.category_id} · {POSITION_LABELS[r.primary_position]}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Tutor: {r.tutor_full_name} ({TUTOR_REL_LABELS[r.tutor_relation]}) · {r.tutor_whatsapp}
                    </p>
                  </div>
                  {dupPlayer && (
                    <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] flex-shrink-0">
                      <AlertTriangle size={10} className="mr-0.5" /> Duplicado
                    </Badge>
                  )}
                  {r.status === 'approved' && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] flex-shrink-0">
                      <CheckCircle2 size={10} className="mr-0.5" /> Aprobado
                    </Badge>
                  )}
                  {r.status === 'merged' && (
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] flex-shrink-0">
                      <GitMerge size={10} className="mr-0.5" /> Fusionado
                    </Badge>
                  )}
                  {r.status === 'rejected' && (
                    <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] flex-shrink-0">
                      <XCircle size={10} className="mr-0.5" /> Rechazado
                    </Badge>
                  )}
                </div>

                {dupPlayer && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-[11px]">
                    <p className="font-semibold text-red-700">⚠️ Coincide DNI con socio existente</p>
                    <p className="text-red-600">
                      {dupPlayer.full_name} (ID {dupPlayer.id}) · DNI {dupPlayer.dni}
                    </p>
                  </div>
                )}

                {r.status === 'rejected' && r.rejection_reason && (
                  <p className="text-[11px] text-red-600 italic">Motivo: {r.rejection_reason}</p>
                )}

                {r.status === 'pending' && (
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => setDetail(r)}
                      className="flex-1 text-[11px] py-1.5 rounded border bg-white text-gray-700 font-semibold flex items-center justify-center gap-1"
                    >
                      <Eye size={11} /> Ver
                    </button>
                    {dupPlayer ? (
                      <button
                        onClick={() => setMergeFor(r)}
                        className="flex-1 text-[11px] py-1.5 rounded text-white font-semibold flex items-center justify-center gap-1 bg-blue-600"
                      >
                        <GitMerge size={11} /> Fusionar
                      </button>
                    ) : (
                      <button
                        onClick={() => approve(r)}
                        className="flex-1 text-[11px] py-1.5 rounded text-white font-semibold flex items-center justify-center gap-1 bg-green-600"
                      >
                        <Check size={11} /> Aprobar
                      </button>
                    )}
                    <button
                      onClick={() => setRejectFor(r)}
                      className="flex-1 text-[11px] py-1.5 rounded border border-red-200 text-red-600 font-semibold flex items-center justify-center gap-1"
                    >
                      <X size={11} /> Rechazar
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal: detalle */}
      {detail && (
        <Modal onClose={() => setDetail(null)} title="Detalle de inscripción">
          <DetailView reg={detail} />
        </Modal>
      )}

      {/* Modal: merge */}
      {mergeFor && (() => {
        const dup = demoPlayers.find(p => p.id === mergeFor.duplicate_of_player_id)
        if (!dup) return null
        return (
          <Modal onClose={() => setMergeFor(null)} title="Fusionar con socio existente">
            <MergeView reg={mergeFor} player={dup} onConfirm={picks => doMerge(mergeFor, picks)} />
          </Modal>
        )
      })()}

      {/* Modal: reject */}
      {rejectFor && (
        <Modal onClose={() => { setRejectFor(null); setRejectReason('') }} title="Rechazar inscripción">
          <div className="space-y-3">
            <p className="text-sm">¿Motivo del rechazo de <strong>{rejectFor.full_name}</strong>?</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
              placeholder="Ej: DNI inválido, foto ilegible, datos del tutor no coinciden..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectFor(null); setRejectReason('') }}
                className="flex-1 py-2 rounded-lg border text-sm font-semibold"
              >Cancelar</button>
              <button
                onClick={() => doReject(rejectFor)}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold"
              >Confirmar rechazo</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, label, emoji, count }: {
  active: boolean; onClick: () => void; label: string; emoji: string; count: number
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
        active ? 'border-current text-white' : 'border-gray-200 bg-white text-gray-600'
      }`}
      style={active ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
    >
      <span className="mr-1">{emoji}</span>
      {label} <span className="opacity-70">({count})</span>
    </button>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function DetailView({ reg }: { reg: PendingRegistration }) {
  const cat = demoCategories.find(c => c.id === reg.category_id)
  return (
    <div className="space-y-3 text-sm">
      <Section title="Jugador">
        <Row label="Nombre" value={reg.full_name} />
        <Row label="DNI" value={reg.dni} />
        <Row label="Nacimiento" value={reg.birth_date} icon={<Calendar size={11} />} />
        <Row label="Categoría" value={cat?.name ?? reg.category_id} />
        <Row label="Posición" value={POSITION_LABELS[reg.primary_position]} />
      </Section>
      <Section title="Tutor">
        <Row label="Nombre" value={reg.tutor_full_name} />
        <Row label="Relación" value={TUTOR_REL_LABELS[reg.tutor_relation]} />
        <Row label="DNI" value={reg.tutor_dni} />
        <Row label="WhatsApp" value={reg.tutor_whatsapp} icon={<Phone size={11} />} />
        <Row label="Email" value={reg.tutor_email ?? '—'} icon={<Mail size={11} />} />
      </Section>
      <Section title="Documentación">
        <div className="flex items-center gap-2 text-xs">
          {reg.apto_medico_url ? (
            <Badge className="bg-green-50 text-green-700 border-green-200"><FileCheck size={10} className="mr-0.5" /> Apto médico</Badge>
          ) : (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200"><FileWarning size={10} className="mr-0.5" /> Sin apto médico</Badge>
          )}
        </div>
      </Section>
      <Section title="Inscripción">
        <Row label="Código" value={reg.code_used} />
        <Row label="Recibida" value={new Date(reg.created_at).toLocaleString('es-AR')} />
      </Section>
    </div>
  )
}

function MergeView({ reg, player, onConfirm }: {
  reg: PendingRegistration; player: Player; onConfirm: (picks: Record<string, 'existing' | 'new'>) => void
}) {
  const fields: { key: string; label: string; existing: string; incoming: string }[] = [
    { key: 'full_name', label: 'Nombre', existing: player.full_name, incoming: reg.full_name },
    { key: 'dni', label: 'DNI', existing: player.dni ?? '—', incoming: reg.dni },
    { key: 'birth_date', label: 'Nacimiento', existing: player.birth_date, incoming: reg.birth_date },
    { key: 'tutor_name', label: 'Tutor', existing: player.tutor_name ?? '—', incoming: reg.tutor_full_name },
    { key: 'tutor_dni', label: 'DNI tutor', existing: player.tutor_dni ?? '—', incoming: reg.tutor_dni },
    { key: 'tutor_whatsapp', label: 'WhatsApp tutor', existing: player.tutor_whatsapp ?? '—', incoming: reg.tutor_whatsapp },
    { key: 'tutor_email', label: 'Email tutor', existing: player.tutor_email ?? '—', incoming: reg.tutor_email ?? '—' },
  ]
  const [picks, setPicks] = useState<Record<string, 'existing' | 'new'>>(
    Object.fromEntries(fields.map(f => [f.key, f.existing === f.incoming ? 'existing' : 'new']))
  )
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Elegí qué dato conservar para cada campo. El socio existente se actualiza con tu selección.
      </p>
      <div className="space-y-2">
        {fields.map(f => {
          const equal = f.existing === f.incoming
          return (
            <div key={f.key} className="border rounded-lg p-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{f.label}</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPicks(p => ({ ...p, [f.key]: 'existing' }))}
                  className={`text-left p-2 rounded border-2 text-xs ${
                    picks[f.key] === 'existing' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <p className="text-[9px] text-muted-foreground">Socio actual</p>
                  <p className="font-semibold truncate">{f.existing}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPicks(p => ({ ...p, [f.key]: 'new' }))}
                  className={`text-left p-2 rounded border-2 text-xs ${
                    picks[f.key] === 'new' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                  } ${equal ? 'opacity-60' : ''}`}
                >
                  <p className="text-[9px] text-muted-foreground">Nuevo</p>
                  <p className="font-semibold truncate">{f.incoming}</p>
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <button
        onClick={() => onConfirm(picks)}
        className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-barlow)' }}
      >
        Confirmar fusión
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{title}</p>
      <div className="space-y-1 bg-gray-50 rounded-lg p-2">{children}</div>
    </div>
  )
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground flex items-center gap-1">{icon}{label}</span>
      <span className="font-medium text-right truncate ml-2">{value}</span>
    </div>
  )
}
