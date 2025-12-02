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
  Button,
  Stack,
  Paper,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSettingsStore } from "../../store/settings";

interface StagingDataRow {
  id: number;
  dep_acc_combo_id: string;
  month: number;
  year: number;
  period_combo: string;
  scenario: string;
  amount: number;
  count: number | null;
  currency: string;
  ou: string;
  department: string;
  account: string;
  version: string;
  source_account: string;
  source_department: string;
  source_description: string;
  mapping_status: string;
  import_batch_id: string;
  last_modified: string;
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
          fileName: 'staging-data-review',
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

export default function StagingDataReview() {
  const [rows, setRows] = useState<StagingDataRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const selectedHotelOu = useSettingsStore((s) => s.selectedHotelOu);

  const fetchStagingData = async () => {
    setLoading(true);
    try {
      const response = await window.ipcApi.sendIpcRequest("db:get-staging-data", {
        ou: selectedHotelOu,
      });

      console.log('[StagingDataReview] Response:', response);

      if (response.success && response.data) {
        const data = JSON.parse(response.data as string);
        // Add unique ID for DataGrid
        const dataWithIds = data.map((row: any, index: number) => ({
          ...row,
          id: index,
        }));
        console.log('[StagingDataReview] Parsed data:', dataWithIds);
        console.log('[StagingDataReview] Number of rows:', dataWithIds.length);
        setRows(dataWithIds);
      } else {
        console.error("Failed to fetch staging data");
        setRows([]);
      }
    } catch (error) {
      console.error("Error fetching staging data:", error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts or hotel changes
  useEffect(() => {
    if (selectedHotelOu) {
      fetchStagingData();
    }
  }, [selectedHotelOu]);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const columns: GridColDef[] = useMemo(() => {
    const cols: GridColDef[] = [
      {
        field: 'period_combo',
        headerName: 'Period',
        width: 100,
      },
      {
        field: 'scenario',
        headerName: 'Scenario',
        width: 100,
      },
      {
        field: 'source_account',
        headerName: 'Source Account',
        width: 150,
      },
      {
        field: 'source_department',
        headerName: 'Source Dept',
        width: 150,
      },
      {
        field: 'source_description',
        headerName: 'Description',
        width: 200,
      },
      {
        field: 'account',
        headerName: 'Mapped Account',
        width: 150,
      },
      {
        field: 'department',
        headerName: 'Mapped Dept',
        width: 150,
      },
      {
        field: 'dep_acc_combo_id',
        headerName: 'Combo ID',
        width: 120,
      },
      {
        field: 'amount',
        headerName: 'Amount',
        type: 'number',
        width: 140,
        valueFormatter: (value) => currencyFormatter.format(value || 0),
      },
      {
        field: 'count',
        headerName: 'Count',
        type: 'number',
        width: 100,
        valueFormatter: (value) => value != null ? value.toString() : '',
      },
      {
        field: 'mapping_status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => {
          const status = params.value as string;
          let color: "success" | "warning" | "error" | "default" = "default";

          if (status?.toLowerCase().includes("mapped")) {
            color = "success";
          } else if (status?.toLowerCase().includes("unmapped")) {
            color = "warning";
          } else if (status?.toLowerCase().includes("error")) {
            color = "error";
          }

          return <Chip label={status || 'N/A'} color={color} size="small" />;
        },
      },
      {
        field: 'currency',
        headerName: 'Currency',
        width: 100,
      },
      {
        field: 'month',
        headerName: 'Month',
        type: 'number',
        width: 80,
      },
      {
        field: 'year',
        headerName: 'Year',
        type: 'number',
        width: 80,
      },
      {
        field: 'version',
        headerName: 'Version',
        width: 100,
      },
      {
        field: 'import_batch_id',
        headerName: 'Batch ID',
        width: 200,
      },
      {
        field: 'last_modified',
        headerName: 'Last Modified',
        width: 180,
        valueFormatter: (value) => {
          try {
            return dateFormatter.format(new Date(value));
          } catch {
            return value;
          }
        },
      },
    ];

    return cols;
  }, []);

  const summary = useMemo(() => {
    let totalAmount = 0;
    const uniquePeriods = new Set<string>();
    const uniqueBatches = new Set<string>();

    rows.forEach(row => {
      totalAmount += row.amount || 0;
      if (row.period_combo) uniquePeriods.add(row.period_combo);
      if (row.import_batch_id) uniqueBatches.add(row.import_batch_id);
    });

    return {
      totalAmount,
      recordCount: rows.length,
      periodCount: uniquePeriods.size,
      batchCount: uniqueBatches.size,
    };
  }, [rows]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Staging Data Review
      </Typography>

      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Import Summary
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Records
              </Typography>
              <Typography variant="h6" color="primary.main">
                {summary.recordCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Amount
              </Typography>
              <Typography variant="h6">
                {currencyFormatter.format(summary.totalAmount)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Periods
              </Typography>
              <Typography variant="h6">
                {summary.periodCount}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Import Batches
              </Typography>
              <Typography variant="h6">
                {summary.batchCount}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </StyledCard>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant="outlined"
          onClick={fetchStagingData}
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
            columns: {
              columnVisibilityModel: {
                dep_acc_combo_id: false,
                month: false,
                year: false,
                version: false,
                import_batch_id: false,
                currency: false,
              },
            },
          }}
          pageSizeOptions={[25, 50, 100]}
          density="compact"
          cellSelection
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
          }}
        />
      </Paper>
    </Box>
  );
}
