const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

export interface CoreUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  location: string | null;
  role: string;
}

export interface CoreService {
  id: string;
  title: string | null;
  price: string;
  providerId: string;
}

export interface CoreProvider {
  id: string;
  userId: string;
}

export interface CoreAdmin {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
}

async function internalGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${CORE_SERVICE_URL}${path}`, {
    headers: { 'x-internal-key': INTERNAL_API_KEY },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Core service request failed: ${response.status} ${path}`);
  }

  return (await response.json()) as T;
}

class CoreClient {
  getUser(userId: string): Promise<CoreUser | null> {
    return internalGet<CoreUser>(`/internal/users/${userId}`);
  }

  getService(serviceId: string): Promise<CoreService | null> {
    return internalGet<CoreService>(`/internal/services/${serviceId}`);
  }

  getProvider(providerId: string): Promise<CoreProvider | null> {
    return internalGet<CoreProvider>(`/internal/providers/${providerId}`);
  }

  getProviderByUserId(userId: string): Promise<CoreProvider | null> {
    return internalGet<CoreProvider>(`/internal/providers/by-user/${userId}`);
  }

  getAdmin(adminId: number): Promise<CoreAdmin | null> {
    return internalGet<CoreAdmin>(`/internal/admins/${adminId}`);
  }
}

export default new CoreClient();
