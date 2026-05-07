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
  const initialFromUrl = searchParams.get('filter')
  const [search, setSearch] = useState('')
  const [showDeudores, setShowDeudores] = useState(initialFromUrl === 'deudores')
  const [selectedTira, setSelectedTira] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialFromUrl && initialFromUrl.startsWith('cat-') ? initialFromUrl : null
  )

  const deudores = useMemo(() => getPlayerDebts(demoPlayers, demoPayments), [])
  const deudorIds = useMemo(() => new Set(deudores.map(d => d.id)), [deudores])

  const players = useMemo(() => {
    let list = demoPlayers.filter(p => p.is_active)
    if (showDeudores) list = list.filter(p => deudorIds.has(p.id))
    if (selectedTira) list = list.filter(p => p.tira === selectedTira)
    if (selectedCategory) list = list.filter(p => p.category_id === selectedCategory)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        (p.dni ?? '').includes(q) ||
        (p.tutor_name ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [showDeudores, selectedTira, selectedCategory, search, deudorIds])

  const hasActiveFilters = showDeudores || selectedTira || selectedCategory || search.trim()

  return (
    <div className="p-3 md:p-6 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={20} style={{ color: '#00843D' }} className="flex-shrink-0" />
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
            SOCIOS
          </h1>
          <Badge variant="outline" className="flex-shrink-0">{players.length}</Badge>
        </div>
        <Link href="/socios/nuevo" className="flex items-center gap-1 text-sm font-semibold px-3 py-2 rounded-lg text-white flex-shrink-0" style={{ backgroundColor: '#00843D' }}>
          <Plus size={14} /> Nuevo
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

      {/* Filtros acumulativos */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setShowDeudores(!showDeudores)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${showDeudores ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
            style={showDeudores ? { backgroundColor: '#DC2626' } : {}}
          >
            🚩 Deudores ({deudores.length})
          </button>
          {hasActiveFilters && (
            <button
              onClick={() => { setShowDeudores(false); setSelectedTira(null); setSelectedCategory(null); setSearch(''); }}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              <X size={11} className="inline" /> Limpiar
            </button>
          )}
        </div>

        {/* Tira */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <span className="text-[10px] font-bold uppercase text-muted-foreground self-center flex-shrink-0">Tira:</span>
          {(['metro', 'liga1', 'liga2', 'edefi'] as const).map(t => {
            const sel = selectedTira === t
            return (
              <button key={t} onClick={() => setSelectedTira(sel ? null : t)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                style={sel ? { backgroundColor: TIRA_COLORS[t] } : {}}>
                {TIRA_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Categoría */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-3 px-3">
          <span className="text-[10px] font-bold uppercase text-muted-foreground self-center flex-shrink-0">Cat:</span>
          {demoCategories.filter(c => c.is_active).map(cat => {
            const sel = selectedCategory === cat.id
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(sel ? null : cat.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                style={sel ? { backgroundColor: '#1d4ed8' } : {}}>
                {cat.name}
              </button>
            )
          })}
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
