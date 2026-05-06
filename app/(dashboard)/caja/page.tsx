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
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={22} style={{ color: '#00843D' }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            CAJA
          </h1>
        </div>
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Abierta</Badge>
      </div>

      <p className="text-sm text-muted-foreground capitalize">{today}</p>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Apertura</p>
            <p className="text-xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ${demoCashSession.opening_amount.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Ingresos</p>
            <p className="text-xl font-bold text-green-600" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              +${totalIncome.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm text-center">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-1">Egresos</p>
            <p className="text-xl font-bold text-red-500" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              -${totalExpense.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
        <CardContent className="p-4 flex justify-between items-center">
          <p className="font-semibold text-sm">Saldo esperado al cierre</p>
          <p className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            ${saldoEsperado.toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      {/* Movimientos */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>MOVIMIENTOS DEL DÍA</h2>
        <button className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: '#00843D' }}>
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="space-y-2">
        {demoCashMovements.map(m => {
          const cat = demoFinanceCategories.find(c => c.id === m.finance_category_id)
          return (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.movement_type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {m.movement_type === 'income'
                    ? <TrendingUp size={16} className="text-green-600" />
                    : <TrendingDown size={16} className="text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.description}</p>
                  <p className="text-xs text-muted-foreground">{cat?.name} · {m.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
                </div>
                <p className={`font-bold text-sm flex-shrink-0 ${m.movement_type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.movement_type === 'income' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <button
        className="w-full py-3 rounded-xl font-bold text-base border-2 text-red-600 border-red-200 hover:bg-red-50 transition-colors"
        onClick={() => alert('Cierre de caja registrado (modo demo)')}
      >
        CERRAR CAJA DEL DÍA
      </button>
    </div>
  )
}
