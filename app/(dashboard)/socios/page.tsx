'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Plus, MessageCircle, Search, X } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers, demoPayments, demoCategories, getPlayerDebts, thisMonth } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'

function getPaymentStatus(playerId: string) {
  const paid = demoPayments.filter(p => p.player_id === playerId && p.period === thisMonth && p.fee_type === 'actividad')
  if (paid.length > 0) return 'al-dia'
  const lastMonth = demoPayments.filter(p => p.player_id === playerId && p.fee_type === 'actividad')
  if (lastMonth.length === 0) return 'deudor'
  return 'proximo'
}

const statusLabel = { 'al-dia': 'Al día', proximo: 'Por vencer', deudor: 'Deudor' }
const statusColor: Record<string, string> = { 'al-dia': '#00843D', proximo: '#F59E0B', deudor: '#DC2626' }

export default function SociosPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Cargando...</div>}>
      <SociosPage />
    </Suspense>
  )
}

function SociosPage() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') ?? 'todos'
  const [filter, setFilter] = useState(initialFilter)
  const [search, setSearch] = useState('')
  const deudores = useMemo(() => getPlayerDebts(demoPlayers, demoPayments), [])
  const baseList = useMemo(() => {
    if (filter === 'todos') return demoPlayers.filter(p => p.is_active)
    if (filter === 'deudores') return deudores
    if (filter.startsWith('tira-')) {
      const tira = filter.replace('tira-', '')
      return demoPlayers.filter(p => p.is_active && p.tira === tira)
    }
    // Si es un categoryId (ej: cat-2012)
    return demoPlayers.filter(p => p.is_active && p.category_id === filter)
  }, [filter, deudores])
  const players = useMemo(() => {
    if (!search.trim()) return baseList
    const q = search.toLowerCase().trim()
    return baseList.filter(p =>
      p.full_name.toLowerCase().includes(q) ||
      (p.dni ?? '').includes(q) ||
      (p.tutor_name ?? '').toLowerCase().includes(q)
    )
  }, [baseList, search])

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

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por apellido, nombre, DNI o tutor..."
          className="w-full pl-9 pr-9 py-2.5 border rounded-lg text-sm bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <button onClick={() => setFilter('todos')} className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${filter === 'todos' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`} style={filter === 'todos' ? { backgroundColor: '#00843D' } : {}}>
            Todos ({demoPlayers.filter(p => p.is_active).length})
          </button>
          <button onClick={() => setFilter('deudores')} className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${filter === 'deudores' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`} style={filter === 'deudores' ? { backgroundColor: '#DC2626' } : {}}>
            Deudores ({deudores.length})
          </button>
        </div>

        {/* Filtro por tira */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <span className="text-[10px] font-bold uppercase text-muted-foreground self-center mr-1">Tira:</span>
          {(['metro', 'liga1', 'liga2', 'edefi'] as const).map(t => {
            const sel = filter === `tira-${t}`
            return (
              <button key={t} onClick={() => setFilter(sel ? 'todos' : `tira-${t}`)} className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`} style={sel ? { backgroundColor: TIRA_COLORS[t] } : {}}>
                {TIRA_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Filtro por categoría */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <span className="text-[10px] font-bold uppercase text-muted-foreground self-center mr-1">Cat:</span>
          {demoCategories.filter(c => c.is_active).map(cat => (
            <button key={cat.id} onClick={() => setFilter(filter === cat.id ? 'todos' : cat.id)} className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${filter === cat.id ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`} style={filter === cat.id ? { backgroundColor: '#1d4ed8' } : {}}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {players.map(player => {
          const status = getPaymentStatus(player.id)
          const cat = demoCategories.find(c => c.id === player.category_id)
          const waMsg = encodeURIComponent(`Hola ${player.tutor_name}, te recordamos que ${player.full_name} tiene una deuda pendiente con el Club Banfield Ramos Mejía. Cualquier consulta estamos a disposición.`)
          return (
            <Link key={player.id} href={`/socios/${player.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full overflow-hidden border-2 flex-shrink-0 bg-white" style={{ borderColor: TIRA_COLORS[player.tira] }}>
                    <img src={getAvatarUrl(player)} alt={player.full_name} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{player.full_name}</p>
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
                    Cat. <strong>{cat?.name ?? '—'}</strong> ·{' '}
                    <span className="font-semibold" style={{ color: TIRA_COLORS[player.tira] }}>
                      {TIRA_LABELS[player.tira]}
                    </span>
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
