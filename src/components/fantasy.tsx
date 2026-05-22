import { clsx } from 'clsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import type { PlayerRole } from '../lib/game-types'

type FantasyPanelProps = {
  title?: string
  className?: string
  children: ReactNode
}

export function FantasyPanel({ title, className = '', children }: FantasyPanelProps) {
  return (
    <section className={`fantasy-panel rounded-[1.75rem] p-4 ${className}`}>
      {title && <h2 className="fantasy-display mb-3 text-xl font-bold text-[#f8e7bd]">{title}</h2>}
      {children}
    </section>
  )
}

type FantasyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  className?: string
  variant?: 'gold' | 'blood' | 'ghost'
}

export function FantasyButton({ children, className = '', variant = 'gold', onClick, ...props }: FantasyButtonProps) {
  const variantClass = variant === 'blood' ? 'fantasy-button-blood' : variant === 'ghost' ? 'bg-black/30 border-white/10' : 'fantasy-button'

  return (
    <button
      className={`rounded-2xl px-4 py-3 font-bold transition ${variantClass} ${className}`}
      onClick={(event) => void onClick?.(event)}
      {...props}
    >
      {children}
    </button>
  )
}

type FantasyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  value: string | number
  className?: string
  onChange: (value: string) => void
}

export function FantasyInput({ value, className = '', onChange, ...props }: FantasyInputProps) {
  return (
    <input
      className={`fantasy-input rounded-2xl px-4 py-3 ${className}`}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      {...props}
    />
  )
}

