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

  /**
   * Tells Core that an online payment settled, so the booking can move to PAID.
   * Without this the booking would stay ACCEPTED forever and the customer would
   * still be shown a Pay Now button after paying.
   */
  async markBookingPaid(bookingId: string, paymentId: string): Promise<void> {
    const response = await fetch(`${CORE_SERVICE_URL}/internal/bookings/mark-paid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': INTERNAL_API_KEY,
      },
      body: JSON.stringify({ bookingId, paymentId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark booking paid: ${response.status}`);
    }
  }
}

export default new CoreClient();
