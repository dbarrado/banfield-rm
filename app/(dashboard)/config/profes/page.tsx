'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Plus, Phone } from 'lucide-react'
import Link from 'next/link'
import { demoProfes, demoCategories, getAssignmentsForProfe } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'

export default function ProfesPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="pb-4">
      <div className="px-3 md:px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/config" className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            PROFES
          </h1>
          <Badge variant="outline">{demoProfes.length}</Badge>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#00843D' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      <div className="p-3 md:p-4 space-y-2">
        {demoProfes.map(p => {
          const assignments = getAssignmentsForProfe(p.id)
          // Agrupar asignaciones por categoría
          const byCategory: Record<string, string[]> = {}
          for (const a of assignments) {
            if (!byCategory[a.category_id]) byCategory[a.category_id] = []
            byCategory[a.category_id].push(a.tira)
          }
          return (
            <Card key={p.id} className="border-0 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#00843D' }}>
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.full_name}</p>
                    {p.whatsapp && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Phone size={10} /> +54 {p.whatsapp}
                      </p>
                    )}
                  </div>
                </div>

                {assignments.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t space-y-1">
                    {Object.entries(byCategory).map(([catId, tiras]) => {
                      const cat = demoCategories.find(c => c.id === catId)
                      return (
                        <div key={catId} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground w-12">Cat. {cat?.name}</span>
                          {tiras.map(t => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: TIRA_COLORS[t as keyof typeof TIRA_COLORS] }}>
                              {TIRA_LABELS[t as keyof typeof TIRA_LABELS]}
                            </span>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={() => setShowForm(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVO PROFE</h3>
              <button onClick={() => setShowForm(false)} className="text-2xl text-muted-foreground">×</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('✅ Profe creado (demo)'); setShowForm(false); }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
                <input type="text" required placeholder="Juan Pérez" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
                <input type="tel" placeholder="11 4500 1111" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">Las asignaciones a categorías y tiras se hacen después de crear el profe.</p>
              <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
                CREAR PROFE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
