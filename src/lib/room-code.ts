export function normalizeRoomCode(value: string) {
  return value.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4)
}

export function createSessionToken() {
  return crypto.randomUUID()
}
