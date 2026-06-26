'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { demoCashMovements, demoFinanceCategories } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { isRealClub } from '@/lib/real-clubs'
import { getRealBillings } from '@/lib/data/billing-store'

export default function FinanzasPage() {
  const club = useCurrentClub()
  const real = isRealClub(club.id)

  // Club real: ingresos = cuotas realmente cobradas (billings amount_paid).
  // Egresos y movimientos de caja reales aún no se listan acá (no hay loader);
  // se muestran en cero hasta tener movimientos cargados, en vez de datos demo.
  const realBillings = real ? (getRealBillings(club.id) ?? []) : []
  const realIncome = realBillings.reduce((s, b) => s + (b.amount_paid ?? 0), 0)

  const totalIncome = real
    ? realIncome
    : demoCashMovements.filter(m => m.movement_type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = real
    ? 0
    : demoCashMovements.filter(m => m.movement_type === 'expense').reduce((s, m) => s + m.amount, 0)
  const saldo = totalIncome - totalExpense
  const movements = real ? [] : demoCashMovements

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} style={{ color: 'var(--club-primary, #00843D)' }} className="flex-shrink-0" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: 'var(--club-primary, #00843D)' }}>
          FINANZAS
        </h1>
      </div>

      {/* Saldo grande arriba */}
      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid var(--club-primary, #00843D)' }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Saldo neto del mes</p>
          <p className="text-4xl font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: saldo >= 0 ? 'var(--club-primary, #00843D)' : '#DC2626' }}>
            ${saldo.toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      {/* KPIs compactos */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-green-600 uppercase font-semibold">Ingresos</p>
            <p className="text-xl font-bold text-green-600 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              +${totalIncome.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-2.5 text-center">
            <p className="text-[10px] text-red-500 uppercase font-semibold">Egresos</p>
            <p className="text-xl font-bold text-red-500 mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
              -${totalExpense.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-4" style={{ fontFamily: "var(--font-barlow)" }}>
        Movimientos ({movements.length})
      </h2>
      {real && (
        <p className="text-xs text-muted-foreground">
          Los ingresos reflejan las cuotas cobradas. Los movimientos de caja del día se registran desde la sección Caja.
        </p>
      )}
      <div className="space-y-2">
        {movements.length === 0 && !real && (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        )}
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
                    {cat?.name} · {m.payment_method === 'cash' ? '💵 Efectivo' : `🏦 ${m.transfer_reference}`}
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
    </div>
  )
}
