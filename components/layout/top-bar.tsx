'use client'

import { ClubSwitcher } from './club-switcher'

export function TopBar() {
  return (
    <div className="sticky top-0 z-20 bg-white border-b px-3 py-2 flex items-center justify-between">
      <ClubSwitcher />
    </div>
  )
}
