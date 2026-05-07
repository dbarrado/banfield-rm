'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Copy, MessageCircle, Mail, CheckCircle2, Clock, XCircle, Sparkles, Lock } from 'lucide-react'
import { useCurrentClub } from '@/lib/use-current-club'
import { getReferralActivationStatus, getReferralProgress } from '@/lib/referrals'
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

  const emailSubject = `Te paso un sistema que puede servirte para tu club`
  const emailBody = waMessage
  const mailLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

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
        // Estado bloqueado: día <15
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
          <CardContent className="p-4 text-center space-y-2">
            <Lock size={24} className="mx-auto text-amber-600" />
            <p className="text-sm font-bold text-amber-800">El programa se activa en {activation.days_to_activation} día{activation.days_to_activation === 1 ? '' : 's'}</p>
            <p className="text-xs text-amber-700">
              Llevás <strong>{activation.days_since_first_payment} días</strong> usando Plantel. A partir del día 15 vas a poder invitar a otros clubes y ganar 1 mes gratis por cada uno que se quede.
            </p>
            <p className="text-[11px] text-muted-foreground pt-1">
              Lo hacemos así para que tengas tiempo de probar todo bien antes de recomendarlo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Card de progreso a Pro */}
          {!progress.reached_pro && club.plan === 'club' && (
            <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #C9A84C', background: 'linear-gradient(135deg, #fef3c7 0%, white 100%)' }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800" style={{ fontFamily: "var(--font-barlow)" }}>
                      🚀 Subí a Pro gratis
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Te faltan {progress.needs_for_pro} club{progress.needs_for_pro === 1 ? '' : 'es'} para acceder a Plan Pro sin costo
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-amber-700" style={{ fontFamily: "var(--font-barlow)" }}>
                    {progress.successful}/3
                  </p>
                </div>
                <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${progress.progress_to_pro * 100}%` }} />
                </div>
              </CardContent>
            </Card>
          )}

          {progress.reached_pro && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-100 to-pink-50">
              <CardContent className="p-3 flex items-center gap-2">
                <Sparkles size={20} className="text-purple-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-purple-800">¡Llegaste a 3 referidos!</p>
                  <p className="text-[11px] text-purple-700">Subí a Plan Pro sin costo · Mantené 3 referidos activos para conservarlo</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tu código y link */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Tu código
              </p>
              <button
                onClick={() => copy(referralCode, 'code')}
                className="w-full p-3 rounded-lg border-2 border-dashed flex items-center justify-between hover:bg-gray-50"
              >
                <span className="font-mono font-bold text-base tracking-wider" style={{ color: 'var(--club-primary, #00843D)' }}>
                  {referralCode}
                </span>
                {copied === 'code' ? <CheckCircle2 size={16} className="text-green-600" /> : <Copy size={14} className="text-muted-foreground" />}
              </button>

              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-1" style={{ fontFamily: "var(--font-barlow)" }}>
                Tu link
              </p>
              <button
                onClick={() => copy(referralLink, 'link')}
                className="w-full p-2.5 rounded-lg border flex items-center justify-between gap-2 hover:bg-gray-50"
              >
                <span className="font-mono text-xs truncate text-blue-600">{referralLink}</span>
                {copied === 'link' ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" /> : <Copy size={14} className="text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Botones de compartir */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#25D366' }}>
                  <MessageCircle size={16} /> WhatsApp
                </a>
                <a href={mailLink}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 font-semibold text-sm hover:bg-gray-50">
                  <Mail size={16} /> Email
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Cómo funciona */}
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Cómo funciona
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg leading-none" style={{ color: 'var(--club-primary, #00843D)' }}>1.</span>
                  <p>Compartís tu link con otros clubes</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg leading-none" style={{ color: 'var(--club-primary, #00843D)' }}>2.</span>
                  <p>Tienen 7 días gratis. Si se quedan después y pagan su 1° mes...</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg leading-none" style={{ color: 'var(--club-primary, #00843D)' }}>3.</span>
                  <p>Te bonificamos <strong>1 mes</strong> de tu plan actual. Por cada uno.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg leading-none">🎁</span>
                  <p><strong>3 referidos exitosos</strong> = upgrade a <strong>Plan Pro</strong> sin costo (si estás en Club)</p>
                </div>
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
                    successful:  { icon: CheckCircle2, color: '#00843D', label: 'Pagó mes 1', reward: '+1 mes' },
                    in_trial:    { icon: Clock,         color: '#F59E0B', label: 'En trial 7d', reward: 'Pendiente' },
                    cancelled:   { icon: XCircle,       color: '#DC2626', label: 'Canceló',     reward: '—' },
                    registered:  { icon: Clock,         color: '#9ca3af', label: 'Registrado',  reward: 'Pendiente' },
                  }[r.status]
                  const Icon = config.icon
                  return (
                    <Card key={r.id} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${config.color}` }}>
                      <CardContent className="p-2.5 flex items-center gap-2.5">
                        <Icon size={18} style={{ color: config.color }} className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{r.referred_club_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {config.label} · invitado el {new Date(r.referred_at).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <Badge className="text-[10px] border-0" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
                          {config.reward}
                        </Badge>
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
