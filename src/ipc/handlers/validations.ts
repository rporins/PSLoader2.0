/**
 * Validation IPC Handlers
 * =======================
 *
 * Handles all validation-related IPC requests from the renderer process.
 */

import { IpcHandler } from "../types";
import { IPC_CHANNELS } from "../types";
import { ValidationRegistry } from "../../services/validations";
import * as db from "../../local_db";

// Initialize the validation registry with database access
// This will be called when the handlers are created
function initializeRegistry() {
  // Pass a wrapper around the database client that the validations can use
  ValidationRegistry.setDatabase({
    execute: (query: { sql: string; args: any[] }) => db.executeQuery(query),
  });
  ValidationRegistry.initialize();
}

export class ValidationHandlers {
  constructor() {
    // Initialize registry when handlers are created
    initializeRegistry();
  }

  /**
   * Run a validation
   * Request: { validationName: string, ou?: string, period?: { year, month } }
   */
  runValidationHandler: IpcHandler = async (event, request) => {
    try {
      console.log('[ValidationHandlers] Running validation:', request.validationName);

      const result = await ValidationRegistry.executeValidation(
        request.validationName,
        {
          ou: request.ou,
          period: request.period,
        }
      );

      return {
        success: result.success,
        data: result.result,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationHandlers] Error running validation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  };

  /**
   * Get all available validations
   * Request: { ou?: string }
   */
  getAllValidationsHandler: IpcHandler = async (event, request) => {
    try {
      let validations = ValidationRegistry.getAllMetadata();

      // Filter by OU if provided
      if (request?.ou) {
        validations = validations.filter(v => !v.ou || v.ou === request.ou);
      }

      return {
        success: true,
        data: validations,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationHandlers] Error getting validations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  };

  /**
   * Run all validations for an OU
   * Request: { ou: string, period?: { year, month } }
   */
  runAllValidationsHandler: IpcHandler = async (event, request) => {
    try {
      console.log('[ValidationHandlers] Running all validations for OU:', request.ou);

      const results = await ValidationRegistry.executeAllForOU(
        request.ou,
        {
          period: request.period,
        }
      );

      return {
        success: true,
        data: results,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationHandlers] Error running all validations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  };

  /**
   * Preview a validation (get info without running)
   * Request: { validationName: string, ou?: string }
   */
  previewValidationHandler: IpcHandler = async (event, request) => {
    try {
      const preview = await ValidationRegistry.previewValidation(
        request.validationName,
        {
          ou: request.ou,
        }
      );

      return {
        success: true,
        data: preview,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationHandlers] Error previewing validation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  };

  /**
   * Get validation statistics
   */
  getValidationStatsHandler: IpcHandler = async (event) => {
    try {
      const stats = ValidationRegistry.getStatistics();

      return {
        success: true,
        data: stats,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('[ValidationHandlers] Error getting validation stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      };
    }
  };
}

// Factory function to create and register validation handlers
export function createValidationHandlers() {
  const handlers = new ValidationHandlers();

  return {
    [IPC_CHANNELS.VALIDATION_RUN]: handlers.runValidationHandler,
    // Add more channels if needed
    'validation:get-all': handlers.getAllValidationsHandler,
    'validation:run-all': handlers.runAllValidationsHandler,
    'validation:preview': handlers.previewValidationHandler,
    'validation:stats': handlers.getValidationStatsHandler,
  };
}
