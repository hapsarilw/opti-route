# OptiRoute — Logistics & Fleet Control Dashboard

An enterprise-grade internal **logistics & fleet management dashboard** for dispatcher
teams. Visual style: an *operations control room* — professional, data-dense, calm,
precise. Built as a front-end competency showcase: client-side performance with a
10,000-row virtualized grid, complex async state management, RBAC, and geospatial
(WebGL) visualization.

> No real backend — the entire API is mocked in-browser with **MSW**, so the app runs
> standalone with `npm run dev`.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional — live Mapbox basemap

The live map (Process 4) renders a WebGL basemap when a Mapbox token is present.
Without one, it gracefully falls back to a grid placeholder while telemetry keeps
streaming. To enable it, create `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | **Next.js 16** (App Router) + **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** + design-token CSS variables (dark/light) |
| Server state | **TanStack Query v5** |
| Data grid | **TanStack Table v8** + **TanStack Virtual** (row virtualization) |
| Client/UI state | **Zustand** (in-memory, non-persisted) |
| Map | **Mapbox GL JS** via **react-map-gl** (Canvas/WebGL layer) |
| Mock API | **MSW** (Mock Service Worker) — no real backend |
| Validation | **Zod** (AI structured-output validation) |
| Testing | **Vitest** + **React Testing Library** |
| Fonts | Hanken Grotesk (UI), Space Grotesk (display), JetBrains Mono (data) |

---

## Architecture Overview — 4 Business Processes

Logistics data flows in a **circular** pipeline. The `Manifest` status is the thread
that moves between processes (9-state machine — see `src/lib/manifest-machine.ts`).

```
ERP/WMS ──▶ P1 Ingestion ──▶ P2 AI Optimize ──▶ P3 Assign & Dispatch ──▶ P4 Live Telemetry
            (Grid)            (Drawer)           (Modal)                  (Map)   │
              ▲                                                                   │
              └──────────────────────── DELIVERED (cycle restarts) ──────────────┘
```

| # | Process | Entry point | What happens | Status transition |
|---|---|---|---|---|
| **P1** | Data Ingestion & Grid | `/manifests` | 10,000 manifests in a virtualized, filterable/sortable grid (only ~20–30 rows in the DOM). | `QUEUED → SELECTED` |
| **P2** | AI Route Optimization | Optimize drawer | Selected stops → `POST /route/optimize` → structured JSON sequence + waypoints, drawn as a polyline. | `SELECTED → OPTIMIZED` |
| **P3** | Fleet Assignment & Dispatch | Assign Driver modal | Nearest available driver ranked by **Haversine** distance → `POST /dispatch` syncs Manifest + Fleet + Driver. | `OPTIMIZED → DISPATCHED` |
| **P4** | Live Telemetry & Monitoring | `/map` | Dispatched vehicles stream GPS pings; markers move on a Canvas/WebGL layer via `setData()`; off-route → alert. | `DISPATCHED → IN_TRANSIT → DELIVERED` |

### Code layout

```
src/
  app/                     # Next.js App Router routes + (dashboard) group
  components/              # Shared UI (ui/, shared/, layout/, rbac/)
  features/
    manifests/             # P1 — grid, filter toolbar, data hooks
    optimize/              # P2 — drawer, optimize mutation, route cache
    dispatch/              # P3 — AssignDriverModal, dispatch mutation
    telemetry/             # P4 — FleetMap (WebGL), live fleet hooks
    tariff/                # RBAC tariff config page
  lib/                     # haversine, manifest-machine, rbac, utils
  mocks/                   # MSW handlers + deterministic seeded dataset
  stores/                  # Zustand: auth (RBAC), selection, toasts
  types/                   # Domain types (Doc 01 §2)
```

### Key architecture principles

- **Server vs client state** are separated: TanStack Query owns `Manifest[]`, `Fleet[]`,
  `Driver[]`, routes & telemetry; Zustand/`useState` own selection, auth, and drawer state.
- **Virtualization is mandatory** — the 10,000-row grid renders ~20–30 rows; the row is
  `React.memo`-ed so selection churn doesn't re-render the whole viewport.
- **WebGL, not DOM markers** — 100+ vehicles live in one clustered GeoJSON source updated
  via `setData()`, so FPS stays smooth.
- **Cleanup everywhere** — the map effect removes every listener/layer/source on unmount,
  and telemetry polling is torn down by TanStack Query, so the dashboard is stable for hours.
- **RBAC** — an in-memory (non-persisted) auth store drives a `<Can permission>` gate and a
  tariff-page route guard. Roles: `admin`, `dispatcher`, `manager` (matrix in Doc 01 §4).

---

## Testing

```bash
npm test          # run the suite once
npm run test:watch
```

**Vitest + React Testing Library**, per SDD §13:

| Type | Coverage |
|---|---|
| Unit | Haversine distance accuracy; manifest state-machine transitions (valid + illegal throw); optimize response parsing (zod valid → Route, malformed → error) |
| Component | `StatusBadge` renders all 9 statuses + pulse/flash animations; `<Can>` conditional render per role (admin/dispatcher/manager) |

Current status: **27 tests passing** across 5 files.

---

## Performance & Quality (SDD §10)

- **Mapbox is lazy-loaded** (`next/dynamic`, `ssr: false`) so the heavy WebGL bundle is
  excluded from every route except `/map`.
- **Row virtualization + `React.memo`** keep grid INP well under 200 ms during filter/sort.
- **Debounced search** (250 ms) + `keepPreviousData` avoid refetch jank.
- Skeleton / empty / error states on every data fetch.
- Dark mode is the default control-room theme; light mode is available via the toggle.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the Vitest suite |
| `npm run test:watch` | Vitest in watch mode |
