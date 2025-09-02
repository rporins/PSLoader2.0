import React, { useEffect, useState, useMemo } from "react";
import {
  DataGridPremium,
  GridColDef,
  GridColumnGroupingModel,
  GridRowsProp,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridAggregationModel,
  GridRowModel,
  gridClasses,
  GridTreeDataGroupingCell,
  getGridSingleSelectOperators,
  GridFilterOperator,
  GridFilterModel,
} from "@mui/x-data-grid-premium";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface ReportDataRow {
  id: number;
  combo: string;
  department: string;
  account: string;
  category: string;
  subcategory: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  total: number;
  variance: number;
  budget: number;
  hierarchy: string[];
}

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

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

const CustomToolbar = () => {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport 
        csvOptions={{
          fileName: 'financial-report',
          delimiter: ',',
          utf8WithBom: true,
        }}
        printOptions={{
          hideFooter: true,
          hideToolbar: true,
        }}
      />
    </GridToolbarContainer>
  );
};

const determineCategory = (account: string): string => {
  const accountLower = account.toLowerCase();
  if (accountLower.includes('revenue')) return 'Revenue';
  if (accountLower.includes('cost') || accountLower.includes('payroll') || accountLower.includes('control')) return 'Expenses';
  return 'Other';
};

const determineSubcategory = (account: string): string => {
  const accountLower = account.toLowerCase();
  if (accountLower.includes('payroll')) return 'Fixed';
  if (accountLower.includes('control')) return 'Variable';
  return 'Fixed';
};

