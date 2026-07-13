/**
 * Authentication IPC Handlers
 * -----------------------------------------------------------
 * Thin adapters over the main-process AuthController. Each channel is an
 * explicit, named domain action — the renderer never gets a token or a generic
 * API passthrough. Handlers return plain data; the registry wraps it in the
 * standard { success, data, timestamp } envelope and converts thrown errors to
 * { success: false, error }.
 */

import { IpcHandler } from "../types";
import { AuthController } from "../../main/auth/authController";

/** Auth IPC channel names (also mirrored in the preload allowlist). */
export const AUTH_CHANNELS = {
  REGISTER: "auth:register",
  LOGIN: "auth:login",
  REGISTER_DEVICE: "auth:registerDevice",
  VERIFY_DEVICE: "auth:verifyDevice",
  GENERATE_TOTP: "auth:generateTotp",
  SUBMIT_TOTP: "auth:submitTotp",
  LOGOUT: "auth:logout",
  GET_STATUS: "auth:getStatus",
  RESUME: "auth:resume",
  HAS_RESUMABLE: "auth:hasResumableSession",
  REQUEST_PASSWORD_RESET: "auth:requestPasswordReset",
  CONFIRM_PASSWORD_RESET: "auth:confirmPasswordReset",
} as const;

export function createAuthHandlers(
  controller: AuthController
): Record<string, IpcHandler> {
  const register: IpcHandler<{ email: string; password: string }> = (_event, p) =>
    controller.register(p.email, p.password);

  const login: IpcHandler<{ email: string; password: string }> = (_event, p) =>
    controller.login(p.email, p.password);

  const registerDevice: IpcHandler = () => controller.registerDevice();

  const verifyDevice: IpcHandler = () => controller.verifyDevice();

  const generateTotp: IpcHandler = () => controller.generateTotp();

  const submitTotp: IpcHandler<{ code: string }> = (_event, p) =>
    controller.submitTotp(p.code);

  const logout: IpcHandler = () => controller.logout();

  const getStatus: IpcHandler = () => controller.getStatus();

  const resume: IpcHandler = () => controller.resume();

  const hasResumableSession: IpcHandler = () => controller.hasResumableSession();

  const requestPasswordReset: IpcHandler<{ email: string }> = (_event, p) =>
    controller.requestPasswordReset(p.email);

  const confirmPasswordReset: IpcHandler<{ token: string; newPassword: string }> = (
    _event,
    p
  ) => controller.confirmPasswordReset(p.token, p.newPassword);

  return {
    [AUTH_CHANNELS.REGISTER]: register,
    [AUTH_CHANNELS.LOGIN]: login,
    [AUTH_CHANNELS.REGISTER_DEVICE]: registerDevice,
    [AUTH_CHANNELS.VERIFY_DEVICE]: verifyDevice,
    [AUTH_CHANNELS.GENERATE_TOTP]: generateTotp,
    [AUTH_CHANNELS.SUBMIT_TOTP]: submitTotp,
    [AUTH_CHANNELS.LOGOUT]: logout,
    [AUTH_CHANNELS.GET_STATUS]: getStatus,
    [AUTH_CHANNELS.RESUME]: resume,
    [AUTH_CHANNELS.HAS_RESUMABLE]: hasResumableSession,
    [AUTH_CHANNELS.REQUEST_PASSWORD_RESET]: requestPasswordReset,
    [AUTH_CHANNELS.CONFIRM_PASSWORD_RESET]: confirmPasswordReset,
  };
}
