'use client'

import { use, useEffect, useMemo, useState } from 'react'
import {
  getCodeByValue,
  isCodeValid,
  detectDuplicate,
  addPendingRegistration,
  getAllRegistrationCodes,
  updateRegistrationCode,
} from '@/lib/registration'
import { demoClubs } from '@/lib/clubs'
import { demoCategories } from '@/lib/demo-data'
import type { PendingRegistration, Position, TutorRelation } from '@/types'
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react'
import Image from 'next/image'

export default function InscripcionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params)
  const codeValue = decodeURIComponent(code)

  const [, forceTick] = useState(0)
  useEffect(() => { forceTick(t => t + 1) }, [])

  const regCode = useMemo(() => getCodeByValue(codeValue), [codeValue])
  const validation = useMemo(
    () => (regCode ? isCodeValid(regCode) : { valid: false, reason: 'Código no encontrado' }),
    [regCode]
  )

  const club = regCode ? demoClubs.find(c => c.id === regCode.club_id) : null
  const category = regCode ? demoCategories.find(c => c.id === regCode.category_id) : null

  // Form state
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [position, setPosition] = useState<Position>('mediocampista')

  const [tutorDni, setTutorDni] = useState('')
  const [tutorName, setTutorName] = useState('')
  const [tutorWhatsapp, setTutorWhatsapp] = useState('')
  const [tutorEmail, setTutorEmail] = useState('')
  const [tutorRelation, setTutorRelation] = useState<TutorRelation>('padre')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    if (!regCode) return
    if (!fullName.trim() || !dni.trim() || !birthDate || !tutorDni.trim() || !tutorName.trim() || !tutorWhatsapp.trim()) {
      setErrorMsg('Completá los campos obligatorios')
      return
    }
    setSubmitting(true)
    const dupPlayer = detectDuplicate(dni.trim())
    const newPending: PendingRegistration = {
      id: `pr-${Date.now()}`,
      code_used: regCode.code,
      club_id: regCode.club_id,
      category_id: regCode.category_id,
      full_name: fullName.trim(),
      dni: dni.trim(),
      birth_date: birthDate,
      primary_position: position,
      photo_url: null,
      apto_medico_url: null,
      tutor_full_name: tutorName.trim(),
      tutor_dni: tutorDni.trim(),
      tutor_whatsapp: tutorWhatsapp.trim(),
      tutor_email: tutorEmail.trim() || null,
      tutor_relation: tutorRelation,
      status: 'pending',
      duplicate_of_player_id: dupPlayer?.id ?? null,
      duplicate_reason: dupPlayer ? 'dni_match' : null,
      reviewed_by: null,
      reviewed_at: null,
      rejection_reason: null,
      created_at: new Date().toISOString(),
    }
    addPendingRegistration(newPending)
    // incrementar uso del código
    const codes = getAllRegistrationCodes()
    const cur = codes.find(c => c.id === regCode.id)
    if (cur) updateRegistrationCode(regCode.id, { current_uses: cur.current_uses + 1 })

    setSubmitting(false)
    setStep('success')
  }

  // ── Estado: código inválido ──
  if (!regCode || !validation.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full text-center">
          <AlertCircle size={40} className="mx-auto text-red-500 mb-2" />
          <h1 className="text-lg font-bold mb-1">Código no disponible</h1>
          <p className="text-sm text-muted-foreground">
            {validation.reason ?? 'Este link de inscripción no es válido. Pedile al club uno nuevo.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Estado: éxito ──
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-sm w-full text-center">
          <CheckCircle2 size={48} className="mx-auto text-green-600 mb-2" />
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-barlow)' }}>
            ¡Inscripción enviada!
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Tu inscripción quedó <strong>pendiente de revisión</strong>. El club te va a contactar por WhatsApp al{' '}
            <strong>{tutorWhatsapp}</strong> cuando esté aprobada.
          </p>
          <div className="text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
            <p className="font-semibold mb-1">Resumen</p>
            <p>{fullName} · DNI {dni}</p>
            <p>{club?.name} · Categoría {category?.name}</p>
          </div>
        </div>
      </div>
    )
  }

  const primary = club?.primary_color ?? '#00843D'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del club */}
      <div className="text-white p-4" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)` }}>
        <div className="flex items-center gap-3 max-w-md mx-auto">
          {club?.logo_url ? (
            <Image src={club.logo_url} alt={club.name} width={48} height={48} className="object-contain" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              {club?.short_name.slice(0, 3).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider opacity-80">Inscripción</p>
            <p className="text-base font-bold leading-tight truncate" style={{ fontFamily: 'var(--font-barlow)' }}>
              {club?.name}
            </p>
            <p className="text-xs opacity-90">Categoría {category?.name}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4 space-y-4 pb-12">
        {/* Datos del chico */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-barlow)', color: primary }}>
            Datos del jugador
          </h2>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nombre y apellido *</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Ej: Tomás Mendoza"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">DNI *</label>
              <input
                type="text" inputMode="numeric" value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="60123456"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Fecha nac. *</label>
              <input
                type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Posición preferida</label>
            <select
              value={position} onChange={e => setPosition(e.target.value as Position)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="arquero">Arquero</option>
              <option value="defensor">Defensor</option>
              <option value="mediocampista">Mediocampista</option>
              <option value="delantero">Delantero</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-xs text-muted-foreground cursor-pointer hover:bg-gray-50">
              <Upload size={16} />
              Foto
              <input type="file" accept="image/*" capture="user" className="hidden" />
            </label>
            <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-xs text-muted-foreground cursor-pointer hover:bg-gray-50">
              <Upload size={16} />
              Apto médico
              <input type="file" accept="application/pdf,image/*" className="hidden" />
            </label>
          </div>
        </section>

        {/* Datos del tutor */}
        <section className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-barlow)', color: primary }}>
            Datos del tutor
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">DNI tutor *</label>
              <input
                type="text" inputMode="numeric" value={tutorDni} onChange={e => setTutorDni(e.target.value.replace(/\D/g, ''))}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="28456789"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Relación</label>
              <select
                value={tutorRelation} onChange={e => setTutorRelation(e.target.value as TutorRelation)}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value="padre">Padre</option>
                <option value="madre">Madre</option>
                <option value="tutor">Tutor</option>
                <option value="abuelo">Abuelo/a</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Nombre y apellido *</label>
            <input
              type="text" value={tutorName} onChange={e => setTutorName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Ej: Carlos Mendoza"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">WhatsApp *</label>
            <input
              type="tel" inputMode="tel" value={tutorWhatsapp} onChange={e => setTutorWhatsapp(e.target.value.replace(/[^\d]/g, ''))}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="1145678901"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Email (opcional)</label>
            <input
              type="email" value={tutorEmail} onChange={e => setTutorEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="tunombre@gmail.com"
            />
          </div>
        </section>

        {errorMsg && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 text-center">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl text-white font-bold text-sm uppercase tracking-wider disabled:opacity-50"
          style={{ fontFamily: 'var(--font-barlow)', backgroundColor: primary }}
        >
          {submitting ? 'Enviando...' : 'Enviar inscripción'}
        </button>

        <p className="text-[11px] text-muted-foreground text-center">
          Tu inscripción queda pendiente hasta que el club la apruebe.
        </p>
      </form>
    </div>
  )
}
