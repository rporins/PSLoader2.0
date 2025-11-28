import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import { DataGridPremium, GridColDef, GridToolbar } from "@mui/x-data-grid-premium";
import { styled } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LinkIcon from "@mui/icons-material/Link";

// IPC API types
interface IpcApi {
  sendIpcRequest: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    ipcApi?: IpcApi;
  }
}

// Interfaces for mapping table data types
interface AccountMap {
  base_account: string;
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

interface DepartmentMap {
  base_department: string;
  level_0: string;
  level_1: string;
  level_2: string;
  level_3: string;
  level_4: string;
  level_5: string;
  level_6: string;
  level_7: string;
  level_8: string;
  level_9: string;
  level_10: string;
  level_11: string;
  level_12: string;
  level_13: string;
  level_14: string;
  level_15: string;
  level_16: string;
  level_17: string;
  level_18: string;
  level_19: string;
  level_20: string;
  level_21: string;
  level_22: string;
  level_23: string;
  level_24: string;
  level_25: string;
  level_26: string;
  level_27: string;
  level_28: string;
  level_29: string;
  level_30: string;
  description: string;
}

interface AccountDepartmentCombo {
  id: number;
  account: string;
  department: string;
  description: string;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}));

const TabPanel = (props: { children?: React.ReactNode; value: number; index: number }) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`coa-tabpanel-${index}`}
      aria-labelledby={`coa-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export default function COA() {
  const [tabValue, setTabValue] = useState(0);
  const [accountMaps, setAccountMaps] = useState<AccountMap[]>([]);
  const [departmentMaps, setDepartmentMaps] = useState<DepartmentMap[]>([]);
  const [combos, setCombos] = useState<AccountDepartmentCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get account hierarchy
  const getAccountHierarchy = (account: AccountMap): string => {
    const levels = [];
    for (let i = 0; i <= 30; i++) {
      const level = account[`level_${i}` as keyof AccountMap] as string;
      if (level && level.trim()) {
        levels.push(level.trim());
      }
    }
    return levels.join(' > ') || '-';
  };

  // Helper function to get department hierarchy
  const getDepartmentHierarchy = (department: DepartmentMap): string => {
    const levels = [];
    for (let i = 0; i <= 30; i++) {
      const level = department[`level_${i}` as keyof DepartmentMap] as string;
      if (level && level.trim()) {
        levels.push(level.trim());
      }
    }
    return levels.join(' > ') || '-';
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (window.ipcApi) {
        const [accountMapsResult, departmentMapsResult, combosResult] = await Promise.all([
          window.ipcApi.sendIpcRequest("db:get-account-maps"),
          window.ipcApi.sendIpcRequest("db:get-department-maps"),
          window.ipcApi.sendIpcRequest("db:get-combos"),
        ]);

        setAccountMaps(accountMapsResult.data || []);
        setDepartmentMaps(departmentMapsResult.data || []);
        setCombos(combosResult.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading COA data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Define columns for Account Maps
  const accountColumns: GridColDef[] = [
    {
      field: 'base_account',
      headerName: 'Base Account',
      width: 150,
      pinned: 'left',
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      flex: 1,
    },
    {
      field: 'hierarchy',
      headerName: 'Hierarchy',
      width: 400,
      flex: 2,
      valueGetter: (value, row) => getAccountHierarchy(row),
    },
  ];

  // Add individual level columns for accounts
  for (let i = 0; i <= 30; i++) {
    accountColumns.push({
      field: `level_${i}`,
      headerName: `Level ${i}`,
      width: 120,
      hide: true, // Hidden by default, can be shown via column selector
    });
  }

  // Define columns for Department Maps
  const departmentColumns: GridColDef[] = [
    {
      field: 'base_department',
      headerName: 'Base Department',
      width: 180,
      pinned: 'left',
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 200,
      flex: 1,
    },
    {
      field: 'hierarchy',
      headerName: 'Hierarchy',
      width: 400,
      flex: 2,
      valueGetter: (value, row) => getDepartmentHierarchy(row),
    },
  ];

  // Add individual level columns for departments
  for (let i = 0; i <= 30; i++) {
    departmentColumns.push({
      field: `level_${i}`,
      headerName: `Level ${i}`,
      width: 120,
      hide: true, // Hidden by default
    });
  }

  // Define columns for Combos
  const comboColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'account',
      headerName: 'Account',
      width: 150,
      flex: 1,
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 180,
      flex: 1,
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      flex: 2,
    },
  ];

  const renderAccountsTable = () => (
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6">
              Account Maps ({accountMaps.length})
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGridPremium
            rows={accountMaps}
            columns={accountColumns}
            getRowId={(row) => row.base_account}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              columns: {
                columnVisibilityModel: {
                  // Hide all level columns by default
                  ...Object.fromEntries(
                    Array.from({ length: 31 }, (_, i) => [`level_${i}`, false])
                  ),
                },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            density="compact"
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                fontFamily: 'monospace',
              },
            }}
          />
        </Box>
      </CardContent>
    </StyledCard>
  );

  const renderDepartmentsTable = () => (
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <ApartmentIcon color="primary" />
            <Typography variant="h6">
              Department Maps ({departmentMaps.length})
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGridPremium
            rows={departmentMaps}
            columns={departmentColumns}
            getRowId={(row) => row.base_department}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              columns: {
                columnVisibilityModel: {
                  // Hide all level columns by default
                  ...Object.fromEntries(
                    Array.from({ length: 31 }, (_, i) => [`level_${i}`, false])
                  ),
                },
              },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            density="compact"
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                fontFamily: 'monospace',
              },
            }}
          />
        </Box>
      </CardContent>
    </StyledCard>
  );

  const renderCombosTable = () => (
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LinkIcon color="primary" />
            <Typography variant="h6">
              Valid Account-Department Combinations ({combos.length})
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>

        <Box sx={{ height: 600, width: '100%' }}>
          <DataGridPremium
            rows={combos}
            columns={comboColumns}
            getRowId={(row) => row.id}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            density="compact"
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                fontFamily: 'monospace',
              },
            }}
          />
        </Box>
      </CardContent>
    </StyledCard>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Chart of Accounts (COA)
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          View account maps, department maps, and valid account-department combinations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="COA tabs">
          <Tab label={`Account Maps (${accountMaps.length})`} />
          <Tab label={`Department Maps (${departmentMaps.length})`} />
          <Tab label={`Valid Combinations (${combos.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderAccountsTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderDepartmentsTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderCombosTable()}
      </TabPanel>
    </Box>
  );
}
