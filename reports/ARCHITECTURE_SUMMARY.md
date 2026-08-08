# StarGazer — Codebase Architecture Summary

**Repository:** `nicolasnkGH/stargazer` (v2.9.0)  
**Purpose:** A personal, distraction-free stargazing dashboard and astronomy portal for beginners.  
**Live URL:** https://stargazer.nick-t.net

---

## 1. Directory Layout

```
stargazer/
├── api/                          # Python FastAPI backend (Google Cloud Run)
│   ├── main.py                   # FastAPI application, all route definitions
│   ├── config.py                 # Environment config + curated target data
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container image for Cloud Run
│   ├── .flake8                   # Python lint config
│   ├── .gcloudignore             # GCP deploy ignore rules
│   ├── enrich_constellations.py  # One-off data enrichment script
│   ├── engine/                   # Astronomy calculation modules
│   │   ├── __init__.py           # Re-exports all public engine functions
│   │   ├── aurora.py             # NOAA Kp-index aurora forecast
│   │   ├── bortle.py             # Bortle class estimation from coordinates
│   │   ├── cache.py              # Redis + local memory caching layer
│   │   ├── gallery.py            # Community astrophoto gallery (JSON file DB)
│   │   ├── iss.py                # ISS pass prediction via Skyfield TLE
│   │   ├── meteors.py            # Meteor shower calendar
│   │   ├── moon.py               # Moon phase, rise/set calculations
│   │   ├── moon_facts.py         # Curated moon fact cards
│   │   ├── planets.py            # Planet positions (alt/az/constellation)
│   │   ├── push.py               # Web Push (VAPID) notification engine
│   │   ├── reports.py            # Tonight/Weekly/Monthly report composers
│   │   ├── scheduler.py          # APScheduler for automated push alerts
│   │   ├── seeing.py             # AI + rule-based astronomical seeing
│   │   ├── skyfield.py           # Skyfield ephemeris initialization helpers
│   │   └── targets.py            # Deep-sky target database & filtering
│   ├── data/                     # Static JSON data
│   │   ├── targets.json          # Full deep-sky target database
│   │   ├── bortle_scale.json     # Bortle scale reference data
│   │   └── constellations_enriched.json  # Constellation metadata
│   └── engine/constellations_enriched.json  # (copy, also used by engine)
│
├── web/                          # Frontend (Cloudflare Pages / nginx)
│   ├── index.html                # Single-page app entry point
│   ├── app.js                    # Main application logic (~4857 lines)
│   ├── style.css                 # Global stylesheet
│   ├── sw.js                     # Service Worker (PWA offline caching)
│   ├── manifest.json             # PWA manifest
│   ├── planetarium.html          # Standalone interactive star map
│   ├── planetarium.js            # Star map logic
│   ├── hero-solar-system.js      # 3D WebGL solar system hero background
│   ├── gravity-well.js           # Gravity well visual effect
│   ├── moon3d.js                 # 3D Moon renderer (Three.js)
│   ├── planets3d.js              # 3D planet models (Three.js)
│   ├── css-solar-system.js       # CSS-based solar system visual
│   ├── css-solar-system.css      # Accompanying styles
│   ├── generate-og.js            # Puppeteer-based Open Graph image gen
│   ├── translations.js           # i18n: English, Spanish, Portuguese
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── og-preview.png            # Pre-generated OG image fallback
│   └── assets/                   # Static assets (images, textures)
│       ├── 2k_earth_daymap.jpg / .webp
│       ├── 2k_sun.jpg / .webp
│       ├── ai_stargazer_mascot.png / .webp
│       ├── aurora_bg.png / .webp
│       ├── bortle_scale_bg.png / .webp
│       ├── jupiter.jpg / .webp
│       ├── mars.jpg / .webp
│       ├── mercury.jpg / .webp
│       ├── moon_bump.jpg / moon_texture.jpg / moon_texture.webp
│       ├── neptune.jpg / .webp
│       ├── saturn.jpg / saturn_ring_color.jpg / saturn_ring_color.webp / saturn_ring_pattern.gif / saturn.webp
│       ├── targets/              # Target thumbnail images
│       ├── uranus.jpg / .webp
│       └── venus.jpg / .webp
│
├── tests/                        # Playwright smoke tests
│   └── smoke.spec.js
│
├── .github/workflows/pipeline.yml  # CI/CD: validate, deploy, release, rollback
├── .agents/AGENTS.md             # Git workflow rules for AI agents
├── .env.example                  # Environment variable template
├── dev-server.js                 # Local dev proxy (port 8080 → API + static)
├── docker-compose.yml            # API + nginx + Redis local stack
├── nginx.conf                    # Production nginx config (rate-limited API proxy)
├── playwright.config.js          # Playwright test configuration
├── wrangler.toml                 # Cloudflare Pages config (frontend deploy)
├── package.json                  # Node deps: puppeteer, sharp, serve, @playwright/test
├── package-lock.json
├── README.md
├── CONTRIBUTING.md
├── LICENSE                       # MIT
├── IDEA.md                       # AI agent idea file
└── .gitignore
```

