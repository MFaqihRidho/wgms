# Requirements Document

## Introduction

This spec defines the dark fantasy UI overhaul for WGMS. The current implementation has the right color palette but lacks immersive theming, has cluttered layouts, and shows unnecessary information. This redesign will transform all routes into a cohesive, atmospheric werewolf ritual experience while improving UX through progressive disclosure and cleaner layouts.

## Glossary

- **Grimoire**: The moderator's spellbook-style control interface
- **Tarot Card**: Role reveal card styled like tarot/scroll with role-specific iconography
- **Omen Board**: Public TV display showing village tribunal state
- **Village Ledger**: The roster of players (formerly "Durable Roster")
- **Hourglass**: Timer component styled as ancient hourglass
- **Summoning Links**: Room join links (formerly "Room Links")
- **Omen Log**: Event ticker (formerly "Ticker Feed")
- **Ritual State**: Game state display (formerly "Game State")
- **Apparitions**: Connected presence (formerly "Presence")
- **Sigil**: Role-specific icon/glyph

## Requirements

### Requirement 1: Landing Page Transformation

**User Story:** As a player approaching the game, I want to feel immersed in a moonlit village gateway, so that the mood is set before I even join a room.

#### Acceptance Criteria

1. WHEN a user visits the root path THEN THE System SHALL display a moonlit village gateway with atmospheric background (deep night gradient, moon glow, forest silhouette)
2. WHEN the landing page renders THEN THE System SHALL show three tarot-card-style navigation options for Host, Player, and TV
3. WHEN a user hovers over a tarot card THEN THE System SHALL apply a subtle glow and lift animation
4. THE Landing Page SHALL use dark fantasy terminology and mood-setting copy instead of technical descriptions
5. WHEN the landing page displays THEN THE System SHALL show decorative elements (moon sigil, drifting fog, forest silhouette)

### Requirement 2: Host Grimoire Redesign

**User Story:** As a moderator, I want a clean grimoire-style interface with progressive disclosure, so that I can focus on the current phase without visual clutter.

#### Acceptance Criteria

1. WHEN the host loads a room THEN THE System SHALL display a grimoire-styled header with room code as a ritual identifier
2. WHEN the host views the interface THEN THE System SHALL show ONLY the primary action for the current phase prominently
3. WHEN the host needs advanced controls THEN THE System SHALL hide them behind an expandable section by default
4. WHEN displaying the player roster THEN THE System SHALL use "Village Ledger" terminology and parchment styling
5. WHEN the host views the timer THEN THE System SHALL display it as an hourglass-style countdown with visual urgency
6. WHEN the host views phase information THEN THE System SHALL use ritual terminology (Night Phase = "The Hunt Begins", Day Phase = "The Village Awakens", Voting = "The Tribunal Convenes")
7. WHEN displaying room links THEN THE System SHALL label them as "Summoning Links" with a compact, copyable format
8. WHEN the game is in WAITING phase THEN THE System SHALL prominently show the QR code and player count, hiding advanced tools
9. WHEN the game is active THEN THE System SHALL hide the room setup panel and show only relevant phase controls

### Requirement 3: Player Role Scroll

**User Story:** As a player, I want my phone screen to feel like a secret role scroll with tarot-style reveal, so that I'm immersed in my character.

#### Acceptance Criteria

1. WHEN a player views their role THEN THE System SHALL display it as a tarot-card with role-specific styling and iconography
2. WHEN a werewolf views their role card THEN THE System SHALL apply blood-red borders, claw mark accents, and wolf sigil
3. WHEN a seer views their role card THEN THE System SHALL apply violet-silver borders, eye sigil, and mystical styling
4. WHEN a mason views their role card THEN THE System SHALL apply gold borders, stone/lodge sigil
5. WHEN a villager views their role card THEN THE System SHALL apply ember/lantern styling with warm accents
6. WHEN a player dies THEN THE System SHALL apply ashen ghost styling to their role card
7. WHEN a player needs to take action THEN THE System SHALL show ONLY the relevant action buttons for their role and phase
8. WHEN a player is in night phase with no actions THEN THE System SHALL display a "sleeping" state with atmospheric messaging
9. WHEN displaying target options THEN THE System SHALL use compact, parchment-styled buttons instead of full-width cards
10. WHEN a player's role card is visible THEN THE System SHALL provide a toggle button to blur and hide the role details so nearby observers cannot see it
11. WHEN the role is blurred THEN THE System SHALL display an obscured overlay over the role card and hide the role name and sigil
12. WHEN the player taps the toggle again THEN THE System SHALL reveal the role card and remove the blur overlay
13. WHEN a player has joined a room and is waiting for game state THEN THE System SHALL display a loading spinner with atmospheric messaging instead of a blank state
14. WHEN a player has an active session THEN THE System SHALL collapse the session info panel by default and allow the player to expand it to see room/name details and clear session
15. WHEN a seer receives their vision result THEN THE System SHALL display it in a full-screen dramatic modal overlay with the target name and result, dismissible by tap
16. WHEN wolves submit their night target THEN THE System SHALL display the current wolf poll in a modal overlay rather than inline in the main panel, dismissible by tap
17. WHEN the game ends THEN THE System SHALL display a personalised outcome — "Victory" if the player's faction won, "Defeat" if their faction lost — instead of showing the raw winner faction name
18. WHEN the seer inspects a player and the result is displayed THEN THE System SHALL use "Villager" instead of "WARGA" as the human-readable label for a non-werewolf result

