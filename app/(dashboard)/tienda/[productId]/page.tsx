'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, ShoppingCart, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoProducts, addToCart, type ProductVariant } from '@/lib/shop'

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params)
  const product = demoProducts.find(p => p.id === productId)
  const router = useRouter()
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  if (!product) notFound()

  function handleAdd() {
    if (!selectedVariant) return
    addToCart(product!.id, selectedVariant.id, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    // disparar evento de storage para que la tienda actualice el contador
    window.dispatchEvent(new Event('storage'))
  }

  function handleBuyNow() {
    if (!selectedVariant) return
    addToCart(product!.id, selectedVariant.id, quantity)
    router.push('/tienda/carrito')
  }

  const totalStock = product!.variants.reduce((s, v) => s + v.stock, 0)
  const outOfStock = totalStock === 0

  return (
    <div className="pb-4">
      {/* Imagen grande */}
      <div className="relative">
        <Link href="/tienda" className="absolute top-3 left-3 z-10 p-2 rounded-full bg-white/90 shadow">
          <ArrowLeft size={18} />
        </Link>
        <div className="aspect-square flex items-center justify-center text-9xl" style={{ backgroundColor: product!.image_color }}>
          {product!.emoji}
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-3">
        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-barlow)" }}>
            {product!.name}
          </h1>
          <p className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            ${product!.price.toLocaleString('es-AR')}
          </p>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product!.description}</p>
        </div>

        {/* Selector de talle */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Talle / Variante
              </p>
              {selectedVariant && (
                <p className="text-[11px] text-muted-foreground">{selectedVariant.stock} disponibles</p>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {product!.variants.map(v => {
                const sel = selectedVariant?.id === v.id
                const noStock = v.stock === 0
                return (
                  <button
                    key={v.id}
                    onClick={() => !noStock && setSelectedVariant(v)}
                    disabled={noStock}
                    className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                      sel ? 'text-white border-transparent shadow-md' :
                      noStock ? 'border-gray-200 text-gray-300 line-through cursor-not-allowed' :
                      'border-gray-200 text-gray-700'
                    }`}
                    style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
                  >
                    {v.size}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Cantidad */}
        {selectedVariant && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Cantidad
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border-2 font-bold text-lg"
                >−</button>
                <span className="font-bold text-lg w-8 text-center" style={{ fontFamily: "var(--font-barlow)" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  className="w-8 h-8 rounded-full border-2 font-bold text-lg"
                >+</button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subtotal */}
        {selectedVariant && (
          <Card className="border-0 bg-gray-50">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Subtotal</span>
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                ${(product!.price * quantity).toLocaleString('es-AR')}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Botones */}
        <div className="grid grid-cols-2 gap-2 sticky bottom-20 md:bottom-4 pt-2">
          <button
            onClick={handleAdd}
            disabled={!selectedVariant || outOfStock}
            className={`py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${added ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white text-gray-700'}`}
          >
            {added ? <><CheckCircle2 size={16} /> Agregado</> : <><ShoppingCart size={16} /> Al carrito</>}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={!selectedVariant || outOfStock}
            className="py-3 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-40"
            style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
          >
            COMPRAR YA
          </button>
        </div>
      </div>
    </div>
  )
}
