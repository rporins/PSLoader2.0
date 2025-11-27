import { useEffect, useState, useMemo } from "react";
import {
  DataGridPremium,
  GridColDef,
  GridColumnGroupingModel,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridAggregationModel,
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
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface FinancialReportRow {
  id: number;
  combo: string;
  department: string;
  account: string;
  account_level_4: string;
  account_level_6: string;
  account_level_9: string;
  department_level_4: string;
  department_level_9: string;
  act_p1: number;
  act_p2: number;
  act_p3: number;
  act_p4: number;
  act_p5: number;
  act_p6: number;
  act_p7: number;
  act_p8: number;
  act_p9: number;
  act_p10: number;
  act_p11: number;
  act_p12: number;
  bud_p1: number;
  bud_p2: number;
  bud_p3: number;
  bud_p4: number;
  bud_p5: number;
  bud_p6: number;
  bud_p7: number;
  bud_p8: number;
  bud_p9: number;
  bud_p10: number;
  bud_p11: number;
  bud_p12: number;
  [key: string]: any; // Allow dynamic indexing
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

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Report() {
  const [rows, setRows] = useState<FinancialReportRow[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startingMonth, setStartingMonth] = useState<number>(1); // 1-based month
  const [loading, setLoading] = useState<boolean>(false);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startPeriod = `${selectedYear}-${String(startingMonth).padStart(2, '0')}`;

      const response = await window.ipcApi.sendIpcRequest("db:get-financial-report-data", {
        startPeriod,
      });

      if (response.success && response.data) {
        const data = JSON.parse(response.data as string) as FinancialReportRow[];
        setRows(data);
      } else {
        console.error("Failed to fetch report data");
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedYear, startingMonth]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  // Generate month labels based on starting month
  const monthLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (startingMonth - 1 + i) % 12;
      labels.push(MONTH_NAMES[monthIndex]);
    }
    return labels;
  }, [startingMonth]);

  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: 'department',
        headerName: 'Department',
        width: 140,
      },
      {
        field: 'account',
        headerName: 'Account',
        width: 140,
      },
      {
        field: 'department_level_4',
        headerName: 'Dept L4',
        width: 120,
      },
      {
        field: 'department_level_9',
        headerName: 'Dept L9',
        width: 120,
      },
      {
        field: 'account_level_4',
        headerName: 'Acct L4',
        width: 120,
      },
      {
        field: 'account_level_6',
        headerName: 'Acct L6',
        width: 120,
      },
      {
        field: 'account_level_9',
        headerName: 'Acct L9',
        width: 120,
      },
    ];

    // Add monthly columns (Actuals vs Budget for each month)
    for (let i = 1; i <= 12; i++) {
      const monthLabel = monthLabels[i - 1];

      // Actuals column
      cols.push({
        field: `act_p${i}`,
        headerName: `${monthLabel} Act`,
        type: 'number',
        width: 110,
        valueFormatter: (value) => currencyFormatter.format(value || 0),
      });

      // Budget column
      cols.push({
        field: `bud_p${i}`,
        headerName: `${monthLabel} Bud`,
        type: 'number',
        width: 110,
        valueFormatter: (value) => currencyFormatter.format(value || 0),
        cellClassName: 'budget-column',
      });

      // Variance column
      cols.push({
        field: `var_p${i}`,
        headerName: `${monthLabel} Var`,
        type: 'number',
        width: 110,
        valueGetter: (_value, row) => (row[`act_p${i}`] || 0) - (row[`bud_p${i}`] || 0),
        valueFormatter: (value) => currencyFormatter.format(value || 0),
        cellClassName: (params) =>
          params.value > 0 ? 'positive-variance' : params.value < 0 ? 'negative-variance' : '',
      });
    }

    // Add total columns
    cols.push({
      field: 'total_actuals',
      headerName: 'Total Actuals',
      type: 'number',
      width: 130,
      valueGetter: (_value, row) => {
        let total = 0;
        for (let i = 1; i <= 12; i++) {
          total += row[`act_p${i}`] || 0;
        }
        return total;
      },
      valueFormatter: (value) => currencyFormatter.format(value || 0),
      cellClassName: 'total-column',
    });

    cols.push({
      field: 'total_budget',
      headerName: 'Total Budget',
      type: 'number',
      width: 130,
      valueGetter: (_value, row) => {
        let total = 0;
        for (let i = 1; i <= 12; i++) {
          total += row[`bud_p${i}`] || 0;
        }
        return total;
      },
      valueFormatter: (value) => currencyFormatter.format(value || 0),
      cellClassName: 'total-column',
    });

    cols.push({
      field: 'total_variance',
      headerName: 'Total Variance',
      type: 'number',
      width: 140,
      valueGetter: (_value, row) => {
        let actTotal = 0;
        let budTotal = 0;
        for (let i = 1; i <= 12; i++) {
          actTotal += row[`act_p${i}`] || 0;
          budTotal += row[`bud_p${i}`] || 0;
        }
        return actTotal - budTotal;
      },
      valueFormatter: (value) => currencyFormatter.format(value || 0),
      cellClassName: (params) =>
        params.value > 0 ? 'positive-variance' : params.value < 0 ? 'negative-variance' : '',
    });

    return cols;
  }, [monthLabels]);

  const columnGroupingModel: GridColumnGroupingModel = useMemo(() => {
    const groups: GridColumnGroupingModel = [];

    // Group months by quarters
    for (let q = 0; q < 4; q++) {
      const monthStart = q * 3 + 1;
      const children = [];

      for (let m = 0; m < 3; m++) {
        const monthNum = monthStart + m;
        children.push(
          { field: `act_p${monthNum}` },
          { field: `bud_p${monthNum}` },
          { field: `var_p${monthNum}` }
        );
      }

      groups.push({
        groupId: `Q${q + 1}`,
        children,
        headerName: `Q${q + 1}`,
      });
    }

    return groups;
  }, []);

  const aggregationModel: GridAggregationModel = useMemo(() => {
    const model: GridAggregationModel = {};

    for (let i = 1; i <= 12; i++) {
      model[`act_p${i}`] = 'sum';
      model[`bud_p${i}`] = 'sum';
      model[`var_p${i}`] = 'sum';
    }

    model['total_actuals'] = 'sum';
    model['total_budget'] = 'sum';
    model['total_variance'] = 'sum';

    return model;
  }, []);

  const filteredRows = useMemo(() => {
    if (selectedDepartment === "all") return rows;
    return rows.filter(row => row.department === selectedDepartment);
  }, [rows, selectedDepartment]);

  const summary = useMemo(() => {
    let totalActuals = 0;
    let totalBudget = 0;

    filteredRows.forEach(row => {
      for (let i = 1; i <= 12; i++) {
        totalActuals += row[`act_p${i}`] || 0;
        totalBudget += row[`bud_p${i}`] || 0;
      }
    });

    const totalVariance = totalActuals - totalBudget;

    return {
      totalActuals,
      totalBudget,
      totalVariance,
      recordCount: filteredRows.length,
    };
  }, [filteredRows]);

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

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
                Total Actuals
              </Typography>
              <Typography variant="h6" color="primary.main">
                {currencyFormatter.format(summary.totalActuals)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Budget
              </Typography>
              <Typography variant="h6">
                {currencyFormatter.format(summary.totalBudget)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Variance
              </Typography>
              <Typography
                variant="h6"
                color={summary.totalVariance > 0 ? "success.main" : summary.totalVariance < 0 ? "error.main" : "text.primary"}
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
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={selectedYear}
            label="Year"
            onChange={(e) => setSelectedYear(e.target.value as number)}
          >
            {yearOptions.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Starting Month</InputLabel>
          <Select
            value={startingMonth}
            label="Starting Month"
            onChange={(e) => setStartingMonth(e.target.value as number)}
          >
            {MONTH_NAMES.map((month, index) => (
              <MenuItem key={index + 1} value={index + 1}>
                {month}
              </MenuItem>
            ))}
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
              fontWeight: 'bold',
              borderLeft: '2px solid',
              borderColor: 'divider',
            },
            '& .budget-column': {
              fontStyle: 'italic',
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
          }}
        />
      </Paper>
    </Box>
  );
}
