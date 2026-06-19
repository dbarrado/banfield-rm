'use client'

import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { loadPlan, type PlanItem } from '@/lib/data/plan-store'

// Tarjeta read-only del plan de entrenamiento del día para una categoría.
// La ve el profe junto con la asistencia. Solo trae datos en clubes reales.
export function PlanDelDia({ categoryId, categoryName }: { categoryId: string; categoryName: string }) {
  const club = useCurrentClub()
  const [items, setItems] = useState<PlanItem[]>([])
  const [title, setTitle] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isRealClub(club.id)) { setLoaded(true); return }
    const d = new Date()
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    let cancel = false
    loadPlan(club.id, categoryId, iso).then(p => {
      if (cancel) return
      if (p) { setItems(p.items); setTitle(p.title) }
      setLoaded(true)
    })
    return () => { cancel = true }
  }, [club.id, categoryId])

  if (!loaded || items.length === 0) return null

  return (
    <div className="rounded-xl border-l-4 bg-white shadow-sm p-3 mb-2" style={{ borderLeftColor: club.primary_color }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Dumbbell size={14} style={{ color: club.primary_color }} />
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: club.primary_color }}>
          Plan de hoy · {categoryName}
        </span>
      </div>
      {title && <p className="text-xs text-muted-foreground mb-1.5 italic">{title}</p>}
      <ol className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="font-bold" style={{ color: club.primary_color }}>{i + 1}.</span>
            <span className="flex-1">{it.description}{it.duration_min ? <span className="text-muted-foreground"> · {it.duration_min}′</span> : null}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
