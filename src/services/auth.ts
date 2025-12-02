// Using Web Crypto API instead of Node.js crypto
const crypto = window.crypto;

import { API_BASE_URL } from '../config';

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  settings: {
    theme: string;
    notifications: boolean;
  };
}

export interface DeviceVerifyResponse {
  message: string;
  device_id: string;
  device_info: {
    device_name: string;
    os_version: string;
    hostname: string;
  };
  last_used_at: string;
  security_level: number;
  security_level_expires_at: string;
}

export interface TOTPGenerateResponse {
  message: string;
  expires_in_minutes: number;
}

export interface TOTPVerifyResponse {
  message: string;
  security_level: number;
  security_level_expires_at: string;
}

export interface UserInfo {
  email: string;
  id: number;
}

export interface OUAccess {
  id: number;
  user_id: number;
  ou: string;
  granted_by: number;
  granted_at: string;
  expires_at: string;
  access_level: string;
  is_active: boolean;
}

export interface Hotel {
  ou: string;
  hotel_name: string;
  room_count: number;
  currency?: string;
  country?: string;
  city?: string;
  local_id_1?: string;
  local_id_2?: string;
  local_id_3?: string;
}

export interface DeviceRegisterResponse {
  message: string;
  device_id: string;
  status: 'pending' | 'approved';
}

class AuthService {
  private accessToken: string | null = null;
  private securityLevel: number = 0;
  private deviceId: string | null = null;
  private deviceSecret: string | null = null;

  constructor() {
    this.initializeDevice();
  }

  private async initializeDevice() {
    // Ensure permanent salt exists in database (create if needed)
    // This must happen before any credentials are generated or used
    try {
      await this.getOrCreatePermanentSalt();
    } catch (error) {
      console.error('Failed to initialize permanent salt:', error);
    }

    // Always generate device credentials dynamically from hardware fingerprint
    // Never store them - only the permanent salt is stored in SQLite
    await this.generateDeviceCredentials();
  }

  private async getOrCreatePermanentSalt(): Promise<string> {
    try {
      // Get permanent salt from Electron main process (stored in userData directory)
      const permanentSalt = await window.ipcApi.getPermanentSalt();
      return permanentSalt;
    } catch (error) {
      console.error('Failed to get permanent salt from main process:', error);
      throw new Error('Could not retrieve device permanent salt');
    }
  }

