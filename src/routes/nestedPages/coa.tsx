import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ApartmentIcon from "@mui/icons-material/Apartment";
import LinkIcon from "@mui/icons-material/Link";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

// IPC API types
interface IpcApi {
  sendIpcRequest: (channel: string, ...args: any[]) => Promise<any>;
}

declare global {
  interface Window {
    ipcApi?: IpcApi;
  }
}

// Interfaces for data types
interface Account {
  account_id: string;
  a_easy_name: string;
  a_is_stat: number;
  a_is_locked: number;
  a_level_1: string;
  a_level_2: string;
  a_level_3: string;
  a_level_4: string;
  a_level_5: string;
  a_level_6: string;
  a_level_7: string;
  a_level_8: string;
  a_level_9: string;
  a_level_10: string;
  a_level_11: string;
  a_level_12: string;
  a_level_13: string;
  a_level_14: string;
  a_level_15: string;
  a_level_16: string;
  a_level_17: string;
  a_level_18: string;
  a_level_19: string;
  a_level_20: string;
  a_level_21: string;
  a_level_22: string;
  a_level_23: string;
  a_level_24: string;
  a_level_25: string;
  a_level_26: string;
  a_level_27: string;
  a_level_28: string;
  a_level_29: string;
  a_level_30: string;
}

interface Department {
  department_id: string;
  d_easy_name: string;
  d_is_locked: number;
  d_level_1: string;
  d_level_2: string;
  d_level_3: string;
  d_level_4: string;
  d_level_5: string;
  d_level_6: string;
  d_level_7: string;
  d_level_8: string;
  d_level_9: string;
  d_level_10: string;
  d_level_11: string;
  d_level_12: string;
  d_level_13: string;
  d_level_14: string;
  d_level_15: string;
  d_level_16: string;
  d_level_17: string;
  d_level_18: string;
  d_level_19: string;
  d_level_20: string;
  d_level_21: string;
  d_level_22: string;
  d_level_23: string;
  d_level_24: string;
  d_level_25: string;
  d_level_26: string;
  d_level_27: string;
  d_level_28: string;
  d_level_29: string;
  d_level_30: string;
}

