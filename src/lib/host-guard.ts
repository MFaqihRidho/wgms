import type { HostSession, RoomRow } from './game-types'

export function canUseHostControls(room: RoomRow | null, session: HostSession | null) {
  if (!room) return false
  if (!room.host_pin_hash) return true
  return Boolean(
    session?.room_code === room.room_code &&
      session.host_pin_hash === room.host_pin_hash &&
      session.host_claim_token === room.host_claim_token,
  )
}
