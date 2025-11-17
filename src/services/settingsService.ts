/**
 * Centralized Settings Service
 * Handles all app settings persistence with SQLite database
 * Provides a modular and scalable approach for settings management
 */

import { ThemeMode } from "../theme/settings";

// Define all possible settings keys as a const enum for type safety
export const SETTINGS_KEYS = {
  THEME_MODE: 'themeMode',
  SELECTED_HOTEL_OU: 'selectedHotelOu',
  SELECTED_DEPARTMENT: 'selectedDepartment',
  SELECTED_ACCOUNT: 'selectedAccount',
  SELECTED_PERIOD: 'selectedPeriod',
  SELECTED_SCENARIO: 'selectedScenario',
  AUTO_SAVE: 'autoSave',
  NOTIFICATION_ENABLED: 'notificationEnabled',
  LANGUAGE: 'language',
  CURRENCY: 'currency',
  DATE_FORMAT: 'dateFormat',
  NUMBER_FORMAT: 'numberFormat',
  // Add more settings keys as needed
} as const;

export type SettingsKey = typeof SETTINGS_KEYS[keyof typeof SETTINGS_KEYS];

// Define the shape of all settings with their types
export interface AppSettings {
  [SETTINGS_KEYS.THEME_MODE]: ThemeMode;
  [SETTINGS_KEYS.SELECTED_HOTEL_OU]: string | null;
  [SETTINGS_KEYS.SELECTED_DEPARTMENT]: string | null;
  [SETTINGS_KEYS.SELECTED_ACCOUNT]: string | null;
  [SETTINGS_KEYS.SELECTED_PERIOD]: string | null;
  [SETTINGS_KEYS.SELECTED_SCENARIO]: string | null;
  [SETTINGS_KEYS.AUTO_SAVE]: boolean;
  [SETTINGS_KEYS.NOTIFICATION_ENABLED]: boolean;
  [SETTINGS_KEYS.LANGUAGE]: string;
  [SETTINGS_KEYS.CURRENCY]: string;
  [SETTINGS_KEYS.DATE_FORMAT]: string;
  [SETTINGS_KEYS.NUMBER_FORMAT]: string;
  // Add more settings types as needed
}

// Default values for all settings
export const DEFAULT_SETTINGS: AppSettings = {
  [SETTINGS_KEYS.THEME_MODE]: "light",
  [SETTINGS_KEYS.SELECTED_HOTEL_OU]: null,
  [SETTINGS_KEYS.SELECTED_DEPARTMENT]: null,
  [SETTINGS_KEYS.SELECTED_ACCOUNT]: null,
  [SETTINGS_KEYS.SELECTED_PERIOD]: null,
  [SETTINGS_KEYS.SELECTED_SCENARIO]: "ACT",
  [SETTINGS_KEYS.AUTO_SAVE]: true,
  [SETTINGS_KEYS.NOTIFICATION_ENABLED]: true,
  [SETTINGS_KEYS.LANGUAGE]: "en",
  [SETTINGS_KEYS.CURRENCY]: "USD",
  [SETTINGS_KEYS.DATE_FORMAT]: "MM/DD/YYYY",
  [SETTINGS_KEYS.NUMBER_FORMAT]: "1,234.56",
};

// Type-safe partial settings for updates
export type PartialSettings = Partial<AppSettings>;

class SettingsService {
  private cache: Map<SettingsKey, any> = new Map();
  private initialized = false;
  private syncQueue: Set<SettingsKey> = new Set();
  private ipcApi: any = null;

  constructor() {
    // Initialize IPC API reference
    if (typeof window !== 'undefined') {
      this.ipcApi = (window as any)?.ipcApi;
    }
  }

