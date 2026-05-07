'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, Building2 } from 'lucide-react'
import { demoClubs, getCurrentClub, setCurrentClub } from '@/lib/clubs'
import type { Club } from '@/types'

export function ClubSwitcher() {
  const [open, setOpen] = useState(false)
  const [club, setClub] = useState<Club | null>(null)

  useEffect(() => {
    setClub(getCurrentClub())
  }, [])

  if (!club) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-50 transition-colors min-w-0"
      >
        <div
          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold"
          style={{ backgroundColor: club.primary_color }}
        >
          {club.logo_url ? (
            <img src={club.logo_url} alt={club.name} className="w-full h-full object-contain" />
          ) : (
            club.short_name.split(' ').map(w => w[0]).join('').slice(0, 2)
          )}
        </div>
        <span className="text-xs font-bold truncate max-w-[100px] md:max-w-[160px]" style={{ color: club.primary_color }}>
          {club.short_name}
        </span>
        <ChevronDown size={12} className="text-gray-500 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 rounded-lg shadow-lg border bg-white z-40 overflow-hidden">
            <div className="p-2 border-b bg-gray-50">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tus clubes</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {demoClubs.map(c => {
                const isCurrent = c.id === club.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (!isCurrent) setCurrentClub(c.id)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center gap-2.5 p-2.5 text-left hover:bg-gray-50 transition-colors ${isCurrent ? 'bg-gray-50' : ''}`}
                  >
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: c.primary_color }}
                    >
                      {c.logo_url ? (
                        <img src={c.logo_url} alt={c.name} className="w-full h-full object-contain" />
                      ) : (
                        c.short_name.split(' ').map(w => w[0]).join('').slice(0, 2)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{c.short_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.city} · {c.total_socios} socios · Plan {c.plan}
                      </p>
                    </div>
                    {isCurrent && <Check size={16} className="text-green-600 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="p-2 border-t bg-gray-50">
              <button className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900">
                <Building2 size={12} /> Agregar club
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
