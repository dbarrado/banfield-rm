'use client'

import { Lock, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Plan } from '@/lib/feature-gates'
import { PLAN_LABEL, PLAN_COLOR } from '@/lib/feature-gates'

type Props = {
  currentPlan: Plan
  requiredPlan: Plan
  featureName: string
  featureDescription?: string
  benefits?: string[]
}

const PLAN_BENEFITS: Record<Plan, string[]> = {
  free: [],
  club: [
    'Cobranzas con MP, transferencia o efectivo',
    'Caja diaria + cierre con conteo físico',
    'Carga de comprobantes con OCR',
    'Comunicación 1-a-1 con familias por WhatsApp',
    'Portal de tutores con vista de cuotas',
    'Rol de coordinador',
  ],
  pro: [
    'Carnet digital con QR escaneable',
    'Multi-cancha + multi-actividad real',
    'Asistencia de profes + cronograma semanal completo',
    'Estado de Resultados P&L mensual y YTD',
    'Audit logs + hash chain del libro contable',
  ],
  enterprise: [
    'Todo Pro + soporte dedicado',
    'Onboarding white-glove permanente',
    'Integraciones a medida',
  ],
}

export function UpgradePrompt({
  currentPlan,
  requiredPlan,
  featureName,
  featureDescription,
  benefits,
}: Props) {
  const list = benefits ?? PLAN_BENEFITS[requiredPlan]
  const planColor = PLAN_COLOR[requiredPlan]

  return (
    <div className="p-3 md:p-6 max-w-2xl mx-auto">
      <Card className="border-0 shadow-md overflow-hidden">
        {/* Header con gradiente del plan */}
        <div
          className="p-6 text-white text-center"
          style={{ background: `linear-gradient(135deg, ${planColor} 0%, ${planColor}dd 100%)` }}
        >
          <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Lock size={26} className="text-white" />
          </div>
          <p className="text-xs uppercase tracking-widest opacity-90">{featureName}</p>
          <h2 className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-barlow)' }}>
            Disponible en Plan {PLAN_LABEL[requiredPlan]}
          </h2>
          {featureDescription && (
            <p className="text-sm opacity-90 mt-2">{featureDescription}</p>
          )}
        </div>

        {/* Beneficios */}
        <CardContent className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Tu club tiene actualmente <strong>Plan {PLAN_LABEL[currentPlan]}</strong>.
            Actualizá a <strong style={{ color: planColor }}>Plan {PLAN_LABEL[requiredPlan]}</strong> para acceder a:
          </p>

          <ul className="space-y-2">
            {list.map((b, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${planColor}20` }}>
                  <Check size={12} style={{ color: planColor }} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="pt-3 border-t space-y-2">
            <button
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: planColor }}
              onClick={() => alert(`Acá iría el flujo de upgrade a Plan ${PLAN_LABEL[requiredPlan]} (demo).`)}
            >
              <Sparkles size={16} />
              Actualizar a Plan {PLAN_LABEL[requiredPlan]}
              <ArrowRight size={16} />
            </button>
            <p className="text-[11px] text-center text-muted-foreground">
              Promo Fase A: 12 meses por el precio de 9 + onboarding asistido sin costo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
