import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Trophy } from 'lucide-react'
import { demoEvents, demoCategories } from '@/lib/demo-data'

export default function FixturePage() {
  const matches = demoEvents
    .filter(e => e.event_type === 'match')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
          FIXTURE
        </h1>
      </div>

      <div className="space-y-3">
        {matches.map(match => {
          const cat = demoCategories.find(c => c.id === match.category_id)
          const date = new Date(match.scheduled_at)
          const isPast = date < new Date()
          return (
            <Card key={match.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs" style={{ borderColor: '#00843D', color: '#00843D' }}>
                    {cat?.name ?? '—'}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${isPast ? 'text-gray-400' : 'text-blue-600 border-blue-300'}`}>
                    {match.is_home ? 'Local' : 'Visitante'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={18} style={{ color: '#C9A84C' }} />
                  <p className="font-bold text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    vs. {match.rival ?? 'Por definir'}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} — {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {match.venue && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} />
                      {match.venue}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  <button className="text-xs px-3 py-1 rounded-lg border font-medium hover:bg-gray-50">
                    Editar fecha
                  </button>
                  <button className="text-xs px-3 py-1 rounded-lg font-medium text-white" style={{ backgroundColor: '#00843D' }}>
                    Armar convocatoria
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
