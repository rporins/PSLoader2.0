// Import specific React and ReactDOM functions
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { styled } from "@mui/material/styles";
// Import specific components from react-router-dom
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
  GridColumnGroupingModel,
} from "@mui/x-data-grid-premium";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from "@mui/material";

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

interface TwoYearDataRow {
  id: number;
  combo: string;
  department: string;
  account: string;
  // Year 1 data (e.g., 2025)
  y1_p1: number;
  y1_p2: number;
  y1_p3: number;
  y1_p4: number;
  y1_p5: number;
  y1_p6: number;
  y1_p7: number;
  y1_p8: number;
  y1_p9: number;
  y1_p10: number;
  y1_p11: number;
  y1_p12: number;
  // Separator
  separator: string;
  // Year 2 data (e.g., 2024)
  y2_p1: number;
  y2_p2: number;
  y2_p3: number;
  y2_p4: number;
  y2_p5: number;
  y2_p6: number;
  y2_p7: number;
  y2_p8: number;
  y2_p9: number;
  y2_p10: number;
  y2_p11: number;
  y2_p12: number;
}

export default function DataTable() {
  const [year1, setYear1] = useState<number>(2025); // Default to 2025
  const [year2, setYear2] = useState<number>(2024); // Default to 2024
  const [rows, setRows] = useState<TwoYearDataRow[]>([]); // Initialize rows state with new interface

  const handleGenerateData = async () => {
    try {
      const response = await window.ipcApi.sendIpcRequest("GenerateDummyData");
      console.log("Data generation response:", response);
      // Refresh the data after generating dummy data
      requestFromMainProcess();
    } catch (error) {
      console.error("Error generating dummy data:", error);
    }
  };

  // Month names for headers
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Define columns for the grid with two years
  const columns: GridColDef[] = [
    { field: "department", headerName: "Department", width: 150, pinned: 'left' },
    { field: "account", headerName: "Account", width: 150, pinned: 'left' },
    // Year 1 columns (e.g., 2025)
    ...monthNames.map((month, index) => ({
      field: `y1_p${index + 1}`,
      headerName: month,
      width: 80,
      editable: true,
      type: "number" as const,
    })),
    // Separator column between years
    { 
      field: "separator", 
      headerName: "", 
      width: 30, 
      sortable: false, 
      filterable: false,
      disableColumnMenu: true,
      renderCell: () => null,
      headerClassName: 'year-separator'
    },
    // Year 2 columns (e.g., 2024)
    ...monthNames.map((month, index) => ({
      field: `y2_p${index + 1}`,
      headerName: month,
      width: 80,
      editable: true,
      type: "number" as const,
    })),
  ];

  // Column grouping model to show year headers
  const columnGroupingModel: GridColumnGroupingModel = [
    {
      groupId: year1.toString(),
      children: monthNames.map((_, index) => ({ field: `y1_p${index + 1}` })),
    },
    {
      groupId: year2.toString(),
      children: monthNames.map((_, index) => ({ field: `y2_p${index + 1}` })),
    },
  ];

  // Async function to request data from the main process
  const requestFromMainProcess = async () => {
    try {
      // Fetch data for both years
      const [response1, response2] = await Promise.all([
        window.ipcApi.sendIpcRequest("Get12periods", `${year1}-01`, "ACT"),
        window.ipcApi.sendIpcRequest("Get12periods", `${year2}-01`, "ACT")
      ]);

      const result1 = JSON.parse(response1 as string);
      const result2 = JSON.parse(response2 as string);

      // Create a map for year2 data for easy lookup
      const year2DataMap = new Map();
      result2.forEach((row: FinancialDataRow) => {
        year2DataMap.set(row.combo, row);
      });

      // Transform result into rows with both years
      const formattedRows: TwoYearDataRow[] = result1.map((row: FinancialDataRow, index: number) => {
        const year2Row = year2DataMap.get(row.combo) || {
          p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
          p7: 0, p8: 0, p9: 0, p10: 0, p11: 0, p12: 0
        };

        return {
          id: index + 1,
          combo: row.combo,
          department: row.department,
          account: row.account,
          // Year 1 data
          y1_p1: row.p1,
          y1_p2: row.p2,
          y1_p3: row.p3,
          y1_p4: row.p4,
          y1_p5: row.p5,
          y1_p6: row.p6,
          y1_p7: row.p7,
          y1_p8: row.p8,
          y1_p9: row.p9,
          y1_p10: row.p10,
          y1_p11: row.p11,
          y1_p12: row.p12,
          // Separator (empty)
          separator: "",
          // Year 2 data
          y2_p1: year2Row.p1,
          y2_p2: year2Row.p2,
          y2_p3: year2Row.p3,
          y2_p4: year2Row.p4,
          y2_p5: year2Row.p5,
          y2_p6: year2Row.p6,
          y2_p7: year2Row.p7,
          y2_p8: year2Row.p8,
          y2_p9: year2Row.p9,
          y2_p10: year2Row.p10,
          y2_p11: year2Row.p11,
          y2_p12: year2Row.p12,
        };
      });

      // Update the grid rows with the formatted data
      setRows(formattedRows);
    } catch (error) {
      console.error("Error from main process:", error);
    }
  };

  const processRowChange = async (newRow: GridRowModel, oldRow: GridRowModel) => {
    console.log("New Row:", newRow);
    console.log("Old Row:", oldRow);

    try {
      // Determine which year was updated by checking which fields changed
      const year1Changed = monthNames.some((_, index) => 
        newRow[`y1_p${index + 1}`] !== oldRow[`y1_p${index + 1}`]
      );
      const year2Changed = monthNames.some((_, index) => 
        newRow[`y2_p${index + 1}`] !== oldRow[`y2_p${index + 1}`]
      );

      // Update year 1 if changed
      if (year1Changed) {
        const year1Data = {
          combo: newRow.combo,
          department: newRow.department,
          account: newRow.account,
          ...monthNames.reduce((acc, _, index) => {
            acc[`p${index + 1}`] = newRow[`y1_p${index + 1}`];
            return acc;
          }, {} as Record<string, any>)
        };

        const year1Json = JSON.stringify(year1Data);
        const response1 = await window.ipcApi.sendIpcRequest("Update12periods", `${year1}-01`, "ACT", year1Json);
        console.log(`Year ${year1} update response:`, response1);
      }

      // Update year 2 if changed
      if (year2Changed) {
        const year2Data = {
          combo: newRow.combo,
          department: newRow.department,
          account: newRow.account,
          ...monthNames.reduce((acc, _, index) => {
            acc[`p${index + 1}`] = newRow[`y2_p${index + 1}`];
            return acc;
          }, {} as Record<string, any>)
        };

        const year2Json = JSON.stringify(year2Data);
        const response2 = await window.ipcApi.sendIpcRequest("Update12periods", `${year2}-01`, "ACT", year2Json);
        console.log(`Year ${year2} update response:`, response2);
      }

      return newRow;
    } catch (error) {
      console.error("Error updating row:", error);
      return oldRow; // Revert on error
    }
  };

  // Fetch data when the component mounts or years change
  useEffect(() => {
    requestFromMainProcess();
  }, [year1, year2]); // Re-fetch when either year changes

  const availableYears = [2023, 2024, 2025, 2026]; // Available years

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Financial Data Table
        </Typography>
        
        {/* Year Selection Controls */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year 1</InputLabel>
            <Select
              value={year1}
              label="Year 1"
              onChange={(e) => setYear1(e.target.value as number)}
            >
              {availableYears
                .filter(year => year !== year2)
                .map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Year 2</InputLabel>
            <Select
              value={year2}
              label="Year 2"
              onChange={(e) => setYear2(e.target.value as number)}
            >
              {availableYears
                .filter(year => year !== year1)
                .map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Button variant="contained" color="primary" onClick={handleGenerateData}>
            Generate Random Data
          </Button>
        </Box>
      </Box>

      <DataGridPremium 
        cellSelection 
        density="compact" 
        editMode="row" 
        processRowUpdate={processRowChange} 
        rows={rows} 
        columns={columns}
        columnGroupingModel={columnGroupingModel}
        sx={{ 
          height: 600, 
          width: '100%',
          '& .year-separator': {
            borderLeft: '2px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
          },
          '& .MuiDataGrid-cell[data-field="separator"]': {
            borderLeft: '2px solid #e0e0e0',
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            pointerEvents: 'none',
            '&:focus, &:focus-within': {
              outline: 'none',
            }
          }
        }}
      />
    </div>
  );
}
