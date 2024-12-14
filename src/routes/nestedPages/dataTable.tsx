// Import specific React and ReactDOM functions
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { styled } from "@mui/material/styles";
// Import specific components from react-router-dom
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import {
  DataGridPremium,
  GridRowsProp,
  GridColDef,
  GridActionsCellItem,
  GridEventListener,
  GridRowParams,
  MuiEvent,
  GridRowModel,
  GridRowId,
} from "@mui/x-data-grid-premium";

interface FinancialDataRow {
  combo: string;
  department: string;
  account: string;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5: number;
  p6: number;
  p7: number;
  p8: number;
  p9: number;
  p10: number;
  p11: number;
  p12: number;
}

export default function DataTable() {
  const navigate = useNavigate();
  const handleSignout = () => {
    navigate("/", { replace: true });
  };

  const [rows, setRows] = useState<GridRowsProp>([]); // Initialize rows state

  // Define columns for the grid
  const columns: GridColDef[] = [
    { field: "department", headerName: "Department", width: 150 },
    { field: "account", headerName: "Account", width: 150 },
    {
      field: "p1",
      headerName: "Jan",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p2",
      headerName: "Feb",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p3",
      headerName: "Mar",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p4",
      headerName: "Apr",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p5",
      headerName: "May",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p6",
      headerName: "Jun",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p7",
      headerName: "Jul",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p8",
      headerName: "Aug",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p9",
      headerName: "Sep",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p10",
      headerName: "Oct",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p11",
      headerName: "Nov",
      width: 75,
      editable: true,
      type: "number",
    },
    {
      field: "p12",
      headerName: "Dec",
      width: 75,
      editable: true,
      type: "number",
    },
  ];

  // Async function to request data from the main process
  const requestFromMainProcess = async () => {
    try {
      const response = await window.ipcApi.sendIpcRequest("Get12periods", "2024-01", "ACT");
      const result = JSON.parse(response as string); // Assuming the API returns a stringified JSON

      // Transform result into rows
      const formattedRows = result.map((row: FinancialDataRow, index: number) => ({
        id: index + 1, // Assign a unique ID starting from 1
        combo: row.combo,
        department: row.department,
        account: row.account,
        p1: row.p1,
        p2: row.p2,
        p3: row.p3,
        p4: row.p4,
        p5: row.p5,
        p6: row.p6,
        p7: row.p7,
        p8: row.p8,
        p9: row.p9,
        p10: row.p10,
        p11: row.p11,
        p12: row.p12,
      }));

      // Update the grid rows with the formatted data
      setRows(formattedRows);
    } catch (error) {
      console.error("Error from main process:", error);
    }
  };

  const processRowChange = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    console.log("New Row:", newRow);
    console.log("Old Row:", oldRow);

    const newRowJson = JSON.stringify(newRow);
    console.log("New Row JSON:", newRowJson);

    const response = await window.ipcApi.sendIpcRequest("Update12periods", "2024-01", "ACT", newRowJson);
    console.log(response);

    return newRow;
  };

  // Fetch data when the component mounts
  useEffect(() => {
    requestFromMainProcess();
  }, []); // Empty dependency array means it runs once on mount

  return (
    <div>
      <h1>Landing Page</h1>
      <Button variant="contained" sx={{ marginTop: 1, width: "100%" }} onClick={handleSignout}>
        Sign In
      </Button>

      <DataGridPremium cellSelection density="compact" editMode="row" processRowUpdate={processRowChange} rows={rows} columns={columns} />
    </div>
  );
}
