'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Plus, Phone, ShieldCheck, ShieldAlert, AlertTriangle, Mail } from 'lucide-react'
import Link from 'next/link'
import { getProfesForClub, demoCategories, getAssignmentsForProfe, getProfeComplianceStatus } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { createProfe } from '@/lib/data/ops-store'

export default function ProfesPage() {
  const club = useCurrentClub()
  const [showForm, setShowForm] = useState(false)

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
          <Badge variant="outline">{getProfesForClub(club.id).length}</Badge>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Resumen compliance */}
      <div className="px-3 md:px-4 mt-2">
        {(() => {
          const all = getProfesForClub(club.id).map(p => ({ p, c: getProfeComplianceStatus(p) }))
          const expired = all.filter(x => x.c.status === 'expired').length
          const expiring = all.filter(x => x.c.status === 'expiring_soon').length
          const missing = all.filter(x => x.c.status === 'missing').length
          if (expired === 0 && expiring === 0 && missing === 0) return null
          return (
            <Card className="border-0 shadow-sm bg-amber-50 border-l-4 border-amber-500" style={{ borderLeft: '4px solid #f59e0b' }}>
              <CardContent className="p-2.5 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <div className="text-xs flex-1">
                  <p className="font-bold text-amber-800">Compliance pendiente</p>
                  <p className="text-amber-700 text-[11px]">
                    {expired > 0 && <strong>{expired} con docs vencidos · </strong>}
                    {expiring > 0 && <span>{expiring} próximos a vencer · </span>}
                    {missing > 0 && <span>{missing} sin documentación</span>}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })()}
      </div>

      <div className="p-3 md:p-4 space-y-2">
        {getProfesForClub(club.id).map(p => {
          const assignments = getAssignmentsForProfe(p.id)
          const compliance = getProfeComplianceStatus(p)
          // Agrupar asignaciones por categoría
          const byCategory: Record<string, string[]> = {}
          for (const a of assignments) {
            if (!byCategory[a.category_id]) byCategory[a.category_id] = []
            byCategory[a.category_id].push(a.tira)
          }
          const complianceColor = compliance.status === 'ok' ? '#16a34a'
                                : compliance.status === 'expiring_soon' ? '#f59e0b'
                                : compliance.status === 'expired' ? '#dc2626'
                                : '#6b7280'
          return (
            <Card key={p.id} className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${complianceColor}` }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm truncate">{p.full_name}</p>
                      {compliance.status === 'ok' && <ShieldCheck size={12} className="text-green-600 flex-shrink-0" />}
                      {(compliance.status === 'expired' || compliance.status === 'missing') && <ShieldAlert size={12} className="text-red-600 flex-shrink-0" />}
                      {compliance.status === 'expiring_soon' && <ShieldAlert size={12} className="text-amber-600 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap mt-0.5">
                      {p.whatsapp && <span className="flex items-center gap-0.5"><Phone size={10} /> {p.whatsapp}</span>}
                      {p.email && <span className="flex items-center gap-0.5 truncate"><Mail size={10} /> {p.email}</span>}
                      {p.dni && <span>DNI {p.dni}</span>}
                    </div>
                    {p.title_certifications && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 italic truncate">{p.title_certifications}</p>
                    )}
                  </div>
                </div>

                {/* Compliance issues */}
                {compliance.issues.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {compliance.issues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px]">
                        <AlertTriangle size={9} className={issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'} />
                        <span className={issue.severity === 'high' ? 'text-red-600' : 'text-amber-700'}>
                          {issue.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

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
            <form onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const full_name = String(fd.get('full_name') ?? '').trim()
              const whatsapp = String(fd.get('whatsapp') ?? '').trim()
              if (isRealClub(club.id) && full_name) {
                createProfe(club.id, { full_name, whatsapp: whatsapp || null }).then(r => { if (!r.ok) console.error('profe:', r.error) })
              }
              alert('✅ Profe creado')
              setShowForm(false)
            }} className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block">Nombre completo *</label>
                <input name="full_name" type="text" required placeholder="Juan Pérez" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block">WhatsApp</label>
                <input name="whatsapp" type="tel" placeholder="11 4500 1111" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              </div>
              <p className="text-xs text-muted-foreground">Las asignaciones a categorías y tiras se hacen después de crear el profe.</p>
              <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                CREAR PROFE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
