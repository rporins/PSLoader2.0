/**
 * Hardware IPC Handlers
 * Provides access to system hardware information for device fingerprinting
 */

import { IpcHandler } from "../types";
import os from "os";
import { machineIdSync } from "node-machine-id";
import si from "systeminformation";
import * as db from "../../local_db";
import fs from "fs";
import path from "path";

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
  hostname: string;
  username: string;
}

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
 * Get BIOS serial number using systeminformation
 */
async function getBiosSerial(): Promise<string> {
  try {
    const bios = await si.bios();
    return bios.serial || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting BIOS serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get motherboard serial number using systeminformation
 */
async function getMotherboardSerial(): Promise<string> {
  try {
    const baseboard = await si.baseboard();
    return baseboard.serial || 'UNKNOWN';
  } catch (error) {
    console.error('Error getting motherboard serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get primary disk serial number using systeminformation
 */
async function getDiskSerial(): Promise<string> {
  try {
    const diskLayout = await si.diskLayout();
    if (diskLayout && diskLayout.length > 0) {
      return diskLayout[0].serialNum || 'UNKNOWN';
    }
    return 'UNKNOWN';
  } catch (error) {
    console.error('Error getting disk serial:', error);
    return 'UNKNOWN';
  }
}

/**
 * Get machine ID using node-machine-id (stable across all platforms)
 */
function getMachineId(): string {
  try {
    return machineIdSync();
  } catch (error) {
    console.error('Error getting machine ID:', error);
    return 'UNKNOWN';
  }
}

export class HardwareHandlers {
  /**
   * Get comprehensive hardware information
   */
  getHardwareInfo: IpcHandler<void, HardwareInfo> = async (event) => {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();

    // Fetch hardware info concurrently
    const [biosSerial, motherboardSerial, diskSerial] = await Promise.all([
      getBiosSerial(),
      getMotherboardSerial(),
      getDiskSerial(),
    ]);

    return {
      success: true,
      data: {
        machineId: getMachineId(),
        biosSerial,
        motherboardSerial,
        diskSerial,
        macAddresses: getMacAddresses(),
        cpuInfo: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
        },
        memoryTotal: Math.round(totalMemory / (1024 ** 3)), // Convert to GB
        hostname: os.hostname(),
        username: os.userInfo().username,
      },
      timestamp: Date.now(),
    };
  };

  /**
   * Get or create the permanent device salt
   * This salt is generated once per device and never changes
   * Stored in SQLite database for persistence alongside all other data
   */
  getPermanentSalt: IpcHandler<void, string> = async (event) => {
    try {
      const salt = await db.getPermanentSalt();
      return {
        success: true,
        data: salt,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error managing permanent salt:', error);
      throw new Error('Failed to get or create permanent salt');
    }
  };

  /**
   * Log device secret components to file for debugging
   * Logs to Documents/PSLoader/device-secret.log
   */
  logDeviceSecret: IpcHandler<any, void> = async (event, logData) => {
    try {
      // Get Documents folder path
      const documentsPath = path.join(os.homedir(), 'Documents', 'PSLoader');

      // Ensure directory exists
      if (!fs.existsSync(documentsPath)) {
        fs.mkdirSync(documentsPath, { recursive: true });
      }

      const logFilePath = path.join(documentsPath, 'device-secret.log');

      // Format log entry
      const logEntry = `
═══════════════════════════════════════════════════════════════════
${logData.timestamp}
Device ID: ${logData.deviceId}

Components:
  Platform:           ${logData.components.platform}
  Permanent Salt:     ${logData.components.permanentSalt}
  Machine ID:         ${logData.components.machineId}
  BIOS Serial:        ${logData.components.biosSerial}
  Motherboard Serial: ${logData.components.motherboardSerial}
  Disk Serial:        ${logData.components.diskSerial}
  CPU Model:          ${logData.components.cpuModel}

Raw String (what gets hashed):
${logData.rawString}

Device Secret Hash (SHA-256):
${logData.deviceSecretHash}
═══════════════════════════════════════════════════════════════════
`;

      // Append to log file
      fs.appendFileSync(logFilePath, logEntry);

      return {
        success: true,
        data: undefined,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error logging device secret:', error);
      throw new Error('Failed to log device secret');
    }
  };

}

// Factory function to create and register hardware handlers
export function createHardwareHandlers() {
  const handlers = new HardwareHandlers();

  return {
    'hardware:get-info': handlers.getHardwareInfo,
    'hardware:get-permanent-salt': handlers.getPermanentSalt,
    'hardware:log-device-secret': handlers.logDeviceSecret,
  };
}
