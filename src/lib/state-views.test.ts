import { describe, expect, it } from 'vitest'
import type { GameState, PlayerRole } from './game-types'
import { toPlayerPrivateState, toPublicGameState } from './state-views'

describe('state views', () => {
  it('public state excludes hidden role/action fields', () => {
    const publicState = toPublicGameState(withPlayers([
      ['Budi', 'ALPHA_WOLF'],
      ['Alex', 'SEER'],
      ['Sari', 'MASON'],
      ['Dika', 'MASON'],
    ]))

    expect(JSON.stringify(publicState)).not.toContain('ALPHA_WOLF')
    expect(JSON.stringify(publicState)).not.toContain('night_action_target')
    expect(publicState.players[0]).toEqual({ name: 'Budi', is_alive: true })
  })

  it('private state includes only own role', () => {
    const privateState = toPlayerPrivateState(withPlayers([
      ['Budi', 'ALPHA_WOLF'],
      ['Alex', 'SEER'],
      ['Sari', 'VILLAGER'],
      ['Dika', 'VILLAGER'],
    ]), 'Alex')

    expect(privateState?.self.role).toBe('SEER')
    expect(JSON.stringify(privateState?.public_players)).not.toContain('ALPHA_WOLF')
  })

  it('private mason state includes partners', () => {
    const privateState = toPlayerPrivateState(withPlayers([
      ['Budi', 'ALPHA_WOLF'],
      ['Alex', 'MASON'],
      ['Sari', 'MASON'],
      ['Dika', 'MASON'],
    ]), 'Alex')

    expect(privateState?.mason_partners).toEqual(['Sari', 'Dika'])
  })
})

function withPlayers(entries: [string, PlayerRole][]): GameState {
  return {
    room_code: 'TEST',
    status: 'NIGHT_PHASE',
    day_count: 1,
    timer_left: 180,
    timer_duration: 180,
    phase_started_at: new Date().toISOString(),
    last_killed: null,
    winner: null,
    players: entries.map(([name, role]) => ({
      name,
      role,
      is_alive: true,
      night_action_target: null,
      day_vote_target: null,
      inspected_target: null,
    })),
    meta: { backup_seer_unlocked: false, seer_dead_on_day: null },
  }
}
