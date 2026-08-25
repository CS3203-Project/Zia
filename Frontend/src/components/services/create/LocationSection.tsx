import React from 'react';
import LocationPickerAdvanced from '../../shared/LocationPickerAdvanced';
import type { LocationInfo } from '../../../services/locationService';

interface LocationSectionProps {
  location: LocationInfo & { serviceRadiusKm?: number };
  isDisabled: boolean;
  onLocationChange: (location: LocationInfo & { serviceRadiusKm?: number }) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({ location, isDisabled, onLocationChange }) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
        <span>Service Location</span>
        <span className="ml-3 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          Optional
        </span>
      </h2>

      <div className="relative z-10">
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-4">
            Specify your service location to help customers find services near them.
            If no location is provided, your service will be available everywhere.
          </p>
        </div>

        <LocationPickerAdvanced
          value={location}
          onChange={onLocationChange}
          className="w-full"
          disabled={isDisabled}
          showMap={true}
        />
      </div>
    </div>
  );
};

export default LocationSection;
