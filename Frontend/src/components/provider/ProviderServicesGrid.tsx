import { Briefcase } from 'lucide-react';
import type { ServiceResponse } from '../../api/serviceApi';
import ProviderServiceCard from './ProviderServiceCard';

interface ProviderServicesGridProps {
  services: ServiceResponse[];
  loading: boolean;
  onServiceClick: (serviceId: string) => void;
}

export default function ProviderServicesGrid({ services, loading, onServiceClick }: ProviderServicesGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="text-center py-12">
          <div className="text-gray-400">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Yet</h3>
            <p className="text-gray-500 mb-4">
              This provider hasn't created any services yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ProviderServiceCard
          key={service.id}
          service={service}
          onClick={() => onServiceClick(service.id)}
        />
      ))}
    </div>
  );
}
