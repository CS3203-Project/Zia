//locationPickerAdvanced

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Target, Search, Loader2, Navigation, X } from 'lucide-react';
import { hybridSearchApi } from '../../api/hybridSearchApi';
import type { LocationParams, AddressSuggestion } from '../../api/hybridSearchApi';
import LocationPickerMap from './LocationPickerMap';

interface LocationPickerProps {
  value?: LocationParams;
  onChange: (location: LocationParams | null) => void;
  placeholder?: string;
  className?: string;
  showRadius?: boolean;
  defaultRadius?: number;
  maxRadius?: number;
  autoDetect?: boolean;
  disabled?: boolean;
  allowManualRadius?: boolean; // Allow manual radius input instead of slider
  showMap?: boolean; // New prop to show/hide map integration
  bordered?: boolean; // Set false when embedded in a compound field that owns its own border/focus ring
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Enter location or use current location",
  className = '',
  showRadius = true,
  maxRadius = 50,
  autoDetect = false,
  disabled = false,
  allowManualRadius = true,
  showMap = true,
  bordered = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRadiusInput, setShowRadiusInput] = useState(false);
  const [manualRadius, setManualRadius] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  // Auto-detect location on mount if enabled
  useEffect(() => {
    if (autoDetect && !value) {
      handleCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetect, value]);

  // Update manual radius input when value changes externally
  useEffect(() => {
    if (value?.radius !== undefined && value.radius !== parseFloat(manualRadius)) {
      setManualRadius(value.radius.toString());
    }
  }, [value?.radius]);

  // Update input value when location value changes externally
  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    } else if (value?.latitude !== undefined && value?.longitude !== undefined && !value.address) {
      setInputValue(`${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError(null);

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    if (!newValue.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      onChange(null);
      return;
    }

    // Debounce address suggestion lookups against the Nominatim-backed API,
    // which has a strict rate limit on the public server.
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        setIsSuggesting(true);
        const response = await hybridSearchApi.searchAddressSuggestions(newValue);
        if (response.success) {
          setSuggestions(response.data);
          setIsOpen(response.data.length > 0);
        }
      } catch (err) {
        console.error('Address suggestion error:', err);
      } finally {
        setIsSuggesting(false);
      }
    }, 400);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.displayName);
    setIsOpen(false);
    setSuggestions([]);
    setError(null);

    // Nominatim suggestions already include lat/lng, so no extra
    // "place details" lookup is needed before calling onChange.
    const location: LocationParams = {
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      address: suggestion.displayName,
      radius: undefined // Start without radius, let user add it if needed
    };
    onChange(location);
  };

  // Fallback for manual Enter-key submission when no suggestion is selected
  const handleManualGeocode = async (address: string) => {
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await hybridSearchApi.geocodeAddress(address);
      if (response.success && response.data) {
        const location: LocationParams = {
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          address: response.data.address || address,
          radius: undefined // Start without radius, let user add it if needed
        };
        onChange(location);
      } else {
        throw new Error('Failed to geocode address');
      }
    } catch (err) {
      setError('Failed to get location details');
      console.error('Geocoding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    setIsGettingLocation(true);
    setError(null);

    try {
      // Try browser geolocation first
      const position = await hybridSearchApi.getCurrentLocation();
      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const response = await hybridSearchApi.reverseGeocode(latitude, longitude);

      const location: LocationParams = {
        latitude,
        longitude,
        address: response.data?.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        radius: undefined // Start without radius, let user add it if needed
      };

      setInputValue(location.address || 'Current location');
      onChange(location);
    } catch {
      // Fallback to IP-based location
      try {
        const response = await hybridSearchApi.getLocationFromIP();
        if (response.success && response.data) {
          const location: LocationParams = {
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            address: response.data.address || 'Current location (approximate)',
            radius: showRadius ? undefined : undefined // Start without radius, let user add it if needed
          };
          setInputValue(location.address || 'Current location');
          onChange(location);
        } else {
          throw new Error('IP location failed');
        }
      } catch {
        setError('Unable to detect current location. Please enter manually.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
    setSuggestions([]);
    setError(null);
    onChange(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSuggestions([]);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && suggestions.length > 0) {
        handleSuggestionSelect(suggestions[0]);
      } else if (inputValue.trim()) {
        handleManualGeocode(inputValue.trim());
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Location Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled || isLoading || isGettingLocation}
          className={`
            block w-full pl-10 pr-20 py-3 rounded-lg
            placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${bordered ? 'border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500' : 'border-none bg-transparent focus:ring-0'}
            ${error && bordered ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
          `}
          style={{ outline: 'none' }}
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
          {(isLoading || isGettingLocation || isSuggesting) && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}

          {inputValue && !isLoading && !isGettingLocation && (
            <button
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </button>
          )}

          <button
            onClick={handleCurrentLocation}
            disabled={disabled || isLoading || isGettingLocation}
            className="p-1 text-gray-400 hover:text-orange-600 disabled:cursor-not-allowed"
            title="Use current location"
          >
            <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.lat}-${suggestion.lng}-${index}`}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex items-center space-x-3">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.displayName}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Radius, map and the selected-location summary.
          When embedded in a compound field (bordered={false}, e.g. the homepage
          search pill) these float below the input instead of sitting in flow -
          otherwise they expand the pill and spill outside its rounded frame. */}
      <div
        className={
          bordered
            ? undefined
            : 'absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl empty:hidden'
        }
      >
      {/* Add Service Radius Button and Input */}
      {showRadius && value && allowManualRadius && (
        <div className="mt-3 space-y-3">
          {!showRadiusInput ? (
            <button
              onClick={() => setShowRadiusInput(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Add Service Radius
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Search Radius (km)
                </label>
                <button
                  onClick={() => {
                    setShowRadiusInput(false);
                    setManualRadius('');
                    if (value) {
                      onChange({
                        ...value,
                        radius: undefined
                      });
                    }
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Remove
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={maxRadius}
                value={manualRadius}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setManualRadius(newValue);
                  const numValue = newValue ? parseFloat(newValue) : undefined;
                  if (value && numValue && numValue > 0) {
                    onChange({
                      ...value,
                      radius: numValue
                    });
                  } else if (value) {
                    onChange({
                      ...value,
                      radius: undefined
                    });
                  }
                }}
                placeholder="Enter radius in km (leave empty for unlimited)"
                disabled={disabled}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {manualRadius && (
                <p className="text-xs text-gray-600">
                  Searching within {manualRadius} km of selected location
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Map Visualizer - Show when map is enabled and there's a location */}
      {showMap && value && value.latitude !== undefined && value.longitude !== undefined && (
        <div className="mt-4">
          <LocationPickerMap
            value={value}
            onChange={onChange}
            allowManualRadius={allowManualRadius}
            className="w-full"
          />
        </div>
      )}

      {/* Current Location Display */}
      {value && (value.latitude !== undefined || value.address) && (
        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 text-sm text-orange-800">
            <Target className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {value.address || 'Selected location'}
              </div>
              {value.latitude !== undefined && value.longitude !== undefined && (
                <div className="text-xs text-orange-600 truncate">
                  {value.latitude.toFixed(4)}, {value.longitude.toFixed(4)}
                  {showRadius && value.radius && ` • ${value.radius}km radius`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LocationPicker;
