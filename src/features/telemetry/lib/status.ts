import type { MonitorStatus } from '@/types';

/**
 * Live-map status palette (Doc 02 §4 legend). Colors match the prototype's fleet
 * legend and the status badge family. EXCEPTION is derived from `is_off_route`.
 */
export const MONITOR_STATUS: Record<MonitorStatus, { label: string; color: string }> = {
  IN_TRANSIT: { label: 'In Transit', color: '#4ADE80' },
  DELAYED: { label: 'Delayed', color: '#FBBF24' },
  EXCEPTION: { label: 'Exception', color: '#F87171' },
  DISPATCHED: { label: 'Dispatched', color: '#2DD4BF' },
  PARKED: { label: 'Parked', color: '#7A8A80' },
};

/** Legend order (bottom-right of the map). */
export const LEGEND_ORDER: MonitorStatus[] = [
  'IN_TRANSIT',
  'DELAYED',
  'EXCEPTION',
  'DISPATCHED',
  'PARKED',
];
