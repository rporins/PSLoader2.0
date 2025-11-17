/**
 * Database IPC Handlers
 * Handles all database-related IPC requests
 */

import { IpcHandler } from "../types";
import { DatabaseTypes, IPC_CHANNELS } from "../types";
import * as db from "../../local_db";

export class DatabaseHandlers {
  getPeriodsHandler: IpcHandler = async (event, ...args) => {
    const result = await db.get12Periods(...args);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  updatePeriodsHandler: IpcHandler = async (event, ...args) => {
    const result = await db.update12Periods(...args);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  generateDummyDataHandler: IpcHandler = async (event, request) => {
    await db.GeneratedDummyData();
    return {
      success: true,
      data: { message: "Dummy data generated successfully" },
      timestamp: Date.now(),
    };
  };

  getAllAccountsHandler: IpcHandler = async (event, request) => {
    const result = await db.getAllAccounts();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getAllDepartmentsHandler: IpcHandler = async (event, request) => {
    const result = await db.getAllDepartments();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getAllComboMetadataHandler: IpcHandler = async (event, request) => {
    const result = await db.getAllComboMetadata();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  createAccountHandler: IpcHandler<DatabaseTypes.CreateAccountRequest> = async (event, request) => {
    const result = await db.createAccount(request);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  createDepartmentHandler: IpcHandler = async (event, request) => {
    const result = await db.createDepartment(request);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  createComboHandler: IpcHandler = async (event, request) => {
    const result = await db.createCombo(request);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  // Hotels cache handlers
  getCachedHotelsHandler: IpcHandler = async (event) => {
    const result = await db.getCachedHotels();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  cacheHotelsHandler: IpcHandler = async (event, hotels) => {
    const result = await db.cacheHotels(hotels);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  clearHotelsCacheHandler: IpcHandler = async (event) => {
    const result = await db.clearHotelsCache();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  isHotelsCacheExpiredHandler: IpcHandler = async (event, hoursThreshold) => {
    const result = await db.isHotelsCacheExpired(hoursThreshold);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };
}

// Factory function to create and register database handlers
export function createDatabaseHandlers() {
  const handlers = new DatabaseHandlers();

  return {
    [IPC_CHANNELS.DB_GET_PERIODS]: handlers.getPeriodsHandler,
    [IPC_CHANNELS.DB_UPDATE_PERIODS]: handlers.updatePeriodsHandler,
    [IPC_CHANNELS.DB_GENERATE_DUMMY_DATA]: handlers.generateDummyDataHandler,
    [IPC_CHANNELS.DB_GET_ACCOUNTS]: handlers.getAllAccountsHandler,
    [IPC_CHANNELS.DB_GET_DEPARTMENTS]: handlers.getAllDepartmentsHandler,
    [IPC_CHANNELS.DB_GET_COMBO_METADATA]: handlers.getAllComboMetadataHandler,
    [IPC_CHANNELS.DB_CREATE_ACCOUNT]: handlers.createAccountHandler,
    [IPC_CHANNELS.DB_CREATE_DEPARTMENT]: handlers.createDepartmentHandler,
    [IPC_CHANNELS.DB_CREATE_COMBO]: handlers.createComboHandler,
    [IPC_CHANNELS.DB_GET_CACHED_HOTELS]: handlers.getCachedHotelsHandler,
    [IPC_CHANNELS.DB_CACHE_HOTELS]: handlers.cacheHotelsHandler,
    [IPC_CHANNELS.DB_CLEAR_HOTELS_CACHE]: handlers.clearHotelsCacheHandler,
    [IPC_CHANNELS.DB_IS_HOTELS_CACHE_EXPIRED]: handlers.isHotelsCacheExpiredHandler,
  };
}