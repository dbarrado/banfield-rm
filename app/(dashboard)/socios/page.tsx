import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Users, Plus, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers, demoPayments, demoCategories, getPlayerDebts, thisMonth } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS } from '@/types'

function getPaymentStatus(playerId: string) {
  const paid = demoPayments.filter(p => p.player_id === playerId && p.period === thisMonth && p.fee_type === 'actividad')
  if (paid.length > 0) return 'al-dia'
  const lastMonth = demoPayments.filter(p => p.player_id === playerId && p.fee_type === 'actividad')
  if (lastMonth.length === 0) return 'deudor'
  return 'proximo'
}

const statusLabel = { 'al-dia': 'Al día', proximo: 'Por vencer', deudor: 'Deudor' }
const statusColor: Record<string, string> = { 'al-dia': '#00843D', proximo: '#F59E0B', deudor: '#DC2626' }

export default function SociosPage({ searchParams }: { searchParams: { filter?: string } }) {
  const filter = searchParams?.filter
  const deudores = getPlayerDebts(demoPlayers, demoPayments)
  const players = filter === 'deudores' ? deudores : demoPlayers.filter(p => p.is_active)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={22} style={{ color: '#00843D' }} />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#00843D' }}>
            {filter === 'deudores' ? 'DEUDORES' : 'SOCIOS'}
          </h1>
          <Badge variant="outline">{players.length}</Badge>
        </div>
        <Link href="/socios/nuevo" className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white" style={{ backgroundColor: '#00843D' }}>
          <Plus size={16} /> Nuevo
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/socios" className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${!filter ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} style={!filter ? { backgroundColor: '#00843D' } : {}}>
          Todos ({demoPlayers.filter(p => p.is_active).length})
        </Link>
        <Link href="/socios?filter=deudores" className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${filter === 'deudores' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} style={filter === 'deudores' ? { backgroundColor: '#DC2626' } : {}}>
          Deudores ({deudores.length})
        </Link>
        {demoCategories.filter(c => c.is_active).map(cat => (
          <Link key={cat.id} href={`/socios?filter=${cat.id}`} className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${filter === cat.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`} style={filter === cat.id ? { backgroundColor: '#1d4ed8' } : {}}>
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {players.map(player => {
          const status = getPaymentStatus(player.id)
          const cat = demoCategories.find(c => c.id === player.category_id)
          const waMsg = encodeURIComponent(`Hola ${player.tutor_name}, te recordamos que ${player.full_name} tiene una deuda pendiente con el Club Banfield Ramos Mejía. Cualquier consulta estamos a disposición.`)
          return (
            <Card key={player.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#00843D' }}>
                  {player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/socios/${player.id}`}>
                    <p className="font-semibold text-sm truncate hover:underline">{player.full_name}</p>
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide text-white"
                      style={{ backgroundColor: POSITION_COLORS[player.primary_position] }}
                    >
                      {POSITION_LABELS[player.primary_position]}
                    </span>
                    {player.secondary_positions.map(sp => (
                      <span
                        key={sp}
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: `${POSITION_COLORS[sp]}20`, color: POSITION_COLORS[sp] }}
                      >
                        {POSITION_LABELS[sp]}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat?.name ?? '—'} · {player.shift === 'morning' ? 'Mañana' : 'Tarde'}
                  </p>
                </div>

                {/* Estado + WhatsApp */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className="text-xs text-white border-0" style={{ backgroundColor: statusColor[status] }}>
                    {statusLabel[status]}
                  </Badge>
                  {status === 'deudor' && player.tutor_whatsapp && (
                    <a
                      href={`https://wa.me/54${player.tutor_whatsapp}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Avisar deuda por WhatsApp"
                      className="text-green-600 hover:text-green-700"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
