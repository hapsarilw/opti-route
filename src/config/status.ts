import type { ManifestStatus, Priority } from '@/types';

/**
 * Visual config for the 9 manifest statuses + 3 priorities.
 * Hex values are extracted verbatim from the prototype's design-token block
 * ("OptiRoute Design System.dc.html") — the visual source of truth.
 * Each badge = solid `text` color, ~14% `bg`, ~28% `border`.
 */

export interface StatusStyle {
  label: string;
  text: string;
  bg: string;
  border: string;
  /** OPTIMIZING: the status dot pulses (Doc 01 §3). */
  pulse?: boolean;
  /** EXCEPTION: the whole badge flashes red (Doc 01 §3). */
  flash?: boolean;
}

export const STATUS_CONFIG: Record<ManifestStatus, StatusStyle> = {
  QUEUED: { label: 'Queued', text: '#7A8A80', bg: 'rgba(122,138,128,0.14)', border: 'rgba(122,138,128,0.28)' },
  SELECTED: { label: 'Selected', text: '#60A5FA', bg: 'rgba(59,130,246,0.14)', border: 'rgba(59,130,246,0.28)' },
  OPTIMIZING: { label: 'Optimizing', text: '#FBBF24', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.28)', pulse: true },
  OPTIMIZED: { label: 'Optimized', text: '#C084FC', bg: 'rgba(168,85,247,0.14)', border: 'rgba(168,85,247,0.28)' },
  ASSIGNED: { label: 'Assigned', text: '#818CF8', bg: 'rgba(99,102,241,0.14)', border: 'rgba(99,102,241,0.28)' },
  DISPATCHED: { label: 'Dispatched', text: '#2DD4BF', bg: 'rgba(20,184,166,0.14)', border: 'rgba(20,184,166,0.28)' },
  IN_TRANSIT: { label: 'In Transit', text: '#4ADE80', bg: 'rgba(34,197,94,0.14)', border: 'rgba(34,197,94,0.28)' },
  DELIVERED: { label: 'Delivered', text: '#3FBF8E', bg: 'rgba(30,138,99,0.18)', border: 'rgba(30,138,99,0.32)' },
  EXCEPTION: { label: 'Exception', text: '#F87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.28)', flash: true },
};

export interface PriorityStyle {
  label: string;
  text: string;
  bg: string;
  border: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityStyle> = {
  HIGH: { label: 'HIGH', text: '#F87171', bg: 'rgba(239,68,68,0.14)', border: 'rgba(239,68,68,0.3)' },
  NORMAL: { label: 'NORMAL', text: '#8FA39A', bg: 'rgba(143,163,154,0.12)', border: 'rgba(143,163,154,0.22)' },
  LOW: { label: 'LOW', text: '#4A6155', bg: 'rgba(74,97,85,0.14)', border: 'rgba(74,97,85,0.25)' },
};
