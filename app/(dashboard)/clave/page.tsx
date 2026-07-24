'use client'

// Cambiar la contraseña del usuario logueado (cualquier rol — cada uno cambia SOLO la suya).
// Los profes llegan con una clave inicial estándar y desde acá la reemplazan.
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'

export default function CambiarClavePage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const valid = pass1.length >= 8 && pass1 === pass2

  async function handleSave() {
    if (!valid) return
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: pass1 })
    setSaving(false)
    if (err) {
      setError(err.message === 'New password should be different from the old password.'
        ? 'La clave nueva tiene que ser distinta a la actual.'
        : `No se pudo cambiar: ${err.message}`)
      return
    }
    setDone(true)
  }

  return (
    <div className="p-3 md:p-6 max-w-md mx-auto space-y-3">
      <div className="flex items-center gap-2">
        <KeyRound size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)', color: '#00843D' }}>
          MI CLAVE
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Cambiá tu contraseña de acceso. Si entraste con la clave inicial que te dio el club,
        cambiala ahora por una tuya.
      </p>

      {!real ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Club demo: no hay usuario real para cambiar la clave.
          </CardContent>
        </Card>
      ) : done ? (
        <Card className="border-0 shadow-sm bg-green-50" style={{ borderLeft: '4px solid #00843D' }}>
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle2 size={22} className="text-green-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800">✓ Clave cambiada</p>
              <p className="text-xs text-green-700">Desde ahora entrás con tu clave nueva. Guardala bien.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold mb-1 block">Clave nueva (mínimo 8 caracteres)</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pass1}
                  onChange={e => setPass1(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-lg text-sm pr-10"
                  placeholder="Tu clave nueva"
                />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Repetila</label>
              <input
                type={show ? 'text' : 'password'}
                value={pass2}
                onChange={e => setPass2(e.target.value)}
                className="w-full px-3 py-2.5 border rounded-lg text-sm"
                placeholder="La misma clave otra vez"
              />
            </div>
            {pass1 && pass1.length < 8 && <p className="text-[11px] text-amber-600">Le faltan caracteres: mínimo 8.</p>}
            {pass2 && pass1 !== pass2 && <p className="text-[11px] text-red-600">Las claves no coinciden.</p>}
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md py-2 px-2">{error}</p>}
            <button
              onClick={handleSave}
              disabled={!valid || saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
              style={{ backgroundColor: '#00843D' }}
            >
              {saving ? 'Guardando…' : 'CAMBIAR MI CLAVE'}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
