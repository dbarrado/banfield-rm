'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, Plus, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { demoCategories } from '@/lib/demo-data'
import { POSITION_LABELS, TIRA_LABELS, type Position, type Tira } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

type PositionState = 'none' | 'primary' | 'secondary'

type ChildForm = {
  full_name: string
  birth_date: string
  category_id: string
  tira: Tira
  positions: Record<Position, PositionState>
  photo: string | null
}

function emptyChild(): ChildForm {
  return {
    full_name: '',
    birth_date: '',
    category_id: demoCategories[0].id,
    tira: 'metro',
    positions: { arquero: 'none', defensor: 'none', mediocampista: 'none', delantero: 'none' },
    photo: null,
  }
}

function cyclePosition(child: ChildForm, pos: Position): ChildForm {
  const current = child.positions[pos]
  const newPositions = { ...child.positions }
  // Reglas: solo puede haber 1 principal. Hasta 3 secundarias.
  if (current === 'none') {
    // Si no hay principal, esta pasa a principal. Si ya hay, va directo a secundaria
    const hasPrimary = Object.values(child.positions).some(s => s === 'primary')
    newPositions[pos] = hasPrimary ? 'secondary' : 'primary'
  } else if (current === 'primary') {
    newPositions[pos] = 'secondary'
  } else {
    newPositions[pos] = 'none'
  }
  // Validar que solo haya 1 principal
  const primaries = Object.entries(newPositions).filter(([, s]) => s === 'primary')
  if (primaries.length > 1) {
    primaries.forEach(([k]) => { if (k !== pos) newPositions[k as Position] = 'secondary' })
  }
  // Validar máximo 3 secundarias
  const secondaries = Object.entries(newPositions).filter(([, s]) => s === 'secondary')
  if (secondaries.length > 3) {
    // Quitar la más vieja (la primera que no sea la actual)
    const toRemove = secondaries.find(([k]) => k !== pos)
    if (toRemove) newPositions[toRemove[0] as Position] = 'none'
  }
  return { ...child, positions: newPositions }
}

export default function NuevoSocioPage() {
  const router = useRouter()
  const [tutor, setTutor] = useState({
    name: '',
    dni: '',
    email: '',
    whatsapp: '',
  })
  const [children, setChildren] = useState<ChildForm[]>([emptyChild()])

  function updateChild(idx: number, patch: Partial<ChildForm>) {
    setChildren(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Validar que cada hijo tenga al menos una posición principal
    for (const c of children) {
      const hasPrimary = Object.values(c.positions).some(s => s === 'primary')
      if (!hasPrimary) {
        alert(`Falta marcar la posición principal de ${c.full_name || 'algún hijo'}.`)
        return
      }
    }
    const summary = children.map(c => `• ${c.full_name} — Cat. ${demoCategories.find(d => d.id === c.category_id)?.name} ${TIRA_LABELS[c.tira]}`).join('\n')
    alert(`✅ ${children.length} socio${children.length > 1 ? 's' : ''} creado${children.length > 1 ? 's' : ''} (demo):\n\nTutor: ${tutor.name}\n\n${summary}`)
    router.push('/socios')
  }

  return (
    <div className="pb-4">
      <div className="px-3 md:px-4 pt-3 flex items-center gap-2">
        <Link href="/socios" className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          NUEVO SOCIO
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-3 md:p-4 space-y-3">
        {/* Tutor */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              DATOS DEL TUTOR
            </p>
            <div>
              <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
              <input type="text" required value={tutor.name} onChange={e => setTutor({ ...tutor, name: e.target.value })}
                placeholder="Carlos Fernández" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold mb-1 block">DNI</label>
                <input type="text" value={tutor.dni} onChange={e => setTutor({ ...tutor, dni: e.target.value })}
                  placeholder="30123456" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
                <input type="tel" value={tutor.whatsapp} onChange={e => setTutor({ ...tutor, whatsapp: e.target.value })}
                  placeholder="11 5500 1234" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">Email</label>
              <input type="email" value={tutor.email} onChange={e => setTutor({ ...tutor, email: e.target.value })}
                placeholder="carlos.fernandez@gmail.com" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Si lo cargás, el tutor recibe una invitación al portal de padres.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Hijos */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
            <Users size={13} /> HIJOS ({children.length})
          </p>
          <button type="button" onClick={() => setChildren([...children, emptyChild()])}
            className="text-xs font-semibold px-2.5 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: '#00843D' }}>
            <Plus size={12} /> Otro hijo
          </button>
        </div>

        {children.map((child, idx) => (
          <ChildFormCard
            key={idx}
            child={child}
            index={idx}
            canDelete={children.length > 1}
            onUpdate={(patch) => updateChild(idx, patch)}
            onCyclePosition={(pos) => setChildren(prev => prev.map((c, i) => i === idx ? cyclePosition(c, pos) : c))}
            onRemove={() => setChildren(children.filter((_, i) => i !== idx))}
          />
        ))}

        <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm" style={{ backgroundColor: '#00843D' }}>
          {children.length > 1 ? `CREAR ${children.length} SOCIOS` : 'CREAR SOCIO'}
        </button>
      </form>
    </div>
  )
}

function ChildFormCard({ child, index, canDelete, onUpdate, onCyclePosition, onRemove }: {
  child: ChildForm
  index: number
  canDelete: boolean
  onUpdate: (p: Partial<ChildForm>) => void
  onCyclePosition: (pos: Position) => void
  onRemove: () => void
}) {
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => onUpdate({ photo: ev.target?.result as string })
    reader.readAsDataURL(f)
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            Hijo #{index + 1}
          </p>
          {canDelete && (
            <button type="button" onClick={onRemove} className="text-red-500 p-1 hover:bg-red-50 rounded">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Foto */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {child.photo ? (
                <img src={child.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera size={20} className="text-gray-400" />
              )}
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
          <input type="text" required value={child.full_name} onChange={e => onUpdate({ full_name: e.target.value })}
            placeholder="Lucas Fernández" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Fecha de nacimiento *</label>
          <input type="date" required value={child.birth_date} onChange={e => onUpdate({ birth_date: e.target.value })}
            className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold mb-1 block">Categoría *</label>
            <select value={child.category_id} onChange={e => onUpdate({ category_id: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {demoCategories.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Tira *</label>
            <select value={child.tira} onChange={e => onUpdate({ tira: e.target.value as Tira })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {ALL_TIRAS.map(t => <option key={t} value={t}>{TIRA_LABELS[t]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold">Posiciones *</label>
            <p className="text-[10px] text-muted-foreground">1 tap: principal · 2: secundaria · 3: quitar</p>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(p => {
              const state = child.positions[p]
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onCyclePosition(p)}
                  className={`py-2 rounded-lg text-[11px] font-semibold border-2 transition-all ${
                    state === 'primary' ? 'text-white border-transparent shadow-md' :
                    state === 'secondary' ? '' :
                    'border-gray-200 text-gray-500'
                  }`}
                  style={
                    state === 'primary' ? { backgroundColor: '#00843D' } :
                    state === 'secondary' ? { borderColor: '#00843D', color: '#00843D', backgroundColor: '#f0fdf4' } :
                    {}
                  }
                >
                  {POSITION_LABELS[p]}
                  {state === 'primary' && <span className="block text-[8px] font-bold opacity-80 mt-0.5">PRINCIPAL</span>}
                  {state === 'secondary' && <span className="block text-[8px] font-bold opacity-80 mt-0.5">SECUNDARIA</span>}
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
