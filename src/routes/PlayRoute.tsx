import type { RealtimeChannel } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  AutoDismissMessage,
  CompactList,
  FantasyButton,
  FantasyFog,
  FantasyForest,
  FantasyInput,
  FantasyMoon,
  FantasyPanel,
  ParchmentBox,
  PhaseScene,
  TarotCard,
  getPhaseSceneVariant,
  getTarotCardVariant,
  type CompactItem,
} from '../components/fantasy'
import { createOrLoadRoom, getRoom, joinRoomPlayer } from '../lib/database'
import type { GameStatus, PlayerPrivateState, PlayerSession, PublicPlayer } from '../lib/game-types'
import { createSessionToken, normalizeRoomCode } from '../lib/room-code'
import { broadcastPlayerAction, broadcastStateRequest, createRoomChannel } from '../lib/realtime'
import { clearPlayerSession, loadPlayerSession, savePlayerSession } from '../lib/storage'
import { hasSupabaseConfig } from '../lib/supabase'

// Phase transition overlay labels
function transitionLabel(status: GameStatus): { title: string; subtitle: string } {
  switch (status) {
    case 'NIGHT_PHASE': return { title: 'The Hunt Begins', subtitle: 'Darkness falls upon the village...' }
    case 'DAY_PHASE': return { title: 'The Village Awakens', subtitle: 'Dawn breaks. Seek the truth.' }
    case 'VOTING_PHASE': return { title: 'The Tribunal Convenes', subtitle: 'Justice must be served.' }
    case 'GAME_OVER': return { title: 'Prophecy Fulfilled', subtitle: 'The ritual concludes.' }
    default: return { title: phaseLabel(status), subtitle: '' }
  }
}
function seerResultLabel(result: 'WARGA' | 'WEREWOLF' | null): string {
  if (result === 'WEREWOLF') return 'Werewolf'
  if (result === 'WARGA') return 'Villager'
  return '—'
}

// Determine if the player's faction won
function didPlayerWin(state: PlayerPrivateState): boolean {
  const role = state.self.role
  const winner = state.winner
  if (!winner) return false
  const isWolf = role === 'ALPHA_WOLF' || role === 'WEREWOLF'
  return isWolf ? winner === 'WEREWOLVES' : winner === 'VILLAGERS'
}

// Human-readable phase names
function phaseLabel(status: GameStatus): string {
  switch (status) {
    case 'WAITING': return 'Gathering'
    case 'NIGHT_PHASE': return 'The Hunt'
    case 'DAY_PHASE': return 'The Village Awakens'
    case 'VOTING_PHASE': return 'The Tribunal'
    case 'GAME_OVER': return 'Prophecy Fulfilled'
  }
}

// Inline spinner
function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#d6a84f]/30 border-t-[#d6a84f]" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}

