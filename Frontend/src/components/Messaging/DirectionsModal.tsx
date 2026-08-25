import React, { useEffect, useState } from 'react';
import { X, Navigation, Loader2, MapPinOff, ExternalLink } from 'lucide-react';
import ServiceLocationMap from '../shared/ServiceLocationMap';
import { hybridSearchApi } from '../../api/hybridSearchApi';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Known coordinates, when the destination was pinned on a map. */
  latitude?: number | null;
  longitude?: number | null;
  /** Fallback used to geocode when no coordinates were stored. */
  address?: string | null;
}

/**
 * Shows directions to the other party on an OpenStreetMap map, in-app, rather
 * than handing off to an external maps site. Reuses ServiceLocationMap, which
 * already draws the route from the viewer's current position.
 *
 * Addresses are geocoded on open because customers only have a free-text address
 * (users have no stored coordinates), while services keep real lat/lng.
 */
const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen, onClose, title, latitude, longitude, address,
}) => {
  const hasCoords = latitude != null && longitude != null;
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    hasCoords ? { latitude: latitude!, longitude: longitude! } : null
  );
  const [resolving, setResolving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (hasCoords) {
      setCoords({ latitude: latitude!, longitude: longitude! });
      setFailed(false);
      return;
    }

    if (!address) {
      setFailed(true);
      return;
    }

    let alive = true;
    setResolving(true);
    setFailed(false);

    hybridSearchApi
      .geocodeAddress(address)
      .then((res) => {
        if (!alive) return;
        const data = res?.data as { latitude?: number; longitude?: number } | undefined;
        if (data?.latitude != null && data?.longitude != null) {
          setCoords({ latitude: data.latitude, longitude: data.longitude });
        } else {
          setFailed(true);
        }
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setResolving(false));

    return () => {
      alive = false;
    };
  }, [isOpen, hasCoords, latitude, longitude, address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4">
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white border border-gray-100 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center min-w-0">
            <Navigation className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" />
            <span className="truncate">Directions</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors flex-shrink-0"
            aria-label="Close directions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-500 mb-4 truncate">{title}</p>

          {resolving && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-2xl border border-gray-100">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
              <p className="text-sm text-gray-500">Locating on the map…</p>
            </div>
          )}

          {!resolving && failed && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-2xl border border-gray-100 px-6 text-center">
              <MapPinOff className="h-7 w-7 text-gray-300" />
              <p className="text-sm text-gray-500">
                We couldn&apos;t place {address ? `“${address}”` : 'this address'} on the map.
              </p>
            </div>
          )}

          {!resolving && !failed && coords && (
            <ServiceLocationMap
              destination={{ latitude: coords.latitude, longitude: coords.longitude }}
              destinationLabel={title}
              className="w-full"
            />
          )}
        </div>

        {/* Escape hatch to a full navigation app - the in-app map is for orientation,
            but turn-by-turn on a phone is better handled by Google Maps. */}
        {(coords || address) && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                coords ? `${coords.latitude},${coords.longitude}` : address!
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionsModal;