export function FantasyBadge({ children, className = '', ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return <span className={`fantasy-badge rounded-full px-4 py-2 ${className}`} {...props}>{children}</span>
}

export function FantasyMoon({ className = '' }: { className?: string }) {
  return <div className={`fantasy-moon ${className}`} aria-hidden="true" />
}

export function FantasySun({ className = '' }: { className?: string }) {
  return <div className={`fantasy-sun ${className}`} aria-hidden="true" />
}

export function FantasyFog() {
  return <div className="fantasy-fog" aria-hidden="true" />
}

export function FantasyForest() {
  return <div className="fantasy-forest" aria-hidden="true" />
}

/**
 * Single source of truth for role icons.
 * Used by TarotCard, RoleSigil, GuideRoute, and any other place that needs a role icon.
 */
export function getRoleIcon(role: string): string {
  if (role === 'ALPHA_WOLF' || role === 'WEREWOLF') return '🐺'
  if (role === 'SEER') return '◉'
  if (role === 'BACKUP_SEER') return '◎'
  if (role === 'MASON') return '△'
  if (role === 'BODYGUARD') return '🛡️'
  if (role === 'VILLAGER') return '✦'
  return '✧'
}

export function RoleSigil({ role }: { role: string }) {
  return <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d6a84f]/40 bg-black/35 text-2xl text-[#f8e7bd]">{getRoleIcon(role)}</span>
}

// ============================================
// Player Action Visibility
// ============================================

export type GamePhase = 'WAITING' | 'NIGHT_PHASE' | 'DAY_PHASE' | 'VOTING_PHASE' | 'GAME_OVER'

/**
 * Determines if a player should see action buttons based on role, alive status, and phase.
 * 
 * Action buttons are shown when:
 * - Phase is NIGHT_PHASE AND player is alive AND (player is wolf OR player is seer/backup-seer with valid targets)
 * - Phase is VOTING_PHASE AND player is alive
 * 
 * Note: This function checks the basic visibility logic. For seer/backup-seer, 
 * additional checks for valid_targets should be done at the component level.
 */
export function shouldShowPlayerActions(role: PlayerRole, isAlive: boolean, phase: GamePhase): boolean {
  if (!isAlive) return false
  
  // Voting phase: all alive players can vote
  if (phase === 'VOTING_PHASE') return true
  
  // Night phase: only wolves and seers can act
  if (phase === 'NIGHT_PHASE') {
    const isWolfRole = role === 'ALPHA_WOLF' || role === 'WEREWOLF'
    const isSeerRole = role === 'SEER' || role === 'BACKUP_SEER'
    return isWolfRole || isSeerRole
  }
  
  return false
}

// ============================================
// TarotCard Component
// ============================================

export type TarotCardVariant = 'wolf' | 'seer' | 'mason' | 'villager' | 'backup-seer' | 'dead'

export type TarotCardProps = HTMLAttributes<HTMLDivElement> & {
  variant: TarotCardVariant
  role: PlayerRole
  sigil?: ReactNode
  children: ReactNode
  className?: string
  hovered?: boolean
}

/**
 * Maps a player role and alive status to the correct TarotCard variant.
 * Dead players always get the 'dead' variant regardless of role.
 */
export function getTarotCardVariant(role: PlayerRole, isAlive: boolean): TarotCardVariant {
  if (!isAlive) return 'dead'

  switch (role) {
    case 'ALPHA_WOLF':
    case 'WEREWOLF':
      return 'wolf'
    case 'SEER':
      return 'seer'
    case 'BACKUP_SEER':
      return 'backup-seer'
    case 'MASON':
      return 'mason'
    case 'BODYGUARD':
      return 'villager' // reuse villager styling with shield accent
    case 'VILLAGER':
      return 'villager'
  }
}

/**
 * Get the display symbol for a role sigil.
 */
export function getRoleSigilSymbol(role: PlayerRole, isAlive: boolean): string {
  if (!isAlive) return '✝'
  return getRoleIcon(role)
}

/**
 * Get human-readable role name.
 */
export function getRoleDisplayName(role: PlayerRole): string {
  switch (role) {
    case 'ALPHA_WOLF':
      return 'Alpha Wolf'
    case 'WEREWOLF':
      return 'Werewolf'
    case 'SEER':
      return 'Seer'
    case 'BACKUP_SEER':
      return 'Backup Seer'
    case 'MASON':
      return 'Mason'
    case 'BODYGUARD':
      return 'Bodyguard'
    case 'VILLAGER':
      return 'Villager'
  }
}

export function TarotCard({ variant, role, sigil, children, className = '', hovered = false, ...props }: TarotCardProps) {
  const variantClass = `tarot-card-${variant}`
  const hoverClass = hovered ? 'tarot-card-hover' : ''

  const defaultSigil = (
    <span className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-current/40 bg-black/35 text-3xl text-[#f8e7bd]">
      {getRoleSigilSymbol(role, variant !== 'dead')}
    </span>
  )

  return (
    <div className={clsx('tarot-card rounded-2xl p-6', variantClass, hoverClass, className)} {...props}>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center justify-center">
          {sigil ?? defaultSigil}
        </div>
        <div className="text-center">
          <h3 className="fantasy-display text-2xl font-bold text-[#f8e7bd]">
            {getRoleDisplayName(role)}
          </h3>
          {variant === 'dead' && (
            <p className="mt-1 text-sm text-gray-400">Deceased</p>
          )}
        </div>
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

// ============================================
// PhaseScene Component
// ============================================

export type PhaseSceneVariant = 'waiting' | 'night' | 'day' | 'voting' | 'game-over'

export type PhaseSceneProps = {
  variant: PhaseSceneVariant
  children: ReactNode
  className?: string
}

/**
 * Maps a game status to the correct PhaseScene variant.
 */
export function getPhaseSceneVariant(status: import('../lib/game-types').GameStatus): PhaseSceneVariant {
  switch (status) {
    case 'WAITING':
      return 'waiting'
    case 'NIGHT_PHASE':
      return 'night'
    case 'DAY_PHASE':
      return 'day'
    case 'VOTING_PHASE':
      return 'voting'
    case 'GAME_OVER':
      return 'game-over'
  }
}

export function PhaseScene({ variant, children, className = '' }: PhaseSceneProps) {
  return (
    <div key={variant} className={clsx('phase-scene phase-scene-enter', `phase-scene-${variant}`, className)}>
      {variant === 'waiting' && (
        <>
          <FantasyMoon className="right-[10%] top-[5%]" />
          <FantasyFog />
          <FantasyForest />
        </>
      )}
      {variant === 'night' && (
        <>
          <FantasyMoon className="right-[5%] top-[2%]" />
          <FantasyFog />
          <FantasyForest />
        </>
      )}
      {variant === 'day' && (
        <>
          <FantasySun className="left-[10%] top-[2%]" />
          <FantasyFog />
        </>
      )}
      {variant === 'voting' && (
        <>
          <FantasyFog />
          <FantasyForest />
        </>
      )}
      {variant === 'game-over' && (
        <>
          <FantasyMoon className="right-[10%] top-[5%]" />
          <FantasyFog />
        </>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

// ============================================
// CountdownTimer Component
// ============================================

export type CountdownTimerVariant = 'default' | 'urgent' | 'critical'

export type CountdownTimerProps = {
  seconds: number
  total: number
  variant?: CountdownTimerVariant
  className?: string
}

/**
 * Determines the timer urgency variant based on remaining seconds.
 * - default: > 30 seconds
 * - urgent: 10-30 seconds
 * - critical: < 10 seconds
 */
export function getTimerVariant(seconds: number): CountdownTimerVariant {
  if (seconds <= 10) return 'critical'
  if (seconds <= 30) return 'urgent'
  return 'default'
}

export function CountdownTimer({ seconds, total, variant, className = '' }: CountdownTimerProps) {
  const displayVariant = variant ?? getTimerVariant(seconds)
  const progress = Math.max(0, Math.min(1, seconds / total))

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      <div
        className={clsx(
          'timer-display text-5xl',
          `timer-${displayVariant}`
        )}
      >
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </div>
      <div className="h-2 w-32 overflow-hidden rounded-full bg-black/30">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-1000',
            displayVariant === 'critical' && 'bg-red-600',
            displayVariant === 'urgent' && 'bg-orange-500',
            displayVariant === 'default' && 'bg-[#d6a84f]'
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// CompactList Component
// ============================================

export type CompactItemStatus = 'alive' | 'dead' | 'active' | 'inactive'

export type CompactItem = {
  id: string
  label: string
  subtitle?: string
  status?: CompactItemStatus
}

export type CompactListVariant = 'roster' | 'actions' | 'presence'

export type CompactListProps = HTMLAttributes<HTMLDivElement> & {
  items: CompactItem[]
  variant?: CompactListVariant
  className?: string
  onItemClick?: (item: CompactItem) => void
}

/**
 * Determines the best layout for a compact list based on item count.
 */
export function getCompactListLayout(itemCount: number): 'inline' | 'grid' | 'scroll' {
  if (itemCount <= 6) return 'inline'
  if (itemCount <= 12) return 'grid'
  return 'scroll'
}

export function CompactList({ items, variant: _variant = 'roster', className = '', onItemClick, ...props }: CompactListProps) {
  const layout = getCompactListLayout(items.length)

  const listClass = clsx(
    layout === 'inline' && 'compact-list',
    layout === 'grid' && 'compact-list-grid',
    layout === 'scroll' && 'compact-list-scroll',
    className
  )

  return (
    <div className={listClass} {...props}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick?.(item)}
          disabled={!onItemClick}
          className={clsx(
            'compact-item text-left',
            item.status === 'dead' && 'compact-item-dead',
            item.status === 'active' && 'compact-item-active',
            !onItemClick && 'cursor-default'
          )}
        >
          <span className="font-medium">{item.label}</span>
          {item.subtitle && (
            <span className="ml-2 text-xs text-gray-400">{item.subtitle}</span>
          )}
        </button>
      ))}
    </div>
  )
}

// ============================================
// AutoDismissMessage Component
// ============================================

export type MessageSeverity = 'info' | 'warning' | 'error' | 'success'

export type AutoDismissMessageProps = {
  message: string
  severity: MessageSeverity
  onDismiss: () => void
  duration?: number
}

export function AutoDismissMessage({
  message,
  severity,
  onDismiss,
  duration = 5000,
}: AutoDismissMessageProps) {
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setExiting(true)
      setTimeout(onDismiss, 300) // Wait for exit animation
    }, duration)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [duration, onDismiss])

  const handleDismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setExiting(true)
    setTimeout(onDismiss, 300)
  }, [onDismiss])

  return (
    <div
      role="alert"
      className={clsx(
        'message-item',
        exiting ? 'message-exit' : 'message-enter',
        `message-${severity}`
      )}
    >
      <p className="text-sm text-[#f8e7bd]">{message}</p>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-2 rounded-lg px-3 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-white/5 transition-colors"
      >
        Dismiss
      </button>
    </div>
  )
}

