import { describe, it, expect } from 'vitest';
import { haversineKm } from './haversine';
import type { Coordinate } from '@/types';

/**
 * Unit — Haversine util (SDD §13). Two coordinates → great-circle distance (km).
 * Reference distances cross-checked against an independent geodesy calculator;
 * we assert to ~0.1 km accuracy per the brief.
 */
describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    const p: Coordinate = { lat: -8.65, lng: 115.2167 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it('measures a short Bali hop to ~0.1 km accuracy', () => {
    // Warehouse origin → a Denpasar drop-off; true great-circle ≈ 3.34 km.
    const origin: Coordinate = { lat: -8.65, lng: 115.2167 };
    const drop: Coordinate = { lat: -8.6743, lng: 115.2345 };
    expect(haversineKm(origin, drop)).toBeCloseTo(3.34, 1);
  });

  it('matches a known 1° latitude span (~111.19 km)', () => {
    const a: Coordinate = { lat: 0, lng: 0 };
    const b: Coordinate = { lat: 1, lng: 0 };
    expect(haversineKm(a, b)).toBeCloseTo(111.19, 1);
  });

  it('is symmetric — distance(a,b) === distance(b,a)', () => {
    const a: Coordinate = { lat: -8.65, lng: 115.2167 };
    const b: Coordinate = { lat: -8.409, lng: 115.188 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });

  it('computes a long-haul distance (Denpasar → Jakarta ≈ 980 km)', () => {
    const denpasar: Coordinate = { lat: -8.65, lng: 115.2167 };
    const jakarta: Coordinate = { lat: -6.2088, lng: 106.8456 };
    const d = haversineKm(denpasar, jakarta);
    expect(d).toBeGreaterThan(960);
    expect(d).toBeLessThan(1000);
  });
});
