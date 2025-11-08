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
    // Load or generate device credentials
    const stored = localStorage.getItem('deviceCredentials');
    if (stored) {
      const creds = JSON.parse(stored);
      this.deviceId = creds.deviceId;
      this.deviceSecret = creds.deviceSecret;
    } else {
      await this.generateDeviceCredentials();
    }
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
    // Get permanent salt unique to this device (stored securely in Electron main process)
    const permanentSalt = await this.getOrCreatePermanentSalt();

    // Collect stable browser fingerprint data
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const vendor = navigator.vendor;
    const hardwareConcurrency = navigator.hardwareConcurrency || 0;

    // Get hardware info from Electron main process
    let hardwareInfo = null;
    try {
      hardwareInfo = await window.ipcApi.getHardwareInfo();
    } catch (error) {
      console.warn('Failed to get hardware info from main process:', error);
    }

    // Create stable device fingerprint for Device ID
    // Only include permanent hardware identifiers that never change
    const deviceIdComponents = [
      platform,
      permanentSalt
    ];

    // Add real hardware identifiers if available (stable across reboots/updates)
    if (hardwareInfo) {
      deviceIdComponents.push(
        hardwareInfo.machineId,
        hardwareInfo.biosSerial,
        hardwareInfo.motherboardSerial,
        hardwareInfo.cpuInfo.model
      );
    }

    // Generate device ID using Web Crypto API
    const encoder = new TextEncoder();
    const deviceIdData = encoder.encode(deviceIdComponents.join('||'));
    const deviceIdHash = await crypto.subtle.digest('SHA-256', deviceIdData);
    const deviceIdArray = Array.from(new Uint8Array(deviceIdHash));
    this.deviceId = deviceIdArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Create device secret with additional hardware info
    // Include everything from Device ID plus disk and memory info
    const deviceSecretComponents = [
      platform,
      permanentSalt
    ];

    // Add real hardware identifiers (stable hardware components)
    if (hardwareInfo) {
      deviceSecretComponents.push(
        hardwareInfo.machineId,
        hardwareInfo.biosSerial,
        hardwareInfo.motherboardSerial,
        hardwareInfo.diskSerial,
        hardwareInfo.cpuInfo.model,
        hardwareInfo.cpuInfo.cores.toString(),
        hardwareInfo.memoryTotal.toString()
      );
    }

    // Generate device secret
    const deviceSecretData = encoder.encode(deviceSecretComponents.join('||'));
    const deviceSecretHash = await crypto.subtle.digest('SHA-256', deviceSecretData);
    const deviceSecretArray = Array.from(new Uint8Array(deviceSecretHash));
    this.deviceSecret = deviceSecretArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store credentials
    localStorage.setItem('deviceCredentials', JSON.stringify({
      deviceId: this.deviceId,
      deviceSecret: this.deviceSecret
    }));
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
    const hardwareInfo = {
      machine_id: realHardwareInfo?.machineId || 'UNKNOWN',
      processor_id: realHardwareInfo?.cpuInfo.model || 'UNKNOWN',
      bios_serial: realHardwareInfo?.biosSerial || 'UNKNOWN',
      motherboard_serial: realHardwareInfo?.motherboardSerial || 'UNKNOWN',
      disk_serial: realHardwareInfo?.diskSerial || 'UNKNOWN',
      mac_addresses: realHardwareInfo?.macAddresses || []
    };

    const deviceInfo = {
      device_name: platform || 'Unknown Device',
      os_version: userAgent.match(/\(([^)]+)\)/)?.[1] || 'Unknown OS',
      hostname: window.location.hostname || 'localhost',
      user_agent: userAgent
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
}

export default new AuthService();