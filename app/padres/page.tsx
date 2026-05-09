'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileCheck, FileWarning, ChevronRight, LogOut, ArrowLeft, QrCode } from 'lucide-react'
import Link from 'next/link'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'
import { getTutorChildren, demoTutorUsers } from '@/lib/registration'
import { demoClubs } from '@/lib/clubs'
import { demoCategories } from '@/lib/demo-data'
import Image from 'next/image'

// Demo: tutor logueado tu-1 (Carlos Fernández) — tiene hijos cross-club
const DEMO_TUTOR = demoTutorUsers[0]

export default function PortalPadres() {
  const allChildren = getTutorChildren(DEMO_TUTOR.id)

  // Agrupar por club
  const byClub = new Map<string, typeof allChildren>()
  for (const child of allChildren) {
    const clubId = child.club_id ?? 'club-banfield-rm' // sin club_id → legacy Banfield
    if (!byClub.has(clubId)) byClub.set(clubId, [])
    byClub.get(clubId)!.push(child)
  }
  const clubsWithKids = Array.from(byClub.entries())
    .map(([clubId, kids]) => ({
      club: demoClubs.find(c => c.id === clubId) ?? demoClubs[0],
      kids,
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="text-white p-4 pb-8"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard" className="text-white/80 text-xs flex items-center gap-1">
            <ArrowLeft size={12} /> Vista admin
          </Link>
          <button className="text-white/80 text-xs flex items-center gap-1">
            <LogOut size={12} /> Salir
          </button>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider opacity-80">Portal de tutores</p>
          <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-barlow)' }}>
            {DEMO_TUTOR.full_name}
          </p>
          <p className="text-[11px] opacity-80">
            {clubsWithKids.length} {clubsWithKids.length === 1 ? 'club' : 'clubes'} · {allChildren.length}{' '}
            {allChildren.length === 1 ? 'hijo/a' : 'hijos/as'}
          </p>
        </div>
      </div>

      <div className="p-3 space-y-4 -mt-4">
        {clubsWithKids.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No tenés hijos vinculados todavía. Pedile a tu club el código de inscripción.
            </CardContent>
          </Card>
        )}

        {clubsWithKids.map(({ club, kids }) => (
          <div key={club.id} className="space-y-2">
            {/* Header de club */}
            <Card className="border-0 shadow-sm" style={{ borderLeft: `4px solid ${club.primary_color}` }}>
              <CardContent className="p-3 flex items-center gap-3">
                {club.logo_url ? (
                  <Image src={club.logo_url} alt={club.name} width={40} height={40} className="object-contain flex-shrink-0" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                    style={{ backgroundColor: club.primary_color }}
                  >
                    {club.short_name.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate" style={{ fontFamily: 'var(--font-barlow)' }}>
                    {club.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {kids.length} {kids.length === 1 ? 'hijo/a' : 'hijos/as'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Carnets en grid */}
            <div className={`grid gap-2 ${kids.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {kids.map(child => (
                <Link key={`carnet-${child.id}`} href={`/carnet/${child.id}`}>
                  <Card
                    className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${TIRA_COLORS[child.tira] ?? club.primary_color} 0%, ${club.primary_color} 100%)`,
                    }}
                  >
                    <CardContent className="p-3 text-white text-center">
                      <QrCode size={26} className="mx-auto mb-1" />
                      <p className="text-[10px] uppercase tracking-wider opacity-90">Carnet</p>
                      <p className="text-sm font-bold leading-tight mt-0.5" style={{ fontFamily: 'var(--font-barlow)' }}>
                        {child.full_name.split(' ')[0].toUpperCase()}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Lista detallada por hijo */}
            {kids.map(child => {
              const cat = demoCategories.find(c => c.id === child.category_id)
              const initials = child.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
              return (
                <Link key={child.id} href={`/padres/${child.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: TIRA_COLORS[child.tira] ?? club.primary_color }}
                      >
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{child.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Cat. {cat?.name ?? child.category_id}
                          {TIRA_LABELS[child.tira] && (
                            <>
                              {' · '}
                              <span style={{ color: TIRA_COLORS[child.tira] }}>{TIRA_LABELS[child.tira]}</span>
                            </>
                          )}
                        </p>
                        <div className="flex gap-1.5 mt-1">
                          {child.apto_medico_ok ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              <FileCheck size={9} className="mr-0.5" /> Apto OK
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px]">
                              <FileWarning size={9} className="mr-0.5" /> Sin apto
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ))}

        <p className="text-xs text-muted-foreground text-center pt-3">
          Modo demo · Portal de tutores cross-club.
        </p>
      </div>
    </div>
  )
}