---

## 2. Core Components

### 2.1 Backend API (`api/` — Python FastAPI)

**Runtime:** Python 3.11+, deployed on **Google Cloud Run** (Docker, scales-to-zero).  
**Server:** uvicorn (dev) / gunicorn (prod), port 8181.

#### Entry Points (FastAPI routes in `api/main.py`)

| Route | Method | Description |
|---|---|---|
| `/` | GET | Root — service info, location, telescope, Bortle class, endpoint list |
| `/health` | GET | Health check — returns `{"status":"ok","version":"v2.9.0"}` |
| `/tonight` | GET | **Full tonight's observing report** — conditions, moon, planets, targets |
| `/weekly` | GET | 7-day celestial event calendar |
| `/monthly` | GET | Monthly preview of celestial events |
| `/moon` | GET | Current moon phase, rise/set, illumination |
| `/planets` | GET | All planets with altitude/azimuth/direction |
| `/iss` | GET | Next ISS passes (default 3) |
| `/seeing` | GET | Rule-based astronomical seeing forecast |
| `/seeing/ai` | GET | AI-powered seeing analysis (Google Gemini / local LLM) |
| `/targets` | GET | Deep-sky target database (filtered by constellation, visibility, type, Bortle) |
| `/constellations` | GET | Constellation list with optional famous-only filter |
| `/constellation_window` | GET | Constellation visibility window (rise/set times) |
| `/api/moon` | GET | Quick moon info (illumination, phase, distance) |
| `/api/meteors` | GET | Upcoming major meteor showers (ZHR, peak dates) |
| `/api/aurora` | GET | Live aurora forecast (NOAA Kp-index) |
| `/api/bortle` | GET | Bortle light pollution class from coordinates |
| `/api/asteroids` | GET | NASA NEOs (near-earth objects) — closest 4 today |
| `/api/star` | GET | SIMBAD star database query (by name or RA/Dec) |
| `/nasa/apod` | GET | NASA Astronomy Picture of the Day (cached 24h) |
| `/nasa/space-weather` | GET | NASA DONKI space weather (CME, storms, flares — 3 days, cached 3h) |
| `/api/gallery` | GET/POST | Community astrophoto gallery listing + upload |
| `/api/gallery/image/{id}` | GET | Gallery image serving |
| `/api/gallery/counts` | GET | Gallery entry counts per target |
| `/api/gallery/image/{id}/report` | POST | Report inappropriate gallery image |
| `/api/gallery/{id}` | DELETE | Delete gallery entry |
| `/api/push/vapid-key` | GET | Return VAPID public key for push subscriptions |
| `/api/push/subscribe` | POST | Store browser push subscription |
| `/api/push/test` | POST | Send test push notification |
| `/{path}` | OPTIONS | CORS preflight handler |

#### Engine Modules (`api/engine/`)

| Module | Responsibility | External Dependencies |
|---|---|---|
| **skyfield.py** | Skyfield ephemeris init, observer setup, timezone handling, twilight windows | skyfield (DE421), pytz, timezonefinder |
| **moon.py** | Moon phase %, phase name, distance, rise/set | skyfield |
| **moon_facts.py** | Curated educational moon fact cards | None |
| **planets.py** | Planet positions (ra/dec/alt/az/constellation/magnitude), constellation window calculator | skyfield, numpy |
| **targets.py** | Deep-sky target visibility filtering by Bortle class, time, altitude | skyfield |
| **iss.py** | ISS pass prediction from live TLE | requests (Celestrak TLE) |
| **meteors.py** | Major meteor shower calendar with peak dates | None (static data) |
| **seeing.py** | Weather fetching (Open-Meteo API) + rule-based scoring + AI analysis via LLM | requests (Open-Meteo, Gemini/OpenAI) |
| **aurora.py** | NOAA Kp-index forecasting + aurora visibility probability | requests (NOAA SWPC) |
| **bortle.py** | Bortle class estimation from lat/lon via LightPollutionMap API | requests |
| **reports.py** | Aggregated tonight/weekly/monthly reports composing multiple sources | All above modules |
| **cache.py** | Redis-backed caching with local memory fallback | redis (optional) |
| **push.py** | Web push notification engine (VAPID / pywebpush) | pywebpush (optional) |
| **scheduler.py** | APScheduler background jobs: ISS alert, aurora alert, clearing-skies alert | apscheduler |
| **gallery.py** | Community astrophoto gallery: JSON file DB + AI safety moderation | requests (for AI moderation) |

