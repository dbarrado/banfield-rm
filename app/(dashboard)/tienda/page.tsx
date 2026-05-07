'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag, Lock, Sparkles, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useCurrentClub } from '@/lib/use-current-club'
import { demoClubs } from '@/lib/clubs'
import { getProductsForClub, getCart, type Product } from '@/lib/shop'

export default function TiendaPage() {
  const club = useCurrentClub()
  const fullClub = demoClubs.find(c => c.id === club.id)
  const isPro = club.plan === 'pro'
  const hasShopAddon = fullClub?.has_shop_addon ?? false
  const products = isPro && hasShopAddon ? getProductsForClub(club.id) : []
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    const update = () => setCartCount(getCart().reduce((s, c) => s + c.quantity, 0))
    update()
    window.addEventListener('storage', update)
    return () => window.removeEventListener('storage', update)
  }, [])

  // Gate 1: no es Pro
  if (!isPro) {
    return (
      <UpgradeGate
        title="Tienda del club"
        message="El módulo Tienda está disponible solo en Plan Pro."
        cta="Ver beneficios de Plan Pro"
      />
    )
  }

  // Gate 2: es Pro pero sin add-on
  if (!hasShopAddon) {
    return (
      <div className="p-3 md:p-6 space-y-3 pb-8">
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} style={{ color: 'var(--club-primary, #00843D)' }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            TIENDA
          </h1>
        </div>

        <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-5 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center mx-auto">
              <ShoppingBag size={26} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-900" style={{ fontFamily: "var(--font-barlow)" }}>
                Add-on Tienda
              </h2>
              <p className="text-sm text-purple-700 mt-1">Indumentaria oficial del club con cobro online vía MercadoPago</p>
            </div>

            <div className="bg-white rounded-lg p-3 text-left space-y-1.5 text-sm">
              <Bullet>Catálogo personalizado del club (camisetas, shorts, mochilas, etc.)</Bullet>
              <Bullet>Reservas y pago online seguro con MercadoPago</Bullet>
              <Bullet>Inventario por talles, alertas de stock bajo</Bullet>
              <Bullet>Pedidos integrados a la contabilidad del club</Bullet>
              <Bullet>Pagado se concilia automáticamente como ingreso</Bullet>
            </div>

            <div className="bg-purple-100 rounded-lg p-3">
              <p className="text-xs text-purple-700 uppercase font-bold tracking-wider">Precio</p>
              <p className="text-2xl font-bold text-purple-900" style={{ fontFamily: "var(--font-barlow)" }}>
                + USD 20/mes
              </p>
              <p className="text-[11px] text-purple-700">Sumado al Plan Pro · cancelable cuando quieras</p>
            </div>

            <button className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md" style={{ backgroundColor: '#7c3aed' }}>
              ACTIVAR ADD-ON TIENDA
            </button>
            <p className="text-[10px] text-purple-600">
              Te contactamos para configurarlo en menos de 48hs
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tienda activa: catálogo
  const featured = products.filter(p => p.featured)
  const regular = products.filter(p => !p.featured)

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingBag size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            TIENDA
          </h1>
          <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0 hidden sm:inline-flex">
            <Sparkles size={9} className="mr-0.5" /> ADD-ON
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/tienda/admin" className="text-xs px-2 py-1.5 rounded border text-muted-foreground hover:bg-gray-50 font-semibold">
            Admin
          </Link>
          <Link href="/tienda/carrito" className="relative px-3 py-2 rounded-lg flex items-center gap-1.5 text-white font-semibold text-sm" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
            <ShoppingCart size={14} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Indumentaria oficial · Pagás con MercadoPago o reservás para pagar al retirar
      </p>

      {featured.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            ⭐ Destacados
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}

      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
        Todos ({products.length})
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {regular.map(p => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0)
  return (
    <Link href={`/tienda/${product.id}`}>
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
        <div
          className="aspect-square rounded-t-xl flex items-center justify-center text-7xl"
          style={{ backgroundColor: product.image_color }}
        >
          {product.emoji}
        </div>
        <CardContent className="p-2.5 space-y-1">
          <p className="text-sm font-semibold truncate leading-tight">{product.name}</p>
          <p className="text-base font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            ${product.price.toLocaleString('es-AR')}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {totalStock > 0 ? `${totalStock} disponibles` : 'Sin stock'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-purple-600 flex-shrink-0">✓</span>
      <span>{children}</span>
    </div>
  )
}

function UpgradeGate({ title, message, cta }: { title: string; message: string; cta: string }) {
  return (
    <div className="p-3 md:p-6">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag size={20} className="text-muted-foreground" />
        <h1 className="text-2xl font-bold text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
          {title.toUpperCase()}
        </h1>
      </div>
      <Card className="border-2 border-dashed border-amber-300 bg-amber-50">
        <CardContent className="p-5 text-center space-y-3">
          <Lock size={28} className="mx-auto text-amber-600" />
          <p className="text-sm font-semibold text-amber-800">{message}</p>
          <button className="px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#7c3aed' }}>
            {cta}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
