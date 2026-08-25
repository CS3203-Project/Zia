import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import '../../utils/leafletSetup';
import MapAutoResize from './MapAutoResize';
import { MapPin, Navigation2, Eye } from 'lucide-react';
import { hybridSearchApi, type HybridSearchResult } from '../../api/hybridSearchApi';

interface SearchResultsMapProps {
  services: HybridSearchResult[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  className?: string;
}

// Build a numbered pin icon (service marker) rendered as HTML/CSS via L.divIcon.
const createServiceIcon = (index: number): L.DivIcon => {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #10b981;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: #ffffff;
          font-size: 12px;
          font-weight: bold;
          font-family: sans-serif;
        ">${index + 1}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Distinct pin icon for the user's own location.
const userLocationIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #2563eb;
      border: 3px solid #ffffff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    "></div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -13]
});

// Fits the map viewport to all provided coordinates using Leaflet's built-in bounds logic.
const FitBoundsToMarkers: React.FC<{ positions: L.LatLngExpression[] }> = ({ positions }) => {
  const map = useMap();
  const positionsKey = JSON.stringify(positions);

  useEffect(() => {
    if (positions.length === 0) return;

    if (positions.length === 1) {
      map.setView(positions[0], 14);
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, positionsKey]);

  return null;
};

const ServiceMarker: React.FC<{
  service: HybridSearchResult;
  index: number;
  userLocation?: { latitude: number; longitude: number };
}> = ({ service, index, userLocation }) => {
  const navigate = useNavigate();

  if (service.latitude === undefined || service.latitude === null ||
      service.longitude === undefined || service.longitude === null) {
    return null;
  }

  const distanceText = service.distance_km !== null && service.distance_km !== undefined
    ? hybridSearchApi.formatDistance(service.distance_km)
    : null;

  return (
    <Marker
      position={[service.latitude, service.longitude]}
      icon={createServiceIcon(index)}
    >
      <Popup minWidth={240} maxWidth={280}>
        <div className="p-1">
          <h3 className="font-bold text-base mb-1 text-gray-900">{service.title}</h3>
          <p className="text-sm text-gray-500 mb-2">
            by {service.provider.user.firstName} {service.provider.user.lastName}
          </p>

          {service.images && service.images.length > 0 && (
            <img
              src={service.images[0]}
              alt={service.title}
              className="w-full h-28 object-cover rounded-lg mb-2"
            />
          )}

          {service.description && (
            <p className="text-sm text-gray-600 mb-2 leading-snug">
              {service.description.length > 100
                ? `${service.description.substring(0, 100)}...`
                : service.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-base text-emerald-600">
              {service.currency || 'LKR'} {service.price}
            </div>
            {distanceText && (
              <div className="text-xs text-gray-500">
                {distanceText}{userLocation ? ' from your location' : ''}
              </div>
            )}
          </div>

          <button
            onClick={() => navigate(`/service/${service.id}`)}
            className="w-full mt-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-medium text-sm transition-colors"
          >
            View Service
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

const SearchResultsMap: React.FC<SearchResultsMapProps> = ({
  services,
  userLocation,
  className = ''
}) => {
  const servicesWithLocation = useMemo(
    () => services.filter(
      service => service.latitude !== undefined && service.latitude !== null &&
        service.longitude !== undefined && service.longitude !== null
    ),
    [services]
  );

  const markerPositions = useMemo((): L.LatLngExpression[] => {
    const positions: L.LatLngExpression[] = servicesWithLocation.map(
      service => [service.latitude as number, service.longitude as number]
    );
    if (userLocation) {
      positions.push([userLocation.latitude, userLocation.longitude]);
    }
    return positions;
  }, [servicesWithLocation, userLocation]);

  // Default fallback center (Colombo) used only until markers are available.
  const defaultCenter: L.LatLngExpression = userLocation
    ? [userLocation.latitude, userLocation.longitude]
    : markerPositions[0] || [6.9271, 79.8612];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation2 className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900">Service Locations</h3>
            <p className="text-sm text-gray-600">
              {servicesWithLocation.length} of {services.length} services shown on map
              {userLocation && ' • Your location marked'}
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      {/* Shorter on phones so the map doesn't eat the whole viewport and push
          the results out of view. */}
      <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-300 shadow-lg sm:h-96">
        <MapContainer
          center={defaultCenter}
          zoom={10}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <MapAutoResize />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {servicesWithLocation.map((service, index) => (
            <ServiceMarker
              key={service.id}
              service={service}
              index={index}
              userLocation={userLocation}
            />
          ))}

          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}

          <FitBoundsToMarkers positions={markerPositions} />
        </MapContainer>
      </div>

      {/* Map Instructions */}
      {servicesWithLocation.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>How to use this map:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-1 space-y-0.5">
                <li>• Click on numbered markers to view service details</li>
                <li>• Blue marker shows your search location</li>
                <li>• Green markers show available services</li>
                <li>• Click "View Service" to open the service page</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* No Location Services Notice */}
      {services.length > servicesWithLocation.length && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              {services.length - servicesWithLocation.length} service(s) not shown on map (location not available)
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResultsMap;
