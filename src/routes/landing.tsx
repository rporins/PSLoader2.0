// Import specific React and ReactDOM functions
import React from "react";
import { createRoot } from "react-dom/client";
import { styled } from "@mui/material/styles";
// Import specific components from react-router-dom
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";

export default function Landing() {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/", { replace: true });
  };

  const signinLanding = () => {
    navigate("/signed-in-landing", { replace: false });
  };

  async function requestFromMainProcess() {
    try {
      // Use the exposed API to invoke a request
      const response = await window.ipcApi.sendIpcRequest("Add Account", 2, "February", 2025, 99.99);
      console.log("Response from main:", response);
    } catch (error) {
      console.error("Error from main process:", error);
    }
  }

  return (
    <div>
      <h1>Landing Page</h1>
      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={handleLogout}>
        Sign In
      </Button>

      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={requestFromMainProcess}>
        API Call
      </Button>

      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={signinLanding}>
        New Landing
      </Button>
    </div>
  );
}
