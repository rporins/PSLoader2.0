/**
 * Authentication IPC Handlers
 * Handles all auth-related IPC requests
 */

import { IpcHandler } from "../types";
import { AuthTypes, IPC_CHANNELS } from "../types";

export class AuthHandlers {
  constructor(private authService: any, private sendToRenderer: (channel: string, payload?: unknown) => void) {}

  login: IpcHandler<AuthTypes.LoginRequest, AuthTypes.LoginResponse> = async (event, request) => {
    await this.authService.startLogin();
    return {
      success: true,
      data: { success: true },
      timestamp: Date.now(),
    };
  };

  logout: IpcHandler = async (event, request) => {
    this.authService.logout();
    this.sendToRenderer("auth-logout");
    return {
      success: true,
      data: { success: true },
      timestamp: Date.now(),
    };
  };

  check: IpcHandler<void, AuthTypes.CheckResponse> = async (event, request) => {
    return {
      success: true,
      data: {
        isAuthenticated: this.authService.isAuthenticated(),
        user: this.authService.getTokenSet(),
      },
      timestamp: Date.now(),
    };
  };
}

// Factory function to create and register auth handlers
export function createAuthHandlers(authService: any, sendToRenderer: (channel: string, payload?: unknown) => void) {
  const handlers = new AuthHandlers(authService, sendToRenderer);
  
  return {
    [IPC_CHANNELS.AUTH_LOGIN]: handlers.login,
    [IPC_CHANNELS.AUTH_LOGOUT]: handlers.logout,
    [IPC_CHANNELS.AUTH_CHECK]: handlers.check,
  };
}