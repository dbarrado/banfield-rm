export type ProductCategory = 'camiseta' | 'remera' | 'short' | 'medias' | 'buzo' | 'mochila' | 'gorra' | 'pelota' | 'otros'

export type Product = {
  id: string
  club_id: string
  name: string
  category: ProductCategory
  description: string
  price: number  // ARS
  image_color: string  // color de fondo del placeholder
  emoji: string
  variants: ProductVariant[]
  is_active: boolean
  featured?: boolean
}

export type ProductVariant = {
  id: string
  size: string  // 'S', 'M', 'L', 'XL', '4', '6', '8', '10', etc.
  stock: number
  sku?: string
}

export type Order = {
  id: string
  club_id: string
  customer_name: string
  customer_email: string
  customer_whatsapp: string
  items: OrderItem[]
  subtotal: number
  total: number
  status: 'pending_payment' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  payment_method: 'mercadopago' | 'cash_on_pickup'
  payment_id?: string  // ID de MercadoPago cuando paga
  pickup_location?: string
  notes?: string
  created_at: string
  paid_at?: string
}

export type OrderItem = {
  product_id: string
  product_name: string
  variant_id: string
  variant_size: string
  quantity: number
  unit_price: number
  subtotal: number
}

// Productos demo (todos del club Brisas, que tiene addon activo)
export const demoProducts: Product[] = [
  {
    id: 'prod-1',
    club_id: 'club-brisas',
    name: 'Camiseta Titular 2026',
    category: 'camiseta',
    description: 'Camiseta titular oficial del club temporada 2026. Tela dry-fit con sublimado del escudo. Tallas infantiles y adultos.',
    price: 28000,
    image_color: '#7c3aed',
    emoji: '👕',
    featured: true,
    is_active: true,
    variants: [
      { id: 'v-1-1', size: '4', stock: 8 },
      { id: 'v-1-2', size: '6', stock: 12 },
      { id: 'v-1-3', size: '8', stock: 15 },
      { id: 'v-1-4', size: '10', stock: 10 },
      { id: 'v-1-5', size: '12', stock: 6 },
      { id: 'v-1-6', size: 'S', stock: 4 },
      { id: 'v-1-7', size: 'M', stock: 3 },
      { id: 'v-1-8', size: 'L', stock: 2 },
    ],
  },
  {
    id: 'prod-2',
    club_id: 'club-brisas',
    name: 'Camiseta Suplente 2026',
    category: 'camiseta',
    description: 'Camiseta alternativa color blanco con detalles violeta. Misma calidad dry-fit.',
    price: 28000,
    image_color: '#fbbf24',
    emoji: '👕',
    is_active: true,
    variants: [
      { id: 'v-2-1', size: '6', stock: 8 },
      { id: 'v-2-2', size: '8', stock: 12 },
      { id: 'v-2-3', size: '10', stock: 7 },
      { id: 'v-2-4', size: '12', stock: 4 },
      { id: 'v-2-5', size: 'S', stock: 3 },
      { id: 'v-2-6', size: 'M', stock: 5 },
    ],
  },
  {
    id: 'prod-3',
    club_id: 'club-brisas',
    name: 'Short de Juego',
    category: 'short',
    description: 'Short oficial color violeta con escudo bordado. Material liviano.',
    price: 14500,
    image_color: '#5b21b6',
    emoji: '🩳',
    featured: true,
    is_active: true,
    variants: [
      { id: 'v-3-1', size: '4', stock: 15 },
      { id: 'v-3-2', size: '6', stock: 18 },
      { id: 'v-3-3', size: '8', stock: 14 },
      { id: 'v-3-4', size: '10', stock: 8 },
      { id: 'v-3-5', size: '12', stock: 5 },
    ],
  },
  {
    id: 'prod-4',
    club_id: 'club-brisas',
    name: 'Medias Oficiales',
    category: 'medias',
    description: 'Medias largas con franjas violeta y blanco. Talle único ajustable.',
    price: 5500,
    image_color: '#fbbf24',
    emoji: '🧦',
    is_active: true,
    variants: [
      { id: 'v-4-1', size: 'Niño (24-32)', stock: 30 },
      { id: 'v-4-2', size: 'Junior (32-38)', stock: 25 },
      { id: 'v-4-3', size: 'Adulto (38-44)', stock: 18 },
    ],
  },
  {
    id: 'prod-5',
    club_id: 'club-brisas',
    name: 'Buzo Entrenamiento',
    category: 'buzo',
    description: 'Buzo de friza con capucha y bolsillo canguro. Bordado del escudo en pecho.',
    price: 32000,
    image_color: '#1e1b4b',
    emoji: '🧥',
    featured: true,
    is_active: true,
    variants: [
      { id: 'v-5-1', size: '8', stock: 6 },
      { id: 'v-5-2', size: '10', stock: 8 },
      { id: 'v-5-3', size: '12', stock: 4 },
      { id: 'v-5-4', size: 'S', stock: 5 },
      { id: 'v-5-5', size: 'M', stock: 7 },
      { id: 'v-5-6', size: 'L', stock: 3 },
    ],
  },
  {
    id: 'prod-6',
    club_id: 'club-brisas',
    name: 'Mochila Deportiva',
    category: 'mochila',
    description: 'Mochila grande con compartimento para botines. Color violeta con escudo bordado.',
    price: 22000,
    image_color: '#312e81',
    emoji: '🎒',
    is_active: true,
    variants: [
      { id: 'v-6-1', size: 'Único', stock: 18 },
    ],
  },
  {
    id: 'prod-7',
    club_id: 'club-brisas',
    name: 'Gorra Trucker',
    category: 'gorra',
    description: 'Gorra ajustable estilo trucker con escudo bordado en frente.',
    price: 9500,
    image_color: '#7c3aed',
    emoji: '🧢',
    is_active: true,
    variants: [
      { id: 'v-7-1', size: 'Único', stock: 22 },
    ],
  },
  {
    id: 'prod-8',
    club_id: 'club-brisas',
    name: 'Pelota Oficial Nº 5',
    category: 'pelota',
    description: 'Pelota de cuero sintético cosida. Logo del club estampado.',
    price: 18500,
    image_color: '#f59e0b',
    emoji: '⚽',
    is_active: true,
    variants: [
      { id: 'v-8-1', size: 'Nº 4', stock: 8 },
      { id: 'v-8-2', size: 'Nº 5', stock: 12 },
    ],
  },
]

