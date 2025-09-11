import React from "react";
// Import specific functions and components
import { LicenseInfo } from "@mui/x-license";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppThemeProvider from "./components/AppThemeProvider";

//import routes
import Landing from "./routes/landing";
import DataTable from "./routes/nestedPages/dataTable";
import SignedInLanding from "./routes/signedinLanding";
import Report from "./routes/nestedPages/report";
import CreateNew from "./routes/nestedPages/createNew";
import COA from "./routes/nestedPages/coa";
import Profile from "./routes/nestedPages/profile";
import Settings from "./routes/nestedPages/settings";

// define the route
const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/signed-in-landing",
    element: <SignedInLanding />,
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
LicenseInfo.setLicenseKey("37c46c367fae848830b5e2b62f1751feTz05OTg3OCxFPTE3NjAzNjI0NDkwMDAsUz1wcmVtaXVtLExNPXN1YnNjcmlwdGlvbixQVj1pbml0aWFsLEtWPTI=");

//root document
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppThemeProvider>
      <RouterProvider router={router} />
    </AppThemeProvider>
  </StrictMode>
);
