# Deployment

WGMS is a Vite static app.

## Build

```bash
npm run build
```

Output directory:

```text
dist
```

## Required Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Do not deploy service role keys to the frontend.

## Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Add the two `VITE_SUPABASE_*` env vars.

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Add the two `VITE_SUPABASE_*` env vars.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Add the two `VITE_SUPABASE_*` env vars.

## Supabase

Run `supabase/schema.sql` for a fresh database.

If upgrading an older WGMS database, run `supabase/phase-5-8-migration.sql`.

## Browser Notes

- TV audio requires a user gesture through the Enable Audio button.
- Fullscreen and Wake Lock are best-effort browser APIs.
- Realtime depends on Supabase Broadcast and Presence availability.
