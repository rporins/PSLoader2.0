/**
 * IPC Module Index
 * Main entry point for IPC system setup
 */

import { ipcRegistry } from "./registry";
import { createAuthHandlers, createDatabaseHandlers, createHardwareHandlers, createDataImportHandlers, createSettingsHandlers } from "./handlers";
import {
  loggingMiddleware,
  errorHandlingMiddleware,
  performanceMiddleware,
  securityMiddleware,
  rateLimitMiddleware
} from "./middleware";

export * from "./types";
export * from "./registry";
export * from "./middleware";
export * from "./handlers";

/**
 * Initialize the IPC system with all handlers and middleware
 */
export function initializeIpc(
  authService: any, 
  sendToRenderer: (channel: string, payload?: unknown) => void,
  logger?: any
) {
  // Set up global middleware
  ipcRegistry.use(securityMiddleware());
  ipcRegistry.use(errorHandlingMiddleware(logger));
  ipcRegistry.use(loggingMiddleware(logger));
  ipcRegistry.use(performanceMiddleware(1000)); // 1 second slow threshold
  ipcRegistry.use(rateLimitMiddleware(20, 1000)); // 20 requests per second per channel

  // Register auth handlers
  const authHandlers = createAuthHandlers(authService, sendToRenderer);
  Object.entries(authHandlers).forEach(([channel, handler]) => {
    ipcRegistry.register(channel, handler);
  });

  // Register database handlers
  const dbHandlers = createDatabaseHandlers();
  Object.entries(dbHandlers).forEach(([channel, handler]) => {
    ipcRegistry.register(channel, handler);
  });

  // Register hardware handlers
  const hardwareHandlers = createHardwareHandlers();
  Object.entries(hardwareHandlers).forEach(([channel, handler]) => {
    ipcRegistry.register(channel, handler);
  });

  // Register Data Import handlers
  const dataImportHandlers = createDataImportHandlers();
  Object.entries(dataImportHandlers).forEach(([channel, handler]) => {
    ipcRegistry.register(channel, handler);
  });

  // Register Settings handlers
  const settingsHandlers = createSettingsHandlers();
  Object.entries(settingsHandlers).forEach(([channel, handler]) => {
    ipcRegistry.register(channel, handler);
  });

  // Initialize the registry (sets up the main IPC listener)
  ipcRegistry.initialize();

  if (logger) {
    logger.info("IPC system initialized with modular handlers and middleware");
    logger.debug("Registered channels:", ipcRegistry.getRegisteredChannels());
  }
}

// Export the registry instance for advanced usage
export { ipcRegistry };