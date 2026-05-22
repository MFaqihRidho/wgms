import type { HostSession, PlayerSession, TvSession } from './game-types'

const playerKey = 'wgms.player.session'
const hostKey = 'wgms.host.session'
const tvKey = 'wgms.tv.session'

function readJson<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadPlayerSession() {
  return readJson<PlayerSession>(playerKey)
}

export function savePlayerSession(session: PlayerSession) {
  writeJson(playerKey, session)
}

export function clearPlayerSession() {
  localStorage.removeItem(playerKey)
}

export function loadHostSession() {
  return readJson<HostSession>(hostKey)
}

export function saveHostSession(session: HostSession) {
  writeJson(hostKey, session)
}

export function clearHostSession() {
  localStorage.removeItem(hostKey)
}

export function loadTvSession() {
  return readJson<TvSession>(tvKey)
}

export function saveTvSession(session: TvSession) {
  writeJson(tvKey, session)
}
