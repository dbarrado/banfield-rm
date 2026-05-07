'use client'

import { use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, ArrowLeft, Share2, Download } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoPlayers, demoCategories, demoPayments, thisMonth } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS, POSITION_LABELS, POSITION_COLORS } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'

export default function CarnetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const player = demoPlayers.find(p => p.id === id)
  if (!player) notFound()

  const cat = demoCategories.find(c => c.id === player!.category_id)
  const paidThisMonth = demoPayments.some(p => p.player_id === player!.id && p.period === thisMonth && p.fee_type === 'actividad')
  const aptoOk = player!.apto_medico_ok
  const accessGranted = paidThisMonth && aptoOk

  // Generar payload del QR (en producción sería firma JWT con expiración)
  const qrPayload = {
    club: 'club-banfield-rm',
    player_id: player!.id,
    full_name: player!.full_name,
    dni: player!.dni,
    cat: cat?.name,
    paid: paidThisMonth,
    apto: aptoOk,
    valid_until: '2026-05-31',
  }
  const qrText = `PLANTEL|${qrPayload.player_id}|${qrPayload.dni}|${paidThisMonth ? 'OK' : 'NO'}|${aptoOk ? 'OK' : 'NO'}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}&color=${accessGranted ? '00843D' : 'DC2626'}&bgcolor=FFFFFF&margin=10`

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm space-y-3">
        {/* Header con back */}
        <div className="flex items-center justify-between">
          <Link href={`/socios/${player!.id}`} className="text-white text-xs flex items-center gap-1 px-2 py-1 rounded bg-black/20">
            <ArrowLeft size={12} /> Ficha
          </Link>
          <button onClick={() => alert('Compartir carnet (demo)')} className="text-white text-xs flex items-center gap-1 px-2 py-1 rounded bg-black/20">
            <Share2 size={12} /> Compartir
          </button>
        </div>

        {/* Carnet */}
        <div
          className="rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${TIRA_COLORS[player!.tira]} 0%, ${TIRA_COLORS[player!.tira]}dd 100%)` }}
        >
          {/* Header del club */}
          <div className="p-3 text-white text-center">
            <p className="text-[10px] uppercase tracking-widest opacity-80">Carnet de socio</p>
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-barlow)" }}>FILIAL BANFIELD RAMOS MEJÍA</p>
          </div>

          {/* Body blanco */}
          <div className="bg-white p-4 space-y-3">
            {/* Foto + datos */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 flex-shrink-0" style={{ borderColor: TIRA_COLORS[player!.tira] }}>
                <img src={getAvatarUrl(player!)} alt={player!.full_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
                  {player!.full_name.toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground">DNI: {player!.dni}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge className="text-[9px] text-white border-0" style={{ backgroundColor: TIRA_COLORS[player!.tira] }}>
                    {TIRA_LABELS[player!.tira]}
                  </Badge>
                  <Badge variant="outline" className="text-[9px]">Cat. {cat?.name}</Badge>
                  <Badge className="text-[9px] text-white border-0" style={{ backgroundColor: POSITION_COLORS[player!.primary_position] }}>
                    {POSITION_LABELS[player!.primary_position]}
                  </Badge>
                </div>
              </div>
            </div>

            {/* QR grande */}
            <div className="flex justify-center pt-1">
              <div className="p-3 rounded-lg border-4" style={{ borderColor: accessGranted ? '#00843D' : '#DC2626' }}>
                <img src={qrUrl} alt="QR del socio" className="w-48 h-48" />
              </div>
            </div>

            {/* Estado de acceso */}
            <div className={`rounded-xl p-3 text-center ${accessGranted ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {accessGranted ? (
                  <CheckCircle2 size={20} className="text-green-600" />
                ) : (
                  <XCircle size={20} className="text-red-600" />
                )}
                <p className={`text-base font-bold ${accessGranted ? 'text-green-700' : 'text-red-700'}`} style={{ fontFamily: "var(--font-barlow)" }}>
                  {accessGranted ? 'ACCESO HABILITADO' : 'ACCESO BLOQUEADO'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div className="flex items-center justify-center gap-1">
                  {paidThisMonth ? <CheckCircle2 size={11} className="text-green-600" /> : <XCircle size={11} className="text-red-500" />}
                  <span className={paidThisMonth ? 'text-green-700' : 'text-red-600'}>Cuota al día</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {aptoOk ? <CheckCircle2 size={11} className="text-green-600" /> : <XCircle size={11} className="text-red-500" />}
                  <span className={aptoOk ? 'text-green-700' : 'text-red-600'}>Apto médico</span>
                </div>
              </div>
            </div>

            {/* Validez */}
            <p className="text-center text-[10px] text-muted-foreground">
              Válido hasta {new Date('2026-05-31').toLocaleDateString('es-AR')} · Mostrá este QR al ingresar al club
            </p>
          </div>
        </div>

        <button className="w-full py-2.5 rounded-xl border-2 font-semibold text-sm bg-white flex items-center justify-center gap-1.5">
          <Download size={14} /> Guardar en wallet
        </button>
      </div>
    </div>
  )
}
