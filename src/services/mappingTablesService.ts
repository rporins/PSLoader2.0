import { API_BASE_URL } from '../config';
import authService from './auth';

// Interface for version response from API
export interface MappingTablesVersionResponse {
  version: string;
  combo_version?: string;
}

// Interface for mapping tables data response from API
export interface MappingTablesDataResponse {
  account_maps: AccountMapAPI[];
  department_maps: DepartmentMapAPI[];
  version: string;
  combo_version?: string;
}

// Account Map structure from API (matches API response)
export interface AccountMapAPI {
  base_account: string;
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

// Department Map structure from API (matches API response)
export interface DepartmentMapAPI {
  base_department: string;
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

// Account-Department Combo from API
export interface AccountDepartmentComboAPI {
  id?: number;
  account: string;
  department: string;
  description: string;
}

// Combos response from API
export interface CombosDataResponse {
  combos: AccountDepartmentComboAPI[];
  combo_version: string;
}

class MappingTablesService {
  /**
   * Get the current version of mapping tables from API
   * @returns Promise<MappingTablesVersionResponse> The version info
   */
  async getVersion(): Promise<MappingTablesVersionResponse> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mapping-tables/version`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to fetch mapping tables version: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mapping tables version:', error);
      throw error;
    }
  }

  /**
   * Get all mapping tables data (account_maps and department_maps) from API
   * WARNING: This can return 5000+ rows, use sparingly
   * @returns Promise<MappingTablesDataResponse> All mapping tables data
   */
  async getData(): Promise<MappingTablesDataResponse> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mapping-tables/data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to fetch mapping tables data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching mapping tables data:', error);
      throw error;
    }
  }

  /**
   * Get combos data from API (separate endpoint, tracked by combo_version)
   * @returns Promise<CombosDataResponse> All combo data
   */
  async getCombos(): Promise<CombosDataResponse> {
    const accessToken = authService.getAccessToken();

    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      // Assuming the API endpoint for combos - adjust based on actual API
      const response = await fetch(`${API_BASE_URL}/mapping-tables/combos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `Failed to fetch combos data: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching combos data:', error);
      throw error;
    }
  }

  /**
   * Store mapping tables data in local database via IPC
   */
  async storeMappingTablesData(data: MappingTablesDataResponse): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        // Store account maps
        await window.ipcApi.sendIpcRequest('db:store-account-maps', {
          accountMaps: data.account_maps
        });
        console.log(`Stored ${data.account_maps.length} account maps`);

        // Store department maps
        await window.ipcApi.sendIpcRequest('db:store-department-maps', {
          departmentMaps: data.department_maps
        });
        console.log(`Stored ${data.department_maps.length} department maps`);

        // Update version (will update when combos are also synced)
        console.log('Mapping tables data stored successfully');
      } catch (error) {
        console.error('Failed to store mapping tables data:', error);
        throw error;
      }
    }
  }

  /**
   * Store combos data in local database via IPC
   */
  async storeCombosData(data: CombosDataResponse): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:store-combos', {
          combos: data.combos
        });
        console.log(`Stored ${data.combos.length} combos`);
      } catch (error) {
        console.error('Failed to store combos data:', error);
        throw error;
      }
    }
  }

  /**
   * Update the mapping tables version in local database
   */
  async updateVersion(version: string, comboVersion: string): Promise<void> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:set-mapping-tables-version', {
          version,
          comboVersion
        });
        console.log(`Updated mapping tables version to ${version}, combo version to ${comboVersion}`);
      } catch (error) {
        console.error('Failed to update mapping tables version:', error);
        throw error;
      }
    }
  }

  /**
   * Get stored mapping tables version from local database
   */
  async getStoredVersion(): Promise<{ version: string; combo_version: string } | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('db:get-mapping-tables-version');
        return result?.data || null;
      } catch (error) {
        console.warn('Failed to get stored mapping tables version:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if mapping tables need to be synced by comparing versions
   * @returns { needsSync: boolean, needsComboSync: boolean } indicating if sync is needed
   */
  async checkIfSyncNeeded(): Promise<{ needsSync: boolean; needsComboSync: boolean }> {
    try {
      // Get local version
      const localVersion = await this.getStoredVersion();

      // Get remote version
      const remoteVersion = await this.getVersion();

      if (!localVersion) {
        // No local data, needs full sync
        console.log('No local mapping tables version found, sync needed');
        return { needsSync: true, needsComboSync: true };
      }

      // Compare versions
      const needsSync = localVersion.version !== remoteVersion.version;
      const needsComboSync = localVersion.combo_version !== (remoteVersion.combo_version || remoteVersion.version);

      if (needsSync) {
        console.log(`Mapping tables version mismatch: local=${localVersion.version}, remote=${remoteVersion.version}`);
      }

      if (needsComboSync) {
        console.log(`Combos version mismatch: local=${localVersion.combo_version}, remote=${remoteVersion.combo_version || remoteVersion.version}`);
      }

      return { needsSync, needsComboSync };
    } catch (error) {
      console.error('Error checking if sync needed:', error);
      // On error, assume sync is needed
      return { needsSync: true, needsComboSync: true };
    }
  }

  /**
   * Sync mapping tables from API to local database
   * Downloads data only if version has changed
   * @returns Promise<boolean> true if sync was performed, false if already up-to-date
   */
  async syncMappingTables(): Promise<boolean> {
    try {
      const { needsSync, needsComboSync } = await this.checkIfSyncNeeded();

      if (!needsSync && !needsComboSync) {
        console.log('Mapping tables are already up-to-date');
        return false;
      }

      let remoteVersion: MappingTablesVersionResponse;

      // Sync account and department maps if needed
      if (needsSync) {
        console.log('Syncing mapping tables data...');
        const data = await this.getData();
        await this.storeMappingTablesData(data);
        remoteVersion = { version: data.version, combo_version: data.combo_version };
      } else {
        // Just get version for combo sync
        remoteVersion = await this.getVersion();
      }

      // Sync combos if needed
      if (needsComboSync) {
        console.log('Syncing combos data...');
        const combosData = await this.getCombos();
        await this.storeCombosData(combosData);
        remoteVersion.combo_version = combosData.combo_version;
      }

      // Update version after successful sync
      await this.updateVersion(
        remoteVersion.version,
        remoteVersion.combo_version || remoteVersion.version
      );

      console.log('Mapping tables sync completed successfully');
      return true;
    } catch (error) {
      console.error('Error syncing mapping tables:', error);
      throw error;
    }
  }

  /**
   * Validate if an account-department combination is valid using local data
   */
  async isValidCombo(account: string, department: string): Promise<boolean> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('db:is-valid-combo', {
          account,
          department
        });
        return result?.data || false;
      } catch (error) {
        console.warn('Failed to validate combo:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get account hierarchy for a given account
   */
  async getAccountHierarchy(baseAccount: string): Promise<any | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('db:get-account-map', {
          baseAccount
        });
        return result?.data || null;
      } catch (error) {
        console.warn('Failed to get account hierarchy:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get department hierarchy for a given department
   */
  async getDepartmentHierarchy(baseDepartment: string): Promise<any | null> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        const result = await window.ipcApi.sendIpcRequest('db:get-department-map', {
          baseDepartment
        });
        return result?.data || null;
      } catch (error) {
        console.warn('Failed to get department hierarchy:', error);
        return null;
      }
    }
    return null;
  }
}

export default new MappingTablesService();