#### External API Dependencies

| Service | Purpose | API Key Required |
|---|---|---|
| **Open-Meteo API** | Weather forecast data (cloud, wind, temp, humidity) | No (free, no key) |
| **SIMBAD TAP** | Star spectral type & distance queries | No |
| **NASA NeoWs** | Near-earth object data | No (DEMO_KEY available) |
| **NASA DONKI** | Space weather events (CME, flares, geomagnetic storms) | No (DEMO_KEY) |
| **NASA APOD** | Astronomy Picture of the Day | No (DEMO_KEY) |
| **Google Gemini** | AI seeing analysis, fallback suggestions | Yes (AI_API_KEY) |
| **NOAA SWPC** | Kp-index aurora data | No |
| **LightPollutionMap** | Bortle class estimation | No |
| **Celestrak** | ISS TLE orbital data | No |
| **Nominatim (OSM)** | Reverse geocoding for location auto-detect | No (rate-limited) |
| **Cloudflare Access** | Service-auth gateway for AI backend | Yes (optional) |

### 2.2 Frontend (`web/` — Vanilla JS on Cloudflare Pages)

**Architecture:** Zero-build, single-page application (SPA). No React, Webpack, or Vite.  
**Deployment:** Cloudflare Pages (`wrangler.toml` serves `./web/`), with nginx proxy in Docker.

#### Entry Points

| File | Role |
|---|---|
| **`index.html`** | SPA shell — header, HUD telemetry strip, all card sections (conditions, moon, planets, ISS, meteors, targets, gallery, etc.) |
| **`app.js`** (~4857 lines) | **Central orchestrator** — starfield canvas, 5s API refresh cycle, DOM rendering, geolocation, night vision toggle, plan-my-night scheduler, PWA lifecycle, push subscription, gallery modal, onboarding tour, i18n |
| **`style.css`** | Full dark theme, card layouts, responsive grid, animations, night-vision red mode |
| **`sw.js`** | Service Worker — caches static assets (v28), network-first for HTML, bypasses API calls |

#### Feature Modules (loaded in app.js)

| Feature | Implementation |
|---|---|
| Starfield background | Canvas 2D particle system in `app.js` |
| 3D Solar System Hero | WebGL Three.js in `hero-solar-system.js` (lazy-loaded) |
| Gravity well effect | `gravity-well.js` |
| 3D Moon | Three.js in `moon3d.js` (IntersectionObserver lazy-load) |
| 3D Planets | Three.js in `planets3d.js` (IntersectionObserver lazy-load) |
| Interactive Star Map | D3.js + d3-celestial in `planetarium.html` + `planetarium.js` |
| Solar System CSS visual | `css-solar-system.js` + `css-solar-system.css` |
| i18n Translations | `translations.js` — en, es, pt |
| Open Graph generator | `generate-og.js` (Node/Puppeteer build-time script) |

#### CDN Dependencies

| Library | Purpose |
|---|---|
| **Three.js** (r128) | 3D planet/moon rendering |
| **D3.js** v3 + d3.geo.projection | Interactive star map (d3-celestial) |
| **GSAP** 3.12.2 | Smooth animations |
| **Driver.js** 1.3.1 | Onboarding tour |
| **Lucide** | Icon set |
| **Google Fonts** (Space Grotesk, Space Mono) | Typography |

#### Frontend API Integration

The frontend calls the backend API at `https://stargazerapi.nick-t.net` (Cloud Run). Local dev uses a Node.js proxy (`dev-server.js` on port 8080 → API on 8181). The nginx config (`nginx.conf`) rate-limits API calls to 5 req/s with burst up to 10.

---

## 3. Infrastructure & Deployment

### 3.1 Docker Stack (`docker-compose.yml`)

