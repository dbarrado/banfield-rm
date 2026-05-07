'use client'

import { useState, use, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Clock, Gift, AlertCircle } from 'lucide-react'
import { findClubByReferralCode } from '@/lib/referrals'
import Image from 'next/image'

export default function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const referrer = findClubByReferralCode(code)

  useEffect(() => {
    // Setea cookie con el código (válida 30 días)
    if (referrer) {
      document.cookie = `referrer_code=${code}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
    }
  }, [code, referrer])

  if (!referrer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md border-0 shadow-lg">
          <CardContent className="p-6 text-center space-y-3">
            <AlertCircle size={40} className="mx-auto text-amber-500" />
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>Código no válido</h1>
            <p className="text-sm text-muted-foreground">El código <strong>{code}</strong> no existe o pertenece a un club inactivo.</p>
            <a href="/" className="inline-block px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold text-sm">Ir al inicio</a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${referrer.primary_color} 0%, ${referrer.primary_color}dd 100%)` }}>
      <div className="w-full max-w-md space-y-3">
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {referrer.logo_url ? (
                <img src={referrer.logo_url} alt={referrer.name} className="w-14 h-14 object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: referrer.primary_color }}>
                  {referrer.short_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Te invita</p>
                <p className="text-base font-bold leading-tight">{referrer.name}</p>
                <p className="text-[11px] text-muted-foreground">{referrer.city}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift size={20} style={{ color: referrer.primary_color }} />
                <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: referrer.primary_color }}>
                  PROBÁ PLANTEL GRATIS
                </h1>
              </div>

              <p className="text-sm text-gray-700">
                Sistema completo para gestionar tu club: socios, asistencia, partidos, cobros, todo en un lugar.
              </p>

              <div className="space-y-2 pt-2">
                <Beneficio icon={<Clock size={16} />} text="7 días gratis para probar todo" />
                <Beneficio icon={<CheckCircle2 size={16} />} text="Setup gratis (alta de los primeros 100 socios + capacitación)" />
                <Beneficio icon={<CheckCircle2 size={16} />} text="10% de descuento los primeros 3 meses" />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs">
                <p className="font-semibold text-amber-800">Código aplicado:</p>
                <p className="font-mono font-bold text-amber-900 text-sm tracking-wider">{code}</p>
              </div>
            </div>

            <button
              onClick={() => alert(`✅ Demo:\n\nEn la app real, esto te llevaría al alta del club con el código ${code} ya aplicado.\n\nEl referente "${referrer.short_name}" ganaría 1 mes gratis cuando pagues tu primer mes.`)}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg"
              style={{ backgroundColor: referrer.primary_color }}
            >
              CREAR MI CUENTA
            </button>

            <p className="text-[10px] text-center text-muted-foreground">
              Sin tarjeta de crédito · 7 días gratis · Cancelás cuando quieras
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-white/80">
          Plantel · El sistema que reemplaza las planillas de tu club
        </p>
      </div>
    </div>
  )
}

function Beneficio({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-green-600 flex-shrink-0 mt-0.5">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  )
}
