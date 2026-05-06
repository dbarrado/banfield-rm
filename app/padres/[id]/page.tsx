'use client'

import { useState, use, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileCheck, FileWarning, Upload, Receipt, Clock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoPlayers, demoCategories, demoPayments } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, POSITION_LABELS, POSITION_COLORS } from '@/types'

export default function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const player = demoPlayers.find(p => p.id === id)
  if (!player) notFound()

  const [aptoFile, setAptoFile] = useState<string | null>(null)
  const [aptoStatus, setAptoStatus] = useState<'none' | 'pending' | 'approved'>(player!.apto_medico_ok ? 'approved' : 'none')
  const [paymentReceipt, setPaymentReceipt] = useState<{ status: 'pending' | 'approved'; amount: number; date: string } | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const aptoRef = useRef<HTMLInputElement>(null)

  const cat = demoCategories.find(c => c.id === player!.category_id)
  const payments = demoPayments.filter(p => p.player_id === player!.id).sort((a, b) => b.paid_at.localeCompare(a.paid_at))

  function handleAptoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setAptoFile(ev.target?.result as string)
      setAptoStatus('pending')
    }
    reader.readAsDataURL(f)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white p-4 pb-6" style={{ background: `linear-gradient(135deg, ${TIRA_COLORS[player!.tira]} 0%, ${TIRA_COLORS[player!.tira]}dd 100%)` }}>
        <Link href="/padres" className="text-white/80 text-xs flex items-center gap-1 mb-3">
          <ArrowLeft size={12} /> Mis hijos
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-white flex items-center justify-center text-2xl font-bold" style={{ color: TIRA_COLORS[player!.tira], fontFamily: "var(--font-barlow)" }}>
            {player!.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{player!.full_name.toUpperCase()}</h1>
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                Cat. {cat?.name}
              </Badge>
              <Badge className="text-white border-0 text-[10px]" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
                {TIRA_LABELS[player!.tira]}
              </Badge>
              <Badge className="text-white border-0 text-[10px] font-bold" style={{ backgroundColor: POSITION_COLORS[player!.primary_position] }}>
                {POSITION_LABELS[player!.primary_position]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 -mt-3">
        {/* Apto médico */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              APTO MÉDICO
            </p>
            {aptoStatus === 'approved' && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <FileCheck size={18} className="text-green-600" />
                <span>Aprobado · vence 31/12/2026</span>
              </div>
            )}
            {aptoStatus === 'pending' && (
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Clock size={18} className="text-amber-500" />
                <span>Pendiente de revisión por administración</span>
              </div>
            )}
            {aptoStatus === 'none' && (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                <FileWarning size={18} className="text-red-500" />
                <span>Sin apto médico cargado</span>
              </div>
            )}
            <button
              onClick={() => aptoRef.current?.click()}
              className="mt-2 w-full py-2 rounded-lg border-2 border-dashed text-xs font-semibold text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1.5"
            >
              <Upload size={14} /> {aptoStatus === 'none' ? 'Subir apto médico' : 'Subir nuevo apto'}
            </button>
            <input ref={aptoRef} type="file" accept="image/*,.pdf" onChange={handleAptoUpload} className="hidden" />
            {aptoFile && aptoStatus === 'pending' && (
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">📎 archivo cargado · esperando aprobación</p>
            )}
          </CardContent>
        </Card>

        {/* Pago por transferencia */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                PAGOS
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="text-xs font-semibold px-2.5 py-1 rounded text-white"
                style={{ backgroundColor: '#00843D' }}
              >
                + Cargar transf.
              </button>
            </div>
            {paymentReceipt && (
              <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700">Comprobante en revisión</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ${paymentReceipt.amount.toLocaleString('es-AR')} · {paymentReceipt.date}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              {payments.slice(0, 4).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                  <div>
                    <p className="text-xs font-medium">{p.fee_type === 'actividad' ? 'Cuota' : 'Matrícula'} · {p.period}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(p.paid_at).toLocaleDateString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-green-600 text-sm">${p.amount.toLocaleString('es-AR')}</p>
                    <CheckCircle2 size={14} className="text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Datos */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              DATOS
            </p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de nacimiento</span>
                <span className="font-semibold">{new Date(player!.birth_date).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DNI</span>
                <span className="font-semibold">{player!.dni}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoría</span>
                <span className="font-semibold">{cat?.name} · {TIRA_LABELS[player!.tira]}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPaymentModal && (
        <PaymentReceiptModal
          onClose={() => setShowPaymentModal(false)}
          onSubmit={(data) => {
            setPaymentReceipt({ status: 'pending', amount: data.amount, date: data.date })
            setShowPaymentModal(false)
          }}
        />
      )}
    </div>
  )
}

function PaymentReceiptModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: { amount: number; date: string }) => void }) {
  const [amount, setAmount] = useState('62000')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [file, setFile] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({ amount: Number(amount), date })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>CARGAR COMPROBANTE</h3>
          <button onClick={onClose}>×</button>
        </div>
        <p className="text-xs text-muted-foreground">El admin revisará y confirmará el pago en las próximas horas.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Monto *</label>
            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Fecha de transferencia *</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">N° de operación / referencia *</label>
            <input type="text" required value={reference} onChange={e => setReference(e.target.value)} placeholder="Ej: MP-12345" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Comprobante (foto o PDF)</label>
            <label className="block w-full py-3 rounded-lg border-2 border-dashed text-center text-xs text-muted-foreground cursor-pointer hover:bg-gray-50">
              <Upload size={16} className="inline mr-1" />
              {file ? '📎 Archivo cargado' : 'Subir foto o PDF del comprobante'}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f.name)
              }} />
            </label>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
            ENVIAR A REVISIÓN
          </button>
        </form>
      </div>
    </div>
  )
}
