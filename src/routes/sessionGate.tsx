/**
 * SessionGate — the app entry ("/").
 * -----------------------------------------------------------
 * The app always opens on the landing page unless the user is already fully
 * signed in this run. AppInitializer has, by now, kicked off the (background)
 * cold-start resume; the user reads the landing page and clicks "Sign In",
 * giving that resume time to finish, and a resumable session then surfaces as
 * the "Continue session" button on the login page itself.
 *
 * We deliberately do NOT redirect a resumable session straight to /login —
 * that would skip the landing page for returning users and make the login
 * page's "Back" button appear to do nothing (/ would just bounce back here).
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

  // Everyone else (brand-new, signed-out, or resumable) -> the landing page.
  // The background resume keeps running; "Continue session" appears on /login.
  return <Landing />;
};

export default SessionGate;
