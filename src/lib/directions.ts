/**
 * Mapbox Directions API — snap an ordered list of stops to the real road network
 * so the route polyline is drivable (follows streets) instead of straight
 * "as-the-crow-flies" segments. This is the same mechanism Google Maps uses:
 * the optimizer decides the stop ORDER, then a routing engine returns the
 * turn-by-turn road geometry between them.
 *
 * Docs: https://docs.mapbox.com/api/navigation/directions/
 */

const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';

// The `driving` profile accepts at most 25 coordinates per request.
const MAX_WAYPOINTS = 25;

interface DirectionsResponse {
  routes?: { geometry?: { coordinates?: [number, number][] }; distance?: number; duration?: number }[];
}

export interface RoadRoute {
  /** Dense [lng, lat] polyline following roads — ready for a GeoJSON LineString. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Fetch the road-following route through `coordinates` (origin first, then stops
 * in visit order). Returns `null` on any failure (no token, too many waypoints,
 * network/API error) so callers can fall back to the straight-line geometry.
 */
export async function fetchRoadRoute(
  coordinates: [number, number][],
  token: string,
  signal?: AbortSignal,
): Promise<RoadRoute | null> {
  if (!token || coordinates.length < 2 || coordinates.length > MAX_WAYPOINTS) return null;

  const path = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const url = `${DIRECTIONS_BASE}/${path}?geometries=geojson&overview=full&access_token=${token}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as DirectionsResponse;
    const route = data.routes?.[0];
    const coords = route?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    return {
      coordinates: coords,
      distanceMeters: route?.distance ?? 0,
      durationSeconds: route?.duration ?? 0,
    };
  } catch {
    // Aborted (new route superseded this one) or network error → straight-line fallback.
    return null;
  }
}
