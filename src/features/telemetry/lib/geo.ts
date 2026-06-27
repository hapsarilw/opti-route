import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { ActiveRoute, MonitoredFleet } from '@/types';
import { MONITOR_STATUS } from './status';

/**
 * GeoJSON builders for the WebGL fleet layer (Doc 02 §4.4 — Canvas/WebGL, not DOM
 * markers). The map keeps ONE GeoJSON source per concern and updates it via
 * `setData()`, so these run cheaply every telemetry tick.
 */

/** Fleet points → clustered source. `color` drives the circle paint per status. */
export function toFleetFeatureCollection(fleets: MonitoredFleet[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: fleets.map(
      (f): Feature<Point> => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.position.lng, f.position.lat] },
        properties: {
          fleet_id: f.fleet_id,
          status: f.status,
          color: MONITOR_STATUS[f.status].color,
          heading: f.heading,
          driver_name: f.driver_name,
          speed_kmh: f.speed_kmh,
          eta: f.eta,
          manifest_id: f.manifest_id,
          is_off_route: f.is_off_route,
        },
      }),
    ),
  };
}

/** Active route → a single LineString feature for the polyline layer. */
export function toRouteLineFeature(route: ActiveRoute): Feature<LineString> {
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: route.waypoints.map((w) => [w.lng, w.lat]) },
    properties: { route_id: route.route_id },
  };
}

/** Active route drop-offs → numbered symbol points. */
export function toRouteDropoffsFeatureCollection(route: ActiveRoute): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: route.dropoffs.map(
      (d): Feature<Point> => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: { seq: d.seq, manifest_id: d.manifest_id },
      }),
    ),
  };
}

const EMPTY_FC: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };
export const emptyPointFC = (): FeatureCollection<Point> => EMPTY_FC;
