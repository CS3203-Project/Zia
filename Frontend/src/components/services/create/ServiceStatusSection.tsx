import React from 'react';
import { FiEye } from 'react-icons/fi';

interface ServiceStatusSectionProps {
  isActive: boolean;
  onToggleActive: (isActive: boolean) => void;
}

const ServiceStatusSection: React.FC<ServiceStatusSectionProps> = ({ isActive, onToggleActive }) => {
  return (
    <div className="pb-8 border-b border-gray-100">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
      <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
      Service Status
      </h2>
      <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100 relative z-10">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg border ${isActive ? 'bg-orange-100 border-orange-200' : 'bg-gray-100 border-gray-200'}`}>
        <FiEye className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} />
        </div>
        <div>
        <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
          {isActive ? 'Service Active' : 'Service Inactive'}
        </p>
        <p className="text-sm text-gray-500">
          {isActive
          ? 'Your service will be visible to customers and available for booking'
          : 'Your service will be hidden from customers and unavailable for booking'
          }
        </p>
        </div>
      </div>
      <label className="flex items-center cursor-pointer">
        <div className="relative">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => onToggleActive(e.target.checked)}
          className="sr-only"
          aria-label="Toggle service active status"
        />
        <div className={`w-12 h-6 rounded-full shadow-inner transition-colors duration-300 border-2 ${
          isActive ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-300'
        }`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 ml-0.5 transition-transform duration-300 border ${
          isActive ? 'transform translate-x-6 border-orange-500' : 'border-gray-300'
          }`}></div>
        </div>
        </div>
      </label>
      </div>
    </div>
  );
};

export default ServiceStatusSection;
