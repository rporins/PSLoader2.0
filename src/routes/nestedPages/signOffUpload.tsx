import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Alert,
  TextField,
  Paper,
  LinearProgress,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";
import { useSettingsStore } from "../../store/settings";
import submittedDataService, { SubmittedDataEntry } from "../../services/submittedDataService";
import authService from "../../services/auth";

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  boxShadow: theme.shadows[3],
}));

interface ValidationStatus {
  name: string;
  status: "pass" | "fail" | "warning";
  message?: string;
}

export default function SignOffUpload() {
  const [validations, setValidations] = useState<ValidationStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [signature, setSignature] = useState<string>("");
  const [signedOff, setSignedOff] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [unmappedCount, setUnmappedCount] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const selectedHotelOu = useSettingsStore((s) => s.selectedHotelOu);

  // Fetch validation status and check for unmapped records
  useEffect(() => {
    const fetchValidations = async () => {
      setLoading(true);
      try {
        if (window.ipcApi) {
          // Fetch validation summary
          const response = await window.ipcApi.sendIpcRequest("db:get-validation-summary");

          if (response.success && response.data) {
            const data = JSON.parse(response.data);
            setValidations(data);
          }

          // Check for unmapped records in staging data
          const stagingResponse = await window.ipcApi.sendIpcRequest("db:get-staging-data", {
            ou: selectedHotelOu,
          });

          if (stagingResponse.success && stagingResponse.data) {
            const stagingData = JSON.parse(stagingResponse.data as string);
            setTotalRecords(stagingData.length);

            // Count records with null/undefined department or account
            const unmapped = stagingData.filter((row: any) =>
              !row.department || !row.account ||
              row.department === null || row.account === null
            ).length;

            setUnmappedCount(unmapped);
          }
        }
      } catch (error) {
        console.error("Error fetching validations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchValidations();
  }, [selectedHotelOu]);

  const allValidationsPassed = validations.every(v => v.status === "pass");
  const hasWarnings = validations.some(v => v.status === "warning");

  const handleSignOff = () => {
    if (signature.trim().length > 0) {
      setSignedOff(true);
    }
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadError("");

    try {
      // Use the signature name that the user entered
      const signedBy = signature;

      // Fetch staging data from local database
      const response = await window.ipcApi.sendIpcRequest("db:get-staging-data", {
        ou: selectedHotelOu,
      });

      if (!response.success || !response.data) {
        throw new Error("Failed to fetch staging data");
      }

      const stagingData = JSON.parse(response.data as string);

      // Filter out unmapped records (those with null/undefined department or account)
      const mappedData = stagingData.filter((row: any) =>
        row.department && row.account &&
        row.department !== null && row.account !== null
      );

      // Transform staging data to match API format
      const submittedData: SubmittedDataEntry[] = mappedData.map((row: any) => ({
        ou: row.ou.padEnd(7, ' '), // Pad OU to minimum 7 characters
        period: row.period_combo, // Use period_combo (format: "YYYY-MM")
        department: row.department,
        account: row.account,
        amount: Math.round(row.amount), // Convert to integer (round to nearest whole number)
        scenario: row.scenario,
        version: row.version,
        currency: row.currency,
        load_id: row.import_batch_id || "manual", // Use import_batch_id if available
      }));

      if (submittedData.length === 0) {
        throw new Error("No data to upload. Please import data first.");
      }

      // Upload data via API
      const uploadedData = await submittedDataService.uploadBulk(submittedData, signedBy);

      const skippedCount = stagingData.length - mappedData.length;
      console.log(`Successfully uploaded ${uploadedData.length} records${skippedCount > 0 ? ` (skipped ${skippedCount} unmapped records)` : ''}`);
      setUploadComplete(true);

    } catch (error) {
      console.error("Error uploading data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Sign-Off & Upload
      </Typography>

      {/* Unmapped Records Warning */}
      {unmappedCount > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {unmappedCount} of {totalRecords} records have unmapped accounts/departments
          </Typography>
          <Typography variant="body2">
            These records will be automatically skipped during upload. Only {totalRecords - unmappedCount} mapped records will be uploaded.
            Please review the Data Import page to map missing accounts and departments.
          </Typography>
        </Alert>
      )}

      {/* Validation Status Card */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validation Status
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <LinearProgress />
          ) : (
            <>
              {validations.length === 0 ? (
                <Alert severity="info">
                  No validation data available. Please import data and run validations first.
                </Alert>
              ) : (
                <Stack spacing={1}>
                  {validations.map((validation, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: 'background.default'
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        {validation.status === "pass" ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color={validation.status === "fail" ? "error" : "warning"} />
                        )}
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {validation.name}
                          </Typography>
                          {validation.message && (
                            <Typography variant="body2" color="text.secondary">
                              {validation.message}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                      <Chip
                        label={validation.status.toUpperCase()}
                        color={
                          validation.status === "pass"
                            ? "success"
                            : validation.status === "fail"
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    </Paper>
                  ))}
                </Stack>
              )}

              {!allValidationsPassed && validations.length > 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Some validations have not passed. Please review your data before proceeding.
                </Alert>
              )}

              {allValidationsPassed && hasWarnings && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  All critical validations passed, but there are warnings to review.
                </Alert>
              )}

              {allValidationsPassed && !hasWarnings && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  All validations passed successfully!
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </StyledCard>

      {/* Sign-Off Card */}
      <StyledCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Digital Sign-Off
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            By signing off, you confirm that you have reviewed your P&L for accuracy and that all data
            is correct and ready for upload.
          </Alert>

          {!signedOff ? (
            <Stack spacing={2}>
              <TextField
                label="Enter Your Name to Sign"
                variant="outlined"
                fullWidth
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full name"
                disabled={!allValidationsPassed}
                InputProps={{
                  startAdornment: <EditIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSignOff}
                disabled={!allValidationsPassed || signature.trim().length === 0}
                fullWidth
              >
                Sign Off
              </Button>
            </Stack>
          ) : (
            <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CheckCircleIcon />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Signed by: {signature}
                  </Typography>
                  <Typography variant="body2">
                    {new Date().toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </CardContent>
      </StyledCard>

      {/* Upload Card */}
      {signedOff && (
        <StyledCard>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Data
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {uploadComplete ? (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Data uploaded successfully!
              </Alert>
            ) : (
              <>
                {uploadError && (
                  <Alert severity="error" sx={{ mb: 2 }} icon={<ErrorIcon />}>
                    {uploadError}
                  </Alert>
                )}
                <Typography variant="body1" paragraph>
                  Ready to upload your data. Click the button below to proceed.
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUpload}
                  disabled={uploading}
                  fullWidth
                  startIcon={<UploadIcon />}
                  size="large"
                >
                  {uploading ? "Uploading..." : "Upload Data"}
                </Button>
                {uploading && <LinearProgress sx={{ mt: 2 }} />}
              </>
            )}
          </CardContent>
        </StyledCard>
      )}
    </Box>
  );
}
