'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Upload, ScanLine, Trophy, Plus, X, Check, Loader2, MapPin, Calendar } from 'lucide-react'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { getCategoriesForClub } from '@/lib/demo-data'
import { createMatchEvents } from '@/lib/data/ops-store'
import { useActiveRole, ROLE_LABELS } from '@/lib/use-role'
import { getTirasForSport } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'

type CatRow = { id: string; categoryId: string; label: string; time: string }

// Baja la resolución de la foto antes de mandarla (fotos de celu son enormes).
function fileToScaledDataUrl(file: File, maxDim = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Imagen inválida'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const s = maxDim / Math.max(width, height)
          width = Math.round(width * s); height = Math.round(height * s)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function GenerarPartidoPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const [activeRole] = useActiveRole()
  const canGenerate = activeRole === 'admin' || activeRole === 'coordinador' || activeRole === 'profe'

  const cats = getCategoriesForClub(club.id).filter(c => c.is_active)
  const tiras = getTirasForSport((club.default_sport_code ?? 'football_11') as SportCode)
  const fileRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [reviewed, setReviewed] = useState(false)

  // Campos editables (revisión)
  const [rival, setRival] = useState('')
  const [tira, setTira] = useState('')
  const [isHome, setIsHome] = useState<'home' | 'away' | 'unknown'>('unknown')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [rows, setRows] = useState<CatRow[]>([])
  const [dateText, setDateText] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<number | null>(null)

  function matchCategory(label: string): string {
    const l = String(label).trim().toLowerCase()
    const found = cats.find(c => c.name.toLowerCase() === l)
      ?? cats.find(c => l.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(l))
      ?? cats.find(c => String(c.birth_year) === l.replace(/\D/g, ''))
    return found?.id ?? ''
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(''); setDone(null); setReviewed(false)
    try {
      const dataUrl = await fileToScaledDataUrl(file)
      setPreview(dataUrl)
      setScanning(true)
      const res = await fetch('/api/scan-flyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      })
      const j = await res.json()
      setScanning(false)
      if (!j.ok) { setError(j.error || 'No se pudo leer el flyer.'); return }
      const d = j.data || {}
      setRival(d.rival ?? '')
      setIsHome(d.is_home === true ? 'home' : d.is_home === false ? 'away' : 'unknown')
      setDate(d.date_iso && /^\d{4}-\d{2}-\d{2}$/.test(d.date_iso) ? d.date_iso : '')
      setDateText(d.date_text ?? '')
      setVenue(d.venue ?? '')
      const cr: CatRow[] = Array.isArray(d.categories) ? d.categories.map((c: any, i: number) => ({
        id: `r-${i}`,
        categoryId: matchCategory(c.label ?? ''),
        label: String(c.label ?? ''),
        time: /^\d{1,2}:\d{2}$/.test(String(c.time ?? '')) ? String(c.time).padStart(5, '0') : '',
      })) : []
      setRows(cr)
      setReviewed(true)
    } catch (err: any) {
      setScanning(false)
      setError(err?.message || 'Error procesando la imagen.')
    }
  }

  function updateRow(id: string, patch: Partial<CatRow>) {
    setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }
  function addRow() {
    setRows([...rows, { id: `r-${Date.now()}`, categoryId: '', label: '', time: '' }])
  }
  function removeRow(id: string) {
    setRows(rows.filter(r => r.id !== id))
  }

  const validRows = rows.filter(r => r.categoryId && /^\d{1,2}:\d{2}$/.test(r.time))
  const canSubmit = !!rival.trim() && !!tira && !!date && validRows.length > 0 && isHome !== 'unknown'

  async function generar() {
    if (!canSubmit) return
    setSaving(true); setError('')
    const matches = validRows.map(r => ({
      categoryId: r.categoryId,
      scheduledAt: `${date}T${r.time.length === 4 ? '0' + r.time : r.time}:00`,
      rival: rival.trim(),
      venue: venue.trim() || null,
      isHome: isHome === 'home',
      tira,
    }))
    if (real) {
      const res = await createMatchEvents(club.id, matches)
      setSaving(false)
      if (!res.ok) { setError(res.error || 'No se pudieron generar los partidos.'); return }
      setDone(res.count ?? matches.length)
    } else {
      setSaving(false)
      setDone(matches.length)
    }
  }

  if (!canGenerate) {
    return (
      <div className="p-6 text-center space-y-2">
        <p className="text-sm text-muted-foreground">Generar partidos es para coordinadores y profes.</p>
        <p className="text-xs text-muted-foreground">Tu rol activo: {ROLE_LABELS[activeRole]?.label ?? activeRole}.</p>
        <Link href="/fixture" className="text-xs text-blue-600 underline inline-block">← Volver a Fixture</Link>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-10 max-w-2xl">
      <div className="flex items-center gap-2">
        <Link href="/fixture" className="p-1.5 rounded hover:bg-gray-100"><ArrowLeft size={18} /></Link>
        <ScanLine size={20} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          GENERAR PARTIDO DESDE FLYER
        </h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Subí la foto del flyer. La IA reconoce rival, lugar y horarios por categoría. Después revisás, completás lo que falte y generás los partidos.
      </p>

      {/* Subir */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
          <div className="flex items-center gap-3">
            {preview ? (
              <img src={preview} alt="flyer" className="w-20 h-20 object-cover rounded-lg border" />
            ) : (
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <Upload size={22} />
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2" style={{ backgroundColor: '#00843D' }}>
              <Upload size={16} /> {preview ? 'Cambiar imagen' : 'Subir / sacar foto del flyer'}
            </button>
          </div>
          {scanning && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-3">
              <Loader2 size={16} className="animate-spin" /> Leyendo el flyer con IA…
            </p>
          )}
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md py-2 px-2 mt-3">{error}</p>}
        </CardContent>
      </Card>

      {/* Revisión editable */}
      {reviewed && (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                Revisá y completá los datos
              </p>

              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><Trophy size={11} /> Rival *</label>
                <input value={rival} onChange={e => setRival(e.target.value)} placeholder="Ej: Atlas" className="w-full px-3 py-2 border rounded-lg text-sm mt-0.5" />
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">Tira *</label>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {tiras.map(t => (
                    <button key={t.code} onClick={() => setTira(t.code)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${tira === t.code ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                      style={tira === t.code ? { backgroundColor: t.color } : {}}>
                      {t.label}
                    </button>
                  ))}
                </div>
                {!tira && <p className="text-[10px] text-amber-600 mt-1">Elegí la tira a la que corresponde este partido.</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">Banfield juega de *</label>
                <div className="flex gap-2 mt-0.5">
                  {([['home', '🏠 Local'], ['away', '✈️ Visitante'], ['unknown', '— A definir']] as const).map(([val, lbl]) => (
                    <button key={val} onClick={() => setIsHome(val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${isHome === val ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                      style={isHome === val ? { backgroundColor: val === 'unknown' ? '#9ca3af' : '#00843D' } : {}}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {isHome === 'unknown' && <p className="text-[10px] text-amber-600 mt-1">Elegí local o visitante para poder generar.</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><Calendar size={11} /> Fecha del partido *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-0.5" />
                {dateText && <p className="text-[10px] text-muted-foreground mt-1">Reconocido del flyer: "{dateText}". Confirmá la fecha.</p>}
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1"><MapPin size={11} /> Lugar</label>
                <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Dirección o cancha" className="w-full px-3 py-2 border rounded-lg text-sm mt-0.5" />
              </div>
            </CardContent>
          </Card>

          {/* Categorías y horarios */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                  Categorías y horarios
                </p>
                <button onClick={addRow} className="text-xs px-2 py-1 rounded border text-gray-600 hover:bg-gray-50 flex items-center gap-1"><Plus size={11} /> Agregar</button>
              </div>
              {rows.length === 0 && <p className="text-xs text-muted-foreground">Sin categorías reconocidas. Agregá manualmente.</p>}
              {rows.map(r => (
                <div key={r.id} className="flex items-center gap-2">
                  <select value={r.categoryId} onChange={e => updateRow(r.id, { categoryId: e.target.value })}
                    className={`flex-1 px-2 py-1.5 border rounded-lg text-sm ${!r.categoryId ? 'border-amber-300 bg-amber-50' : ''}`}>
                    <option value="">{r.label ? `Cat. "${r.label}" — elegir` : 'Elegir categoría'}</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input type="time" value={r.time} onChange={e => updateRow(r.id, { time: e.target.value })}
                    className={`w-28 px-2 py-1.5 border rounded-lg text-sm ${!/^\d{1,2}:\d{2}$/.test(r.time) ? 'border-amber-300 bg-amber-50' : ''}`} />
                  <button onClick={() => removeRow(r.id)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"><X size={14} /></button>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">{validRows.length} categoría(s) lista(s) de {rows.length}.</p>
            </CardContent>
          </Card>

          {done === null ? (
            <button onClick={generar} disabled={!canSubmit || saving}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ backgroundColor: '#00843D' }}>
              {saving ? <><Loader2 size={16} className="animate-spin" /> Generando…</> : <><Check size={16} /> Generar {validRows.length} partido(s)</>}
            </button>
          ) : (
            <Card className="border-0 shadow-sm bg-green-50 border-l-4 border-l-green-600">
              <CardContent className="p-3 flex items-center gap-2">
                <Check size={20} className="text-green-700" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-800">✓ {done} partido(s) generado(s) vs {rival}</p>
                  <p className="text-[11px] text-green-700">Ya podés armar la convocatoria por tira y categoría.</p>
                </div>
                <Link href="/convocatoria" className="text-xs font-semibold text-green-700 underline">Convocar →</Link>
              </CardContent>
            </Card>
          )}
          {!canSubmit && done === null && (
            <p className="text-[10px] text-center text-muted-foreground">
              Para generar: rival, tira, fecha, local/visitante y al menos una categoría con horario.
            </p>
          )}
        </>
      )}
    </div>
  )
}
