import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { createClient, Client } from "@libsql/client";
import fs from "fs";
import faker from "@faker-js/faker";
import dotenv from "dotenv";
import pl from "nodejs-polars";

import { initializeDatabase } from "./local_db";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Function to handle IPC request
async function handleIpcRequest(event: Electron.IpcMainEvent, request: string, ...args: unknown[]) {
  console.log("IPC request:", request, args); // disable in production

  switch (request) {
    case "Get12periods":
      {
        break;
      }
      break;

    case "Update12periods":
      {
        break;
      }
      break;
  }

  // Send a response back to the renderer process
}

app.whenReady().then(() => {
  // Get the path to the app's user data directory (e.g., AppData on Windows)
  ipcMain.handle("ipcMain", handleIpcRequest);

  initializeDatabase();
});