  private async generateDeviceCredentials() {
    // Get permanent salt from database (created once, never changes)
    const permanentSalt = await this.getOrCreatePermanentSalt();

    // Check if device ID already exists in database
    let storedDeviceId: string | null = null;
    try {
      const result = await window.ipcApi.sendIpcRequest('settings-get-single', { key: 'deviceId' });
      if (result.success && result.data) {
        storedDeviceId = result.data;
        console.log('Loaded existing device ID from database');
      }
    } catch (error) {
      console.log('No existing device ID found, generating new one...');
    }

    // If device ID exists, use it; otherwise generate and store it
    if (storedDeviceId) {
      this.deviceId = storedDeviceId;
    } else {
      // Generate a random UUID-style device ID (just an identifier, not a security hash)
      // Use timestamp + random values + username as seed for uniqueness
      const hardwareInfo = await window.ipcApi.getHardwareInfo().catch(() => null);
      const username = hardwareInfo?.username || 'UNKNOWN';
      const timestamp = Date.now();
      const randomInt = Math.floor(Math.random() * 1000000);

      // Create UUID seed from timestamp, random int, and username
      const uuidSeed = `${timestamp}-${randomInt}-${username}`;
      const encoder = new TextEncoder();
      const uuidData = encoder.encode(uuidSeed);
      const uuidHash = await crypto.subtle.digest('SHA-256', uuidData);
      const uuidArray = Array.from(new Uint8Array(uuidHash));

      // Format as UUID-like string (8-4-4-4-12)
      const hexString = uuidArray.map(b => b.toString(16).padStart(2, '0')).join('');
      this.deviceId = `${hexString.substr(0, 8)}-${hexString.substr(8, 4)}-${hexString.substr(12, 4)}-${hexString.substr(16, 4)}-${hexString.substr(20, 12)}`;

      // Store device ID in database - ONLY ONCE
      try {
        await window.ipcApi.sendIpcRequest('settings-set-single', {
          key: 'deviceId',
          value: this.deviceId
        });
        console.log('Stored new device ID in database');
      } catch (error) {
        console.error('Failed to store device ID:', error);
      }
    }

    // Always generate device secret from stable hardware identifiers + permanent salt
    // This is a hash, not stored, regenerated each time from hardware
    // Get fresh hardware info for device secret generation
    const platform = navigator.platform;
    let hardwareInfo = null;
    try {
      hardwareInfo = await window.ipcApi.getHardwareInfo();
    } catch (error) {
      console.warn('Failed to get hardware info for device secret:', error);
    }

    // Device secret uses ONLY stable hardware identifiers
    // Excludes: macAddresses (docking stations), cpuInfo.cores (BIOS settings),
    //           memoryTotal (upgrades), hostname (renames), username (account switching)
    const encoder = new TextEncoder();
    const deviceSecretComponents = [
      platform,
      permanentSalt,
      hardwareInfo?.machineId || 'UNKNOWN',
      hardwareInfo?.biosSerial || 'UNKNOWN',
      hardwareInfo?.motherboardSerial || 'UNKNOWN',
      hardwareInfo?.diskSerial || 'UNKNOWN',
      hardwareInfo?.cpuInfo.model || 'UNKNOWN'  // Model name only, not core count
    ];
    const deviceSecretData = encoder.encode(deviceSecretComponents.join('||'));
    const deviceSecretHash = await crypto.subtle.digest('SHA-256', deviceSecretData);
    const deviceSecretArray = Array.from(new Uint8Array(deviceSecretHash));
    this.deviceSecret = deviceSecretArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Log device secret components for debugging
    try {
      const logData = {
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        components: {
          platform,
          permanentSalt: permanentSalt.substring(0, 16) + '...', // Truncate for security
          machineId: hardwareInfo?.machineId || 'UNKNOWN',
          biosSerial: hardwareInfo?.biosSerial || 'UNKNOWN',
          motherboardSerial: hardwareInfo?.motherboardSerial || 'UNKNOWN',
          diskSerial: hardwareInfo?.diskSerial || 'UNKNOWN',
          cpuModel: hardwareInfo?.cpuInfo.model || 'UNKNOWN'
        },
        deviceSecretHash: this.deviceSecret,
        rawString: deviceSecretComponents.join('||')
      };
      await window.ipcApi.logDeviceSecret(logData);
    } catch (error) {
      console.warn('Failed to log device secret components:', error);
    }
  }

  // Stage 1: User Login
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.securityLevel = 1;

    // Store token securely
    sessionStorage.setItem('authToken', data.access_token);

