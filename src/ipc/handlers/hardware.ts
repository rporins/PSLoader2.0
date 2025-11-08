/**
 * Hardware IPC Handlers
 * Provides access to system hardware information for device fingerprinting
 */

import { ipcMain } from "electron";
import { createHandler } from "../registry";
import os from "os";
import { execSync } from "child_process";
import { app } from "electron";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface HardwareInfo {
  machineId: string;
  biosSerial: string;
  motherboardSerial: string;
  diskSerial: string;
  macAddresses: string[];
  cpuInfo: {
    model: string;
    cores: number;
  };
  memoryTotal: number; // in GB
}

// Path to store the permanent salt securely
const PERMANENT_SALT_FILE = path.join(app.getPath('userData'), '.device_salt');

/**
 * Get MAC addresses from all network interfaces
 */
function getMacAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const macs: string[] = [];

  for (const name in interfaces) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        // Only include physical MAC addresses (not internal/virtual)
        if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
          macs.push(addr.mac);
        }
      }
    }
  }

  return [...new Set(macs)]; // Remove duplicates
}

/**
 * Get BIOS serial number (platform-specific)
 */
function getBiosSerial(): string {
  try {
    const platform = os.platform();
    let serial = '';

    if (platform === 'win32') {
      // Windows: Use WMIC to get BIOS serial
      serial = execSync('wmic bios get serialnumber', { encoding: 'utf-8' })
        .split('\n')[1]
        .trim();
    } else if (platform === 'darwin') {
      // macOS: Use system_profiler
      serial = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { encoding: 'utf-8' })
        .split(':')[1]
        .trim();
    } else if (platform === 'linux') {
      // Linux: Use dmidecode (requires root, fallback to /sys/)
      try {
        serial = execSync('cat /sys/class/dmi/id/product_serial', { encoding: 'utf-8' }).trim();
      } catch {
        serial = execSync('sudo dmidecode -s system-serial-number', { encoding: 'utf-8' }).trim();
      }
    }

    return serial || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting BIOS serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get motherboard serial number (platform-specific)
 */
function getMotherboardSerial(): string {
  try {
    const platform = os.platform();
    let serial = '';

    if (platform === 'win32') {
      // Windows: Use WMIC to get motherboard serial
      serial = execSync('wmic baseboard get serialnumber', { encoding: 'utf-8' })
        .split('\n')[1]
        .trim();
    } else if (platform === 'darwin') {
      // macOS: Use system_profiler for hardware UUID
      serial = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf-8' })
        .split(':')[1]
        .trim();
    } else if (platform === 'linux') {
      // Linux: Use dmidecode
      try {
        serial = execSync('cat /sys/class/dmi/id/board_serial', { encoding: 'utf-8' }).trim();
      } catch {
        serial = execSync('sudo dmidecode -s baseboard-serial-number', { encoding: 'utf-8' }).trim();
      }
    }

    return serial || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting motherboard serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get primary disk serial number (platform-specific)
 */
function getDiskSerial(): string {
  try {
    const platform = os.platform();
    let serial = '';

    if (platform === 'win32') {
      // Windows: Get C: drive serial using WMIC
      serial = execSync('wmic diskdrive get serialnumber', { encoding: 'utf-8' })
        .split('\n')[1]
        .trim();
    } else if (platform === 'darwin') {
      // macOS: Use diskutil for boot disk
      const diskInfo = execSync('diskutil info / | grep "Volume UUID"', { encoding: 'utf-8' })
        .split(':')[1]
        .trim();
      serial = diskInfo;
    } else if (platform === 'linux') {
      // Linux: Get serial from primary disk
      try {
        serial = execSync('lsblk -nd -o SERIAL /dev/sda', { encoding: 'utf-8' }).trim();
      } catch {
        serial = execSync('cat /sys/class/block/sda/device/serial', { encoding: 'utf-8' }).trim();
      }
    }

    return serial || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting disk serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get machine ID (OS-level unique identifier)
 */
function getMachineId(): string {
  try {
    const platform = os.platform();
    let machineId = '';

    if (platform === 'win32') {
      // Windows: Use WMIC to get computer system UUID
      machineId = execSync('wmic csproduct get uuid', { encoding: 'utf-8' })
        .split('\n')[1]
        .trim();
    } else if (platform === 'darwin') {
      // macOS: Hardware UUID from system_profiler
      machineId = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf-8' })
        .split('=')[1]
        .trim()
        .replace(/"/g, '');
    } else if (platform === 'linux') {
      // Linux: machine-id from systemd
      try {
        machineId = execSync('cat /etc/machine-id', { encoding: 'utf-8' }).trim();
      } catch {
        machineId = execSync('cat /var/lib/dbus/machine-id', { encoding: 'utf-8' }).trim();
      }
    }

    return machineId || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting machine ID:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get comprehensive hardware information
 */
export const getHardwareInfo = createHandler<void, HardwareInfo>(
  "hardware:get-info",
  async () => {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();

    return {
      machineId: getMachineId(),
      biosSerial: getBiosSerial(),
      motherboardSerial: getMotherboardSerial(),
      diskSerial: getDiskSerial(),
      macAddresses: getMacAddresses(),
      cpuInfo: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
      },
      memoryTotal: Math.round(totalMemory / (1024 ** 3)), // Convert to GB
    };
  }
);

/**
 * Get or create the permanent device salt
 * This salt is generated once per device and never changes
 * Stored in the user data directory for persistence
 */
export const getPermanentSalt = createHandler<void, string>(
  "hardware:get-permanent-salt",
  async () => {
    try {
      // Check if salt file exists
      if (fs.existsSync(PERMANENT_SALT_FILE)) {
        // Read existing salt
        const salt = fs.readFileSync(PERMANENT_SALT_FILE, 'utf-8').trim();
        if (salt && salt.length === 32) {
          return salt;
        }
        // If invalid, regenerate
        console.warn('Invalid permanent salt found, regenerating...');
      }

      // Generate new permanent salt (32-character hex string = 16 bytes)
      const salt = crypto.randomBytes(16).toString('hex');

      // Store it securely with restricted permissions
      fs.writeFileSync(PERMANENT_SALT_FILE, salt, {
        mode: 0o600, // Read/write only for owner
        encoding: 'utf-8'
      });

      console.log('Generated new permanent device salt');
      return salt;
    } catch (error) {
      console.error('Error managing permanent salt:', error);
      throw new Error('Failed to get or create permanent salt');
    }
  }
);
