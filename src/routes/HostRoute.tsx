import type { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { FantasyBadge, FantasyButton, FantasyFog, FantasyForest, FantasyInput, FantasyPanel, CountdownTimer, CompactList, ParchmentBox } from '../components/fantasy'
import {
  archiveRoom,
  createOrLoadRoom,
  getRecentGameEvents,
  getRoomPlayers,
  logGameEvent,
  resetRoom,
  saveGameSnapshot,
  setRoomHostPin,
  syncRoomPlayersFromState,
} from '../lib/database'
import {
  advanceToDay,
  advanceToNight,
  applyDayVote,
  applySeerInspect,
  applyNightTarget,
  createInitialGame,
  createWaitingGame,
  endGame,
  killPlayer,
  openVoting,
  resolveDayVote,
  revivePlayer,
  setTimer,
  startGame,
} from '../lib/game-engine'
import type { GameState, PlayerActionBroadcast, RoomPlayerRow, TickerEventBroadcast } from '../lib/game-types'
import { hashHostPin, isValidHostPin } from '../lib/host-pin'
import { normalizeRoomCode } from '../lib/room-code'
import { broadcastAudioCue, broadcastGameState, broadcastPlayerState, broadcastPublicState, broadcastTicker, createRoomChannel } from '../lib/realtime'
import { clearHostSession, loadHostSession, saveHostSession } from '../lib/storage'
import { hasSupabaseConfig } from '../lib/supabase'
import { useLiveTimer } from '../hooks/useLiveTimer'
import { toPlayerPrivateState, toPublicGameState } from '../lib/state-views'

type PresenceEntry = { screen?: string; name?: string; online_at?: string }

export function HostRoute() {
  const [roomInput, setRoomInput] = useState('VILLA')
  const [roomCode, setRoomCode] = useState('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [players, setPlayers] = useState<RoomPlayerRow[]>([])
  const [presence, setPresence] = useState<PresenceEntry[]>([])
  const [ticker, setTicker] = useState<TickerEventBroadcast[]>([])
  const [message, setMessage] = useState('')
  const [timerInput, setTimerInput] = useState(180)
  const [pinInput, setPinInput] = useState('')
  const [hostUnlocked, setHostUnlocked] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)
  const [overridePlayer, setOverridePlayer] = useState('')
  const [actionPending, setActionPending] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef<GameState | null>(null)
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timerLeft = useLiveTimer(gameState)

  function showMessage(text: string) {
    setMessage(text)
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    messageTimerRef.current = setTimeout(() => setMessage(''), 5000)
  }

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    const saved = loadHostSession()
    if (saved?.room_code) {
      setRoomInput(saved.room_code)
      void loadRoom(saved.room_code, saved.host_pin_hash)
    }

    return () => {
      channelRef.current?.unsubscribe()
    }
  }, [])

  async function loadRoom(code = normalizeRoomCode(roomInput), knownPinHash?: string) {
    setActionPending(true)
    try {
      if (!code) return
      const pinHash = pinInput ? await hashHostPin(code, pinInput) : knownPinHash
      let room = await createOrLoadRoom(code)

      if (!room.host_pin_hash && pinInput && isValidHostPin(pinInput)) {
        room = await setRoomHostPin(code, pinHash!)
      }

      if (room.host_pin_hash) {
        if (pinHash !== room.host_pin_hash) {
          setHostUnlocked(false)
          showMessage('Host PIN required or incorrect.')
          return
        }
        saveHostSession({ room_code: code, host_pin_hash: room.host_pin_hash, host_claim_token: room.host_claim_token ?? undefined })
      } else if (pinInput && !isValidHostPin(pinInput)) {
        showMessage('Use a 6 digit host PIN or leave blank for legacy room unlock.')
        return
      } else {
        saveHostSession({ room_code: code, host_pin_hash: pinHash, host_claim_token: room.host_claim_token ?? undefined })
      }

      const roomPlayers = await getRoomPlayers(code)
      const recentEvents = await getRecentGameEvents(code)
      setRoomCode(code)
      setRoomInput(code)
      setPlayers(roomPlayers)
      setGameState(room.game_state ?? createInitialGame(code))
      setTicker(recentEvents.map((event) => ({
        type: 'ticker_event',
        room_code: code,
        message: humanTickerMessage(event.event_type, event.actor),
        severity: 'info',
        sent_at: event.created_at,
      })))
      setHostUnlocked(true)
      showMessage(`Loaded room ${code}`)
      subscribe(code, room.game_state ?? createInitialGame(code))
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to load room')
    } finally {
      setActionPending(false)
    }
  }

  function subscribe(code: string, initialState: GameState) {
    channelRef.current?.unsubscribe()
    const channel = createRoomChannel(code, { screen: 'host', room_code: code }, {
      onPresence: (state) => {
        setPresence(Object.values(state).flat() as PresenceEntry[])
        void refreshWaitingRoster(code)
      },
      onTickerEvent: (event) => setTicker((items) => [event, ...items].slice(0, 40)),
      onPlayerAction: (action) => void handlePlayerAction(action),
      onStateRequest: (event) => {
        const current = stateRef.current
        if (!current) return
        void broadcastFilteredState(current, event.requester === 'player' ? event.player_name : undefined)
      },
    })
    channelRef.current = channel
    setTimeout(() => void broadcastFilteredState(initialState), 500)
  }

  async function refreshWaitingRoster(code: string) {
    try {
      const roomPlayers = await getRoomPlayers(code)
      setPlayers(roomPlayers)
      const current = stateRef.current
      if (current?.status === 'WAITING') {
        const next = createWaitingGame(code, roomPlayers.map((player) => player.name))
        setGameState(next)
        stateRef.current = next
        await saveGameSnapshot(next)
        await broadcastFilteredState(next)
      }
    } catch {
      // Presence updates are opportunistic; direct room actions still surface errors.
    }
  }

  async function broadcastFilteredState(state: GameState, onlyPlayer?: string) {
    if (!channelRef.current) return
    await broadcastGameState(channelRef.current, state)
    await broadcastPublicState(channelRef.current, toPublicGameState(state))

    const targetPlayers = onlyPlayer
      ? state.players.filter((player) => player.name === onlyPlayer)
      : state.players

    for (const player of targetPlayers) {
      const privateState = toPlayerPrivateState(state, player.name)
      if (privateState) {
        await broadcastPlayerState(channelRef.current, {
          room_code: state.room_code,
          player_name: player.name,
          state: privateState,
        })
      }
    }

    // If a specific player requested state but isn't in the current game
    // (e.g. they joined after the game started, or the game was just restarted),
    // send them a waiting lobby state so they don't hang on the spinner forever.
    if (onlyPlayer && !state.players.find((p) => p.name === onlyPlayer)) {
      const lobbyState = toPlayerPrivateState(
        { ...state, status: 'WAITING', players: [
          ...state.players,
          { name: onlyPlayer, role: 'VILLAGER', is_alive: true, night_action_target: null, day_vote_target: null, inspected_target: null, bodyguard_target: null },
        ]},
        onlyPlayer,
      )
      if (lobbyState && channelRef.current) {
        await broadcastPlayerState(channelRef.current, {
          room_code: state.room_code,
          player_name: onlyPlayer,
          state: { ...lobbyState, status: 'WAITING' },
        })
      }
    }
  }

  async function persistAndBroadcast(nextState: GameState, eventType: string, payload: object = {}) {
    setGameState(nextState)
    stateRef.current = nextState
    await saveGameSnapshot(nextState)
    await syncRoomPlayersFromState(nextState)
    setPlayers(await getRoomPlayers(nextState.room_code))
    await logGameEvent(nextState.room_code, eventType, 'HOST', payload)
    await broadcastFilteredState(nextState)
  }

  async function pushTicker(messageText: string, severity: TickerEventBroadcast['severity'] = 'info') {
    const event = { room_code: roomCode, message: messageText, severity }
    const localEvent: TickerEventBroadcast = { ...event, type: 'ticker_event', sent_at: new Date().toISOString() }
    setTicker((items) => [localEvent, ...items].slice(0, 40))
    if (channelRef.current) await broadcastTicker(channelRef.current, event)
  }

  async function handlePlayerAction(action: PlayerActionBroadcast) {
    const current = stateRef.current
    if (!current || action.room_code !== current.room_code) return

    const next = action.action === 'DAY_VOTE'
      ? applyDayVote(current, action.actor, action.target)
      : action.action === 'SEER_INSPECT'
        ? applySeerInspect(current, action.actor, action.target)
        : applyNightTarget(current, action.actor, action.target)

    await persistAndBroadcast(next, action.action, action)
    const verb = action.action === 'DAY_VOTE' ? 'voted for' : action.action === 'SEER_INSPECT' ? 'inspected' : 'targeted'
    await pushTicker(`${action.actor} ${verb} ${action.target}`)
  }

  async function start() {
    setActionPending(true)
    try {
      if (!roomCode) return
      const roomPlayers = await getRoomPlayers(roomCode)
      const next = startGame(roomCode, roomPlayers.map((player) => player.name))
      await persistAndBroadcast(next, 'GAME_STARTED')
      await pushTicker('Game started. Day phase begins — discuss and deliberate.', 'info')
      if (channelRef.current) await broadcastAudioCue(channelRef.current, { room_code: roomCode, cue: 'NIGHT_AMBIENT_STOP' })
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to start game')
    } finally {
      setActionPending(false)
    }
  }

  async function updateState(label: string, updater: (state: GameState) => GameState, eventType = label) {
    if (!gameState) return
    setActionPending(true)
    try {
      const next = updater(gameState)
      await persistAndBroadcast(next, eventType)
      await pushTicker(label)
    } finally {
      setActionPending(false)
    }
  }

  async function advanceDay() {
    await updateState('Advanced to day phase', advanceToDay, 'PHASE_CHANGED')
    if (channelRef.current && roomCode) await broadcastAudioCue(channelRef.current, { room_code: roomCode, cue: 'WOLF_HOWL' })
  }

  const alivePlayers = gameState?.players.filter((player) => player.is_alive) ?? []
  const controlsDisabled = !hostUnlocked || !gameState
  const primaryAction = getPrimaryHostAction(gameState, players.length, {
    start,
    advanceDay,
    openVotingAction: () => updateState('Voting opened', openVoting, 'PHASE_CHANGED'),
    resolveVoteAction: () => updateState('Vote resolved', resolveDayVote, 'VOTE_RESOLVED'),
    newGameAction: async () => {
      // Re-read players from DB so anyone who joined during the game is included
      setActionPending(true)
      try {
        const roomPlayers = await getRoomPlayers(roomCode)
        const next = startGame(roomCode, roomPlayers.map((player) => player.name))
        await persistAndBroadcast(next, 'GAME_RESTARTED')
        await pushTicker('New ritual begins with all current souls.', 'info')
        if (channelRef.current) await broadcastAudioCue(channelRef.current, { room_code: roomCode, cue: 'NIGHT_AMBIENT_STOP' })
      } catch (error) {
        showMessage(error instanceof Error ? error.message : 'Failed to restart game')
      } finally {
        setActionPending(false)
      }
    },
  })
  const werewolfSummary = gameState ? getWerewolfTargetSummary(gameState) : []
  const voteSummary = gameState ? getVoteSummary(gameState) : []
  const votedPlayers = gameState ? getVotedPlayers(gameState) : []
  const notVotedPlayers = gameState ? getNotVotedPlayers(gameState) : []
  const origin = globalThis.location?.origin ?? ''
  const links = roomCode ? {
    host: `${origin}/host?room=${roomCode}`,
    play: `${origin}/play?room=${roomCode}`,
    tv: `${origin}/tv?room=${roomCode}`,
  } : null

  return (
    <main className="fantasy-shell px-4 py-6 text-slate-100">
      <FantasyFog />
      <FantasyForest />
      <div className="relative z-10 mx-auto max-w-7xl space-y-4">
        {/* Grimoire-styled header with ritual terminology */}
        <section className="fantasy-panel rounded-3xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link className="text-sm text-[#d6a84f]" to="/">Back</Link>
              <h1 className="fantasy-display text-4xl font-black text-[#f8e7bd]">The Grimoire</h1>
              <p className="text-sm text-[#d8c7a3]">The moderator's tome of ritual oversight and arbitration.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <FantasyBadge className="fantasy-rune" data-testid="host-room-code">{roomCode || 'NO RITUAL'}</FantasyBadge>
              {gameState && <FantasyBadge data-testid="host-current-phase">{getPhaseTitle(gameState.status)} · Day {gameState.day_count}</FantasyBadge>}
              {gameState && <FantasyBadge>Apparitions {alivePlayers.length}/{gameState.players.length}</FantasyBadge>}
              {hostUnlocked && <FantasyButton variant="blood" className="rounded-full px-4 py-2 text-sm" onClick={() => { clearHostSession(); setHostUnlocked(false); setMessage('Ritual locked.') }}>Seal</FantasyButton>}
            </div>
          </div>

          {!hasSupabaseConfig && <Notice text="Supabase env vars are missing. Add .env.local from .env.example before using realtime/database features." />}

          {(!roomCode || !hostUnlocked) && <RoomSetupPanel roomInput={roomInput} pinInput={pinInput} message={message} onRoomInput={setRoomInput} onPinInput={setPinInput} onLoad={() => void loadRoom()} actionPending={actionPending} />}
          {message && <p className="mt-3 text-sm text-amber-200">{message}</p>}
        </section>

        {gameState && hostUnlocked && <div data-testid="host-phase-area">
          <CurrentPhasePanel
            gameState={gameState}
            primaryAction={primaryAction}
            playersCount={players.length}
            werewolfSummary={werewolfSummary}
            voteSummary={voteSummary}
            votedPlayers={votedPlayers}
            notVotedPlayers={notVotedPlayers}
            links={links}
            linksOpen={linksOpen}
            setLinksOpen={setLinksOpen}
            timerLeft={timerLeft}
            actionPending={actionPending}
          />
        </div>}

        {roomCode && hostUnlocked && <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <VillageLedgerPanel gameState={gameState} players={players} />
          <TickerPanel ticker={ticker} />
        </div>}

        {roomCode && hostUnlocked && <AdvancedToolsPanel
          open={advancedOpen}
          setOpen={setAdvancedOpen}
          gameState={gameState}
          players={players}
          presence={presence}
          links={links}
          timerInput={timerInput}
          setTimerInput={setTimerInput}
          overridePlayer={overridePlayer}
          setOverridePlayer={setOverridePlayer}
          controlsDisabled={controlsDisabled}
          onSetTimer={() => updateState(`Timer set to ${timerInput}s`, (state) => setTimer(state, timerInput), 'TIMER_SET')}
          onAdvanceNight={() => updateState('Advanced to night phase', advanceToNight, 'PHASE_CHANGED')}
          onRebroadcast={() => {
            if (gameState) return broadcastFilteredState(gameState)
          }}
          onVillagersWin={() => updateState('Villagers win', (state) => endGame(state, 'VILLAGERS'), 'GAME_ENDED')}
          onWerewolvesWin={() => updateState('Werewolves win', (state) => endGame(state, 'WEREWOLVES'), 'GAME_ENDED')}
          onArchive={async () => { if (roomCode) { await archiveRoom(roomCode); setMessage('Room archived.') } }}
          onReset={async () => {
            if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 5000); return }
            setResetConfirm(false)
            if (roomCode) { const next = await resetRoom(roomCode); setGameState(next); setPlayers([]); await broadcastFilteredState(next) }
          }}
          resetConfirm={resetConfirm}
          onKill={() => {
            if (overridePlayer) return updateState(`Killed ${overridePlayer}`, (state) => killPlayer(state, overridePlayer), 'PLAYER_KILLED')
          }}
          onRevive={() => {
            if (overridePlayer) return updateState(`Revived ${overridePlayer}`, (state) => revivePlayer(state, overridePlayer), 'PLAYER_REVIVED')
          }}
        />}
      </div>
    </main>
  )
}

