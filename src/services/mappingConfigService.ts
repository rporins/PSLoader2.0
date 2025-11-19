import { API_BASE_URL } from '../config';
import authService from './auth';

// Interface for the Mapping Config from API
export interface MappingConfigResponse {
  version: string;
  is_locked: boolean;
  description: string;
  id?: number; // From API responses
  config_id?: number; // From local database
  created_at: string;
  updated_at: string;
  last_synced?: string; // From local database
  mappings?: any[]; // For GET response
}

// Interface for PATCH request
export interface MappingConfigUpdateRequest {
  version: string;
  is_locked: boolean;
  description: string;
  id?: number;
  config_id?: number;
  created_at: string;
  updated_at: string;
}

// Interface for Mapping entry
export interface MappingEntry {
  source_account: string | null;
  source_department: string | null;
  source_account_department: string | null;
  target_account: string | null;
  target_department: string | null;
  target_account_department: string | null;
  priority: number;
  is_active: boolean;
  id: number;
  mapping_config_id: number;
}

class MappingConfigService {
  /**
   * Fetch mapping configuration from API
   * @param configId The configuration ID
   * @returns Promise<MappingConfigResponse> The mapping configuration
   */
  async getMappingConfig(configId: number): Promise<MappingConfigResponse> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mappings/configs/${configId}`, {
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
        throw new Error(error.detail || `Failed to fetch mapping config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mapping config:', error);
      throw error;
    }
  }

  /**
   * Update mapping configuration via API
   * @param configId The configuration ID
   * @param updateData The data to update
   * @returns Promise<MappingConfigResponse> The updated mapping configuration
   */
  async patchMappingConfig(
    configId: number,
    updateData: MappingConfigUpdateRequest
  ): Promise<MappingConfigResponse> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mappings/configs/${configId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        if (response.status === 422) {
          const error = await response.json();
          throw new Error(error.detail?.[0]?.msg || 'Validation error');
        }
        const error = await response.json();
        throw new Error(error.detail || `Failed to update mapping config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating mapping config:', error);
      throw error;
    }
  }

  /**
   * Store mapping config in local database
   * @param config The mapping configuration to store
   */
  async storeMappingConfig(config: MappingConfigResponse): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:store-mapping-config', {
          config_id: config.id,
          version: config.version,
          is_locked: config.is_locked,
          description: config.description,
          created_at: config.created_at,
          updated_at: config.updated_at
        });
        console.log('Mapping config stored successfully');
      } catch (error) {
        console.error('Failed to store mapping config:', error);
        throw error;
      }
    }
  }

  /**
   * Get stored mapping config from local database
   * @param configId The configuration ID
   * @returns The stored mapping configuration if available
   */
  async getStoredMappingConfig(configId: number): Promise<MappingConfigResponse | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const stored = await window.ipcApi.sendIpcRequest('db:get-mapping-config', { config_id: configId });
        // IPC handlers return { success: true, data: ... }
        return stored?.data || null;
      } catch (error) {
        console.warn('Failed to get stored mapping config:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if local mapping config needs update by comparing versions
   * @param configId The configuration ID
   * @returns true if update is needed, false otherwise
   */
  async checkIfUpdateNeeded(configId: number): Promise<boolean> {
    try {
      // Get local stored config
      const localConfig = await this.getStoredMappingConfig(configId);

      if (!localConfig) {
        // No local config, definitely needs update
        return true;
      }

      // Get remote config
      const remoteConfig = await this.getMappingConfig(configId);

      // Compare versions
      if (localConfig.version !== remoteConfig.version) {
        console.log(`Version mismatch for config ${configId}: local=${localConfig.version}, remote=${remoteConfig.version}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking if update needed:', error);
      // On error, assume update is needed
      return true;
    }
  }

  /**
   * Fetch mappings for a specific configuration from API
   * @param configId The configuration ID
   * @returns Promise<MappingEntry[]> Array of mappings
   */
  async getMappingsFromAPI(configId: number): Promise<MappingEntry[]> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mappings/configs/${configId}/mappings`, {
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
        throw new Error(error.detail || `Failed to fetch mappings: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mappings:', error);
      throw error;
    }
  }

  /**
   * Replace all mappings for a config in the database
   * @param configId The configuration ID
   * @param mappings The new mappings to store
   */
  async replaceMappings(configId: number, mappings: MappingEntry[]): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:replace-mappings', {
          config_id: configId,
          mappings: mappings
        });
        console.log(`Replaced ${mappings.length} mappings for config ${configId}`);
      } catch (error) {
        console.error('Failed to replace mappings:', error);
        throw error;
      }
    }
  }

  /**
   * Get stored mappings from local database
   * @param configId The configuration ID
   * @returns The stored mappings if available
   */
  async getStoredMappings(configId: number): Promise<MappingEntry[]> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const stored = await window.ipcApi.sendIpcRequest('db:get-mappings', { config_id: configId });
        // IPC handlers return { success: true, data: ... }
        return stored?.data || [];
      } catch (error) {
        console.warn('Failed to get stored mappings:', error);
        return [];
      }
    }
    return [];
  }

  /**
   * Check if mappings exist for a configuration
   * @param configId The configuration ID
   * @returns true if mappings exist, false otherwise
   */
  async hasMappings(configId: number): Promise<boolean> {
    const mappings = await this.getStoredMappings(configId);
    return mappings.length > 0;
  }

  /**
   * Sync mapping configuration and mappings: fetch from API and store locally if needed
   * @param configId The configuration ID
   * @returns The synced mapping configuration
   */
  async syncMappingConfig(configId: number): Promise<MappingConfigResponse> {
    try {
      // First check if we have the config stored locally
      const localConfig = await this.getStoredMappingConfig(configId);

      // Get remote config to compare versions
      const remoteConfig = await this.getMappingConfig(configId);

      let needsMappingUpdate = false;

      if (!localConfig) {
        // No local config, need to store it and download mappings
        console.log(`No local config for ${configId}, downloading...`);
        await this.storeMappingConfig(remoteConfig);
        needsMappingUpdate = true;
      } else if (localConfig.version !== remoteConfig.version) {
        // Version mismatch, update config and mappings
        console.log(`Version mismatch for config ${configId}: local=${localConfig.version}, remote=${remoteConfig.version}`);
        await this.storeMappingConfig(remoteConfig);
        needsMappingUpdate = true;
      } else {
        // Config versions match, check if we have mappings
        const hasMappingsStored = await this.hasMappings(configId);
        if (!hasMappingsStored) {
          console.log(`No mappings found for config ${configId}, downloading...`);
          needsMappingUpdate = true;
        }
      }

      // Download and replace mappings if needed
      if (needsMappingUpdate) {
        console.log(`Downloading mappings for config ${configId}...`);
        const mappings = await this.getMappingsFromAPI(configId);
        console.log(`Downloaded ${mappings.length} mappings, replacing in database...`);
        await this.replaceMappings(configId, mappings);
        console.log(`Successfully synced mappings for config ${configId}`);
      } else {
        console.log(`Mappings for config ${configId} are up to date`);
      }

      return remoteConfig;
    } catch (error) {
      console.error('Error syncing mapping config:', error);
      throw error;
    }
  }

  /**
   * Get mapping count for a configuration
   * @param configId The configuration ID
   * @returns The number of mappings stored
   */
  async getMappingCount(configId: number): Promise<number> {
    const mappings = await this.getStoredMappings(configId);
    return mappings.length;
  }

  /**
   * Get all stored mapping configs from local database
   * @returns Array of stored mapping configurations
   */
  async getAllStoredMappingConfigs(): Promise<MappingConfigResponse[]> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const response = await window.ipcApi.sendIpcRequest('db:get-all-mapping-configs');
        console.log('getAllStoredMappingConfigs response:', response);

        // IPC handlers return { success: true, data: ... }
        const configs = response?.data || [];
        console.log('Extracted configs:', configs);

        return configs;
      } catch (error) {
        console.warn('Failed to get all stored mapping configs:', error);
        return [];
      }
    }
    return [];
  }
}

export default new MappingConfigService();