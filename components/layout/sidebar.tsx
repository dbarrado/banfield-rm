'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentClub } from '@/lib/use-current-club'
import { useActiveRole, ROLE_NAV_ITEMS } from '@/lib/use-role'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Trophy,
  Calendar,
  Wallet,
  TrendingUp,
  Settings,
  LogOut,
  Volleyball,
  Gift,
  ShoppingBag,
  BarChart3,
  Menu,
  X as XIcon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// Items principales (siempre en bottom-nav mobile)
const primaryItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/socios', icon: Users, label: 'Socios' },
  { href: '/asistencia', icon: ClipboardList, label: 'Asistencia' },
  { href: '/caja', icon: Wallet, label: 'Caja' },
]

// Items secundarios (en desktop sidebar y en sheet "Más" de mobile)
const secondaryItems = [
  { href: '/convocatoria', icon: Trophy, label: 'Convocatoria' },
  { href: '/fixture', icon: Calendar, label: 'Fixture' },
  { href: '/finanzas', icon: TrendingUp, label: 'Finanzas' },
  { href: '/reportes', icon: BarChart3, label: 'Reportes', proOnly: true },
  { href: '/tienda', icon: ShoppingBag, label: 'Tienda', proOnly: true },
  { href: '/deportes', icon: Volleyball, label: 'Deportes' },
  { href: '/invitar', icon: Gift, label: 'Invitar' },
  { href: '/config', icon: Settings, label: 'Config' },
]

const allItems = [...primaryItems, ...secondaryItems]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const club = useCurrentClub()
  const [activeRole] = useActiveRole()
  const [sheetOpen, setSheetOpen] = useState(false)
  const initials = club.short_name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  // Filtrar items según el rol activo
  const allowedPaths = new Set([
    ...ROLE_NAV_ITEMS[activeRole].primary,
    ...ROLE_NAV_ITEMS[activeRole].secondary,
  ])
  const filteredPrimary = primaryItems.filter(i => ROLE_NAV_ITEMS[activeRole].primary.includes(i.href))
  const filteredSecondary = secondaryItems.filter(i => ROLE_NAV_ITEMS[activeRole].secondary.includes(i.href))
  const filteredAll = allItems.filter(i => allowedPaths.has(i.href))

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar — todos los items siempre visibles */}
      <aside className="hidden md:flex flex-col w-16 min-h-screen border-r bg-white py-4 items-center gap-1 fixed left-0 top-0 z-40">
        <div className="mb-4 p-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[10px]"
            style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
          >
            {initials}
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {filteredAll.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                  active ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                )}
                style={active ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
              >
                <Icon size={20} />
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          title="Salir"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} />
        </button>
      </aside>

      {/* Mobile bottom nav: 4 ítems primarios + Más */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex justify-around py-2">
        {filteredPrimary.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
                active ? '' : 'text-gray-400'
              )}
              style={active ? { color: 'var(--club-primary, #00843D)' } : {}}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-gray-400"
        >
          <Menu size={22} />
          <span className="text-[10px] font-medium">Más</span>
        </button>
      </nav>

      {/* Sheet "Más" mobile */}
      {sheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
                MÁS
              </h3>
              <button onClick={() => setSheetOpen(false)} className="p-1 rounded">
                <XIcon size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {filteredSecondary.map(({ href, icon: Icon, label, proOnly }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                const isProClub = club.plan === 'pro'
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-colors relative',
                      active ? '' : 'border-gray-200'
                    )}
                    style={active ? { borderColor: 'var(--club-primary, #00843D)', backgroundColor: 'var(--club-primary, #00843D)10' } : {}}
                  >
                    <Icon size={22} style={{ color: active ? 'var(--club-primary, #00843D)' : '#6b7280' }} />
                    <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: active ? 'var(--club-primary, #00843D)' : '#374151' }}>
                      {label}
                    </span>
                    {proOnly && !isProClub && (
                      <span className="absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded font-bold bg-purple-100 text-purple-700">
                        PRO
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-lg border-2 border-red-200 text-red-600 font-semibold text-sm flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </>
  )
}
