import React from "react";
// Import specific functions and components
import { LicenseInfo } from "@mui/x-license";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppThemeProvider from "./components/AppThemeProvider";

//import routes
import Landing from "./routes/landing";
import Register from "./routes/register";
import Login from "./routes/login";
import DeviceVerify from "./routes/device-verify";
import TOTPVerify from "./routes/totp-verify";
import DataTable from "./routes/nestedPages/dataTable";
import SignedInLanding from "./routes/signedinLanding";
import Report from "./routes/nestedPages/report";
import CreateNew from "./routes/nestedPages/createNew";
import COA from "./routes/nestedPages/coa";
import DataImport from "./routes/nestedPages/dataImport";
import Profile from "./routes/nestedPages/profile";
import Settings from "./routes/nestedPages/settings";
import ProtectedRoute from "./components/ProtectedRoute";

// define the route
const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/auth/device-verify",
    element: <DeviceVerify />,
  },
  {
    path: "/auth/totp",
    element: <TOTPVerify />,
  },
  {
    path: "/signed-in-landing",
    element: (
      <ProtectedRoute>
        <SignedInLanding />
      </ProtectedRoute>
    ),
    handle: { title: "Dashboard" },
    children: [
      {
        path: "report",
        element: <Report />,
        handle: { title: "Report" },
      },
      {
        path: "data-table",
        element: <DataTable />,
        handle: { title: "Data Table" },
      },
      {
        path: "create-new",
        element: <CreateNew />,
        handle: { title: "Create New" },
      },
      {
        path: "coa",
        element: <COA />,
        handle: { title: "COA" },
      },
      {
        path: "data-import",
        element: <DataImport />,
        handle: { title: "Data Import" },
      },
      {
        path: "profile",
        element: <Profile />,
        handle: { title: "My Profile" },
      },
      {
        path: "settings",
        element: <Settings />,
        handle: { title: "Settings" },
      },
    ],
  },
]);

// Set the license key
LicenseInfo.setLicenseKey("0170f20369e51857b2536db7dfa0f38eTz0xMTkzODcsRT0xNzkxOTM1OTk5MDAwLFM9cHJlbWl1bSxMTT1zdWJzY3JpcHRpb24sUFY9aW5pdGlhbCxLVj0y");

//root document
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  </StrictMode>
);
