# Manual QA Checklist

## Basic Setup

1. Run `npm install`.
2. Add `.env.local`.
3. Run `supabase/schema.sql`.
4. Run `npm run dev`.

## Four Player Smoke Test

1. Open `/host`.
2. Create/load room `VILLA`.
3. Open `/play` in four tabs.
4. Join four unique names.
5. Open `/tv?room=VILLA`.
6. Start game from host.
7. Confirm roles assigned.
8. Submit wolf target.
9. Submit Seer inspect if available.
10. Advance to day.
11. Confirm last killed appears.
12. Open voting.
13. Submit votes.
14. Resolve vote.
15. Refresh host, player, and TV.
16. Confirm state recovers.
17. Continue until winner.

## Host PIN

1. Create room with PIN.
2. Refresh host and confirm auto-unlock.
3. Clear localStorage.
4. Reload host and confirm PIN required.
5. Enter wrong PIN and confirm blocked.
6. Enter correct PIN and confirm unlocked.

## Verification

```bash
npm test
npm run build
```

## Final Checks

1. Open `/play?room=VILLA` and confirm room prefill.
2. Confirm host QR code opens player join URL.
3. Confirm TV voting phase shows vote progress count only.
4. Confirm TV receives public state and does not display roles.
5. Confirm player screen receives only its private role state.
6. Confirm New Game Same Players keeps names and reassigns roles.
7. Confirm TV fullscreen button works where supported.
8. Confirm audio enable/test does not crash if MP3 files are missing.
