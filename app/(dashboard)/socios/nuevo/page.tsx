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

type ChildForm = {
  full_name: string
  birth_date: string
  category_id: string
  tira: Tira
  primary_position: Position
  photo: string | null
}

function emptyChild(): ChildForm {
  return {
    full_name: '',
    birth_date: '',
    category_id: demoCategories[0].id,
    tira: 'metro',
    primary_position: 'mediocampista',
    photo: null,
  }
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

function ChildFormCard({ child, index, canDelete, onUpdate, onRemove }: {
  child: ChildForm
  index: number
  canDelete: boolean
  onUpdate: (p: Partial<ChildForm>) => void
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
          <label className="text-xs font-semibold mb-1 block">Posición principal *</label>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(p => (
              <button key={p} type="button" onClick={() => onUpdate({ primary_position: p })}
                className={`py-2 rounded-lg text-[11px] font-semibold border ${child.primary_position === p ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={child.primary_position === p ? { backgroundColor: '#00843D' } : {}}>
                {POSITION_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
