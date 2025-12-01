import { useEffect, useState, useMemo } from "react";
import {
  DataGridPremium,
  GridColDef,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
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

interface PLRow {
  id: number;
  category: string;
  account: string;
  account_description: string;
  amount: number;
  budget: number;
  variance: number;
  variance_percent: number;
  [key: string]: any;
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
          fileName: 'pl-statement',
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

export default function PL() {
  const [rows, setRows] = useState<PLRow[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("current");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPLData = async () => {
    setLoading(true);
    try {
      if (window.ipcApi) {
        const response = await window.ipcApi.sendIpcRequest("db:get-pl-data", {
          period: selectedPeriod,
        });

        if (response.success && response.data) {
          const data = JSON.parse(response.data as string) as PLRow[];
          setRows(data);
        } else {
          console.error("Failed to fetch P&L data");
          setRows([]);
        }
      }
    } catch (error) {
      console.error("Error fetching P&L data:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, [selectedPeriod]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  });

  const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const columns: GridColDef[] = [
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      cellClassName: (params) =>
        params.row.category === 'Revenue' || params.row.category === 'Total' ? 'category-header' : '',
    },
    {
      field: 'account',
      headerName: 'Account',
      width: 120,
    },
    {
      field: 'account_description',
      headerName: 'Description',
      width: 250,
      flex: 1,
    },
    {
      field: 'amount',
      headerName: 'Actual',
      type: 'number',
      width: 130,
      valueFormatter: (value) => currencyFormatter.format(value || 0),
    },
    {
      field: 'budget',
      headerName: 'Budget',
      type: 'number',
      width: 130,
      valueFormatter: (value) => currencyFormatter.format(value || 0),
      cellClassName: 'budget-column',
    },
    {
      field: 'variance',
      headerName: 'Variance',
      type: 'number',
      width: 130,
      valueFormatter: (value) => currencyFormatter.format(value || 0),
      cellClassName: (params) =>
        params.value > 0 ? 'positive-variance' : params.value < 0 ? 'negative-variance' : '',
    },
    {
      field: 'variance_percent',
      headerName: 'Var %',
      type: 'number',
      width: 100,
      valueFormatter: (value) => percentFormatter.format((value || 0) / 100),
      cellClassName: (params) =>
        params.value > 0 ? 'positive-variance' : params.value < 0 ? 'negative-variance' : '',
    },
  ];

  const summary = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalActual = 0;
    let totalBudget = 0;

    rows.forEach(row => {
      if (row.category === 'Revenue') {
        totalRevenue += row.amount || 0;
      } else if (row.category !== 'Total') {
        totalExpenses += row.amount || 0;
      }
      totalActual += row.amount || 0;
      totalBudget += row.budget || 0;
    });

    const netIncome = totalRevenue - totalExpenses;
    const totalVariance = totalActual - totalBudget;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalVariance,
      recordCount: rows.length,
    };
  }, [rows]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Profit & Loss Statement
      </Typography>

      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            P&L Summary
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
                Total Expenses
              </Typography>
              <Typography variant="h6" color="error.main">
                {currencyFormatter.format(summary.totalExpenses)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Net Income
              </Typography>
              <Typography
                variant="h6"
                color={summary.netIncome > 0 ? "success.main" : summary.netIncome < 0 ? "error.main" : "text.primary"}
              >
                {currencyFormatter.format(summary.netIncome)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Variance
              </Typography>
              <Typography
                variant="h6"
                color={summary.totalVariance > 0 ? "success.main" : summary.totalVariance < 0 ? "error.main" : "text.primary"}
              >
                {currencyFormatter.format(summary.totalVariance)}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </StyledCard>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={selectedPeriod}
            label="Period"
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <MenuItem value="current">Current Month</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
            <MenuItem value="q1">Q1</MenuItem>
            <MenuItem value="q2">Q2</MenuItem>
            <MenuItem value="q3">Q3</MenuItem>
            <MenuItem value="q4">Q4</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          onClick={fetchPLData}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </Button>
      </Box>

      <Paper sx={{ height: 700, width: '100%' }}>
        <DataGridPremium
          rows={rows}
          columns={columns}
          slots={{
            toolbar: CustomToolbar,
          }}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 25 },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          density="compact"
          cellSelection
          sx={{
            '& .category-header': {
              fontWeight: 'bold',
              fontSize: '1.1rem',
              backgroundColor: 'action.hover',
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
