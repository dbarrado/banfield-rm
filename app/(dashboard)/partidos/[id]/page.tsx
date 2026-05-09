'use client'

import { use, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Trophy, MapPin, Calendar, ClipboardList, Star, Edit2, ArrowUpDown, AlertTriangle, Ban, MessageSquare, X, UserPlus, Search, Move } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoEvents, getPlayersForClub, getCategoriesForClub } from '@/lib/demo-data'
import { useCurrentClub } from '@/lib/use-current-club'
import { POSITION_LABELS, POSITION_COLORS, type Position } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'
import { getSportFormat, FORMATIONS, getDefaultFormation, type SportCode, type Formation } from '@/lib/sports'
import { getMatchConfig, saveMatchConfig, type MatchConfig } from '@/lib/match-config'
import { Settings } from 'lucide-react'

type CardStatus = 'none' | 'yellow' | 'red'

export default function PartidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const club = useCurrentClub()
  const event = demoEvents.find(e => e.id === id && e.event_type === 'match')
  if (!event) notFound()
  // Filtrar jugadores y categorías por el CLUB DEL EVENTO (no del usuario activo).
  // Esto garantiza que el partido siempre muestre los jugadores correctos aunque
  // el usuario haya abierto el partido desde otro contexto.
  const eventClubId = event!.club_id ?? club.id
  const clubPlayers = useMemo(() => getPlayersForClub(eventClubId), [eventClubId])
  const clubCategories = useMemo(() => getCategoriesForClub(eventClubId), [eventClubId])

  const cat = clubCategories.find(c => c.id === event!.category_id)
  // Formato de juego de la categoría (cada cat puede tener distinto)
  const sportCode = (cat?.sport_format_code ?? 'football_11') as SportCode
  const format = getSportFormat(sportCode)
  const POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']
  const allOfCat = clubPlayers.filter(p => p.category_id === event!.category_id)

  // Estructura de titulares según el formato:
  // football_11: 1 arq + 4 def + 4 med + 2 del = 11
  // baby_6:      1 arq + 2 def + 2 med + 1 del = 6
  // baby_5:      1 arq + 1 def + 1 med + 2 del = 5  (variable)
  // futsal:      1 arq + 1 def + 2 med + 1 del = 5
  const slotsByPos = sportCode === 'football_11'  ? { arquero: 1, defensor: 4, mediocampista: 4, delantero: 2 }
                   : sportCode === 'baby_6'       ? { arquero: 1, defensor: 2, mediocampista: 2, delantero: 1 }
                   : sportCode === 'baby_5'       ? { arquero: 1, defensor: 1, mediocampista: 1, delantero: 2 }
                   : sportCode === 'futsal'       ? { arquero: 1, defensor: 1, mediocampista: 2, delantero: 1 }
                   : sportCode === 'hockey_field' ? { arquero: 1, defensor: 4, mediocampista: 3, delantero: 3 }
                   : sportCode === 'volleyball'   ? { arquero: 0, defensor: 2, mediocampista: 1, delantero: 3 }
                   : sportCode === 'basketball'   ? { arquero: 0, defensor: 2, mediocampista: 1, delantero: 2 }
                   : sportCode === 'rugby_7'      ? { arquero: 0, defensor: 3, mediocampista: 2, delantero: 2 }
                   : sportCode === 'rugby_15'     ? { arquero: 0, defensor: 6, mediocampista: 4, delantero: 5 }
                   : sportCode === 'handball_7'   ? { arquero: 1, defensor: 2, mediocampista: 1, delantero: 3 }
                   :                                 { arquero: 1, defensor: 4, mediocampista: 4, delantero: 2 }

  const arq = allOfCat.filter(p => p.primary_position === 'arquero')
  const def = allOfCat.filter(p => p.primary_position === 'defensor')
  const med = allOfCat.filter(p => p.primary_position === 'mediocampista')
  const del = allOfCat.filter(p => p.primary_position === 'delantero')

  const initialTitulares: typeof allOfCat = [
    ...arq.slice(0, slotsByPos.arquero),
    ...def.slice(0, slotsByPos.defensor),
    ...med.slice(0, slotsByPos.mediocampista),
    ...del.slice(0, slotsByPos.delantero),
  ]
  // Si falta gente para completar el equipo (porque la distribución de posiciones
  // de la categoría no llegó a llenar los slots), completar con jugadores
  // disponibles de cualquier posición. Garantiza que siempre haya `players_on_field` titulares.
  const expectedTitulares = format.players_on_field
  if (initialTitulares.length < expectedTitulares) {
    const remaining = allOfCat.filter(p => !initialTitulares.includes(p))
    initialTitulares.push(...remaining.slice(0, expectedTitulares - initialTitulares.length))
  }
  // Config de máximos por club + deporte (con override editable inline)
  const initialMatchCfg = useMemo(() => getMatchConfig(eventClubId, sportCode), [eventClubId, sportCode])
  const [matchCfg, setMatchCfg] = useState<MatchConfig>(initialMatchCfg)
  const [showCfgEditor, setShowCfgEditor] = useState(false)
  const maxSubs = matchCfg.suplentes
  const initialSuplentes = allOfCat.filter(p => !initialTitulares.includes(p)).slice(0, maxSubs)

  function updateMatchCfg(next: MatchConfig) {
    setMatchCfg(next)
    saveMatchConfig(eventClubId, sportCode, next)
  }

  const [titularesIds, setTitularesIds] = useState<string[]>(initialTitulares.map(p => p.id))
  const [suplentesIds, setSuplentesIds] = useState<string[]>(initialSuplentes.map(p => p.id))
  const [cards, setCards] = useState<Record<string, CardStatus>>({})
  const [matchComment, setMatchComment] = useState('')
  const [swap, setSwap] = useState<{ titularId?: string; suplenteId?: string } | null>(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [lateCallNotes, setLateCallNotes] = useState<Record<string, string>>({})
  const formations = FORMATIONS[sportCode] ?? []
  const [currentFormation, setCurrentFormation] = useState<Formation>(formations[0] ?? getDefaultFormation(sportCode))
  // Drag & drop
  const [draggingId, setDraggingId] = useState<string | null>(null)
  // Tap-to-swap: selección persistente para móvil (drag no funciona bien en touch)
  const [tapSelectedId, setTapSelectedId] = useState<string | null>(null)

  function handleTapPlayer(playerId: string) {
    if (!tapSelectedId) {
      setTapSelectedId(playerId)
      return
    }
    if (tapSelectedId === playerId) {
      setTapSelectedId(null)
      return
    }
    // Intercambiar usando la lógica existente
    setDraggingId(tapSelectedId)
    setTimeout(() => {
      handleDrop(playerId)
      setTapSelectedId(null)
    }, 0)
  }

  function handleDrop(targetPlayerId: string) {
    if (!draggingId || draggingId === targetPlayerId) {
      setDraggingId(null)
      return
    }
    // Determinar si origen y destino son titulares o suplentes
    const draggingIsTitular = titularesIds.includes(draggingId)
    const targetIsTitular = titularesIds.includes(targetPlayerId)
    const draggingIsSuplente = suplentesIds.includes(draggingId)
    const targetIsSuplente = suplentesIds.includes(targetPlayerId)

    if (draggingIsTitular && targetIsTitular) {
      // Reordenar titulares (swap visual)
      const newTit = [...titularesIds]
      const i = newTit.indexOf(draggingId)
      const j = newTit.indexOf(targetPlayerId)
      ;[newTit[i], newTit[j]] = [newTit[j], newTit[i]]
      setTitularesIds(newTit)
    } else if (draggingIsTitular && targetIsSuplente) {
      // Cambio: titular sale, suplente entra
      setTitularesIds(prev => prev.map(id => id === draggingId ? targetPlayerId : id))
      setSuplentesIds(prev => prev.map(id => id === targetPlayerId ? draggingId : id))
    } else if (draggingIsSuplente && targetIsTitular) {
      // Inverso: suplente sube, titular baja
      setSuplentesIds(prev => prev.map(id => id === draggingId ? targetPlayerId : id))
      setTitularesIds(prev => prev.map(id => id === targetPlayerId ? draggingId : id))
    } else if (draggingIsSuplente && targetIsSuplente) {
      // Reordenar suplentes
      const newSup = [...suplentesIds]
      const i = newSup.indexOf(draggingId)
      const j = newSup.indexOf(targetPlayerId)
      ;[newSup[i], newSup[j]] = [newSup[j], newSup[i]]
      setSuplentesIds(newSup)
    }
    setDraggingId(null)
  }

  function applyFormation(f: Formation) {
    // Mantener el pool de jugadores ya convocados (titulares + suplentes actuales)
    // y reorganizarlo según la nueva formación. NO traer jugadores nuevos del pool global.
    const currentPoolIds = [...titularesIds, ...suplentesIds]
    const pool = currentPoolIds
      .map(id => allOfCat.find(p => p.id === id))
      .filter((p): p is typeof allOfCat[number] => Boolean(p))

    const newTit: string[] = []

    // Pasada 1: cubrir slots con jugadores del pool cuya primary_position coincida
    for (const [posCode, count] of Object.entries(f.slots)) {
      const candidates = pool
        .filter(p => p.primary_position === posCode)
        .filter(p => !newTit.includes(p.id))
        .slice(0, count)
      newTit.push(...candidates.map(p => p.id))
    }

    // Pasada 2: si quedan slots vacíos, completar con jugadores cuya secondary_position coincida
    for (const [posCode, count] of Object.entries(f.slots)) {
      const filled = newTit.filter(id => {
        const p = pool.find(x => x.id === id)
        return p?.primary_position === posCode || (p?.secondary_positions ?? []).includes(posCode as Position)
      }).length
      const missing = count - filled
      if (missing > 0) {
        const candidates = pool
          .filter(p => (p.secondary_positions ?? []).includes(posCode as Position))
          .filter(p => !newTit.includes(p.id))
          .slice(0, missing)
        newTit.push(...candidates.map(p => p.id))
      }
    }

    // Pasada 3: si todavía faltan, completar con cualquier jugador del pool (mantiene la convocatoria)
    const totalSlots = Object.values(f.slots).reduce((s, n) => s + n, 0)
    if (newTit.length < totalSlots) {
      const remaining = pool.filter(p => !newTit.includes(p.id))
      newTit.push(...remaining.slice(0, totalSlots - newTit.length).map(p => p.id))
    }

    // Suplentes = el resto del pool actual (mantiene a todos los convocados)
    const newSup = currentPoolIds.filter(id => !newTit.includes(id))

    setTitularesIds(newTit)
    setSuplentesIds(newSup)
    setCurrentFormation(f)
  }

  function addLateCallPlayer(playerId: string, reason: string) {
    setSuplentesIds(prev => [...prev, playerId])
    setLateCallNotes(prev => ({ ...prev, [playerId]: reason }))
    setShowAddPlayer(false)
  }

  const titulares = titularesIds.map(id => allOfCat.find(p => p.id === id)!).filter(Boolean)
  const suplentes = suplentesIds.map(id => allOfCat.find(p => p.id === id)!).filter(Boolean)

  // Agrupados por posición principal
  const titularesByPos: Record<Position, typeof titulares> = { arquero: [], defensor: [], mediocampista: [], delantero: [] }
  for (const t of titulares) titularesByPos[t.primary_position].push(t)

  const date = new Date(event!.scheduled_at)

  function setCard(playerId: string, status: CardStatus) {
    setCards(prev => ({ ...prev, [playerId]: status }))
  }

  function performSwap(titularId: string, suplenteId: string) {
    setTitularesIds(prev => prev.map(id => id === titularId ? suplenteId : id))
    setSuplentesIds(prev => prev.map(id => id === suplenteId ? titularId : id))
    setSwap(null)
  }

  return (
    <div className="pb-4">
      <div className="text-white p-4 pb-6" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}>
        <Link href="/fixture" className="text-white/80 text-xs flex items-center gap-1 mb-2">
          <ArrowLeft size={12} /> Fixture
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={20} style={{ color: '#C9A84C' }} />
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>
            vs. {event!.rival}
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-white/90">
          <span className="flex items-center gap-1"><Calendar size={11} /> {date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          {event!.venue && <span className="flex items-center gap-1"><MapPin size={11} /> {event!.venue}</span>}
          <span>Cat. {cat?.name}</span>
        </div>
      </div>

      <div className="p-3 space-y-3 -mt-3">
        {/* Banner de tap-to-swap */}
        {tapSelectedId && (() => {
          const sel = [...titulares, ...suplentes].find(pl => pl.id === tapSelectedId)
          return (
            <div className="sticky top-0 z-40 -mx-3 px-3 py-2 bg-amber-400 text-amber-950 shadow-lg flex items-center gap-2">
              <span className="text-xs font-bold flex-1">
                Cambiando: <strong>{sel?.full_name ?? '?'}</strong> · Tocá otro jugador para intercambiar
              </span>
              <button onClick={() => setTapSelectedId(null)} className="text-xs font-bold px-2 py-1 rounded bg-amber-950 text-amber-100">
                Cancelar
              </button>
            </div>
          )
        })()}
        {/* Acciones */}
        <div className="grid grid-cols-3 gap-2">
          <Link href={`/convocatoria?event=${id}`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <Edit2 size={14} className="mx-auto" style={{ color: '#1d4ed8' }} />
                <p className="text-[10px] font-bold mt-1">Convocatoria</p>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/partidos/${id}/asistencia`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <ClipboardList size={14} className="mx-auto" style={{ color: '#00843D' }} />
                <p className="text-[10px] font-bold mt-1">Asistencia</p>
              </CardContent>
            </Card>
          </Link>
          <Link href={`/partidos/${id}/puntajes`}>
            <Card className="border-0 shadow-sm h-full">
              <CardContent className="p-2.5 text-center">
                <Star size={14} className="mx-auto" style={{ color: '#C9A84C' }} />
                <p className="text-[10px] font-bold mt-1">Puntajes</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Formación visual */}
        <div className="flex items-center justify-between mt-3">
          <h2 className="font-bold text-sm uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
            FORMACIÓN
          </h2>
          <button
            onClick={() => setShowAddPlayer(true)}
            className="text-xs font-semibold px-2 py-1 rounded text-white flex items-center gap-1"
            style={{ backgroundColor: '#7c3aed' }}
          >
            <UserPlus size={12} /> Llamada tardía
          </button>
        </div>

        {/* Selector de formación táctica */}
        {formations.length > 1 && (
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-3 px-3">
            <span className="text-[10px] font-bold uppercase text-muted-foreground self-center mr-1 flex-shrink-0">Sistema:</span>
            {formations.map(f => {
              const sel = currentFormation.code === f.code
              return (
                <button
                  key={f.code}
                  onClick={() => applyFormation(f)}
                  title={f.description}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold border-2 whitespace-nowrap transition-colors ${sel ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                  style={sel ? { backgroundColor: 'var(--club-primary, #00843D)' } : {}}
                >
                  {f.code}
                </button>
              )
            })}
          </div>
        )}

        {/* Config de máximos de convocatoria (editable inline + persistente por club + deporte) */}
        <div className="flex items-center gap-2 flex-wrap text-[11px]">
          <button
            onClick={() => setShowCfgEditor(!showCfgEditor)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-muted-foreground"
          >
            <Settings size={11} />
            <strong>{matchCfg.titulares}</strong> tit. + <strong>{matchCfg.suplentes}</strong> sup.
          </button>
          <span className="text-muted-foreground">máximo de convocados</span>
        </div>

        {showCfgEditor && (
          <Card className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase text-muted-foreground">Máximo de convocados — {sportCode}</p>
                <button onClick={() => setShowCfgEditor(false)} className="text-muted-foreground"><X size={12} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px]">
                  <span className="text-muted-foreground">Titulares</span>
                  <input type="number" min={1} max={30} value={matchCfg.titulares}
                    onChange={e => updateMatchCfg({ ...matchCfg, titulares: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })}
                    className="w-full mt-0.5 px-2 py-1 border rounded text-sm font-bold text-center" />
                </label>
                <label className="text-[11px]">
                  <span className="text-muted-foreground">Suplentes</span>
                  <input type="number" min={0} max={20} value={matchCfg.suplentes}
                    onChange={e => updateMatchCfg({ ...matchCfg, suplentes: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })}
                    className="w-full mt-0.5 px-2 py-1 border rounded text-sm font-bold text-center" />
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Se guarda por club + actividad. También editable desde Configuración.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-[10px] text-muted-foreground -mt-1 flex items-center gap-1">
          <Move size={10} /> Arrastrá un jugador para cambiar posición o intercambiar con suplente
        </p>

        <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ aspectRatio: '2/3', maxWidth: 480, margin: '0 auto' }}>
          <div className="absolute inset-0" style={(() => {
            // Background por deporte
            switch (sportCode) {
              case 'volleyball':
              case 'basketball':
              case 'futsal':
              case 'handball_7':
                // Pisos indoor: madera clara
                return { background: 'linear-gradient(180deg, #d4a574 0%, #b8895a 100%)' }
              case 'hockey_field':
                // Hockey césped sintético: verde más oscuro
                return { background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' }
              case 'rugby_7':
              case 'rugby_15':
              case 'football_11':
              case 'baby_5':
              case 'baby_6':
              default:
                // Césped natural
                return { background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)' }
            }
          })()}>
            <svg viewBox="0 0 200 300" className="w-full h-full">
              {(() => {
                const stroke = sportCode === 'basketball' || sportCode === 'volleyball' || sportCode === 'handball_7' ? '#1f2937' : 'white'
                const opacity = sportCode === 'basketball' || sportCode === 'volleyball' || sportCode === 'handball_7' ? 0.85 : 0.7
                switch (sportCode) {
                  case 'football_11':
                    // Cancha completa de fútbol 11 — área grande 50-150 ancho × 35 alto, área chica 75-125 × 15
                    return (
                      <>
                        <rect x="5" y="5" width="190" height="290" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="5" y1="150" x2="195" y2="150" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="22" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="1" fill={stroke} opacity={opacity} />
                        <rect x="50" y="5" width="100" height="40" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="50" y="255" width="100" height="40" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="73" y="5" width="54" height="16" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="73" y="279" width="54" height="16" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        {/* Punto de penal */}
                        <circle cx="100" cy="33" r="0.8" fill={stroke} opacity={opacity} />
                        <circle cx="100" cy="267" r="0.8" fill={stroke} opacity={opacity} />
                      </>
                    )
                  case 'baby_6':
                    // Cancha 6 vs 6 — más chica, área proporcional, sin área grande
                    return (
                      <>
                        <rect x="20" y="20" width="160" height="260" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="20" y1="150" x2="180" y2="150" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="16" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="1" fill={stroke} opacity={opacity} />
                        {/* Áreas más chicas */}
                        <rect x="65" y="20" width="70" height="28" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="65" y="252" width="70" height="28" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        {/* Arcos chicos */}
                        <line x1="88" y1="18" x2="112" y2="18" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        <line x1="88" y1="282" x2="112" y2="282" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        <text x="100" y="100" textAnchor="middle" fill={stroke} opacity={opacity * 0.4} fontSize="6" fontFamily="Arial">BABY 6</text>
                      </>
                    )
                  case 'baby_5':
                    // Cancha 5 vs 5 — aún más chica, sin áreas (solo arcos)
                    return (
                      <>
                        <rect x="30" y="30" width="140" height="240" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="30" y1="150" x2="170" y2="150" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="14" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="1" fill={stroke} opacity={opacity} />
                        {/* Semicírculos del arquero */}
                        <path d="M 78 30 A 22 22 0 0 0 122 30" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <path d="M 78 270 A 22 22 0 0 1 122 270" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        {/* Arcos chicos */}
                        <line x1="90" y1="28" x2="110" y2="28" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        <line x1="90" y1="272" x2="110" y2="272" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        <text x="100" y="100" textAnchor="middle" fill={stroke} opacity={opacity * 0.4} fontSize="6" fontFamily="Arial">BABY 5</text>
                      </>
                    )
                  case 'futsal':
                    // Cancha futsal indoor — semicírculos del área (no rectangular como fútbol)
                    return (
                      <>
                        <rect x="15" y="15" width="170" height="270" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <line x1="15" y1="150" x2="185" y2="150" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <circle cx="100" cy="150" r="18" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <circle cx="100" cy="150" r="1" fill={stroke} opacity={opacity} />
                        {/* Áreas semi-circulares 6m (futsal característica) */}
                        <path d="M 70 15 A 30 30 0 0 0 130 15" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <path d="M 70 285 A 30 30 0 0 1 130 285" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        {/* Línea de doble penal 10m */}
                        <line x1="95" y1="60" x2="105" y2="60" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.8} />
                        <line x1="95" y1="240" x2="105" y2="240" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.8} />
                        {/* Punto de penal 6m */}
                        <circle cx="100" cy="40" r="0.8" fill={stroke} opacity={opacity} />
                        <circle cx="100" cy="260" r="0.8" fill={stroke} opacity={opacity} />
                        {/* Arcos */}
                        <line x1="90" y1="13" x2="110" y2="13" stroke={stroke} strokeWidth="2.5" opacity={opacity} />
                        <line x1="90" y1="287" x2="110" y2="287" stroke={stroke} strokeWidth="2.5" opacity={opacity} />
                      </>
                    )
                  case 'hockey_field':
                    return (
                      <>
                        <rect x="5" y="5" width="190" height="290" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="5" y1="150" x2="195" y2="150" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="5" y1="80" x2="195" y2="80" stroke={stroke} strokeWidth="0.5" opacity={opacity * 0.6} strokeDasharray="2,2" />
                        <line x1="5" y1="220" x2="195" y2="220" stroke={stroke} strokeWidth="0.5" opacity={opacity * 0.6} strokeDasharray="2,2" />
                        <path d="M 60 5 A 40 40 0 0 0 140 5" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <path d="M 60 295 A 40 40 0 0 1 140 295" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="92" y="2" width="16" height="6" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <rect x="92" y="292" width="16" height="6" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                      </>
                    )
                  case 'volleyball':
                    return (
                      <>
                        <rect x="20" y="20" width="160" height="260" fill="none" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        <line x1="20" y1="150" x2="180" y2="150" stroke={stroke} strokeWidth="2.5" opacity={opacity} />
                        {/* Red representada con líneas verticales */}
                        {[28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128, 138, 148, 158, 168].map(x => (
                          <line key={x} x1={x} y1="146" x2={x} y2="154" stroke={stroke} strokeWidth="0.5" opacity={opacity * 0.8} />
                        ))}
                        <line x1="20" y1="100" x2="180" y2="100" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.6} strokeDasharray="3,2" />
                        <line x1="20" y1="200" x2="180" y2="200" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.6} strokeDasharray="3,2" />
                        <text x="100" y="80" textAnchor="middle" fill={stroke} opacity={opacity * 0.5} fontSize="8" fontFamily="Arial">ATAQUE</text>
                        <text x="100" y="225" textAnchor="middle" fill={stroke} opacity={opacity * 0.5} fontSize="8" fontFamily="Arial">DEFENSA</text>
                      </>
                    )
                  case 'basketball':
                    return (
                      <>
                        <rect x="10" y="10" width="180" height="280" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <line x1="10" y1="150" x2="190" y2="150" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <circle cx="100" cy="150" r="18" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        {/* Aros */}
                        <line x1="90" y1="10" x2="110" y2="10" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        <line x1="90" y1="290" x2="110" y2="290" stroke={stroke} strokeWidth="2" opacity={opacity} />
                        {/* Líneas de tiro libre */}
                        <rect x="75" y="10" width="50" height="50" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <rect x="75" y="240" width="50" height="50" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <circle cx="100" cy="60" r="14" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.7} strokeDasharray="2,2" />
                        <circle cx="100" cy="240" r="14" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.7} strokeDasharray="2,2" />
                        {/* Arcos de 3 puntos */}
                        <path d="M 30 10 L 30 50 A 70 70 0 0 0 170 50 L 170 10" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <path d="M 30 290 L 30 250 A 70 70 0 0 1 170 250 L 170 290" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                      </>
                    )
                  case 'rugby_7':
                  case 'rugby_15':
                    return (
                      <>
                        <rect x="5" y="5" width="190" height="290" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        {/* In-goal areas */}
                        <line x1="5" y1="35" x2="195" y2="35" stroke={stroke} strokeWidth="1.5" opacity={opacity} />
                        <line x1="5" y1="265" x2="195" y2="265" stroke={stroke} strokeWidth="1.5" opacity={opacity} />
                        {/* Líneas de 22m */}
                        <line x1="5" y1="80" x2="195" y2="80" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="5" y1="220" x2="195" y2="220" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        {/* Mitad */}
                        <line x1="5" y1="150" x2="195" y2="150" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        {/* Líneas de 10m punteadas */}
                        <line x1="5" y1="120" x2="195" y2="120" stroke={stroke} strokeWidth="0.5" opacity={opacity * 0.6} strokeDasharray="3,3" />
                        <line x1="5" y1="180" x2="195" y2="180" stroke={stroke} strokeWidth="0.5" opacity={opacity * 0.6} strokeDasharray="3,3" />
                        {/* Postes H */}
                        <line x1="92" y1="5" x2="92" y2="35" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        <line x1="108" y1="5" x2="108" y2="35" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        <line x1="92" y1="265" x2="92" y2="295" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        <line x1="108" y1="265" x2="108" y2="295" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                      </>
                    )
                  case 'handball_7':
                    return (
                      <>
                        <rect x="10" y="10" width="180" height="280" fill="none" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <line x1="10" y1="150" x2="190" y2="150" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        {/* Áreas semi-circulares (6 metros) */}
                        <path d="M 50 10 A 50 50 0 0 0 150 10" fill="none" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        <path d="M 50 290 A 50 50 0 0 1 150 290" fill="none" stroke={stroke} strokeWidth="1.2" opacity={opacity} />
                        {/* Línea 9m punteada */}
                        <path d="M 35 10 A 65 65 0 0 0 165 10" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.7} strokeDasharray="3,3" />
                        <path d="M 35 290 A 65 65 0 0 1 165 290" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity * 0.7} strokeDasharray="3,3" />
                        {/* Arcos */}
                        <line x1="92" y1="8" x2="108" y2="8" stroke={stroke} strokeWidth="2.5" opacity={opacity} />
                        <line x1="92" y1="292" x2="108" y2="292" stroke={stroke} strokeWidth="2.5" opacity={opacity} />
                        {/* Línea 7m */}
                        <line x1="95" y1="40" x2="105" y2="40" stroke={stroke} strokeWidth="1" opacity={opacity} />
                        <line x1="95" y1="260" x2="105" y2="260" stroke={stroke} strokeWidth="1" opacity={opacity} />
                      </>
                    )
                  default:
                    return (
                      <>
                        <rect x="5" y="5" width="190" height="290" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <line x1="5" y1="150" x2="195" y2="150" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                        <circle cx="100" cy="150" r="20" fill="none" stroke={stroke} strokeWidth="0.8" opacity={opacity} />
                      </>
                    )
                }
              })()}
            </svg>
          </div>

          {(() => {
            const layouts: Record<string, { y: number }> = (() => {
              switch (sportCode) {
                case 'football_11':
                case 'baby_5':
                case 'baby_6':
                case 'futsal':
                  return { arquero: { y: 92 }, defensor: { y: 70 }, mediocampista: { y: 45 }, delantero: { y: 18 } }
                case 'hockey_field':
                  return { arquero: { y: 90 }, defensor: { y: 68 }, mediocampista: { y: 42 }, delantero: { y: 18 } }
                case 'volleyball':
                  return { arquero: { y: 75 }, defensor: { y: 75 }, mediocampista: { y: 50 }, delantero: { y: 25 } }
                case 'basketball':
                  return { arquero: { y: 80 }, defensor: { y: 80 }, mediocampista: { y: 50 }, delantero: { y: 20 } }
                case 'rugby_15':
                  return { arquero: { y: 90 }, defensor: { y: 70 }, mediocampista: { y: 45 }, delantero: { y: 20 } }
                case 'rugby_7':
                  return { arquero: { y: 85 }, defensor: { y: 80 }, mediocampista: { y: 50 }, delantero: { y: 25 } }
                case 'handball_7':
                  return { arquero: { y: 90 }, defensor: { y: 70 }, mediocampista: { y: 50 }, delantero: { y: 25 } }
                default:
                  return { arquero: { y: 92 }, defensor: { y: 70 }, mediocampista: { y: 45 }, delantero: { y: 18 } }
              }
            })()
            return POSITIONS.flatMap(pos => {
              const players = titularesByPos[pos]
              return players.map((p, i) => {
                const x = ((i + 1) / (players.length + 1)) * 100
                const card = cards[p.id]
                const isDragging = draggingId === p.id
                const isTapSelected = tapSelectedId === p.id
                return (
                  <div
                    key={p.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${layouts[pos].y}%` }}
                    draggable
                    onDragStart={() => setDraggingId(p.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(p.id)}
                    onClick={() => handleTapPlayer(p.id)}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-white border-2 shadow-lg overflow-hidden relative cursor-pointer transition-transform ${isDragging ? 'opacity-40 scale-110' : 'hover:scale-105'} ${isTapSelected ? 'ring-4 ring-amber-400 scale-110' : ''}`}
                      style={{ borderColor: POSITION_COLORS[p.primary_position] }}
                    >
                      <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" draggable={false} />
                      {card === 'yellow' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-yellow-400 border border-yellow-600 z-10" />}
                      {card === 'red' && <span className="absolute -top-1 -right-1 w-4 h-5 rounded-sm bg-red-600 border border-red-800 z-10" />}
                    </div>
                    <p className="text-[9px] text-white text-center mt-0.5 font-bold leading-tight whitespace-nowrap drop-shadow-md pointer-events-none">
                      {p.full_name.split(' ').slice(-1)[0]}
                    </p>
                  </div>
                )
              })
            })
          })()}
        </div>

        {/* Suplentes */}
        <h3 className="text-xs uppercase font-bold text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
          Suplentes ({suplentes.length})
        </h3>
        <div className="space-y-1.5">
          {suplentes.map(p => {
            const card = cards[p.id]
            const isLateCall = lateCallNotes[p.id] !== undefined
            return (
              <Card
                key={p.id}
                className={`border-0 shadow-sm ${isLateCall ? 'bg-purple-50' : 'bg-amber-50'} ${draggingId === p.id ? 'opacity-40' : ''} ${tapSelectedId === p.id ? 'ring-4 ring-amber-400' : ''}`}
                draggable
                onDragStart={() => setDraggingId(p.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(p.id)}
                onClick={() => handleTapPlayer(p.id)}
              >
                <CardContent className="p-2 flex items-center gap-2.5 cursor-pointer">
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 relative bg-white" style={{ borderColor: POSITION_COLORS[p.primary_position] }}>
                    <img src={getAvatarUrl(p)} alt={p.full_name} className="w-full h-full object-cover" />
                    {card === 'yellow' && <span className="absolute -top-1 -right-1 w-3 h-4 rounded-sm bg-yellow-400 border border-yellow-600 z-10" />}
                    {card === 'red' && <span className="absolute -top-1 -right-1 w-3 h-4 rounded-sm bg-red-600 border border-red-800 z-10" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium truncate">{p.full_name}</p>
                      {isLateCall && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-200 text-purple-800 font-bold uppercase flex-shrink-0">Llamada tardía</span>
                      )}
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                      {POSITION_LABELS[p.primary_position]}
                    </span>
                    {isLateCall && lateCallNotes[p.id] && (
                      <p className="text-[10px] text-purple-700 italic mt-0.5">"{lateCallNotes[p.id]}"</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSwap({ suplenteId: p.id }) }}
                    className="text-xs px-2 py-1 rounded text-white font-semibold flex items-center gap-1 flex-shrink-0"
                    style={{ backgroundColor: '#00843D' }}
                  >
                    <ArrowUpDown size={12} /> Subir
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tarjetas amarillas y rojas */}
        <h3 className="text-xs uppercase font-bold text-muted-foreground mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
          Tarjetas
        </h3>
        <div className="space-y-1.5">
          {[...titulares, ...suplentes].map(p => {
            const card = cards[p.id] ?? 'none'
            return (
              <div key={p.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
                <span className="flex-1 text-sm font-medium truncate">{p.full_name}</span>
                <button
                  onClick={() => setCard(p.id, card === 'none' ? 'yellow' : 'none')}
                  className={`w-6 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold border ${card === 'yellow' ? 'bg-yellow-400 border-yellow-600' : 'bg-yellow-50 border-yellow-200 opacity-50'}`}
                  title="Amonestación"
                >🟨</button>
                <button
                  onClick={() => setCard(p.id, card === 'red' ? 'none' : 'red')}
                  className={`w-6 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold border ${card === 'red' ? 'bg-red-600 border-red-800' : 'bg-red-50 border-red-200 opacity-50'}`}
                  title="Expulsión"
                >🟥</button>
              </div>
            )
          })}
        </div>

        {/* Comentario del partido */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
              <MessageSquare size={12} /> COMENTARIO DEL PARTIDO
            </p>
            <textarea
              value={matchComment}
              onChange={e => setMatchComment(e.target.value)}
              rows={3}
              placeholder="Resumen del partido, jugadas clave, decisiones tácticas..."
              className="w-full text-sm px-3 py-2 border rounded-lg"
            />
          </CardContent>
        </Card>

        {/* Botón guardar */}
        <button
          className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-sm sticky bottom-20 md:bottom-4"
          style={{ backgroundColor: '#00843D' }}
          onClick={() => {
            const yellows = Object.values(cards).filter(c => c === 'yellow').length
            const reds = Object.values(cards).filter(c => c === 'red').length
            alert(`✅ Partido guardado (demo)\n\n${yellows} amonestaciones · ${reds} expulsiones\nComentario: ${matchComment ? 'sí' : 'no'}`)
          }}
        >
          GUARDAR PARTIDO
        </button>
      </div>

      {/* Modal de cambio */}
      {/* Modal llamada tardía */}
      {showAddPlayer && (
        <LateCallModal
          allOfCat={allOfCat}
          alreadyConvocadosIds={[...titularesIds, ...suplentesIds]}
          onClose={() => setShowAddPlayer(false)}
          onAdd={addLateCallPlayer}
        />
      )}

      {swap && (
        <SwapModal
          titulares={titulares}
          suplentes={suplentes}
          initialTitularId={swap.titularId}
          initialSuplenteId={swap.suplenteId}
          onClose={() => setSwap(null)}
          onConfirm={performSwap}
        />
      )}
    </div>
  )
}

function SwapModal({ titulares, suplentes, initialTitularId, initialSuplenteId, onClose, onConfirm }: {
  titulares: { id: string; full_name: string; primary_position: Position }[]
  suplentes: { id: string; full_name: string; primary_position: Position }[]
  initialTitularId?: string
  initialSuplenteId?: string
  onClose: () => void
  onConfirm: (titularId: string, suplenteId: string) => void
}) {
  const [titularId, setTitularId] = useState(initialTitularId ?? '')
  const [suplenteId, setSuplenteId] = useState(initialSuplenteId ?? '')

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>CAMBIO</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">Sale (titular)</label>
          <select value={titularId} onChange={e => setTitularId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Elegir titular...</option>
            {titulares.map(t => <option key={t.id} value={t.id}>{t.full_name} — {POSITION_LABELS[t.primary_position]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">Entra (suplente)</label>
          <select value={suplenteId} onChange={e => setSuplenteId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
            <option value="">Elegir suplente...</option>
            {suplentes.map(s => <option key={s.id} value={s.id}>{s.full_name} — {POSITION_LABELS[s.primary_position]}</option>)}
          </select>
        </div>
        <button
          onClick={() => titularId && suplenteId && onConfirm(titularId, suplenteId)}
          disabled={!titularId || !suplenteId}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: '#00843D' }}
        >
          CONFIRMAR CAMBIO
        </button>
      </div>
    </div>
  )
}

function LateCallModal({ allOfCat, alreadyConvocadosIds, onClose, onAdd }: {
  allOfCat: { id: string; full_name: string; primary_position: Position }[]
  alreadyConvocadosIds: string[]
  onClose: () => void
  onAdd: (playerId: string, reason: string) => void
}) {
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')
  const [selectedId, setSelectedId] = useState<string>('')

  const available = allOfCat.filter(p => !alreadyConvocadosIds.includes(p.id))
  const matches = search.trim()
    ? available.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : available.slice(0, 8)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>LLAMADA TARDÍA</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <p className="text-xs text-muted-foreground">
          Sumá un jugador que no estaba en la convocatoria original. Útil cuando hay bajas de último momento.
        </p>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {matches.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin resultados</p>}
          {matches.map(p => {
            const sel = selectedId === p.id
            return (
              <button key={p.id} onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-2 rounded-lg border-2 ${sel ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                <p className="text-sm font-semibold">{p.full_name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase text-white" style={{ backgroundColor: POSITION_COLORS[p.primary_position] }}>
                  {POSITION_LABELS[p.primary_position]}
                </span>
              </button>
            )
          })}
        </div>

        <div>
          <label className="text-xs font-semibold mb-1 block">Motivo del llamado *</label>
          <input type="text" required value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Ej: baja de Tomás por enfermedad" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>

        <button
          onClick={() => selectedId && reason && onAdd(selectedId, reason)}
          disabled={!selectedId || !reason}
          className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40"
          style={{ backgroundColor: '#7c3aed' }}
        >
          AGREGAR A CONVOCATORIA
        </button>
      </div>
    </div>
  )
}