// Pedidos demo (mostrar variedad de estados)
export const demoOrders: Order[] = [
  {
    id: 'ord-1001',
    club_id: 'club-brisas',
    customer_name: 'Carlos Fernández',
    customer_email: 'carlos.fernandez@gmail.com',
    customer_whatsapp: '1155001234',
    items: [
      { product_id: 'prod-1', product_name: 'Camiseta Titular 2026', variant_id: 'v-1-3', variant_size: '8', quantity: 1, unit_price: 28000, subtotal: 28000 },
      { product_id: 'prod-3', product_name: 'Short de Juego', variant_id: 'v-3-3', variant_size: '8', quantity: 1, unit_price: 14500, subtotal: 14500 },
      { product_id: 'prod-4', product_name: 'Medias Oficiales', variant_id: 'v-4-1', variant_size: 'Niño (24-32)', quantity: 2, unit_price: 5500, subtotal: 11000 },
    ],
    subtotal: 53500,
    total: 53500,
    status: 'paid',
    payment_method: 'mercadopago',
    payment_id: 'MP-12834729',
    pickup_location: 'Sede del club — Av. Rivadavia 14250',
    created_at: '2026-05-05T10:30:00',
    paid_at: '2026-05-05T10:32:15',
  },
  {
    id: 'ord-1002',
    club_id: 'club-brisas',
    customer_name: 'Ana García',
    customer_email: 'ana.garcia@gmail.com',
    customer_whatsapp: '1155002345',
    items: [
      { product_id: 'prod-5', product_name: 'Buzo Entrenamiento', variant_id: 'v-5-2', variant_size: '10', quantity: 1, unit_price: 32000, subtotal: 32000 },
    ],
    subtotal: 32000,
    total: 32000,
    status: 'preparing',
    payment_method: 'mercadopago',
    payment_id: 'MP-12835120',
    pickup_location: 'Sede del club',
    created_at: '2026-05-06T14:15:00',
    paid_at: '2026-05-06T14:17:42',
  },
  {
    id: 'ord-1003',
    club_id: 'club-brisas',
    customer_name: 'Jorge López',
    customer_email: 'jorge.lopez@gmail.com',
    customer_whatsapp: '1155003456',
    items: [
      { product_id: 'prod-6', product_name: 'Mochila Deportiva', variant_id: 'v-6-1', variant_size: 'Único', quantity: 1, unit_price: 22000, subtotal: 22000 },
      { product_id: 'prod-8', product_name: 'Pelota Oficial Nº 5', variant_id: 'v-8-2', variant_size: 'Nº 5', quantity: 1, unit_price: 18500, subtotal: 18500 },
    ],
    subtotal: 40500,
    total: 40500,
    status: 'pending_payment',
    payment_method: 'cash_on_pickup',
    pickup_location: 'Sede del club',
    notes: 'Reservado — paga al retirar',
    created_at: '2026-05-07T09:00:00',
  },
  {
    id: 'ord-1004',
    club_id: 'club-brisas',
    customer_name: 'Laura Martínez',
    customer_email: 'laura.martinez@gmail.com',
    customer_whatsapp: '1155004567',
    items: [
      { product_id: 'prod-2', product_name: 'Camiseta Suplente 2026', variant_id: 'v-2-2', variant_size: '8', quantity: 2, unit_price: 28000, subtotal: 56000 },
    ],
    subtotal: 56000,
    total: 56000,
    status: 'delivered',
    payment_method: 'mercadopago',
    payment_id: 'MP-12831900',
    pickup_location: 'Sede del club',
    created_at: '2026-05-02T11:00:00',
    paid_at: '2026-05-02T11:03:00',
  },
]

export const ORDER_STATUS_LABELS: Record<Order['status'], { label: string; color: string }> = {
  pending_payment: { label: 'Pendiente de pago', color: '#F59E0B' },
  paid: { label: 'Pagado', color: '#1d4ed8' },
  preparing: { label: 'En preparación', color: '#7c3aed' },
  ready: { label: 'Listo para retirar', color: '#00843D' },
  delivered: { label: 'Entregado', color: '#6b7280' },
  cancelled: { label: 'Cancelado', color: '#DC2626' },
}

// Carrito en localStorage
const CART_KEY = 'plantel_cart'

export type CartItem = {
  product_id: string
  variant_id: string
  quantity: number
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function setCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(productId: string, variantId: string, quantity = 1) {
  const cart = getCart()
  const existing = cart.find(c => c.product_id === productId && c.variant_id === variantId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ product_id: productId, variant_id: variantId, quantity })
  }
  setCart(cart)
}

export function getProductsForClub(clubId: string) {
  return demoProducts.filter(p => p.club_id === clubId && p.is_active)
}

export function getOrdersForClub(clubId: string) {
  return demoOrders.filter(o => o.club_id === clubId).sort((a, b) => b.created_at.localeCompare(a.created_at))
}
