'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, ChevronRight, Edit2, Plus, X, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { demoCategories, demoFinanceCategories, demoEligibilityConfig, demoProfes } from '@/lib/demo-data'

const INITIAL_CAUSALES = [
  'Mala conducta',
  'Falta de respeto al árbitro',
  'Falta de respeto al entrenador',
  'Falta de respeto a compañeros',
  'Indisciplina táctica',
  'Llegada tarde reiterada',
  'Uso de lenguaje inapropiado',
]

const INITIAL_FEES = [
  { id: 'fee-actividad', label: 'Cuota actividad', amount: 62000, period: 'mensual' },
  { id: 'fee-social', label: 'Cuota social', amount: 0, period: 'mensual' },
  { id: 'fee-matricula', label: 'Matrícula', amount: 35000, period: 'anual' },
]

export default function ConfigPage() {
  const [threshold, setThreshold] = useState(demoEligibilityConfig.min_attendance_percentage)
  const [editingThreshold, setEditingThreshold] = useState(false)
  const [tempThreshold, setTempThreshold] = useState(String(threshold))

  const [fees, setFees] = useState(INITIAL_FEES)
  const [editingFee, setEditingFee] = useState<string | null>(null)
  const [tempFee, setTempFee] = useState('')

  const [categories, setCategories] = useState(demoCategories)
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', birth_year: new Date().getFullYear() - 8 })

  const [causales, setCausales] = useState(INITIAL_CAUSALES)
  const [showCausalForm, setShowCausalForm] = useState(false)
  const [newCausal, setNewCausal] = useState('')

  const [financeCats, setFinanceCats] = useState(demoFinanceCategories)
  const [showFinanceForm, setShowFinanceForm] = useState(false)
  const [newFinance, setNewFinance] = useState({ name: '', type: 'expense' as 'income' | 'expense' })

  function saveFee(feeId: string) {
    const amount = Number(tempFee) || 0
    setFees(fees.map(f => f.id === feeId ? { ...f, amount } : f))
    setEditingFee(null)
  }

  function toggleCategory(catId: string) {
    setCategories(categories.map(c => c.id === catId ? { ...c, is_active: !c.is_active } : c))
  }

  function addCategory() {
    if (!newCat.name.trim()) return
    setCategories([...categories, {
      id: `cat-new-${Date.now()}`,
      name: newCat.name,
      birth_year: newCat.birth_year,
      is_active: true,
      created_at: new Date().toISOString(),
    }])
    setNewCat({ name: '', birth_year: new Date().getFullYear() - 8 })
    setShowCatForm(false)
  }

  return (
    <div className="p-3 md:p-6 space-y-3 pb-8">
      <div className="flex items-center gap-2">
        <Settings size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
          CONFIGURACIÓN
        </h1>
      </div>

      {/* Profes */}
      <Link href="/config/profes">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00843D' }}>
              <Users size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Profes</p>
              <p className="text-xs text-muted-foreground">{demoProfes.length} activos · gestionar asignaciones a tiras</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Elegibilidad */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            ELEGIBILIDAD PARA PARTIDOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Asistencia mínima requerida</p>
            {editingThreshold ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tempThreshold}
                  onChange={e => setTempThreshold(e.target.value)}
                  className="w-16 px-2 py-1 border rounded text-sm text-right font-bold"
                  autoFocus
                />
                <span className="text-sm font-bold">%</span>
                <button onClick={() => { setThreshold(Number(tempThreshold)); setEditingThreshold(false); }} className="p-1 rounded text-green-600 hover:bg-green-50">
                  <Check size={16} />
                </button>
                <button onClick={() => { setTempThreshold(String(threshold)); setEditingThreshold(false); }} className="p-1 rounded text-gray-400 hover:bg-gray-50">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
                  {threshold}%
                </span>
                <button onClick={() => setEditingThreshold(true)} className="text-xs px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50 flex items-center gap-1">
                  <Edit2 size={11} /> Editar
                </button>
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Default global. Cada profe puede modificarlo en cada convocatoria puntual.
          </p>
        </CardContent>
      </Card>

      {/* Cuotas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            CUOTAS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fees.map(fee => (
            <div key={fee.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{fee.label}</p>
                <p className="text-xs text-muted-foreground">{fee.period}</p>
              </div>
              {editingFee === fee.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">$</span>
                  <input
                    type="number"
                    value={tempFee}
                    onChange={e => setTempFee(e.target.value)}
                    className="w-24 px-2 py-1 border rounded text-sm text-right font-bold"
                    autoFocus
                  />
                  <button onClick={() => saveFee(fee.id)} className="p-1 rounded text-green-600 hover:bg-green-50">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingFee(null)} className="p-1 rounded text-gray-400 hover:bg-gray-50">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-base whitespace-nowrap" style={{ fontFamily: "var(--font-barlow)" }}>
                    ${fee.amount.toLocaleString('es-AR')}
                  </p>
                  <button onClick={() => { setEditingFee(fee.id); setTempFee(String(fee.amount)); }} className="text-xs p-1 rounded border text-muted-foreground hover:bg-gray-50">
                    <Edit2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categorías */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              CATEGORÍAS
            </CardTitle>
            <button onClick={() => setShowCatForm(!showCatForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: '#00843D' }}>
              <Plus size={12} /> Agregar
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {showCatForm && (
            <div className="flex gap-1.5 pb-2 border-b">
              <input type="text" placeholder="Nombre (ej: 2009)" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                className="flex-1 px-2 py-1.5 border rounded text-sm" />
              <input type="number" placeholder="Año" value={newCat.birth_year} onChange={e => setNewCat({ ...newCat, birth_year: Number(e.target.value) })}
                className="w-20 px-2 py-1.5 border rounded text-sm" />
              <button onClick={addCategory} className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: '#00843D' }}>
                <Check size={14} />
              </button>
            </div>
          )}
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{cat.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${cat.is_active ? 'text-green-700 border-green-300 bg-green-50' : 'text-gray-400'}`}>
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
                <button onClick={() => toggleCategory(cat.id)} className="text-[10px] px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50">
                  {cat.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Causales de apercibimiento */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              CAUSALES DE APERCIBIMIENTO
            </CardTitle>
            <button onClick={() => setShowCausalForm(!showCausalForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: '#00843D' }}>
              <Plus size={12} /> Agregar
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {showCausalForm && (
            <div className="flex gap-1.5 pb-2 border-b">
              <input type="text" placeholder="Nueva causal" value={newCausal} onChange={e => setNewCausal(e.target.value)}
                className="flex-1 px-2 py-1.5 border rounded text-sm" />
              <button
                onClick={() => { if (newCausal.trim()) { setCausales([...causales, newCausal]); setNewCausal(''); setShowCausalForm(false); } }}
                className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: '#00843D' }}>
                <Check size={14} />
              </button>
            </div>
          )}
          {causales.map((c, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 text-sm">
              <span>• {c}</span>
              <button
                onClick={() => setCausales(causales.filter((_, i) => i !== idx))}
                className="p-1 rounded text-red-400 hover:bg-red-50"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categorías de caja */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              CATEGORÍAS DE CAJA
            </CardTitle>
            <button onClick={() => setShowFinanceForm(!showFinanceForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: '#00843D' }}>
              <Plus size={12} /> Agregar
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {showFinanceForm && (
            <div className="flex gap-1.5 pb-2 border-b">
              <input type="text" placeholder="Nombre" value={newFinance.name} onChange={e => setNewFinance({ ...newFinance, name: e.target.value })}
                className="flex-1 px-2 py-1.5 border rounded text-sm" />
              <select value={newFinance.type} onChange={e => setNewFinance({ ...newFinance, type: e.target.value as any })}
                className="px-2 py-1.5 border rounded text-sm">
                <option value="income">Ingreso</option>
                <option value="expense">Egreso</option>
              </select>
              <button
                onClick={() => {
                  if (newFinance.name.trim()) {
                    setFinanceCats([...financeCats, { id: `fc-new-${Date.now()}`, name: newFinance.name, movement_type: newFinance.type, is_active: true, created_at: new Date().toISOString() }])
                    setNewFinance({ name: '', type: 'expense' })
                    setShowFinanceForm(false)
                  }
                }}
                className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: '#00843D' }}>
                <Check size={14} />
              </button>
            </div>
          )}
          {financeCats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1">
              <p className="text-sm">{cat.name}</p>
              <Badge variant="outline" className={`text-[10px] ${cat.movement_type === 'income' ? 'text-green-700 border-green-300' : 'text-red-600 border-red-300'}`}>
                {cat.movement_type === 'income' ? 'Ingreso' : 'Egreso'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
