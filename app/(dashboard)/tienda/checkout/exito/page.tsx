'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, MessageCircle, MapPin, Receipt, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ExitoPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Cargando...</div>}>
      <ExitoPage />
    </Suspense>
  )
}

function ExitoPage() {
  const params = useSearchParams()
  const orderId = params.get('id')
  const method = params.get('method')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('last_order')
    if (stored) setOrder(JSON.parse(stored))
  }, [])

  const isMP = method === 'mercadopago'

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8 max-w-md mx-auto">
      {/* Success icon */}
      <div className="text-center pt-4 pb-2">
        <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: isMP ? '#dcfce7' : '#fef3c7' }}>
          {isMP ? (
            <CheckCircle2 size={48} className="text-green-600" />
          ) : (
            <Clock size={48} className="text-amber-600" />
          )}
        </div>
        <h1 className="text-2xl font-bold mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
          {isMP ? '¡Pago confirmado!' : '¡Reserva confirmada!'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isMP ? 'Tu pedido fue pagado correctamente' : 'Tenés tu pedido reservado, pagás al retirar'}
        </p>
      </div>

      {/* Detalle del pedido */}
      {order && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Pedido
              </p>
              <p className="text-xs font-mono font-bold text-blue-700">#{orderId}</p>
            </div>
            <div className="space-y-1.5">
              {order.items.map((it: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                  <div>
                    <p className="font-medium">{it.quantity}× {it.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">Talle {it.variant_size}</p>
                  </div>
                  <p className="font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                    ${it.subtotal.toLocaleString('es-AR')}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-bold uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                ${order.total.toLocaleString('es-AR')}
              </span>
            </div>
            {isMP && (
              <div className="bg-blue-50 rounded p-2 text-xs">
                <p className="font-semibold text-blue-800">Pago MercadoPago</p>
                <p className="text-blue-700 font-mono text-[10px]">ID: MP-{Math.random().toString().slice(2, 12)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Datos de retiro */}
      <Card className="border-0 shadow-sm bg-gray-50">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Retiro
              </p>
              <p className="text-sm font-semibold">Sede del club</p>
              <p className="text-[11px] text-muted-foreground">Av. Rivadavia 14250, Haedo</p>
              <p className="text-[11px] text-muted-foreground">Lunes a Viernes 17:00 - 21:00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próximos pasos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            Próximos pasos
          </p>
          {isMP ? (
            <>
              <Step n={1} text="Recibís un email de confirmación" />
              <Step n={2} text="Te avisamos por WhatsApp cuando esté listo (24-48hs)" />
              <Step n={3} text="Retirás en sede mostrando este número de pedido" />
            </>
          ) : (
            <>
              <Step n={1} text="Tu reserva está activa por 7 días" />
              <Step n={2} text="Te avisamos por WhatsApp cuando esté listo (24-48hs)" />
              <Step n={3} text="Pagás y retirás en sede" />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Link href="/tienda" className="py-3 rounded-xl border-2 font-bold text-sm text-center hover:bg-gray-50">
          Seguir comprando
        </Link>
        <a
          href="#"
          className="py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-1.5"
          style={{ backgroundColor: '#25D366' }}
          onClick={(e) => { e.preventDefault(); alert('En producción, esto abre el WhatsApp del club para consultar.') }}
        >
          <MessageCircle size={14} /> Consultar
        </a>
      </div>
    </div>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{n}</span>
      <span>{text}</span>
    </div>
  )
}
