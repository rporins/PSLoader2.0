/**
 * SessionGate — the app entry ("/").
 * -----------------------------------------------------------
 * By the time this renders, AppInitializer has kicked off the (background)
 * cold-start resume and the fast local `hasResumableSession` check has resolved.
 * We route accordingly — there is no blocking splash and no separate welcome
 * screen; a resumable session surfaces as the "Continue session" button on the
 * login page itself.
 */

import React from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/auth";
import Landing from "./landing";

const SessionGate: React.FC = () => {
  // Already fully signed in during this run -> straight into the app.
  if (authService.getSecurityLevel() >= 3 && !authService.isStepUpRequired()) {
    return <Navigate to="/signed-in-landing/home" replace />;
  }

  // A resumable session exists (or is still being checked in the background) ->
  // land on the login page, where the "Continue session" button appears.
  if (authService.hasResumableSession()) {
    return <Navigate to="/login" replace />;
  }

  // Brand-new / signed-out user -> the marketing landing page.
  return <Landing />;
};

export default SessionGate;