export default function Report() {
  const [rows, setRows] = useState<ReportDataRow[]>([]);
  const [reportType, setReportType] = useState<string>("summary");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [groupingModel, setGroupingModel] = useState<GridColumnGroupingModel>([]);
  const [currentYear, setCurrentYear] = useState<number>(2025);
  const [comparisonYear, setComparisonYear] = useState<number>(2024);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch current year data (ACT scenario)
      const currentResponse = await window.ipcApi.sendIpcRequest("Get12periods", `${currentYear}-01`, "ACT");
      const currentData = JSON.parse(currentResponse as string) as FinancialDataRow[];

      // Fetch comparison year data (also ACT scenario for previous year)
      const comparisonResponse = await window.ipcApi.sendIpcRequest("Get12periods", `${comparisonYear}-01`, "ACT");
      const comparisonData = JSON.parse(comparisonResponse as string) as FinancialDataRow[];

      // Create a map for comparison data for easy lookup
      const comparisonDataMap = new Map();
      comparisonData.forEach((row: FinancialDataRow) => {
        comparisonDataMap.set(row.combo, row);
      });

      // Transform data into report format
      const reportRows: ReportDataRow[] = currentData.map((currentRow: FinancialDataRow, index: number) => {
        const comparisonRow = comparisonDataMap.get(currentRow.combo) || {
          p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0,
          p7: 0, p8: 0, p9: 0, p10: 0, p11: 0, p12: 0
        };

        const monthlyValues = [
          currentRow.p1, currentRow.p2, currentRow.p3, currentRow.p4,
          currentRow.p5, currentRow.p6, currentRow.p7, currentRow.p8,
          currentRow.p9, currentRow.p10, currentRow.p11, currentRow.p12
        ];

        const comparisonTotal = comparisonRow.p1 + comparisonRow.p2 + comparisonRow.p3 + 
                               comparisonRow.p4 + comparisonRow.p5 + comparisonRow.p6 + 
                               comparisonRow.p7 + comparisonRow.p8 + comparisonRow.p9 + 
                               comparisonRow.p10 + comparisonRow.p11 + comparisonRow.p12;

        const currentTotal = monthlyValues.reduce((sum, val) => sum + val, 0);
        const variance = currentTotal - comparisonTotal;

        const category = determineCategory(currentRow.account);
        const subcategory = determineSubcategory(currentRow.account);

        return {
          id: index + 1,
          combo: currentRow.combo,
          department: currentRow.department,
          account: currentRow.account,
          category,
          subcategory,
          jan: monthlyValues[0],
          feb: monthlyValues[1],
          mar: monthlyValues[2],
          apr: monthlyValues[3],
          may: monthlyValues[4],
          jun: monthlyValues[5],
          jul: monthlyValues[6],
          aug: monthlyValues[7],
          sep: monthlyValues[8],
          oct: monthlyValues[9],
          nov: monthlyValues[10],
          dec: monthlyValues[11],
          total: currentTotal,
          variance,
          budget: comparisonTotal, // Using comparison year as "budget"
          hierarchy: [currentRow.department, category, subcategory],
        };
      });

      setRows(reportRows);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [currentYear, comparisonYear]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'department',
      headerName: 'Department',
      width: 140,
      pinned: 'left',
    },
    {
      field: 'account',
      headerName: 'Account',
      width: 120,
      pinned: 'left',
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          color={params.value === 'Revenue' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'subcategory',
      headerName: 'Subcategory',
      width: 110,
    },
    {
      field: 'jan',
      headerName: 'Jan',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'feb',
      headerName: 'Feb',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'mar',
      headerName: 'Mar',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'apr',
      headerName: 'Apr',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'may',
      headerName: 'May',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'jun',
      headerName: 'Jun',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'jul',
      headerName: 'Jul',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'aug',
      headerName: 'Aug',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'sep',
      headerName: 'Sep',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'oct',
      headerName: 'Oct',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'nov',
      headerName: 'Nov',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'dec',
      headerName: 'Dec',
      type: 'number',
      width: 100,
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'total',
      headerName: 'Total',
      type: 'number',
      width: 120,
      pinned: 'right',
      valueFormatter: (value) => currencyFormatter.format(value),
      cellClassName: 'total-column',
    },
    {
      field: 'budget',
      headerName: `${comparisonYear} Total`,
      type: 'number',
      width: 120,
      pinned: 'right',
      valueFormatter: (value) => currencyFormatter.format(value),
    },
    {
      field: 'variance',
      headerName: `Variance vs ${comparisonYear}`,
      type: 'number',
      width: 140,
      pinned: 'right',
      valueFormatter: (value) => currencyFormatter.format(value),
      cellClassName: (params) => 
        params.value > 0 ? 'positive-variance' : 'negative-variance',
    },
  ], [comparisonYear]);

  const columnGroupingModel: GridColumnGroupingModel = useMemo(() => [
    {
      groupId: 'Q1',
      children: [{ field: 'jan' }, { field: 'feb' }, { field: 'mar' }],
      headerName: `Q1 ${currentYear}`,
    },
    {
      groupId: 'Q2',
      children: [{ field: 'apr' }, { field: 'may' }, { field: 'jun' }],
      headerName: `Q2 ${currentYear}`,
    },
    {
      groupId: 'Q3',
      children: [{ field: 'jul' }, { field: 'aug' }, { field: 'sep' }],
      headerName: `Q3 ${currentYear}`,
    },
    {
      groupId: 'Q4',
      children: [{ field: 'oct' }, { field: 'nov' }, { field: 'dec' }],
      headerName: `Q4 ${currentYear}`,
    },
  ], [currentYear]);

  const aggregationModel: GridAggregationModel = useMemo(() => ({
    jan: 'sum',
    feb: 'sum',
    mar: 'sum',
    apr: 'sum',
    may: 'sum',
    jun: 'sum',
    jul: 'sum',
    aug: 'sum',
    sep: 'sum',
    oct: 'sum',
    nov: 'sum',
    dec: 'sum',
    total: 'sum',
    budget: 'sum',
    variance: 'sum',
  }), []);

  const filteredRows = useMemo(() => {
    if (selectedDepartment === "all") return rows;
    return rows.filter(row => row.department === selectedDepartment);
  }, [rows, selectedDepartment]);

  const summary = useMemo(() => {
    const totalRevenue = filteredRows.reduce((sum, row) => sum + row.total, 0);
    const totalBudget = filteredRows.reduce((sum, row) => sum + row.budget, 0);
    const totalVariance = totalRevenue - totalBudget;
    
    return {
      totalRevenue,
      totalBudget,
      totalVariance,
      recordCount: filteredRows.length,
    };
  }, [filteredRows]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Financial Report Dashboard
      </Typography>

      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report Summary
          </Typography>
          <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Revenue
              </Typography>
              <Typography variant="h6" color="success.main">
                {currencyFormatter.format(summary.totalRevenue)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {comparisonYear} Total
              </Typography>
              <Typography variant="h6">
                {currencyFormatter.format(summary.totalBudget)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Variance vs {comparisonYear}
              </Typography>
              <Typography 
                variant="h6" 
                color={summary.totalVariance > 0 ? "success.main" : "error.main"}
              >
                {currencyFormatter.format(summary.totalVariance)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Records
              </Typography>
              <Typography variant="h6">
                {summary.recordCount}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </StyledCard>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Report Type</InputLabel>
          <Select
            value={reportType}
            label="Report Type"
            onChange={(e) => setReportType(e.target.value)}
          >
            <MenuItem value="summary">Summary</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
            <MenuItem value="variance">Variance Analysis</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select
            value={selectedDepartment}
            label="Department"
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            <MenuItem value="all">All Departments</MenuItem>
            {Array.from(new Set(rows.map(row => row.department))).map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Current Year</InputLabel>
          <Select
            value={currentYear}
            label="Current Year"
            onChange={(e) => setCurrentYear(e.target.value as number)}
          >
            <MenuItem value={2023}>2023</MenuItem>
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2026}>2026</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Comparison Year</InputLabel>
          <Select
            value={comparisonYear}
            label="Comparison Year"
            onChange={(e) => setComparisonYear(e.target.value as number)}
          >
            <MenuItem value={2023}>2023</MenuItem>
            <MenuItem value={2024}>2024</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2026}>2026</MenuItem>
          </Select>
        </FormControl>

        <Button 
          variant="outlined" 
          onClick={fetchReportData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Box>

      <Paper sx={{ height: 700, width: '100%' }}>
        <DataGridPremium
          rows={filteredRows}
          columns={columns}
          columnGroupingModel={columnGroupingModel}
          aggregationModel={aggregationModel}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            aggregation: {
              model: aggregationModel,
            },
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          density="compact"
          cellSelection
          columnHeaderHeight={80}
          sx={{
            '& .total-column': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold',
            },
            '& .positive-variance': {
              color: 'success.main',
              fontWeight: 'bold',
            },
            '& .negative-variance': {
              color: 'error.main',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-aggregationColumnHeader': {
              backgroundColor: '#e3f2fd',
            },
            '& .MuiDataGrid-aggregationColumnHeader--aggregated': {
              backgroundColor: '#bbdefb',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
