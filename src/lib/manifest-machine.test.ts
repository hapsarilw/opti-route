import { describe, it, expect } from 'vitest';
import type { ManifestStatus } from '@/types';
import {
  InvalidTransitionError,
  canTransition,
  transition,
} from './manifest-machine';

/**
 * Unit — Manifest state machine (SDD §13 / Doc 01 §3).
 * Exercises the full happy-path chain plus the documented branches and rejects
 * illegal jumps.
 */
describe('manifest state machine', () => {
  it('walks the full happy path QUEUED → … → DELIVERED', () => {
    const happyPath: ManifestStatus[] = [
      'QUEUED',
      'SELECTED',
      'OPTIMIZING',
      'OPTIMIZED',
      'ASSIGNED',
      'DISPATCHED',
      'IN_TRANSIT',
      'DELIVERED',
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(() => transition(happyPath[i], happyPath[i + 1])).not.toThrow();
      expect(transition(happyPath[i], happyPath[i + 1])).toBe(happyPath[i + 1]);
    }
  });

  it('allows the documented branch transitions', () => {
    expect(canTransition('SELECTED', 'QUEUED')).toBe(true); // deselect
    expect(canTransition('OPTIMIZING', 'QUEUED')).toBe(true); // AI rollback
    expect(canTransition('IN_TRANSIT', 'EXCEPTION')).toBe(true); // off-route
    expect(canTransition('EXCEPTION', 'IN_TRANSIT')).toBe(true); // recovery
  });

  it('rejects skipping straight from QUEUED to DISPATCHED', () => {
    expect(canTransition('QUEUED', 'DISPATCHED')).toBe(false);
    expect(() => transition('QUEUED', 'DISPATCHED')).toThrow(InvalidTransitionError);
  });

  it('treats DELIVERED as terminal', () => {
    expect(canTransition('DELIVERED', 'IN_TRANSIT')).toBe(false);
    expect(() => transition('DELIVERED', 'QUEUED')).toThrow(InvalidTransitionError);
  });

  it('rejects backward jumps not in the machine', () => {
    expect(canTransition('OPTIMIZED', 'SELECTED')).toBe(false);
    expect(canTransition('DISPATCHED', 'OPTIMIZED')).toBe(false);
    expect(() => transition('DELIVERED', 'EXCEPTION')).toThrow();
  });

  it('carries the from/to context on the thrown error', () => {
    try {
      transition('QUEUED', 'DELIVERED');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      expect((err as InvalidTransitionError).from).toBe('QUEUED');
      expect((err as InvalidTransitionError).to).toBe('DELIVERED');
    }
  });
});
