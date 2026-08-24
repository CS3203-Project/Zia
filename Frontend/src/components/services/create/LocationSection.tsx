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
    <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_1px_2px_0_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]">
      <h2 className="text-xl font-bold bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent mb-6 flex items-center relative z-10">
        <span className="bg-gradient-to-br from-black from-30% to-black/40 bg-clip-text text-transparent">Service Location</span>
        <span className="ml-3 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200">
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
