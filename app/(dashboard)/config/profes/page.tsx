'use client'

// PROFES — gestión simple para el coordinador (no experto en tecnología):
// tocás un profe → editás nombre, WhatsApp y sus tiras/categorías con chips → GUARDAR.
// "Dar de baja" SIEMPRE pide confirmación en criollo y nunca borra el historial.
import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Phone, Mail, Edit2, X } from 'lucide-react'
import Link from 'next/link'
import { getProfesForClub, getCategoriesForClub, getAssignmentsForProfe } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { updateProfe, setProfeAssignments } from '@/lib/data/ops-store'
import { createClient } from '@/lib/supabase/client'
import { realClubId } from '@/lib/real-clubs'

type ProfeRow = { id: string; full_name: string; email?: string | null; whatsapp?: string | null; is_active: boolean }
type Pair = { category_id: string; tira: string }
const ALL_TIRAS = ['metro', 'liga1', 'liga2', 'edefi'] as const

export default function ProfesPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)
  const cats = useMemo(() => getCategoriesForClub(club.id).filter(c => c.is_active), [club.id])

  // Copia local editable (la hidratación real vive en memoria; acá reflejamos cambios al instante)
  const [profes, setProfes] = useState<ProfeRow[]>(() => getProfesForClub(club.id) as ProfeRow[])
  const [assignMap, setAssignMap] = useState<Record<string, Pair[]>>(() =>
    Object.fromEntries((getProfesForClub(club.id) as ProfeRow[]).map(p => [p.id, getAssignmentsForProfe(p.id).map(a => ({ category_id: a.category_id, tira: a.tira }))]))
  )

  const [showForm, setShowForm] = useState(false)
  const [altaMsg, setAltaMsg] = useState('')
  const [altaBusy, setAltaBusy] = useState(false)
  const [editing, setEditing] = useState<ProfeRow | null>(null)
  const [confirmBaja, setConfirmBaja] = useState<ProfeRow | null>(null)
  const [showBajas, setShowBajas] = useState(false)

  const activos = profes.filter(p => p.is_active)
  const bajas = profes.filter(p => !p.is_active)

  async function darDeBaja(p: ProfeRow) {
    setProfes(prev => prev.map(x => x.id === p.id ? { ...x, is_active: false } : x))
    setConfirmBaja(null); setEditing(null)
    if (real) {
      const r = await updateProfe(club.id, p.id, { is_active: false })
      if (!r.ok) alert(`No se pudo dar de baja: ${r.error}`)
    }
  }

  async function reactivar(p: ProfeRow) {
    setProfes(prev => prev.map(x => x.id === p.id ? { ...x, is_active: true } : x))
    if (real) {
      const r = await updateProfe(club.id, p.id, { is_active: true })
      if (!r.ok) alert(`No se pudo reactivar: ${r.error}`)
    }
  }

  return (
    <div className="pb-4">
      <div className="px-3 md:px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/config" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
            PROFES
          </h1>
          <Badge variant="outline">{activos.length}</Badge>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>
      <p className="px-3 md:px-4 mt-1 text-xs text-muted-foreground">
        Tocá un profe para cambiarle el nombre, el WhatsApp o sus tiras y categorías.
      </p>

      <div className="p-3 md:p-4 space-y-2">
        {activos.map(p => {
          const pairs = assignMap[p.id] ?? []
          const byCategory: Record<string, string[]> = {}
          for (const a of pairs) {
            if (!byCategory[a.category_id]) byCategory[a.category_id] = []
            byCategory[a.category_id].push(a.tira)
          }
          return (
            <Card key={p.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setEditing(p)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.full_name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap mt-0.5">
                      {p.whatsapp && <span className="flex items-center gap-0.5"><Phone size={10} /> {p.whatsapp}</span>}
                      {p.email && <span className="flex items-center gap-0.5 truncate"><Mail size={10} /> {p.email}</span>}
                    </div>
                  </div>
                  <Edit2 size={14} className="text-muted-foreground flex-shrink-0" />
                </div>

                {pairs.length > 0 ? (
                  <div className="mt-2.5 pt-2.5 border-t space-y-1">
                    {Object.entries(byCategory).map(([catId, tiras]) => {
                      const cat = cats.find(c => c.id === catId)
                      return (
                        <div key={catId} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground w-12">Cat. {cat?.name ?? '—'}</span>
                          {tiras.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[t as keyof typeof TIRA_COLORS] }}>
                              {TIRA_LABELS[t as keyof typeof TIRA_LABELS]}
                            </span>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-[11px] text-amber-600">Sin tiras ni categorías asignadas — tocá para asignarle.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Profes dados de baja — reversible, nada se borra */}
      {bajas.length > 0 && (
        <div className="px-3 md:px-4">
          <button onClick={() => setShowBajas(v => !v)} className="w-full py-2 rounded-lg border border-dashed text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1 hover:bg-gray-50">
            {showBajas ? '▾' : '▸'} Profes dados de baja ({bajas.length})
          </button>
          {showBajas && (
            <div className="space-y-1.5 mt-2">
              {bajas.map(p => (
                <Card key={p.id} className="border-0 shadow-sm bg-gray-50 opacity-80">
                  <CardContent className="p-2.5 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground flex-1 min-w-0 truncate">{p.full_name}</p>
                    <button onClick={() => reactivar(p)} className="text-xs font-bold px-2.5 py-1.5 rounded-lg text-white flex-shrink-0" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                      Volver a activar
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor de profe: datos + asignaciones con chips */}
      {editing && (
        <ProfeEditor
          profe={editing}
          pairs={assignMap[editing.id] ?? []}
          cats={cats}
          onClose={() => setEditing(null)}
          onBaja={() => setConfirmBaja(editing)}
          onSave={async (nombre, whatsapp, pairs) => {
            setProfes(prev => prev.map(x => x.id === editing.id ? { ...x, full_name: nombre, whatsapp } : x))
            setAssignMap(prev => ({ ...prev, [editing.id]: pairs }))
            setEditing(null)
            if (real) {
              const r1 = await updateProfe(club.id, editing.id, { full_name: nombre, whatsapp: whatsapp || null })
              const r2 = await setProfeAssignments(club.id, editing.id, pairs)
              if (!r1.ok || !r2.ok) alert(`No se pudo guardar: ${r1.error ?? r2.error}`)
            }
          }}
        />
      )}

      {/* Confirmación de baja — en criollo */}
      {confirmBaja && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center p-3" onClick={() => setConfirmBaja(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
            <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>¿DAR DE BAJA A {confirmBaja.full_name.toUpperCase()}?</h3>
            <p className="text-xs text-muted-foreground">
              Deja de aparecer en los listados y de ver la app. <b>No se borra nada</b>: su historial de
              clases y asistencias queda guardado, y lo podés <b>volver a activar cuando quieras</b> desde
              "Profes dados de baja".
            </p>
            <div className="flex gap-2">
              <button onClick={() => darDeBaja(confirmBaja)} className="flex-1 py-3 rounded-xl text-white font-bold text-sm bg-red-600">
                SÍ, DAR DE BAJA
              </button>
              <button onClick={() => setConfirmBaja(null)} className="flex-1 py-3 rounded-xl border-2 font-bold text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alta de profe */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVO PROFE</h3>
              <button onClick={() => setShowForm(false)} className="text-2xl text-muted-foreground">×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const full_name = String(fd.get('full_name') ?? '').trim()
              const email = String(fd.get('email') ?? '').trim()
              const whatsapp = String(fd.get('whatsapp') ?? '').trim()
              if (!full_name) return
              setAltaMsg('')
              if (real) {
                // Alta completa: usuario + rol + ficha + mail de bienvenida (edge function)
                if (!email) { setAltaMsg('⚠ El email es obligatorio: es el usuario con el que entra a la app.'); return }
                setAltaBusy(true)
                const supabase = createClient()
                const { data, error } = await supabase.functions.invoke('alta-profe', {
                  body: { club_id: realClubId(club.id), full_name, email, whatsapp },
                })
                setAltaBusy(false)
                const res = (data ?? {}) as { ok?: boolean; profeId?: string; emailSent?: boolean; error?: string }
                if (error || !res.ok) { setAltaMsg(`⚠ ${res.error ?? error?.message ?? 'No se pudo crear.'}`); return }
                setProfes(prev => [...prev, { id: res.profeId!, full_name, email, whatsapp, is_active: true }])
                setAssignMap(prev => ({ ...prev, [res.profeId!]: [] }))
                setShowForm(false)
                alert(res.emailSent
                  ? `✅ ${full_name} ya tiene usuario y le llegó el mail de bienvenida con su acceso.\n\nAhora tocalo en la lista para asignarle sus tiras y categorías.`
                  : `✅ ${full_name} ya tiene usuario (clave inicial estándar), pero el mail no salió — pasale el acceso por WhatsApp.\n\nAhora tocalo en la lista para asignarle sus tiras y categorías.`)
              } else {
                setProfes(prev => [...prev, { id: `pf-new-${Date.now()}`, full_name, email, whatsapp, is_active: true }])
                setShowForm(false)
              }
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
                <input name="full_name" type="text" required placeholder="Juan Pérez" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">Email * <span className="font-normal text-muted-foreground">(va a ser su usuario)</span></label>
                <input name="email" type="email" required placeholder="juan@gmail.com" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
                <input name="whatsapp" type="tel" placeholder="11 4500 1111" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                Se crea su usuario con la clave inicial del club y <b>le llega un mail</b> con el acceso
                y el recordatorio de cambiar la clave. Después tocalo en la lista para asignarle tiras y categorías.
              </p>
              {altaMsg && <p className="text-xs text-amber-600 font-semibold">{altaMsg}</p>}
              <button type="submit" disabled={altaBusy} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                {altaBusy ? 'Creando usuario…' : 'CREAR PROFE Y ENVIAR ACCESO'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Editor simple: nombre + WhatsApp + grilla de chips por tira
function ProfeEditor({ profe, pairs, cats, onClose, onBaja, onSave }: {
  profe: ProfeRow
  pairs: Pair[]
  cats: { id: string; name: string }[]
  onClose: () => void
  onBaja: () => void
  onSave: (nombre: string, whatsapp: string, pairs: Pair[]) => void
}) {
  const [nombre, setNombre] = useState(profe.full_name)
  const [whatsapp, setWhatsapp] = useState(profe.whatsapp ?? '')
  const [sel, setSel] = useState<Set<string>>(new Set(pairs.map(p => `${p.tira}|${p.category_id}`)))

  function toggle(tira: string, catId: string) {
    const key = `${tira}|${catId}`
    setSel(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>EDITAR PROFE</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Nombre completo</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="11 4500 1111" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">¿Qué tiene a cargo? Tocá para marcar o desmarcar.</label>
          <div className="space-y-2.5">
            {ALL_TIRAS.map(tira => (
              <div key={tira}>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white inline-block mb-1" style={{ backgroundColor: TIRA_COLORS[tira as keyof typeof TIRA_COLORS] }}>
                  {TIRA_LABELS[tira as keyof typeof TIRA_LABELS]}
                </span>
                <div className="flex flex-wrap gap-1">
                  {cats.map(c => {
                    const on = sel.has(`${tira}|${c.id}`)
                    return (
                      <button key={c.id} type="button" onClick={() => toggle(tira, c.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 ${on ? 'text-white border-transparent' : 'border-gray-200 text-gray-500'}`}
                        style={on ? { backgroundColor: TIRA_COLORS[tira as keyof typeof TIRA_COLORS] } : {}}>
                        {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Esto define qué clases, convocatorias y partidos ve el profe en su app.
          </p>
        </div>

        <button
          onClick={() => onSave(nombre.trim(), whatsapp.trim(), Array.from(sel).map(k => { const [tira, category_id] = k.split('|'); return { tira, category_id } }))}
          disabled={!nombre.trim()}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
          GUARDAR
        </button>
        <button onClick={onBaja} className="w-full py-2 text-xs font-semibold text-red-600">
          Dar de baja a este profe…
        </button>
      </div>
    </div>
  )
}
