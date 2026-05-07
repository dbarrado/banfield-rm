'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Copy, MessageCircle, Mail, CheckCircle2, Clock, XCircle, Lock, Trophy } from 'lucide-react'
import { useCurrentClub } from '@/lib/use-current-club'
import { getReferralActivationStatus, getReferralProgress, REFERRAL_MILESTONES, getReferredPlanLabel } from '@/lib/referrals'
import { demoClubs } from '@/lib/clubs'

export default function InvitarPage() {
  const club = useCurrentClub()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const fullClub = demoClubs.find(c => c.id === club.id)
  if (!fullClub) return null

  const activation = getReferralActivationStatus(fullClub.first_payment_at)
  const progress = getReferralProgress(club.id)

  const referralCode = fullClub.referral_code
  const referralLink = `https://plantel.app/r/${referralCode}`

  function copy(value: string, type: 'code' | 'link') {
    navigator.clipboard.writeText(value)
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  const waMessage = `Hola! Te paso Plantel, es lo que uso para gestionar mi club. Maneja socios, asistencia, partidos, cobros, todo en un lugar.

Tenés 7 días gratis para probarlo, y si entrás con mi código te incluyen el setup gratis y 10% off los primeros 3 meses.

📲 ${referralLink}

Cualquier cosa me decís y te ayudo.`

  const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`
  const mailLink = `mailto:?subject=${encodeURIComponent('Te paso un sistema que puede servirte para tu club')}&body=${encodeURIComponent(waMessage)}`

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Gift size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          INVITAR CLUB
        </h1>
        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-0">EMBAJADOR</Badge>
      </div>

      {!activation.active ? (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-center space-y-2">
            <Lock size={24} className="mx-auto text-amber-600" />
            <p className="text-sm font-bold text-amber-800">El programa se activa en {activation.days_to_activation} día{activation.days_to_activation === 1 ? '' : 's'}</p>
            <p className="text-xs text-amber-700">
              Llevás <strong>{activation.days_since_first_payment} días</strong> usando Plantel. A partir del día 15 vas a poder invitar a otros clubes y ganar meses gratis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats arriba */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Referidos</p>
                <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                  {progress.successful}
                </p>
                <p className="text-[10px] text-muted-foreground">exitosos</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Bonificación</p>
                <p className="text-2xl font-bold mt-0.5 text-amber-700" style={{ fontFamily: "var(--font-barlow)" }}>
                  {progress.total_bonus_months}
                </p>
                <p className="text-[10px] text-muted-foreground">meses gratis</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-2.5 text-center">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground">En trial</p>
                <p className="text-2xl font-bold mt-0.5 text-blue-600" style={{ fontFamily: "var(--font-barlow)" }}>
                  {progress.inTrial}
                </p>
                <p className="text-[10px] text-muted-foreground">esperando</p>
              </CardContent>
            </Card>
          </div>

          {/* Roadmap de hitos */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center gap-1.5">
                <Trophy size={14} style={{ color: 'var(--club-primary, #00843D)' }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--font-barlow)" }}>
                  Hitos del programa
                </p>
              </div>

              {/* Próximo hito */}
              {progress.next_milestone && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800">
                      {progress.next_milestone.emoji} Próximo: {progress.next_milestone.label}
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">
                      {progress.successful}/{progress.next_milestone.threshold}
                    </span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${progress.progress_to_next * 100}%` }} />
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Te {progress.referrals_to_next === 1 ? 'falta 1 referido' : `faltan ${progress.referrals_to_next} referidos`} para: <strong>{progress.next_milestone.description}</strong>
                  </p>
                </div>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded p-2 text-[11px] text-purple-800">
                <p className="font-semibold flex items-center gap-1">🛍️ Sobre el add-on Tienda</p>
                <p className="text-purple-700 mt-0.5 leading-relaxed">
                  Tu bonificación cubre tu plan base. Si el referido contrata <strong>Pro + Tienda</strong>, tu mes bonificado <strong>incluye Tienda</strong>. Si contrata solo Club o Pro sin Tienda, la bonificación es del plan base.
                </p>
              </div>

              {/* Lista de hitos */}
              <div className="space-y-1.5">
                {REFERRAL_MILESTONES.map(m => {
                  const reached = progress.successful >= m.threshold
                  const isPro = m.unlocks_pro && club.plan !== 'club'  // Si ya es Pro, el premio Pro no aplica
                  return (
                    <div
                      key={m.level}
                      className={`flex items-center gap-2.5 p-2 rounded-lg ${reached ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${reached ? 'bg-green-500' : 'bg-gray-300'}`}>
                        {reached ? <CheckCircle2 size={18} className="text-white" /> : <span>{m.emoji}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold">{m.threshold}</span>
                          <span className="text-xs">{m.label}</span>
                          {reached && <Badge className="text-[9px] bg-green-600 text-white border-0">DESBLOQUEADO</Badge>}
                          {isPro && !reached && <Badge variant="outline" className="text-[9px] text-muted-foreground">N/A — ya sos Pro</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tu código y link */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Tu código
              </p>
              <button onClick={() => copy(referralCode, 'code')} className="w-full p-3 rounded-lg border-2 border-dashed flex items-center justify-between hover:bg-gray-50">
                <span className="font-mono font-bold text-base tracking-wider" style={{ color: 'var(--club-primary, #00843D)' }}>
                  {referralCode}
                </span>
                {copied === 'code' ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-1" style={{ fontFamily: "var(--font-barlow)" }}>
                Tu link
              </p>
              <button onClick={() => copy(referralLink, 'link')} className="w-full p-2.5 rounded-lg border flex items-center justify-between gap-2 hover:bg-gray-50">
                <span className="font-mono text-xs truncate text-blue-600">{referralLink}</span>
                {copied === 'link' ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" /> : <Copy size={14} className="text-muted-foreground flex-shrink-0" />}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={mailLink} className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-semibold text-sm hover:bg-gray-50">
                  <Mail size={16} /> Email
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Mis referidos */}
          {progress.referrals.length > 0 && (
            <>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
                Mis referidos ({progress.total})
              </h2>
              <div className="space-y-2">
                {progress.referrals.map(r => {
                  const config = {
                    successful:  { icon: CheckCircle2, color: '#00843D', label: 'Pagó mes 1' },
                    in_trial:    { icon: Clock,         color: '#F59E0B', label: 'En trial 7d' },
                    cancelled:   { icon: XCircle,       color: '#DC2626', label: 'Canceló' },
                    registered:  { icon: Clock,         color: '#9ca3af', label: 'Registrado' },
                  }[r.status]
                  const Icon = config.icon
                  const includesShop = r.referred_plan === 'pro_plus_shop'
                  const isSuccessful = r.status === 'successful'
                  return (
                    <Card key={r.id} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${config.color}` }}>
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <Icon size={18} style={{ color: config.color }} className="flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{r.referred_club_name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {config.label} · {new Date(r.referred_at).toLocaleDateString('es-AR')}
                            </p>
                          </div>
                          {isSuccessful && (
                            <Badge className="text-[10px] border-0" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                              +1 mes
                            </Badge>
                          )}
                        </div>
                        {isSuccessful && r.referred_plan && (
                          <div className="flex items-center gap-1.5 ml-7 text-[10px]">
                            <span className="text-muted-foreground">Contrató:</span>
                            <Badge variant="outline" className="text-[9px]">
                              {getReferredPlanLabel(r.referred_plan)}
                            </Badge>
                            {includesShop ? (
                              <Badge className="text-[9px] bg-purple-100 text-purple-700 border-0">
                                ✓ Tu bonificación incluye Tienda
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic">Bonificación sin Tienda</span>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
