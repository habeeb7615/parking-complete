import { apiClient } from '@/lib/apiClient';

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    user_name: string;
  };
}

export interface Profile {
  id: string;
  user_name: string;
  contractor_name?: string;
  attendant_name?: string;
  email: string;
  phone_number?: string;
  role: 'super_admin' | 'contractor' | 'attendant';
  status: 'active' | 'inactive';
  is_first_login: boolean;
  device_fingerprint?: string;
  subscription_plan_id?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  subscription_status?: 'active' | 'expired' | 'suspended';
  created_on?: string;
}

export class AuthAPI {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'auth_user';
  private static readonly PROFILE_KEY = 'auth_profile';
  private static readonly CONTRACTOR_KEY = 'auth_contractor';
  private static readonly ATTENDANT_KEY = 'auth_attendant';

  /**
   * Store authentication token in localStorage
   */
  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Get authentication token from localStorage
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove authentication token from localStorage
   */
  static removeToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.PROFILE_KEY);
      localStorage.removeItem(this.CONTRACTOR_KEY);
      localStorage.removeItem(this.ATTENDANT_KEY);
      console.log('All authentication data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      // Try to clear all at once as fallback
      try {
        localStorage.clear();
      } catch (clearError) {
        console.error('Error clearing all localStorage:', clearError);
      }
    }
  }

  /**
   * Clear all authentication data (alias for removeToken for clarity)
   */
  static clearAllAuthData(): void {
    this.removeToken();
  }

  /**
   * Store user data in localStorage
   */
  static setUser(user: LoginResponse['user']): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Get user data from localStorage
   */
  static getUser(): LoginResponse['user'] | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Store profile data in localStorage
   */
  static setProfile(profile: Profile): void {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  /**
   * Get profile data from localStorage
   */
  static getProfile(): Profile | null {
    const profileStr = localStorage.getItem(this.PROFILE_KEY);
    return profileStr ? JSON.parse(profileStr) : null;
  }

  /**
   * Store contractor data in localStorage
   */
  static setContractor(contractor: any): void {
    localStorage.setItem(this.CONTRACTOR_KEY, JSON.stringify(contractor));
  }

  /**
   * Get contractor data from localStorage
   */
  static getContractor(): any | null {
    const contractorStr = localStorage.getItem(this.CONTRACTOR_KEY);
    return contractorStr ? JSON.parse(contractorStr) : null;
  }

  /**
   * Store attendant data in localStorage
   */
  static setAttendant(attendant: any): void {
    localStorage.setItem(this.ATTENDANT_KEY, JSON.stringify(attendant));
  }

  /**
   * Get attendant data from localStorage
   */
  static getAttendant(): any | null {
    const attendantStr = localStorage.getItem(this.ATTENDANT_KEY);
    return attendantStr ? JSON.parse(attendantStr) : null;
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    // Use fetch directly for login since we don't have token yet
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Login failed');
    }

    // Extract data from nested response structure
    // API returns: { success, statusCode, message, data: { access_token, user } }
    const loginData = responseData.data || responseData;

    if (!loginData.access_token || !loginData.user) {
      throw new Error('Invalid login response format');
    }

    // Store token and user data
    this.setToken(loginData.access_token);
    this.setUser(loginData.user);

    return loginData;
  }

  /**
   * Fetch current user profile from API
   */
  static async fetchProfile(): Promise<Profile> {
    const response = await apiClient.get<Profile>('/auth/profile');
    return response.data;
  }

  /**
   * Get profile by user ID
   */
  static async getProfileById(userId: string): Promise<Profile> {
    const response = await apiClient.get<Profile>(`/profiles/getOne/${userId}`);
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

