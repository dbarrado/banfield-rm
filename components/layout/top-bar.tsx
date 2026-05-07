'use client'

import { useState } from 'react'
import { ClubSwitcher } from './club-switcher'
import { useActiveRole, ROLE_LABELS, type ActiveRole } from '@/lib/use-role'
import { ChevronDown, Check } from 'lucide-react'

export function TopBar() {
  const [activeRole, setActiveRole] = useActiveRole()
  const [open, setOpen] = useState(false)
  const role = ROLE_LABELS[activeRole]

  return (
    <div className="sticky top-0 z-20 bg-white border-b px-3 py-2 flex items-center justify-between gap-2">
      <ClubSwitcher />

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white hover:bg-gray-50"
        >
          <span className="text-sm">{role.emoji}</span>
          <span className="text-xs font-bold hidden sm:inline">{role.label}</span>
          <ChevronDown size={11} className="text-gray-500" />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <div className="absolute top-full right-0 mt-1 w-56 rounded-lg shadow-lg border bg-white z-40 overflow-hidden">
              <div className="p-2 border-b bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cambiar rol</p>
              </div>
              <div>
                {(Object.entries(ROLE_LABELS) as [ActiveRole, typeof role][]).map(([key, info]) => {
                  const isCurrent = key === activeRole
                  return (
                    <button
                      key={key}
                      onClick={() => { if (!isCurrent) setActiveRole(key); setOpen(false); }}
                      className={`w-full flex items-center gap-2 p-2.5 text-left hover:bg-gray-50 transition-colors ${isCurrent ? 'bg-gray-50' : ''}`}
                    >
                      <span className="text-lg flex-shrink-0">{info.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{info.description}</p>
                      </div>
                      {isCurrent && <Check size={14} className="text-green-600 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
              <div className="p-2 border-t bg-gray-50 text-[10px] text-muted-foreground">
                El menú se adapta a lo que más usa cada rol
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
