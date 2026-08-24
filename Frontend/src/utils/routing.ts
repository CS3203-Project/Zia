// Thin client for the public OSRM demo routing server. Meant for light,
// occasional "get directions" lookups — not high-frequency traffic. See
// https://project-osrm.org/docs/v5.24.0/api/#general-options for the API.
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  /** [lat, lng] pairs in route order, ready for a Leaflet Polyline. */
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

interface OsrmRoute {
  geometry: { coordinates: [number, number][] }; // [lng, lat] pairs
  distance: number; // meters
  duration: number; // seconds
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
  message?: string;
}

export class RouteNotFoundError extends Error {}

/**
 * Fetch a driving route between two points from the public OSRM server.
 * Throws RouteNotFoundError if no route could be found between the points.
 */
export async function getRoute(from: RoutePoint, to: RoutePoint): Promise<RouteResult> {
  const url = `${OSRM_BASE_URL}/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const data = (await response.json()) as OsrmResponse;
  const route = data.routes?.[0];
  if (data.code !== 'Ok' || !route) {
    throw new RouteNotFoundError(data.message || 'No route could be found between these locations');
  }

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60
  };
}

export function formatRouteDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function formatRouteDuration(durationMinutes: number): string {
  if (durationMinutes < 1) {
    return '< 1 min';
  }
  if (durationMinutes < 60) {
    return `${Math.round(durationMinutes)} min`;
  }
  const hours = Math.floor(durationMinutes / 60);
  const minutes = Math.round(durationMinutes % 60);
  return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
}
