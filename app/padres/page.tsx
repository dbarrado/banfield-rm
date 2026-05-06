'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileCheck, FileWarning, Receipt, ChevronRight, LogOut, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { demoPlayers } from '@/lib/demo-data'
import { TIRA_LABELS, TIRA_COLORS } from '@/types'
import Image from 'next/image'

// Demo: el "padre" logueado tiene 2 hijos en el club
const DEMO_PARENT_NAME = 'Carlos Fernández'
const DEMO_CHILDREN = [demoPlayers[0], demoPlayers[5]]

export default function PortalPadres() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="text-white p-4 pb-8" style={{ background: 'linear-gradient(135deg, #00843D 0%, #005a2a 100%)' }}>
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard" className="text-white/80 text-xs flex items-center gap-1">
            <ArrowLeft size={12} /> Vista admin
          </Link>
          <button className="text-white/80 text-xs flex items-center gap-1">
            <LogOut size={12} /> Salir
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Image src="/escudo-banfield.png" alt="Banfield" width={48} height={48} className="object-contain" />
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">Portal de padres</p>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-barlow)" }}>{DEMO_PARENT_NAME}</p>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 -mt-4">
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground" style={{ fontFamily: "var(--font-barlow)" }}>
          Mis hijos ({DEMO_CHILDREN.length})
        </p>

        {DEMO_CHILDREN.map(child => {
          const initials = child.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
          return (
            <Link key={child.id} href={`/padres/${child.id}`}>
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: TIRA_COLORS[child.tira] }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{child.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cat. {child.category_id.replace('cat-', '')} · <span style={{ color: TIRA_COLORS[child.tira] }}>{TIRA_LABELS[child.tira]}</span>
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

        <p className="text-xs text-muted-foreground text-center pt-3">
          Modo demo · Esta es una vista propuesta del portal de padres.
        </p>
      </div>
    </div>
  )
}
