import type { ManifestQuery } from '@/types';

/**
 * Centralized, typed TanStack Query key factory. Keeping every key in one place
 * prevents cache-key drift and makes invalidation predictable across features.
 */
export const queryKeys = {
  manifests: {
    all: ['manifests'] as const,
    list: (query: ManifestQuery) => ['manifests', 'list', query] as const,
    detail: (id: string) => ['manifests', 'detail', id] as const,
  },
  fleet: {
    all: ['fleet'] as const,
    idle: ['fleet', 'idle'] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    available: ['drivers', 'available'] as const,
  },
  route: {
    detail: (id: string) => ['route', id] as const,
  },
  telemetry: {
    all: ['telemetry'] as const,
  },
} as const;
