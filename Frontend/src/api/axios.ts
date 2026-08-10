import axios, { type AxiosInstance } from 'axios';

export const getAccessToken = (): string | null =>
  localStorage.getItem('authToken') || localStorage.getItem('token');

// Attaches the same auth-token and 401-handling behavior to any base client,
// so each microservice (core, chat, payment) can have its own origin/port in
// local dev while sharing identical request/response handling.
function createApiClient(baseURL: string | undefined): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 0, // No timeout - unlimited time
  });

  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      const adminToken = localStorage.getItem('adminToken');

      // Use admin token if available (for admin routes)
      if (config.url?.includes('/admin') && adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  client.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        if (error.config?.url?.includes('/admin')) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/admin-login';
        } else {
          localStorage.removeItem('token');
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// Create axios instance with base configuration (Core service)
const apiClient = createApiClient(
  import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL_PROD : import.meta.env.VITE_API_BASE_URL
);

// Payment service client — separate origin/port in local dev; in production this
// can point at the same host as Core, since ingress routes /api/payments by path.
export const paymentApiClient = createApiClient(
  import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL_PAYMENTS_PROD : import.meta.env.VITE_API_BASE_URL_PAYMENTS
);

export default apiClient;
