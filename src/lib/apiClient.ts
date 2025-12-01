/**
 * Base API Client for NestJS Backend
 * Handles authentication and base URL configuration
 */

// In development, use relative URLs to work with Vite proxy (avoids CORS)
// In production, use the full URL from environment variable
const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // If environment URL is set and it's a production URL (not localhost), use it directly
  // This ensures consistency with login API which also uses the full production URL
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  
  // In development mode, use relative URLs to leverage Vite proxy (avoids CORS issues)
  if (import.meta.env.DEV) {
    // Check if the env URL contains /apitest (for local development)
    if (envUrl && envUrl.includes('/apitest')) {
      return '/apitest';
    }
    // Default to /apitest for development (consistent with production)
    return '/apitest';
  }
  
  // In production, use the full URL from environment variable or fallback
  if (envUrl) {
    return envUrl;
  }
  
  // Production fallback
  return 'http://localhost:3000/apitest';
};

const API_BASE_URL = getApiBaseURL();

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
    
    // If using relative URLs (for Vite proxy in development), use as-is
    if (normalizedURL.startsWith('/')) {
      this.baseURL = normalizedURL;
      return;
    }
    
    // Ensure /apitest is present for localhost (development) if URL doesn't already have a path
    // Production server (habbo.microlent.com/apitest) already has /apitest
    // Local: http://localhost:3000 → append /apitest
    // Local with /apitest: http://localhost:3000/apitest → stays as is
    // Live: https://habbo.microlent.com/apitest → stays as is
    if ((normalizedURL.includes('localhost') || normalizedURL.includes('127.0.0.1')) && !normalizedURL.includes('/apitest') && !normalizedURL.includes('/api')) {
      // Local development: ensure /apitest is present
      this.baseURL = `${normalizedURL}/apitest`;
    } else {
      // Production or paths with /apitest: use base URL as-is
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

      // Check if response has JSON content
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          // If JSON parsing fails, create error from response
          const error: ApiError = {
            success: false,
            statusCode: response.status,
            message: `Failed to parse response: ${response.statusText}`,
            error: 'Parse Error',
            timestamp: new Date().toISOString(),
            path: url,
          };
          throw error;
        }
      } else {
        // If not JSON, create error from status
        const error: ApiError = {
          success: false,
          statusCode: response.status,
          message: response.statusText || 'Request failed',
          error: 'HTTP Error',
          timestamp: new Date().toISOString(),
          path: url,
        };
        throw error;
      }

      if (!response.ok) {
        // Handle message as array or string
        let errorMessage = 'Request failed';
        if (data.message) {
          if (Array.isArray(data.message)) {
            // If message is an array, join them with newlines or take the first one
            errorMessage = data.message.join('. ') || data.message[0] || 'Request failed';
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          }
        }
        
        const error: ApiError = {
          success: false,
          statusCode: response.status,
          message: errorMessage,
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
      // If it's already an ApiError (thrown from !response.ok), re-throw it
      if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
        throw error;
      }
      // If it's a network error or JSON parse error, create a proper ApiError
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

