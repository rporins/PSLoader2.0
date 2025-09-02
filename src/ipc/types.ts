/**
 * IPC Types and Interfaces
 * Central type definitions for all IPC communication
 */

import { IpcMainInvokeEvent } from "electron";

// Base handler function type
export type IpcHandler<TRequest = any, TResponse = any> = (
  event: IpcMainInvokeEvent,
  request: TRequest
) => Promise<TResponse> | TResponse;

// Middleware function type
export type IpcMiddleware = (
  event: IpcMainInvokeEvent,
  channel: string,
  args: any[],
  next: () => Promise<any>
) => Promise<any>;

// Handler registration interface
export interface IpcHandlerRegistration {
  channel: string;
  handler: IpcHandler;
  middleware?: IpcMiddleware[];
}

// Result wrapper for consistent error handling
export interface IpcResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: number;
}

// Request/Response types for different domains
export namespace AuthTypes {
  export interface LoginRequest {
    // Add any login parameters if needed
  }
  
  export interface LoginResponse extends IpcResult {
    data?: { success: boolean };
  }
  
  export interface CheckResponse extends IpcResult {
    data?: {
      isAuthenticated: boolean;
      user: any;
    };
  }
}

export namespace DatabaseTypes {
  export interface GetPeriodsRequest {
    // Add parameters as needed
  }
  
  export interface UpdatePeriodsRequest {
    periods: any; // Define proper period type
  }
  
  export interface CreateAccountRequest {
    name: string;
    type: string;
    // Add other account fields
  }
  
  export interface Account {
    id: string;
    name: string;
    type: string;
    // Add other fields
  }
}

// Channel constants to avoid magic strings
export const IPC_CHANNELS = {
  // Auth channels
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_CHECK: 'auth:check',
  
  // Database channels
  DB_GET_PERIODS: 'db:get-periods',
  DB_UPDATE_PERIODS: 'db:update-periods',
  DB_GET_ACCOUNTS: 'db:get-accounts',
  DB_CREATE_ACCOUNT: 'db:create-account',
  DB_GET_DEPARTMENTS: 'db:get-departments',
  DB_CREATE_DEPARTMENT: 'db:create-department',
  DB_GET_COMBO_METADATA: 'db:get-combo-metadata',
  DB_CREATE_COMBO: 'db:create-combo',
  DB_GENERATE_DUMMY_DATA: 'db:generate-dummy-data',
} as const;

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];