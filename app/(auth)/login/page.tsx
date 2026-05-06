'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="items-center pb-2 pt-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center">
            <Image
              src="/escudo-banfield.png"
              alt="Club Atlético Banfield"
              width={96}
              height={96}
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wide text-center" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            BANFIELD RM
          </h1>
          <p className="text-sm text-muted-foreground text-center">Sistema de Gestión — Filial Ramos Mejía</p>
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
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full font-bold text-base h-11"
              style={{ backgroundColor: '#00843D' }}
              disabled={loading}
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
