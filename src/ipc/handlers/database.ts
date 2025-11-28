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

  // Mapping config handlers
  storeMappingConfigHandler: IpcHandler = async (event, config) => {
    await db.storeMappingConfig(config);
    return {
      success: true,
      data: { message: "Mapping config stored successfully" },
      timestamp: Date.now(),
    };
  };

  getMappingConfigHandler: IpcHandler = async (event, request) => {
    const result = await db.getMappingConfig(request.config_id);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getAllMappingConfigsHandler: IpcHandler = async (event) => {
    const result = await db.getAllMappingConfigs();
    console.log('[getAllMappingConfigsHandler] Database returned:', result);
    console.log('[getAllMappingConfigsHandler] Number of configs:', result?.length || 0);
    if (result && result.length > 0) {
      console.log('[getAllMappingConfigsHandler] First config:', result[0]);
    }
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  updateMappingConfigSyncTimeHandler: IpcHandler = async (event, request) => {
    await db.updateMappingConfigSyncTime(request.config_id);
    return {
      success: true,
      data: { message: "Sync time updated successfully" },
      timestamp: Date.now(),
    };
  };

  // Mapping handlers
  replaceMappingsHandler: IpcHandler = async (event, request) => {
    await db.replaceMappings(request.config_id, request.mappings);
    return {
      success: true,
      data: { message: `Replaced ${request.mappings.length} mappings successfully` },
      timestamp: Date.now(),
    };
  };

  getMappingsHandler: IpcHandler = async (event, request) => {
    const result = await db.getMappings(request.config_id);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getMappingCountHandler: IpcHandler = async (event, request) => {
    const result = await db.getMappingCount(request.config_id);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  findMappingHandler: IpcHandler = async (event, request) => {
    const result = await db.findMapping(
      request.config_id,
      request.source_account,
      request.source_department
    );
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  // Import group handlers
  storeImportGroupsHandler: IpcHandler = async (event, request) => {
    await db.storeImportGroups(request.ou, request.importGroups);
    return {
      success: true,
      data: { message: "Import groups stored successfully" },
      timestamp: Date.now(),
    };
  };

  getImportGroupsHandler: IpcHandler = async (event, request) => {
    const result = await db.getImportGroups(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getMappingConfigIdsForOUHandler: IpcHandler = async (event, request) => {
    const result = await db.getMappingConfigIdsForOU(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  hasImportGroupsCachedHandler: IpcHandler = async (event, request) => {
    const result = await db.hasImportGroupsCached(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  // Import session handlers
  createImportSessionHandler: IpcHandler = async (event, request) => {
    const sessionId = await db.createImportSession(request);
    return {
      success: true,
      data: sessionId,
      timestamp: Date.now(),
    };
  };

  updateImportSessionStatusHandler: IpcHandler = async (event, request) => {
    await db.updateImportSessionStatus(request.sessionId, request.status);
    return {
      success: true,
      data: { message: "Import session status updated successfully" },
      timestamp: Date.now(),
    };
  };

  getLatestImportSessionHandler: IpcHandler = async (event, request) => {
    const result = await db.getLatestImportSession(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getImportSessionHandler: IpcHandler = async (event, request) => {
    const result = await db.getImportSession(request.sessionId);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getImportSessionsHandler: IpcHandler = async (event, request) => {
    const result = await db.getImportSessions(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  // Staging table handlers
  clearStagingTableHandler: IpcHandler = async (event) => {
    await db.clearStagingTable();
    return {
      success: true,
      data: { message: "Staging table cleared successfully" },
      timestamp: Date.now(),
    };
  };

  // Mapping tables handlers
  getMappingTablesVersionHandler: IpcHandler = async (event) => {
    const result = await db.getMappingTablesVersion();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  setMappingTablesVersionHandler: IpcHandler = async (event, request) => {
    await db.setMappingTablesVersion(request.version, request.comboVersion);
    return {
      success: true,
      data: { message: "Mapping tables version updated successfully" },
      timestamp: Date.now(),
    };
  };

  storeAccountMapsHandler: IpcHandler = async (event, request) => {
    await db.storeAccountMaps(request.accountMaps);
    return {
      success: true,
      data: { message: `Stored ${request.accountMaps.length} account maps successfully` },
      timestamp: Date.now(),
    };
  };

  storeDepartmentMapsHandler: IpcHandler = async (event, request) => {
    await db.storeDepartmentMaps(request.departmentMaps);
    return {
      success: true,
      data: { message: `Stored ${request.departmentMaps.length} department maps successfully` },
      timestamp: Date.now(),
    };
  };

  storeCombosHandler: IpcHandler = async (event, request) => {
    await db.storeAccountDepartmentCombos(request.combos);
    return {
      success: true,
      data: { message: `Stored ${request.combos.length} combos successfully` },
      timestamp: Date.now(),
    };
  };

  getAccountMapsHandler: IpcHandler = async (event) => {
    const result = await db.getAccountMaps();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getDepartmentMapsHandler: IpcHandler = async (event) => {
    const result = await db.getDepartmentMaps();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getCombosHandler: IpcHandler = async (event) => {
    const result = await db.getAccountDepartmentCombos();
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  isValidComboHandler: IpcHandler = async (event, request) => {
    const result = await db.isValidCombo(request.account, request.department);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getAccountMapHandler: IpcHandler = async (event, request) => {
    const result = await db.getAccountMapByBase(request.baseAccount);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getDepartmentMapHandler: IpcHandler = async (event, request) => {
    const result = await db.getDepartmentMapByBase(request.baseDepartment);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  // Financial data import handlers
  storeFinancialDataHandler: IpcHandler = async (event, request) => {
    await db.storeFinancialData(request.ou, request.records);
    return {
      success: true,
      data: { message: `Stored ${request.records.length} financial records successfully` },
      timestamp: Date.now(),
    };
  };

  getFinancialDataCountHandler: IpcHandler = async (event, request) => {
    const result = await db.getFinancialDataCount(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getFinancialDataLastImportHandler: IpcHandler = async (event, request) => {
    const result = await db.getFinancialDataLastImport(request.ou);
    return {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  };

  getFinancialReportDataHandler: IpcHandler = async (event, request) => {
    const result = await db.getFinancialReportData(request.startPeriod, request.ou);
    console.log('[getFinancialReportDataHandler] Request:', request);
    console.log('[getFinancialReportDataHandler] Result type:', typeof result);
    console.log('[getFinancialReportDataHandler] Result length:', result?.length);
    console.log('[getFinancialReportDataHandler] Result preview:', result?.substring(0, 200));
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
    [IPC_CHANNELS.DB_STORE_MAPPING_CONFIG]: handlers.storeMappingConfigHandler,
    [IPC_CHANNELS.DB_GET_MAPPING_CONFIG]: handlers.getMappingConfigHandler,
    [IPC_CHANNELS.DB_GET_ALL_MAPPING_CONFIGS]: handlers.getAllMappingConfigsHandler,
    [IPC_CHANNELS.DB_UPDATE_MAPPING_CONFIG_SYNC_TIME]: handlers.updateMappingConfigSyncTimeHandler,
    [IPC_CHANNELS.DB_REPLACE_MAPPINGS]: handlers.replaceMappingsHandler,
    [IPC_CHANNELS.DB_GET_MAPPINGS]: handlers.getMappingsHandler,
    [IPC_CHANNELS.DB_GET_MAPPING_COUNT]: handlers.getMappingCountHandler,
    [IPC_CHANNELS.DB_FIND_MAPPING]: handlers.findMappingHandler,
    [IPC_CHANNELS.DB_STORE_IMPORT_GROUPS]: handlers.storeImportGroupsHandler,
    [IPC_CHANNELS.DB_GET_IMPORT_GROUPS]: handlers.getImportGroupsHandler,
    [IPC_CHANNELS.DB_GET_MAPPING_CONFIG_IDS_FOR_OU]: handlers.getMappingConfigIdsForOUHandler,
    [IPC_CHANNELS.DB_HAS_IMPORT_GROUPS_CACHED]: handlers.hasImportGroupsCachedHandler,
    [IPC_CHANNELS.DB_CREATE_IMPORT_SESSION]: handlers.createImportSessionHandler,
    [IPC_CHANNELS.DB_UPDATE_IMPORT_SESSION_STATUS]: handlers.updateImportSessionStatusHandler,
    [IPC_CHANNELS.DB_GET_LATEST_IMPORT_SESSION]: handlers.getLatestImportSessionHandler,
    [IPC_CHANNELS.DB_GET_IMPORT_SESSION]: handlers.getImportSessionHandler,
    [IPC_CHANNELS.DB_GET_IMPORT_SESSIONS]: handlers.getImportSessionsHandler,
    [IPC_CHANNELS.DB_CLEAR_STAGING_TABLE]: handlers.clearStagingTableHandler,
    [IPC_CHANNELS.DB_GET_MAPPING_TABLES_VERSION]: handlers.getMappingTablesVersionHandler,
    [IPC_CHANNELS.DB_SET_MAPPING_TABLES_VERSION]: handlers.setMappingTablesVersionHandler,
    [IPC_CHANNELS.DB_STORE_ACCOUNT_MAPS]: handlers.storeAccountMapsHandler,
    [IPC_CHANNELS.DB_STORE_DEPARTMENT_MAPS]: handlers.storeDepartmentMapsHandler,
    [IPC_CHANNELS.DB_STORE_COMBOS]: handlers.storeCombosHandler,
    [IPC_CHANNELS.DB_GET_ACCOUNT_MAPS]: handlers.getAccountMapsHandler,
    [IPC_CHANNELS.DB_GET_DEPARTMENT_MAPS]: handlers.getDepartmentMapsHandler,
    [IPC_CHANNELS.DB_GET_COMBOS]: handlers.getCombosHandler,
    [IPC_CHANNELS.DB_IS_VALID_COMBO]: handlers.isValidComboHandler,
    [IPC_CHANNELS.DB_GET_ACCOUNT_MAP]: handlers.getAccountMapHandler,
    [IPC_CHANNELS.DB_GET_DEPARTMENT_MAP]: handlers.getDepartmentMapHandler,
    [IPC_CHANNELS.DB_STORE_FINANCIAL_DATA]: handlers.storeFinancialDataHandler,
    [IPC_CHANNELS.DB_GET_FINANCIAL_DATA_COUNT]: handlers.getFinancialDataCountHandler,
    [IPC_CHANNELS.DB_GET_FINANCIAL_DATA_LAST_IMPORT]: handlers.getFinancialDataLastImportHandler,
    [IPC_CHANNELS.DB_GET_FINANCIAL_REPORT_DATA]: handlers.getFinancialReportDataHandler,
  };
}