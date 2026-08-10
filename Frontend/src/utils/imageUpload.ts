import axios from 'axios';
import apiClient from '../api/axios';

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/users/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // The backend returns imageUrl directly in response.data.imageUrl
    return response.data.imageUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};

export const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImage(file));
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};