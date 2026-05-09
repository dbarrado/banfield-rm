'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Users, ChevronRight, Edit2, Plus, X, Check, Trash2, History, Volleyball, Calendar, Link2, Share2, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { demoCategories, demoFinanceCategories, demoEligibilityConfig, demoEligibilityLog, demoProfes } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import {
  getCodesByClub, addRegistrationCode, updateRegistrationCode, deleteRegistrationCode,
  generateRandomCode,
} from '@/lib/registration'
import type { RegistrationCode } from '@/types'
import { getMatchConfig, saveMatchConfig, DEFAULT_MATCH_CONFIG, resetMatchConfig } from '@/lib/match-config'
import type { SportCode } from '@/lib/sports'

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
  const club = useCurrentClub()
  const [practiceThreshold, setPracticeThreshold] = useState(demoEligibilityConfig.min_practice_percentage)
  const [matchThreshold, setMatchThreshold] = useState(demoEligibilityConfig.min_match_percentage)

  // Máximos de convocatoria por deporte (persisten por club + sportCode)
  const matchSports: SportCode[] = Object.keys(DEFAULT_MATCH_CONFIG) as SportCode[]
  const [matchConfigs, setMatchConfigs] = useState<Record<string, { titulares: number; suplentes: number }>>({})
  // Cargar al primer render
  useState(() => {
    if (typeof window === 'undefined') return
    const next: Record<string, { titulares: number; suplentes: number }> = {}
    for (const sc of matchSports) next[sc] = getMatchConfig(club.id, sc)
    setMatchConfigs(next)
    return undefined
  })

  function updateMatchSport(sc: string, field: 'titulares' | 'suplentes', value: number) {
    const cur = matchConfigs[sc] ?? DEFAULT_MATCH_CONFIG[sc]
    const next = { ...cur, [field]: value }
    setMatchConfigs(prev => ({ ...prev, [sc]: next }))
    saveMatchConfig(club.id, sc, next)
  }

  const [fees, setFees] = useState(INITIAL_FEES)
  const [editingFee, setEditingFee] = useState<string | null>(null)
  const [tempFee, setTempFee] = useState('')

  const [categories, setCategories] = useState(demoCategories)
  const [showCatForm, setShowCatForm] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', birth_year: new Date().getFullYear() - 8 })

  const [causales, setCausales] = useState(INITIAL_CAUSALES)
  const [showCausalForm, setShowCausalForm] = useState(false)
  const [newCausal, setNewCausal] = useState('')

  // Códigos de inscripción
  const [regCodes, setRegCodes] = useState<RegistrationCode[]>([])
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [newCodeCat, setNewCodeCat] = useState('')
  const [newCodeMaxUses, setNewCodeMaxUses] = useState('')
  const [newCodeExpires, setNewCodeExpires] = useState('')

  // Cargar códigos al montar
  useState(() => {
    if (typeof window === 'undefined') return
    setRegCodes(getCodesByClub(club.id))
    return undefined
  })

  function reloadCodes() { setRegCodes(getCodesByClub(club.id)) }

  function createCode() {
    if (!newCodeCat) return alert('Elegí una categoría')
    const cat = demoCategories.find(c => c.id === newCodeCat)
    if (!cat) return
    const prefix = `${club.short_name.replace(/\s+/g, '').slice(0, 3).toUpperCase()}-${cat.name}`
    const code: RegistrationCode = {
      id: `rc-${Date.now()}`,
      club_id: club.id,
      category_id: newCodeCat,
      code: generateRandomCode(prefix),
      expires_at: newCodeExpires || null,
      max_uses: newCodeMaxUses ? Number(newCodeMaxUses) : null,
      current_uses: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      created_by: null,
    }
    addRegistrationCode(code)
    reloadCodes()
    setShowCodeForm(false)
    setNewCodeCat(''); setNewCodeMaxUses(''); setNewCodeExpires('')
  }

  function toggleCodeActive(c: RegistrationCode) {
    updateRegistrationCode(c.id, { is_active: !c.is_active })
    reloadCodes()
  }

  function removeCode(c: RegistrationCode) {
    if (!confirm(`¿Eliminar código ${c.code}?`)) return
    deleteRegistrationCode(c.id)
    reloadCodes()
  }

  function shareCode(c: RegistrationCode) {
    const url = `https://camadaclub.com.ar/inscripcion/${c.code}`
    const cat = demoCategories.find(x => x.id === c.category_id)
    const msg = `¡Hola! Te invito a inscribir a tu hijo/a en ${club.name} – Categoría ${cat?.name ?? ''}.\n\nCompletá la inscripción en este link:\n${url}`
    const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(wa, '_blank')
  }

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
        <Settings size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
        <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          CONFIGURACIÓN
        </h1>
      </div>

      {/* Cronograma de prácticas */}
      <Link href="/config/cronograma">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#7c3aed' }}>
              <Calendar size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Cronograma de prácticas</p>
              <p className="text-xs text-muted-foreground">Plantilla semanal por día, horario, cancha y profe</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Deportes y formatos */}
      <Link href="/deportes">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1d4ed8' }}>
              <Volleyball size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Deportes y formatos</p>
              <p className="text-xs text-muted-foreground">Catálogo soportado, asignar formato por categoría</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Profes */}
      <Link href="/config/profes">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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

      {/* Elegibilidad para partidos — DOS umbrales */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            ELEGIBILIDAD PARA PARTIDOS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-muted-foreground">
            Definí los mínimos generales del club. Los profes pueden modificarlos en convocatorias puntuales —
            cada cambio queda registrado abajo.
          </p>

          {/* Slider prácticas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1">🏃 Mínimo de prácticas</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
                {practiceThreshold}%
              </p>
            </div>
            <input
              type="range" min="0" max="100" step="5"
              value={practiceThreshold}
              onChange={e => setPracticeThreshold(Number(e.target.value))}
              className="w-full accent-[#00843D]"
            />
          </div>

          {/* Slider partidos */}
          <div className="space-y-1.5 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold flex items-center gap-1">⚽ Mínimo de partidos</p>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>
                {matchThreshold}%
              </p>
            </div>
            <input
              type="range" min="0" max="100" step="5"
              value={matchThreshold}
              onChange={e => setMatchThreshold(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>

          {(practiceThreshold !== demoEligibilityConfig.min_practice_percentage ||
            matchThreshold !== demoEligibilityConfig.min_match_percentage) && (
            <button
              onClick={() => alert(`✅ Umbrales actualizados (demo)\nPrácticas: ${practiceThreshold}%\nPartidos: ${matchThreshold}%\n\nQueda registrado en el log de cambios.`)}
              className="w-full py-2 rounded-lg text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--club-primary, #00843D)' }}
            >
              GUARDAR CAMBIOS
            </button>
          )}
        </CardContent>
      </Card>

      {/* Audit log — PC primary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
            <History size={14} /> HISTORIAL DE CAMBIOS DE UMBRALES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {demoEligibilityLog.map(log => {
              const isOverride = log.scope === 'convocation'
              const typeLabel = log.type === 'practice_threshold' ? '🏃 Prácticas (general)'
                              : log.type === 'match_threshold' ? '⚽ Partidos (general)'
                              : '🎯 Override en convocatoria'
              return (
                <div key={log.id} className={`p-2.5 rounded-lg border ${isOverride ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabel}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(log.changed_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono font-bold text-red-500 line-through">{log.old_value}%</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-bold" style={{ color: isOverride ? '#f59e0b' : '#00843D' }}>
                      {log.new_value}%
                    </span>
                    {log.category_name && (
                      <Badge className="text-[10px] bg-blue-100 text-blue-700 border-0 ml-1">
                        Cat. {log.category_name}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Por <strong>{log.changed_by}</strong>
                    {log.reason && <span className="italic"> · "{log.reason}"</span>}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            Solo el admin puede modificar los umbrales generales. Los profes pueden hacer overrides puntuales en cada convocatoria.
          </p>
        </CardContent>
      </Card>

      {/* Máximos de convocatoria por deporte */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            MÁXIMOS DE CONVOCATORIA POR ACTIVIDAD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Cuántos titulares y suplentes admite cada actividad para este club. También se puede ajustar desde la pantalla del partido.
          </p>
          {matchSports.map(sc => {
            const cfg = matchConfigs[sc] ?? DEFAULT_MATCH_CONFIG[sc]
            const def = DEFAULT_MATCH_CONFIG[sc]
            const overridden = cfg.titulares !== def.titulares || cfg.suplentes !== def.suplentes
            const sportLabels: Record<string, string> = {
              football_11: 'Fútbol 11', baby_6: 'Baby 6', baby_5: 'Baby 5', futsal: 'Futsal',
              hockey_field: 'Hockey', volleyball: 'Vóley', basketball: 'Básquet',
              rugby_7: 'Rugby 7s', rugby_15: 'Rugby 15', handball_7: 'Handball',
            }
            return (
              <div key={sc} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                <p className="text-sm font-medium flex-1 truncate">{sportLabels[sc] ?? sc}</p>
                {overridden && <Badge variant="outline" className="text-[9px] text-blue-700 border-blue-200">Custom</Badge>}
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] text-muted-foreground">Tit.</label>
                  <input type="number" min={1} max={30} value={cfg.titulares}
                    onChange={e => updateMatchSport(sc, 'titulares', Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="w-12 px-1.5 py-1 border rounded text-xs text-right font-bold" />
                  <label className="text-[10px] text-muted-foreground">Sup.</label>
                  <input type="number" min={0} max={20} value={cfg.suplentes}
                    onChange={e => updateMatchSport(sc, 'suplentes', Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                    className="w-12 px-1.5 py-1 border rounded text-xs text-right font-bold" />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Códigos de inscripción */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
              <UserPlus size={14} /> CÓDIGOS DE INSCRIPCIÓN
            </CardTitle>
            <button onClick={() => setShowCodeForm(!showCodeForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
              <Plus size={12} /> Nuevo
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Generá un código por categoría y compartilo por WhatsApp. Los tutores pueden inscribir a sus hijos sin necesidad de crear cuenta primero.
          </p>

          {showCodeForm && (
            <div className="bg-gray-50 border rounded-lg p-2 space-y-2">
              <select value={newCodeCat} onChange={e => setNewCodeCat(e.target.value)}
                className="w-full px-2 py-1.5 border rounded text-sm bg-white">
                <option value="">Elegí categoría...</option>
                {demoCategories.filter(c => !c.club_id || c.club_id === club.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[10px] text-muted-foreground">Vence (opcional)</label>
                  <input type="date" value={newCodeExpires} onChange={e => setNewCodeExpires(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Máx. usos</label>
                  <input type="number" placeholder="Sin límite" value={newCodeMaxUses} onChange={e => setNewCodeMaxUses(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs" />
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setShowCodeForm(false)} className="flex-1 py-1.5 rounded border text-xs">Cancelar</button>
                <button onClick={createCode} className="flex-1 py-1.5 rounded text-white text-xs font-semibold" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
                  Generar
                </button>
              </div>
            </div>
          )}

          {regCodes.length === 0 && !showCodeForm && (
            <p className="text-xs text-muted-foreground italic text-center py-2">
              Todavía no generaste códigos para este club.
            </p>
          )}

          {regCodes.map(c => {
            const cat = demoCategories.find(x => x.id === c.category_id)
            const url = `camadaclub.com.ar/inscripcion/${c.code}`
            return (
              <div key={c.id} className="border rounded-lg p-2 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-bold text-sm">{c.code}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Cat. {cat?.name ?? c.category_id} ·{' '}
                      {c.current_uses}/{c.max_uses ?? '∞'} usos
                      {c.expires_at && ` · vence ${c.expires_at}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${c.is_active ? 'text-green-700 border-green-300 bg-green-50' : 'text-gray-400'}`}>
                    {c.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <p className="text-[10px] text-blue-600 truncate flex items-center gap-1">
                  <Link2 size={10} /> {url}
                </p>
                <div className="flex gap-1.5">
                  <button onClick={() => shareCode(c)} className="flex-1 py-1 rounded text-white text-[11px] font-semibold flex items-center justify-center gap-1" style={{ backgroundColor: '#25D366' }}>
                    <Share2 size={10} /> WhatsApp
                  </button>
                  <button onClick={() => toggleCodeActive(c)} className="flex-1 py-1 rounded border text-[11px] font-semibold">
                    {c.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => removeCode(c)} className="px-2 py-1 rounded border text-red-500 border-red-200">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            )
          })}
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
            <button onClick={() => setShowCatForm(!showCatForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
              <button onClick={addCategory} className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
            <button onClick={() => setShowCausalForm(!showCausalForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
                className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
            <button onClick={() => setShowFinanceForm(!showFinanceForm)} className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
                className="px-3 py-1.5 rounded text-white text-sm font-semibold" style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
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
