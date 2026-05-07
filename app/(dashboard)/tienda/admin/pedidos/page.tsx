'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { getOrdersForClub, ORDER_STATUS_LABELS } from '@/lib/shop'

export default function PedidosPage() {
  const club = useCurrentClub()
  const orders = getOrdersForClub(club.id)

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/tienda/admin" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          PEDIDOS
        </h1>
        <Badge variant="outline" className="text-[10px]">{orders.length}</Badge>
      </div>

      <div className="space-y-2">
        {orders.map(o => {
          const status = ORDER_STATUS_LABELS[o.status]
          return (
            <Card key={o.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${status.color}` }}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">#{o.id}</p>
                    <p className="text-sm font-bold">{o.customer_name}</p>
                  </div>
                  <Badge className="text-[10px] border-0 text-white" style={{ backgroundColor: status.color }}>
                    {status.label}
                  </Badge>
                </div>

                <div className="space-y-0.5 pt-1 border-t">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span>{it.quantity}× {it.product_name} <span className="text-muted-foreground">(T{it.variant_size})</span></span>
                      <span className="font-bold">${it.subtotal.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(o.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {o.payment_method === 'mercadopago' ? `🏦 ${o.payment_id}` : '💵 Al retirar'}
                  </div>
                  <p className="text-base font-bold" style={{ fontFamily: "var(--font-barlow)", color: status.color }}>
                    ${o.total.toLocaleString('es-AR')}
                  </p>
                </div>

                {/* Acciones según estado */}
                <div className="flex gap-1.5 pt-1">
                  {o.status === 'paid' && (
                    <button className="flex-1 py-1.5 rounded text-xs font-semibold text-white" style={{ backgroundColor: '#7c3aed' }}>
                      <Package size={11} className="inline mr-1" /> Marcar en preparación
                    </button>
                  )}
                  {o.status === 'preparing' && (
                    <button className="flex-1 py-1.5 rounded text-xs font-semibold text-white bg-green-600">
                      Marcar listo
                    </button>
                  )}
                  {o.status === 'ready' && (
                    <button className="flex-1 py-1.5 rounded text-xs font-semibold text-white bg-gray-700">
                      Marcar entregado
                    </button>
                  )}
                  <a
                    href={`https://wa.me/54${o.customer_whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded text-xs font-semibold flex items-center gap-1 bg-green-50 text-green-700"
                  >
                    <MessageCircle size={11} /> WhatsApp
                  </a>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