    return data;
  }

  // Stage 2: Device Verification
  async verifyDevice(): Promise<DeviceVerifyResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/devices/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        device_secret: this.deviceSecret
      })
    });

    if (!response.ok) {
      const error = await response.json();

      // Check if device needs registration (404 = not found)
      if (response.status === 404 || error.detail?.includes('not found')) {
        throw new Error('DEVICE_NOT_REGISTERED');
      }

      // Preserve the actual error message (e.g., pending approval)
      throw new Error(error.detail || 'Device verification failed');
    }

    const data = await response.json();
    this.securityLevel = 2;
    return data;
  }

  // Register new device
  async registerDevice(): Promise<DeviceRegisterResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    // Get user email for cross-referencing
    let userEmail = 'Unknown';
    try {
      const userInfo = await this.getCurrentUser();
      userEmail = userInfo.email;
    } catch (error) {
      console.warn('Failed to get user email:', error);
    }

    // Get stable browser info
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor || 'Unknown';

    // Get real hardware info from Electron main process
    let realHardwareInfo = null;
    try {
      realHardwareInfo = await window.ipcApi.getHardwareInfo();
    } catch (error) {
      console.warn('Failed to get hardware info from main process:', error);
    }

    // Use real hardware serials or fallback to 'UNKNOWN'
    // Only include stable hardware identifiers (no MAC addresses)
    const hardwareInfo = {
      machine_id: realHardwareInfo?.machineId || 'UNKNOWN',
      processor_id: realHardwareInfo?.cpuInfo.model || 'UNKNOWN',
      bios_serial: realHardwareInfo?.biosSerial || 'UNKNOWN',
      motherboard_serial: realHardwareInfo?.motherboardSerial || 'UNKNOWN',
      disk_serial: realHardwareInfo?.diskSerial || 'UNKNOWN'
    };

    // Get system info for identification (NOT used in hash - can change)
    const hostname = realHardwareInfo?.hostname || window.location.hostname || 'localhost';
    const username = realHardwareInfo?.username || 'Unknown User';
    const osVersion = userAgent.match(/\(([^)]+)\)/)?.[1] || 'Unknown OS';

    // Get the permanent salt to include in device details
    const permanentSalt = await this.getOrCreatePermanentSalt();

    const deviceInfo = {
      device_name: `${userEmail} | ${hostname} | ${username} | ${osVersion}`,
      os_version: osVersion,
      hostname: hostname,
      user_agent: userAgent,
      username: username,
      details: `${userEmail}, ${hostname}, ${username}, Salt:${permanentSalt.substring(0, 8)}...` // Email first for easy cross-reference
    };

    const response = await fetch(`${API_BASE_URL}/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        device_id: this.deviceId,
        device_secret: this.deviceSecret,
        hardware_info: hardwareInfo,
        device_info: deviceInfo
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Device registration failed');
    }

    return await response.json();
  }

  // Stage 3A: Generate TOTP
  async generateTOTP(): Promise<TOTPGenerateResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/totp/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'TOTP generation failed');
    }

    return await response.json();
  }

  // Stage 3B: Verify TOTP
  async verifyTOTP(code: string): Promise<TOTPVerifyResponse> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/totp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        totp_code: code
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'TOTP verification failed');
    }

    const data = await response.json();
    this.securityLevel = 3;
    return data;
  }

  // Utility methods
  getAccessToken(): string | null {
    return this.accessToken;
  }

  getSecurityLevel(): number {
    return this.securityLevel;
  }

  clearAuth(): void {
    this.accessToken = null;
    this.securityLevel = 0;
    sessionStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.securityLevel >= 3;
  }

  // Development bypass - only use during development!
  devBypass(): void {
    this.accessToken = 'dev-bypass-token';
    this.securityLevel = 3;
    sessionStorage.setItem('authToken', 'dev-bypass-token');
  }

  // Get current user info
  async getCurrentUser(): Promise<UserInfo> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user info');
    }

    return await response.json();
  }

  // Get user's OU access
  async getUserOUAccess(): Promise<OUAccess[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/users/ou-access/my-access`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get OU access');
    }

    return await response.json();
  }

  // Get all hotels
  async getHotels(): Promise<Hotel[]> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(`${API_BASE_URL}/hotels/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get hotels');
    }

    const hotels = await response.json();

    // Try to cache the hotels data using IPC if available
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        await window.ipcApi.sendIpcRequest('db:cache-hotels', hotels);
        console.log('Hotels cached successfully');
      } catch (cacheError) {
        console.warn('Failed to cache hotels:', cacheError);
      }
    }

    return hotels;
  }

  // Force refresh hotels cache
  async refreshHotelsCache(): Promise<Hotel[]> {
    if (typeof window !== 'undefined' && window.ipcApi) {
      try {
        // Clear existing cache first
        await window.ipcApi.sendIpcRequest('db:clear-hotels-cache');
      } catch (error) {
        console.warn('Failed to clear hotels cache:', error);
      }
    }

    // Fetch and cache new data
    return this.getHotels();
  }
}

export default new AuthService();