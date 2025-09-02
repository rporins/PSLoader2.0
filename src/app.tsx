import React from "react";
// Import specific functions and components
import { LicenseInfo } from "@mui/x-license";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//import routes
import Landing from "./routes/landing";
import DataTable from "./routes/nestedPages/dataTable";
import SignedInLanding from "./routes/signedinLanding";
import Report from "./routes/nestedPages/report";
import CreateNew from "./routes/nestedPages/createNew";
import COA from "./routes/nestedPages/coa";

// define the route
const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/signed-in-landing",
    element: <SignedInLanding />,
    children: [
      {
        path: "report",
        element: <Report />,
      },
      {
        path: "data-table",
        element: <DataTable />,
      },
      {
        path: "create-new",
        element: <CreateNew />,
      },
      {
        path: "coa",
        element: <COA />,
      },
    ],
  },
]);

// Set the license key
LicenseInfo.setLicenseKey("37c46c367fae848830b5e2b62f1751feTz05OTg3OCxFPTE3NjAzNjI0NDkwMDAsUz1wcmVtaXVtLExNPXN1YnNjcmlwdGlvbixQVj1pbml0aWFsLEtWPTI=");

//root document
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
