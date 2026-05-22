export async function hashHostPin(roomCode: string, pin: string) {
  const input = `${roomCode}:${pin}`
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isValidHostPin(pin: string) {
  return /^\d{6}$/.test(pin)
}
