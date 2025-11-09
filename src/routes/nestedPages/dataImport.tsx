/**
 * Dynamic Data Import Page
 * =========================
 *
 * This component is fully JSON-driven. It fetches a page configuration
 * from the backend and generates the entire UI dynamically.
 *
 * Features:
 * - Header, stats, and actions are all defined in JSON
 * - Import cards are generated from backend import registry
 * - Sequential or parallel import modes
 * - Optional data compilation/blending step
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Alert,
  Fade,
  Grow,
  useMediaQuery,
  alpha,
  Divider,
  CircularProgress,
} from '@mui/material';
import { styled, useTheme, keyframes } from '@mui/material/styles';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Upload as UploadIcon,
  Input as InputIcon,
  TaskAlt as TaskAltIcon,
} from '@mui/icons-material';
import { DataImportPageConfig, ImportCardConfig } from '../../types/pageConfig';

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

enum ImportStatus {
  Pending = 'pending',
  Validating = 'validating',
  Processing = 'processing',
  Complete = 'complete',
  Failed = 'failed',
}

interface ImportFile extends ImportCardConfig {
  file?: File;
  fileName?: string;
  rowCount?: number;
  status: ImportStatus;
  error?: string;
}

// ────────────────────────────────────────────────────────────
// ANIMATIONS
// ────────────────────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const successPulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
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

const ImportCard = styled(Card)(({ theme }) => ({
  borderRadius: 14,
  background: theme.palette.mode === 'dark'
    ? alpha('#ffffff', 0.03)
    : alpha('#ffffff', 0.7),
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'visible',
  position: 'relative',

  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? `0 12px 48px ${alpha('#8b5cf6', 0.15)}`
      : `0 12px 48px ${alpha('#8b5cf6', 0.1)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },

  animation: `${slideUp} 0.4s ease-out`,
}));

const DropZone = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDragActive' && prop !== 'hasFile',
})<{ isDragActive?: boolean; hasFile?: boolean }>(({ theme, isDragActive, hasFile }) => ({
  border: `2px dashed ${
    isDragActive
      ? theme.palette.primary.main
      : hasFile
      ? alpha(theme.palette.success.main, 0.4)
      : alpha(theme.palette.divider, 0.3)
  }`,
  borderRadius: 12,
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: hasFile ? 'default' : 'pointer',
  transition: 'all 0.3s ease',
  background: isDragActive
    ? alpha(theme.palette.primary.main, 0.05)
    : hasFile
    ? alpha(theme.palette.success.main, 0.03)
    : alpha(theme.palette.background.paper, 0.3),

  '&:hover': !hasFile ? {
    borderColor: theme.palette.primary.main,
    background: alpha(theme.palette.primary.main, 0.03),
  } : {},
}));

const FilePreview = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: 12,
  background: alpha(theme.palette.background.paper, 0.4),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

// ────────────────────────────────────────────────────────────
// IMPORT CARD COMPONENT
// ────────────────────────────────────────────────────────────

interface ImportCardItemProps {
  importFile: ImportFile;
  onFileSelect: (importId: string, file: File) => void;
  onRemoveFile: (importId: string) => void;
  isProcessing: boolean;
  index: number;
  isLocked: boolean;
  isNextInLine: boolean;
}

const ImportCardItem: React.FC<ImportCardItemProps> = ({
  importFile,
  onFileSelect,
  onRemoveFile,
  isProcessing,
  index,
  isLocked,
  isNextInLine,
}) => {
  const theme = useTheme();
  const [isDragActive, setIsDragActive] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext && importFile.fileTypes.includes(ext)) {
          onFileSelect(importFile.id, file);
        }
      }
    },
    [importFile.id, importFile.fileTypes, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext && importFile.fileTypes.includes(ext)) {
          onFileSelect(importFile.id, file);
        }
      }
    },
    [importFile.id, importFile.fileTypes, onFileSelect]
  );

  const getStatusConfig = () => {
    switch (importFile.status) {
      case ImportStatus.Validating:
        return {
          icon: <RefreshIcon sx={{ fontSize: 20, animation: `${pulse} 1.5s ease-in-out infinite` }} />,
          color: 'info' as const,
          label: 'Validating',
        };
      case ImportStatus.Processing:
        return {
          icon: <RefreshIcon sx={{ fontSize: 20, animation: `${pulse} 1.5s ease-in-out infinite` }} />,
          color: 'primary' as const,
          label: 'Processing',
        };
      case ImportStatus.Complete:
        return {
          icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
          color: 'success' as const,
          label: 'Complete',
        };
      case ImportStatus.Failed:
        return {
          icon: <ErrorIcon sx={{ fontSize: 20 }} />,
          color: 'error' as const,
          label: 'Failed',
        };
      default:
        return null;
    }
  };

  const statusConfig = getStatusConfig();
  const isDisabled = isProcessing || importFile.status === ImportStatus.Processing || isLocked;
  const isFileChangeAllowed = !isLocked && importFile.status !== ImportStatus.Complete && importFile.status !== ImportStatus.Processing;

  return (
    <Grow in timeout={(index + 1) * 150}>
      <ImportCard
        sx={{
          opacity: isLocked ? 0.6 : 1,
          position: 'relative',
          '&:hover': isLocked ? {
            transform: 'none !important',
            boxShadow: 'inherit !important',
            border: 'inherit !important',
          } : {},
          '&::before': isLocked ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: alpha(theme.palette.background.default, 0.6),
            borderRadius: 'inherit',
            zIndex: 10,
            cursor: 'not-allowed',
          } : {},
        }}
      >
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
            <Box flex={1}>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                {importFile.icon && (
                  <Typography component="span" fontSize="1.5rem">
                    {importFile.icon}
                  </Typography>
                )}
                <Typography variant="h6" fontWeight={700} fontSize="1rem">
                  {importFile.displayName}
                </Typography>
                {importFile.required && (
                  <Chip
                    label="Required"
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 1,
                    }}
                  />
                )}
                {isLocked && (
                  <Chip
                    label="Locked"
                    size="small"
                    color="default"
                    variant="filled"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 1,
                      background: alpha(theme.palette.text.secondary, 0.2),
                    }}
                  />
                )}
                {isNextInLine && !isLocked && (
                  <Chip
                    label="Next"
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: 1,
                      animation: `${pulse} 2s ease-in-out infinite`,
                    }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                {importFile.description}
              </Typography>
            </Box>
            {statusConfig && (
              <Chip
                icon={statusConfig.icon}
                label={statusConfig.label}
                color={statusConfig.color}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  animation: importFile.status === ImportStatus.Complete ? `${successPulse} 0.6s ease-out` : 'none'
                }}
              />
            )}
          </Stack>

          {/* File Upload Zone or File Preview */}
          {!importFile.file ? (
            <DropZone
              isDragActive={isDragActive && !isLocked}
              hasFile={false}
              onDrop={isLocked ? undefined : handleDrop}
              onDragOver={isLocked ? undefined : handleDragOver}
              onDragLeave={isLocked ? undefined : handleDragLeave}
              onClick={isLocked ? undefined : () => !isDisabled && fileInputRef.current?.click()}
              sx={{
                cursor: isLocked ? 'not-allowed !important' : undefined,
                pointerEvents: isLocked ? 'none' : 'auto',
              }}
            >
              <InputIcon
                sx={{
                  fontSize: 36,
                  color: isDragActive ? 'primary.main' : 'text.secondary',
                  mb: 1,
                  opacity: isDragActive ? 1 : 0.6,
                  transition: 'all 0.3s ease',
                }}
              />
              <Typography variant="body2" fontWeight={600} mb={0.5} fontSize="0.9rem">
                {isDragActive ? 'Drop file here' : 'Drop file or click to browse'}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                Accepts: {importFile.fileTypes.map((ft) => `.${ft.toUpperCase()}`).join(', ')}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept={importFile.fileTypes.map((ft) => `.${ft}`).join(',')}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isDisabled}
              />
            </DropZone>
          ) : (
            <FilePreview>
              <FileIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.8 }} />
              <Box flex={1} minWidth={0}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {importFile.fileName}
                </Typography>
                {importFile.rowCount !== undefined && (
                  <Typography variant="caption" color="text.secondary">
                    {importFile.rowCount.toLocaleString()} rows detected
                  </Typography>
                )}
              </Box>
              {isFileChangeAllowed && (
                <IconButton
                  size="small"
                  onClick={() => onRemoveFile(importFile.id)}
                  sx={{
                    background: alpha(theme.palette.error.main, 0.1),
                    '&:hover': {
                      background: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </FilePreview>
          )}

          {/* Validation Progress */}
          {importFile.status === ImportStatus.Validating && (
            <Box mt={2}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <RefreshIcon sx={{ fontSize: 16, animation: `${pulse} 1.5s ease-in-out infinite` }} />
                <Typography variant="caption" color="primary" fontWeight={600}>
                  Validating file structure...
                </Typography>
              </Stack>
              <LinearProgress
                sx={{
                  height: 4,
                  borderRadius: 2,
                  background: alpha(theme.palette.primary.main, 0.1),
                }}
              />
            </Box>
          )}

          {/* Error Message */}
          {importFile.error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                borderRadius: 2,
                fontSize: '0.875rem',
              }}
            >
              {importFile.error}
            </Alert>
          )}

          {/* Expandable Details */}
          {(importFile.requiredColumns || importFile.optionalColumns || importFile.validationRules) && (
            <>
              <Button
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                }
                sx={{
                  mt: 1.5,
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  color: 'text.secondary',
                }}
              >
                {showDetails ? 'Hide' : 'Show'} Requirements
              </Button>
              <Collapse in={showDetails}>
                <Box
                  mt={1}
                  p={2}
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.3),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  {importFile.requiredColumns && (
                    <>
                      <Typography variant="caption" fontWeight={600} component="div" mb={1}>
                        Required Columns:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5} mb={1}>
                        {importFile.requiredColumns.map((col) => (
                          <Chip key={col} label={col} size="small" color="primary" variant="outlined" sx={{ height: 22 }} />
                        ))}
                      </Stack>
                    </>
                  )}
                  {importFile.optionalColumns && (
                    <>
                      <Typography variant="caption" fontWeight={600} component="div" mb={1} mt={1}>
                        Optional Columns:
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={0.5}>
                        {importFile.optionalColumns.map((col) => (
                          <Chip key={col} label={col} size="small" variant="outlined" sx={{ height: 22 }} />
                        ))}
                      </Stack>
                    </>
                  )}
                  {importFile.validationRules && (
                    <>
                      <Typography variant="caption" fontWeight={600} component="div" mb={1} mt={2}>
                        Validation Rules:
                      </Typography>
                      {importFile.validationRules.map((rule, i) => (
                        <Typography key={i} variant="caption" color="text.secondary" component="div">
                          • {rule}
                        </Typography>
                      ))}
                    </>
                  )}
                </Box>
              </Collapse>
            </>
          )}
        </CardContent>
      </ImportCard>
    </Grow>
  );
};

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

