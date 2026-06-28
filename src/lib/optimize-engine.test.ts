import { describe, it, expect } from 'vitest';
import { routeLoadKg, runMockOptimize } from './optimize-engine';
import type { OptimizeRequest } from '@/types';

const REQUEST: OptimizeRequest = {
  dispatcher_id: 'usr_99823',
  fleet_id: 'FLT-002',
  origin_coordinate: { lat: -8.65, lng: 115.2167 },
  destinations: [
    { manifest_id: 'MNF-001', lat: -8.6743, lng: 115.2345, priority: 'NORMAL', weight_kg: 120 },
    { manifest_id: 'MNF-002', lat: -8.6212, lng: 115.1764, priority: 'NORMAL', weight_kg: 120 },
    { manifest_id: 'MNF-003', lat: -8.6901, lng: 115.2612, priority: 'HIGH', weight_kg: 300 },
  ],
};

/**
 * Unit — deterministic fallback optimizer (SDD §14).
 * Guarantees the LLM fallback always yields a complete, in-selection Doc 01 §5.2 route.
 */
describe('runMockOptimize', () => {
  it('sequences every destination exactly once', () => {
    const res = runMockOptimize(REQUEST);
    expect(res.status).toBe('success');
    expect([...res.optimized_sequence].sort()).toEqual(['MNF-001', 'MNF-002', 'MNF-003']);
  });

  it('orders HIGH-priority manifests before the rest', () => {
    const res = runMockOptimize(REQUEST);
    expect(res.optimized_sequence[0]).toBe('MNF-003');
  });

  it('emits origin-first waypoints aligned with the sequence', () => {
    const res = runMockOptimize(REQUEST);
    expect(res.waypoints).toHaveLength(REQUEST.destinations.length + 1);
    expect(res.waypoints[0]).toEqual(REQUEST.origin_coordinate);
    expect(res.estimated_total_duration_mins).toBeGreaterThan(0);
  });
});

/** Unit — fleet capacity validation (Doc 01 §2.2). */
describe('routeLoadKg', () => {
  it('sums the weight of every destination', () => {
    expect(routeLoadKg(REQUEST.destinations)).toBe(540);
  });

  it('returns 0 for an empty route', () => {
    expect(routeLoadKg([])).toBe(0);
  });

  it('drives the over-capacity check against a fleet capacity', () => {
    const load = routeLoadKg(REQUEST.destinations);
    expect(load > 500).toBe(true); // a 500 kg van can't carry this route
    expect(load > 1000).toBe(false); // a 1000 kg truck can
  });
});
