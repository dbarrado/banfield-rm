import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { demoCashMovements, demoFinanceCategories } from '@/lib/demo-data'

export default function FinanzasPage() {
  const totalIncome = demoCashMovements.filter(m => m.movement_type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = demoCashMovements.filter(m => m.movement_type === 'expense').reduce((s, m) => s + m.amount, 0)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
          FINANZAS
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Ingresos del mes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ${totalIncome.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Egresos del mes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
              ${totalExpense.toLocaleString('es-AR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #00843D' }}>
        <CardContent className="p-4 flex justify-between">
          <p className="font-semibold text-sm">Saldo neto del mes</p>
          <p className="text-xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            ${(totalIncome - totalExpense).toLocaleString('es-AR')}
          </p>
        </CardContent>
      </Card>

      <h2 className="font-bold text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>MOVIMIENTOS</h2>
      <div className="space-y-2">
        {demoCashMovements.map(m => {
          const cat = demoFinanceCategories.find(c => c.id === m.finance_category_id)
          return (
            <Card key={m.id} className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.movement_type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {m.movement_type === 'income' ? <TrendingUp size={15} className="text-green-600" /> : <TrendingDown size={15} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.description}</p>
                  <p className="text-xs text-muted-foreground">{cat?.name} · {m.payment_method === 'cash' ? 'Efectivo' : `Transf. ${m.transfer_reference}`}</p>
                </div>
                <p className={`font-bold text-sm ${m.movement_type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.movement_type === 'income' ? '+' : '-'}${m.amount.toLocaleString('es-AR')}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
