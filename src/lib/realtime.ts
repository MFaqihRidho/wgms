import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  AudioCueBroadcast,
  GameState,
  GameStateBroadcast,
  PlayerActionBroadcast,
  PlayerStateBroadcast,
  PresenceIdentity,
  PublicGameState,
  PublicStateBroadcast,
  StateRequestBroadcast,
  TickerEventBroadcast,
} from './game-types'
import { requireSupabase } from './supabase'

type RoomChannelHandlers = {
  onGameState?: (state: GameState) => void
  onPublicState?: (state: PublicGameState) => void
  onPlayerState?: (event: PlayerStateBroadcast) => void
  onStateRequest?: (event: StateRequestBroadcast) => void
  onPlayerAction?: (action: PlayerActionBroadcast) => void
  onTickerEvent?: (event: TickerEventBroadcast) => void
  onAudioCue?: (event: AudioCueBroadcast) => void
  onPresence?: (state: Record<string, unknown[]>) => void
  onStatus?: (status: string) => void
}

export function createRoomChannel(roomCode: string, identity: PresenceIdentity, handlers: RoomChannelHandlers) {
  const client = requireSupabase()
  const channel = client.channel(`wgms:${roomCode}`, {
    config: { broadcast: { self: true }, presence: { key: getPresenceKey(identity) } },
  })

  channel
    .on('broadcast', { event: 'game_state' }, ({ payload }) => {
      const broadcast = payload as GameStateBroadcast
      if (broadcast.type === 'game_state' && broadcast.state.room_code === roomCode) {
        handlers.onGameState?.(broadcast.state)
      }
    })
    .on('broadcast', { event: 'player_action' }, ({ payload }) => {
      const broadcast = payload as PlayerActionBroadcast
      if (broadcast.type === 'player_action' && broadcast.room_code === roomCode) {
        handlers.onPlayerAction?.(broadcast)
      }
    })
    .on('broadcast', { event: 'public_state' }, ({ payload }) => {
      const broadcast = payload as PublicStateBroadcast
      if (broadcast.type === 'public_state' && broadcast.state.room_code === roomCode) {
        handlers.onPublicState?.(broadcast.state)
      }
    })
    .on('broadcast', { event: 'player_state' }, ({ payload }) => {
      const broadcast = payload as PlayerStateBroadcast
      if (broadcast.type === 'player_state' && broadcast.room_code === roomCode) {
        handlers.onPlayerState?.(broadcast)
      }
    })
    .on('broadcast', { event: 'state_request' }, ({ payload }) => {
      const broadcast = payload as StateRequestBroadcast
      if (broadcast.type === 'state_request' && broadcast.room_code === roomCode) {
        handlers.onStateRequest?.(broadcast)
      }
    })
    .on('broadcast', { event: 'ticker_event' }, ({ payload }) => {
      const broadcast = payload as TickerEventBroadcast
      if (broadcast.type === 'ticker_event' && broadcast.room_code === roomCode) {
        handlers.onTickerEvent?.(broadcast)
      }
    })
    .on('broadcast', { event: 'audio_cue' }, ({ payload }) => {
      const broadcast = payload as AudioCueBroadcast
      if (broadcast.type === 'audio_cue' && broadcast.room_code === roomCode) {
        handlers.onAudioCue?.(broadcast)
      }
    })
    .on('presence', { event: 'sync' }, () => {
      handlers.onPresence?.(channel.presenceState())
    })
    .subscribe(async (status) => {
      handlers.onStatus?.(status)
      if (status === 'SUBSCRIBED') {
        await channel.track({ ...identity, online_at: new Date().toISOString() })
      }
    })

  return channel
}

export async function broadcastPublicState(channel: RealtimeChannel, state: PublicGameState) {
  await channel.send({
    type: 'broadcast',
    event: 'public_state',
    payload: { type: 'public_state', state, sent_at: new Date().toISOString() } satisfies PublicStateBroadcast,
  })
}

export async function broadcastPlayerState(channel: RealtimeChannel, event: Omit<PlayerStateBroadcast, 'type' | 'sent_at'>) {
  await channel.send({
    type: 'broadcast',
    event: 'player_state',
    payload: { ...event, type: 'player_state', sent_at: new Date().toISOString() } satisfies PlayerStateBroadcast,
  })
}

export async function broadcastStateRequest(channel: RealtimeChannel, event: Omit<StateRequestBroadcast, 'type' | 'sent_at'>) {
  await channel.send({
    type: 'broadcast',
    event: 'state_request',
    payload: { ...event, type: 'state_request', sent_at: new Date().toISOString() } satisfies StateRequestBroadcast,
  })
}

export async function broadcastGameState(channel: RealtimeChannel, state: GameState) {
  await channel.send({
    type: 'broadcast',
    event: 'game_state',
    payload: { type: 'game_state', state, sent_at: new Date().toISOString() } satisfies GameStateBroadcast,
  })
}

export async function broadcastPlayerAction(channel: RealtimeChannel, action: Omit<PlayerActionBroadcast, 'type' | 'sent_at'>) {
  await channel.send({
    type: 'broadcast',
    event: 'player_action',
    payload: { ...action, type: 'player_action', sent_at: new Date().toISOString() } satisfies PlayerActionBroadcast,
  })
}

export async function broadcastTicker(channel: RealtimeChannel, event: Omit<TickerEventBroadcast, 'type' | 'sent_at'>) {
  await channel.send({
    type: 'broadcast',
    event: 'ticker_event',
    payload: { ...event, type: 'ticker_event', sent_at: new Date().toISOString() } satisfies TickerEventBroadcast,
  })
}

export async function broadcastAudioCue(channel: RealtimeChannel, event: Omit<AudioCueBroadcast, 'type' | 'sent_at'>) {
  await channel.send({
    type: 'broadcast',
    event: 'audio_cue',
    payload: { ...event, type: 'audio_cue', sent_at: new Date().toISOString() } satisfies AudioCueBroadcast,
  })
}

function getPresenceKey(identity: PresenceIdentity) {
  return identity.screen === 'player' ? `player:${identity.name}` : identity.screen
}
