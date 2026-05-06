'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, TrendingDown, Plus, X } from 'lucide-react'
import { demoCashMovements, demoCashSession, demoFinanceCategories } from '@/lib/demo-data'

export default function CajaPage() {
  const [movements, setMovements] = useState(demoCashMovements)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closed, setClosed] = useState(false)

  const totalIncome = movements.filter(m => m.movement_type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = movements.filter(m => m.movement_type === 'expense').reduce((s, m) => s + m.amount, 0)
  const saldoEsperado = demoCashSession.opening_amount + totalIncome - totalExpense
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  function handleAdd(newMovement: any) {
    setMovements([{ ...newMovement, id: `cm-${movements.length + 1}` }, ...movements])
    setShowAddForm(false)
  }

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet size={22} style={{ color: '#00843D' }} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            CAJA
          </h1>
        </div>
        <Badge variant="outline" className={closed ? "text-gray-500 border-gray-300 bg-gray-50" : "text-green-700 border-green-300 bg-green-50"}>
          {closed ? 'Cerrada' : 'Abierta'}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground capitalize">{today}</p>

      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saldo esperado</p>
          <p className="text-4xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            ${saldoEsperado.toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Apertura</p>
            <p className="text-base font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              ${(demoCashSession.opening_amount / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-green-600 uppercase font-semibold">Ingresos</p>
            <p className="text-base font-bold text-green-600 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              +${(totalIncome / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-red-500 uppercase font-semibold">Egresos</p>
            <p className="text-base font-bold text-red-500 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              -${(totalExpense / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
      </div>

      {!closed && (
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          style={{ backgroundColor: '#00843D' }}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={18} /> AGREGAR MOVIMIENTO
        </button>
      )}

      <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-4" style={{ fontFamily: "var(--font-barlow)" }}>
        Movimientos del día ({movements.length})
      </h2>

      <div className="space-y-2">
        {movements.map(m => {
          const cat = demoFinanceCategories.find(c => c.id === m.finance_category_id)
          const isIncome = m.movement_type === 'income'
          return (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-2.5 flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isIncome
                    ? <TrendingUp size={16} className="text-green-600" />
                    : <TrendingDown size={16} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{m.description}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {cat?.name} · {m.payment_method === 'cash' ? '💵' : '🏦'} {m.payment_method === 'transfer' && m.transfer_reference}
                  </p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-red-500'}`} style={{ fontFamily: "var(--font-barlow)" }}>
                  {isIncome ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!closed ? (
        <button
          className="w-full py-3 rounded-xl font-bold text-sm border-2 text-red-600 border-red-200 hover:bg-red-50 transition-colors mt-4"
          onClick={() => setShowCloseForm(true)}
        >
          CERRAR CAJA DEL DÍA
        </button>
      ) : (
        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-3 text-center text-sm text-muted-foreground">
            ✓ Caja cerrada · saldo final registrado
          </CardContent>
        </Card>
      )}

      {showAddForm && <AddMovementModal onClose={() => setShowAddForm(false)} onSubmit={handleAdd} />}
      {showCloseForm && (
        <CloseCashModal
          expectedAmount={saldoEsperado}
          onClose={() => setShowCloseForm(false)}
          onConfirm={() => { setClosed(true); setShowCloseForm(false); }}
        />
      )}
    </div>
  )
}

function AddMovementModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (m: any) => void }) {
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(demoFinanceCategories[0].id)
  const [description, setDescription] = useState('')
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [reference, setReference] = useState('')

  const validCategories = demoFinanceCategories.filter(c => c.movement_type === type || c.movement_type === 'both')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      session_id: 'cs-1',
      movement_type: type,
      amount: Number(amount),
      finance_category_id: categoryId,
      description,
      payment_method: method,
      transfer_reference: method === 'transfer' ? reference : null,
      registered_by: null,
      created_at: new Date().toISOString(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVO MOVIMIENTO</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setType('income'); setCategoryId(demoFinanceCategories.find(c => c.movement_type === 'income')!.id); }}
              className={`py-2.5 rounded-lg text-sm font-bold border ${type === 'income' ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={type === 'income' ? { backgroundColor: '#00843D' } : {}}>
              ↑ Ingreso
            </button>
            <button type="button" onClick={() => { setType('expense'); setCategoryId(demoFinanceCategories.find(c => c.movement_type === 'expense')!.id); }}
              className={`py-2.5 rounded-lg text-sm font-bold border ${type === 'expense' ? 'text-white border-transparent' : 'border-gray-200'}`}
              style={type === 'expense' ? { backgroundColor: '#DC2626' } : {}}>
              ↓ Egreso
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Monto *</label>
            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0" className="w-full px-3 py-2.5 border rounded-lg text-base font-bold" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Categoría *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full px-3 py-2.5 border rounded-lg text-sm">
              {validCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Descripción</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Detalle del movimiento" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block">Medio</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMethod('cash')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${method === 'cash' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={method === 'cash' ? { backgroundColor: '#00843D' } : {}}>💵 Efectivo</button>
              <button type="button" onClick={() => setMethod('transfer')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${method === 'transfer' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={method === 'transfer' ? { backgroundColor: '#1d4ed8' } : {}}>🏦 Transferencia</button>
            </div>
          </div>

          {method === 'transfer' && (
            <div>
              <label className="text-xs font-semibold mb-1 block">N° comprobante *</label>
              <input type="text" required value={reference} onChange={e => setReference(e.target.value)}
                placeholder="Ej: MP-12345" className="w-full px-3 py-2.5 border rounded-lg text-sm" />
            </div>
          )}

          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
            REGISTRAR
          </button>
        </form>
      </div>
    </div>
  )
}

function CloseCashModal({ expectedAmount, onClose, onConfirm }: { expectedAmount: number; onClose: () => void; onConfirm: () => void }) {
  const [counted, setCounted] = useState('')
  const countedNum = Number(counted) || 0
  const diff = countedNum - expectedAmount

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>CERRAR CAJA</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <Card className="border-0 bg-gray-50">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Saldo esperado al cierre</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
              ${expectedAmount.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>

        <div>
          <label className="text-xs font-semibold mb-1 block">Saldo contado físicamente *</label>
          <input type="number" required value={counted} onChange={e => setCounted(e.target.value)}
            autoFocus placeholder="0" className="w-full px-3 py-3 border rounded-lg text-2xl font-bold text-center" />
        </div>

        {counted && (
          <Card className={`border-0 ${diff === 0 ? 'bg-green-50' : diff > 0 ? 'bg-blue-50' : 'bg-red-50'}`}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p className={`text-2xl font-bold ${diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`} style={{ fontFamily: "var(--font-barlow)" }}>
                {diff > 0 ? '+' : ''}${diff.toLocaleString('es-AR')}
              </p>
              <p className="text-[11px] mt-0.5">
                {diff === 0 ? '✅ Cuadra exacto' : diff > 0 ? '↑ Sobrante' : '↓ Faltante'}
              </p>
            </CardContent>
          </Card>
        )}

        <button onClick={onConfirm} disabled={!counted} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: '#DC2626' }}>
          CONFIRMAR CIERRE
        </button>
      </div>
    </div>
  )
}
