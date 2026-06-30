'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Plus, Trash2, Save, Calendar } from 'lucide-react'
import { getCategoriesForClub, getAssignmentsForProfe } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { loadPlan, savePlan, type PlanItem } from '@/lib/data/plan-store'
import { useUserRoles } from '@/lib/use-role'
import { useCurrentProfe } from '@/lib/use-current-profe'

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function PlanPage() {
  const club = useCurrentClub()
  const userRoles = useUserRoles()
  const { profeId: myProfeId, profeName: myProfeName } = useCurrentProfe(club.id)
  // Profe puro = sus roles son únicamente profe (sin admin/coordinador), sin depender del rol activo.
  const isPureProfe = isRealClub(club.id) && userRoles.includes('profe') && !userRoles.includes('admin') && !userRoles.includes('coordinador')
  const allCategories = useMemo(() => getCategoriesForClub(club.id).filter(c => c.is_active), [club.id])
  const myAssignedCategoryIds = useMemo(() => {
    if (!isPureProfe || !myProfeId) return null
    return new Set(getAssignmentsForProfe(myProfeId).map(a => a.category_id))
  }, [isPureProfe, myProfeId])
  const categories = useMemo(() => {
    if (!myAssignedCategoryIds) return allCategories
    return allCategories.filter(c => myAssignedCategoryIds.has(c.id))
  }, [allCategories, myAssignedCategoryIds])
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayISO())
  const [title, setTitle] = useState('')
  const [items, setItems] = useState<PlanItem[]>([{ position: 1, description: '', duration_min: null }])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!categories.length) return
    if (!categoryId || !categories.some(c => c.id === categoryId)) setCategoryId(categories[0].id)
  }, [categories, categoryId])

  // Cargar el plan existente al cambiar categoría/fecha (club real)
  useEffect(() => {
    if (!categoryId) return
    setSaved(false)
    if (!isRealClub(club.id)) {
      setItems([{ position: 1, description: '', duration_min: null }]); setTitle('')
      return
    }
    let cancel = false
    setLoading(true)
    loadPlan(club.id, categoryId, date).then(p => {
      if (cancel) return
      if (p && p.items.length) { setItems(p.items); setTitle(p.title) }
      else { setItems([{ position: 1, description: '', duration_min: null }]); setTitle('') }
      setLoading(false)
    })
    return () => { cancel = true }
  }, [club.id, categoryId, date])

  function updateItem(idx: number, patch: Partial<PlanItem>) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it)); setSaved(false)
  }
  function addItem() { setItems(prev => [...prev, { position: prev.length + 1, description: '', duration_min: null }]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  async function handleSave() {
    if (!isRealClub(club.id)) { setSaved(true); return }
    setLoading(true)
    const res = await savePlan(club.id, categoryId, date, title, items)
    setLoading(false)
    if (res.ok) setSaved(true)
    else alert(`No se pudo guardar: ${res.error}`)
  }

  const catName = categories.find(c => c.id === categoryId)?.name ?? ''

  return (
    <div className="p-3 md:p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-3">
        <ClipboardList size={22} style={{ color: club.primary_color }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-barlow)', color: club.primary_color }}>
          PLAN DE ENTRENAMIENTO
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isPureProfe
          ? `Solo ves y cargás el plan de tus categorías asignadas${myProfeName ? ` (${myProfeName})` : ''}.`
          : 'El coordinador carga los ejercicios de cada día por categoría. Los profes lo ven junto con la asistencia.'}
      </p>

      <Card className="border-0 shadow-sm mb-3">
        <CardContent className="p-3 grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold mb-1 block">Categoría</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block flex items-center gap-1"><Calendar size={12} /> Día</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold mb-1 block">Título / objetivo del día (opcional)</label>
            <input type="text" value={title} onChange={e => { setTitle(e.target.value); setSaved(false) }} placeholder="Ej: Trabajo de pase y control"
              className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <Card key={idx} className="border-0 shadow-sm">
            <CardContent className="p-3 flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: club.primary_color }}>{idx + 1}</div>
              <div className="flex-1 space-y-2">
                <textarea value={it.description} onChange={e => updateItem(idx, { description: e.target.value })}
                  placeholder={`Ejercicio ${idx + 1} — descripción`} rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={it.duration_min ?? ''} onChange={e => updateItem(idx, { duration_min: e.target.value ? Number(e.target.value) : null })}
                    placeholder="min" className="w-20 px-2 py-1.5 border rounded-lg text-sm" />
                  <span className="text-xs text-muted-foreground">minutos</span>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="ml-auto text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <button onClick={addItem} className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed text-sm font-semibold text-muted-foreground hover:bg-gray-50 flex items-center justify-center gap-1">
        <Plus size={14} /> Agregar ejercicio
      </button>

      <div className="sticky bottom-20 md:bottom-4 mt-3">
        <button onClick={handleSave} disabled={loading}
          className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: club.primary_color }}>
          <Save size={16} /> {loading ? 'Guardando…' : saved ? '✓ Plan guardado' : `Guardar plan — ${catName} · ${date}`}
        </button>
        {!isRealClub(club.id) && <p className="text-[11px] text-center text-muted-foreground mt-1">Club demo: el plan no se persiste.</p>}
      </div>
    </div>
  )
}
