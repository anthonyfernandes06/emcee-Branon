# Branon, your friendly neighbourhood Mangalorean host

A one-page Astro site. Static output, no UI framework, about 1.5 KB of JS (gzipped).

## Run it

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # grades photos (if originals are present), then builds to dist/
npm run preview    # serve dist/
```

## Before launch: fill the placeholders

Everything lives in `src/content/site.ts`. Search it for `TODO:`.

| What | Where in site.ts |
|---|---|
| Email, phone | `contact.email`, `contact.phone` |
| WhatsApp | `contact.whatsapp`, then `flags.showWhatsApp = true` |
| Testimonials | `kindWords.items[].quote` (leave `null` until the real words arrive) |
| Service area | `serviceArea` (flows into the hero, the details strip, meta and JSON-LD) |
| Café photo | `flags.useCafeImage` (set `false` if it isn't one of Branon's events) |
| Live domain | `meta.siteUrl` (Vercel's production URL is used until then) |
| Hero video | `hero.heroVideo` (put the file in `public/`) |
| Glimpse video | `glimpseVideo` (B becomes a video tile, C becomes a Polaroid) |

## Adding a photo

1. Put the original in `assets-src/` and add a line to `SOURCES` in `scripts/prepare-images.mjs`.
   JPEG, PNG, WebP and TIFF work anywhere; camera RAW (.CR2 etc.) is converted with macOS `sips`.
   Add `violet: false` unless the photo has purple LED ceiling light, so real blues and purples survive the grade.
2. Run `npm run images`. It applies the shared warm grade, strips EXIF/GPS, writes
   `src/assets/<name>.jpg`, and refreshes `assets-src/_grade-check.jpg` (before/after sheet).
3. Add its alt text to `alt` in `site.ts` and point a slot at it by name.

To fill the wedding or anniversary card, change its `variant` from `"empty"` to `"mini"` and add a `photo`.

Each slot takes `focal` (CSS object-position) and an optional `zoom` that crops in around it.

## Deploying (Vercel)

Vercel detects Astro; no `vercel.json` is needed. The originals in `assets-src/` are git-ignored
(they're large), so commit the graded masters in `src/assets/`. The build reuses them when the
originals aren't there.
