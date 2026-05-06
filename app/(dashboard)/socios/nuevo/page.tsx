'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'
import { demoCategories } from '@/lib/demo-data'
import { POSITION_LABELS, TIRA_LABELS, type Position, type Tira } from '@/types'

const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
const ALL_TIRAS: Tira[] = ['metro', 'liga1', 'liga2', 'edefi']

export default function NuevoSocioPage() {
  const router = useRouter()
  const [photo, setPhoto] = useState<string | null>(null)
  const [form, setForm] = useState({
    full_name: '',
    birth_date: '',
    category_id: demoCategories[0].id,
    tira: 'metro' as Tira,
    primary_position: 'mediocampista' as Position,
    tutor_name: '',
    tutor_whatsapp: '',
  })

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`✅ Socio creado (demo):\n${form.full_name}\nCat. ${demoCategories.find(c => c.id === form.category_id)?.name} · ${TIRA_LABELS[form.tira]}\nPos: ${POSITION_LABELS[form.primary_position]}`)
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
        {/* Foto */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer">
            <div className="w-28 h-28 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {photo ? (
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera size={28} className="text-gray-400" />
              )}
            </div>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
            <span className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-muted-foreground">
              {photo ? 'Cambiar foto' : 'Tocar para foto'}
            </span>
          </label>
        </div>
        <div className="h-4" />

        <div>
          <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
          <input type="text" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
            placeholder="Lucas Fernández" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Fecha de nacimiento *</label>
          <input type="date" required value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })}
            className="w-full px-3 py-2.5 border rounded-lg text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold mb-1 block">Categoría *</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {demoCategories.filter(c => c.is_active).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Tira *</label>
            <select value={form.tira} onChange={e => setForm({ ...form, tira: e.target.value as Tira })}
              className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {ALL_TIRAS.map(t => <option key={t} value={t}>{TIRA_LABELS[t]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Posición principal *</label>
          <div className="grid grid-cols-4 gap-1.5">
            {POSITIONS.map(p => (
              <button key={p} type="button" onClick={() => setForm({ ...form, primary_position: p })}
                className={`py-2 rounded-lg text-[11px] font-semibold border ${form.primary_position === p ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={form.primary_position === p ? { backgroundColor: '#00843D' } : {}}>
                {POSITION_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
            DATOS DEL TUTOR
          </p>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold mb-1 block">Nombre del tutor</label>
              <input type="text" value={form.tutor_name} onChange={e => setForm({ ...form, tutor_name: e.target.value })}
                placeholder="Carlos Fernández" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block">WhatsApp del tutor</label>
              <input type="tel" value={form.tutor_whatsapp} onChange={e => setForm({ ...form, tutor_whatsapp: e.target.value })}
                placeholder="11 5500 1234" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm" style={{ backgroundColor: '#00843D' }}>
          CREAR SOCIO
        </button>
      </form>
    </div>
  )
}
