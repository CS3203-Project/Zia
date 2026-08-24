import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../utils/leafletSetup';
import { Navigation, Loader2, Clock, Route as RouteIcon, AlertCircle } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/utils';
import { hybridSearchApi } from '../../api/hybridSearchApi';
import {
  getRoute,
  formatRouteDistance,
  formatRouteDuration,
  RouteNotFoundError,
  type RoutePoint,
  type RouteResult
} from '../../utils/routing';

interface ServiceLocationMapProps {
  /** The point the map is centered on and directions are routed to. */
  destination: RoutePoint;
  /** Text shown in the destination marker's popup, e.g. the service or provider name. */
  destinationLabel?: string;
  className?: string;
}

function buildPinIcon(svg: string, size: [number, number], anchor: [number, number]): L.Icon {
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: size,
    iconAnchor: anchor,
    popupAnchor: [0, -anchor[1]]
  });
}

// Orange drop-pin for the destination.
const destinationIcon = buildPinIcon(
  `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 11 16 24 16 24s16-13 16-24C32 7.163 24.837 0 16 0z" fill="#ea580c"/>
    <circle cx="16" cy="16" r="6" fill="#ffffff"/>
  </svg>`,
  [32, 40],
  [16, 40]
);

// Blue dot marker for the viewer's current location — visually distinct from the destination pin.
const userLocationIcon = buildPinIcon(
  `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
  </svg>`,
  [24, 24],
  [12, 12]
);

/** Invisible helper that fits the map's viewport to the given bounds whenever they change. */
const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression | null }> = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [bounds, map]);

  return null;
};

/**
 * Self-contained map card for a single destination: shows the location on an OSM map and,
 * on request, routes from the viewer's current location to it (marker, polyline, distance/duration).
 */
const ServiceLocationMap: React.FC<ServiceLocationMapProps> = ({ destination, destinationLabel, className }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<RoutePoint | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);

  const handleGetDirections = useCallback(async () => {
    setLoading(true);
    setError(null);

    let position: GeolocationPosition;
    try {
      position = await hybridSearchApi.getCurrentLocation();
    } catch {
      setError("Couldn't get your location — please allow location access and try again");
      setLoading(false);
      return;
    }

    const from: RoutePoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    try {
      const result = await getRoute(from, destination);
      setUserLocation(from);
      setRoute(result);
    } catch (err) {
      setUserLocation(null);
      setRoute(null);
      // Both a "no route exists" (RouteNotFoundError) and a generic network/fetch
      // failure are shown with the same user-facing message.
      setError("Couldn't find a route to this location");
      console.error('Failed to fetch route:', err instanceof RouteNotFoundError ? err.message : err);
    } finally {
      setLoading(false);
    }
  }, [destination]);

  const bounds = useMemo<L.LatLngBoundsExpression | null>(() => {
    if (!route || !userLocation) return null;
    const points: [number, number][] = [
      [destination.latitude, destination.longitude],
      [userLocation.latitude, userLocation.longitude],
      ...route.coordinates
    ];
    return L.latLngBounds(points);
  }, [route, userLocation, destination]);

  return (
    <div className={cn('bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      <div className="h-64 sm:h-72 w-full">
        <MapContainer
          center={[destination.latitude, destination.longitude]}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          <Marker position={[destination.latitude, destination.longitude]} icon={destinationIcon}>
            {destinationLabel && <Popup>{destinationLabel}</Popup>}
          </Marker>

          {userLocation && (
            <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userLocationIcon}>
              <Popup>Your location</Popup>
            </Marker>
          )}

          {route && route.coordinates.length > 0 && (
            <Polyline positions={route.coordinates} pathOptions={{ color: '#ea580c', weight: 4, opacity: 0.85 }} />
          )}

          <FitBounds bounds={bounds} />
        </MapContainer>
      </div>

      <div className="p-4 space-y-3">
        {route && (
          <div className="flex items-center gap-4 text-sm bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
            <span className="flex items-center gap-1.5 font-medium text-gray-900">
              <RouteIcon className="w-4 h-4 text-orange-600" />
              {formatRouteDistance(route.distanceKm)}
            </span>
            <span className="flex items-center gap-1.5 font-medium text-gray-900">
              <Clock className="w-4 h-4 text-orange-600" />
              {formatRouteDuration(route.durationMinutes)}
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <Button onClick={handleGetDirections} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Getting directions...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Get Directions
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ServiceLocationMap;
