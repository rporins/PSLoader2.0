/**
 * Request Mapping Dialog
 * ======================
 *
 * A dialog for users to request new mapping lines within an existing configuration.
 * Features combo validation against valid account-department pairs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  IconButton,
  alpha,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingFlat as ArrowIcon,
  CheckCircle as ValidIcon,
  Error as InvalidIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import mappingTablesService from '../services/mappingTablesService';
import mappingConfigService, { CreateMappingRequest } from '../services/mappingConfigService';

// ────────────────────────────────────────────────────────────
// STYLED COMPONENTS
// ────────────────────────────────────────────────────────────

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    maxWidth: 600,
    width: '100%',
    background: theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.95)
      : theme.palette.background.paper,
    backdropFilter: 'blur(20px)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  gap: theme.spacing(1),
}));

const SectionLabel = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1.5),
}));

const FieldRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'flex-start',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const ValidationChip = styled(Chip)<{ valid?: boolean }>(({ theme, valid }) => ({
  height: 24,
  fontSize: '0.6875rem',
  fontWeight: 600,
  backgroundColor: valid
    ? alpha(theme.palette.success.main, 0.12)
    : alpha(theme.palette.warning.main, 0.12),
  color: valid ? theme.palette.success.main : theme.palette.warning.main,
  '& .MuiChip-icon': {
    fontSize: 14,
    color: 'inherit',
  },
}));

// ────────────────────────────────────────────────────────────
// INTERFACES
// ────────────────────────────────────────────────────────────

interface RequestMappingDialogProps {
  open: boolean;
  onClose: () => void;
  configId: number;
  configDescription?: string;
  onSuccess?: () => void;
}

interface ComboOption {
  account: string;
  department: string;
  description: string;
}

// ────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────

const RequestMappingDialog: React.FC<RequestMappingDialogProps> = ({
  open,
  onClose,
  configId,
  configDescription,
  onSuccess,
}) => {
  // Form state
  const [sourceAccount, setSourceAccount] = useState<string>('');
  const [sourceDepartment, setSourceDepartment] = useState<string>('');
  const [targetAccount, setTargetAccount] = useState<string>('');
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [priority, setPriority] = useState<number>(100);

  // Options state
  const [accounts, setAccounts] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [targetAccountOptions, setTargetAccountOptions] = useState<string[]>([]);
  const [targetDepartmentOptions, setTargetDepartmentOptions] = useState<string[]>([]);

  // Validation state
  const [isTargetComboValid, setIsTargetComboValid] = useState<boolean | null>(null);
  const [validatingCombo, setValidatingCombo] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Load unique accounts and departments on mount
  useEffect(() => {
    const loadOptions = async () => {
      if (!open) return;

      setLoadingOptions(true);
      try {
        const [accountList, departmentList] = await Promise.all([
          mappingTablesService.getUniqueAccounts(),
          mappingTablesService.getUniqueDepartments(),
        ]);
        setAccounts(accountList);
        setDepartments(departmentList);
        setTargetAccountOptions(accountList);
        setTargetDepartmentOptions(departmentList);
      } catch (err) {
        console.error('Failed to load options:', err);
        setError('Failed to load account/department options. Please try syncing mapping tables.');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [open]);

  // Update target department options when target account changes
  useEffect(() => {
    const updateTargetDepartments = async () => {
      if (!targetAccount) {
        setTargetDepartmentOptions(departments);
        return;
      }

      try {
        const validDepts = await mappingTablesService.getDepartmentsForAccount(targetAccount);
        if (validDepts.length > 0) {
          setTargetDepartmentOptions(validDepts);
        } else {
          setTargetDepartmentOptions(departments);
        }
      } catch (err) {
        console.error('Failed to get departments for account:', err);
        setTargetDepartmentOptions(departments);
      }
    };

    updateTargetDepartments();
  }, [targetAccount, departments]);

  // Update target account options when target department changes
  useEffect(() => {
    const updateTargetAccounts = async () => {
      if (!targetDepartment) {
        setTargetAccountOptions(accounts);
        return;
      }

      try {
        const validAccts = await mappingTablesService.getAccountsForDepartment(targetDepartment);
        if (validAccts.length > 0) {
          setTargetAccountOptions(validAccts);
        } else {
          setTargetAccountOptions(accounts);
        }
      } catch (err) {
        console.error('Failed to get accounts for department:', err);
        setTargetAccountOptions(accounts);
      }
    };

    updateTargetAccounts();
  }, [targetDepartment, accounts]);

  // Validate target combo when both are selected
  useEffect(() => {
    const validateCombo = async () => {
      if (!targetAccount || !targetDepartment) {
        setIsTargetComboValid(null);
        return;
      }

      setValidatingCombo(true);
      try {
        const isValid = await mappingTablesService.isValidCombo(targetAccount, targetDepartment);
        setIsTargetComboValid(isValid);
      } catch (err) {
        console.error('Failed to validate combo:', err);
        setIsTargetComboValid(null);
      } finally {
        setValidatingCombo(false);
      }
    };

    validateCombo();
  }, [targetAccount, targetDepartment]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSourceAccount('');
      setSourceDepartment('');
      setTargetAccount('');
      setTargetDepartment('');
      setPriority(100);
      setIsTargetComboValid(null);
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Validate that we have at least source or target info
      if (!sourceAccount && !sourceDepartment && !targetAccount && !targetDepartment) {
        throw new Error('Please fill in at least one source or target field');
      }

      // Warn if target combo is invalid (but still allow submission)
      if (isTargetComboValid === false) {
        const proceed = window.confirm(
          'The target account-department combination is not in the valid combos list. ' +
          'Do you still want to submit this mapping request?'
        );
        if (!proceed) {
          setLoading(false);
          return;
        }
      }

      const mappingData: CreateMappingRequest = {
        source_account: sourceAccount || null,
        source_department: sourceDepartment || null,
        target_account: targetAccount || null,
        target_department: targetDepartment || null,
        priority,
        is_active: true,
      };

      // Create the mapping via API
      await mappingConfigService.createMapping(configId, mappingData);

      setSuccess(true);

      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);

    } catch (err) {
      console.error('Failed to create mapping:', err);
      setError(err instanceof Error ? err.message : 'Failed to create mapping request');
    } finally {
      setLoading(false);
    }
  }, [
    sourceAccount, sourceDepartment, targetAccount, targetDepartment,
    priority, isTargetComboValid, configId, onClose, onSuccess
  ]);

  const canSubmit = !loading && !success && (
    sourceAccount || sourceDepartment || targetAccount || targetDepartment
  );

  return (
    <StyledDialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Request New Mapping
          </Typography>
          {configDescription && (
            <Typography variant="caption" color="text.secondary">
              For: {configDescription}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} disabled={loading} size="small">
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent>
        {loadingOptions ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Info Alert */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Request a new mapping line. It will be submitted for approval and won't be active until approved.
            </Alert>

            {/* Source Fields */}
            <Box>
              <SectionLabel>Source (What to map from)</SectionLabel>
              <FieldRow>
                <Autocomplete
                  freeSolo
                  options={accounts}
                  value={sourceAccount}
                  onInputChange={(_, value) => setSourceAccount(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Source Account"
                      placeholder="e.g., 4100"
                      size="small"
                      helperText="Leave empty to match any"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={departments}
                  value={sourceDepartment}
                  onInputChange={(_, value) => setSourceDepartment(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Source Department"
                      placeholder="e.g., 100"
                      size="small"
                      helperText="Leave empty to match any"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
              </FieldRow>
            </Box>

            {/* Arrow */}
            <Box display="flex" justifyContent="center" alignItems="center">
              <ArrowIcon sx={{ fontSize: 24, color: 'text.disabled' }} />
            </Box>

            {/* Target Fields */}
            <Box>
              <SectionLabel>
                Target (What to map to)
                {isTargetComboValid !== null && (
                  <ValidationChip
                    valid={isTargetComboValid}
                    icon={isTargetComboValid ? <ValidIcon /> : <InvalidIcon />}
                    label={isTargetComboValid ? 'Valid combo' : 'Not in combos'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                )}
                {validatingCombo && (
                  <CircularProgress size={12} sx={{ ml: 1 }} />
                )}
              </SectionLabel>
              <FieldRow>
                <Autocomplete
                  freeSolo
                  options={targetAccountOptions}
                  value={targetAccount}
                  onInputChange={(_, value) => setTargetAccount(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Target Account"
                      placeholder="e.g., 5100"
                      size="small"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={targetDepartmentOptions}
                  value={targetDepartment}
                  onInputChange={(_, value) => setTargetDepartment(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Target Department"
                      placeholder="e.g., 200"
                      size="small"
                    />
                  )}
                  sx={{ flex: 1 }}
                />
              </FieldRow>
            </Box>

            <Divider />

            {/* Priority */}
            <Box>
              <SectionLabel>Priority</SectionLabel>
              <TextField
                type="number"
                value={priority}
                onChange={(e) => setPriority(Math.max(0, parseInt(e.target.value) || 0))}
                size="small"
                helperText="Higher priority mappings are applied first (default: 100)"
                inputProps={{ min: 0, max: 9999 }}
                sx={{ width: 120 }}
              />
            </Box>

            {/* Error/Success Messages */}
            <Collapse in={!!error || success}>
              {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Mapping request submitted successfully! It is now pending approval.
                </Alert>
              )}
            </Collapse>
          </Stack>
        )}
      </StyledDialogContent>

      <StyledDialogActions>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default RequestMappingDialog;
