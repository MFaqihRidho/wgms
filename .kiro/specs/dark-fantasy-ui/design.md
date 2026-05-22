# Design Document: Dark Fantasy UI Overhaul

## Overview

This design transforms WGMS from a functional game controller into an immersive dark fantasy experience. The core principle is **progressive disclosure** - show only what's needed, hide the rest. Every element should contribute to the moonlit village werewolf ritual aesthetic.

## Architecture

### Design System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Route Components                        │
│  (HomeRoute, HostRoute, PlayRoute, TvRoute)                 │
├─────────────────────────────────────────────────────────────┤
│                    Composite Components                      │
│  (TarotCard, PhaseScene, CountdownTimer, CompactList)       │
├─────────────────────────────────────────────────────────────┤
│                     Base Components                          │
│  (FantasyPanel, FantasyButton, ParchmentBox, RitualSeal)    │
├─────────────────────────────────────────────────────────────┤
│                     CSS Utilities                            │
│  (fantasy-shell, fantasy-moon, fantasy-fog, animations)     │
└─────────────────────────────────────────────────────────────┘
```

### State Management

No new state libraries needed. Each route manages its own layout state:

- `advancedOpen: boolean` - controls visibility of advanced tools
- `message: string | null` - auto-dismissing notifications
- Existing game state from Supabase realtime

## Components and Interfaces

### TarotCard

Role reveal card with role-specific styling.

```typescript
type TarotCardVariant =
    | "wolf"
    | "seer"
    | "mason"
    | "villager"
    | "backup-seer"
    | "dead";

type TarotCardProps = {
    variant: TarotCardVariant;
    role: PlayerRole;
    sigil: ReactNode;
    children: ReactNode;
    className?: string;
};
```

**Styling by variant:**

- `wolf`: Blood-red border (#dc2626), claw mark corner accent, subtle red glow
- `seer`: Violet border (#6d28d9), silver eye sigil, purple glow
- `mason`: Gold border (#d6a84f), stone/lodge icon
- `villager`: Ember border (#f97316), lantern icon
- `dead`: Grayed parchment, ghost overlay, cross icon

### PhaseScene

Atmospheric background container for TV and landing.

```typescript
type PhaseSceneVariant = "waiting" | "night" | "day" | "voting" | "game-over";

type PhaseSceneProps = {
    variant: PhaseSceneVariant;
    children: ReactNode;
    className?: string;
};
```

**Visual by variant:**

- `waiting`: Village silhouette under moon, drifting fog
- `night`: Black forest, large glowing moon, dense fog
- `day`: Crimson dawn gradient, amber torchlight
- `voting`: Dark wood tribunal texture, candle glow
- `game-over`: Prophecy styling based on winner (gold for villagers, blood for wolves)

### CountdownTimer

Large timer with visual urgency states.

```typescript
type CountdownTimerProps = {
    seconds: number;
    total: number;
    variant?: "default" | "urgent" | "critical";
    className?: string;
};
```

**States:**

- `default` (> 30s): Parchment background, gold numbers
- `urgent` (10-30s): Amber glow, subtle pulse
- `critical` (< 10s): Red glow, faster pulse

### CompactList

Space-efficient list for players/actions.

```typescript
type CompactListProps = {
    items: Array<{
        id: string;
        label: string;
        subtitle?: string;
        status?: "alive" | "dead" | "active" | "inactive";
    }>;
    variant?: "roster" | "actions" | "presence";
    className?: string;
};
```

**Layout:**

- Inline flex-wrap for small lists (≤ 6 items)
- Two-column grid for medium lists (7-12 items)
- Scrollable single column with max-height for large lists

### ParchmentBox

Textured container for content sections.

```typescript
type ParchmentBoxProps = {
    children: ReactNode;
    variant?: "aged" | "fresh" | "sealed";
    className?: string;
};
```

### RitualSeal

Decorative wax seal element.

```typescript
type RitualSealProps = {
    variant: "blood" | "gold" | "silver";
    size?: "sm" | "md" | "lg";
    className?: string;
};
```

### AutoDismissMessage

Notification that auto-dismisses.

```typescript
type AutoDismissMessageProps = {
    message: string;
    severity: "info" | "warning" | "error" | "success";
    onDismiss: () => void;
    duration?: number; // default 5000ms
};
```

## Data Models

No new data models needed. The UI transforms existing `GameState`, `PlayerPrivateState`, and `PublicGameState` into visual representations.

## Layout Specifications

### Landing Page (`/`)

```
┌────────────────────────────────────────────────────┐
│  [Moon glow top-right]                             │
│  [Drifting fog layer]                              │
│  [Forest silhouette bottom]                        │
│                                                    │
│     WGMS                                           │
│     Werewolf Game Management System                │
│     [Atmospheric tagline]                          │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ TAROT    │ │ TAROT    │ │ TAROT    │          │
│  │ Host     │ │ Player   │ │ TV       │          │
│  │ [icon]   │ │ [icon]   │ │ [icon]   │          │
│  │ desc     │ │ desc     │ │ desc     │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Host Grimoire (`/host`)

