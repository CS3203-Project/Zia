import React from 'react';
import { CheckCircle, CreditCard, Clock, Calendar } from 'lucide-react';
import type { ProviderProfile } from '../../../api/userApi';
import type { DetailedService } from '../../../Pages/services/ServiceDetailPage';
import ServiceProviderCard from './ServiceProviderCard';
import ServiceQRCodePanel from './ServiceQRCodePanel';

interface ServiceBookingSidebarProps {
  service: DetailedService;
  provider: ProviderProfile | null;
  providerLoading: boolean;
  onViewProviderProfile: () => void;
  onPayNow: () => void;
  onBookNow: () => void;
  bookingLoading: boolean;
  qrCodeUrl: string;
  onDownloadQR: () => void;
  onShareService: () => void;
}

const BookingLoadingIndicator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center justify-center gap-2">
    <div className="flex gap-1">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
    </div>
    <span>{label}</span>
  </div>
);

/**
 * Right-column "unified" card on the service detail page: provider profile,
 * price, Pay Now / Book Now / Message Provider actions, QR code panel, and
 * working hours - plus the glassmorphism glow effect behind the card.
 */
const ServiceBookingSidebar: React.FC<ServiceBookingSidebarProps> = ({
  service,
  provider,
  providerLoading,
  onViewProviderProfile,
  onPayNow,
  onBookNow,
  bookingLoading,
  qrCodeUrl,
  onDownloadQR,
  onShareService
}) => {
  return (
    <div className="lg:col-span-1 space-y-6 pb-10">
      {/* Unified Glass Morphism Card */}
      <div className="relative">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
          {/* Provider Profile Section */}
          <ServiceProviderCard
            provider={provider}
            providerLoading={providerLoading}
            onViewProfile={onViewProviderProfile}
          />

          {/* Price Section */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {service.currency} {service.price.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mb-4">Starting price</div>
            <div className="flex items-center justify-center text-gray-900 bg-gray-50 rounded-full px-4 py-2 border border-gray-100 shadow-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Available now</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={onPayNow}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 px-6 rounded-full font-bold hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-xl hover:shadow-2xl border border-orange-500/20 backdrop-blur-sm flex items-center justify-center"
              style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.3)' }}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Pay Now
            </button>

            <button
              onClick={onBookNow}
              disabled={bookingLoading}
              className="w-full bg-white text-gray-900 py-4 px-6 rounded-full font-bold hover:bg-orange-50 hover:border-orange-300 hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {bookingLoading ? <BookingLoadingIndicator label="Creating conversation" /> : 'Book Now'}
            </button>
            <button
              onClick={onBookNow}
              disabled={bookingLoading}
              className="w-full bg-white text-gray-900 py-4 px-6 rounded-full font-bold hover:bg-orange-50 hover:border-orange-300 hover:scale-105 hover:-translate-y-0.5 active:scale-100 transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {bookingLoading ? <BookingLoadingIndicator label="Creating conversation" /> : 'Message Provider'}
            </button>
          </div>

          {/* QR Code Section */}
          <ServiceQRCodePanel
            qrCodeUrl={qrCodeUrl}
            onDownload={onDownloadQR}
            onShare={onShareService}
          />

          {/* Working Hours Section */}
          {service.workingTime && service.workingTime.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Working Hours
              </h4>
              <div className="space-y-2">
                {service.workingTime.map((time, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-100 shadow-sm"
                  >
                    <Calendar className="w-3.5 h-3.5 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-900 font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Glassmorphism glow effect */}
        <div className="absolute inset-0 rounded-3xl -z-10 transition-all duration-500 ease-out blur-3xl opacity-30 bg-gradient-to-br from-orange-300/40 via-amber-200/20 to-orange-300/40" />
      </div>
    </div>
  );
};

export default ServiceBookingSidebar;
