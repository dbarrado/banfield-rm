'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trash2, ShoppingCart, MapPin } from 'lucide-react'
import Link from 'next/link'
import { getCart, setCart, demoProducts, type CartItem } from '@/lib/shop'

export default function CarritoPage() {
  const router = useRouter()
  const [cart, setCartState] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'mercadopago' | 'cash_on_pickup'>('mercadopago')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setCartState(getCart())
  }, [])

  function updateQty(idx: number, delta: number) {
    const next = [...cart]
    next[idx].quantity = Math.max(1, next[idx].quantity + delta)
    setCart(next)
    setCartState(next)
  }

  function removeItem(idx: number) {
    const next = cart.filter((_, i) => i !== idx)
    setCart(next)
    setCartState(next)
  }

  const itemsWithDetails = cart.map(c => {
    const product = demoProducts.find(p => p.id === c.product_id)!
    const variant = product.variants.find(v => v.id === c.variant_id)!
    return { cart: c, product, variant, subtotal: product.price * c.quantity }
  }).filter(i => i.product && i.variant)

  const total = itemsWithDetails.reduce((s, i) => s + i.subtotal, 0)

  function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (cart.length === 0) return
    setProcessing(true)

    const orderId = `ord-${Date.now().toString().slice(-6)}`
    sessionStorage.setItem('last_order', JSON.stringify({
      id: orderId,
      customer_name: name,
      customer_email: email,
      customer_whatsapp: whatsapp,
      items: itemsWithDetails.map(i => ({
        product_name: i.product.name,
        variant_size: i.variant.size,
        quantity: i.cart.quantity,
        subtotal: i.subtotal,
      })),
      total,
      payment_method: paymentMethod,
    }))

    if (paymentMethod === 'mercadopago') {
      // Simular redirect a MP
      setTimeout(() => {
        // En producción: redirigiría a mercadopago.com.ar/checkout/...
        // Acá lo simulamos llevando directo a la página de éxito
        setCart([])
        router.push(`/tienda/checkout/exito?id=${orderId}&method=mercadopago`)
      }, 1500)
    } else {
      setTimeout(() => {
        setCart([])
        router.push(`/tienda/checkout/exito?id=${orderId}&method=cash`)
      }, 800)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="p-3 md:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/tienda" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            CARRITO
          </h1>
        </div>
        <div className="text-center py-12 space-y-3">
          <ShoppingCart size={48} className="mx-auto text-gray-300" />
          <p className="text-sm text-muted-foreground">Tu carrito está vacío</p>
          <Link href="/tienda" className="inline-block px-4 py-2 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/tienda" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          CARRITO
        </h1>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {itemsWithDetails.map((it, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-2.5 flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: it.product.image_color }}
              >
                {it.product.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate leading-tight">{it.product.name}</p>
                <p className="text-[11px] text-muted-foreground">Talle {it.variant.size}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={() => updateQty(idx, -1)} className="w-6 h-6 rounded-full border font-bold text-sm">−</button>
                  <span className="text-sm font-bold w-6 text-center">{it.cart.quantity}</span>
                  <button onClick={() => updateQty(idx, 1)} className="w-6 h-6 rounded-full border font-bold text-sm">+</button>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                  ${it.subtotal.toLocaleString('es-AR')}
                </p>
                <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 mt-0.5">
                  <Trash2 size={14} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Total */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid var(--club-primary, #00843D)' }}>
        <CardContent className="p-3 flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider">Total</span>
          <span className="text-3xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            ${total.toLocaleString('es-AR')}
          </span>
        </CardContent>
      </Card>

      {/* Checkout form */}
      <form onSubmit={handleCheckout} className="space-y-3 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
          Tus datos
        </h2>
        <input type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder="Nombre completo" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        <input type="tel" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
          placeholder="WhatsApp" className="w-full px-3 py-2.5 border rounded-lg text-sm" />

        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2" style={{ fontFamily: "var(--font-barlow)" }}>
          Método de pago
        </h2>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setPaymentMethod('mercadopago')}
            className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${paymentMethod === 'mercadopago' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-xs">MP</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">MercadoPago</p>
              <p className="text-[11px] text-muted-foreground">Tarjeta, transferencia o saldo MP. Pago seguro.</p>
            </div>
            {paymentMethod === 'mercadopago' && <CheckIcon />}
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('cash_on_pickup')}
            className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${paymentMethod === 'cash_on_pickup' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
          >
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-white">💵</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Efectivo al retirar</p>
              <p className="text-[11px] text-muted-foreground">Reservás ahora, pagás cuando retirás en sede.</p>
            </div>
            {paymentMethod === 'cash_on_pickup' && <CheckIcon />}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-start gap-2">
          <MapPin size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Retiro en sede</p>
            <p className="text-muted-foreground">Av. Rivadavia 14250, Haedo · Lun a Vie 17 a 21hs</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50"
          style={{ backgroundColor: paymentMethod === 'mercadopago' ? '#1d4ed8' : 'var(--club-primary, #00843D)' }}
        >
          {processing ? (paymentMethod === 'mercadopago' ? 'Redirigiendo a MercadoPago...' : 'Confirmando reserva...') :
            paymentMethod === 'mercadopago' ? `PAGAR $${total.toLocaleString('es-AR')} CON MERCADOPAGO` : `RESERVAR POR $${total.toLocaleString('es-AR')}`
          }
        </button>
      </form>
    </div>
  )
}

function CheckIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs flex-shrink-0">✓</div>
  )
}
