import type { ManifestStatus } from '@/types';

/**
 * Manifest lifecycle state machine — Doc 01 §3.
 *
 * The 9-status flow is the backbone of every business process, so the legal
 * transitions live here as a single source of truth (used by tests and available
 * to guard any status mutation):
 *
 *   QUEUED → SELECTED → OPTIMIZING → OPTIMIZED → ASSIGNED
 *          → DISPATCHED → IN_TRANSIT → DELIVERED
 *
 *   + SELECTED   → QUEUED      (deselect)
 *   + OPTIMIZING → QUEUED      (AI failure / timeout rollback)
 *   + IN_TRANSIT → EXCEPTION   (off-route / delivery failure)
 *   + EXCEPTION  → IN_TRANSIT  (recovery)
 *
 * DELIVERED is terminal.
 */
export const MANIFEST_TRANSITIONS: Record<ManifestStatus, readonly ManifestStatus[]> = {
  QUEUED: ['SELECTED'],
  SELECTED: ['OPTIMIZING', 'QUEUED'],
  OPTIMIZING: ['OPTIMIZED', 'QUEUED'],
  OPTIMIZED: ['ASSIGNED'],
  ASSIGNED: ['DISPATCHED'],
  DISPATCHED: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED', 'EXCEPTION'],
  DELIVERED: [],
  EXCEPTION: ['IN_TRANSIT'],
};

/** Is `from → to` a legal manifest transition (Doc 01 §3)? */
export function canTransition(from: ManifestStatus, to: ManifestStatus): boolean {
  return MANIFEST_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Thrown when an illegal manifest transition is attempted. */
export class InvalidTransitionError extends Error {
  constructor(
    public readonly from: ManifestStatus,
    public readonly to: ManifestStatus,
  ) {
    super(`Invalid manifest transition: ${from} → ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

/**
 * Return the next status if the transition is legal, otherwise throw.
 * Use to guard any code that advances a manifest's status.
 */
export function transition(from: ManifestStatus, to: ManifestStatus): ManifestStatus {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
  return to;
}