| Service | Image | Port | Purpose |
|---|---|---|---|
| **stargazer-api** | Built from `./api/Dockerfile` | 8181 | FastAPI backend (uvicorn) |
| **stargazer-web** | `nginx:alpine` | 8080:80 | Static file server + API reverse proxy |
| **redis** | `redis:7-alpine` | — | Caching (optional, falls back to local memory) |

### 3.2 CI/CD Pipeline (`.github/workflows/pipeline.yml`)

**Trigger:** push/PR to `main`, or manual `workflow_dispatch`.

Stages:
1. **Validate** — JS syntax check (`node --check`), HTML critical ID check, Python lint (`flake8`), Python security scan (`bandit`), Playwright smoke tests, Lighthouse CI performance gates
2. **Deploy** — Build & push Docker image to GCP Artifact Registry, deploy to Cloud Run, post-deploy `/health` check with retries
3. **Release** — Auto patch-tag on successful `main` pipeline run; manual release supports explicit version or auto-increment
4. **Rollback** — Creates a PR from a validated release tag
5. **Dry-run** — Preview deploy/release actions without mutation

### 3.3 Cloud Infrastructure

| Component | Provider | Service |
|---|---|---|
| Backend API | Google Cloud | Cloud Run (scales-to-zero, 0.5 CPU / 512MB) |
| Frontend | Cloudflare | Cloudflare Pages |
| Database | Embedded | SQLite (persistent volume on GCS FUSE) |
| Cache | Optional | Redis (sidecar container) |
| AI Gateway | Cloudflare Access | Protected LLM endpoint |

### 3.4 Environment Configuration (`config.py`)

Key environment variables (loaded via `python-dotenv`):

| Variable | Default | Description |
|---|---|---|
| `LATITUDE` | 40.0638 | Observer latitude (Columbus, OH) |
| `LONGITUDE` | -83.0457 | Observer longitude |
| `TELESCOPE_APERTURE_MM` | 130 | Telescope aperture (Celestron StarSense Explorer 5" DX) |
| `BORTLE_CLASS` | (auto-detected) | Light pollution class (1-9) |
| `AI_API_KEY` | — | Google Gemini API key |
| `NASA_API_KEY` | DEMO_KEY | NASA API key |
| `VAPID_*` | — | Web push notification keys |
| `DB_DIR` | ../ | SQLite/gallery data directory |

---

## 4. Entry Vectors Summary

### For Developers
| Vector | Location | Typical Action |
|---|---|---|
| **Start backend** | `cd api && uvicorn main:app` | Local dev on port 8181 |
| **Start frontend** | `node dev-server.js` | Local dev on port 8080 with API proxy |
| **Entire stack** | `docker compose up` | API + nginx + Redis in containers |
| **Deploy API** | GitHub Actions `workflow_dispatch` | Deploy to Cloud Run |
| **Deploy frontend** | Cloudflare Dashboard / Wrangler | Deploy `web/` to CF Pages |
| **Run tests** | `npx playwright test` | Smoke tests in `tests/smoke.spec.js` |
| **Build OG images** | `npm run generate-og` | Puppeteer-generated previews |

### For Users
| Vector | URL | Purpose |
|---|---|---|
| **Dashboard** | `/` (index.html) | Main SPA — conditions, targets, planets, Moon, ISS |
| **Planetarium** | `/planetarium.html` | Interactive D3 star map |
| **API docs** | `/docs` (via FastAPI) | Swagger UI when backend is running |

---

## 5. Key Architectural Decisions

1. **Zero-build frontend** — No bundler or framework. Every JS file is loaded via `<script>` tags in `index.html`. This simplifies deployment but means all code is in the global scope.
2. **SPA with 5s refresh loop** — `app.js` runs a `setInterval(dataLoop, 5000)` that re-fetches all API endpoints and re-renders the DOM. No WebSocket or SSE.
3. **Dual caching** — Redis (when available) with transparent local-memory fallback. TTLs range from 5 min (weather) to 7 days (SIMBAD star data).
4. **AI fallback chain** — Seeing analysis tries primary AI API → fallback AI API → rule-based scoring, with configurable timeout.
5. **Push notifications are optional** — Cleanly disabled when VAPID keys are absent. The scheduler skips all checks when there are no subscribers.
6. **File-based gallery storage** — Images stored as base64 `.b64` files, metadata in `stargazer_gallery.json`. No SQL database for gallery.
7. **SPA routing via nginx** — `try_files $uri $uri/ /index.html` fallback in nginx enables deep-linking in the SPA.
8. **CORS via middleware** — Custom middleware checks origin against a whitelist (production domain, localhost, private IPs).