'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, ShoppingBag, TrendingUp, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { getProductsForClub, getOrdersForClub, ORDER_STATUS_LABELS } from '@/lib/shop'

export default function TiendaAdminPage() {
  const club = useCurrentClub()
  const products = getProductsForClub(club.id)
  const orders = getOrdersForClub(club.id)

  const totalSales = orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending_payment').reduce((s, o) => s + o.total, 0)
  const pendingOrders = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length
  const lowStock = products.filter(p => p.variants.reduce((s, v) => s + v.stock, 0) < 5).length

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/tienda" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          ADMIN TIENDA
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Ventas mes</p>
            <p className="text-lg font-bold mt-0.5 text-green-600" style={{ fontFamily: "var(--font-barlow)" }}>
              ${(totalSales / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Pedidos</p>
            <p className="text-lg font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              {pendingOrders}
            </p>
            <p className="text-[9px] text-muted-foreground">a procesar</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground">Stock bajo</p>
            <p className="text-lg font-bold mt-0.5 text-red-500" style={{ fontFamily: "var(--font-barlow)" }}>
              {lowStock}
            </p>
            <p className="text-[9px] text-muted-foreground">productos</p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/tienda/admin/pedidos">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-3 flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                <ShoppingBag size={18} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pedidos</p>
                <p className="text-[10px] text-muted-foreground">{orders.length} totales</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => alert('En producción: form de alta de producto con variantes y stock')}>
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
              <Plus size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Nuevo producto</p>
              <p className="text-[10px] text-muted-foreground">Cargar al catálogo</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pedidos pendientes */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
        Pedidos recientes
      </h2>
      <div className="space-y-2">
        {orders.slice(0, 5).map(o => {
          const status = ORDER_STATUS_LABELS[o.status]
          return (
            <Card key={o.id} className="border-0 shadow-sm" style={{ borderLeft: `3px solid ${status.color}` }}>
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{o.customer_name}</p>
                    <Badge className="text-[10px] border-0 text-white" style={{ backgroundColor: status.color }}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    #{o.id} · {o.items.length} ítem{o.items.length === 1 ? '' : 's'} · {new Date(o.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <p className="font-bold text-sm flex-shrink-0" style={{ fontFamily: "var(--font-barlow)" }}>
                  ${o.total.toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Productos */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
        Catálogo ({products.length})
      </h2>
      <div className="space-y-2">
        {products.map(p => {
          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0)
          const isLow = totalStock < 5
          return (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: p.image_color }}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    ${p.price.toLocaleString('es-AR')} · {p.variants.length} variantes · {totalStock} stock total
                  </p>
                </div>
                {isLow && <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
