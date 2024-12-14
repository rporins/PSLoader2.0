import React from "react";
import { Button } from "@mui/material";
import { Outlet, Routes, Route, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function Hello() {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/", { replace: true });
  };

  const handleNav_dataTable = () => {
    navigate("/data-table", { replace: false });
  };

  const signinLanding = () => {
    navigate("/signed-in-landing", { replace: false });
  };

  return (
    <div>
      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={handleLogout}>
        Sign In
      </Button>

      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={handleNav_dataTable}>
        Data Table
      </Button>

      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={signinLanding}>
        New Landing
      </Button>
    </div>
  );
}
