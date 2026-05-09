'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Plus, MessageCircle, Search, X } from 'lucide-react'
import Link from 'next/link'
import { demoPayments, getPlayerDebts, thisMonth, getPlayersForClub, getCategoriesForClub } from '@/lib/demo-data'
import { POSITION_LABELS, POSITION_COLORS, TIRA_LABELS, TIRA_COLORS } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'
import { useCurrentClub } from '@/lib/use-current-club'

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
  const club = useCurrentClub()
  const clubPlayers = useMemo(() => getPlayersForClub(club.id), [club.id])
  const clubCategories = useMemo(() => getCategoriesForClub(club.id), [club.id])
  const searchParams = useSearchParams()
  const initialFromUrl = searchParams.get('filter')
  const [search, setSearch] = useState('')
  const [showDeudores, setShowDeudores] = useState(initialFromUrl === 'deudores')
  const [selectedTira, setSelectedTira] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialFromUrl && initialFromUrl.startsWith('cat-') ? initialFromUrl : null
  )

  const deudores = useMemo(() => getPlayerDebts(clubPlayers, demoPayments), [clubPlayers])
  const deudorIds = useMemo(() => new Set(deudores.map(d => d.id)), [deudores])

  const players = useMemo(() => {
    let list = clubPlayers.filter(p => p.is_active)
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
  }, [showDeudores, selectedTira, selectedCategory, search, deudorIds, clubPlayers])

  const hasActiveFilters = showDeudores || selectedTira || selectedCategory || search.trim()

  return (
    <div className="p-3 md:p-6 space-y-3 max-w-full overflow-x-hidden">
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
          {clubCategories.filter(c => c.is_active).map(cat => {
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
      <div className="space-y-1.5 overflow-x-hidden">
        {players.map(player => {
          const status = getPaymentStatus(player.id)
          const cat = clubCategories.find(c => c.id === player.category_id)
          const waMsg = encodeURIComponent(`Hola ${player.tutor_name}, te recordamos que ${player.full_name} tiene una deuda pendiente con el Club Banfield Ramos Mejía.`)
          const statusDot = { 'al-dia': '#00843D', proximo: '#F59E0B', deudor: '#DC2626' }[status]
          return (
            <Link key={player.id} href={`/socios/${player.id}`} className="block">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]" style={{ borderLeft: `3px solid ${TIRA_COLORS[player.tira]}` }}>
                <CardContent className="p-2 flex items-center gap-2 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                      <img src={getAvatarUrl(player)} alt="" className="w-full h-full object-cover" />
                    </div>
                    {/* Dot de estado de cuota sobre el avatar */}
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: statusDot }}
                      title={statusLabel[status]}
                    />
                  </div>

                  {/* Nombre + meta en 2 líneas */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold truncate leading-tight">{player.full_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      <span className="font-bold" style={{ color: TIRA_COLORS[player.tira] }}>
                        {TIRA_LABELS[player.tira]}
                      </span>
                      <span> · Cat. {cat?.name ?? '—'} · </span>
                      <span className="font-bold" style={{ color: POSITION_COLORS[player.primary_position] }}>
                        {POSITION_LABELS[player.primary_position].slice(0, 3).toUpperCase()}
                      </span>
                    </p>
                  </div>

                  {/* WhatsApp solo si es deudor */}
                  {status === 'deudor' && player.tutor_whatsapp && (
                    <a
                      href={`https://wa.me/54${player.tutor_whatsapp}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
        {players.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Sin resultados con esos filtros.</p>
        )}
      </div>
    </div>
  )
}
