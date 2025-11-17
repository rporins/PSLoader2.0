import { create } from "zustand";
import { ThemeMode } from "../theme/settings";
import { settingsService, SETTINGS_KEYS, AppSettings } from "../services/settingsService";

type SettingsState = {
  // Settings values
  themeMode: ThemeMode;
  selectedHotelOu: string | null;
  selectedDepartment: string | null;
  selectedAccount: string | null;
  selectedPeriod: string | null;
  selectedScenario: string | null;
  autoSave: boolean;
  notificationEnabled: boolean;
  language: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;

  // Loading state
  loading: boolean;
  initialized: boolean;

  // Actions
  toggleTheme: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setSelectedHotelOu: (ou: string | null) => Promise<void>;
  setSelectedDepartment: (dept: string | null) => Promise<void>;
  setSelectedAccount: (account: string | null) => Promise<void>;
  setSelectedPeriod: (period: string | null) => Promise<void>;
  setSelectedScenario: (scenario: string | null) => Promise<void>;
  setAutoSave: (enabled: boolean) => Promise<void>;
  setNotificationEnabled: (enabled: boolean) => Promise<void>;
  setLanguage: (language: string) => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setDateFormat: (format: string) => Promise<void>;
  setNumberFormat: (format: string) => Promise<void>;
  updateMultipleSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Load and save
  loadSettingsFromDb: () => Promise<void>;
  saveSettingsToDb: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  // Initial state - will be overwritten when settings are loaded
  themeMode: "light",
  selectedHotelOu: null,
  selectedDepartment: null,
  selectedAccount: null,
  selectedPeriod: null,
  selectedScenario: "ACT",
  autoSave: true,
  notificationEnabled: true,
  language: "en",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  numberFormat: "1,234.56",
  loading: false,
  initialized: false,

  // Theme actions
  toggleTheme: async () => {
    const current = get().themeMode;
    const next = current === "light" ? "dark" : "light";
    set({ themeMode: next });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.THEME_MODE, next);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
      // Revert on error
      set({ themeMode: current });
    }
  },

  setThemeMode: async (mode) => {
    const previous = get().themeMode;
    set({ themeMode: mode });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error("Failed to save theme mode:", error);
      // Revert on error
      set({ themeMode: previous });
    }
  },

  // Hotel selection
  setSelectedHotelOu: async (ou) => {
    const previous = get().selectedHotelOu;
    set({ selectedHotelOu: ou });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.SELECTED_HOTEL_OU, ou);
    } catch (error) {
      console.error("Failed to save selected hotel:", error);
      // Revert on error
      set({ selectedHotelOu: previous });
    }
  },

  // Department selection
  setSelectedDepartment: async (dept) => {
    const previous = get().selectedDepartment;
    set({ selectedDepartment: dept });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.SELECTED_DEPARTMENT, dept);
    } catch (error) {
      console.error("Failed to save selected department:", error);
      set({ selectedDepartment: previous });
    }
  },

  // Account selection
  setSelectedAccount: async (account) => {
    const previous = get().selectedAccount;
    set({ selectedAccount: account });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.SELECTED_ACCOUNT, account);
    } catch (error) {
      console.error("Failed to save selected account:", error);
      set({ selectedAccount: previous });
    }
  },

  // Period selection
  setSelectedPeriod: async (period) => {
    const previous = get().selectedPeriod;
    set({ selectedPeriod: period });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.SELECTED_PERIOD, period);
    } catch (error) {
      console.error("Failed to save selected period:", error);
      set({ selectedPeriod: previous });
    }
  },

  // Scenario selection
  setSelectedScenario: async (scenario) => {
    const previous = get().selectedScenario;
    set({ selectedScenario: scenario });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.SELECTED_SCENARIO, scenario);
    } catch (error) {
      console.error("Failed to save selected scenario:", error);
      set({ selectedScenario: previous });
    }
  },

  // Auto-save setting
  setAutoSave: async (enabled) => {
    const previous = get().autoSave;
    set({ autoSave: enabled });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.AUTO_SAVE, enabled);
    } catch (error) {
      console.error("Failed to save auto-save setting:", error);
      set({ autoSave: previous });
    }
  },

  // Notification setting
  setNotificationEnabled: async (enabled) => {
    const previous = get().notificationEnabled;
    set({ notificationEnabled: enabled });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.NOTIFICATION_ENABLED, enabled);
    } catch (error) {
      console.error("Failed to save notification setting:", error);
      set({ notificationEnabled: previous });
    }
  },

  // Language setting
  setLanguage: async (language) => {
    const previous = get().language;
    set({ language });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error("Failed to save language:", error);
      set({ language: previous });
    }
  },

  // Currency setting
  setCurrency: async (currency) => {
    const previous = get().currency;
    set({ currency });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.CURRENCY, currency);
    } catch (error) {
      console.error("Failed to save currency:", error);
      set({ currency: previous });
    }
  },

  // Date format setting
  setDateFormat: async (format) => {
    const previous = get().dateFormat;
    set({ dateFormat: format });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.DATE_FORMAT, format);
    } catch (error) {
      console.error("Failed to save date format:", error);
      set({ dateFormat: previous });
    }
  },

  // Number format setting
  setNumberFormat: async (format) => {
    const previous = get().numberFormat;
    set({ numberFormat: format });

    try {
      await settingsService.setSetting(SETTINGS_KEYS.NUMBER_FORMAT, format);
    } catch (error) {
      console.error("Failed to save number format:", error);
      set({ numberFormat: previous });
    }
  },

  // Update multiple settings at once
  updateMultipleSettings: async (settings) => {
    // Store previous state for rollback
    const previousState = {
      themeMode: get().themeMode,
      selectedHotelOu: get().selectedHotelOu,
      selectedDepartment: get().selectedDepartment,
      selectedAccount: get().selectedAccount,
      selectedPeriod: get().selectedPeriod,
      selectedScenario: get().selectedScenario,
      autoSave: get().autoSave,
      notificationEnabled: get().notificationEnabled,
      language: get().language,
      currency: get().currency,
      dateFormat: get().dateFormat,
      numberFormat: get().numberFormat,
    };

    // Update local state immediately
    const updates: Partial<SettingsState> = {};
    if (SETTINGS_KEYS.THEME_MODE in settings) updates.themeMode = settings[SETTINGS_KEYS.THEME_MODE]!;
    if (SETTINGS_KEYS.SELECTED_HOTEL_OU in settings) updates.selectedHotelOu = settings[SETTINGS_KEYS.SELECTED_HOTEL_OU]!;
    if (SETTINGS_KEYS.SELECTED_DEPARTMENT in settings) updates.selectedDepartment = settings[SETTINGS_KEYS.SELECTED_DEPARTMENT]!;
    if (SETTINGS_KEYS.SELECTED_ACCOUNT in settings) updates.selectedAccount = settings[SETTINGS_KEYS.SELECTED_ACCOUNT]!;
    if (SETTINGS_KEYS.SELECTED_PERIOD in settings) updates.selectedPeriod = settings[SETTINGS_KEYS.SELECTED_PERIOD]!;
    if (SETTINGS_KEYS.SELECTED_SCENARIO in settings) updates.selectedScenario = settings[SETTINGS_KEYS.SELECTED_SCENARIO]!;
    if (SETTINGS_KEYS.AUTO_SAVE in settings) updates.autoSave = settings[SETTINGS_KEYS.AUTO_SAVE]!;
    if (SETTINGS_KEYS.NOTIFICATION_ENABLED in settings) updates.notificationEnabled = settings[SETTINGS_KEYS.NOTIFICATION_ENABLED]!;
    if (SETTINGS_KEYS.LANGUAGE in settings) updates.language = settings[SETTINGS_KEYS.LANGUAGE]!;
    if (SETTINGS_KEYS.CURRENCY in settings) updates.currency = settings[SETTINGS_KEYS.CURRENCY]!;
    if (SETTINGS_KEYS.DATE_FORMAT in settings) updates.dateFormat = settings[SETTINGS_KEYS.DATE_FORMAT]!;
    if (SETTINGS_KEYS.NUMBER_FORMAT in settings) updates.numberFormat = settings[SETTINGS_KEYS.NUMBER_FORMAT]!;

    set(updates);

    try {
      await settingsService.setSettings(settings);
    } catch (error) {
      console.error("Failed to save multiple settings:", error);
      // Revert all changes on error
      set(previousState);
    }
  },

  // Load all settings from database
  loadSettingsFromDb: async () => {
    if (get().initialized) {
      console.log("Settings already initialized, skipping load");
      return;
    }

    try {
      set({ loading: true });

      // Initialize the settings service
      await settingsService.initialize();

      // Get all settings
      const settings = await settingsService.getAllSettings();

      // Update store with loaded settings
      set({
        themeMode: settings[SETTINGS_KEYS.THEME_MODE],
        selectedHotelOu: settings[SETTINGS_KEYS.SELECTED_HOTEL_OU],
        selectedDepartment: settings[SETTINGS_KEYS.SELECTED_DEPARTMENT],
        selectedAccount: settings[SETTINGS_KEYS.SELECTED_ACCOUNT],
        selectedPeriod: settings[SETTINGS_KEYS.SELECTED_PERIOD],
        selectedScenario: settings[SETTINGS_KEYS.SELECTED_SCENARIO],
        autoSave: settings[SETTINGS_KEYS.AUTO_SAVE],
        notificationEnabled: settings[SETTINGS_KEYS.NOTIFICATION_ENABLED],
        language: settings[SETTINGS_KEYS.LANGUAGE],
        currency: settings[SETTINGS_KEYS.CURRENCY],
        dateFormat: settings[SETTINGS_KEYS.DATE_FORMAT],
        numberFormat: settings[SETTINGS_KEYS.NUMBER_FORMAT],
        initialized: true,
      });

      console.log("Settings loaded from database:", settings);
    } catch (error) {
      console.error("Failed to load settings from database:", error);
      // Mark as initialized even on error to prevent infinite retries
      set({ initialized: true });
    } finally {
      set({ loading: false });
    }
  },

  // Save all current settings to database
  saveSettingsToDb: async () => {
    try {
      const state = get();
      const settings: AppSettings = {
        [SETTINGS_KEYS.THEME_MODE]: state.themeMode,
        [SETTINGS_KEYS.SELECTED_HOTEL_OU]: state.selectedHotelOu,
        [SETTINGS_KEYS.SELECTED_DEPARTMENT]: state.selectedDepartment,
        [SETTINGS_KEYS.SELECTED_ACCOUNT]: state.selectedAccount,
        [SETTINGS_KEYS.SELECTED_PERIOD]: state.selectedPeriod,
        [SETTINGS_KEYS.SELECTED_SCENARIO]: state.selectedScenario,
        [SETTINGS_KEYS.AUTO_SAVE]: state.autoSave,
        [SETTINGS_KEYS.NOTIFICATION_ENABLED]: state.notificationEnabled,
        [SETTINGS_KEYS.LANGUAGE]: state.language,
        [SETTINGS_KEYS.CURRENCY]: state.currency,
        [SETTINGS_KEYS.DATE_FORMAT]: state.dateFormat,
        [SETTINGS_KEYS.NUMBER_FORMAT]: state.numberFormat,
      };

      await settingsService.setSettings(settings);
      console.log("All settings saved to database");
    } catch (error) {
      console.error("Failed to save settings to database:", error);
      throw error;
    }
  },

  // Reset all settings to defaults
  resetAllSettings: async () => {
    try {
      set({ loading: true });

      // Reset in service
      await settingsService.resetAllSettings();

      // Get the default values
      const settings = await settingsService.getAllSettings();

      // Update store with defaults
      set({
        themeMode: settings[SETTINGS_KEYS.THEME_MODE],
        selectedHotelOu: settings[SETTINGS_KEYS.SELECTED_HOTEL_OU],
        selectedDepartment: settings[SETTINGS_KEYS.SELECTED_DEPARTMENT],
        selectedAccount: settings[SETTINGS_KEYS.SELECTED_ACCOUNT],
        selectedPeriod: settings[SETTINGS_KEYS.SELECTED_PERIOD],
        selectedScenario: settings[SETTINGS_KEYS.SELECTED_SCENARIO],
        autoSave: settings[SETTINGS_KEYS.AUTO_SAVE],
        notificationEnabled: settings[SETTINGS_KEYS.NOTIFICATION_ENABLED],
        language: settings[SETTINGS_KEYS.LANGUAGE],
        currency: settings[SETTINGS_KEYS.CURRENCY],
        dateFormat: settings[SETTINGS_KEYS.DATE_FORMAT],
        numberFormat: settings[SETTINGS_KEYS.NUMBER_FORMAT],
      });

      console.log("All settings reset to defaults");
    } catch (error) {
      console.error("Failed to reset settings:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

// Export convenience hooks for specific settings
export const useThemeMode = () => useSettingsStore((s) => s.themeMode);
export const useSelectedHotel = () => useSettingsStore((s) => s.selectedHotelOu);
export const useSelectedDepartment = () => useSettingsStore((s) => s.selectedDepartment);
export const useSelectedAccount = () => useSettingsStore((s) => s.selectedAccount);
export const useSelectedPeriod = () => useSettingsStore((s) => s.selectedPeriod);
export const useSelectedScenario = () => useSettingsStore((s) => s.selectedScenario);
export const useAutoSave = () => useSettingsStore((s) => s.autoSave);
export const useNotificationEnabled = () => useSettingsStore((s) => s.notificationEnabled);
export const useLanguage = () => useSettingsStore((s) => s.language);
export const useCurrency = () => useSettingsStore((s) => s.currency);
export const useDateFormat = () => useSettingsStore((s) => s.dateFormat);
export const useNumberFormat = () => useSettingsStore((s) => s.numberFormat);