function Panel({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
  return <FantasyPanel title={title} className={className}>{children}</FantasyPanel>
}

function RoomSetupPanel({ roomInput, pinInput, onRoomInput, onPinInput, onLoad, actionPending }: { roomInput: string; pinInput: string; message: string; onRoomInput: (value: string) => void; onPinInput: (value: string) => void; onLoad: () => void; actionPending: boolean }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <FantasyInput data-testid="host-room-input" className="uppercase" value={roomInput} onChange={(value) => onRoomInput(normalizeRoomCode(value))} placeholder="RITUAL CODE" />
      <FantasyInput data-testid="host-pin-input" value={pinInput} onChange={(value) => onPinInput(value.replace(/\D/g, '').slice(0, 6))} placeholder="Seal PIN optional/required" type="password" />
      <FantasyButton data-testid="host-load-room" onClick={onLoad} disabled={actionPending}>{actionPending ? 'Loading…' : 'Begin Ritual'}</FantasyButton>
    </div>
  )
}

type HostAction = {
  label: string
  disabled: boolean
  disabledReason?: string
  onClick: () => void | Promise<void>
}

function CurrentPhasePanel({ gameState, primaryAction, playersCount, werewolfSummary, voteSummary, votedPlayers, notVotedPlayers, links, linksOpen, setLinksOpen, timerLeft, actionPending }: { gameState: GameState; primaryAction: HostAction | null; playersCount: number; werewolfSummary: Array<{ target: string; votes: number }>; voteSummary: Array<{ target: string; votes: number }>; votedPlayers: string[]; notVotedPlayers: string[]; links: { host: string; play: string; tv: string } | null; linksOpen: boolean; setLinksOpen: (open: boolean) => void; timerLeft: number; actionPending: boolean }) {
  return (
    <Panel title="Current Phase" className="min-h-full">
      <div className="space-y-5">
        <div>
          <p className="fantasy-rune text-sm text-[#d6a84f]">{getPhaseTitle(gameState.status)}</p>
          <h2 className="fantasy-display text-4xl font-black text-[#f8e7bd]">{getPhaseHeading(gameState.status)}</h2>
          <p className="mt-2 text-sm text-[#d8c7a3]">{getPhaseDescription(gameState.status)}</p>
        </div>

        {/* Single primary action - prominently displayed */}
        {primaryAction && <div className="rounded-[1.5rem] border border-[#d6a84f]/20 bg-black/25 p-4">
          <FantasyButton data-testid="host-primary-action" className="w-full text-lg" variant={primaryAction.label.includes('Resolve') ? 'blood' : 'gold'} disabled={primaryAction.disabled || actionPending} onClick={primaryAction.onClick}>{actionPending ? `${primaryAction.label}…` : primaryAction.label}</FantasyButton>
          {primaryAction.disabledReason && <p className="mt-2 text-center text-sm text-amber-200">{primaryAction.disabledReason}</p>}
        </div>}

        {/* Hourglass timer display */}
        {gameState.timer_duration && gameState.timer_duration > 0 && gameState.status !== 'WAITING' && gameState.status !== 'GAME_OVER' && (
          <div className="flex justify-center">
            <CountdownTimer seconds={timerLeft} total={gameState.timer_duration} />
          </div>
        )}

        {gameState.status === 'WAITING' && <div className="grid gap-3 md:grid-cols-[auto_1fr]">
          {links && <div className="rounded-2xl bg-white p-2"><QRCodeSVG value={links.play} size={120} /></div>}
          <div className="space-y-2 text-sm">
            <Stat label="Souls Gathered" value={`${playersCount}/4 minimum`} />
          </div>
        </div>}

        {/* Collapsed summoning links by default (progressive disclosure) */}
        {gameState.status === 'WAITING' && links && <div className="space-y-2">
          <button
            type="button"
            data-testid="host-links-toggle"
            className="w-full rounded-2xl border border-[#d6a84f]/25 bg-black/30 px-4 py-3 text-left font-bold text-[#f8e7bd]"
            onClick={() => setLinksOpen(!linksOpen)}
          >
            {linksOpen ? '▼ Hide Summoning Links' : '▶ Show Summoning Links'}
          </button>
          {linksOpen && <div className="space-y-2" data-testid="host-summoning-links">
            <CopyLink label="Player Scroll" value={links.play} />
            <CopyLink label="Omen Board" value={links.tv} />
          </div>}
        </div>}

        {gameState.status === 'NIGHT_PHASE' && (() => {
          const wolfsDone = werewolfSummary.length > 0
          const seer = gameState.players.find(p => p.role === 'SEER' && p.is_alive)
          const backupSeer = gameState.players.find(p => p.role === 'BACKUP_SEER' && p.is_alive && gameState.meta.backup_seer_unlocked)
          const activeSeer = seer ?? backupSeer
          const seerDone = !activeSeer || !!activeSeer.inspected_target
          const bodyguard = gameState.players.find(p => p.role === 'BODYGUARD' && p.is_alive)
          const bodyguardDone = !bodyguard || !!bodyguard.bodyguard_target
          return (
            <div className="space-y-2">
              <SummaryList title="Hunt targets" empty="No targets chosen yet." items={werewolfSummary.map((item) => `${item.target}: ${item.votes}`)} />
              <div className="rounded-2xl bg-black/25 p-3 text-sm">
                <p className="font-bold text-[#f8e7bd] mb-1">Night actions</p>
                <p className={wolfsDone ? 'text-emerald-400' : 'text-amber-300'}>Wolves: {wolfsDone ? '✓ Target chosen' : '⏳ Awaiting...'}</p>
                {activeSeer && <p className={seerDone ? 'text-emerald-400' : 'text-amber-300'}>Seer: {seerDone ? '✓ Inspected' : '⏳ Awaiting...'}</p>}
                {bodyguard && <p className={bodyguardDone ? 'text-emerald-400' : 'text-amber-300'}>Bodyguard: {bodyguardDone ? '✓ Protecting' : '⏳ Awaiting...'}</p>}
              </div>
            </div>
          )
        })()}
        {gameState.status === 'DAY_PHASE' && <Stat label="Last fallen" value={gameState.last_killed ?? 'None'} />}
        {gameState.status === 'VOTING_PHASE' && <div className="grid gap-3 md:grid-cols-2">
          <SummaryList title="Tribunal votes" empty="No votes yet." items={voteSummary.map((item) => `${item.target}: ${item.votes}`)} />
          <SummaryList title="Awaiting judgment" empty="All have spoken." items={notVotedPlayers} />
          <SummaryList title="Judgment cast" empty="No votes submitted." items={votedPlayers} />
        </div>}
        {gameState.status === 'GAME_OVER' && <Stat label="Victor" value={gameState.winner ?? '-'} />}
      </div>
    </Panel>
  )
}

