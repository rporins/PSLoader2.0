/**
 * Validations Page
 * ================
 *
 * Manages data validation checks for imported data.
 * Displays validation requirements from API and executes them via IPC.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Fade,
  useMediaQuery,
  alpha,
  Divider,
  CircularProgress,
  LinearProgress,
  Chip,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import validationService, { Validation } from '../../services/validationService';
import { useSettingsStore } from '../../store/settings';
import { useNavigate } from 'react-router-dom';

// ────────────────────────────────────────────────────────────
// STYLED COMPONENTS
// ────────────────────────────────────────────────────────────

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: 'calc(100vh - 64px)',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.03) 0%, rgba(6, 182, 212, 0.03) 100%)'
    : 'linear-gradient(180deg, rgba(139, 92, 246, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)',
  padding: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, ${alpha('#ffffff', 0.05)} 0%, ${alpha('#8b5cf6', 0.08)} 100%)`
    : `linear-gradient(135deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#8b5cf6', 0.05)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 8px 32px ${alpha('#000000', 0.3)}`
    : `0 8px 32px ${alpha('#8b5cf6', 0.08)}`,
  marginBottom: theme.spacing(2),
}));

const ValidationCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 8px 24px ${alpha('#000000', 0.3)}`
      : `0 8px 24px ${alpha('#8b5cf6', 0.1)}`,
  },
}));

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

interface ValidationResult {
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  errors?: string[];
  warnings?: string[];
  recordCount?: number;
  expanded?: boolean;
}

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

const Validations: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [dataFreshness, setDataFreshness] = useState<'cached' | 'fresh' | 'fetching'>('cached');
  const [importCompleted, setImportCompleted] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  const selectedOU = useSettingsStore((s) => s.selectedHotelOu);

  // Check if imports are completed for this OU
  useEffect(() => {
    const checkImportState = async () => {
      if (!selectedOU) return;

      try {
        // @ts-ignore
        const result = await window.ipcApi.sendIpcRequest('db:get-import-completed-state', { ou: selectedOU });
        if (result?.success) {
          const isCompleted = result.data as boolean;
          setImportCompleted(isCompleted);

          // If imports are not completed, show modal
          if (!isCompleted) {
            setShowAccessDeniedModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to check import state:', error);
      }
    };

    checkImportState();
  }, [selectedOU]);

  // Fetch validations when OU is selected or changes
  useEffect(() => {
    const fetchValidations = async () => {
      if (!selectedOU) {
        setLoading(false);
        return;
      }

      try {
        setDataFreshness('fetching');
        setLoading(true);

        // Use cache-first strategy: load cached data immediately, then fetch fresh in background
        const vals = await validationService.getValidationsCacheFirst(
          selectedOU,
          // Callback when fresh data arrives
          (freshValidations) => {
            console.log('Fresh validations received, updating UI...');
            setValidations(freshValidations);
            setDataFreshness('fresh');

            // Auto-hide "fresh" indicator after 3 seconds
            setTimeout(() => {
              setDataFreshness('cached');
            }, 3000);
          }
        );

        // Set initial data from cache (or empty if no cache)
        setValidations(vals);

        if (vals.length > 0) {
          // We have cached data
          setDataFreshness('cached');
          setLoading(false);
        } else {
          // No cached data, need to wait for fresh fetch
          console.log('No cached validations found, fetching from API...');
          try {
            const freshVals = await validationService.fetchAndSyncValidations(selectedOU);
            setValidations(freshVals);
            setDataFreshness('fresh');
            setTimeout(() => setDataFreshness('cached'), 3000);
          } catch (error) {
            console.error('Failed to fetch validations:', error);
            // Set empty array on error
            setValidations([]);
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error in fetchValidations:', error);
        setValidations([]);
        setLoading(false);
        setDataFreshness('cached');
      }
    };

    fetchValidations();
  }, [selectedOU]);

  // Run a single validation
  const handleRunValidation = useCallback(async (validation: Validation) => {
    if (!selectedOU) return;

    setValidationResults(prev => {
      const newMap = new Map(prev);
      newMap.set(validation.name, { status: 'running' });
      return newMap;
    });

    try {
      const result = await validationService.runValidation(validation.name, selectedOU);

      let status: ValidationResult['status'] = 'success';
      if (result.errors && result.errors.length > 0) {
        status = 'error';
      } else if (result.warnings && result.warnings.length > 0) {
        status = 'warning';
      }

      setValidationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(validation.name, {
          status,
          errors: result.errors,
          warnings: result.warnings,
          recordCount: result.recordCount,
          expanded: false,
        });
        return newMap;
      });
    } catch (error) {
      setValidationResults(prev => {
        const newMap = new Map(prev);
        newMap.set(validation.name, {
          status: 'error',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          expanded: false,
        });
        return newMap;
      });
    }
  }, [selectedOU]);

  // Run all validations
  const handleRunAllValidations = useCallback(async () => {
    if (!selectedOU || validations.length === 0) return;

    setIsRunningAll(true);

    // Set all to running
    const runningMap = new Map<string, ValidationResult>();
    validations.forEach(v => {
      runningMap.set(v.name, { status: 'running' });
    });
    setValidationResults(runningMap);

    // Run validations sequentially
    for (const validation of validations) {
      await handleRunValidation(validation);
    }

    setIsRunningAll(false);
  }, [selectedOU, validations, handleRunValidation]);

  // Toggle expansion of validation result
  const handleToggleExpand = useCallback((validationName: string) => {
    setValidationResults(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(validationName);
      if (current) {
        newMap.set(validationName, { ...current, expanded: !current.expanded });
      }
      return newMap;
    });
  }, []);

  // Clear all results
  const handleClearResults = useCallback(() => {
    setValidationResults(new Map());
  }, []);

  // Stats calculation
  const stats = {
    total: validations.length,
    required: validations.filter(v => v.is_required).length,
    passed: Array.from(validationResults.values()).filter(r => r.status === 'success').length,
    failed: Array.from(validationResults.values()).filter(r => r.status === 'error').length,
    warnings: Array.from(validationResults.values()).filter(r => r.status === 'warning').length,
  };

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!selectedOU) {
    return (
      <PageContainer>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Please select a hotel to view validations
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Section */}
      <HeaderCard>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={isMobile ? 'column' : 'row'} alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="h5"
                  fontWeight={800}
                  sx={{
                    background: `linear-gradient(135deg, #667eea, #764ba2)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '1.25rem', sm: '1.5rem' },
                  }}
                >
                  Data Validations
                </Typography>
                <IconButton
                  size="small"
                  onClick={async () => {
                    if (!selectedOU) return;
                    try {
                      setDataFreshness('fetching');
                      const freshValidations = await validationService.fetchAndSyncValidations(selectedOU);
                      setValidations(freshValidations);
                      setDataFreshness('fresh');
                      setTimeout(() => setDataFreshness('cached'), 3000);
                    } catch (error) {
                      console.error('Failed to refresh validations:', error);
                      setDataFreshness('cached');
                    }
                  }}
                  disabled={!selectedOU || dataFreshness === 'fetching'}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Typography variant="body2" color="text.secondary" fontWeight={500} fontSize="0.8rem">
                Run validation checks on imported data
              </Typography>
            </Box>

            {/* Stats */}
            <Stack direction="row" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="success.main">
                  {stats.passed}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Passed
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="error.main">
                  {stats.failed}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Failed
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Total
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </HeaderCard>

      {/* Freshness indicator */}
      {dataFreshness === 'fresh' && (
        <Fade in>
          <Alert severity="success" sx={{ mb: 2, borderRadius: 3 }}>
            ✓ Validations updated from server
          </Alert>
        </Fade>
      )}

      {dataFreshness === 'fetching' && validations.length > 0 && (
        <Fade in>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">Checking for updates...</Typography>
            </Stack>
          </Alert>
        </Fade>
      )}

      {/* Validation Cards */}
      {validations.length > 0 ? (
        <Stack spacing={2} mb={3}>
          {validations
            .sort((a, b) => a.sequence - b.sequence)
            .map((validation) => {
              const result = validationResults.get(validation.name);
              const hasErrors = result?.errors && result.errors.length > 0;
              const hasWarnings = result?.warnings && result.warnings.length > 0;

              return (
                <ValidationCard key={validation.id}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      {/* Header row */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2} flex={1}>
                          {/* Status icon */}
                          <Box>
                            {result?.status === 'running' && <CircularProgress size={24} />}
                            {result?.status === 'success' && <CheckCircleIcon color="success" />}
                            {result?.status === 'error' && <ErrorIcon color="error" />}
                            {result?.status === 'warning' && <WarningIcon color="warning" />}
                            {result?.status === 'idle' && <InfoIcon color="disabled" />}
                          </Box>

                          {/* Title and description */}
                          <Box flex={1}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Typography variant="h6" fontWeight={600} fontSize="1rem">
                                {validation.display_name}
                              </Typography>
                              {validation.is_required && (
                                <Chip label="Required" size="small" color="primary" sx={{ height: 20, fontSize: '0.7rem' }} />
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
                              {validation.description}
                            </Typography>
                            {result?.recordCount !== undefined && (
                              <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                                Records checked: {result.recordCount}
                              </Typography>
                            )}
                          </Box>

                          {/* Run button */}
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => handleRunValidation(validation)}
                            disabled={isRunningAll || result?.status === 'running'}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            Run
                          </Button>

                          {/* Expand button for errors/warnings */}
                          {(hasErrors || hasWarnings) && (
                            <IconButton
                              size="small"
                              onClick={() => handleToggleExpand(validation.name)}
                              sx={{
                                transform: result?.expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s',
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>

                      {/* Progress bar when running */}
                      {result?.status === 'running' && (
                        <LinearProgress sx={{ borderRadius: 1 }} />
                      )}

                      {/* Errors and Warnings */}
                      {(hasErrors || hasWarnings) && (
                        <Collapse in={result?.expanded}>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {hasErrors && (
                              <Alert severity="error" sx={{ borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                                  Errors:
                                </Typography>
                                {result!.errors!.map((error, idx) => (
                                  <Typography key={idx} variant="body2" fontSize="0.8rem">
                                    • {error}
                                  </Typography>
                                ))}
                              </Alert>
                            )}
                            {hasWarnings && (
                              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                                  Warnings:
                                </Typography>
                                {result!.warnings!.map((warning, idx) => (
                                  <Typography key={idx} variant="body2" fontSize="0.8rem">
                                    • {warning}
                                  </Typography>
                                ))}
                              </Alert>
                            )}
                          </Stack>
                        </Collapse>
                      )}
                    </Stack>
                  </CardContent>
                </ValidationCard>
              );
            })}
        </Stack>
      ) : (
        <Card
          sx={{
            mb: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.5),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            textAlign: 'center',
            p: 4,
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No validations available for this hotel
          </Typography>
        </Card>
      )}

      {/* Action Buttons */}
      {validations.length > 0 && (
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={2}
          justifyContent="flex-end"
          sx={{
            position: 'sticky',
            bottom: 16,
            background: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(20px)',
            p: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleClearResults}
            disabled={isRunningAll || validationResults.size === 0}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            Clear Results
          </Button>

          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunAllValidations}
            disabled={isRunningAll}
            fullWidth={isMobile}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
              },
            }}
          >
            {isRunningAll ? 'Running Validations...' : 'Run All Validations'}
          </Button>
        </Stack>
      )}

      {/* Info Section */}
      <Box mt={3}>
        <Alert
          severity="info"
          icon={<InfoIcon />}
          sx={{
            borderRadius: 3,
            background: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <Typography variant="body2" fontWeight={600} mb={1}>
            Validation Information
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            • Validations check imported data for errors and inconsistencies<br />
            • Required validations must pass before data can be used<br />
            • Click "Run" on individual validations or "Run All" to check everything<br />
            • Expand failed validations to see detailed error messages
          </Typography>
        </Alert>
      </Box>

      {/* Access Denied Modal */}
      <Dialog
        open={showAccessDeniedModal}
        onClose={() => {
          setShowAccessDeniedModal(false);
          navigate('/signed-in-landing/data-import');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Imports Not Completed
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" color="text.secondary" mb={2}>
            You need to complete all data imports before accessing the validations page.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please go to the Data Import page and complete your import session first.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setShowAccessDeniedModal(false);
              navigate('/signed-in-landing/data-import');
            }}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2, #667eea)',
              },
            }}
          >
            Go to Data Import
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default Validations;
