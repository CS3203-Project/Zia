import { config } from 'dotenv';
import { redis } from '../utils/redis.js';

config();

// Field names here match what the frontend has always expected from these
// endpoints (see Frontend/src/api/hybridSearchApi.ts's LocationInfo and
// Frontend/src/services/locationService.ts's LocationInfo) — NOT Nominatim's
// own field names, which get mapped onto this shape in toLocationData().
interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

export interface AddressSuggestion {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
// Nominatim's usage policy requires a descriptive User-Agent identifying the application.
const USER_AGENT = 'Zia-Marketplace/1.0 (+https://github.com/zia-app)';

// Nominatim results don't change; cache them for a week rather than forever. A plain
// in-memory Map here would (a) grow unbounded for the life of the process — a slow
// memory leak — and (b) only ever be warm for whichever single pod happened to serve a
// given address before, so cache hit rate would fall as replicas scale up. Redis fixes
// both: bounded by TTL, shared across every pod.
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;
const CACHE_KEY_PREFIX = 'geocode:';

// Nominatim's usage policy caps public-instance traffic at ~1 request/second, and that
// budget is shared by the whole deployment, not per pod — a per-process throttle alone
// would let N pods each independently send ~1 req/sec, N req/sec in total. This acquires
// a short-lived Redis lock before every outbound call so at most one request goes out
// per second no matter how many pods are running.
const THROTTLE_KEY = 'geocode:nominatim-throttle';
const THROTTLE_INTERVAL_MS = 1000;
const THROTTLE_MAX_WAIT_MS = 5000;
const THROTTLE_POLL_MS = 100;

async function throttleNominatimRequest(): Promise<void> {
  const deadline = Date.now() + THROTTLE_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    const acquired = await redis.set(THROTTLE_KEY, '1', 'PX', THROTTLE_INTERVAL_MS, 'NX');
    if (acquired) return;
    await new Promise((resolve) => setTimeout(resolve, THROTTLE_POLL_MS));
  }
  // Waited long enough — proceed anyway rather than fail the caller's request outright;
  // slightly exceeding Nominatim's budget occasionally beats a hard failure.
}

class GeocodingService {
  /**
   * Convert address to coordinates using the Nominatim (OpenStreetMap) search API
   */
  async geocodeAddress(address: string): Promise<LocationData> {
    const cacheKey = `${CACHE_KEY_PREFIX}fwd:${address}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      await throttleNominatimRequest();

      const url = `${NOMINATIM_BASE_URL}/search?${new URLSearchParams({
        q: address,
        format: 'jsonv2',
        addressdetails: '1',
        limit: '1',
      })}`;

      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) {
        throw new Error(`Nominatim search failed with status ${response.status}`);
      }

      const results = (await response.json()) as NominatimResult[];
      if (!results || results.length === 0 || !results[0]) {
        throw new Error('Address not found');
      }

      const locationData = this.toLocationData(results[0]);

      await this.setCached(cacheKey, locationData);

      return locationData;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(`Failed to geocode address: ${address}`);
    }
  }

  /**
   * Convert coordinates to address using the Nominatim (OpenStreetMap) reverse API
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationData> {
    const cacheKey = `${CACHE_KEY_PREFIX}rev:${lat},${lng}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      await throttleNominatimRequest();

      const url = `${NOMINATIM_BASE_URL}/reverse?${new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: 'jsonv2',
        addressdetails: '1',
      })}`;

      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) {
        throw new Error(`Nominatim reverse geocode failed with status ${response.status}`);
      }

      const result = (await response.json()) as NominatimResult;
      if (!result || !result.display_name) {
        throw new Error('Location not found');
      }

      const locationData = this.toLocationData(result, { lat, lng });

      await this.setCached(cacheKey, locationData);

      return locationData;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error(`Failed to reverse geocode coordinates: ${lat}, ${lng}`);
    }
  }

  /**
   * Search for multiple address candidates (for a type-ahead suggestion list).
   * Not cached — each keystroke's query is effectively unique — but still throttled,
   * since this is the endpoint most likely to be called frequently.
   */
  async searchAddress(query: string, limit = 5): Promise<AddressSuggestion[]> {
    try {
      await throttleNominatimRequest();

      const url = `${NOMINATIM_BASE_URL}/search?${new URLSearchParams({
        q: query,
        format: 'jsonv2',
        addressdetails: '0',
        limit: String(Math.min(Math.max(limit, 1), 10)),
      })}`;

      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!response.ok) {
        throw new Error(`Nominatim search failed with status ${response.status}`);
      }

      const results = (await response.json()) as NominatimResult[];
      return results.map((result) => ({
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      }));
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Calculate distance between two points in kilometers (Haversine formula)
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get location from IP address as fallback
   */
  async getLocationFromIP(ip?: string): Promise<Partial<LocationData>> {
    try {
      // Using a free IP geolocation service
      const url = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.error) {
        throw new Error(data.reason || 'IP geolocation failed');
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || '',
        state: data.region || '',
        country: data.country_name || '',
        postalCode: data.postal || '',
        address: `${data.city}, ${data.region}, ${data.country_name}`
      };
    } catch (error) {
      console.error('IP geolocation error:', error);
      throw new Error('Could not determine location from IP');
    }
  }

  /**
   * Map a Nominatim result into our LocationData shape
   */
  private toLocationData(result: NominatimResult, coords?: { lat: number; lng: number }): LocationData {
    const address = result.address || {};
    return {
      latitude: coords?.lat ?? parseFloat(result.lat),
      longitude: coords?.lng ?? parseFloat(result.lon),
      address: result.display_name,
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || '',
      country: address.country || '',
      postalCode: address.postcode || '',
    };
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private async getCached(key: string): Promise<LocationData | null> {
    try {
      const raw = await redis.get(key);
      return raw ? (JSON.parse(raw) as LocationData) : null;
    } catch (error) {
      // Cache being unreachable shouldn't break geocoding — just miss and fetch fresh.
      console.error('Redis geocode cache read error:', error);
      return null;
    }
  }

  private async setCached(key: string, value: LocationData): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', CACHE_TTL_SECONDS);
    } catch (error) {
      console.error('Redis geocode cache write error:', error);
    }
  }

  /**
   * Clear all cached geocoding results
   */
  async clearCache(): Promise<void> {
    const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  /**
   * Get the number of cached geocoding results
   */
  async getCacheSize(): Promise<number> {
    const keys = await redis.keys(`${CACHE_KEY_PREFIX}*`);
    return keys.length;
  }
}

export default new GeocodingService();
