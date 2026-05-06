import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings } from 'lucide-react'
import { demoCategories, demoFinanceCategories, demoEligibilityConfig } from '@/lib/demo-data'

export default function ConfigPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
          CONFIGURACIÓN
        </h1>
      </div>

      {/* Elegibilidad */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>ELEGIBILIDAD PARA PARTIDOS</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Asistencia mínima requerida</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
              {demoEligibilityConfig.min_attendance_percentage}%
            </span>
            <button className="text-xs px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50">Editar</button>
          </div>
        </CardContent>
      </Card>

      {/* Cuotas */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CUOTAS</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Cuota Actividad', amount: 8000, period: 'mensual' },
            { label: 'Cuota Social', amount: 3000, period: 'mensual' },
            { label: 'Matrícula', amount: 15000, period: 'anual' },
          ].map(fee => (
            <div key={fee.label} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{fee.label}</p>
                <p className="text-xs text-muted-foreground">{fee.period}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>${fee.amount.toLocaleString('es-AR')}</p>
                <button className="text-xs px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50">Editar</button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Categorías */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CATEGORÍAS</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {demoCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{cat.name}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${cat.is_active ? 'text-green-700 border-green-300 bg-green-50' : 'text-gray-400'}`}>
                  {cat.is_active ? 'Activa' : 'Inactiva'}
                </Badge>
                <button className="text-xs px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50">
                  {cat.is_active ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
          <button className="text-sm text-green-700 font-medium mt-2">+ Agregar categoría</button>
        </CardContent>
      </Card>

      {/* Categorías financieras */}
      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CATEGORÍAS DE CAJA</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {demoFinanceCategories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <p className="text-sm font-medium">{cat.name}</p>
              <Badge variant="outline" className={`text-xs ${cat.movement_type === 'income' ? 'text-green-700 border-green-300' : 'text-red-600 border-red-300'}`}>
                {cat.movement_type === 'income' ? 'Ingreso' : 'Egreso'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
