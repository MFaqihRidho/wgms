# Implementation Plan: Dark Fantasy UI Overhaul

## Overview

Transform WGMS from a functional game controller into an immersive dark fantasy experience. Implementation follows a bottom-up approach: first build the reusable components, then apply them to routes starting with the simplest (landing) and progressing to the most complex (host).

## Tasks

- [x]   1. Set up CSS foundations and animations
    - Add new CSS utility classes (tarot-card, phase-scene-\*, compact-list, timer urgency)
    - Add animation keyframes (timer-pulse, message-slide, card-glow)
    - Add reduced-motion media query support
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7_

- [x]   2. Build base fantasy components
    - [x] 2.1 Create TarotCard component with role-specific variants
        - Implement variants: wolf, seer, mason, villager, backup-seer, dead
        - Add role sigil icons
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

    - [x] 2.2 Write property test for TarotCard variant mapping
        - **Property 5: Tarot Card Variant Mapping**
        - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

    - [x] 2.3 Create PhaseScene component with atmospheric backgrounds
        - Implement variants: waiting, night, day, voting, game-over
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    - [x] 2.4 Write property test for PhaseScene variant mapping
        - **Property 6: Phase Scene Variant Mapping**
        - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

    - [x] 2.5 Create CountdownTimer component with urgency states
        - Implement default, urgent, critical variants
        - _Requirements: 2.5, 7.6_

    - [x] 2.6 Write property test for CountdownTimer urgency
        - **Property 4: Timer Urgency States**
        - **Validates: Requirements 2.5, 7.6**

    - [x] 2.7 Create CompactList component for space-efficient lists
        - Support inline, grid, and scrollable layouts
        - _Requirements: 5.4_

    - [x] 2.8 Create AutoDismissMessage component
        - Implement auto-dismiss with configurable duration
        - Add enter/exit animations
        - _Requirements: 5.5_

    - [x] 2.9 Create ParchmentBox and RitualSeal decorative components
        - Add texture and seal styling
        - _Requirements: 6.2, 6.4_

- [x]   3. Checkpoint - Verify base components work
    - Run tests, verify components render correctly in isolation

- [-] 4. Redesign landing page
    - [x] 4.1 Transform HomeRoute into moonlit village gateway
        - Add atmospheric background with moon, fog, forest
        - Create three tarot-style navigation cards
        - Update copy to dark fantasy terminology
        - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

    - [x] 4.2 Write property test for landing page structure
        - **Property 7: Landing Page Structure**
        - **Validates: Requirements 1.1, 1.2, 1.5**

- [-] 5. Redesign player route
    - [x] 5.1 Implement tarot-style role card in PlayRoute
        - Replace current role display with TarotCard component
        - Add role-specific styling and iconography
        - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

    - [x] 5.2 Implement progressive disclosure for player actions
        - Show only relevant action buttons for role/phase
        - Add sleeping state for non-action players
        - Use compact target buttons instead of full-width cards
        - _Requirements: 3.7, 3.8, 3.9_

    - [x] 5.3 Write property test for player action visibility
        - **Property 8: Player Action Visibility**
        - **Validates: Requirements 3.7, 3.8**

    - [x] 5.4 Clean up player layout and terminology
        - Use parchment styling for status messages
        - Auto-dismiss non-critical messages
        - _Requirements: 5.4, 5.5_

- [x]   6. Redesign TV route
    - [x] 6.1 Implement phase-specific atmospheric scenes
        - Apply PhaseScene component
        - Add phase-appropriate backgrounds and overlays
        - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

    - [x] 6.2 Implement compact village tribunal layout
        - Use CompactList for player display
        - Show alive/dead status with visual distinction
        - _Requirements: 4.6_

    - [x] 6.3 Implement large countdown timer
        - Use CountdownTimer component with urgency styling
        - _Requirements: 4.7_

    - [x] 6.4 Hide technical controls into collapsed admin bar
        - Move room input, load button into expandable section
        - Show only essential controls by default
        - _Requirements: 4.9, 5.1_

- [x]   7. Checkpoint - Verify TV and Player routes
    - Run tests, verify both routes work correctly

- [x]   8. Redesign host route
    - [x] 8.1 Implement grimoire-styled header
        - Update terminology to ritual language
        - Show room code as ritual identifier
        - _Requirements: 2.1, 2.4, 2.6, 2.7_

    - [x] 8.2 Implement single primary action display
        - Show only one prominent action button per phase
        - Hide non-relevant controls
        - _Requirements: 2.2, 2.8, 2.9, 5.3_

    - [x] 8.3 Write property test for single primary action
        - **Property 2: Single Primary Action Per Phase**
        - **Validates: Requirements 2.2, 2.8, 2.9**

    - [x] 8.4 Implement progressive disclosure for host
        - Collapse advanced tools by default
        - Collapse summoning links by default
        - Hide raw JSON in collapsed section
        - _Requirements: 2.3, 5.1, 5.2_

    - [x] 8.5 Write property test for progressive disclosure
        - **Property 1: Progressive Disclosure Default State**
        - **Property 10: Hidden JSON State**
        - **Validates: Requirements 2.3, 4.9, 5.1, 5.2**

    - [x] 8.6 Implement Village Ledger roster
        - Use CompactList component
        - Apply parchment styling
        - _Requirements: 2.4, 5.4_

    - [x] 8.7 Implement hourglass timer display
        - Use CountdownTimer component
        - Add to main phase panel
        - _Requirements: 2.5_

    - [x] 8.8 Write property test for terminology
        - **Property 9: Village Ledger Terminology**
        - **Validates: Requirements 2.4**

