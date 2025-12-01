/**
 * Data Import Page
 * ================
 *
 * Manages the import of various data files using the import processor system.
 * Uses the ImportCard component for file selection and processing.
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Snackbar,
} from '@mui/material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import ImportCard from '../../components/dataImport/ImportCard';
import { ImportFile, ImportStatus } from '../../types/dataImport';
import importConfigService, { ImportGroup } from '../../services/importConfigService';
import authService from '../../services/auth';
import { useSettingsStore } from '../../store/settings';

// ────────────────────────────────────────────────────────────
// ANIMATIONS
// ────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

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

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

const DataImport: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [loading, setLoading] = useState(true);
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'importing' | 'complete'>('idle');
  const [importSessionStarted, setImportSessionStarted] = useState(false);
  const [currentImportSessionId, setCurrentImportSessionId] = useState<number | null>(null);

  // Import Groups state
  const [importGroups, setImportGroups] = useState<ImportGroup[]>([]);
  const [selectedImportGroup, setSelectedImportGroup] = useState<string>('');
  const [loadingImportGroups, setLoadingImportGroups] = useState(false);
  const selectedOU = useSettingsStore((s) => s.selectedHotelOu);
  const [hotels, setHotels] = useState<any[]>([]);

  // Period selection state (required for imports - must be set before importing)
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');

  // Sequential processing state
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [currentActiveIndex, setCurrentActiveIndex] = useState(0); // Track which import is currently active
  const [completedImports, setCompletedImports] = useState<Set<string>>(new Set()); // Track completed imports

  // Error notification state
  const [errorSnackbar, setErrorSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Cache status state
  const [dataFreshness, setDataFreshness] = useState<'cached' | 'fresh' | 'fetching'>('cached');

  // Fetch import groups when OU is selected or changes
  useEffect(() => {
    const fetchImportGroups = async () => {
      if (!selectedOU) return;

      // Reset import group selection when hotel changes
      setSelectedImportGroup('');
      handleRestart();

      try {
        // Use cache-first strategy: load cached data immediately, then fetch fresh in background
        setDataFreshness('fetching');

        const groups = await importConfigService.getImportGroupsCacheFirst(
          selectedOU,
          // Callback when fresh data arrives
          (freshGroups) => {
            console.log('Fresh import groups received, updating UI...');
            setImportGroups(freshGroups);
            setDataFreshness('fresh');

            // Update selected group if needed
            if (freshGroups.length > 0 && !selectedImportGroup) {
              const uniqueGroups = importConfigService.getUniqueGroupNames(freshGroups);
              setSelectedImportGroup(uniqueGroups[0]);
            }

            // Auto-hide "fresh" indicator after 3 seconds
            setTimeout(() => {
              setDataFreshness('cached');
            }, 3000);
          }
        );

        // Set initial data from cache (or empty if no cache)
        setImportGroups(groups);

        // Set the first group as default if we have data
        if (groups.length > 0) {
          const uniqueGroups = importConfigService.getUniqueGroupNames(groups);
          setSelectedImportGroup(uniqueGroups[0]);
          setLoadingImportGroups(false);
          setDataFreshness('cached'); // Data is from cache
        } else {
          // No cached data, need to wait for fresh fetch
          setLoadingImportGroups(true);

          // Trigger a fresh fetch since cache is empty
          try {
            const freshGroups = await importConfigService.fetchAndSyncImportGroups(selectedOU);
            setImportGroups(freshGroups);
            if (freshGroups.length > 0) {
              const uniqueGroups = importConfigService.getUniqueGroupNames(freshGroups);
              setSelectedImportGroup(uniqueGroups[0]);
            }
            setDataFreshness('fresh');
            setTimeout(() => setDataFreshness('cached'), 3000);
          } catch (error) {
            console.error('Failed to fetch import groups:', error);
          } finally {
            setLoadingImportGroups(false);
          }
        }
      } catch (error) {
        console.error('Error in fetchImportGroups:', error);
        setLoadingImportGroups(false);
        setDataFreshness('cached');
      }
    };

    fetchImportGroups();
  }, [selectedOU]);

  // Update import files when import group is selected
  useEffect(() => {
    if (selectedImportGroup && importGroups.length > 0) {
      const imports = importConfigService.getImportsByGroup(importGroups, selectedImportGroup);

      // Convert imports to ImportFile format
      // Use a combination of import name and index to ensure unique IDs
      const files: ImportFile[] = imports.map((imp, index) => ({
        id: `${imp.name}_${index}_${Date.now()}`, // Ensure unique ID even for duplicate names
        name: imp.name, // Keep the original import name for IPC calls
        displayName: imp.displayName,
        description: imp.description,
        fileTypes: imp.fileTypes,
        required: imp.required,
        order: imp.order,
        requiredColumns: imp.requiredColumns,
        optionalColumns: imp.optionalColumns,
        validationRules: imp.validationRules,
        status: ImportStatus.Pending,
      }));

      setImportFiles(files);
    }
  }, [selectedImportGroup, importGroups]);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // Get hotels for local_id lookup (hotel selection is managed by the header)
        try {
          // First get from cache
          // @ts-ignore
          const cachedResult = await window.ipcApi.sendIpcRequest('db:get-cached-hotels');

          let hotelsList = [];
          if (cachedResult?.success && cachedResult.data) {
            hotelsList = JSON.parse(cachedResult.data);
            setHotels(hotelsList);
          }

          // Then fetch fresh from API
          const freshHotels = await authService.getHotels();
          if (freshHotels.length > 0) {
            setHotels(freshHotels);
          } else if (hotelsList.length > 0) {
            // Use cached hotels if API fails
            setHotels(hotelsList);
          }
        } catch (error) {
          console.error('Failed to fetch hotels:', error);
          // Try to use cached hotels
          try {
            // @ts-ignore
            const cachedResult = await window.ipcApi.sendIpcRequest('db:get-cached-hotels');
            if (cachedResult?.success && cachedResult.data) {
              const hotelsList = JSON.parse(cachedResult.data);
              setHotels(hotelsList);
            }
          } catch (cacheError) {
            console.error('Failed to get cached hotels:', cacheError);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle file selection from ImportCard
  const handleFileSelect = useCallback((importId: string, file: File) => {
    console.log(`File selected for import ${importId}:`, file.name);
    // The ImportCard component handles its own state
    // We just track the overall session status here
  }, []);

  // Handle file removal from ImportCard
  const handleRemoveFile = useCallback((importId: string) => {
    console.log(`File removed for import ${importId}`);
    // The ImportCard component handles its own state
  }, []);

  // Create import session when first import starts
  const createImportSession = useCallback(async () => {
    if (currentImportSessionId !== null || selectedYear === '' || selectedMonth === '' || !selectedOU || !selectedImportGroup) {
      return; // Session already created or missing required data
    }

    try {
      const periodCombo = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      // @ts-ignore
      const result = await window.ipcApi.sendIpcRequest('db:create-import-session', {
        ou: selectedOU,
        import_group_name: selectedImportGroup,
        year: selectedYear,
        month: selectedMonth,
        period_combo: periodCombo,
      });

      if (result && result.success && result.data) {
        const sessionId = result.data as number;
        setCurrentImportSessionId(sessionId);
        console.log(`Import session created: ${sessionId} for period ${periodCombo}`);
      }
    } catch (error) {
      console.error('Failed to create import session:', error);
    }
  }, [currentImportSessionId, selectedYear, selectedMonth, selectedOU, selectedImportGroup]);

  // Handle status change from ImportCard
  const handleStatusChange = useCallback(async (importId: string, status: ImportStatus, additionalData?: { fileName?: string; rowCount?: number; error?: string }) => {
    console.log(`Status changed for import ${importId}:`, status, additionalData);

    setImportFiles(prev =>
      prev.map(file =>
        file.id === importId
          ? {
              ...file,
              status,
              ...additionalData,
              // Explicitly clear error on success
              error: status === ImportStatus.Complete ? undefined : additionalData?.error
            }
          : file
      )
    );

    // Show error snackbar if status is Failed
    if (status === ImportStatus.Failed && additionalData?.error) {
      setErrorSnackbar({ open: true, message: additionalData.error });
    }

    // Create import session when first import starts processing
    if (status === ImportStatus.Processing && !importSessionStarted) {
      await createImportSession();
    }

    // Handle completion and unlock next import
    if (status === ImportStatus.Complete) {
      // Add to completed set
      setCompletedImports(prev => new Set(prev).add(importId));

      // Find and activate next import in sequence
      const sortedImports = [...importFiles].sort((a, b) => a.order - b.order);
      const currentIndex = sortedImports.findIndex(f => f.id === importId);
      const nextImport = sortedImports[currentIndex + 1];

      if (nextImport) {
        // Move to next import
        setCurrentProcessingId(nextImport.id);
        setCurrentActiveIndex(currentIndex + 1);
        setIsProcessing(false); // Allow the next import to be processed
      } else {
        // All imports complete
        setCurrentProcessingId(null);
        setSessionStatus('complete');
        setImportSessionStarted(false);
        setIsProcessing(false);
        setCurrentActiveIndex(-1);
      }

      // Check if all required imports are complete
      const allRequiredComplete = importFiles
        .filter(f => f.required)
        .every(f => f.id === importId || f.status === ImportStatus.Complete || completedImports.has(f.id));

      if (allRequiredComplete && !nextImport) {
        setSessionStatus('complete');
        setImportSessionStarted(false);
        setIsProcessing(false);

        // Update import session status to completed
        if (currentImportSessionId !== null) {
          try {
            // @ts-ignore
            await window.ipcApi.sendIpcRequest('db:update-import-session-status', {
              sessionId: currentImportSessionId,
              status: 'completed',
            });
            console.log(`Import session ${currentImportSessionId} marked as completed`);
          } catch (error) {
            console.error('Failed to update import session status:', error);
          }
        }
      }
    } else if (status === ImportStatus.Processing) {
      // Set as processing
      setIsProcessing(true);
      setCurrentProcessingId(importId);
    } else if (status === ImportStatus.Failed) {
      // Stop processing on failure
      setIsProcessing(false);
      // Keep the current import active for retry

      // Update import session status to failed
      if (currentImportSessionId !== null) {
        try {
          // @ts-ignore
          await window.ipcApi.sendIpcRequest('db:update-import-session-status', {
            sessionId: currentImportSessionId,
            status: 'failed',
          });
          console.log(`Import session ${currentImportSessionId} marked as failed`);
        } catch (error) {
          console.error('Failed to update import session status:', error);
        }
      }
    }
  }, [importFiles, completedImports, currentImportSessionId]);

  // Handle restart
  const handleRestart = useCallback(async () => {
    // Clear the staging table in SQLite
    try {
      // @ts-ignore
      await window.ipcApi.sendIpcRequest('db:clear-staging-table');
      console.log('Staging table cleared successfully');
    } catch (error) {
      console.error('Failed to clear staging table:', error);
    }

    setImportFiles(prev =>
      prev.map(imp => ({
        ...imp,
        file: undefined as File | undefined,
        fileName: undefined as string | undefined,
        status: ImportStatus.Pending,
        rowCount: undefined as number | undefined,
        error: undefined as string | undefined,
      }))
    );
    setImportSessionStarted(false);
    setSessionStatus('idle');
    setIsProcessing(false);
    setCurrentProcessingId(null);
    setCurrentActiveIndex(0);
    setCompletedImports(new Set());
    setCurrentImportSessionId(null); // Clear the import session ID for a fresh start
  }, []);

  // Handle start import session
  const handleStartImport = useCallback(() => {
    setImportSessionStarted(true);
    setSessionStatus('importing');
    setIsProcessing(false); // Don't block the first import

    // In sequential mode, set the first import as current
    const sortedImports = [...importFiles].sort((a, b) => a.order - b.order);
    if (sortedImports.length > 0) {
      setCurrentProcessingId(sortedImports[0].id);
      setCurrentActiveIndex(0);
    }
  }, [importFiles]);

  // Stats calculation
  const stats = {
    completed: importFiles.filter((f) => f.status === ImportStatus.Complete).length,
    total: importFiles.length,
    uploaded: importFiles.filter((f) => f.fileName).length,
  };

  const canStartImport =
    importFiles.filter((f) => f.required).every((f) => f.fileName) &&
    !importSessionStarted;

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header Section */}
      <HeaderCard>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={isMobile ? 'column' : 'row'} alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
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
                Import Data
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500} fontSize="0.8rem">
                Upload and process your data files
              </Typography>
            </Box>

            {/* Stats */}
            <Stack direction="row" spacing={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700} color="primary">
                  {stats.completed}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Completed
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700}>
                  {stats.total}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                  Total Files
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </HeaderCard>

      {/* Import Groups Selector */}
      <Card
        sx={{
          mb: 2,
          borderRadius: 3,
          background: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* First row: Import Group selector */}
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
              <FormControl fullWidth={isMobile} sx={{ minWidth: 200 }}>
                <InputLabel id="import-group-select-label">Import Group</InputLabel>
                <Select
                  labelId="import-group-select-label"
                  id="import-group-select"
                  value={selectedImportGroup}
                  label="Import Group"
                  onChange={(event: SelectChangeEvent) => {
                    setSelectedImportGroup(event.target.value);
                    handleRestart();
                  }}
                  disabled={loadingImportGroups || importSessionStarted}
                >
                  {importConfigService.getUniqueGroupNames(importGroups).map((groupName) => (
                    <MenuItem key={groupName} value={groupName}>
                      {groupName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loadingImportGroups && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Loading import groups...
                  </Typography>
                </Stack>
              )}

              {!loadingImportGroups && selectedImportGroup && (
                <Box flex={isMobile ? undefined : 1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      {importFiles.length} imports available • {importFiles.filter(f => f.required).length} required
                    </Typography>
                    {dataFreshness === 'fresh' && (
                      <Fade in>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'success.main',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        >
                          ✓ Updated
                        </Typography>
                      </Fade>
                    )}
                    {dataFreshness === 'fetching' && (
                      <CircularProgress size={12} />
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>

            {/* Second row: Period selection (Year and Month) */}
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2} alignItems="center">
              <FormControl
                fullWidth={isMobile}
                sx={{ minWidth: 150 }}
                required
                error={selectedYear === '' && importFiles.length > 0}
              >
                <InputLabel id="year-select-label">Year *</InputLabel>
                <Select
                  labelId="year-select-label"
                  id="year-select"
                  value={selectedYear}
                  label="Year *"
                  onChange={(event: SelectChangeEvent<number | ''>) => {
                    setSelectedYear(event.target.value as number | '');
                  }}
                  disabled={importSessionStarted}
                >
                  <MenuItem value="" disabled>
                    <em>Select Year</em>
                  </MenuItem>
                  {/* Generate years from 2020 to current year + 2 */}
                  {Array.from({ length: new Date().getFullYear() - 2020 + 3 }, (_, i) => 2020 + i).map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                fullWidth={isMobile}
                sx={{ minWidth: 150 }}
                required
                error={selectedMonth === '' && importFiles.length > 0}
              >
                <InputLabel id="month-select-label">Month *</InputLabel>
                <Select
                  labelId="month-select-label"
                  id="month-select"
                  value={selectedMonth}
                  label="Month *"
                  onChange={(event: SelectChangeEvent<number | ''>) => {
                    setSelectedMonth(event.target.value as number | '');
                  }}
                  disabled={importSessionStarted}
                >
                  <MenuItem value="" disabled>
                    <em>Select Month</em>
                  </MenuItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <MenuItem key={month} value={month}>
                      {month}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box flex={isMobile ? undefined : 1}>
                {selectedYear !== '' && selectedMonth !== '' ? (
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Period: {selectedYear}-{String(selectedMonth).padStart(2, '0')}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="error" fontWeight={500}>
                    Please select year and month to begin imports
                  </Typography>
                )}
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Status Banner */}
      {sessionStatus !== 'idle' && (
        <Fade in>
          <Alert
            severity={sessionStatus === 'complete' ? 'success' : 'info'}
            icon={
              sessionStatus === 'complete' ? (
                <CheckCircleIcon />
              ) : (
                <RefreshIcon sx={{ animation: `${pulse} 1.5s ease-in-out infinite` }} />
              )
            }
            sx={{
              mb: 3,
              borderRadius: 3,
              fontSize: '0.95rem',
              fontWeight: 600,
            }}
          >
            {sessionStatus === 'complete'
              ? 'Import complete! All data has been successfully processed.'
              : 'Processing imports...'}
          </Alert>
        </Fade>
      )}

      {/* Import Cards */}
      {selectedImportGroup && importFiles.length > 0 ? (
        <Stack spacing={2} mb={3} sx={{ pl: 7, position: 'relative' }}>
          {importFiles
            .sort((a, b) => a.order - b.order)
            .map((importFile, idx) => {
              // Check if period is selected (required for all imports)
              const isPeriodSelected = selectedYear !== '' && selectedMonth !== '';

              // Determine if this card should be locked and next in line
              let isLocked = false;
              let isNextInLine = false;

              // If period is not selected, lock ALL imports
              if (!isPeriodSelected) {
                isLocked = true;
                isNextInLine = false;
              } else if (importSessionStarted) {
                // Sequential mode: lock all cards except the current active one
                if (importFile.status === ImportStatus.Complete) {
                  // Completed imports stay locked
                  isLocked = true;
                } else if (currentProcessingId === importFile.id) {
                  // Current active import is unlocked and marked as next
                  isLocked = false;
                  isNextInLine = true;
                } else {
                  // All other imports are locked
                  isLocked = true;
                }
              } else {
                // Before starting import session, enforce sequential order
                // Only the first incomplete import should be unlocked
                const sortedImports = [...importFiles].sort((a, b) => a.order - b.order);

                // Find the first import that isn't complete
                const firstIncompleteIndex = sortedImports.findIndex(f => f.status !== ImportStatus.Complete);

                if (firstIncompleteIndex !== -1) {
                  // Lock all imports except the first incomplete one
                  isLocked = sortedImports[firstIncompleteIndex].id !== importFile.id;
                  isNextInLine = sortedImports[firstIncompleteIndex].id === importFile.id;
                } else {
                  // All imports are complete, lock everything
                  isLocked = true;
                }
              }

              return (
                <Box
                  key={importFile.id}
                  sx={{ position: 'relative', mb: idx < importFiles.length - 1 ? 2 : 0 }}
                >
                  {/* Step indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -50,
                      top: 16, // Fixed offset from top of card
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: importFile.status === ImportStatus.Complete
                        ? theme.palette.success.main
                        : isNextInLine
                        ? theme.palette.primary.main
                        : alpha(theme.palette.action.disabled, 0.12),
                      color: importFile.status === ImportStatus.Complete || isNextInLine
                        ? 'white'
                        : theme.palette.text.disabled,
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      border: `2px solid ${
                        importFile.status === ImportStatus.Complete
                          ? theme.palette.success.dark
                          : isNextInLine
                          ? theme.palette.primary.dark
                          : 'transparent'
                      }`,
                      boxShadow: isNextInLine
                        ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.2)}`
                        : 'none',
                    }}
                  >
                    {importFile.status === ImportStatus.Complete ? (
                      <CheckCircleIcon sx={{ fontSize: 18 }} />
                    ) : (
                      idx + 1
                    )}
                  </Box>

                  {/* Connecting line */}
                  {idx < importFiles.length - 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -35,
                        top: 48, // Start even further down from the circle
                        height: 'calc(100% - 24px)', // Reduced height to compensate for the lower starting point
                        width: 2,
                        background: idx < completedImports.size
                          ? theme.palette.success.main
                          : alpha(theme.palette.divider, 0.3),
                        zIndex: -1,
                      }}
                    />
                  )}

                  <ImportCard
                    importFile={importFile}
                    importProcessorName={importFile.name} // Use the original import name for IPC
                    onFileSelect={handleFileSelect}
                    onRemoveFile={handleRemoveFile}
                    onStatusChange={handleStatusChange}
                    isProcessing={isProcessing && currentProcessingId === importFile.id}
                    isLocked={isLocked}
                    isNextInLine={isNextInLine}
                    importOptions={{
                      ou: selectedOU,
                      year: selectedYear === '' ? undefined : selectedYear,
                      month: selectedMonth === '' ? undefined : selectedMonth,
                      localId1: hotels.find(h => h.ou === selectedOU)?.local_id_1
                    }}
                  />
                </Box>
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
            {loadingImportGroups ? 'Loading import groups...' : 'Please select an import group to begin'}
          </Typography>
        </Card>
      )}

      {/* Action Buttons */}
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
          onClick={handleRestart}
          disabled={isProcessing}
          fullWidth={isMobile}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          Restart Import
        </Button>

        <Button
          variant="contained"
          startIcon={importSessionStarted ? <RefreshIcon /> : <TaskAltIcon />}
          onClick={handleStartImport}
          disabled={!canStartImport || isProcessing}
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
          {importSessionStarted ? 'Import in Progress...' : 'Start Import Session'}
        </Button>
      </Stack>

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
            Import Process
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            • Files are processed using the import processor system<br />
            • Test imports use quick row counting without validation<br />
            • Required files must be uploaded before starting import<br />
            • Each import includes validation and processing steps
          </Typography>
        </Alert>
      </Box>

      {/* Error Notification Snackbar */}
      <Snackbar
        open={errorSnackbar.open}
        autoHideDuration={8000}
        onClose={() => setErrorSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setErrorSnackbar({ open: false, message: '' })}
          severity="error"
          variant="filled"
          sx={{
            maxWidth: 600,
            boxShadow: 8,
          }}
        >
          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
            {errorSnackbar.message}
          </Typography>
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default DataImport;