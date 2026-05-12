'use client'

import { useState, useRef, use } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageCircle, Camera, Plus, Trophy, AlertCircle, Star, Award, FileCheck, FileWarning, Upload, Mail, Edit2, X, Check, QrCode, Users as UsersIcon, Shield } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { demoPlayers, demoCategories, demoPayments, demoEvents, demoAttendance, getDetailedAttendanceStats, thisMonth, getSiblings, getSiblingDiscount, demoSiblingDiscountConfig, getRatingsForPlayer, getPlayerRatingStats, demoProfes } from '@/lib/demo-data'
import { useActiveRole } from '@/lib/use-role'
import { POSITION_LABELS, POSITION_COLORS, type Position } from '@/types'
import { getAvatarUrl } from '@/lib/avatars'
import { getTiraLabel, getTiraColor } from '@/lib/tiras'
import type { SportCode } from '@/lib/sports'

const ALL_POSITIONS: Position[] = ['arquero', 'defensor', 'mediocampista', 'delantero']

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const initialPlayer = demoPlayers.find(p => p.id === id)
  if (!initialPlayer) notFound()

  const [photo, setPhoto] = useState<string | null>(initialPlayer!.photo_url)
  const [aptoOk, setAptoOk] = useState(initialPlayer!.apto_medico_ok)
  const [aptoFile, setAptoFile] = useState<string | null>(initialPlayer!.apto_medico_file_url)
  const [primaryPos, setPrimaryPos] = useState<Position>(initialPlayer!.primary_position)
  const [secondaryPos, setSecondaryPos] = useState<Position[]>(initialPlayer!.secondary_positions)
  const [editingPositions, setEditingPositions] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showObservationForm, setShowObservationForm] = useState(false)
  // Consentimientos de imagen (Ley 26.061 + 25.326)
  const [imageConsent, setImageConsent] = useState({
    team_photos: true,
    match_videos: true,
    social_media: false,  // por default OFF — opt-in explícito requerido
    training_clips: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aptoInputRef = useRef<HTMLInputElement>(null)

  function toggleSecondary(pos: Position) {
    if (pos === primaryPos) return
    if (secondaryPos.includes(pos)) {
      setSecondaryPos(secondaryPos.filter(p => p !== pos))
    } else if (secondaryPos.length < 3) {
      setSecondaryPos([...secondaryPos, pos])
    }
  }

  const player = initialPlayer!
  const cat = demoCategories.find(c => c.id === player.category_id)

  // ROL ACTIVO: tesorero NO ve evaluación deportiva (no es su área). Padres tampoco — el padre vive en /padres/, fuera de este shell.
  const [activeRole] = useActiveRole()
  const canSeeRatings = activeRole === 'admin' || activeRole === 'profe' || activeRole === 'coordinador'
  const ratingHistory = canSeeRatings ? getRatingsForPlayer(player.id) : []
  const ratingStats = canSeeRatings ? getPlayerRatingStats(player.id) : null
  const playerSportCode = (cat?.sport_format_code ?? 'football_11') as SportCode
  const tiraLabel = getTiraLabel(player.tira, playerSportCode)
  const tiraColor = getTiraColor(player.tira, playerSportCode)
  const stats = getDetailedAttendanceStats(player.id, player.category_id)
  const WEEKDAY_NAMES = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const payments = demoPayments.filter(p => p.player_id === player.id).sort((a, b) => b.paid_at.localeCompare(a.paid_at))
  const matches = demoEvents.filter(e => e.event_type === 'match' && e.category_id === player.category_id)
  const initials = player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)

  // Estado de cuota
  const paidThisMonth = demoPayments.some(p => p.player_id === player.id && p.period === thisMonth && p.fee_type === 'actividad')
  const status = paidThisMonth ? 'al-dia' : 'deudor'
  const statusLabel = paidThisMonth ? 'Al día' : 'Deudor'
  const statusColor = paidThisMonth ? '#00843D' : '#DC2626'

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const waMsg = encodeURIComponent(
    status === 'deudor'
      ? `Hola ${player.tutor_name}, te recordamos que ${player.full_name} tiene una deuda pendiente con el Club Banfield Ramos Mejía.`
      : `Hola ${player.tutor_name}, soy del Club Banfield Ramos Mejía.`
  )

  return (
    <div className="pb-4">
      {/* Header con foto grande */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${tiraColor} 0%, ${tiraColor}dd 100%)` }}>
        <Link href="/socios" className="absolute top-3 left-3 text-white p-2 rounded-full bg-black/20 hover:bg-black/30 z-10">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/carnet/${player.id}`} target="_blank" className="absolute top-3 right-3 text-white px-2.5 py-1.5 rounded-full bg-black/20 hover:bg-black/30 z-10 flex items-center gap-1 text-xs font-semibold">
          <QrCode size={14} /> Carnet
        </Link>
        <div className="pt-8 pb-4 px-4 text-center">
          <div className="relative inline-block">
            <div
              className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center"
            >
              {photo ? (
                <img src={photo} alt={player.full_name} className="w-full h-full object-cover" />
              ) : (
                <img src={getAvatarUrl(player)} alt={player.full_name} className="w-full h-full object-cover" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center"
              title="Cambiar foto"
            >
              <Camera size={16} style={{ color: tiraColor }} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mt-3" style={{ fontFamily: "var(--font-barlow)" }}>
            {player.full_name.toUpperCase()}
          </h1>
          <div className="flex items-center justify-center gap-2 flex-wrap mt-1">
            <Badge className="text-white border-0 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
              Cat. {cat?.name}
            </Badge>
            <Badge className="text-white border-0 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>
              {tiraLabel}
            </Badge>
            <Badge className="text-white border-0 text-xs font-bold" style={{ backgroundColor: POSITION_COLORS[primaryPos] }}>
              {POSITION_LABELS[primaryPos]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-3 md:p-4 space-y-3 -mt-3">
        {/* KPIs principales */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Convocado</p>
              <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: "var(--font-barlow)" }}>
                {player.convocation_count}
              </p>
              <p className="text-[10px] text-muted-foreground">veces este año</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">Cuota</p>
              <p className="text-base font-bold mt-1" style={{ fontFamily: "var(--font-barlow)", color: statusColor }}>
                {statusLabel}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Asistencia detallada: año y semana */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              ASISTENCIA A PRÁCTICAS
            </p>

            {/* Año */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">📅 Año (acumulado)</span>
                <span className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: tiraColor }}>
                  {stats.year.percentage}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${stats.year.percentage}%`, backgroundColor: tiraColor }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stats.year.presentes} presentes / {stats.year.total} elegibles
                {stats.year.totalRaw > stats.year.total && ` (${stats.year.totalRaw - stats.year.total} con permiso descontados)`}
              </p>
            </div>

            {/* Semana */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">🗓️ Esta semana (lun-vie)</span>
                <span className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>
                  {stats.week.percentage}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-700" style={{ width: `${stats.week.percentage}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {stats.week.presentes} presentes / {stats.week.total} elegibles
                {stats.week.totalRaw > stats.week.total && ` (${stats.week.totalRaw - stats.week.total} con permiso)`}
              </p>
            </div>

            {/* Permisos */}
            <div className="pt-2 border-t">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1.5">
                Permisos del profesor ({stats.permits.length})
              </p>
              {stats.permits.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Sin permisos. Debe asistir a todas las prácticas.</p>
              ) : (
                <div className="space-y-1">
                  {stats.permits.map(perm => (
                    <div key={perm.id} className="flex items-center justify-between p-1.5 rounded bg-amber-50 border border-amber-200">
                      <div>
                        <p className="text-xs font-semibold text-amber-800">{WEEKDAY_NAMES[perm.weekday]}</p>
                        <p className="text-[10px] text-amber-700">"{perm.reason}"</p>
                      </div>
                      <Badge className="text-[10px] bg-amber-200 text-amber-800 border-0">
                        Autorizado
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <button className="mt-2 w-full py-1.5 rounded text-xs font-semibold border-2 border-dashed border-gray-300 text-muted-foreground hover:bg-gray-50">
                + Agregar permiso
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Apto médico */}
        <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${aptoOk ? '#00843D' : '#DC2626'}` }}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                APTO MÉDICO
              </p>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={aptoOk} onChange={e => setAptoOk(e.target.checked)} className="w-4 h-4 accent-[#00843D]" />
                <span className="text-xs font-semibold">Vigente</span>
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {aptoOk ? (
                <FileCheck size={18} className="text-green-600 flex-shrink-0" />
              ) : (
                <FileWarning size={18} className="text-red-500 flex-shrink-0" />
              )}
              <span className={aptoOk ? 'text-green-700' : 'text-red-600'}>
                {aptoOk ? `OK${player.apto_medico_expires_at ? ` · vence ${new Date(player.apto_medico_expires_at).toLocaleDateString('es-AR')}` : ''}` : 'Pendiente — no apto'}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => aptoInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-semibold hover:bg-gray-50"
              >
                <Upload size={12} /> {aptoFile ? 'Reemplazar archivo' : 'Subir archivo (opcional)'}
              </button>
              {aptoFile && <span className="text-[10px] text-muted-foreground">📎 archivo cargado</span>}
              <input
                ref={aptoInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) {
                    const reader = new FileReader()
                    reader.onload = (ev) => setAptoFile(ev.target?.result as string)
                    reader.readAsDataURL(f)
                  }
                }}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Hermanos en el club */}
        {(() => {
          const siblings = getSiblings(player.id)
          const myDiscount = getSiblingDiscount(player.id)
          if (siblings.length === 0) return null
          return (
            <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #7c3aed' }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
                    <UsersIcon size={12} /> HERMANOS EN EL CLUB ({siblings.length})
                  </p>
                  {myDiscount.discount_pct > 0 && (
                    <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0">
                      {myDiscount.order}° hijo · {myDiscount.discount_pct}% off
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  {siblings.map(s => {
                    const sCat = demoCategories.find(c => c.id === s.category_id)
                    const sDiscount = getSiblingDiscount(s.id)
                    return (
                      <Link key={s.id} href={`/socios/${s.id}`}>
                        <div className="flex items-center gap-2 p-1.5 rounded hover:bg-purple-50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-purple-200 flex items-center justify-center text-[10px] font-bold text-purple-800 flex-shrink-0">
                            {s.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{s.full_name}</p>
                            <p className="text-[10px] text-muted-foreground">Cat. {sCat?.name}</p>
                          </div>
                          {sDiscount.discount_pct > 0 && (
                            <span className="text-[10px] text-purple-700 font-bold">{sDiscount.discount_pct}% off</span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  Configurado: 2° hijo {demoSiblingDiscountConfig.second_child_pct}% off · 3° y siguientes {demoSiblingDiscountConfig.third_or_more_pct}% off
                </p>
              </CardContent>
            </Card>
          )
        })()}

        {/* Datos del tutor */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              TUTOR
            </p>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{player.tutor_name ?? 'Sin datos'}</p>
              {player.tutor_dni && (
                <p className="text-xs text-muted-foreground">DNI: {player.tutor_dni}</p>
              )}
              {player.tutor_email && (
                <a href={`mailto:${player.tutor_email}`} className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <Mail size={12} /> {player.tutor_email}
                </a>
              )}
              {player.tutor_whatsapp && (
                <a
                  href={`https://wa.me/54${player.tutor_whatsapp}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-green-600 font-semibold"
                >
                  <MessageCircle size={14} /> WhatsApp +54 {player.tutor_whatsapp}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Consentimiento de imagen del menor (Ley 26.061) */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
              <Shield size={12} /> CONSENTIMIENTOS DE IMAGEN
            </p>
            <div className="space-y-1.5">
              {[
                { key: 'team_photos' as const, label: 'Fotos grupales del plantel', desc: 'Plantel completo posando' },
                { key: 'match_videos' as const, label: 'Grabación de partidos', desc: 'Para uso interno del cuerpo técnico' },
                { key: 'training_clips' as const, label: 'Videos de entrenamientos', desc: 'Análisis técnico interno' },
                { key: 'social_media' as const, label: 'Redes sociales del club', desc: 'Instagram, Facebook, web pública', sensitive: true },
              ].map(item => (
                <label key={item.key} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${imageConsent[item.key] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <input
                    type="checkbox"
                    checked={imageConsent[item.key]}
                    onChange={e => setImageConsent({ ...imageConsent, [item.key]: e.target.checked })}
                    className="mt-0.5 w-4 h-4 accent-green-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      {item.label}
                      {item.sensitive && <Badge className="text-[8px] bg-amber-100 text-amber-700 border-0">SENSIBLE</Badge>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Firmado por tutor responsable. Conforme Ley 26.061 (protección integral NNA) y Ley 25.326 (datos personales).
            </p>
          </CardContent>
        </Card>

        {/* Posiciones */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                POSICIONES
              </p>
              {!editingPositions ? (
                <button onClick={() => setEditingPositions(true)} className="text-xs px-2 py-1 rounded border text-muted-foreground hover:bg-gray-50 flex items-center gap-1">
                  <Edit2 size={11} /> Editar
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={() => { setEditingPositions(false); alert('✅ Posiciones actualizadas (demo)') }} className="p-1 rounded text-green-600 hover:bg-green-50">
                    <Check size={14} />
                  </button>
                  <button onClick={() => {
                    setPrimaryPos(player.primary_position)
                    setSecondaryPos(player.secondary_positions)
                    setEditingPositions(false)
                  }} className="p-1 rounded text-gray-400 hover:bg-gray-50">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {!editingPositions ? (
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Principal</p>
                  <span
                    className="text-xs px-2 py-1 rounded font-bold uppercase text-white"
                    style={{ backgroundColor: POSITION_COLORS[primaryPos] }}
                  >
                    {POSITION_LABELS[primaryPos]}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">Secundarias</p>
                  {secondaryPos.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground italic">Ninguna</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {secondaryPos.map(sp => (
                        <span key={sp} className="text-xs px-2 py-1 rounded font-semibold" style={{ backgroundColor: `${POSITION_COLORS[sp]}20`, color: POSITION_COLORS[sp] }}>
                          {POSITION_LABELS[sp]}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">Principal *</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_POSITIONS.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPrimaryPos(p)
                          setSecondaryPos(secondaryPos.filter(sp => sp !== p))
                        }}
                        className={`py-2 rounded-lg text-xs font-semibold border ${primaryPos === p ? 'text-white border-transparent' : 'border-gray-200'}`}
                        style={primaryPos === p ? { backgroundColor: POSITION_COLORS[p] } : {}}
                      >
                        {POSITION_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
                    Secundarias (hasta 3) — {secondaryPos.length}/3
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_POSITIONS.filter(p => p !== primaryPos).map(p => {
                      const sel = secondaryPos.includes(p)
                      const disabled = !sel && secondaryPos.length >= 3
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => toggleSecondary(p)}
                          disabled={disabled}
                          className={`py-2 rounded-lg text-xs font-semibold border ${sel ? 'text-white border-transparent' : 'border-gray-200'} ${disabled ? 'opacity-30' : ''}`}
                          style={sel ? { backgroundColor: POSITION_COLORS[p] } : {}}
                        >
                          {POSITION_LABELS[p]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Datos personales */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
              DATOS PERSONALES
            </p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de nacimiento</span>
                <span className="font-semibold">{new Date(player.birth_date).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Categoría</span>
                <span className="font-semibold">{cat?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tira</span>
                <span className="font-semibold" style={{ color: tiraColor }}>{tiraLabel}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagos */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                HISTORIAL DE PAGOS
              </p>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="text-xs font-semibold px-2.5 py-1 rounded text-white flex items-center gap-1"
                style={{ backgroundColor: '#00843D' }}
              >
                <Plus size={12} /> Pago
              </button>
            </div>
            <div className="space-y-1.5">
              {payments.length === 0 && <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>}
              {payments.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                  <div>
                    <p className="font-medium">{p.fee_type === 'actividad' ? 'Cuota actividad' : p.fee_type === 'matricula' ? 'Matrícula' : 'Cuota social'} · {p.period}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(p.paid_at).toLocaleDateString('es-AR')} · {p.payment_method === 'cash' ? '💵 Efectivo' : `🏦 ${p.transfer_reference}`}
                    </p>
                  </div>
                  <p className="font-bold text-green-600 text-sm">${p.amount.toLocaleString('es-AR')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
                OBSERVACIONES
              </p>
              <button
                onClick={() => setShowObservationForm(true)}
                className="text-xs font-semibold px-2.5 py-1 rounded text-white flex items-center gap-1"
                style={{ backgroundColor: '#00843D' }}
              >
                <Plus size={12} /> Nota
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Sin observaciones registradas.</p>
          </CardContent>
        </Card>

        {/* Evaluación deportiva — SÓLO visible para profe/admin/coordinador. Tesoreros y padres NO acceden. */}
        {canSeeRatings && ratingStats && ratingStats.count > 0 && (
          <Card className="border-0 shadow-sm" style={{ borderLeft: '4px solid #1d4ed8' }}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5" style={{ fontFamily: "var(--font-barlow)" }}>
                  <Star size={12} style={{ color: '#1d4ed8' }} /> EVALUACIÓN DEPORTIVA
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold uppercase border border-blue-200">
                  🔒 Privado · solo cuerpo técnico
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Partidos</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{ratingStats.count}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Promedio</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#1d4ed8' }}>{ratingStats.avg}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Últimos 5</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: ratingStats.lastFiveAvg >= ratingStats.avg ? '#00843D' : '#F59E0B' }}>{ratingStats.lastFiveAvg}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground">Rango</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{ratingStats.min}–{ratingStats.max}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {ratingHistory.slice(0, 6).map(r => {
                  const ev = demoEvents.find(e => e.id === r.event_id)
                  const profe = demoProfes.find(p => p.id === r.rated_by_profe_id)
                  const date = ev ? new Date(ev.scheduled_at) : new Date(r.created_at)
                  const scoreColor = r.score >= 8 ? '#00843D' : r.score >= 6 ? '#1d4ed8' : r.score >= 4 ? '#F59E0B' : '#DC2626'
                  return (
                    <div key={r.id} className="border-b last:border-0 pb-1.5 last:pb-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: scoreColor }}>
                          {r.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">vs. {ev?.rival ?? 'Partido'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                            {profe && <> · {profe.full_name}</>}
                          </p>
                        </div>
                      </div>
                      {r.observation && (
                        <p className="text-[11px] text-gray-700 italic mt-1 pl-10">"{r.observation}"</p>
                      )}
                    </div>
                  )
                })}
              </div>
              {ratingHistory.length > 6 && (
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  Mostrando últimas 6 de {ratingHistory.length} evaluaciones
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Historial de convocatorias */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
              HISTORIAL DE CONVOCATORIAS ({player.convocation_count})
            </p>
            <div className="space-y-1.5">
              {(() => {
                // Generar histórico simulado: convocation_count partidos pasados
                const pastRivales = ['Deportivo Norte','Atlético San Justo','Club Italiano','Vélez Junior','Boca Ramos','River Sub','Lanús Niño','Independiente Mini','Argentinos Mini','Acassuso','Ferro Carril','Almagro Junior']
                const today = new Date('2026-05-06')
                const past = Array.from({ length: player.convocation_count }, (_, i) => {
                  const d = new Date(today)
                  d.setDate(today.getDate() - (i + 1) * 7) // un partido por semana hacia atrás
                  // Determinar rol: 70% titular, 20% suplente, 10% no jugó
                  const seed = (player.id.charCodeAt(2) ?? 0) + i
                  const role = (seed * 13) % 10
                  const status = role < 7 ? 'titular' : role < 9 ? 'suplente' : 'no_jugo'
                  return {
                    id: `past-${player.id}-${i}`,
                    rival: pastRivales[i % pastRivales.length],
                    date: d,
                    status,
                  }
                })
                if (past.length === 0) {
                  return <p className="text-xs text-muted-foreground italic">Sin convocatorias todavía.</p>
                }
                return past.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-1.5 last:pb-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy size={12} style={{ color: '#C9A84C' }} className="flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">vs. {c.rival}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {c.date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] border-0 ${
                      c.status === 'titular' ? 'bg-green-100 text-green-700' :
                      c.status === 'suplente' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {c.status === 'titular' ? 'Titular' : c.status === 'suplente' ? 'Suplente' : 'No jugó'}
                    </Badge>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Próximo partido */}
        {matches[0] && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2" style={{ fontFamily: "var(--font-barlow)" }}>
                PRÓXIMO PARTIDO
              </p>
              <div className="flex items-center gap-2">
                <Trophy size={18} style={{ color: '#C9A84C' }} />
                <div>
                  <p className="text-sm font-semibold">vs. {matches[0].rival}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(matches[0].scheduled_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal pago */}
      {showPaymentForm && (
        <PaymentFormModal player={player} onClose={() => setShowPaymentForm(false)} />
      )}

      {/* Modal observación */}
      {showObservationForm && (
        <ObservationFormModal player={player} onClose={() => setShowObservationForm(false)} />
      )}
    </div>
  )
}

function PaymentFormModal({ player, onClose }: { player: any; onClose: () => void }) {
  const siblingDiscount = getSiblingDiscount(player.id)
  const discountAmount = (62000 * siblingDiscount.discount_pct) / 100
  const finalCuota = 62000 - discountAmount
  // Generar cuotas pendientes simuladas: meses sin pagar + matrícula si falta
  const today = new Date('2026-05-07')
  const cuotaMonths = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
  // Filtramos las que NO están pagadas (en demo)
  const pagadas = new Set([`${player.id}-actividad-2026-03`, `${player.id}-actividad-2026-04`])
  const pendientes = [
    ...cuotaMonths.filter(m => !pagadas.has(`${player.id}-actividad-${m}`)).map(m => ({
      id: `actividad-${m}`,
      label: `Cuota actividad ${m}`,
      amount: finalCuota,
      original_amount: 62000,
    })),
    { id: 'matricula-2026', label: 'Matrícula 2026', amount: 35000, original_amount: 35000 },
  ]

  const [selected, setSelected] = useState<Set<string>>(new Set([pendientes[0]?.id]))
  const [method, setMethod] = useState<'cash' | 'transfer'>('cash')
  const [reference, setReference] = useState('')
  const [sendWA, setSendWA] = useState(true)

  const totalAmount = pendientes
    .filter(p => selected.has(p.id))
    .reduce((s, p) => s + p.amount, 0)

  function toggle(id: string) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const lista = pendientes.filter(p => selected.has(p.id)).map(p => `✓ ${p.label} — $${p.amount.toLocaleString('es-AR')}`).join('\n')
    const recibo = `🧾 RECIBO — Club Banfield Ramos Mejía\nSocio: ${player.full_name}\n\n${lista}\n─────────\nTOTAL: $${totalAmount.toLocaleString('es-AR')}\nMedio: ${method === 'cash' ? 'Efectivo' : `Transferencia (${reference})`}\nFecha: ${today.toLocaleDateString('es-AR')}\n\n¡Gracias!`
    if (sendWA && player.tutor_whatsapp) {
      window.open(`https://wa.me/54${player.tutor_whatsapp}?text=${encodeURIComponent(recibo)}`, '_blank')
    }
    alert(`✅ Cobro registrado (demo):\n${player.full_name}\nTotal: $${totalAmount.toLocaleString('es-AR')}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>REGISTRAR PAGO</h3>
          <button onClick={onClose} className="text-2xl text-muted-foreground">×</button>
        </div>
        <p className="text-sm text-muted-foreground">{player.full_name}</p>

        {siblingDiscount.discount_pct > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 text-xs">
            <p className="font-semibold text-purple-800 flex items-center gap-1">
              👨‍👦 {siblingDiscount.order}° hijo de la familia — descuento {siblingDiscount.discount_pct}%
            </p>
            <p className="text-purple-700 text-[11px]">
              La cuota se aplica con descuento automático: ${finalCuota.toLocaleString('es-AR')} (en lugar de $62.000)
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-xs font-semibold mb-1.5">Cuotas pendientes — marcá las que cobra</p>
            <div className="space-y-1.5">
              {pendientes.map(p => {
                const sel = selected.has(p.id)
                return (
                  <label key={p.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer ${sel ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <input type="checkbox" checked={sel} onChange={() => toggle(p.id)} className="w-4 h-4 accent-[#00843D]" />
                    <span className="flex-1 text-sm">{p.label}</span>
                    <span className="font-bold text-sm" style={{ fontFamily: "var(--font-barlow)" }}>${p.amount.toLocaleString('es-AR')}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <Card className="border-0 bg-gray-50">
            <CardContent className="p-3 flex items-center justify-between">
              <span className="text-sm font-semibold">TOTAL</span>
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-barlow)", color: '#00843D' }}>
                ${totalAmount.toLocaleString('es-AR')}
              </span>
            </CardContent>
          </Card>

          <div>
            <label className="text-xs font-semibold mb-1 block">Medio de pago</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMethod('cash')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${method === 'cash' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={method === 'cash' ? { backgroundColor: '#00843D' } : {}}>💵 Efectivo</button>
              <button type="button" onClick={() => setMethod('transfer')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${method === 'transfer' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={method === 'transfer' ? { backgroundColor: '#1d4ed8' } : {}}>🏦 Transferencia</button>
            </div>
          </div>
          {method === 'transfer' && (
            <div>
              <label className="text-xs font-semibold mb-1 block">N° comprobante</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} required
                placeholder="Ej: MP-12345" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}

          {player.tutor_whatsapp && (
            <label className="flex items-center gap-2 p-2 rounded-lg border bg-green-50 border-green-200 cursor-pointer">
              <input type="checkbox" checked={sendWA} onChange={e => setSendWA(e.target.checked)} className="w-4 h-4 accent-green-600" />
              <MessageCircle size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-700">Enviar recibo por WhatsApp al tutor</span>
            </label>
          )}

          <button type="submit" disabled={selected.size === 0} className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ backgroundColor: '#00843D' }}>
            REGISTRAR Y ENVIAR ({selected.size})
          </button>
        </form>
      </div>
    </div>
  )
}

function ObservationFormModal({ player, onClose }: { player: any; onClose: () => void }) {
  const [type, setType] = useState<'highlight' | 'warning' | 'sanction'>('highlight')
  const [cause, setCause] = useState('')
  const [notes, setNotes] = useState('')

  const causes = ['Mala conducta', 'Falta de respeto al árbitro', 'Falta de respeto al entrenador', 'Indisciplina táctica', 'Llegada tarde reiterada']

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`✅ Observación registrada (demo):\n${type === 'highlight' ? '⭐ Destacado' : type === 'warning' ? '⚠️ Llamado de atención' : '🚫 Apercibimiento'}\n${player.full_name}\n${notes}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-3">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>NUEVA OBSERVACIÓN</h3>
          <button onClick={onClose} className="text-2xl text-muted-foreground">×</button>
        </div>
        <p className="text-sm text-muted-foreground">{player.full_name}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1 block">Tipo</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button type="button" onClick={() => setType('highlight')}
                className={`py-2 rounded-lg text-xs font-semibold border ${type === 'highlight' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={type === 'highlight' ? { backgroundColor: '#00843D' } : {}}>
                <Star size={14} className="inline" /> Destacado
              </button>
              <button type="button" onClick={() => setType('warning')}
                className={`py-2 rounded-lg text-xs font-semibold border ${type === 'warning' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={type === 'warning' ? { backgroundColor: '#F59E0B' } : {}}>
                <AlertCircle size={14} className="inline" /> Llamado
              </button>
              <button type="button" onClick={() => setType('sanction')}
                className={`py-2 rounded-lg text-xs font-semibold border ${type === 'sanction' ? 'text-white border-transparent' : 'border-gray-200'}`}
                style={type === 'sanction' ? { backgroundColor: '#DC2626' } : {}}>
                <Award size={14} className="inline" /> Sanción
              </button>
            </div>
          </div>
          {type === 'sanction' && (
            <div>
              <label className="text-xs font-semibold mb-1 block">Causal</label>
              <select value={cause} onChange={e => setCause(e.target.value)} required className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar causal...</option>
                {causes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold mb-1 block">Nota (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Detalles..." />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ backgroundColor: '#00843D' }}>
            GUARDAR OBSERVACIÓN
          </button>
        </form>
      </div>
    </div>
  )
}
