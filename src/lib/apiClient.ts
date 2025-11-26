/**
 * Base API Client for NestJS Backend
 * Handles authentication and base URL configuration
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: boolean;
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    // Normalize base URL - remove trailing slashes
    const normalizedURL = baseURL.trim().replace(/\/+$/, '');
    
    // Only append /api for localhost (development) if URL doesn't contain /apitest
    // Production server (camsstaging.microlent.com/apitest) doesn't use /api prefix
    // Local: http://localhost:3000/api → stays as is (already has /api)
    // Local with /apitest: http://localhost:3000/apitest → stays as is (no /api needed)
    // Live: https://camsstaging.microlent.com/apitest → stays as is (no /api needed)
    if ((normalizedURL.includes('localhost') || normalizedURL.includes('127.0.0.1')) && !normalizedURL.includes('/apitest')) {
      // Local development: ensure /api is present (only if not using /apitest)
      this.baseURL = normalizedURL.endsWith('/api') ? normalizedURL : `${normalizedURL}/api`;
    } else {
      // Production or /apitest paths: use base URL as-is (no /api prefix)
      this.baseURL = normalizedURL;
    }
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    try {
      return localStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          success: false,
          statusCode: response.status,
          message: data.message || 'Request failed',
          error: data.error,
          timestamp: data.timestamp || new Date().toISOString(),
          path: data.path,
        };
        throw error;
      }

      // Handle both standard response format and direct data
      if (data.success !== undefined) {
        return data as ApiResponse<T>;
      } else {
        // If response doesn't have standard format, wrap it
        return {
          success: true,
          statusCode: response.status,
          message: 'Success',
          data: data as T,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw {
        success: false,
        statusCode: 0,
        message: error instanceof Error ? error.message : 'Network error',
        timestamp: new Date().toISOString(),
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

