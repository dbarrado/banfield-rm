'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCurrentClub } from '@/lib/use-current-club'
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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/socios', icon: Users, label: 'Socios' },
  { href: '/asistencia', icon: ClipboardList, label: 'Asistencia' },
  { href: '/convocatoria', icon: Trophy, label: 'Convocatoria' },
  { href: '/fixture', icon: Calendar, label: 'Fixture' },
  { href: '/deportes', icon: Volleyball, label: 'Deportes' },
  { href: '/caja', icon: Wallet, label: 'Caja' },
  { href: '/finanzas', icon: TrendingUp, label: 'Finanzas' },
  { href: '/config', icon: Settings, label: 'Config' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const club = useCurrentClub()
  const initials = club.short_name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Desktop sidebar */}
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
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href) && href !== '/dashboard'
              ? pathname.startsWith(href)
              : pathname === href || (href === '/dashboard' && pathname === '/dashboard')
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
                  active
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
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

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t flex justify-around py-2">
        {navItems.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (pathname.startsWith(href) && href !== '/dashboard')
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
      </nav>
    </>
  )
}