export function PlayRoute() {
  const [params] = useSearchParams()
  const [roomInput, setRoomInput] = useState(params.get('room') ? normalizeRoomCode(params.get('room')!) : 'VILLA')
  const [nameInput, setNameInput] = useState('')
  const [session, setSession] = useState<PlayerSession | null>(null)
  const [playerState, setPlayerState] = useState<PlayerPrivateState | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [hydrating, setHydrating] = useState(false)
  const [sessionExpanded, setSessionExpanded] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const me = playerState?.self ?? null
  const currentPhase: GameStatus = playerState?.status ?? 'WAITING'
  const phaseVariant = getPhaseSceneVariant(currentPhase)

  // Track phase changes to show transition overlay
  const prevPhaseRef = useRef<GameStatus | null>(null)
  const [transitionPhase, setTransitionPhase] = useState<GameStatus | null>(null)
  useEffect(() => {
    if (playerState?.status && playerState.status !== prevPhaseRef.current && prevPhaseRef.current !== null) {
      setTransitionPhase(playerState.status)
      const t = setTimeout(() => setTransitionPhase(null), 1800)
      return () => clearTimeout(t)
    }
    prevPhaseRef.current = playerState?.status ?? null
  }, [playerState?.status])

  const dismissMessage = useCallback(() => setMessage(null), [])
  const showMessage = useCallback((msg: string) => { setMessage(msg) }, [])

  useEffect(() => {
    const saved = loadPlayerSession()
    if (saved) {
      setSession(saved)
      setRoomInput(params.get('room') ? normalizeRoomCode(params.get('room')!) : saved.room_code)
      setNameInput(saved.name)
      void hydrate(saved)
    }
    return () => { channelRef.current?.unsubscribe() }
  }, [])

  async function hydrate(nextSession: PlayerSession) {
    setHydrating(true)
    try {
      const room = await getRoom(nextSession.room_code)
      setPlayerState(null)
      if (!room) showMessage('Room not found yet. Waiting for host.')
      subscribe(nextSession)
      // Fallback: if no state received within 8s, stop the spinner so the player
      // isn't stuck forever (they'll see the "Waiting for host" message instead)
      const fallback = setTimeout(() => setHydrating(false), 8000)
      return () => clearTimeout(fallback)
    } catch (error) {
      setHydrating(false)
      showMessage(error instanceof Error ? error.message : 'Failed to recover session')
    }
  }

  function subscribe(nextSession: PlayerSession) {
    channelRef.current?.unsubscribe()
    channelRef.current = createRoomChannel(
      nextSession.room_code,
      { screen: 'player', room_code: nextSession.room_code, name: nextSession.name, session_token: nextSession.session_token },
      {
        onPlayerState: (event) => {
          if (event.player_name === nextSession.name) {
            setPlayerState(event.state)
            setHydrating(false)
          }
        },
        onStatus: (status) => {
          if (status === 'SUBSCRIBED' && channelRef.current) {
            void broadcastStateRequest(channelRef.current, { room_code: nextSession.room_code, requester: 'player', player_name: nextSession.name })
          }
        },
      },
    )
  }

  async function join() {
    const roomCode = normalizeRoomCode(roomInput)
    const name = nameInput.trim().slice(0, 24)
    if (!roomCode || !name) return
    setJoining(true)
    try {
      await createOrLoadRoom(roomCode)
      const existing = loadPlayerSession()
      const nextSession = existing?.room_code === roomCode && existing.name === name
        ? existing
        : { room_code: roomCode, name, session_token: createSessionToken() }
      await joinRoomPlayer(roomCode, name, nextSession.session_token)
      savePlayerSession(nextSession)
      setSession(nextSession)
      await hydrate(nextSession)
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to join room')
    } finally {
      setJoining(false)
    }
  }

  async function sendAction(action: 'NIGHT_TARGET' | 'SEER_INSPECT' | 'DAY_VOTE', target: string) {
    if (!channelRef.current || !session) return
    await broadcastPlayerAction(channelRef.current, {
      room_code: session.room_code,
      actor: session.name,
      action,
      target,
    })
  }

  function resetSession() {
    clearPlayerSession()
    channelRef.current?.unsubscribe()
    setSession(null)
    setPlayerState(null)
    setHydrating(false)
    setJoining(false)
  }

  // Pre-session: simple join screen, no atmospheric background needed
  if (!session) {
    return (
      <main className="fantasy-shell px-4 py-8 text-slate-100">
        <FantasyFog />
        <FantasyForest />
        <FantasyMoon className="right-[5%] top-[3%]" />
        <div className="relative z-10 mx-auto max-w-sm space-y-4">
          <div className="mb-6 text-center">
            <Link className="text-sm text-[#d6a84f]" to="/">← Back</Link>
            <h1 className="fantasy-display mt-4 text-4xl font-black text-[#f8e7bd]">Enter the Village</h1>
            <p className="mt-2 text-sm text-[#d8c7a3]">Speak your name and the room code to join the ritual.</p>
          </div>
          {!hasSupabaseConfig && (
            <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">Missing Supabase env vars.</div>
          )}
          <FantasyPanel className="p-5 space-y-3">
            <FantasyInput
              data-testid="player-room-input"
              className="w-full uppercase"
              value={roomInput}
              onChange={(value) => setRoomInput(normalizeRoomCode(value))}
              placeholder="ROOM CODE"
            />
            <FantasyInput
              data-testid="player-name-input"
              className="w-full"
              value={nameInput}
              onChange={setNameInput}
              placeholder="Your name"
            />
            <FantasyButton
              data-testid="player-join-room"
              className="w-full min-h-[52px]"
              onClick={() => void join()}
              disabled={joining}
            >
              {joining ? <Spinner label="Entering the village..." /> : 'Enter the Village'}
            </FantasyButton>
          </FantasyPanel>
          {message && (
            <AutoDismissMessage message={message} severity="info" onDismiss={dismissMessage} duration={5000} />
          )}
        </div>
      </main>
    )
  }

  // In-session: wrap the whole screen in the phase-appropriate atmospheric background
  return (
    <PhaseScene variant={phaseVariant}>
      <main className="min-h-screen px-4 py-4 text-slate-100">
        {/* Phase transition overlay */}
        {transitionPhase && (() => {
          const variant = getPhaseSceneVariant(transitionPhase)
          const { title, subtitle } = transitionLabel(transitionPhase)
          return (
            <div className={`phase-transition-overlay phase-transition-overlay-${variant}`}>
              <p className="fantasy-display text-5xl font-black text-[#f8e7bd] text-center px-6">{title}</p>
              {subtitle && <p className="mt-3 text-lg text-[#d8c7a3] text-center px-6">{subtitle}</p>}
            </div>
          )
        })()}
        {/* Minimal top bar — just back + session toggle */}
        <div className="relative z-20 mx-auto max-w-md">
          <div className="flex items-center justify-between">
            <Link className="text-sm text-[#d6a84f] hover:text-[#f8e7bd] transition" to="/">← Back</Link>
            <button
              className="text-xs text-[#d6a84f] hover:text-[#f8e7bd] transition"
              onClick={() => setSessionExpanded((v) => !v)}
              aria-expanded={sessionExpanded}
              data-testid="player-session-toggle"
            >
              {session.room_code} · {session.name} {sessionExpanded ? '▲' : '▼'}
            </button>
          </div>

          {/* Expandable session details */}
          {sessionExpanded && (
            <div className="mt-2 rounded-2xl border border-[#d6a84f]/15 bg-black/50 px-4 py-3 backdrop-blur-sm" data-testid="player-session">
              <p className="text-xs text-[#d8c7a3]">Room: <span className="font-bold text-[#f8e7bd]">{session.room_code}</span></p>
              <p className="text-xs text-[#d8c7a3]">Name: <span className="font-bold text-[#f8e7bd]">{session.name}</span></p>
              <button
                className="mt-2 w-full rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-2 text-xs font-bold text-red-300 min-h-11"
                onClick={resetSession}
              >
                Leave &amp; Clear Session
              </button>
            </div>
          )}

          {message && (
            <div className="mt-2" data-testid="player-message">
              <AutoDismissMessage message={message} severity="info" onDismiss={dismissMessage} duration={5000} />
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="relative z-10 mx-auto mt-4 max-w-md space-y-4">
          {/* Phase + day header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs text-[#d8c7a3] uppercase tracking-widest">Phase</p>
              <h2 className="fantasy-display text-2xl font-black text-[#f8e7bd]" data-testid="player-phase">
                {phaseLabel(currentPhase)}
              </h2>
            </div>
            <div className="text-right space-y-1">
              <span className="fantasy-badge rounded-full px-3 py-1 text-sm block">Day {playerState?.day_count ?? 0}</span>
              {hydrating && (
                <span className="flex items-center justify-end gap-1 text-xs text-[#d8c7a3]">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border border-[#d6a84f]/30 border-t-[#d6a84f]" aria-hidden="true" />
                  Syncing...
                </span>
              )}
            </div>
          </div>

          {/* Loading state — waiting for first realtime state */}
          {hydrating && !playerState && (
            <div className="flex flex-col items-center gap-4 py-16" data-testid="player-loading">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#d6a84f]/20 border-t-[#d6a84f]" aria-label="Loading" />
              <p className="fantasy-rune text-sm text-[#d8c7a3] tracking-widest">Awaiting the omens...</p>
            </div>
          )}

          {!hydrating && !me && (
            <div className="rounded-2xl border border-[#d6a84f]/15 bg-black/40 p-5 text-center backdrop-blur-sm">
              <p className="text-[#d8c7a3]">Waiting for host to start or re-broadcast state.</p>
            </div>
          )}

          {playerState && <RolePanel state={playerState} onAction={sendAction} />}
        </div>
      </main>
    </PhaseScene>
  )
}

function RolePanel({ state, onAction }: { state: PlayerPrivateState; onAction: (action: 'NIGHT_TARGET' | 'SEER_INSPECT' | 'DAY_VOTE', target: string) => Promise<void> }) {
  const me = state.self
  const isWolfRole = me.role === 'ALPHA_WOLF' || me.role === 'WEREWOLF'
  const isSeerLike = me.role === 'SEER' || (me.role === 'BACKUP_SEER' && state.status === 'NIGHT_PHASE' && (state.valid_targets.length > 0 || !!me.inspected_target))
  const isBodyguard = me.role === 'BODYGUARD'
  const tarotVariant = getTarotCardVariant(me.role, me.is_alive)
  const [roleVisible, setRoleVisible] = useState(true)
  const [actionPending, setActionPending] = useState<string | null>(null)
  const [seerModalDismissed, setSeerModalDismissed] = useState(false)
  const [wolfModalDismissed, setWolfModalDismissed] = useState(false)

  // Re-show seer modal only when a NEW inspection result arrives during night phase
  const prevInspectedRef = useRef<string | null>(null)
  useEffect(() => {
    if (state.status === 'NIGHT_PHASE' && me.inspected_target && me.inspected_target !== prevInspectedRef.current) {
      setSeerModalDismissed(false)
    }
    prevInspectedRef.current = me.inspected_target
  }, [me.inspected_target, state.status])

  // Re-show wolf modal only when poll changes during night phase
  const prevPollRef = useRef<string>('')
  useEffect(() => {
    const pollKey = JSON.stringify(state.werewolf_poll ?? [])
    if (state.status === 'NIGHT_PHASE' && pollKey !== prevPollRef.current && (state.werewolf_poll?.length ?? 0) > 0) {
      setWolfModalDismissed(false)
    }
    prevPollRef.current = pollKey
  }, [state.werewolf_poll, state.status])

  // Auto-dismiss both modals when phase leaves night
  useEffect(() => {
    if (state.status !== 'NIGHT_PHASE') {
      setSeerModalDismissed(true)
      setWolfModalDismissed(true)
    }
  }, [state.status])

  async function handleAction(action: 'NIGHT_TARGET' | 'SEER_INSPECT' | 'DAY_VOTE', target: string) {
    if (actionPending) return
    setActionPending(target)
    try {
      await onAction(action, target)
    } finally {
      setTimeout(() => setActionPending(null), 2000)
    }
  }

  const showSeerModal = isSeerLike && state.status === 'NIGHT_PHASE' && me.inspected_target && state.seer_result && !seerModalDismissed
  const showWolfModal = isWolfRole && state.status === 'NIGHT_PHASE' && (state.werewolf_poll?.length ?? 0) > 0 && !wolfModalDismissed

  return (
    <>
      {/* Seer vision modal */}
      {showSeerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          data-testid="seer-vision-modal"
          onClick={() => setSeerModalDismissed(true)}
        >
          <div
            className="w-full max-w-sm rounded-4xl border-2 border-violet-500/60 bg-linear-to-b from-violet-950/90 to-black/90 p-8 text-center shadow-[0_0_60px_rgba(109,40,217,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="fantasy-rune text-xs tracking-widest text-violet-300 uppercase">Your Vision</p>
            <p className="mt-5 text-3xl font-bold text-[#f8e7bd]">{me.inspected_target}</p>
            <p className="mt-2 text-base text-violet-200">is a</p>
            <p className={`mt-3 text-5xl font-black ${state.seer_result === 'WEREWOLF' ? 'text-red-400' : 'text-emerald-300'}`}>
              {seerResultLabel(state.seer_result)}
            </p>
            <button
              className="mt-8 w-full rounded-2xl border border-violet-500/30 bg-violet-900/40 px-4 py-3 text-sm font-bold text-violet-200 min-h-11"
              onClick={() => setSeerModalDismissed(true)}
            >
              Close Vision
            </button>
          </div>
        </div>
      )}

      {/* Wolf poll modal */}
      {showWolfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          data-testid="wolf-poll-modal"
          onClick={() => setWolfModalDismissed(true)}
        >
          <div
            className="w-full max-w-sm rounded-4xl border-2 border-red-800/60 bg-linear-to-b from-red-950/90 to-black/90 p-8 text-center shadow-[0_0_60px_rgba(185,28,28,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="fantasy-rune text-xs tracking-widest text-red-300 uppercase">Pack Vote</p>
            <div className="mt-5 space-y-2">
              {state.werewolf_poll!.map((item) => (
                <div key={item.target} className="flex items-center justify-between rounded-2xl bg-red-900/30 px-4 py-3">
                  <span className="font-bold text-[#f8e7bd]">{item.target}</span>
                  <span className="text-red-300 font-bold">{item.votes} {item.votes === 1 ? 'vote' : 'votes'}</span>
                </div>
              ))}
            </div>
            <button
              className="mt-6 w-full rounded-2xl border border-red-800/30 bg-red-900/40 px-4 py-3 text-sm font-bold text-red-200 min-h-11"
              onClick={() => setWolfModalDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Role card — larger sigil, matched rounding on blur overlay */}
        <div className="relative" data-testid="role-card-wrapper">
          <TarotCard variant={tarotVariant} role={me.role} data-testid="player-role">
            <p className="text-sm text-[#d8c7a3] text-center">{me.is_alive ? 'Alive' : 'Deceased'}</p>
          </TarotCard>
          {!roleVisible && (
            <div
              className="absolute inset-0 rounded-2xl backdrop-blur-xl bg-black/70 flex flex-col items-center justify-center gap-3"
              data-testid="role-blur-overlay"
              aria-hidden="true"
            >
              <span className="text-5xl">🌑</span>
              <p className="fantasy-rune text-xs text-[#d8c7a3] tracking-widest uppercase">Role Hidden</p>
            </div>
          )}
        </div>

        {/* Hide/reveal toggle — below card, above actions */}
        <button
          className="w-full rounded-2xl border border-[#d6a84f]/20 bg-black/30 px-4 py-3 text-sm font-bold text-[#d8c7a3] min-h-11 hover:bg-black/50 transition backdrop-blur-sm"
          onClick={() => setRoleVisible((v) => !v)}
          data-testid="role-visibility-toggle"
          aria-label={roleVisible ? 'Hide role from view' : 'Reveal role'}
        >
          {roleVisible ? '🙈 Hide Role' : '👁 Reveal Role'}
        </button>

        {/* Status message */}
        <ParchmentBox>
          <p className="text-[#f8e7bd]">{getStatusMessage(state)}</p>
        </ParchmentBox>

        {/* Night phase — sleeping or action */}
        {state.status === 'NIGHT_PHASE' && !state.valid_targets.length && <SleepingPanel state={state} />}

        {state.status === 'NIGHT_PHASE' && state.valid_targets.length > 0 && isWolfRole && (
          <TargetList
            title="Choose your prey"
            action="NIGHT_TARGET"
            targets={state.valid_targets}
            actionPending={actionPending}
            currentVote={me.night_action_target}
            onAction={handleAction}
          />
        )}

        {state.status === 'NIGHT_PHASE' && state.valid_targets.length > 0 && isSeerLike && (
          <TargetList
            title="Inspect one soul"
            action="SEER_INSPECT"
            targets={state.valid_targets}
            actionPending={actionPending}
            onAction={handleAction}
          />
        )}

        {/* Bodyguard protection */}
        {state.status === 'NIGHT_PHASE' && state.valid_targets.length > 0 && isBodyguard && (
          <TargetList
            title="Choose who to protect"
            action="NIGHT_TARGET"
            targets={state.valid_targets}
            actionPending={actionPending}
            currentVote={me.night_action_target}
            onAction={handleAction}
          />
        )}

        {/* Seer result inline — only after modal dismissed */}
        {state.status === 'NIGHT_PHASE' && isSeerLike && me.inspected_target && seerModalDismissed && (
          <ParchmentBox variant="fresh">
            <p className="text-[#f8e7bd]">
              Vision for <b>{me.inspected_target}</b>: <b>{seerResultLabel(state.seer_result)}</b>
            </p>
          </ParchmentBox>
        )}

        {/* Voting phase */}
        {state.status === 'VOTING_PHASE' && me.is_alive && (
          <TargetList
            title="Cast your ballot"
            action="DAY_VOTE"
            targets={state.valid_targets}
            actionPending={actionPending}
            currentVote={me.day_vote_target}
            onAction={handleAction}
          />
        )}

        {state.status === 'VOTING_PHASE' && !me.is_alive && (
          <ParchmentBox variant="aged">
            <p className="text-slate-400">The tribunal deliberates. You may not vote.</p>
          </ParchmentBox>
        )}

        {/* Day phase info */}
        {state.status === 'DAY_PHASE' && state.last_killed && (
          <ParchmentBox variant="aged">
            <p className="text-amber-200"><b>{state.last_killed}</b> was found dead at dawn.</p>
          </ParchmentBox>
        )}

        {/* Game over — personalised Victory / Defeat */}
        {state.status === 'GAME_OVER' && (
          <ParchmentBox variant="sealed">
            {didPlayerWin(state) ? (
              <>
                <p className="fantasy-display text-yellow-300 font-black text-4xl tracking-wide">Victory</p>
                <p className="mt-2 text-[#f8e7bd]">Your side has prevailed.</p>
              </>
            ) : (
              <>
                <p className="fantasy-display text-slate-400 font-black text-4xl tracking-wide">Defeat</p>
                <p className="mt-2 text-[#d8c7a3]">The {state.winner === 'WEREWOLVES' ? 'wolves' : 'village'} have won.</p>
              </>
            )}
          </ParchmentBox>
        )}
      </div>
    </>
  )
}

function SleepingPanel({ state }: { state: PlayerPrivateState }) {
  if (state.self.role === 'MASON') {
    return (
      <div className="fantasy-parchment rounded-2xl p-4">
        <p className="text-sm text-violet-300 uppercase tracking-widest">Mason Partners</p>
        <p className="mt-2 text-xl font-bold text-[#f8e7bd]">{state.mason_partners.join(', ') || 'None yet'}</p>
      </div>
    )
  }
  return (
    <div className="fantasy-parchment rounded-2xl p-5 text-center">
      <p className="text-2xl text-[#f8e7bd]">💤</p>
      <p className="mt-2 text-lg text-[#f8e7bd]">You are sleeping...</p>
      <p className="mt-1 text-sm text-slate-400">Remain silent and await the dawn.</p>
    </div>
  )
}

function TargetList({
  title,
  action,
  targets,
  actionPending,
  currentVote,
  onAction,
}: {
  title: string
  action: 'NIGHT_TARGET' | 'SEER_INSPECT' | 'DAY_VOTE'
  targets: PublicPlayer[]
  actionPending: string | null
  currentVote?: string | null
  onAction: (action: 'NIGHT_TARGET' | 'SEER_INSPECT' | 'DAY_VOTE', target: string) => Promise<void>
}) {
  const [changingVote, setChangingVote] = useState(false)
  const hasConfirmState = action === 'DAY_VOTE' || action === 'NIGHT_TARGET'

  // Reset change mode when the selection is cleared (new phase)
  useEffect(() => {
    if (!currentVote) setChangingVote(false)
  }, [currentVote])

  const confirmedLabel = action === 'NIGHT_TARGET' ? 'Your prey' : 'Your ballot'
  const changeLabel = action === 'NIGHT_TARGET' ? 'Change Target' : 'Change Vote'
  const changeIcon = action === 'NIGHT_TARGET' ? '🐺' : '🗳️'
  const changingTitle = action === 'NIGHT_TARGET' ? 'Change your prey' : 'Change your ballot'

  const items: CompactItem[] = targets.map((t) => ({
    id: t.name,
    label: t.name,
    status: t.is_alive ? 'alive' as const : 'dead' as const,
  }))

  // Sending spinner
  if (actionPending) {
    return (
      <div className="fantasy-parchment rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-bold text-[#d8c7a3] uppercase tracking-widest">{title}</h3>
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 px-4 py-3">
          <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#d6a84f]/30 border-t-[#d6a84f]" aria-hidden="true" />
          <span className="text-sm text-[#d8c7a3]">Sending — <b className="text-[#f8e7bd]">{actionPending}</b>...</span>
        </div>
      </div>
    )
  }

  // Already selected — show confirmation, allow change
  if (hasConfirmState && currentVote && !changingVote) {
    return (
      <div className="fantasy-parchment rounded-2xl p-4">
        <h3 className="mb-3 text-sm font-bold text-[#d8c7a3] uppercase tracking-widest">{title}</h3>
        <div className="rounded-2xl border border-[#d6a84f]/30 bg-black/30 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#d8c7a3] uppercase tracking-widest">{confirmedLabel}</p>
            <p className="mt-1 text-lg font-bold text-[#f8e7bd]">{currentVote}</p>
          </div>
          <span className="text-xl">{changeIcon}</span>
        </div>
        <button
          className="mt-3 w-full rounded-2xl border border-[#d6a84f]/15 bg-black/20 px-4 py-2 text-xs font-bold text-[#d8c7a3] min-h-11 hover:bg-black/40 transition"
          onClick={() => setChangingVote(true)}
        >
          {changeLabel}
        </button>
      </div>
    )
  }

  // Target selection list
  return (
    <div className="fantasy-parchment rounded-2xl p-4">
      <h3 className="mb-3 text-sm font-bold text-[#d8c7a3] uppercase tracking-widest">
        {hasConfirmState && changingVote ? changingTitle : title}
      </h3>
      {hasConfirmState && changingVote && currentVote && (
        <button
          className="mb-3 text-xs text-[#d6a84f] hover:text-[#f8e7bd] transition"
          onClick={() => setChangingVote(false)}
        >
          ← Keep current ({currentVote})
        </button>
      )}
      <CompactList
        items={items}
        variant="actions"
        data-testid="player-target-list"
        onItemClick={(item) => {
          setChangingVote(false)
          void onAction(action, item.id)
        }}
      />
    </div>
  )
}

function getStatusMessage(state: PlayerPrivateState) {
  if (!state.self.is_alive) return 'You have fallen. Stay silent and observe.'
  if (state.status === 'WAITING') return 'The village gathers. Waiting for the host to begin.'
  if (state.status === 'NIGHT_PHASE' && state.valid_targets.length > 0) return 'The night calls. Choose your action.'
  if (state.status === 'NIGHT_PHASE') return 'You sleep. Remain silent and await the dawn.'
  if (state.status === 'VOTING_PHASE') return 'The tribunal convenes. Cast your final ballot.'
  if (state.status === 'DAY_PHASE' && state.last_killed) return `The village awakens. ${state.last_killed} was found dead.`
  if (state.status === 'DAY_PHASE') return 'The village awakens. Discuss and deliberate.'
  return `The ritual ends. ${state.winner === 'WEREWOLVES' ? 'The wolves have won.' : 'The village has prevailed.'}`
}