function humanRole(role: string | null | undefined): string {
  switch (role) {
    case 'ALPHA_WOLF': return 'Alpha Wolf'
    case 'WEREWOLF': return 'Werewolf'
    case 'SEER': return 'Seer'
    case 'BACKUP_SEER': return 'Backup Seer'
    case 'MASON': return 'Mason'
    case 'BODYGUARD': return 'Bodyguard'
    case 'VILLAGER': return 'Villager'
    default: return 'Waiting'
  }
}

/**
 * Village Ledger panel - uses CompactList component with parchment styling.
 * Validates: Requirements 2.4, 5.4 (Property 9)
 */
function VillageLedgerPanel({ gameState, players }: { gameState: GameState | null; players: RoomPlayerRow[] }) {
  const items = players.map((player) => {
    const statePlayer = gameState?.players.find((item) => item.name === player.name)
    const isAlive = statePlayer?.is_alive ?? player.is_alive
    // Prefer role from live game state; fall back to DB row; show 'Waiting' if not yet assigned
    const role = statePlayer?.role ?? player.role
    const roleLabel = role ? humanRole(role) : (gameState?.status === 'WAITING' ? 'Waiting' : 'Unassigned')
    return {
      id: player.id,
      label: player.name,
      subtitle: roleLabel,
      status: isAlive ? 'alive' as const : 'dead' as const,
    }
  })

  return (
    <Panel title="Village Ledger">
      <ParchmentBox className="p-3">
        {items.length > 0 ? (
          <CompactList items={items} variant="roster" data-testid="host-village-ledger" />
        ) : (
          <p className="text-sm text-slate-400">No souls have answered the summons. Await their arrival.</p>
        )}
      </ParchmentBox>
    </Panel>
  )
}

