//locationPickerMap
import '../../utils/leafletSetup';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { MapPin, Search, Navigation, X, Loader2 } from 'lucide-react';
import { hybridSearchApi } from '../../api/hybridSearchApi';
import type { LocationParams, AddressSuggestion } from '../../api/hybridSearchApi';

interface LocationPickerMapProps {
  value?: LocationParams;
  onChange: (location: LocationParams | null) => void;
  placeholder?: string;
  className?: string;
  allowManualRadius?: boolean;
}

type LatLngTuple = [number, number];

const DEFAULT_CENTER: LatLngTuple = [6.9271, 79.8612]; // Colombo default
const DEFAULT_ZOOM = 13;
const SELECTED_ZOOM = 15;

// react-leaflet only reads MapContainer's center/zoom props on first render,
// so this keeps the view in sync whenever the location changes externally.
const MapViewSync: React.FC<{ center: LatLngTuple; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
};

// Repositions the marker when the map itself is clicked
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Main Location Picker Map Component
const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = '',
  allowManualRadius = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(
    value?.latitude !== undefined && value?.longitude !== undefined
      ? [value.latitude, value.longitude]
      : DEFAULT_CENTER
  );
  const [zoom, setZoom] = useState<number>(
    value?.latitude !== undefined && value?.longitude !== undefined
      ? (value.radius && value.radius > 0 ? 11 : SELECTED_ZOOM)
      : DEFAULT_ZOOM
  );
  const [showRadiusInput, setShowRadiusInput] = useState(false);
  const [manualRadius, setManualRadius] = useState<string>('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  // Update search box + map view when location value changes externally
  useEffect(() => {
    if (value?.address && value.address !== searchQuery && showSearch) {
      setSearchQuery(value.address);
    }
    if (value?.latitude !== undefined && value?.longitude !== undefined) {
      setMapCenter([value.latitude, value.longitude]);
      setZoom(value.radius && value.radius > 0 ? 11 : SELECTED_ZOOM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, showSearch]);

  // Update radius state when value changes
  useEffect(() => {
    if (value?.radius !== undefined) {
      setManualRadius(value.radius.toString());
      setShowRadiusInput(value.radius > 0);
    } else {
      setManualRadius('');
      setShowRadiusInput(false);
    }
  }, [value?.radius]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!newValue.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await hybridSearchApi.searchAddressSuggestions(newValue);
        setSearchResults(response.success ? response.data : []);
      } catch (err) {
        console.error('Address suggestion error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const location: LocationParams = {
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      address: suggestion.displayName,
      radius: value?.radius
    };
    onChange(location);
    setSearchQuery(suggestion.displayName);
    setSearchResults([]);
    setMapCenter([suggestion.lat, suggestion.lng]);
    setZoom(SELECTED_ZOOM);
  };

  const handleMapClick = (lat: number, lng: number) => {
    const location: LocationParams = {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      radius: value?.radius
    };
    onChange(location);
  };

  const handleMarkerDrag = () => {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    const location: LocationParams = {
      latitude: lat,
      longitude: lng,
      address: value?.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      radius: value?.radius
    };
    onChange(location);
  };

  const markerEventHandlers = useMemo(
    () => ({
      dragend: handleMarkerDrag
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value?.address, value?.radius]
  );

  const handleUseCurrentLocation = async () => {
    try {
      const position = await hybridSearchApi.getCurrentLocation();
      const { latitude, longitude } = position.coords;
      const location: LocationParams = {
        latitude,
        longitude,
        address: 'Current location',
        radius: value?.radius
      };
      onChange(location);
      setMapCenter([latitude, longitude]);
      setZoom(SELECTED_ZOOM);
    } catch (err) {
      console.error('Geolocation error:', err);
    }
  };

  const clearLocation = () => {
    setSearchQuery('');
    setSearchResults([]);
    onChange(null);
  };

  const markerPosition: LatLngTuple | null =
    value?.latitude !== undefined && value?.longitude !== undefined
      ? [value.latitude, value.longitude]
      : null;

  const radiusMeters =
    allowManualRadius && showRadiusInput && manualRadius ? parseFloat(manualRadius) * 1000 : undefined;

  return (
    <div className={`relative ${className}`}>
      {/* Map Container - Made wider by using aspect ratio */}
      <div className="w-full aspect-[16/10] min-h-[280px] relative">
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          scrollWheelZoom={false}
          className="w-full h-full rounded-lg border border-gray-300"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapViewSync center={mapCenter} zoom={zoom} />
          <MapClickHandler onMapClick={handleMapClick} />

          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable
              ref={markerRef}
              eventHandlers={markerEventHandlers}
            />
          )}

          {markerPosition && radiusMeters !== undefined && !Number.isNaN(radiusMeters) && radiusMeters > 0 && (
            <Circle
              center={markerPosition}
              radius={radiusMeters}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.1, weight: 2 }}
            />
          )}
        </MapContainer>

        {/* Search Toggle Button */}
        <button
          onClick={toggleSearch}
          className="absolute top-3 left-3 z-[1000] p-2 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-300 transition-colors"
          title={showSearch ? "Hide search" : "Show search"}
        >
          <Search className="w-5 h-5 text-gray-700" />
        </button>

        {/* Clear Button */}
        {value && (
          <button
            onClick={clearLocation}
            className="absolute top-3 right-3 z-[1000] p-2 bg-white hover:bg-red-50 rounded-lg shadow-lg border border-gray-300 hover:border-red-300 transition-colors"
            title="Clear location"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        )}

        {/* Current Location Button */}
        <button
          onClick={handleUseCurrentLocation}
          className="absolute top-16 left-3 z-[1000] p-2 bg-white hover:bg-blue-50 rounded-lg shadow-lg border border-gray-300 hover:border-blue-300 transition-colors"
          title="Use current location"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>

        {/* Search Input Overlay */}
        {showSearch && (
          <div className="absolute top-3 left-16 right-3 z-[1000]">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder={placeholder}
                className="w-full px-4 py-3 pl-12 bg-white border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                {isSearching ? (
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {searchResults.length > 0 && (
                <div className="absolute z-[1000] mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {searchResults.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.displayName}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!value && !showSearch && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg pointer-events-none">
            <div className="text-center text-white">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="font-medium">Search by typing or click on the map</p>
              <p className="text-sm opacity-90">Drag markers to adjust location</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerMap;
