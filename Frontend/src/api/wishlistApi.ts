import apiClient from './axios';

export interface WishlistEntry {
  savedAt: string;
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
    category?: { id: string; name: string; slug: string };
    provider?: {
      id: string;
      averageRating?: number;
      user?: { firstName: string; lastName: string; imageUrl?: string };
    };
  };
}

export const wishlistApi = {
  async list(): Promise<WishlistEntry[]> {
    const { data } = await apiClient.get('/wishlist');
    return data.data ?? [];
  },

  async save(serviceId: string): Promise<void> {
    await apiClient.post(`/wishlist/${serviceId}`);
  },

  async remove(serviceId: string): Promise<void> {
    await apiClient.delete(`/wishlist/${serviceId}`);
  },
};