function TickerPanel({ ticker }: { ticker: TickerEventBroadcast[] }) {
  return (
    <Panel title="Omen Log">
      <div className="space-y-2" data-testid="host-ticker">
        {ticker.slice(0, 8).map((item, index) => <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm" key={`${item.sent_at}-${index}`}>{item.message}</div>)}
        {!ticker.length && <p className="text-sm text-slate-400">No omens recorded.</p>}
      </div>
    </Panel>
  )
}

/**
 * Advanced Tools Panel - collapsed by default (progressive disclosure).
 * Raw JSON is hidden in the collapsed section.
 * Validates: Requirements 2.3, 5.1, 5.2 (Properties 1, 10)
 */
function AdvancedToolsPanel({ open, setOpen, gameState, players, presence, links, timerInput, setTimerInput, overridePlayer, setOverridePlayer, controlsDisabled, onSetTimer, onAdvanceNight, onRebroadcast, onVillagersWin, onWerewolvesWin, onArchive, onReset, onKill, onRevive, resetConfirm }: { open: boolean; setOpen: (open: boolean) => void; gameState: GameState | null; players: RoomPlayerRow[]; presence: PresenceEntry[]; links: { host: string; play: string; tv: string } | null; timerInput: number; setTimerInput: (value: number) => void; overridePlayer: string; setOverridePlayer: (value: string) => void; controlsDisabled: boolean; onSetTimer: () => void | Promise<void>; onAdvanceNight: () => void | Promise<void>; onRebroadcast: () => void | Promise<void>; onVillagersWin: () => void | Promise<void>; onWerewolvesWin: () => void | Promise<void>; onArchive: () => void | Promise<void>; onReset: () => void | Promise<void>; onKill: () => void | Promise<void>; onRevive: () => void | Promise<void>; resetConfirm: boolean }) {
  return (
    <Panel title="Forbidden Arts">
      <button data-testid="host-advanced-toggle" className="w-full rounded-2xl border border-[#d6a84f]/25 bg-black/30 px-4 py-3 text-left font-bold text-[#f8e7bd]" onClick={() => setOpen(!open)}>{open ? '▼ Seal forbidden arts' : '▶ Unseal forbidden arts'}</button>
      {open && <div className="mt-4 grid gap-4 lg:grid-cols-2" data-testid="host-advanced-tools">
        <div className="space-y-3">
          <h3 className="font-bold text-[#f8e7bd]">Emergency Rituals</h3>
          <select data-testid="host-override-player" className="fantasy-input w-full rounded-2xl px-4 py-3" value={overridePlayer} onChange={(event) => setOverridePlayer(event.target.value)}>
            <option value="">Select soul</option>
            {players.map((player) => <option key={player.id} value={player.name}>{player.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2"><ControlButton testId="host-kill-player" label="Banish Soul" onClick={onKill} disabled={controlsDisabled || !overridePlayer} /><ControlButton testId="host-revive-player" label="Restore Soul" onClick={onRevive} disabled={controlsDisabled || !overridePlayer} /></div>
          <div className="flex gap-2"><input className="fantasy-input w-full rounded-2xl px-4 py-3" type="number" value={timerInput} onChange={(event) => setTimerInput(Number(event.target.value))} /><FantasyButton disabled={controlsDisabled} onClick={onSetTimer}>Set Hourglass</FantasyButton></div>
          <div className="grid grid-cols-2 gap-2"><ControlButton label="Villagers Prevail" onClick={onVillagersWin} disabled={controlsDisabled} /><ControlButton label="Wolves Prevail" onClick={onWerewolvesWin} disabled={controlsDisabled} /></div>
          <div className="grid grid-cols-2 gap-2"><ControlButton label="Return to Night" onClick={onAdvanceNight} disabled={controlsDisabled} /><ControlButton testId="host-rebroadcast" label="Resend Omens" onClick={onRebroadcast} disabled={controlsDisabled} /></div>
          <div className="grid grid-cols-2 gap-2"><ControlButton label="Archive Ritual" onClick={onArchive} disabled={controlsDisabled} /><ControlButton testId="host-reset-room" label={resetConfirm ? "Confirm Dissolve?" : "Dissolve Ritual"} onClick={onReset} disabled={!gameState} /></div>
        </div>
        <div className="space-y-3">
          <h3 className="font-bold text-[#f8e7bd]">Apparitions</h3>
          <div className="max-h-40 space-y-2 overflow-auto">{presence.map((entry, index) => <div className="rounded-2xl bg-white/[0.04] px-3 py-2 text-sm" key={`${entry.screen}-${entry.name}-${index}`}>{entry.screen}{entry.name ? ` · ${entry.name}` : ''}</div>)}</div>
          {links && <div className="grid gap-3 md:grid-cols-[auto_1fr]"><div className="rounded-2xl bg-white p-2"><QRCodeSVG value={links.play} size={110} /></div><div className="space-y-2 text-sm"><CopyLink label="Player Scroll" value={links.play} /><CopyLink label="Omen Board" value={links.tv} /><CopyLink label="Grimoire" value={links.host} /></div></div>}
          {/* Raw JSON hidden in collapsed section - validates Property 10 */}
          <details className="group">
            <summary className="cursor-pointer rounded-2xl border border-[#d6a84f]/25 bg-black/30 px-4 py-3 text-sm font-bold text-[#f8e7bd]">▶ View ritual state (raw)</summary>
            <pre className="mt-2 max-h-52 overflow-auto rounded-2xl bg-black/50 p-3 text-xs text-slate-300" data-testid="host-raw-json">{JSON.stringify(gameState, null, 2)}</pre>
          </details>
        </div>
      </div>}
    </Panel>
  )
}

function SummaryList({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div className="rounded-2xl bg-black/25 p-3"><h3 className="mb-2 font-bold text-[#f8e7bd]">{title}</h3>{items.length ? <div className="space-y-1 text-sm text-slate-200">{items.map((item) => <p key={item}>{item}</p>)}</div> : <p className="text-sm text-slate-400">{empty}</p>}</div>
}

function ControlButton({ label, onClick, disabled, testId }: { label: string; onClick: () => void | Promise<void>; disabled?: boolean; testId?: string }) {
  const danger = /Vote|Kill|Werewolves|Reset|Archive/.test(label)
  return <FantasyButton data-testid={testId} variant={danger ? 'blood' : 'gold'} disabled={disabled} onClick={onClick}>{label}</FantasyButton>
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between rounded-2xl bg-black/30 px-3 py-2"><span className="text-slate-400">{label}</span><span className="font-bold text-white">{value}</span></div>
}

function Notice({ text }: { text: string }) {
  return <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">{text}</div>
}

function CopyLink({ label, value }: { label: string; value: string }) {
  return <button className="flex w-full items-center justify-between gap-3 rounded-2xl bg-black/30 px-4 py-3 text-left min-h-11" onClick={() => void navigator.clipboard?.writeText(value)}><span className="font-bold text-white">{label}</span><span className="truncate text-cyan-200">{value}</span></button>
}

function getPrimaryHostAction(state: GameState | null, playerCount: number, actions: { start: () => Promise<void>; advanceDay: () => Promise<void>; openVotingAction: () => Promise<void>; resolveVoteAction: () => Promise<void>; newGameAction: () => Promise<void> }): HostAction | null {
  if (!state) return null

  if (state.status === 'WAITING') {
    return {
      label: 'Begin the Ritual',
      disabled: playerCount < 4 || playerCount > 15,
      disabledReason: playerCount < 4 ? 'Need at least 4 souls gathered.' : playerCount > 15 ? 'Maximum 15 souls.' : undefined,
      onClick: actions.start,
    }
  }

  if (state.status === 'NIGHT_PHASE') {
    return { label: 'Dawn Breaks', disabled: false, onClick: actions.advanceDay }
  }

  if (state.status === 'DAY_PHASE') {
    return { label: 'Convene Tribunal', disabled: false, onClick: actions.openVotingAction }
  }

  if (state.status === 'VOTING_PHASE') {
    return { label: 'Resolve Judgment', disabled: false, onClick: actions.resolveVoteAction }
  }

  if (state.status === 'GAME_OVER') {
    return { label: 'Begin New Ritual', disabled: !state.players.length, onClick: actions.newGameAction }
  }

  return null
}

function getPhaseHeading(status: GameState['status']) {
  if (status === 'WAITING') return 'Gathering Souls'
  if (status === 'NIGHT_PHASE') return 'The Hunt Begins'
  if (status === 'DAY_PHASE') return 'The Village Awakens'
  if (status === 'VOTING_PHASE') return 'The Tribunal Convenes'
  if (status === 'GAME_OVER') return 'The Prophecy Fulfilled'
  return status
}

function getPhaseTitle(status: GameState['status']) {
  if (status === 'WAITING') return 'Gathering'
  if (status === 'NIGHT_PHASE') return 'Night'
  if (status === 'DAY_PHASE') return 'Day'
  if (status === 'VOTING_PHASE') return 'Tribunal'
  if (status === 'GAME_OVER') return 'Ended'
  return status
}

function getPhaseDescription(status: GameState['status']) {
  if (status === 'WAITING') return 'Awaiting souls to answer the summons. Share the player scroll to gather participants.'
  if (status === 'NIGHT_PHASE') return 'Darkness blankets the village. Watch the hunt unfold, then call the dawn when ready.'
  if (status === 'DAY_PHASE') return 'Light returns. Guide the discussion and convene the tribunal when judgment is due.'
  if (status === 'VOTING_PHASE') return 'The tribunal gathers. Track the votes and pronounce judgment when complete.'
  if (status === 'GAME_OVER') return 'The ritual concludes. Review the outcome, then begin anew or seal the grimoire.'
  return ''
}

function getWerewolfTargetSummary(state: GameState) {
  const counts = new Map<string, number>()

  for (const player of state.players) {
    if ((player.role === 'ALPHA_WOLF' || player.role === 'WEREWOLF') && player.is_alive && player.night_action_target) {
      counts.set(player.night_action_target, (counts.get(player.night_action_target) ?? 0) + 1)
    }
  }

  return sortCounts(counts)
}

function getVoteSummary(state: GameState) {
  const counts = new Map<string, number>()

  for (const player of state.players) {
    if (player.is_alive && player.day_vote_target) {
      counts.set(player.day_vote_target, (counts.get(player.day_vote_target) ?? 0) + 1)
    }
  }

  return sortCounts(counts)
}

function getVotedPlayers(state: GameState) {
  return state.players.filter((player) => player.is_alive && player.day_vote_target).map((player) => player.name)
}

function getNotVotedPlayers(state: GameState) {
  return state.players.filter((player) => player.is_alive && !player.day_vote_target).map((player) => player.name)
}

function sortCounts(counts: Map<string, number>) {
  return [...counts.entries()]
    .map(([target, votes]) => ({ target, votes }))
    .sort((a, b) => b.votes - a.votes || a.target.localeCompare(b.target))
}

function humanTickerMessage(eventType: string, actor: string | null): string {
  const by = actor ? ` · ${actor}` : ''
  switch (eventType) {
    case 'GAME_STARTED': return '🌅 The ritual begins'
    case 'PHASE_CHANGED': return `🔄 Phase changed${by}`
    case 'VOTE_RESOLVED': return `⚖️ Judgment resolved${by}`
    case 'GAME_ENDED': return `🏁 The ritual ends${by}`
    case 'GAME_RESTARTED': return '🔁 New ritual begins'
    case 'PLAYER_JOINED': return `👤 ${actor ?? 'Someone'} joined`
    case 'PLAYER_KILLED': return `💀 ${actor ?? 'Someone'} was banished`
    case 'PLAYER_REVIVED': return `✨ ${actor ?? 'Someone'} was restored`
    case 'TIMER_SET': return `⏳ Hourglass set${by}`
    case 'ROOM_RESET': return '🗑️ Ritual dissolved'
    case 'NIGHT_TARGET': return `🐺 Wolf targeted${by}`
    case 'SEER_INSPECT': return `👁 Seer inspected${by}`
    case 'DAY_VOTE': return `🗳️ Vote cast${by}`
    default: return `${eventType.replace(/_/g, ' ').toLowerCase()}${by}`
  }
}
