import { useEffect, useState } from 'react'
import type { GameState, PlayerPrivateState, PublicGameState } from '../lib/game-types'

export function useLiveTimer(gameState: GameState | PublicGameState | PlayerPrivateState | null) {
  const [timerLeft, setTimerLeft] = useState(() => (gameState ? getTimerLeftForState(gameState) : 0))

  useEffect(() => {
    if (!gameState) {
      setTimerLeft(0)
      return
    }

    setTimerLeft(getTimerLeftForState(gameState))
    const intervalId = window.setInterval(() => {
      setTimerLeft(getTimerLeftForState(gameState))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [gameState])

  return timerLeft
}

function getTimerLeftForState(state: GameState | PublicGameState | PlayerPrivateState) {
  if (!state.phase_started_at) return state.timer_left
  const started = new Date(state.phase_started_at).getTime()
  const elapsed = Math.floor((Date.now() - started) / 1000)
  return Math.max(0, state.timer_duration - elapsed)
}