// ============================================
// ParchmentBox Component
// ============================================

export type ParchmentVariant = 'aged' | 'fresh' | 'sealed'

export type ParchmentBoxProps = {
  children: ReactNode
  variant?: ParchmentVariant
  className?: string
}

export function ParchmentBox({ children, variant = 'aged', className = '' }: ParchmentBoxProps) {
  return (
    <div
      className={clsx(
        'fantasy-parchment rounded-2xl p-4',
        variant === 'sealed' && 'fantasy-seal',
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================
// RitualSeal Component
// ============================================

export type RitualSealVariant = 'blood' | 'gold' | 'silver'

export type RitualSealProps = {
  variant: RitualSealVariant
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RitualSeal({ variant, size = 'md', className = '' }: RitualSealProps) {
  const sizeClass = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
  }[size]

  const colorClass = {
    blood: 'bg-gradient-to-br from-red-800 to-red-950 border-red-600',
    gold: 'bg-gradient-to-br from-yellow-700 to-yellow-900 border-yellow-600',
    silver: 'bg-gradient-to-br from-gray-400 to-gray-600 border-gray-300',
  }[variant]

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full border-2 shadow-lg',
        sizeClass,
        colorClass,
        className
      )}
      aria-hidden="true"
    >
      <span className="text-white/80">✦</span>
    </div>
  )
}
