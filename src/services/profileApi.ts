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
      const response = await apiClient.post(`/profiles/update/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.updateProfile error:', error);
      throw error;
    }
  }

  // Get user profile by ID
  static async getProfile(userId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/profiles/getOne/${userId}`);
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.getProfile error:', error);
      throw error;
    }
  }

  // Update user password
  static async updatePassword(userId: string, oldPassword: string | undefined, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(`/profiles/updatePassword/${userId}`, {
        oldPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.updatePassword error:', error);
      throw error;
    }
  }

  // Update user email
  static async updateEmail(userId: string, newEmail: string): Promise<any> {
    try {
      const response = await apiClient.post(`/profiles/updateEmail/${userId}`, {
        newEmail
      });
      return response.data;
    } catch (error) {
      console.error('ProfileAPI.updateEmail error:', error);
      throw error;
    }
  }

  // Update user email (legacy method name - kept for backward compatibility)
  static async updateAuthEmail(newEmail: string): Promise<any> {
    try {
      // Get current user ID from auth
      const { AuthAPI } = await import('@/services/authApi');
      const user = AuthAPI.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      return this.updateEmail(user.id, newEmail);
    } catch (error) {
      console.error('ProfileAPI.updateAuthEmail error:', error);
      throw error;
    }
  }
}
