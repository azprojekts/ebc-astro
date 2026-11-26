# Everest Base Camp Trek Guide — Astro + Cloudflare

Statiska vietne `everestbasecamptrekguide.com`: Astro 7, izvietota uz Cloudflare Workers (static assets, bez adaptera).

## Komandas
| Komanda | Ko dara |
|---|---|
| `npm install` | uzstāda atkarības (Node ≥ 22.23.4, sk. `.node-version`) |
| `npm run dev` | lokāls izstrādes serveris http://localhost:4321 |
| `npm run build` | būvē `dist/` |
| `npm run preview` | būvē un palaiž lokāli ar Wrangler (tāpat kā Cloudflare) |
| `python3 scripts/build_redirects.py` | ģenerē `public/_redirects` no `src/data/legacy.json` |

## Struktūra
- `src/content/posts/<slug>/index.md` — 20 ieraksti un lapa 1:1 no WordPress, attēli blakus. URL = `/<slug>/`.
- Frontmatter `notice: archived | medical | none` — brīdinājuma josla raksta augšā (`none` = izslēgta).
- `src/pages/[slug].astro` — ieraksti un kategoriju arhīvi saknē (kā WordPress); `tag/[slug].astro` — birkas.
- `src/pages/tools/` — augstuma profils un izmaksu kalkulators (kalkulators `noindex`, līdz cenas pārbaudītas).
- `src/lib/route.ts` — maršruta augstumi; `src/lib/site.ts` — kopīgie iestatījumi (GA4 ID, centri).
- `public/wp-content/`, `public/img/` — oriģinālie attēli vecajos URL (saites un Google Images nesalūzt).
- `public/_redirects`, `public/_headers` — Cloudflare pāradresācijas un galvenes.
- `scripts/export_wp.py` — vienreizējais eksports no WordPress REST API (vēsturei).

## Izvietošana
Cloudflare Workers Builds: build `npm run build`, deploy `npx wrangler deploy` (konfigurācija `wrangler.jsonc`).
