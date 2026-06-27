import { describe, it, expect } from 'vitest';
import {
  OptimizeError,
  assertSequenceWithinSelection,
  parseOptimizeResponse,
} from './optimize-api';
import { buildRoute } from '../lib/route-cache';
import type { OptimizeRequest } from '@/types';

const VALID_RAW = {
  status: 'success',
  route_id: 'rt_8841',
  optimized_sequence: ['MNF-003', 'MNF-001', 'MNF-002'],
  waypoints: [
    { lat: -8.65, lng: 115.2167 },
    { lat: -8.6901, lng: 115.2612 },
    { lat: -8.6743, lng: 115.2345 },
    { lat: -8.6212, lng: 115.1764 },
  ],
  estimated_total_duration_mins: 78,
  ai_insights: 'HIGH-priority stops sequenced first.',
};

const REQUEST: OptimizeRequest = {
  dispatcher_id: 'usr_99823',
  fleet_id: 'FLT-002',
  origin_coordinate: { lat: -8.65, lng: 115.2167 },
  destinations: [
    { manifest_id: 'MNF-001', lat: -8.6743, lng: 115.2345, priority: 'HIGH', weight_kg: 450 },
    { manifest_id: 'MNF-002', lat: -8.6212, lng: 115.1764, priority: 'NORMAL', weight_kg: 120 },
    { manifest_id: 'MNF-003', lat: -8.6901, lng: 115.2612, priority: 'HIGH', weight_kg: 300 },
  ],
};

/**
 * Unit — Optimize response parsing (SDD §13 / §14).
 * Valid JSON → typed response → Route object; malformed JSON → OptimizeError.
 */
describe('parseOptimizeResponse', () => {
  it('parses a valid structured response', () => {
    const res = parseOptimizeResponse(VALID_RAW);
    expect(res.route_id).toBe('rt_8841');
    expect(res.optimized_sequence).toHaveLength(3);
    expect(res.waypoints[0]).toEqual({ lat: -8.65, lng: 115.2167 });
  });

  it('builds a Route object from a parsed response', () => {
    const res = parseOptimizeResponse(VALID_RAW);
    const route = buildRoute(res, REQUEST);
    expect(route.route_id).toBe('rt_8841');
    expect(route.fleet_id).toBe('FLT-002');
    expect(route.dispatcher_id).toBe('usr_99823');
    expect(route.optimized_sequence).toEqual(['MNF-003', 'MNF-001', 'MNF-002']);
    expect(route.status).toBe('DRAFT');
  });

  it('throws OptimizeError on a missing field', () => {
    const broken: Partial<typeof VALID_RAW> = { ...VALID_RAW };
    delete broken.route_id;
    expect(() => parseOptimizeResponse(broken)).toThrow(OptimizeError);
  });

  it('throws OptimizeError on a wrong field type', () => {
    const broken = { ...VALID_RAW, estimated_total_duration_mins: '78' };
    expect(() => parseOptimizeResponse(broken)).toThrow(OptimizeError);
  });

  it('throws OptimizeError on non-object input (e.g. an HTML error page)', () => {
    expect(() => parseOptimizeResponse('<html>502 Bad Gateway</html>')).toThrow(OptimizeError);
    expect(() => parseOptimizeResponse(null)).toThrow(OptimizeError);
  });
});

describe('assertSequenceWithinSelection', () => {
  const selected = new Set(['MNF-001', 'MNF-002', 'MNF-003']);

  it('accepts a sequence fully within the selection', () => {
    const res = parseOptimizeResponse(VALID_RAW);
    expect(() => assertSequenceWithinSelection(res, selected)).not.toThrow();
  });

  it('rejects an unknown manifest_id the dispatcher never selected', () => {
    const res = parseOptimizeResponse({ ...VALID_RAW, optimized_sequence: ['MNF-001', 'MNF-999'] });
    expect(() => assertSequenceWithinSelection(res, selected)).toThrow(/Unknown ID/);
  });

  it('rejects an error status from the AI engine', () => {
    const res = parseOptimizeResponse({ ...VALID_RAW, status: 'error' });
    expect(() => assertSequenceWithinSelection(res, selected)).toThrow(OptimizeError);
  });
});