```
┌────────────────────────────────────────────────────┐
│  [< Back]    ROOM: VILLA    [Lock]                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  CURRENT PHASE                               │ │
│  │  "The Hunt Begins" (Night)                   │ │
│  │                                              │ │
│  │  [PRIMARY ACTION BUTTON - Full Width]        │ │
│  │                                              │ │
│  │  [Phase-specific summary - compact]          │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌─────────────────────┐ ┌─────────────────────┐  │
│  │ Village Ledger      │ │ Hourglass           │  │
│  │ [Compact roster]    │ │ [Timer]             │  │
│  │                     │ │ [Player count]      │  │
│  └─────────────────────┘ └─────────────────────┘  │
│                                                    │
│  [Summoning Links - collapsed by default]          │
│  [Advanced Tools - collapsed by default]           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Phase-specific visibility:**

| Phase     | Primary Action | Secondary Panels                       | Hidden                |
| --------- | -------------- | -------------------------------------- | --------------------- |
| WAITING   | Start Game     | QR + Links, Player count               | Advanced tools        |
| NIGHT     | Advance to Day | Wolf target summary, Timer             | Links, Roster details |
| DAY       | Open Voting    | Last killed, Timer                     | Links                 |
| VOTING    | Resolve Vote   | Vote summary (compact), Not voted list | Links                 |
| GAME_OVER | New Game       | Winner display                         | Most panels           |

### Player Role Scroll (`/play`)

```
┌────────────────────────────────────────────────────┐
│  [< Back]    VILLA · Day 1                         │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │         ┌─────────────────┐                  │ │
│  │         │   TAROT CARD    │                  │ │
│  │         │   [Role Sigil]  │                  │ │
│  │         │   WEREWOLF      │                  │ │
│  │         │   Alive         │                  │ │
│  │         └─────────────────┘                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [Status message in parchment box]                 │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ ACTION REQUIRED (if applicable)              │ │
│  │ [Compact target buttons - inline]            │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [OR] Sleeping... Remain silent.                   │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Role-specific card styling:**

| Role        | Border Color   | Accent        | Sigil          | Glow   |
| ----------- | -------------- | ------------- | -------------- | ------ |
| ALPHA_WOLF  | Blood red      | Claw marks    | Wolf head      | Red    |
| WEREWOLF    | Blood red      | Claw marks    | Wolf head      | Red    |
| SEER        | Violet         | Silver trim   | Eye            | Purple |
| BACKUP_SEER | Violet (muted) | Silver trim   | Eye (closed)   | Purple |
| MASON       | Gold           | Stone texture | Triangle/Lodge | Gold   |
| VILLAGER    | Ember orange   | Lantern       | Star           | Amber  |
| Dead (any)  | Gray           | Ghost overlay | Cross          | None   |

### TV Omen Board (`/tv`)

```
┌────────────────────────────────────────────────────┐
│  [Admin bar - collapsed, expand on hover]          │
│  [Room: VILLA] [Load] [Audio] [Fullscreen]         │
├────────────────────────────────────────────────────┤
│                                                    │
│  [PHASE-SCENE BACKGROUND - Full viewport]         │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │      THE HUNT BEGINS                         │ │
│  │      Night Phase · Day 1                     │ │
│  │                                              │ │
│  │      [HOURGLASS TIMER - Large]               │ │
│  │              180                             │ │
│  │                                              │ │
│  │  ┌────────────────┐ ┌────────────────────┐  │ │
│  │  │ Last killed    │ │ Village Tribunal   │  │ │
│  │  │ None           │ │ [Player chips]     │  │ │
│  │  └────────────────┘ └────────────────────┘  │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  [Forest silhouette with fog]                      │
│                                                    │
└────────────────────────────────────────────────────┘
```

## CSS Enhancements

### New Utility Classes

```css
/* Tarot card base */
.tarot-card {
    border-width: 2px;
    border-style: solid;
    background: linear-gradient(
        145deg,
        rgba(216, 199, 163, 0.11),
        rgba(5, 3, 5, 0.72)
    );
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    position: relative;
    overflow: hidden;
}

.tarot-card::before {
    /* Corner accent decoration */
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 3rem;
    height: 3rem;
}

/* Phase scenes */
.phase-scene-waiting {
    background: linear-gradient(180deg, #0d0a12 0%, #10170f 50%, #050305 100%);
}

.phase-scene-night {
    background: linear-gradient(180deg, #050305 0%, #0d0a12 30%, #10170f 100%);
}

.phase-scene-day {
    background: linear-gradient(180deg, #1a0505 0%, #2d0a0a 30%, #0d0a12 100%);
}

.phase-scene-voting {
    background: linear-gradient(180deg, #0d0a12 0%, #1a0f05 50%, #050305 100%);
}

/* Compact list */
.compact-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.compact-item {
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
}

/* Timer urgency */
.timer-urgent {
    animation: timer-pulse 1s ease-in-out infinite;
}

.timer-critical {
    animation: timer-pulse 0.5s ease-in-out infinite;
}

/* Auto-dismiss message */
.message-enter {
    animation: message-slide-in 0.3s ease-out;
}

.message-exit {
    animation: message-slide-out 0.3s ease-in forwards;
}
```

