import { API_BASE_URL } from '../config';
import authService from './auth';

/**
 * API wrapper that handles authentication errors globally.
 * On 401 responses, clears auth and redirects to login.
 */
class ApiService {
  /**
   * Wrapper around fetch that adds auth token and handles 401 errors
   */
  async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = authService.getAccessToken();

    // Add auth header if we have a token
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - session expired or invalid token
    if (response.status === 401) {
      this.handleAuthError();
      throw new Error('Session expired. Please log in again.');
    }

    return response;
  }

  /**
   * Convenience method for GET requests
   */
  async get(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Convenience method for POST requests
   */
  async post(endpoint: string, body?: any, options: RequestInit = {}): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    return this.fetch(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Handle authentication errors by clearing auth and redirecting to login
   */
  private handleAuthError(): void {
    // Clear auth state
    authService.clearAuth();

    // Redirect to login page using hash router format
    // Using window.location.hash since the app uses createHashRouter
    window.location.hash = '#/login';
  }
}

export default new ApiService();