const DataImport: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [pageConfig, setPageConfig] = useState<DataImportPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'idle' | 'importing' | 'compiling' | 'complete'>('idle');
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [currentImportIndex, setCurrentImportIndex] = useState(-1);
  const [importSessionStarted, setImportSessionStarted] = useState(false);

  // Fetch page config on mount
  useEffect(() => {
    const fetchPageConfig = async () => {
      try {
        setLoading(true);

        // Check if running in Electron
        // @ts-ignore - window.electron is defined in preload
        if (window.electron?.invoke) {
          // @ts-ignore
          const config: DataImportPageConfig = await window.electron.invoke('dataImport:getPageConfig');
          setPageConfig(config);

          // Convert config cards to import files
          const files: ImportFile[] = config.importCards.map((card) => ({
            ...card,
            status: ImportStatus.Pending,
          }));
          setImportFiles(files);
        } else {
          // Fallback: Load demo config for development
          const demoConfig: DataImportPageConfig = {
            header: {
              title: 'Import Data',
              subtitle: 'Upload and process your hotel data files',
              icon: '',
              gradient: {
                from: '#667eea',
                to: '#764ba2',
              },
            },
            importCards: [
              {
                id: 'guest_roster',
                displayName: 'Guest Roster',
                description: 'Primary guest information and booking details',
                icon: '',
                category: 'Customer Management',
                fileTypes: ['xlsx', 'xls', 'csv'],
                required: true,
                order: 1,
                requiredColumns: ['guest_name', 'check_in', 'check_out', 'room_number'],
                optionalColumns: ['email', 'phone', 'special_requests'],
                validationRules: ['Check-in date must be before check-out date', 'Room number must be valid'],
              },
              {
                id: 'room_inventory',
                displayName: 'Room Inventory',
                description: 'Available rooms and their configurations',
                icon: '',
                category: 'Operations',
                fileTypes: ['xlsx', 'xls', 'csv'],
                required: true,
                order: 2,
                requiredColumns: ['room_number', 'room_type', 'capacity'],
                optionalColumns: ['amenities', 'floor', 'view'],
              },
              {
                id: 'rate_plans',
                displayName: 'Rate Plans',
                description: 'Pricing structures and seasonal rates',
                icon: '',
                category: 'Financial',
                fileTypes: ['xlsx', 'xls', 'csv'],
                required: false,
                order: 3,
                requiredColumns: ['plan_name', 'rate', 'effective_date'],
                optionalColumns: ['season', 'discount'],
              },
            ],
            actions: [
              {
                id: 'restart',
                label: 'Restart Import',
                icon: 'refresh',
                variant: 'secondary',
                action: 'restart',
                disabled: {
                  condition: 'processing',
                },
              },
              {
                id: 'start',
                label: 'Complete Import',
                icon: 'check_circle',
                variant: 'primary',
                action: 'startImport',
                disabled: {
                  condition: 'requiredMissing',
                },
                gradient: {
                  from: '#667eea',
                  to: '#764ba2',
                },
              },
            ],
            infoSection: {
              severity: 'info',
              title: 'Sequential Import Process',
              items: [
                'Files are validated automatically upon selection',
                'Required files must be uploaded before starting import',
                'Imports must be completed sequentially - each import is locked until the previous one completes',
                'Each import includes pre-processing, import, and post-processing steps',
                'Data from all imports is blended together into a unified dataset',
              ],
            },
            importMode: 'sequential',
            enableCompilation: true,
            compilationMessage: 'Blending data from all imports...',
          };

          setPageConfig(demoConfig);
          const files: ImportFile[] = demoConfig.importCards.map((card) => ({
            ...card,
            status: ImportStatus.Pending,
          }));
          setImportFiles(files);
        }
      } catch (error) {
        console.error('Failed to load page config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageConfig();
  }, []);

  const handleFileSelect = useCallback((importId: string, file: File) => {
    if (importSessionStarted) return;

    setImportFiles((prev) =>
      prev.map((imp) =>
        imp.id === importId
          ? {
              ...imp,
              file,
              fileName: file.name,
              status: ImportStatus.Validating,
            }
          : imp
      )
    );

    // Simulate validation
    setTimeout(() => {
      setImportFiles((prev) =>
        prev.map((imp) =>
          imp.id === importId
            ? {
                ...imp,
                status: ImportStatus.Pending,
                rowCount: Math.floor(Math.random() * 1000) + 100,
              }
            : imp
        )
      );
    }, 1500);
  }, [importSessionStarted]);

  const handleRemoveFile = useCallback((importId: string) => {
    if (importSessionStarted) return;

    setImportFiles((prev) =>
      prev.map((imp) =>
        imp.id === importId
          ? {
              ...imp,
              file: undefined,
              fileName: undefined,
              status: ImportStatus.Pending,
              rowCount: undefined,
              error: undefined,
            }
          : imp
      )
    );
  }, [importSessionStarted]);

  const handleRestart = useCallback(() => {
    setImportFiles((prev) =>
      prev.map((imp) => ({
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
    setCurrentImportIndex(-1);
    setCompilationProgress(0);
  }, []);

  const handleStartImport = async () => {
    if (!pageConfig) return;

    setImportSessionStarted(true);
    setSessionStatus('importing');
    setIsProcessing(true);

    const filesToImport = importFiles.filter((f) => f.file).sort((a, b) => a.order - b.order);

    for (let i = 0; i < filesToImport.length; i++) {
      const importFile = filesToImport[i];
      setCurrentImportIndex(i);

      setImportFiles((prev) =>
        prev.map((imp) =>
          imp.id === importFile.id
            ? { ...imp, status: ImportStatus.Processing, error: undefined }
            : imp
        )
      );

      try {
        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setImportFiles((prev) =>
          prev.map((imp) =>
            imp.id === importFile.id ? { ...imp, status: ImportStatus.Complete } : imp
          )
        );
      } catch (error) {
        setImportFiles((prev) =>
          prev.map((imp) =>
            imp.id === importFile.id
              ? { ...imp, status: ImportStatus.Failed, error: 'Import failed' }
              : imp
          )
        );
        setIsProcessing(false);
        setSessionStatus('idle');
        return;
      }
    }

    // Compilation phase if enabled
    if (pageConfig.enableCompilation) {
      setCurrentImportIndex(-1);
      setSessionStatus('compiling');
      setCompilationProgress(0);

      const interval = setInterval(() => {
        setCompilationProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        setCompilationProgress(100);
        setSessionStatus('complete');
        setIsProcessing(false);
      }, 3500);
    } else {
      setSessionStatus('complete');
      setIsProcessing(false);
    }
  };

  const canStartImport =
    importFiles.filter((f) => f.required).every((f) => f.file) &&
    !importSessionStarted;

  const stats = {
    completed: importFiles.filter((f) => f.status === ImportStatus.Complete).length,
    total: importFiles.length,
    uploaded: importFiles.filter((f) => f.file).length,
  };

  const getStatusMessage = () => {
    if (sessionStatus === 'importing' && currentImportIndex >= 0) {
      const currentFile = importFiles.filter((f) => f.file).sort((a, b) => a.order - b.order)[currentImportIndex];
      return `Processing: ${currentFile?.displayName || ''} (${currentImportIndex + 1}/${stats.uploaded})`;
    }
    if (sessionStatus === 'compiling') {
      return `${pageConfig?.compilationMessage || 'Compiling data...'} ${compilationProgress}%`;
    }
    if (sessionStatus === 'complete') {
      return 'Import complete! All data has been successfully processed.';
    }
    return '';
  };

  if (loading || !pageConfig) {
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
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {pageConfig.header.icon && (
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${pageConfig.header.gradient.from}, ${pageConfig.header.gradient.to})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 6px 18px ${alpha(pageConfig.header.gradient.from, 0.3)}`,
                    }}
                  >
                    <Typography fontSize="1.25rem">{pageConfig.header.icon}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      background: `linear-gradient(135deg, ${pageConfig.header.gradient.from}, ${pageConfig.header.gradient.to})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '1.25rem', sm: '1.5rem' },
                    }}
                  >
                    {pageConfig.header.title}
                  </Typography>
                  {pageConfig.header.subtitle && (
                    <Typography variant="body2" color="text.secondary" fontWeight={500} fontSize="0.8rem">
                      {pageConfig.header.subtitle}
                    </Typography>
                  )}
                </Box>
              </Stack>
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
            {getStatusMessage()}
          </Alert>
        </Fade>
      )}

      {sessionStatus === 'compiling' && (
        <Box mb={3}>
          <LinearProgress
            variant="determinate"
            value={compilationProgress}
            sx={{
              height: 8,
              borderRadius: 4,
              background: alpha(theme.palette.primary.main, 0.1),
            }}
          />
        </Box>
      )}

      {/* Import Cards */}
      <Stack spacing={1.5} mb={3}>
        {importFiles.map((importFile, index) => {
          let isLocked = false;
          let isNextInLine = false;

          if (pageConfig.importMode === 'sequential') {
            const sortedImports = [...importFiles].sort((a, b) => a.order - b.order);
            const activeImport = sortedImports.find((f) => f.status !== ImportStatus.Complete);

            if (importFile.status === ImportStatus.Complete) {
              isLocked = true;
            } else if (activeImport && importFile.id === activeImport.id) {
              isLocked = false;
              isNextInLine = true;
            } else {
              isLocked = true;
            }
          }

          return (
            <ImportCardItem
              key={importFile.id}
              importFile={importFile}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              isProcessing={isProcessing}
              index={index}
              isLocked={isLocked}
              isNextInLine={isNextInLine}
            />
          );
        })}
      </Stack>

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
        {pageConfig.actions.map((action) => {
          let disabled = false;
          if (action.disabled) {
            switch (action.disabled.condition) {
              case 'processing':
                disabled = isProcessing;
                break;
              case 'requiredMissing':
                disabled = !canStartImport;
                break;
              case 'sessionStarted':
                disabled = !importSessionStarted;
                break;
            }
          }

          const handleClick = () => {
            switch (action.action) {
              case 'startImport':
                handleStartImport();
                break;
              case 'restart':
                handleRestart();
                break;
            }
          };

          const baseStyles = {
            borderRadius: 2,
            textTransform: 'none' as const,
            fontWeight: 600,
            fontSize: '0.9rem',
          };

          // Get icon component based on icon name
          const getIconComponent = (iconName?: string) => {
            if (!iconName) return undefined;
            switch (iconName) {
              case 'refresh':
                return <RefreshIcon />;
              case 'upload':
                return <UploadIcon />;
              case 'check_circle':
                return <TaskAltIcon />;
              default:
                return undefined;
            }
          };

          if (action.variant === 'primary') {
            return (
              <Button
                key={action.id}
                variant="contained"
                startIcon={getIconComponent(action.icon)}
                onClick={handleClick}
                disabled={disabled || isProcessing}
                fullWidth={isMobile}
                sx={{
                  ...baseStyles,
                  background: action.gradient
                    ? `linear-gradient(135deg, ${action.gradient.from}, ${action.gradient.to})`
                    : undefined,
                  '&:hover': action.gradient
                    ? {
                        background: `linear-gradient(135deg, ${action.gradient.to}, ${action.gradient.from})`,
                      }
                    : undefined,
                }}
              >
                {importSessionStarted && action.action === 'startImport' ? 'Import in Progress...' : action.label}
              </Button>
            );
          } else {
            return (
              <Button
                key={action.id}
                variant="outlined"
                startIcon={getIconComponent(action.icon)}
                onClick={handleClick}
                disabled={disabled}
                fullWidth={isMobile}
                sx={baseStyles}
              >
                {action.label}
              </Button>
            );
          }
        })}
      </Stack>

      {/* Info Section */}
      <Box mt={3}>
        <Alert
          severity={pageConfig.infoSection.severity}
          icon={<InfoIcon />}
          sx={{
            borderRadius: 3,
            background: alpha(theme.palette.info.main, 0.05),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <Typography variant="body2" fontWeight={600} mb={1}>
            {pageConfig.infoSection.title}
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {pageConfig.infoSection.items.map((item, idx) => (
              <React.Fragment key={idx}>
                • {item}
                {idx < pageConfig.infoSection.items.length - 1 && <br />}
              </React.Fragment>
            ))}
          </Typography>
        </Alert>
      </Box>
    </PageContainer>
  );
};

export default DataImport;
