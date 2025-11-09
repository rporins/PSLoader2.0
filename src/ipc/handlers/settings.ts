/**
 * Settings IPC Handlers
 * Handles settings storage in the main process
 */

import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { IpcHandler } from "../types";

interface Settings {
  mode: "light" | "dark";
  [key: string]: any;
}

const SETTINGS_FILE = "settings.json";

function getSettingsPath(): string {
  return path.join(app.getPath("userData"), SETTINGS_FILE);
}

function loadSettings(): Settings {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
  return { mode: "light" };
}

function saveSettings(settings: Settings): void {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export class SettingsHandlers {
  get: IpcHandler<void, Settings> = async (event, request) => {
    const settings = loadSettings();
    return {
      success: true,
      data: settings,
      timestamp: Date.now(),
    };
  };

  set: IpcHandler<Settings, void> = async (event, request) => {
    if (request?.data) {
      saveSettings(request.data);
    }
    return {
      success: true,
      data: undefined,
      timestamp: Date.now(),
    };
  };
}

export function createSettingsHandlers() {
  const handlers = new SettingsHandlers();

  return {
    "settings-get": handlers.get,
    "settings-set": handlers.set,
  };
}
