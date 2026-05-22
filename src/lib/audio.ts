export const audioAssets = {
  nightAmbient: '/audio/night-ambient.mp3',
  wolfHowl: '/audio/wolf-howl.mp3',
  heartbeat: '/audio/heartbeat.mp3',
}

export type TvAudioController = {
  playNightAmbient: () => void
  stopNightAmbient: () => void
  playWolfHowl: () => void
  playHeartbeat: () => void
  stopHeartbeat: () => void
  stopAll: () => void
}

export function createTvAudioController(): TvAudioController {
  const ambient = createAudio(audioAssets.nightAmbient, true)
  const howl = createAudio(audioAssets.wolfHowl, false)
  const heartbeat = createAudio(audioAssets.heartbeat, true)

  return {
    playNightAmbient: () => void ambient?.play().catch(() => undefined),
    stopNightAmbient: () => stopAudio(ambient),
    playWolfHowl: () => {
      if (!howl) return
      howl.currentTime = 0
      void howl.play().catch(() => undefined)
    },
    playHeartbeat: () => void heartbeat?.play().catch(() => undefined),
    stopHeartbeat: () => stopAudio(heartbeat),
    stopAll: () => {
      stopAudio(ambient)
      stopAudio(heartbeat)
    },
  }
}

function createAudio(src: string, loop: boolean) {
  if (typeof Audio === 'undefined') return null
  const audio = new Audio(src)
  audio.loop = loop
  audio.preload = 'auto'
  audio.volume = loop ? 0.35 : 0.8
  return audio
}

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}
