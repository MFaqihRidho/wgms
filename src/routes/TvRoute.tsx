import type { RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { QRCodeSVG } from 'qrcode.react'
import { PhaseScene, CompactList, CountdownTimer, getPhaseSceneVariant, type CompactItem } from '../components/fantasy'
import { getRoom } from '../lib/database'
import { useLiveTimer } from '../hooks/useLiveTimer'
import { createTvAudioController, type TvAudioController } from '../lib/audio'
import type { AudioCueBroadcast, PublicGameState } from '../lib/game-types'
import { normalizeRoomCode } from '../lib/room-code'
import { broadcastStateRequest, createRoomChannel } from '../lib/realtime'
import { loadTvSession, saveTvSession } from '../lib/storage'
import { hasSupabaseConfig } from '../lib/supabase'

async function requestFullscreen() {
  await document.documentElement.requestFullscreen?.()
  await navigator.wakeLock?.request?.('screen').catch(() => undefined)
}

function getPhaseTitle(status: string): string {
  switch (status) {
    case 'WAITING': return 'The Village Gathers'
    case 'NIGHT_PHASE': return 'The Hunt Begins'
    case 'DAY_PHASE': return 'The Village Awakens'
    case 'VOTING_PHASE': return 'The Tribunal'
    case 'GAME_OVER': return 'Prophecy Fulfilled'
    default: return status.replace(/_/g, ' ')
  }
}

function getPhaseCopy(status: string): string {
  switch (status) {
    case 'WAITING': return 'Awaiting souls to answer the summons...'
    case 'NIGHT_PHASE': return 'Darkness falls. The wolves prowl.'
    case 'DAY_PHASE': return 'The village awakens to discuss and deliberate.'
    case 'VOTING_PHASE': return 'The tribunal convenes. Cast your vote.'
    default: return ''
  }
}

function getWinnerLabel(winner: string): string {
  if (winner === 'WEREWOLVES') return '🐺 The Wolves Prevail'
  if (winner === 'VILLAGERS') return '🌟 The Village Triumphs'
  return winner
}

export function TvRoute() {
  const [params] = useSearchParams()
  const [roomInput, setRoomInput] = useState(
    params.get('room') ? normalizeRoomCode(params.get('room')!) : loadTvSession()?.room_code ?? 'VILLA',
  )
  const [roomCode, setRoomCode] = useState('')
  const [gameState, setGameState] = useState<PublicGameState | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(loadTvSession()?.audio_enabled ?? false)
  const [message, setMessage] = useState('')
  const [adminExpanded, setAdminExpanded] = useState(false)
  const [loadingRoom, setLoadingRoom] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const audioRef = useRef<TvAudioController | null>(null)
  const previousStatusRef = useRef<PublicGameState['status'] | null>(null)
  const timerLeft = useLiveTimer(gameState)

  useEffect(() => {
    const queryRoom = params.get('room')
    if (queryRoom) void loadRoom(normalizeRoomCode(queryRoom))
    return () => {
      channelRef.current?.unsubscribe()
      audioRef.current?.stopAll()
    }
  }, [])

  useEffect(() => {
    if (!gameState || !audioEnabled || !audioRef.current) return
    const previous = previousStatusRef.current

    if (gameState.status === 'NIGHT_PHASE') {
      audioRef.current.playNightAmbient()
      audioRef.current.stopHeartbeat()
    }
    if (previous === 'NIGHT_PHASE' && gameState.status === 'DAY_PHASE') {
      audioRef.current.stopNightAmbient()
      audioRef.current.playWolfHowl()
    }
    if (gameState.status === 'DAY_PHASE' && gameState.last_killed && timerLeft <= 30 && timerLeft > 0) {
      audioRef.current.playHeartbeat()
    } else {
      audioRef.current.stopHeartbeat()
    }

    previousStatusRef.current = gameState.status
  }, [audioEnabled, gameState, timerLeft])

  async function loadRoom(code = normalizeRoomCode(roomInput)) {
    setLoadingRoom(true)
    try {
      const room = await getRoom(code)
      setRoomCode(code)
      setGameState(room?.public_state ?? null)
      saveTvSession({ room_code: code, audio_enabled: audioEnabled })
      channelRef.current?.unsubscribe()
      channelRef.current = createRoomChannel(code, { screen: 'tv', room_code: code }, {
        onPublicState: setGameState,
        onAudioCue: handleAudioCue,
        onStatus: (status) => {
          if (status === 'SUBSCRIBED' && channelRef.current) {
            void broadcastStateRequest(channelRef.current, { room_code: code, requester: 'tv' })
          }
        },
      })
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load room')
    } finally {
      setLoadingRoom(false)
    }
  }

  function handleAudioCue(event: AudioCueBroadcast) {
    if (audioEnabled && audioRef.current) {
      if (event.cue === 'NIGHT_AMBIENT_START') audioRef.current.playNightAmbient()
      if (event.cue === 'NIGHT_AMBIENT_STOP') audioRef.current.stopNightAmbient()
      if (event.cue === 'WOLF_HOWL') audioRef.current.playWolfHowl()
      if (event.cue === 'HEARTBEAT_START') audioRef.current.playHeartbeat()
      if (event.cue === 'HEARTBEAT_STOP') audioRef.current.stopHeartbeat()
    }
  }

  function enableAudio() {
    audioRef.current = createTvAudioController()
    setAudioEnabled(true)
    if (roomCode) saveTvSession({ room_code: roomCode, audio_enabled: true })
  }

  const status = gameState?.status ?? 'WAITING'
  const phaseVariant = getPhaseSceneVariant(status)
  const isWaiting = status === 'WAITING'
  const isGameOver = status === 'GAME_OVER'

  // Track phase changes for transition overlay
  const prevStatusRef = useRef<string | null>(null)
  const [transitionStatus, setTransitionStatus] = useState<string | null>(null)
  useEffect(() => {
    if (gameState?.status && gameState.status !== prevStatusRef.current && prevStatusRef.current !== null) {
      setTransitionStatus(gameState.status)
      const t = setTimeout(() => setTransitionStatus(null), 1800)
      return () => clearTimeout(t)
    }
    prevStatusRef.current = gameState?.status ?? null
  }, [gameState?.status])

  const playerItems: CompactItem[] = gameState?.players.map((player) => ({
    id: player.name,
    label: player.name,
    status: player.is_alive ? 'alive' as const : 'dead' as const,
  })) ?? []

  const joinUrl = roomCode ? `${globalThis.location?.origin ?? ''}/play?room=${roomCode}` : ''

  return (
    <PhaseScene variant={phaseVariant}>
      <main className="min-h-screen px-5 py-4 text-white">
        {/* Phase transition overlay */}
        {transitionStatus && (() => {
          const overlayVariant = getPhaseSceneVariant(transitionStatus as Parameters<typeof getPhaseSceneVariant>[0])
          const title = getPhaseTitle(transitionStatus)
          const copy = getPhaseCopy(transitionStatus)
          return (
            <div className={`phase-transition-overlay phase-transition-overlay-${overlayVariant}`}>
              <p className="fantasy-display text-7xl font-black text-[#f8e7bd] text-center px-8 sm:text-8xl">{title}</p>
              {copy && <p className="mt-4 text-2xl text-[#d8c7a3] text-center px-8">{copy}</p>}
            </div>
          )
        })()}

        {/* Admin bar — always at top, collapsed by default */}
        <div className="relative z-20 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <Link className="text-sm text-[#d6a84f] hover:text-[#f8e7bd] transition" to="/">← Back</Link>
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="flex items-center gap-2 text-sm text-[#d6a84f] hover:text-[#f8e7bd] transition"
              aria-expanded={adminExpanded}
              aria-controls="admin-panel"
            >
              <span>{adminExpanded ? '▼' : '▶'}</span>
              <span>Admin</span>
            </button>
          </div>

          {adminExpanded && (
            <div id="admin-panel" className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-black/50 p-3 backdrop-blur-sm">
              <input
                className="fantasy-input w-28 rounded-2xl px-4 py-2 text-center uppercase"
                data-testid="tv-room-input"
                value={roomInput}
                onChange={(event) => setRoomInput(normalizeRoomCode(event.target.value))}
              />
              <button
                className="fantasy-button rounded-2xl px-4 py-3 font-bold min-h-11 flex items-center gap-2"
                data-testid="tv-load-room"
                onClick={() => void loadRoom()}
                disabled={loadingRoom}
              >
                {loadingRoom ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden="true" />
                    Loading...
                  </>
                ) : 'Load'}
              </button>
              <button className="fantasy-button rounded-2xl px-4 py-3 font-bold min-h-11" onClick={enableAudio}>
                {audioEnabled ? '🔊 Audio On' : '🔇 Enable Audio'}
              </button>
              <button className="fantasy-button-blood rounded-2xl px-4 py-3 font-bold min-h-11" onClick={() => void requestFullscreen()}>
                Fullscreen
              </button>
            </div>
          )}

          {!hasSupabaseConfig && (
            <p className="mt-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
              Missing Supabase env vars.
            </p>
          )}
          {message && <p className="mt-3 rounded-2xl bg-red-900/30 p-3 text-sm text-red-200">{message}</p>}
        </div>

        {/* ── WAITING PHASE: QR code is the hero ── */}
        {isWaiting && (
          <section className="relative z-10 mx-auto mt-8 max-w-4xl" data-testid="tv-waiting">
            <div className="text-center">
              <p className="fantasy-rune text-lg text-[#d6a84f]">ROOM {roomCode || '----'}</p>
              <h1 className="fantasy-display mt-4 text-6xl font-black text-[#f8e7bd] sm:text-7xl md:text-8xl" data-testid="tv-phase">
                {getPhaseTitle(status)}
              </h1>
              <p className="mt-3 text-xl text-[#d8c7a3]">{getPhaseCopy(status)}</p>
            </div>

            {roomCode ? (
              <div className="mt-10 flex flex-col items-center gap-5" data-testid="tv-qr-code">
                <p className="fantasy-rune text-xl text-[#d6a84f] tracking-widest uppercase">Scan to Join</p>
                <div className="rounded-3xl bg-white p-5 shadow-[0_0_60px_rgba(214,168,79,0.5)]">
                  <QRCodeSVG
                    value={joinUrl}
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#0d0a12"
                    level="M"
                  />
                </div>
                <p className="text-base text-[#d8c7a3] font-mono">{joinUrl}</p>
                {gameState && (
                  <p className="mt-2 text-2xl text-[#f8e7bd]">
                    {gameState.players.filter(p => p.is_alive).length} player{gameState.players.length !== 1 ? 's' : ''} joined
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-12 text-center">
                <p className="text-2xl text-slate-400">Open Admin to load a room code.</p>
              </div>
            )}
          </section>
        )}

        {/* ── GAME OVER: winner announcement ── */}
        {isGameOver && gameState && (
          <section className="relative z-10 mx-auto mt-8 max-w-4xl text-center" data-testid="tv-game-over">
            <p className="fantasy-rune text-lg text-[#d6a84f]">ROOM {roomCode}</p>
            <h1 className="fantasy-display mt-6 text-7xl font-black text-[#f8e7bd] sm:text-8xl md:text-9xl" data-testid="tv-phase">
              {getPhaseTitle(status)}
            </h1>
            {gameState.winner && (
              <p className="mt-6 text-4xl font-black text-yellow-200 sm:text-5xl">
                {getWinnerLabel(gameState.winner)}
              </p>
            )}
            <div className="mt-10 fantasy-parchment rounded-4xl p-6 inline-block">
              <p className="fantasy-rune text-sm text-[#d8c7a3]">Village Tribunal</p>
              <div className="mt-4" data-testid="tv-players">
                <CompactList items={playerItems} variant="roster" />
              </div>
            </div>
          </section>
        )}

        {/* ── ACTIVE GAME: phase title + timer + info grid ── */}
        {!isWaiting && !isGameOver && (
          <section className="relative z-10 mx-auto mt-6 max-w-7xl">
            <div className="flex min-h-[80vh] flex-col justify-between gap-6">

              {/* Phase header */}
              <div className="text-center">
                <p className="fantasy-rune text-xl text-[#d6a84f]">ROOM {roomCode || '----'}</p>
                <h1
                  className="fantasy-display mt-3 font-black tracking-tight text-[#f8e7bd] text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
                  data-testid="tv-phase"
                >
                  {getPhaseTitle(status)}
                </h1>
                <p className="mt-3 text-2xl text-[#d8c7a3]" data-testid="tv-day-count">
                  Day {gameState?.day_count ?? 0}
                </p>
                {getPhaseCopy(status) && (
                  <p className="mt-2 mx-auto max-w-2xl text-xl text-slate-300">{getPhaseCopy(status)}</p>
                )}
              </div>

              {/* Timer — large, centered */}
              {gameState?.timer_duration ? (
                <div className="flex justify-center">
                  <CountdownTimer
                    seconds={timerLeft}
                    total={gameState.timer_duration}
                    className="[&_.timer-display]:text-8xl md:[&_.timer-display]:text-9xl"
                  />
                </div>
              ) : null}

              {/* Info grid */}
              {gameState && (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="fantasy-parchment rounded-4xl p-6">
                    <p className="fantasy-rune text-sm text-[#d8c7a3]">Last Fallen</p>
                    <p className="mt-2 text-3xl text-[#f8e7bd]" data-testid="tv-last-killed">
                      {gameState.last_killed ?? '—'}
                    </p>
                    {status === 'VOTING_PHASE' && (
                      <p className="mt-3 text-2xl text-[#f8e7bd]" data-testid="tv-vote-progress">
                        Votes cast: <b>{gameState.vote_progress.submitted}/{gameState.vote_progress.total_alive}</b>
                      </p>
                    )}
                  </div>

                  <div className="fantasy-parchment rounded-4xl p-6">
                    <p className="fantasy-rune text-sm text-[#d8c7a3]">Village Tribunal</p>
                    <div className="mt-4" data-testid="tv-players">
                      <CompactList items={playerItems} variant="roster" />
                    </div>
                  </div>
                </div>
              )}

              {!gameState && (
                <p className="text-center text-2xl text-slate-400">Waiting for host room snapshot.</p>
              )}
            </div>
          </section>
        )}

      </main>
    </PhaseScene>
  )
}