### Animation Keyframes

```css
@keyframes timer-pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.7;
    }
}

@keyframes message-slide-in {
    from {
        transform: translateY(-1rem);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes message-slide-out {
    from {
        transform: translateY(0);
        opacity: 1;
    }
    to {
        transform: translateY(-1rem);
        opacity: 0;
    }
}

@keyframes card-glow {
    0%,
    100% {
        box-shadow: 0 0 20px rgba(214, 168, 79, 0.3);
    }
    50% {
        box-shadow: 0 0 40px rgba(214, 168, 79, 0.5);
    }
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Progressive Disclosure Default State

_For any_ route initial load, advanced/admin sections SHALL be collapsed by default.

**Validates: Requirements 2.3, 4.9, 5.1**

### Property 2: Single Primary Action Per Phase

_For any_ game phase on the host route, exactly one primary action SHALL be prominently displayed.

**Validates: Requirements 2.2, 2.8, 2.9**

### Property 3: Auto-Dismiss Messages

_For any_ non-critical message displayed, it SHALL dismiss automatically after the specified duration or be manually dismissible.

**Validates: Requirements 5.5**

### Property 4: Timer Urgency States

_For any_ countdown timer with `seconds` remaining and `total` duration, the urgency variant SHALL be:

- `default` when seconds > 30
- `urgent` when 10 < seconds ≤ 30
- `critical` when seconds ≤ 10

**Validates: Requirements 2.5, 7.6**

### Property 5: Tarot Card Variant Mapping

_For any_ player with role `r` and alive status `a`, the TarotCard variant SHALL be:

- `dead` if `a` is false (regardless of role)
- `wolf` if `a` is true and `r` is `ALPHA_WOLF` or `WEREWOLF`
- `seer` if `a` is true and `r` is `SEER`
- `backup-seer` if `a` is true and `r` is `BACKUP_SEER`
- `mason` if `a` is true and `r` is `MASON`
- `villager` if `a` is true and `r` is `VILLAGER`

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 6: Phase Scene Variant Mapping

_For any_ game status `s`, the PhaseScene variant SHALL be:

- `waiting` if `s` is `WAITING`
- `night` if `s` is `NIGHT_PHASE`
- `day` if `s` is `DAY_PHASE`
- `voting` if `s` is `VOTING_PHASE`
- `game-over` if `s` is `GAME_OVER`

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 7: Landing Page Structure

_For any_ render of the landing page, it SHALL contain exactly 3 navigation tarot cards with labels "Host", "Player", and "TV", plus atmospheric elements (moon sigil, fog, forest silhouette).

**Validates: Requirements 1.1, 1.2, 1.5**

### Property 8: Player Action Visibility

_For any_ player with role `r`, alive status `a`, and game phase `p`, action buttons SHALL only be shown when:

- Phase is `NIGHT_PHASE` AND player is alive AND (player is wolf OR player is seer/backup-seer)
- Phase is `VOTING_PHASE` AND player is alive

**Validates: Requirements 3.7, 3.8**

### Property 9: Village Ledger Terminology

_For any_ host route render, the player roster section SHALL use the label "Village Ledger" and not "Durable Roster" or "Roster".

**Validates: Requirements 2.4**

### Property 10: Hidden JSON State

_For any_ route in normal operation, raw JSON game state SHALL NOT be visible in the main UI area (only in collapsed advanced section).

**Validates: Requirements 5.2**

### Property 11: Accessibility - Reduced Motion

_For any_ user agent with `prefers-reduced-motion: reduce`, CSS animations with class `fantasy-*` SHALL be disabled.

**Validates: Requirements 7.7, 8.2**

### Property 12: Touch Target Minimum Size

_For any_ interactive button element, the clickable area SHALL be at least 44x44 pixels.

**Validates: Requirements 8.4**

## Error Handling

### Missing Supabase Config

Display a themed notice (not browser alert) at the top of the page. The notice should use parchment styling and be dismissible.

### Network Errors

Show auto-dismissing error messages with the `error` severity. Don't block the UI for recoverable errors.

### Invalid Room State

If game state is corrupted or missing, show a graceful fallback UI with a "Reset Room" option in the collapsed admin section.

## Testing Strategy

### Unit Tests

- TarotCard renders correct variant styling
- CountdownTimer shows correct urgency state
- CompactList renders different layouts based on item count
- AutoDismissMessage dismisses after duration
- Phase variant mapping functions

### Property-Based Tests

- Phase-relevance filtering (given any game state, verify only relevant elements shown)
- Timer urgency calculation (given any seconds value, verify correct variant)
- Role-to-variant mapping (given any role/alive combination, verify correct card variant)

### Visual Regression Tests (Optional)

- Screenshot comparisons for each route phase combination
- Tarot card variants side-by-side

### Accessibility Tests

- Contrast ratio validation
- Focus order verification
- prefers-reduced-motion behavior
- Touch target size verification
