import { canPerformNightAction, getMasonPartners, getSeerResult, isUnlockedBackupSeer } from './game-engine'
import type { GamePlayer, GameState } from './game-types'
import { isWolf } from './role-assignment'

export type PlayerView = {
  player: GamePlayer | null
  roleLabel: string
  statusMessage: string
  validNightTargets: GamePlayer[]
  validVoteTargets: GamePlayer[]
  masonPartners: string[]
  seerResult: 'WARGA' | 'WEREWOLF' | null
  canNightAct: boolean
  isSeerLike: boolean
}

export function getPlayerView(state: GameState | null, playerName: string | null): PlayerView {
  const player = state?.players.find((item) => item.name === playerName) ?? null

  if (!state || !player) {
    return {
      player: null,
      roleLabel: 'UNASSIGNED',
      statusMessage: 'Waiting for host to start or re-broadcast state.',
      validNightTargets: [],
      validVoteTargets: [],
      masonPartners: [],
      seerResult: null,
      canNightAct: false,
      isSeerLike: false,
    }
  }

  const livingTargets = state.players.filter((item) => item.is_alive && item.name !== player.name)
  const isSeerLike = player.role === 'SEER' || isUnlockedBackupSeer(state, player)
  const canNightAct = state.status === 'NIGHT_PHASE' && canPerformNightAction(state, player)
  const validNightTargets = isWolf(player.role)
    ? livingTargets.filter((item) => !isWolf(item.role))
    : isSeerLike
      ? livingTargets
      : []
  const validVoteTargets = state.status === 'VOTING_PHASE' && player.is_alive ? livingTargets : []

  return {
    player,
    roleLabel: player.role,
    statusMessage: getStatusMessage(state, player, canNightAct, isSeerLike),
    validNightTargets,
    validVoteTargets,
    masonPartners: player.role === 'MASON' ? getMasonPartners(state, player.name) : [],
    seerResult: player.inspected_target ? getSeerResult(state, player.inspected_target) : null,
    canNightAct,
    isSeerLike,
  }
}

function getStatusMessage(state: GameState, player: GamePlayer, canNightAct: boolean, isSeerLike: boolean) {
  if (!player.is_alive) return 'You are dead. Stay silent and observe.'
  if (state.status === 'WAITING') return 'Waiting for the host to start the game.'
  if (state.status === 'DAY_PHASE') return `Day discussion. Last killed: ${state.last_killed ?? 'Nobody'}.`
  if (state.status === 'VOTING_PHASE') return 'Cast your final ballot.'
  if (state.status === 'GAME_OVER') return `Game over. Winner: ${state.winner ?? 'Unknown'}.`
  if (canNightAct && isWolf(player.role)) return 'Choose prey with the pack.'
  if (canNightAct && isSeerLike) return 'Inspect one soul.'
  if (player.role === 'BACKUP_SEER') return 'You sleep as a villager until the Seer falls.'
  if (player.role === 'MASON') return 'Remember your lodge. Stay silent at night.'
  return 'You are sleeping. Remain silent...'
}