  /**
   * Initialize the settings service by loading all settings from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const allSettings = await this.loadAllSettings();
      // Populate cache with loaded settings or defaults
      Object.entries(DEFAULT_SETTINGS).forEach(([key, defaultValue]) => {
        const loadedValue = allSettings[key];
        this.cache.set(key as SettingsKey, loadedValue !== undefined ? loadedValue : defaultValue);
      });
      this.initialized = true;
      console.log('Settings service initialized with:', this.cache);
    } catch (error) {
      console.error('Failed to initialize settings service:', error);
      // Use defaults on error
      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        this.cache.set(key as SettingsKey, value);
      });
      this.initialized = true;
    }
  }

  /**
   * Get a single setting value
   */
  async getSetting<K extends SettingsKey>(key: K): Promise<AppSettings[K]> {
    // Ensure service is initialized
    if (!this.initialized) {
      await this.initialize();
    }

    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) as AppSettings[K];
    }

    // If not in cache, load from database
    try {
      const value = await this.loadSetting(key);
      if (value !== undefined) {
        this.cache.set(key, value);
        return value as AppSettings[K];
      }
    } catch (error) {
      console.error(`Failed to load setting ${key}:`, error);
    }

    // Return default if all else fails
    return DEFAULT_SETTINGS[key] as AppSettings[K];
  }

  /**
   * Get multiple settings at once
   */
  async getSettings<K extends SettingsKey>(...keys: K[]): Promise<Pick<AppSettings, K>> {
    const result = {} as Pick<AppSettings, K>;

    for (const key of keys) {
      result[key] = await this.getSetting(key);
    }

    return result;
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<AppSettings> {
    if (!this.initialized) {
      await this.initialize();
    }

    const settings = {} as AppSettings;
    for (const key of Object.values(SETTINGS_KEYS)) {
      settings[key] = await this.getSetting(key as SettingsKey);
    }
    return settings;
  }

  /**
   * Set a single setting value
   */
  async setSetting<K extends SettingsKey>(key: K, value: AppSettings[K]): Promise<void> {
    // Update cache immediately for responsive UI
    this.cache.set(key, value);

    // Save to database
    try {
      await this.saveSetting(key, value);
      console.log(`Setting ${key} saved:`, value);
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      // Add to sync queue for retry
      this.syncQueue.add(key);
      throw error;
    }
  }

  /**
   * Set multiple settings at once
   */
  async setSettings(settings: PartialSettings): Promise<void> {
    // Update cache immediately
    Object.entries(settings).forEach(([key, value]) => {
      if (value !== undefined) {
        this.cache.set(key as SettingsKey, value);
      }
    });

    // Save to database
    try {
      await this.saveSettings(settings);
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Add to sync queue for retry
      Object.keys(settings).forEach(key => this.syncQueue.add(key as SettingsKey));
      throw error;
    }
  }

  /**
   * Reset a setting to its default value
   */
  async resetSetting<K extends SettingsKey>(key: K): Promise<void> {
    const defaultValue = DEFAULT_SETTINGS[key];
    await this.setSetting(key, defaultValue);
  }

  /**
   * Reset all settings to defaults
   */
  async resetAllSettings(): Promise<void> {
    await this.setSettings(DEFAULT_SETTINGS);
  }

  /**
   * Load a single setting from database
   */
  private async loadSetting(key: string): Promise<any> {
    if (!this.ipcApi?.sendIpcRequest) {
      throw new Error('IPC API not available');
    }

    const response = await this.ipcApi.sendIpcRequest('settings-get-single', { key });
    if (response?.success && response.data !== undefined) {
      return response.data;
    }
    return undefined;
  }

  /**
   * Load all settings from database
   */
  private async loadAllSettings(): Promise<Record<string, any>> {
    if (!this.ipcApi?.sendIpcRequest) {
      console.warn('IPC API not available, using defaults');
      return {};
    }

    try {
      const response = await this.ipcApi.sendIpcRequest('settings-get-all');
      if (response?.success && response.data) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to load settings from database:', error);
    }
    return {};
  }

  /**
   * Save a single setting to database
   */
  private async saveSetting(key: string, value: any): Promise<void> {
    if (!this.ipcApi?.sendIpcRequest) {
      throw new Error('IPC API not available');
    }

    const response = await this.ipcApi.sendIpcRequest('settings-set-single', { key, value });
    if (!response?.success) {
      throw new Error(`Failed to save setting ${key}`);
    }
  }

  /**
   * Save multiple settings to database
   */
  private async saveSettings(settings: Record<string, any>): Promise<void> {
    if (!this.ipcApi?.sendIpcRequest) {
      throw new Error('IPC API not available');
    }

    const response = await this.ipcApi.sendIpcRequest('settings-set-bulk', settings);
    if (!response?.success) {
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Sync any queued settings to database (for retry logic)
   */
  async syncPendingSettings(): Promise<void> {
    if (this.syncQueue.size === 0) {
      return;
    }

    const pending = Array.from(this.syncQueue);
    const settings: PartialSettings = {};

    for (const key of pending) {
      if (this.cache.has(key)) {
        settings[key] = this.cache.get(key);
      }
    }

    try {
      await this.saveSettings(settings);
      this.syncQueue.clear();
      console.log('Synced pending settings:', settings);
    } catch (error) {
      console.error('Failed to sync pending settings:', error);
    }
  }

  /**
   * Subscribe to setting changes (for future implementation)
   */
  subscribe(key: SettingsKey, callback: (value: any) => void): () => void {
    // TODO: Implement subscription mechanism for real-time updates
    return () => {};
  }

  /**
   * Prepare settings for cloud sync (for future implementation)
   */
  async prepareForCloudSync(): Promise<Record<string, any>> {
    const allSettings = await this.getAllSettings();
    return {
      ...allSettings,
      lastModified: new Date().toISOString(),
      deviceId: await this.getDeviceId(),
    };
  }

  /**
   * Get or generate a unique device ID for cloud sync
   */
  private async getDeviceId(): Promise<string> {
    // TODO: Implement proper device ID generation and storage
    return 'local-device-' + Date.now();
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

// Export convenience functions for common operations
export const getSetting = settingsService.getSetting.bind(settingsService);
export const setSetting = settingsService.setSetting.bind(settingsService);
export const getSettings = settingsService.getSettings.bind(settingsService);
export const setSettings = settingsService.setSettings.bind(settingsService);
export const getAllSettings = settingsService.getAllSettings.bind(settingsService);
export const resetSetting = settingsService.resetSetting.bind(settingsService);
export const resetAllSettings = settingsService.resetAllSettings.bind(settingsService);
export const initializeSettings = settingsService.initialize.bind(settingsService);