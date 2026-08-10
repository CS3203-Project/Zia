import { io } from 'socket.io-client';

// The messaging service URL includes the namespace (e.g. https://host/messaging).
// For reliability on some hosting platforms that may reject XHR polling, force
// websocket transport so the client doesn't fall back to polling POSTs which
// have been observed to return 400 (Bad Request).
const URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_BASE_URL_MESSAGES_PROD
  : import.meta.env.VITE_API_BASE_URL_MESSAGES; // communication microservice port + namespace

// Debug: log the resolved URL at runtime to help diagnose connection issues
// (will appear in browser console).
try {
  // eslint-disable-next-line no-console
  console.info('[socket] initializing socket with URL:', URL);
} catch (e) {
  // ignore
}

export const socket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  // Force websocket transport to avoid XHR polling which may be blocked/unsupported
  // by some reverse proxies or hosting platforms (and was causing 400 responses).
  transports: ['websocket'],
});

export const setSocketAuthToken = (token: string | null) => {
  socket.auth = token ? { token } : {};
};
