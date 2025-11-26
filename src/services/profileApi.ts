import { apiClient } from '@/lib/apiClient';

export interface ProfileUpdateData {
  user_name?: string;
  email?: string;
  phone_number?: string;
  contractor_name?: string;
  attendant_name?: string;
}

export class ProfileAPI {
  // Update user profile
  static async updateProfile(userId: string, updateData: ProfileUpdateData): Promise<any> {
    try {
      const response = await apiClient.put(`/profiles/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.updateProfile error:', error);
      throw error;
    }
  }

  // Get user profile by ID
  static async getProfile(userId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/profiles/${userId}`);
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.getProfile error:', error);
      throw error;
    }
  }

  // Update user email (Note: This may require backend implementation)
  static async updateAuthEmail(newEmail: string): Promise<any> {
    try {
      // TODO: Implement email update endpoint in NestJS backend
      throw new Error('Email update not yet implemented in backend');
    } catch (error) {
      console.error('ProfileAPI.updateAuthEmail error:', error);
      throw error;
    }
  }
}
