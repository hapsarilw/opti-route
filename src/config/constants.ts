import type { Coordinate } from '@/types';

/** Central Bali warehouse origin — start point for every optimized route (CLAUDE.md). */
export const WAREHOUSE_ORIGIN: Coordinate = { lat: -8.65, lng: 115.2167 };

/** Mock API base path (served by MSW — no real backend). */
export const API_BASE = '/api/v1';

/** Telemetry polling cadence (ms) when WS is unavailable — Process 4. */
export const TELEMETRY_POLL_MS = 3000;

/** Debounce for the grid fuzzy-search input (ms) — keeps INP < 200ms (PRD §5). */
export const SEARCH_DEBOUNCE_MS = 250;

/** Total mock manifests generated for the virtualized grid. */
export const MANIFEST_COUNT = 10_000;