interface ComboMetadata {
  dep_acc_combo_id: string;
  department_id: string;
  account_id: string;
  is_locked: number;
  department_name: string;
  account_name: string;
  dept_level_1: string;
  dept_level_2: string;
  dept_level_3: string;
  dept_level_4: string;
  dept_level_5: string;
  dept_level_6: string;
  dept_level_7: string;
  dept_level_8: string;
  dept_level_9: string;
  dept_level_10: string;
  dept_level_11: string;
  dept_level_12: string;
  dept_level_13: string;
  dept_level_14: string;
  dept_level_15: string;
  dept_level_16: string;
  dept_level_17: string;
  dept_level_18: string;
  dept_level_19: string;
  dept_level_20: string;
  dept_level_21: string;
  dept_level_22: string;
  dept_level_23: string;
  dept_level_24: string;
  dept_level_25: string;
  dept_level_26: string;
  dept_level_27: string;
  dept_level_28: string;
  dept_level_29: string;
  dept_level_30: string;
  acc_level_1: string;
  acc_level_2: string;
  acc_level_3: string;
  acc_level_4: string;
  acc_level_5: string;
  acc_level_6: string;
  acc_level_7: string;
  acc_level_8: string;
  acc_level_9: string;
  acc_level_10: string;
  acc_level_11: string;
  acc_level_12: string;
  acc_level_13: string;
  acc_level_14: string;
  acc_level_15: string;
  acc_level_16: string;
  acc_level_17: string;
  acc_level_18: string;
  acc_level_19: string;
  acc_level_20: string;
  acc_level_21: string;
  acc_level_22: string;
  acc_level_23: string;
  acc_level_24: string;
  acc_level_25: string;
  acc_level_26: string;
  acc_level_27: string;
  acc_level_28: string;
  acc_level_29: string;
  acc_level_30: string;
}

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: 600,
  '& .MuiTableHead-root': {
    '& .MuiTableCell-root': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      fontWeight: 600,
    },
  },
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [combos, setCombos] = useState<ComboMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [accountsPage, setAccountsPage] = useState(0);
  const [accountsRowsPerPage, setAccountsRowsPerPage] = useState(10);
  const [departmentsPage, setDepartmentsPage] = useState(0);
  const [departmentsRowsPerPage, setDepartmentsRowsPerPage] = useState(10);
  const [combosPage, setCombosPage] = useState(0);
  const [combosRowsPerPage, setCombosRowsPerPage] = useState(10);

  // Modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [comboModalOpen, setComboModalOpen] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form states
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    account_id: '',
    a_easy_name: '',
    a_is_stat: 0,
    a_is_locked: 0,
  });

  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    department_id: '',
    d_easy_name: '',
    d_is_locked: 0,
  });

  const [newCombo, setNewCombo] = useState({
    department_id: '',
    account_id: '',
    is_locked: 0,
  });

  // Helper function to get account hierarchy
  const getAccountHierarchy = (account: Account): string => {
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const level = account[`a_level_${i}` as keyof Account] as string;
      if (level && level.trim()) {
        levels.push(level.trim());
      }
    }
    return levels.join(' > ') || '-';
  };

  // Helper function to get department hierarchy
  const getDepartmentHierarchy = (department: Department): string => {
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const level = department[`d_level_${i}` as keyof Department] as string;
      if (level && level.trim()) {
        levels.push(level.trim());
      }
    }
    return levels.join(' > ') || '-';
  };

  // Helper function to get combo department hierarchy
  const getComboDeptHierarchy = (combo: ComboMetadata): string => {
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const level = combo[`dept_level_${i}` as keyof ComboMetadata] as string;
      if (level && level.trim()) {
        levels.push(level.trim());
      }
    }
    return levels.join(' > ') || '-';
  };

  // Helper function to get combo account hierarchy
  const getComboAccHierarchy = (combo: ComboMetadata): string => {
    const levels = [];
    for (let i = 1; i <= 30; i++) {
      const level = combo[`acc_level_${i}` as keyof ComboMetadata] as string;
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
        const [accountsResult, departmentsResult, combosResult] = await Promise.all([
          window.ipcApi.sendIpcRequest("db-get-all-accounts"),
          window.ipcApi.sendIpcRequest("db-get-all-departments"),
          window.ipcApi.sendIpcRequest("db-get-all-combo-metadata"),
        ]);

        setAccounts(JSON.parse(accountsResult));
        setDepartments(JSON.parse(departmentsResult));
        setCombos(JSON.parse(combosResult));
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

  // Form submission handlers
  const handleCreateAccount = async () => {
    try {
      if (!newAccount.account_id || !newAccount.a_easy_name) {
        setSnackbar({ open: true, message: 'Account ID and Name are required', severity: 'error' });
        return;
      }

      if (window.ipcApi) {
        await window.ipcApi.sendIpcRequest("db-create-account", newAccount);
        setSnackbar({ open: true, message: 'Account created successfully', severity: 'success' });
        setAccountModalOpen(false);
        setNewAccount({
          account_id: '',
          a_easy_name: '',
          a_is_stat: 0,
          a_is_locked: 0,
        });
        loadData(); // Refresh data
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create account', severity: 'error' });
    }
  };

  const handleCreateDepartment = async () => {
    try {
      if (!newDepartment.department_id || !newDepartment.d_easy_name) {
        setSnackbar({ open: true, message: 'Department ID and Name are required', severity: 'error' });
        return;
      }

      if (window.ipcApi) {
        await window.ipcApi.sendIpcRequest("db-create-department", newDepartment);
        setSnackbar({ open: true, message: 'Department created successfully', severity: 'success' });
        setDepartmentModalOpen(false);
        setNewDepartment({
          department_id: '',
          d_easy_name: '',
          d_is_locked: 0,
        });
        loadData(); // Refresh data
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create department', severity: 'error' });
    }
  };

  const handleCreateCombo = async () => {
    try {
      if (!newCombo.department_id || !newCombo.account_id) {
        setSnackbar({ open: true, message: 'Department and Account are required', severity: 'error' });
        return;
      }

      const comboData = {
        dep_acc_combo_id: `${newCombo.department_id}_${newCombo.account_id}`,
        department_id: newCombo.department_id,
        account_id: newCombo.account_id,
        is_locked: newCombo.is_locked,
      };

      if (window.ipcApi) {
        await window.ipcApi.sendIpcRequest("db-create-combo", comboData);
        setSnackbar({ open: true, message: 'Combo created successfully', severity: 'success' });
        setComboModalOpen(false);
        setNewCombo({
          department_id: '',
          account_id: '',
          is_locked: 0,
        });
        loadData(); // Refresh data
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to create combo', severity: 'error' });
    }
  };

  const renderAccountsTable = () => (
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <AccountBalanceIcon color="primary" />
            <Typography variant="h6">
              Accounts ({accounts.length})
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setAccountModalOpen(true)}
              variant="contained"
              size="small"
              color="primary"
            >
              Add Account
            </Button>
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
        </Box>

        <StyledTableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Account ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hierarchy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts
                .slice(accountsPage * accountsRowsPerPage, accountsPage * accountsRowsPerPage + accountsRowsPerPage)
                .map((account) => (
                  <TableRow key={account.account_id} hover>
                    <TableCell>{account.account_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {account.a_easy_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.a_is_stat ? "Statistical" : "Financial"} 
                        size="small"
                        color={account.a_is_stat ? "info" : "success"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={account.a_is_locked ? "Locked" : "Unlocked"} 
                        size="small"
                        color={account.a_is_locked ? "error" : "default"}
                        variant={account.a_is_locked ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', maxWidth: 300, wordBreak: 'break-word' }}>
                        {getAccountHierarchy(account)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </StyledTableContainer>

        <TablePagination
          component="div"
          count={accounts.length}
          page={accountsPage}
          onPageChange={(_, newPage) => setAccountsPage(newPage)}
          rowsPerPage={accountsRowsPerPage}
          onRowsPerPageChange={(event) => {
            setAccountsRowsPerPage(parseInt(event.target.value, 10));
            setAccountsPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
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
              Departments ({departments.length})
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setDepartmentModalOpen(true)}
              variant="contained"
              size="small"
              color="primary"
            >
              Add Department
            </Button>
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
        </Box>

        <StyledTableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Department ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Hierarchy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments
                .slice(departmentsPage * departmentsRowsPerPage, departmentsPage * departmentsRowsPerPage + departmentsRowsPerPage)
                .map((department) => (
                  <TableRow key={department.department_id} hover>
                    <TableCell>{department.department_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {department.d_easy_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={department.d_is_locked ? "Locked" : "Unlocked"} 
                        size="small"
                        color={department.d_is_locked ? "error" : "default"}
                        variant={department.d_is_locked ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', maxWidth: 300, wordBreak: 'break-word' }}>
                        {getDepartmentHierarchy(department)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </StyledTableContainer>

        <TablePagination
          component="div"
          count={departments.length}
          page={departmentsPage}
          onPageChange={(_, newPage) => setDepartmentsPage(newPage)}
          rowsPerPage={departmentsRowsPerPage}
          onRowsPerPageChange={(event) => {
            setDepartmentsRowsPerPage(parseInt(event.target.value, 10));
            setDepartmentsPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </CardContent>
    </StyledCard>
  );

  const renderComboMetadataTable = () => (
    <StyledCard>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <LinkIcon color="primary" />
            <Typography variant="h6">
              Combo Metadata ({combos.length})
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setComboModalOpen(true)}
              variant="contained"
              size="small"
              color="primary"
            >
              Add Combo
            </Button>
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
        </Box>

        <StyledTableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Combo ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Dept Hierarchy</TableCell>
                <TableCell>Acc Hierarchy</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {combos
                .slice(combosPage * combosRowsPerPage, combosPage * combosRowsPerPage + combosRowsPerPage)
                .map((combo) => (
                  <TableRow key={combo.dep_acc_combo_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {combo.dep_acc_combo_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {combo.department_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {combo.department_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {combo.account_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {combo.account_id}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={combo.is_locked ? "Locked" : "Unlocked"} 
                        size="small"
                        color={combo.is_locked ? "error" : "default"}
                        variant={combo.is_locked ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', maxWidth: 250, wordBreak: 'break-word' }}>
                          {getComboDeptHierarchy(combo)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', maxWidth: 250, wordBreak: 'break-word' }}>
                          {getComboAccHierarchy(combo)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </StyledTableContainer>

        <TablePagination
          component="div"
          count={combos.length}
          page={combosPage}
          onPageChange={(_, newPage) => setCombosPage(newPage)}
          rowsPerPage={combosRowsPerPage}
          onRowsPerPageChange={(event) => {
            setCombosRowsPerPage(parseInt(event.target.value, 10));
            setCombosPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
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
          Review accounts, departments, and combo metadata
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="COA tabs">
          <Tab label={`Accounts (${accounts.length})`} />
          <Tab label={`Departments (${departments.length})`} />
          <Tab label={`Combo Metadata (${combos.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {renderAccountsTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderDepartmentsTable()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderComboMetadataTable()}
      </TabPanel>

      {/* Account Creation Modal */}
      <Dialog open={accountModalOpen} onClose={() => setAccountModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create New Account
          <IconButton
            aria-label="close"
            onClick={() => setAccountModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account ID"
                value={newAccount.account_id || ''}
                onChange={(e) => setNewAccount({ ...newAccount, account_id: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Account Name"
                value={newAccount.a_easy_name || ''}
                onChange={(e) => setNewAccount({ ...newAccount, a_easy_name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAccount.a_is_stat === 1}
                    onChange={(e) => setNewAccount({ ...newAccount, a_is_stat: e.target.checked ? 1 : 0 })}
                  />
                }
                label="Statistical Account"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newAccount.a_is_locked === 1}
                    onChange={(e) => setNewAccount({ ...newAccount, a_is_locked: e.target.checked ? 1 : 0 })}
                  />
                }
                label="Locked"
              />
            </Grid>
            {/* Hierarchy Levels */}
            {Array.from({ length: 5 }, (_, i) => i + 1).map((level) => (
              <Grid item xs={12} sm={6} key={level}>
                <TextField
                  fullWidth
                  label={`Level ${level}`}
                  value={newAccount[`a_level_${level}` as keyof Account] as string || ''}
                  onChange={(e) => setNewAccount({ 
                    ...newAccount, 
                    [`a_level_${level}`]: e.target.value 
                  })}
                  margin="normal"
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateAccount} variant="contained">Create Account</Button>
        </DialogActions>
      </Dialog>

      {/* Department Creation Modal */}
      <Dialog open={departmentModalOpen} onClose={() => setDepartmentModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Create New Department
          <IconButton
            aria-label="close"
            onClick={() => setDepartmentModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department ID"
                value={newDepartment.department_id || ''}
                onChange={(e) => setNewDepartment({ ...newDepartment, department_id: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department Name"
                value={newDepartment.d_easy_name || ''}
                onChange={(e) => setNewDepartment({ ...newDepartment, d_easy_name: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newDepartment.d_is_locked === 1}
                    onChange={(e) => setNewDepartment({ ...newDepartment, d_is_locked: e.target.checked ? 1 : 0 })}
                  />
                }
                label="Locked"
              />
            </Grid>
            {/* Hierarchy Levels */}
            {Array.from({ length: 5 }, (_, i) => i + 1).map((level) => (
              <Grid item xs={12} sm={6} key={level}>
                <TextField
                  fullWidth
                  label={`Level ${level}`}
                  value={newDepartment[`d_level_${level}` as keyof Department] as string || ''}
                  onChange={(e) => setNewDepartment({ 
                    ...newDepartment, 
                    [`d_level_${level}`]: e.target.value 
                  })}
                  margin="normal"
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDepartmentModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateDepartment} variant="contained">Create Department</Button>
        </DialogActions>
      </Dialog>

      {/* Combo Creation Modal */}
      <Dialog open={comboModalOpen} onClose={() => setComboModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Create New Combo
          <IconButton
            aria-label="close"
            onClick={() => setComboModalOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Department</InputLabel>
                <Select
                  value={newCombo.department_id}
                  onChange={(e) => setNewCombo({ ...newCombo, department_id: e.target.value })}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.department_id} value={dept.department_id}>
                      {dept.department_id} - {dept.d_easy_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Account</InputLabel>
                <Select
                  value={newCombo.account_id}
                  onChange={(e) => setNewCombo({ ...newCombo, account_id: e.target.value })}
                  label="Account"
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.account_id} value={acc.account_id}>
                      {acc.account_id} - {acc.a_easy_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newCombo.is_locked === 1}
                    onChange={(e) => setNewCombo({ ...newCombo, is_locked: e.target.checked ? 1 : 0 })}
                  />
                }
                label="Locked"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setComboModalOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateCombo} variant="contained">Create Combo</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}