'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Users, MessageCircle, Plus, X, Check, CreditCard, Banknote, UserPlus, Clock } from 'lucide-react'
import { demoPlayers, demoCategories, getSiblings } from '@/lib/demo-data'
import { generateBillingsForPeriod, loadBillingConfig, type Billing } from '@/lib/billings'
import { getAvatarUrl } from '@/lib/avatars'

type Step = 'search' | 'select_fees' | 'payment' | 'done'

type Contact = { name: string; whatsapp: string; relation?: string; isPrimary?: boolean }

const RECENT_KEY = 'plantel_recent_cobros'

export default function CobrarPage() {
  const today = new Date()
  const period = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const cfg = useMemo(() => loadBillingConfig(), [])

  // Generamos billings una sola vez por sesión y los mantenemos en estado para poder marcarlos pagados
  const [billings, setBillings] = useState<Billing[]>(() => generateBillingsForPeriod(period, today, cfg))
  const [step, setStep] = useState<Step>('search')
  const [query, setQuery] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [includeSiblings, setIncludeSiblings] = useState(true)
  const [selectedBillingIds, setSelectedBillingIds] = useState<Set<string>>(new Set())
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [reference, setReference] = useState('')
  const [chosenContactIdx, setChosenContactIdx] = useState(0)
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', whatsapp: '', relation: '' })
  const [extraContacts, setExtraContacts] = useState<Record<string, Contact[]>>({}) // playerId → contacts persistidos durante la sesión
  const [recent, setRecent] = useState<{ at: string; players: string[]; total: number }[]>([])
  const [doneInfo, setDoneInfo] = useState<{ contact: Contact | null; total: number; players: string[] } | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (step === 'search') searchRef.current?.focus()
  }, [step])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {}
  }, [])

  // ── Búsqueda ───────────────────────────────────────────────────────────
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const isDni = /^\d{4,}$/.test(q)
    return demoPlayers
      .filter(p => p.is_active)
      .filter(p => {
        if (isDni) return p.dni?.includes(q)
        return p.full_name.toLowerCase().includes(q)
      })
      .slice(0, 8)
  }, [query])

  function selectPlayer(playerId: string) {
    const siblings = includeSiblings ? getSiblings(playerId).map((s: any) => s.id) : []
    const ids = [playerId, ...siblings]
    setSelectedPlayerIds(ids)
    // Pre-tildar todas las cuotas pendientes de los seleccionados
    const pendingForThem = billings.filter(b => ids.includes(b.player_id) && b.status !== 'paid')
    setSelectedBillingIds(new Set(pendingForThem.map(b => b.id)))
    setStep('select_fees')
  }

  // ── Cálculo del total ──────────────────────────────────────────────────
  const billingsForSelected = billings.filter(b => selectedPlayerIds.includes(b.player_id))
  const billingsToCharge = billingsForSelected.filter(b => selectedBillingIds.has(b.id))
  const total = billingsToCharge.reduce((s, b) => s + b.amount_final + b.late_fee_amount, 0)

  // ── Contactos disponibles del primer player (suficiente para WhatsApp) ─
  const primaryPlayer = demoPlayers.find(p => p.id === selectedPlayerIds[0])
  const availableContacts: Contact[] = useMemo(() => {
    if (!primaryPlayer) return []
    const list: Contact[] = []
    if (primaryPlayer.tutor_whatsapp || primaryPlayer.tutor_name) {
      list.push({
        name: primaryPlayer.tutor_name ?? 'Tutor',
        whatsapp: primaryPlayer.tutor_whatsapp ?? '',
        relation: 'Titular',
        isPrimary: true,
      })
    }
    const stored = (primaryPlayer.alt_contacts ?? []) as Contact[]
    list.push(...stored)
    list.push(...(extraContacts[primaryPlayer.id] ?? []))
    return list
  }, [primaryPlayer, extraContacts])

  // ── Acciones ───────────────────────────────────────────────────────────
  function toggleBilling(id: string) {
    setSelectedBillingIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function addContact() {
    if (!newContact.name.trim() || !newContact.whatsapp.trim() || !primaryPlayer) return
    const c: Contact = { name: newContact.name, whatsapp: newContact.whatsapp, relation: newContact.relation || 'Familiar' }
    // En prod esto persiste en la ficha del socio. Acá lo guardamos en sesión + localStorage.
    setExtraContacts(prev => ({ ...prev, [primaryPlayer.id]: [...(prev[primaryPlayer.id] ?? []), c] }))
    setChosenContactIdx(availableContacts.length) // apuntar al recién agregado
    setNewContact({ name: '', whatsapp: '', relation: '' })
    setShowAddContact(false)
  }

  function confirmCharge() {
    // Marcar billings como pagados (mock)
    setBillings(prev => prev.map(b => selectedBillingIds.has(b.id)
      ? { ...b, status: 'paid', paid_at: today.toISOString().slice(0, 10), payment_method: method }
      : b
    ))
    const playerNames = selectedPlayerIds.map(id => demoPlayers.find(p => p.id === id)?.full_name ?? '?')
    const next = [{ at: today.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), players: playerNames, total }, ...recent].slice(0, 5)
    setRecent(next)
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)) } catch {}
    setDoneInfo({ contact: availableContacts[chosenContactIdx] ?? null, total, players: playerNames })
    setStep('done')
  }

  function resetForNext() {
    setQuery('')
    setSelectedPlayerIds([])
    setSelectedBillingIds(new Set())
    setMethod('cash')
    setReference('')
    setChosenContactIdx(0)
    setShowAddContact(false)
    setDoneInfo(null)
    setStep('search')
  }

  function buildWhatsAppLink(c: Contact) {
    const periods = billingsToCharge.map(b => b.period).join(', ')
    const playerNames = selectedPlayerIds.map(id => demoPlayers.find(p => p.id === id)?.full_name.split(' ')[0]).join(' y ')
    const text = `✅ ${c.name}, recibimos tu pago de $${total.toLocaleString('es-AR')} por la cuota ${periods} de ${playerNames}. ¡Gracias! — Filial Banfield Ramos Mejía.`
    return `https://wa.me/${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-3 md:p-6 space-y-3 pb-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <Link href="/caja" className="text-xs flex items-center gap-1 text-muted-foreground">
          <ArrowLeft size={14} /> Caja
        </Link>
        <Badge variant="outline" className="text-[10px]">Período {period}</Badge>
      </div>

      <h1 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'var(--font-barlow)', color: 'var(--club-primary, #00843D)' }}>
        <CreditCard size={22} /> COBRAR CUOTA
      </h1>

      {/* Stepper */}
      <div className="flex gap-1 text-[10px] uppercase font-bold">
        {(['search', 'select_fees', 'payment', 'done'] as Step[]).map((s, i) => {
          const active = step === s
          const done = (['search', 'select_fees', 'payment', 'done'] as Step[]).indexOf(step) > i
          return (
            <div key={s} className={`flex-1 py-1 text-center rounded ${active ? 'text-white' : done ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100'}`}
              style={active ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}>
              {s === 'search' && '1. Buscar'}
              {s === 'select_fees' && '2. Cuotas'}
              {s === 'payment' && '3. Pago'}
              {s === 'done' && '4. Listo'}
            </div>
          )
        })}
      </div>

      {/* ─── STEP 1: Búsqueda ─────────────────────────────────────────── */}
      {step === 'search' && (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, apellido o DNI…"
                  className="w-full pl-8 pr-3 py-3 border-2 rounded-lg text-base font-medium focus:outline-none focus:border-[#00843D]"
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={includeSiblings} onChange={e => setIncludeSiblings(e.target.checked)} />
                Cobrar a toda la familia si tiene hermanos
              </label>
            </CardContent>
          </Card>

          <div className="space-y-1.5">
            {matches.map(p => {
              const cat = demoCategories.find(c => c.id === p.category_id)
              const siblings = getSiblings(p.id)
              const familySize = 1 + siblings.length
              const familyIds = [p.id, ...siblings.map((s: any) => s.id)]
              const familyPending = billings.filter(b => familyIds.includes(b.player_id) && b.status !== 'paid')
              const familyTotal = familyPending.reduce((s, b) => s + b.amount_final + b.late_fee_amount, 0)
              return (
                <button key={p.id} onClick={() => selectPlayer(p.id)} className="w-full text-left">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-2.5 flex items-center gap-2.5">
                      <img src={getAvatarUrl(p)} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{p.full_name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">Cat. {cat?.name}</Badge>
                          {p.dni && <span className="text-[10px] text-muted-foreground">DNI {p.dni}</span>}
                          {familySize > 1 && includeSiblings && (
                            <Badge className="text-[10px] bg-purple-50 text-purple-700 border-0">
                              <Users size={9} className="mr-0.5" /> Familia ({familySize})
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {familyTotal > 0 ? (
                          <>
                            <p className="text-sm font-bold text-red-600" style={{ fontFamily: 'var(--font-barlow)' }}>
                              ${familyTotal.toLocaleString('es-AR')}
                            </p>
                            <p className="text-[9px] text-red-600">{familyPending.length} cuota{familyPending.length === 1 ? '' : 's'}</p>
                          </>
                        ) : (
                          <Badge className="text-[10px] bg-green-50 text-green-700 border-0">Al día</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
              )
            })}
            {query.length >= 2 && matches.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">Sin resultados para "{query}"</p>
            )}
          </div>

          {recent.length > 0 && query.length < 2 && (
            <div className="pt-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 flex items-center gap-1">
                <Clock size={11} /> Últimos cobros del día
              </p>
              <div className="space-y-1">
                {recent.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                    <span className="truncate">{r.at} · {r.players.join(', ')}</span>
                    <span className="font-bold text-green-700">${r.total.toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── STEP 2: Cuotas ───────────────────────────────────────────── */}
      {step === 'select_fees' && (
        <>
          <Card className="border-0 shadow-sm bg-green-50 border-l-4 border-l-green-600">
            <CardContent className="p-3">
              <p className="text-[10px] uppercase font-bold text-green-700">Total a cobrar</p>
              <p className="text-3xl font-bold text-green-700" style={{ fontFamily: 'var(--font-barlow)' }}>
                ${total.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] text-green-700">{selectedBillingIds.size} cuota(s) seleccionadas</p>
            </CardContent>
          </Card>

          <div className="space-y-1.5">
            {selectedPlayerIds.map(pid => {
              const player = demoPlayers.find(p => p.id === pid)!
              const playerBillings = billingsForSelected.filter(b => b.player_id === pid)
              return (
                <Card key={pid} className="border-0 shadow-sm">
                  <CardContent className="p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <img src={getAvatarUrl(player)} alt="" className="w-8 h-8 rounded-full" />
                      <p className="text-sm font-semibold flex-1">{player.full_name}</p>
                    </div>
                    {playerBillings.length === 0 && (
                      <p className="text-[11px] text-muted-foreground italic">Sin cuotas pendientes este mes</p>
                    )}
                    {playerBillings.map(b => {
                      const checked = selectedBillingIds.has(b.id)
                      const disabled = b.status === 'paid'
                      return (
                        <label key={b.id} className={`flex items-center gap-2 p-2 rounded border ${checked ? 'border-green-600 bg-green-50' : 'border-gray-200'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleBilling(b.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">Cuota {b.period} {disabled && '(pagada)'}</p>
                            {b.discount_pct > 0 && <p className="text-[10px] text-purple-700">-{b.discount_pct}% hermano</p>}
                            {b.late_fee_amount > 0 && <p className="text-[10px] text-red-600">Recargo mora: ${b.late_fee_amount.toLocaleString('es-AR')}</p>}
                          </div>
                          <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
                            ${(b.amount_final + b.late_fee_amount).toLocaleString('es-AR')}
                          </p>
                        </label>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex gap-2 sticky bottom-20 md:bottom-4">
            <button onClick={() => setStep('search')} className="flex-1 py-3 rounded-xl border-2 font-bold text-sm">
              Atrás
            </button>
            <button onClick={() => setStep('payment')} disabled={total === 0}
              className="flex-[2] py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
              style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
              Continuar — ${total.toLocaleString('es-AR')}
            </button>
          </div>
        </>
      )}

      {/* ─── STEP 3: Pago ─────────────────────────────────────────────── */}
      {step === 'payment' && (
        <>
          <Card className="border-0 shadow-sm bg-green-50 border-l-4 border-l-green-600">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-green-700">Total</p>
              <p className="text-3xl font-bold text-green-700" style={{ fontFamily: 'var(--font-barlow)' }}>
                ${total.toLocaleString('es-AR')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Medio de pago</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setMethod('cash')}
                  className={`py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 border-2 ${method === 'cash' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                  style={method === 'cash' ? { backgroundColor: '#00843D' } : {}}>
                  <Banknote size={16} /> Efectivo
                </button>
                <button onClick={() => setMethod('transfer')}
                  className={`py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-1.5 border-2 ${method === 'transfer' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                  style={method === 'transfer' ? { backgroundColor: '#1d4ed8' } : {}}>
                  <CreditCard size={16} /> Transferencia
                </button>
              </div>
              {method === 'transfer' && (
                <input value={reference} onChange={e => setReference(e.target.value)}
                  placeholder="N° de comprobante" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase text-muted-foreground">¿Quién está pagando?</p>
                <button onClick={() => setShowAddContact(!showAddContact)} className="text-[11px] flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
                  <UserPlus size={11} /> Otro contacto
                </button>
              </div>
              <div className="space-y-1.5">
                {availableContacts.map((c, idx) => (
                  <label key={idx} className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${chosenContactIdx === idx ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}>
                    <input type="radio" checked={chosenContactIdx === idx} onChange={() => setChosenContactIdx(idx)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{c.name} {c.isPrimary && <Badge variant="outline" className="text-[9px] ml-1">Titular</Badge>}</p>
                      <p className="text-[10px] text-muted-foreground">{c.relation ?? '—'} · {c.whatsapp || 'sin WhatsApp'}</p>
                    </div>
                  </label>
                ))}
                {availableContacts.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No hay contactos guardados. Agregá uno con el botón de arriba.</p>
                )}
              </div>
              {showAddContact && (
                <div className="bg-purple-50 rounded-lg p-2.5 space-y-2 border border-purple-200">
                  <p className="text-[11px] font-bold text-purple-700 uppercase">Nuevo contacto</p>
                  <input value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Nombre completo" className="w-full px-2.5 py-2 border rounded text-sm" />
                  <input value={newContact.whatsapp} onChange={e => setNewContact({ ...newContact, whatsapp: e.target.value })}
                    placeholder="WhatsApp (ej: 11 4567 8901)" className="w-full px-2.5 py-2 border rounded text-sm" />
                  <select value={newContact.relation} onChange={e => setNewContact({ ...newContact, relation: e.target.value })}
                    className="w-full px-2.5 py-2 border rounded text-sm">
                    <option value="">Relación…</option>
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Abuelo/a">Abuelo/a</option>
                    <option value="Tutor">Tutor legal</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <div className="flex gap-1.5">
                    <button onClick={() => setShowAddContact(false)} className="flex-1 py-1.5 rounded border text-xs font-bold">Cancelar</button>
                    <button onClick={addContact} className="flex-1 py-1.5 rounded text-white text-xs font-bold flex items-center justify-center gap-1" style={{ backgroundColor: '#7c3aed' }}>
                      <Check size={11} /> Guardar
                    </button>
                  </div>
                  <p className="text-[10px] text-purple-700 italic">Queda guardado en la ficha del socio para próximas veces.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 sticky bottom-20 md:bottom-4">
            <button onClick={() => setStep('select_fees')} className="flex-1 py-3 rounded-xl border-2 font-bold text-sm">
              Atrás
            </button>
            <button onClick={confirmCharge} disabled={method === 'transfer' && !reference}
              className="flex-[2] py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
              <Check size={16} /> COBRAR ${total.toLocaleString('es-AR')}
            </button>
          </div>
        </>
      )}

      {/* ─── STEP 4: Listo ────────────────────────────────────────────── */}
      {step === 'done' && doneInfo && (
        <>
          <Card className="border-0 shadow-md bg-green-50 border-l-4 border-l-green-600">
            <CardContent className="p-4 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-green-600 mx-auto flex items-center justify-center">
                <Check size={28} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-green-700" style={{ fontFamily: 'var(--font-barlow)' }}>
                ${doneInfo.total.toLocaleString('es-AR')}
              </p>
              <p className="text-sm">Cobrado a {doneInfo.players.join(', ')}</p>
              {doneInfo.contact && <p className="text-[11px] text-muted-foreground">Pagó: {doneInfo.contact.name} ({doneInfo.contact.relation})</p>}
            </CardContent>
          </Card>

          {doneInfo.contact?.whatsapp && (
            <a href={buildWhatsAppLink(doneInfo.contact)} target="_blank" rel="noreferrer"
              className="block w-full py-3 rounded-xl text-white font-bold text-sm text-center flex items-center justify-center gap-1.5"
              style={{ backgroundColor: '#25D366' }}>
              <MessageCircle size={16} /> Enviar comprobante a {doneInfo.contact.name}
            </a>
          )}

          <button onClick={resetForNext}
            className="w-full py-3 rounded-xl text-white font-bold text-sm sticky bottom-20 md:bottom-4"
            style={{ backgroundColor: 'var(--club-primary, #00843D)' }}>
            COBRAR AL SIGUIENTE →
          </button>
        </>
      )}
    </div>
  )
}
