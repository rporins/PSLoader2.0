import { API_BASE_URL } from '../config';
import authService from './auth';

// Types for Import Groups
export interface Import {
  id: number;
  name: string;
  displayName: string;
  description: string;
  order: number;
  mapping_config_id: number;
  required: boolean;
  fileTypes: string[];
  requiredColumns: string[];
  optionalColumns: string[];
  validationRules: string[];
}

export interface ImportGroup {
  group_name: string;
  imports: Import[];
}

class ImportGroupsService {
  /**
   * Fetch import groups for a specific hotel/OU
   * @param ou The organizational unit (hotel) identifier
   * @returns Promise<ImportGroup[]> Array of import groups
   */
  async getImportGroups(ou: string): Promise<ImportGroup[]> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/hotels/${ou}/import_groups`, {
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
      throw new Error(error.detail || 'Failed to fetch import groups');
    }

    return await response.json();
  }

  /**
   * Get unique group names from import groups
   * @param importGroups Array of import groups
   * @returns Array of unique group names
   */
  getUniqueGroupNames(importGroups: ImportGroup[]): string[] {
    return [...new Set(importGroups.map(group => group.group_name))];
  }

  /**
   * Get imports for a specific group
   * @param importGroups Array of import groups
   * @param groupName The group name to filter by
   * @returns Array of imports for the specified group
   */
  getImportsByGroup(importGroups: ImportGroup[], groupName: string): Import[] {
    const group = importGroups.find(g => g.group_name === groupName);
    return group ? group.imports : [];
  }

  /**
   * Cache import groups locally for offline access
   * @param ou The organizational unit
   * @param importGroups The import groups to cache
   */
  async cacheImportGroups(ou: string, importGroups: ImportGroup[]): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:cache-import-groups', {
          ou,
          importGroups,
          timestamp: new Date().toISOString()
        });
        console.log('Import groups cached successfully');
      } catch (cacheError) {
        console.warn('Failed to cache import groups:', cacheError);
      }
    }
  }

  /**
   * Get cached import groups for offline access
   * @param ou The organizational unit
   * @returns Cached import groups if available
   */
  async getCachedImportGroups(ou: string): Promise<ImportGroup[] | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const cached = await window.ipcApi.sendIpcRequest('db:get-cached-import-groups', { ou });
        return cached?.importGroups || null;
      } catch (error) {
        console.warn('Failed to get cached import groups:', error);
        return null;
      }
    }
    return null;
  }
}

export default new ImportGroupsService();