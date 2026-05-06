'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, CheckCircle2, XCircle, MessageCircle, Lock } from 'lucide-react'
import { demoPlayers, demoCategories, demoEvents, getAttendanceStats, demoEligibilityConfig } from '@/lib/demo-data'

export default function ConvocatoriaPage() {
  const [selectedCategory, setSelectedCategory] = useState(demoCategories[0].id)
  const [selectedEvent, setSelectedEvent] = useState(demoEvents.filter(e => e.event_type === 'match')[0]?.id ?? '')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const activeCategories = demoCategories.filter(c => c.is_active)
  const matches = demoEvents.filter(e => e.event_type === 'match' && e.category_id === selectedCategory)
  const players = demoPlayers.filter(p => p.category_id === selectedCategory && p.is_active)
  const threshold = demoEligibilityConfig.min_attendance_percentage

  const playersWithEligibility = players.map(p => {
    const stats = getAttendanceStats(p.id, selectedCategory)
    return { ...p, stats, eligible: stats.percentage >= threshold || stats.total === 0 }
  })

  const eligible = playersWithEligibility.filter(p => p.eligible)
  const notEligible = playersWithEligibility.filter(p => !p.eligible)

  function togglePlayer(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectedPlayers = playersWithEligibility.filter(p => selected.has(p.id))

  function generateWhatsApp() {
    const event = demoEvents.find(e => e.id === selectedEvent)
    const cat = demoCategories.find(c => c.id === selectedCategory)
    const date = event ? new Date(event.scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Por definir'
    const time = event ? new Date(event.scheduled_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''
    const lista = selectedPlayers.map((p, i) => `${i + 1}. ${p.full_name}`).join('\n')
    const msg = `⚽ CONVOCATORIA — ${cat?.name ?? ''}\n📅 ${date} — ${time}\n📍 ${event?.venue ?? 'A confirmar'}\n\nJugadores convocados:\n${lista}\n\nPresentarse 30 min antes.\n¡Vamos Banfield! 💚`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy size={22} style={{ color: '#00843D' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
          CONVOCATORIA
        </h1>
      </div>

      {/* Selectores */}
      <div className="flex gap-2 flex-wrap">
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          className="pl-3 pr-6 py-2 rounded-lg border text-sm font-medium bg-white" style={{ borderColor: '#00843D', color: '#00843D' }}>
          {activeCategories.map(c => <option key={c.id} value={c.id}>Cat. {c.name}</option>)}
        </select>
        <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
          className="pl-3 pr-6 py-2 rounded-lg border text-sm font-medium bg-white flex-1">
          <option value="">Seleccionar partido...</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              vs. {m.rival} — {new Date(m.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Umbral mínimo de asistencia: <strong>{threshold}%</strong>. Tocá para seleccionar/deseleccionar.
      </p>

      {/* Elegibles */}
      {eligible.length > 0 && (
        <div>
          <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
            <CheckCircle2 size={13} /> ELEGIBLES ({eligible.length})
          </p>
          <div className="space-y-2">
            {eligible.map(p => (
              <button key={p.id} onClick={() => togglePlayer(p.id)} className="w-full text-left">
                <Card className={`border-0 shadow-sm transition-all ${selected.has(p.id) ? 'ring-2' : ''}`} style={selected.has(p.id) ? { ringColor: '#00843D', borderLeft: '4px solid #00843D' } : { borderLeft: '4px solid #e5e7eb' }}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: selected.has(p.id) ? '#00843D' : '#6b7280' }}>
                      {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground">Asistencia: {p.stats.percentage}% · Convocado {p.convocation_count}v</p>
                    </div>
                    {selected.has(p.id) && <CheckCircle2 size={18} style={{ color: '#00843D' }} />}
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No elegibles */}
      {notEligible.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1">
            <Lock size={13} /> NO ELEGIBLES ({notEligible.length}) — bajo {threshold}% de asistencia
          </p>
          <div className="space-y-2 opacity-60">
            {notEligible.map(p => (
              <Card key={p.id} className="border-0 shadow-sm bg-gray-50">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gray-400 flex-shrink-0">
                    {p.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-500">{p.full_name}</p>
                    <p className="text-xs text-gray-400">Asistencia: {p.stats.percentage}%</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-gray-400">No elegible</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Botón WhatsApp */}
      {selected.size > 0 && (
        <div className="sticky bottom-20 md:bottom-4">
          <button
            onClick={generateWhatsApp}
            className="w-full py-3 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 shadow-lg"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={20} />
            ENVIAR CONVOCATORIA ({selected.size} jugadores) por WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}
