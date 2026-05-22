# Dark Fantasy UI Direction

WGMS uses a dark fantasy werewolf theme: moonlit village, haunted forest, gothic parchment, blood seals, and ritual controls.

## Design Goal

The interface should feel like a werewolf ritual night in a medieval village while staying readable and fast for real gameplay.

Core mood:

- Moonlit forest
- Dark village tribunal
- Moderator grimoire
- Secret role scrolls
- Tarot-like role cards
- Blood-crimson alerts
- Silver moonlight
- Amber torchlight

## Palette

- Void: `#050305`
- Night: `#0d0a12`
- Forest: `#10170f`
- Blood: `#7f1d1d`
- Bright blood: `#dc2626`
- Moon: `#dbeafe`
- Silver: `#cbd5e1`
- Parchment: `#d8c7a3`
- Aged paper: `#8a6f45`
- Gold: `#d6a84f`
- Ember: `#f97316`
- Violet: `#6d28d9`

## Typography

- Display headings use a serif stack through `.fantasy-display`.
- Room codes and ritual counters use `.fantasy-rune`.
- Body/UI text remains system sans for clarity.

## Illustration Motifs

- `.fantasy-moon`: glowing moon sigil.
- `.fantasy-forest`: bottom haunted tree silhouette.
- `.fantasy-fog`: drifting fog overlay.
- `.fantasy-seal`: crimson wax/blood seal.
- `.role-sigil`: small role glyphs for tarot-like cards.

These are CSS-driven illustrations to avoid external asset licensing and deployment complexity.

## Route Treatment

### `/`

Landing page becomes a moonlit village gateway with three tarot cards:

- Host: Open the Grimoire
- Player: Draw Your Secret Role
- TV: Raise the Village Omen

### `/host`

Host becomes the Moderator Grimoire.

Labels:

- Durable Roster -> Village Ledger
- Presence -> Living Apparitions
- Manual Timer -> Hourglass
- Room Links -> Summoning Links
- Ticker Feed -> Omen Log
- Game State -> Ritual State

### `/play`

Player phone becomes a secret role scroll.

Role accents:

- Werewolves: blood and claw marks
- Seer: violet/silver eye
- Mason: stone/gold lodge sigil
- Villager: lantern/ember
- Dead: ashen ghost styling

### `/tv`

TV becomes the public omen board.

Phase scenes:

- Waiting: village gathers under the moon
- Night: black forest, moon, fog
- Day: crimson dawn, found-at-dawn reveal
- Voting: tribunal board and vote progress
- Game Over: prophecy fulfilled

## Accessibility Constraints

- Preserve high contrast.
- Keep player buttons large.
- Keep TV text readable from distance.
- Do not hide controls behind hover-only interactions.
- Maintain visible focus outlines.
- Keep animations subtle and slow.

## Future Asset Opportunities

If real artwork is added later, good candidates are:

- Tarot role cards
- Village skyline
- Wolf silhouette
- Parchment texture
- Moon phases
- Role icons
