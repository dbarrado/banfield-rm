import Dexie, { type EntityTable } from 'dexie'

interface OfflineAttendance {
  id: string
  event_id: string
  player_id: string
  status: 'present' | 'absent_justified' | 'absent_unjustified'
  justified_reason: string | null
  registered_by: string | null
  created_at: string
  synced: boolean
}

const db = new Dexie('BanfieldRM') as Dexie & {
  attendance: EntityTable<OfflineAttendance, 'id'>
}

db.version(1).stores({
  attendance: 'id, event_id, player_id, synced',
})

export { db }
export type { OfflineAttendance }