### Requirement 4: TV Omen Board

**User Story:** As a villager watching the TV, I want an atmospheric omen board that sets the mood for each phase, so that everyone feels the tension of the game.

#### Acceptance Criteria

1. WHEN the TV displays WAITING phase THEN THE System SHALL show a village-under-moon scene with atmospheric fog
2. WHEN the TV displays NIGHT phase THEN THE System SHALL show a black forest scene with glowing moon and drifting fog
3. WHEN the TV displays DAY phase THEN THE System SHALL show a crimson dawn gradient with warm lighting
4. WHEN the TV displays VOTING phase THEN THE System SHALL show a tribunal board aesthetic
5. WHEN the TV displays GAME_OVER THEN THE System SHALL show a prophecy fulfilled styling with winner announcement
6. WHEN displaying players THEN THE System SHALL show a compact village tribunal layout (alive = present, dead = crossed out/ghosted)
7. WHEN displaying the timer THEN THE System SHALL use large, glowing numbers visible from distance
8. WHEN displaying vote progress THEN THE System SHALL show only the count, not individual votes
9. THE TV SHALL hide technical controls (room input, load button) into a collapsed admin bar at the top
10. WHEN the TV displays WAITING phase and a room code is loaded THEN THE System SHALL show a QR code encoding the player join URL so players can scan and join directly from the TV screen

### Requirement 5: Progressive Disclosure & Layout Cleanup

**User Story:** As any user, I want to see only what's relevant to my current context, so that the interface feels clean and purposeful.

#### Acceptance Criteria

1. WHEN on any route THEN THE System SHALL hide advanced/admin tools by default behind an expandable section
2. WHEN displaying state information THEN THE System SHALL show only human-readable summaries, not raw JSON
3. WHEN a section is not relevant to the current phase THEN THE System SHALL hide it completely rather than disabling it
4. WHEN displaying lists of players or actions THEN THE System SHALL use compact, scannable layouts
5. WHEN displaying success/error messages THEN THE System SHALL auto-dismiss after 5 seconds or be dismissible
6. WHEN showing phase transitions THEN THE System SHALL provide clear, atmospheric feedback without technical jargon

### Requirement 6: Shared Fantasy Components

**User Story:** As a developer, I want reusable fantasy-styled components, so that the UI remains consistent and maintainable across routes.

#### Acceptance Criteria

1. THE System SHALL provide a TarotCard component with role-specific variants (wolf, seer, mason, villager, dead)
2. THE System SHALL provide a RitualSeal decorative component for wax seal styling
3. THE System SHALL provide a MoonSigil component with glow animation
4. THE System SHALL provide a ParchmentBox container with textured background
5. THE System SHALL provide a PhaseScene component that renders phase-specific atmospheric backgrounds
6. THE System SHALL provide a CountdownTimer component with hourglass/ember styling
7. THE System SHALL provide a CompactList component for space-efficient player/action lists

### Requirement 7: Animation & Atmosphere

**User Story:** As a user, I want subtle animations that enhance the dark fantasy mood without being distracting, so that the interface feels alive and immersive.

#### Acceptance Criteria

1. WHEN the moon is visible THEN THE System SHALL apply a slow pulse glow animation
2. WHEN fog is displayed THEN THE System SHALL apply a slow drift animation
3. WHEN a tarot card is hovered THEN THE System SHALL apply a lift and glow effect
4. WHEN a button is hovered THEN THE System SHALL apply a subtle ember glow
5. WHEN phase transitions occur THEN THE System SHALL apply a brief atmospheric transition (fade, color shift)
6. WHEN the timer is below 30 seconds THEN THE System SHALL apply urgency animation (pulse, glow intensification)
7. All animations SHALL respect prefers-reduced-motion for accessibility

### Requirement 8: Accessibility Compliance

**User Story:** As a player with accessibility needs, I want the dark fantasy theme to remain readable and usable, so that I can participate fully.

#### Acceptance Criteria

1. WHEN displaying text THEN THE System SHALL maintain WCAG AA contrast ratios (4.5:1 for body, 3:1 for large text)
2. WHEN a user has prefers-reduced-motion enabled THEN THE System SHALL disable decorative animations
3. WHEN displaying interactive elements THEN THE System SHALL maintain visible focus outlines
4. WHEN displaying buttons THEN THE System SHALL maintain minimum touch targets (44x44px)
5. THE TV display SHALL use font sizes readable from 3+ meters distance
6. WHEN using color to convey state THEN THE System SHALL also use icons or text labels

### Requirement 9: Game Start Phase

**User Story:** As a moderator, I want the game to begin with a Day Phase so players can introduce themselves before the first night, so that the game flow feels natural and social.

#### Acceptance Criteria

1. WHEN the host starts a new game THEN THE System SHALL set the initial game status to DAY_PHASE instead of NIGHT_PHASE
2. WHEN the game starts on DAY_PHASE THEN THE System SHALL set day_count to 1
3. WHEN the host advances from the first day THEN THE System SHALL transition to NIGHT_PHASE as normal
