'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const CURRENT_CLUB_KEY = 'banfieldrm_current_club_id'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Autenticación REAL contra Supabase (club en producción).
    const supabase = createClient()
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (!authErr && data.session) {
      localStorage.setItem(CURRENT_CLUB_KEY, 'club-banfield-rm') // club real
      document.cookie = `demo_auth=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      // Reload completo (no router.push) para que la cookie de sesión quede disponible
      // server-side (middleware) y el DataProvider la lea sin condición de carrera.
      window.location.href = '/dashboard'
      return
    }

    // Falló la autenticación real: mostrar el error (no caer a demo en silencio).
    setLoading(false)
    setError(authErr?.message === 'Invalid login credentials'
      ? 'Usuario o contraseña incorrectos.'
      : `No se pudo iniciar sesión: ${authErr?.message ?? 'error desconocido'}`)
  }

  // Modo demo explícito (para mostrar el producto con clubes ficticios).
  function enterDemo() {
    localStorage.setItem(CURRENT_CLUB_KEY, 'club-brisas')
    document.cookie = `demo_auth=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    window.location.href = '/dashboard'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}
    >
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="items-center pb-2 pt-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <Image
              src="/escudo-banfield.png"
              alt="Club Atlético Banfield"
              width={96}
              height={96}
              className="object-contain"
            />
          </div>
          <h1
            className="text-3xl font-bold tracking-wide text-center"
            style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}
          >
            BANFIELD RM
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            Sistema de Gestión — Filial Ramos Mejía
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@club.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-xs text-center text-red-600 bg-red-50 border border-red-200 rounded-md py-2 px-2">
                {error}
              </p>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Ingresá con tu usuario y contraseña del club.
            </p>
            <Button
              type="submit"
              className="w-full font-bold text-base h-11"
              style={{ backgroundColor: '#00843D' }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </Button>
          </form>
          <button
            type="button"
            onClick={enterDemo}
            className="w-full mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Ver demo (clubes de ejemplo, sin datos reales)
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
