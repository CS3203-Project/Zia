import React from 'react';
import { CheckCircle, Clock, Calendar } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import type { ProviderProfile } from '../../../api/userApi';
import type { DetailedService } from '../../../Pages/services/ServiceDetailPage';
import ServiceProviderCard from './ServiceProviderCard';
import ServiceQRCodePanel from './ServiceQRCodePanel';
import SaveServiceButton from '../SaveServiceButton';

interface ServiceBookingSidebarProps {
  service: DetailedService;
  provider: ProviderProfile | null;
  providerLoading: boolean;
  onViewProviderProfile: () => void;
  onBookNow: () => void;
  bookingLoading: boolean;
  /** Status of an in-flight booking for this service, if the viewer has one. */
  activeBookingStatus?: string | null;
  /** Whether the viewer has previously completed/cancelled a booking here. */
  hasPastBooking?: boolean;
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
  onBookNow,
  bookingLoading,
  activeBookingStatus,
  hasPastBooking,
  qrCodeUrl,
  onDownloadQR,
  onShareService
}) => {
  const providerPhone = provider?.user.phone?.replace(/[^0-9]/g, '');
  const whatsappUrl = providerPhone
    ? `https://wa.me/${providerPhone}?text=${encodeURIComponent(`Hi, I'm interested in your service: ${service.title}`)}`
    : undefined;

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
              onClick={onBookNow}
              disabled={bookingLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 px-6 rounded-full font-bold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {bookingLoading ? (
                <BookingLoadingIndicator label={activeBookingStatus ? 'Opening booking' : 'Creating conversation'} />
              ) : activeBookingStatus ? (
                'Continue Booking'
              ) : (
                'Book Now'
              )}
            </button>

            {/* Make it obvious whether this reopens an in-flight booking or starts
                a new request - the same service can be booked again once finished. */}
            {activeBookingStatus && (
              <p className="text-center text-xs text-gray-500">
                You have a booking in progress ({activeBookingStatus.toLowerCase()}) — this reopens it.
              </p>
            )}
            {hasPastBooking && !activeBookingStatus && (
              <p className="text-center text-xs text-gray-500">
                You&apos;ve booked this before — this starts a new request.
              </p>
            )}

            {whatsappUrl ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-white text-gray-900 py-4 px-6 rounded-full font-bold hover:bg-emerald-50 hover:border-emerald-300 transition-colors shadow-sm border-2 border-gray-200 flex items-center justify-center"
              >
                <FaWhatsapp className="w-5 h-5 mr-2 text-emerald-600" />
                Chat on WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Provider hasn't added a contact number"
                className="w-full bg-white text-gray-400 py-4 px-6 rounded-full font-bold border-2 border-gray-200 opacity-50 cursor-not-allowed flex items-center justify-center"
              >
                <FaWhatsapp className="w-5 h-5 mr-2" />
                Chat on WhatsApp
              </button>
            )}
          </div>

          {/* Save for later, directly above the QR panel. */}
          <SaveServiceButton
            serviceId={service.id}
            ownerUserId={provider?.userId}
            className="w-full mb-4"
          />

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
