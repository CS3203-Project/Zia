import type { LocationInfo } from '../../../services/locationService';

export interface WorkingHours {
  monday: { enabled: boolean; startTime: string; endTime: string };
  tuesday: { enabled: boolean; startTime: string; endTime: string };
  wednesday: { enabled: boolean; startTime: string; endTime: string };
  thursday: { enabled: boolean; startTime: string; endTime: string };
  friday: { enabled: boolean; startTime: string; endTime: string };
  saturday: { enabled: boolean; startTime: string; endTime: string };
  sunday: { enabled: boolean; startTime: string; endTime: string };
}

export interface CreateServiceFormData {
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  tags: string[];
  images: File[];
  uploadedImageUrls: string[];
  video: File | null;
  uploadedVideoUrl: string;
  workingTime: WorkingHours;
  isActive: boolean;
  // Location fields
  location: LocationInfo & { serviceRadiusKm?: number };
}

export interface CreateServiceFormErrors {
  categoryId?: string;
  title?: string;
  description?: string;
  price?: string;
  images?: string;
}

export const defaultWorkingHours: WorkingHours = {
  monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  saturday: { enabled: false, startTime: '10:00', endTime: '16:00' },
  sunday: { enabled: false, startTime: '10:00', endTime: '16:00' },
};

export const daysOfWeek: { key: keyof WorkingHours; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];
