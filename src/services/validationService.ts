/**
 * Validation Service
 * ==================
 *
 * Frontend service for interacting with the validation system.
 * This service provides a simple interface to the validation registry
 * and handles fetching validation metadata from the API.
 *
 * NOTE: This service now primarily uses the validation processor registry.
 * For local validations, use getAvailableValidations() which gets them from the registry.
 * For API-based validation configs, use getValidations() which fetches from the backend.
 */

import { API_BASE_URL } from '../config';
import authService from './auth';

// Types for Validations from API
export interface Validation {
  id: number;
  name: string;
  display_name: string;
  is_required: boolean;
  description: string;
  ou: string;
  sequence: number;
}

class ValidationService {
  /**
   * Get available validations from the validation registry (local)
   * These are the validations actually implemented in the app
   * @param ou The organizational unit (optional filter)
   * @returns Promise with validation processors metadata
   */
  async getAvailableValidations(ou?: string): Promise<any[]> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('validation:get-all', { ou });
        return result?.data || [];
      } catch (error) {
        console.error('Failed to get available validations:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Fetch validations metadata from API (if you want API-configured validations)
   * This returns the list of validations configured in the backend
   * @param ou The organizational unit (hotel) identifier
   * @returns Promise<Validation[]> Array of validations from API
   */
  async getValidations(ou: string): Promise<Validation[]> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/validations/ou/${ou}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 422) {
        const error = await response.json();
        throw new Error(error.detail?.[0]?.msg || 'Validation error');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to fetch validations');
    }

    return await response.json();
  }

  /**
   * Cache validations locally for offline access
   * @param ou The organizational unit
   * @param validations The validations to cache
   */
  async cacheValidations(ou: string, validations: Validation[]): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:store-validations', {
          ou,
          validations
        });
        console.log('Validations cached successfully');
      } catch (cacheError) {
        console.warn('Failed to cache validations:', cacheError);
      }
    }
  }

  /**
   * Get cached validations for offline access
   * @param ou The organizational unit
   * @returns Cached validations if available
   */
  async getCachedValidations(ou: string): Promise<Validation[] | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const cached = await window.ipcApi.sendIpcRequest('db:get-validations', { ou });
        return cached?.data || null;
      } catch (error) {
        console.warn('Failed to get cached validations:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Fetch validations and sync
   * @param ou The organizational unit
   * @param silent If true, don't throw errors (for background sync)
   * @returns Promise<Validation[]> Array of validations
   */
  async fetchAndSyncValidations(ou: string, silent: boolean = false): Promise<Validation[]> {
    try {
      // Update cache metadata to "fetching"
      if (typeof window !== 'undefined' && window.ipcApi) {
        await window.ipcApi.sendIpcRequest('db:update-cache-metadata', {
          key: `validations_${ou}`,
          status: 'fetching'
        }).catch(() => {});
      }

      // Fetch validations from API
      const validations = await this.getValidations(ou);

      // Cache the validations
      await this.cacheValidations(ou, validations);

      // Update cache metadata to "success"
      if (typeof window !== 'undefined' && window.ipcApi) {
        await window.ipcApi.sendIpcRequest('db:update-cache-metadata', {
          key: `validations_${ou}`,
          status: 'success'
        }).catch(() => {});
      }

      return validations;
    } catch (error) {
      console.error('Error fetching and syncing validations:', error);

      // Update cache metadata to "failed"
      if (typeof window !== 'undefined' && window.ipcApi) {
        await window.ipcApi.sendIpcRequest('db:update-cache-metadata', {
          key: `validations_${ou}`,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }).catch(() => {});
      }

      // Try to return cached data if available
      const cached = await this.getCachedValidations(ou);
      if (cached) {
        console.log('Returning cached validations due to error');
        return cached;
      }

      if (silent) {
        return [];
      }

      throw error;
    }
  }

  /**
   * Get validations with cache-first strategy
   * Returns cached validations immediately, then fetches fresh data in background
   * @param ou The organizational unit
   * @param onUpdate Callback when fresh data arrives
   */
  async getValidationsCacheFirst(
    ou: string,
    onUpdate?: (validations: Validation[]) => void
  ): Promise<Validation[]> {
    // Get cached validations first
    const cached = await this.getCachedValidations(ou);

    // Fetch fresh data in background and call onUpdate when it arrives
    this.fetchAndSyncValidations(ou, true)
      .then(freshData => {
        if (onUpdate && JSON.stringify(cached) !== JSON.stringify(freshData)) {
          onUpdate(freshData);
        }
      })
      .catch(error => {
        console.error('Background fetch failed:', error);
      });

    return cached || [];
  }

  /**
   * Run a validation check via IPC (using the validation registry)
   * @param validationName The name of the validation to run
   * @param ou The organizational unit
   * @param period Optional period for validation
   * @returns Validation result
   */
  async runValidation(
    validationName: string,
    ou: string,
    period?: { year?: number; month?: number }
  ): Promise<{
    success: boolean;
    errors?: string[];
    warnings?: string[];
    recordCount?: number;
  }> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('validation:run', {
          validationName,
          ou,
          period
        });
        return result?.data || { success: false };
      } catch (error) {
        console.error('Failed to run validation:', error);
        throw error;
      }
    }
    throw new Error('IPC API not available');
  }

  /**
   * Run all validations for an OU via IPC
   * @param ou The organizational unit
   * @param period Optional period for validation
   * @returns Array of validation results
   */
  async runAllValidations(
    ou: string,
    period?: { year?: number; month?: number }
  ): Promise<any[]> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('validation:run-all', {
          ou,
          period
        });
        return result?.data || [];
      } catch (error) {
        console.error('Failed to run all validations:', error);
        throw error;
      }
    }
    throw new Error('IPC API not available');
  }
}

export default new ValidationService();
