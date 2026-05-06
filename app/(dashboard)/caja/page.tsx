'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { demoCashMovements, demoCashSession, demoFinanceCategories } from '@/lib/demo-data'

export default function CajaPage() {
  const totalIncome = demoCashMovements.filter(m => m.movement_type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = demoCashMovements.filter(m => m.movement_type === 'expense').reduce((s, m) => s + m.amount, 0)
  const saldoEsperado = demoCashSession.opening_amount + totalIncome - totalExpense
  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Wallet size={22} style={{ color: '#00843D' }} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            CAJA
          </h1>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 flex-shrink-0">Abierta</Badge>
      </div>

      <p className="text-xs text-muted-foreground capitalize">{today}</p>

      {/* Saldo grande arriba */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saldo esperado</p>
          <p className="text-4xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            ${saldoEsperado.toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      {/* 3 KPIs en una fila apretada */}
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

      {/* Botón agregar */}
      <button
        className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
        style={{ backgroundColor: '#00843D' }}
        onClick={() => alert('Formulario de agregar movimiento (modo demo)')}
      >
        <Plus size={18} /> AGREGAR MOVIMIENTO
      </button>

      {/* Movimientos */}
      <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mt-4" style={{ fontFamily: "var(--font-barlow)" }}>
        Movimientos del día ({demoCashMovements.length})
      </h2>

      <div className="space-y-2">
        {demoCashMovements.map(m => {
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

      <button
        className="w-full py-3 rounded-xl font-bold text-sm border-2 text-red-600 border-red-200 hover:bg-red-50 transition-colors mt-4"
        onClick={() => alert('Cierre de caja registrado (modo demo)')}
      >
        CERRAR CAJA DEL DÍA
      </button>
    </div>
  )
}