- [-] 9. Accessibility polish
    - [x] 9.1 Add prefers-reduced-motion support
        - Disable decorative animations when user prefers reduced motion
        - _Requirements: 7.7, 8.2_

    - [x] 9.2 Write property test for reduced motion
        - **Property 11: Accessibility - Reduced Motion**
        - **Validates: Requirements 7.7, 8.2**

    - [x] 9.3 Verify touch target sizes
        - Ensure all buttons are at least 44x44px
        - _Requirements: 8.4_

    - [x] 9.4 Write property test for touch targets
        - **Property 12: Touch Target Minimum Size**
        - **Validates: Requirements 8.4**

- [x]   10. Final checkpoint
    - Run all tests (`npm test`)
    - Run build (`npm run build`)
    - Run E2E smoke test (`npx playwright test tests/e2e/smoke.spec.ts`)
    - Manual QA: verify all routes render correctly with dark fantasy styling

- [ ]   11. Player role blur/hide toggle
    - [x] 11.1 Add role visibility toggle to PlayRoute RolePanel
        - Add `roleVisible` boolean state, defaulting to `true`
        - Render a toggle button ("Hide Role" / "Reveal Role") above the TarotCard
        - WHEN `roleVisible` is false, apply a blur overlay and hide role name/sigil on the TarotCard
        - _Requirements: 3.10, 3.11, 3.12_

    - [ ]\* 11.2 Write property test for role blur toggle
        - **Property 13: Role Blur Toggle**
        - For any player state, toggling the hide button should blur the card; toggling again should reveal it
        - **Validates: Requirements 3.10, 3.11, 3.12**

- [ ]   12. TV waiting QR code
    - [x] 12.1 Add QR code display to TvRoute WAITING phase
        - Install or use a lightweight QR code library (e.g. `qrcode.react`)
        - WHEN status is `WAITING` and `roomCode` is set, render a QR code encoding `{origin}/play?room={roomCode}`
        - Display the QR code prominently in the center of the waiting scene with a "Scan to Join" label
        - _Requirements: 4.10_

    - [ ]\* 12.2 Write property test for QR code presence
        - **Property 14: TV Waiting QR Code**
        - For any loaded room code in WAITING phase, the TV display should contain a QR code element
        - **Validates: Requirements 4.10**

- [ ]   13. Fix game start phase (Day first)
    - [x] 13.1 Change `startGame` in game-engine.ts to begin on DAY_PHASE
        - Update `startGame` to set `status: 'DAY_PHASE'` instead of `'NIGHT_PHASE'`
        - Keep `day_count: 1`
        - Update any host route primary action copy for the initial day phase
        - _Requirements: 9.1, 9.2, 9.3_

    - [ ]\* 13.2 Write property test for game start phase
        - **Property 15: Game Starts on Day Phase**
        - For any valid set of player names, `startGame` should return a state with `status === 'DAY_PHASE'`
        - **Validates: Requirements 9.1, 9.2**

- [x]   14. Final checkpoint after new features
    - Run all tests (`npm test`)
    - Verify player blur toggle works on mobile viewport
    - Verify QR code renders on TV waiting screen
    - Verify game starts on Day Phase

- [ ]   15. Player screen UX polish
    - [x] 15.1 Add loading spinner to PlayRoute
        - Add `loading` boolean state, set to `true` while hydrating/subscribing
        - WHEN loading is true and session exists, show an atmospheric spinner with "Awaiting the omens..." copy
        - Set loading to false once first player state is received or on error
        - _Requirements: 3.13_

    - [x] 15.2 Collapse session info panel by default
        - Replace always-visible session parchment box with a collapsed header strip showing room · name
        - Add expand/collapse toggle to reveal full session details and "Clear session" button
        - Default to collapsed once session is active
        - _Requirements: 3.14_

    - [x] 15.3 Add seer vision modal
        - WHEN seer receives `inspected_target` and `seer_result`, show a full-screen modal overlay
        - Modal shows target name and result label ("Villager" or "Werewolf") with dramatic styling
        - Modal is dismissible by tapping anywhere or a close button
        - Replace the inline seer result ParchmentBox with the modal (remove duplicate display)
        - _Requirements: 3.15, 3.18_

    - [x] 15.4 Add wolf poll modal
        - WHEN wolf poll data is present, show it in a modal overlay instead of inline
        - Modal shows current vote tally with atmospheric wolf styling
        - Modal is dismissible by tapping anywhere or a close button
        - Remove the inline wolf poll ParchmentBox to eliminate duplicate display
        - _Requirements: 3.16_

    - [x] 15.5 Personalise game over display
        - Determine if the current player's faction matches the winner
        - WHEN player's faction won, show "Victory" with gold/triumphant styling
        - WHEN player's faction lost, show "Defeat" with ashen/somber styling
        - _Requirements: 3.17_

    - [x] 15.6 Fix seer result language
        - Replace all "WARGA" display labels with "Villager" in PlayRoute
        - Update display mapping: `'WARGA'` → `'Villager'`, `'WEREWOLF'` → `'Werewolf'`
        - Keep internal type `'WARGA'` unchanged (game logic), only change the UI label
        - _Requirements: 3.18_

- [ ]   16. Final checkpoint
    - Run all tests (`npm test`)
    - Verify loading spinner appears on join
    - Verify session panel is collapsed by default
    - Verify seer vision modal appears and is dismissible
    - Verify wolf poll modal appears and is dismissible
    - Verify game over shows Victory/Defeat
    - Verify seer result shows "Villager" not "WARGA"

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
